import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/NewCartContext";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { canAccessAdminPanel } from "../utils/roles";
import { productsApi, productUtils } from "../utils/productsApi";
import { categoriesApi } from "../utils/categoriesApi";
import { promotionsApi } from "../utils/promotionsApi";
import { useCategories } from "../hooks/useCategories";
import VariantSizeSelector from "../components/VariantSizeSelector";

// Definir el tipo para los productos
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  brand: string;
  color: string;
  size: string;
  inStock: boolean;
  promotions?: Promotion[];
}

// Definir el tipo para las promociones
interface Promotion {
  id_promocion: number;
  nombre: string;
  tipo: 'porcentaje' | 'x_por_y' | 'codigo';
  activo: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  porcentaje_descuento?: number;
  cantidad_comprada?: number;
  cantidad_pagada?: number;
  aplica_a: 'todos' | 'categoria' | 'producto';
  prioridad: number;
}

const Catalogo: NextPage = () => {
  const router = useRouter();
  const { categoria } = router.query;
  
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  const [selectedCategory, setSelectedCategory] = useState(categoria as string || "Todos");
  
  // Estados para productos de la API
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para promociones
  const [promotions, setPromotions] = useState<Record<number, Promotion[]>>({});
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  
  // Estados para el selector de variantes/tallas
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  
  // Usar el hook de traducción universal y autenticación
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const { user, isAuthenticated, logout } = useAuth();
  
  // Usar el carrito integrado con la base de datos
  const { items: cartItems, totalItems, totalFinal, removeFromCart, updateQuantity, clearCart, isLoading, addToCart } = useCart();
  
  // Usar configuraciones del sitio desde la base de datos
  const { headerSettings, loading: settingsLoading } = useSiteSettings();
  
  // Usar categorías dinámicas desde la API
  const { activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  
  // Usar tasas de cambio dinámicas desde Open Exchange Rates
  const { formatPrice: exchangeFormatPrice, getExchangeRate } = useExchangeRates();

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        
        // Cargar todos los productos y filtrar por categoría localmente
        const result = await productsApi.getAll();
        let productsData = Array.isArray(result) ? result : [];
        
        // Si tenemos una categoría específica, filtrar los productos
        if (selectedCategory && selectedCategory !== "Todos") {
          productsData = productsData.filter((product: any) => 
            product.category && product.category.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
        
        setProducts(productsData as Product[]);
        setFilteredProducts(productsData as Product[]);
      } catch (err) {
        console.error('Error cargando productos:', err);
        setError('Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedCategory]);

  // Filtrar productos por búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Actualizar categoría seleccionada cuando cambie la URL
  useEffect(() => {
    if (categoria) {
      setSelectedCategory(categoria as string);
    }
  }, [categoria]);

  // Cargar promociones para los productos visibles
  useEffect(() => {
    const loadPromotions = async () => {
      if (filteredProducts.length === 0) return;
      
      try {
        setLoadingPromotions(true);
        const promotionsData: Record<number, Promotion[]> = {};
        
        for (const product of filteredProducts) {
          try {
            const productPromotions = await promotionsApi.getPromotionsForProduct(product.id);
            if (productPromotions && Array.isArray(productPromotions)) {
              promotionsData[product.id] = productPromotions;
            }
          } catch (err) {
            console.error(`Error cargando promociones para producto ${product.id}:`, err);
          }
        }
        
        setPromotions(promotionsData);
      } catch (err) {
        console.error('Error cargando promociones:', err);
      } finally {
        setLoadingPromotions(false);
      }
    };

    loadPromotions();
  }, [filteredProducts]);

  // Función para convertir precios según la moneda seleccionada
  const convertPrice = (price: number) => {
    const rate = getExchangeRate('MXN', currentCurrency);
    return (price * rate).toFixed(2);
  };

  // Función para formatear el precio con símbolo de moneda
  const formatPrice = (price: number) => {
    return exchangeFormatPrice(price, currentCurrency, 'MXN');
  };

  // Función para manejar el click en un producto
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowVariantSelector(true);
  };

  // Función para agregar al carrito
  const handleAddToCart = async (productId: number, variantId: number, tallaId: number, quantity: number) => {
    await addToCart(productId, variantId, tallaId, quantity);
  };

  return (
    <div className="w-full relative min-h-screen flex flex-col text-left text-Static-Body-Large-Size text-M3-white font-salsa"
         style={{
           background: 'linear-gradient(180deg, #000 0%, #1a6b1a 25%, #0d3d0d 35%, #000 75%, #000 100%)'
         }}>
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}
      
      <div className="self-stretch flex flex-col items-start justify-start text-Schemes-On-Surface font-Static-Body-Large-Font flex-shrink-0">
        <div className="self-stretch flex flex-col items-start justify-start text-center text-white font-salsa">
          <div className="self-stretch [background:linear-gradient(90deg,_#1a6b1a,_#0e360e)] h-10 flex flex-row items-center justify-between !p-[5px] box-border">
            <div className="w-[278px] relative tracking-[4px] leading-6 flex items-center justify-center h-[27px] shrink-0 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)]">
              <span className="text-white">{t('TREBOLUXE')}</span>
            </div>
            
            {/* Selector de idioma */}
            <div className="flex items-center gap-2">
              <select 
                value={currentLanguage} 
                onChange={(e) => setCurrentLanguage(e.target.value)}
                className="bg-transparent text-white text-xs border border-white/30 rounded px-2 py-1"
              >
                <option value="es" className="bg-black">ES</option>
                <option value="en" className="bg-black">EN</option>
                <option value="fr" className="bg-black">FR</option>
                <option value="de" className="bg-black">DE</option>
                <option value="it" className="bg-black">IT</option>
                <option value="pt" className="bg-black">PT</option>
              </select>
              
              {/* Selector de moneda */}
              <select 
                value={currentCurrency} 
                onChange={(e) => setCurrentCurrency(e.target.value)}
                className="bg-transparent text-white text-xs border border-white/30 rounded px-2 py-1"
              >
                <option value="MXN" className="bg-black">MXN</option>
                <option value="USD" className="bg-black">USD</option>
                <option value="EUR" className="bg-black">EUR</option>
                <option value="GBP" className="bg-black">GBP</option>
              </select>
            </div>
          </div>

          {/* Header Navigation */}
          <div className="self-stretch bg-black h-[72px] flex flex-row items-center justify-between py-0 px-4 box-border text-left text-white">
            {/* Logo/Inicio */}
            <Link href="/" className="text-white hover:text-gray-300 transition-colors duration-200 no-underline">
              <div className="text-xl font-bold tracking-wider">TREBOLUXE</div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              {/* Categorías Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                  className="text-white hover:text-gray-300 transition-colors duration-200 flex items-center gap-1"
                >
                  {t('Categorías')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCategoriesDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg z-50">
                    <Link 
                      href="/catalogo"
                      className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-t-lg"
                      onClick={() => {
                        setSelectedCategory("Todos");
                        setShowCategoriesDropdown(false);
                      }}
                    >
                      {t('Todos los productos')}
                    </Link>
                    {activeCategories.map((category) => (
                      <Link 
                        key={category.id}
                        href={`/catalogo?categoria=${encodeURIComponent(category.name)}`}
                        className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline"
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setShowCategoriesDropdown(false);
                        }}
                      >
                        {t(category.name)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Buscador */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('Buscar productos...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none w-64"
                />
              </div>

              {/* Carrito */}
              <Link href="/carrito" className="relative text-white hover:text-gray-300 transition-colors duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 2H1m6 11v6a2 2 0 002 2h6a2 2 0 002-2v-6m-10 0a2 2 0 002 2h6a2 2 0 002-2"/>
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Usuario/Login */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">{user?.nombres}</span>
                  <button
                    onClick={logout}
                    className="text-white hover:text-gray-300 transition-colors duration-200 text-sm"
                  >
                    {t('Salir')}
                  </button>
                  {user && canAccessAdminPanel(user.rol) && (
                    <Link href="/admin" className="text-green-400 hover:text-green-300 transition-colors duration-200 text-sm">
                      {t('Admin')}
                    </Link>
                  )}
                </div>
              ) : (
                <Link href="/login" className="text-white hover:text-gray-300 transition-colors duration-200">
                  {t('Iniciar Sesión')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal del catálogo */}
        <div className="flex-1 w-full px-6 py-8">
          {/* Título de la página */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              {selectedCategory === "Todos" ? t('Catálogo de Productos') : t(`Catálogo - ${selectedCategory}`)}
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-green-500 to-green-300 rounded"></div>
          </div>

          {/* Filtros adicionales */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="text-white">
              <span className="mr-2">{t('Filtrar por categoría:')}</span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  if (e.target.value === "Todos") {
                    router.push('/catalogo');
                  } else {
                    router.push(`/catalogo?categoria=${encodeURIComponent(e.target.value)}`);
                  }
                }}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
              >
                <option value="Todos">{t('Todos los productos')}</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {t(category.name)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-white">
              <span>{t('Productos encontrados:')} <span className="font-bold text-green-400">{filteredProducts.length}</span></span>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-16">
              <div className="text-red-500 mb-4">{t(error)}</div>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded transition-colors duration-200"
              >
                {t('Intentar nuevamente')}
              </button>
            </div>
          )}

          {/* Grid de productos */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden hover:border-green-500/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleProductClick(product)}
                >
                  {/* Imagen del producto */}
                  <div className="relative h-48 bg-gray-800">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Badge de promoción */}
                    {promotions[product.id] && promotions[product.id].length > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                          {t('OFERTA')}
                        </span>
                      </div>
                    )}
                    
                    {/* Badge de stock */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        product.inStock 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {product.inStock ? t('Disponible') : t('Agotado')}
                      </span>
                    </div>
                  </div>

                  {/* Información del producto */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="text-gray-300 text-sm mb-2">
                      {t(product.category)} • {product.brand}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {product.originalPrice > product.price && (
                          <span className="text-gray-400 text-sm line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                        <span className="text-green-400 font-bold text-lg">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                        disabled={!product.inStock}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                          product.inStock
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {product.inStock ? t('Agregar') : t('Agotado')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mensaje cuando no hay productos */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4 text-xl">
                {searchTerm 
                  ? t('No se encontraron productos que coincidan con tu búsqueda')
                  : t('No hay productos disponibles en esta categoría')
                }
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded transition-colors duration-200"
                >
                  {t('Limpiar búsqueda')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selector de variantes/tallas */}
      {showVariantSelector && selectedProduct && (
        <VariantSizeSelector
          isOpen={showVariantSelector}
          product={selectedProduct as any}
          onClose={() => {
            setShowVariantSelector(false);
            setSelectedProduct(null);
          }}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default Catalogo;
