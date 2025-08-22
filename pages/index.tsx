import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/NewCartContext";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { useIndexImages } from "../hooks/useIndexImages";
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

const HomeScreen: NextPage = () => {
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  const [selectedCategory, setSelectedCategory] = useState("Camisetas");
  
  // Estados para productos de la API
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentByCategory, setRecentByCategory] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para promociones
  const [promotions, setPromotions] = useState<Record<number, Promotion[]>>({});
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  
  // Estado para las categorías activas con contenido
  const [activeCategoriesWithContent, setActiveCategoriesWithContent] = useState<any[]>([]);
  
  // Estados para el selector de variantes/tallas
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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
  
  // Usar imágenes index desde la base de datos
  const { getImageByState, loading: imagesLoading } = useIndexImages();

  // Usar categorías dinámicas desde la API
  const { activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  
  // Usar tasas de cambio dinámicas desde Open Exchange Rates
  const { formatPrice, exchangeRates, loading: ratesLoading, error: ratesError, refreshRates } = useExchangeRates();
  
  // Carrusel de texto
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Usar textos promocionales desde la base de datos, con fallback
  const promoTexts = headerSettings?.promoTexts || [
    "Agrega 4 productos y paga 2",
    "2x1 en gorras"
  ];

  // Obtener imágenes específicas desde la base de datos
  const leftImage = getImageByState('principal', 'izquierda');
  const rightImage = getImageByState('principal', 'derecha');
  const bannerImage = getImageByState('banner', 'activo');

  // Función para cambiar idioma
  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  // Función para cambiar moneda
  const changeCurrency = (currency: string) => {
    setCurrentCurrency(currency);
    localStorage.setItem('preferred-currency', currency);
  };

  // Función para filtrar productos por categoría
  const getFilteredProducts = () => {
    return featuredProducts.filter(product => product.category === selectedCategory);
  };

  // Función para cargar categorías activas con contenido
  const loadActiveCategoriesWithContent = async () => {
    try {
      console.log('🔄 Cargando categorías dinámicas...');
      // Obtener todas las categorías activas directamente desde el endpoint público
      const response = await categoriesApi.getAll() as any;
      console.log('📊 Respuesta de categorías:', response);
      
      if (response.success && response.categories && response.categories.length > 0) {
        console.log('✅ Categorías cargadas exitosamente:', response.categories);
        setActiveCategoriesWithContent(response.categories);
        
        // Si hay categorías activas, establecer la primera como seleccionada
        setSelectedCategory(response.categories[0].nombre);
        console.log('🎯 Categoría seleccionada:', response.categories[0].nombre);
      } else {
        console.log('⚠️ No hay categorías de la API, usando fallback');
        // Fallback a categorías por defecto si no hay respuesta de la API
        const fallbackCategories = [
          { id_categoria: 1, nombre: 'Camisetas' },
          { id_categoria: 2, nombre: 'Polos' },
          { id_categoria: 3, nombre: 'Zapatos' },
          { id_categoria: 4, nombre: 'Gorras' },
          { id_categoria: 5, nombre: 'Accesorios' },
          { id_categoria: 6, nombre: 'Pantalones' }
        ];
        setActiveCategoriesWithContent(fallbackCategories);
        setSelectedCategory('Camisetas');
      }
    } catch (error) {
      console.error('❌ Error cargando categorías activas:', error);
      // Fallback en caso de error
      const fallbackCategories = [
        { id_categoria: 1, nombre: 'Camisetas' },
        { id_categoria: 2, nombre: 'Polos' },
        { id_categoria: 3, nombre: 'Zapatos' },
        { id_categoria: 4, nombre: 'Gorras' },
        { id_categoria: 5, nombre: 'Accesorios' },
        { id_categoria: 6, nombre: 'Pantalones' }
      ];
      setActiveCategoriesWithContent(fallbackCategories);
      setSelectedCategory('Camisetas');
    }
  };

  // Cargar productos recientes y por categoría desde la API
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading featured products...');
        // Usar getFeatured ahora que está corregido
        const recentResponse = await productsApi.getFeatured(12) as any;
        console.log('📡 Featured products API response:', recentResponse);
        
        if (recentResponse.success) {
          console.log('✅ Recent products raw:', recentResponse.products);
          const transformedProducts = recentResponse.products.map(productUtils.transformToLegacyFormat);
          console.log('🔄 Products after transformation:', transformedProducts);
          setFeaturedProducts(transformedProducts);
        }

        // Cargar productos recientes por categoría para la segunda sección
        const categoryResponse = await productsApi.getRecentByCategory(4) as any;
        if (categoryResponse.success) {
          const transformedByCategory: any = {};
          Object.keys(categoryResponse.productsByCategory).forEach(category => {
            transformedByCategory[category] = categoryResponse.productsByCategory[category]
              .map(productUtils.transformToLegacyFormat);
          });
          setRecentByCategory(transformedByCategory);
        }

        // Cargar categorías activas con contenido
        await loadActiveCategoriesWithContent();

      } catch (err: any) {
        console.error('Error cargando productos:', err);
        setError(err.message);
        
        // No mostrar productos fallback, solo productos de la base de datos
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Función para cargar promociones de un producto específico
  const loadPromotionsForProduct = async (productId: number) => {
    if (promotions[productId] || loadingPromotions) return;
    
    try {
      setLoadingPromotions(true);
      const promotionData = await promotionsApi.getPromotionsForProduct(productId) as any;
      
      if (promotionData.success && promotionData.promotions) {
        setPromotions(prev => ({
          ...prev,
          [productId]: promotionData.promotions
        }));
      }
    } catch (error) {
      console.error('Error cargando promociones para producto:', productId, error);
    } finally {
      setLoadingPromotions(false);
    }
  };

  // Cargar promociones para todos los productos featured al cargar
  useEffect(() => {
    if (featuredProducts.length > 0) {
      featuredProducts.forEach(product => {
        loadPromotionsForProduct(product.id);
      });
    }
  }, [featuredProducts]);

  // Cargar promociones para productos por categoría
  useEffect(() => {
    Object.values(recentByCategory).flat().forEach((product: any) => {
      loadPromotionsForProduct(product.id);
    });
  }, [recentByCategory]);

  // Función helper para renderizar las promociones
  const renderPromotions = (productId: number) => {
    const productPromotions = promotions[productId];
    if (!productPromotions || productPromotions.length === 0) return null;

    return (
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {productPromotions.map((promotion) => {
          if (promotion.tipo === 'porcentaje' && promotion.porcentaje_descuento) {
            return (
              <div
                key={promotion.id_promocion}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold"
              >
                {promotion.porcentaje_descuento}% OFF
              </div>
            );
          } else if (promotion.tipo === 'x_por_y' && promotion.cantidad_comprada && promotion.cantidad_pagada) {
            return (
              <div
                key={promotion.id_promocion}
                className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold"
              >
                {promotion.cantidad_comprada}x{promotion.cantidad_pagada}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // useEffect para debuggear categorías
  useEffect(() => {
    console.log('🎨 Estado de categorías actualizado:', activeCategoriesWithContent);
  }, [activeCategoriesWithContent]);

  // Cargar preferencias guardadas
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoriesDropdown(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setShowLoginDropdown(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target as Node)) {
        setShowCartDropdown(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setShowAdminDropdown(false);
      }
    };

    const handleScroll = () => {
      setShowCategoriesDropdown(false);
      setShowLanguageDropdown(false);
      setShowLoginDropdown(false);
      setShowSearchDropdown(false);
      setShowCartDropdown(false);
      setShowAdminDropdown(false);
    };

    // Agregar event listeners una sola vez
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Dependencias vacías para ejecutar solo una vez

  // Efecto para el carrusel de texto
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % promoTexts.length);
        setIsAnimating(false);
      }, 300); // Duración del fade-out
      
    }, 3000); // Cambia cada 3 segundos

    return () => clearInterval(interval);
  }, [promoTexts.length]);

  // Función para cambiar manualmente el texto
  const handleDotClick = (index: number) => {
    if (index !== currentTextIndex) {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTextIndex(index);
        setIsAnimating(false);
      }, 300);
    }
  };

  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (searchTerm.trim()) {
      window.location.href = `/catalogo?busqueda=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Función para manejar acciones que requieren autenticación
  const handleAuthRequiredAction = () => {
    if (!isAuthenticated) {
      // Mostrar el dropdown de login
      setShowLoginDropdown(true);
      return false;
    }
    return true;
  };

  // Función para agregar al carrito - abre el selector
  const handleAddToCart = async (product: Product) => {
    try {
      console.log('🛒 handleAddToCart called with product:', product);
      console.log('📦 Product ID:', product.id);
      
      // Buscar el producto completo con variantes desde la API
      const productDetail: any = await productsApi.getById(product.id);
      console.log('📡 API Response:', productDetail);
      
      if (productDetail && productDetail.success && productDetail.product) {
        const fullProduct = productDetail.product;
        console.log('✅ Full product data:', fullProduct);
        console.log('🎨 Product variants raw:', fullProduct.variantes);
        
        // Verificar si hay variantes válidas
        const validVariantes = fullProduct.variantes?.filter((v: any) => v && v.id_variante) || [];
        console.log('🔍 Valid variants after filter:', validVariantes);
        
        if (validVariantes.length > 0) {
          console.log('✅ Found valid variants, opening selector');
          // Asegurar que el producto tenga el array de variantes filtrado
          fullProduct.variantes = validVariantes;
          handleOpenVariantSelector(fullProduct);
        } else {
          console.log('❌ No valid variants found');
          console.log('🔍 Raw variantes field:', typeof fullProduct.variantes, fullProduct.variantes);
          alert(t('Este producto no tiene variantes disponibles'));
        }
      } else {
        console.log('❌ API response failed:', productDetail);
        console.log('🔍 Response structure check:');
        console.log('  - success:', productDetail?.success);
        console.log('  - has product:', !!productDetail?.product);
        alert(t('Producto no disponible'));
      }
    } catch (error) {
      console.error('❌ Error al cargar detalles del producto:', error);
      alert(t('Error al cargar el producto'));
    }
  };

  // Funciones para el selector de variantes y tallas
  const handleOpenVariantSelector = (product: any) => {
    setSelectedProduct(product);
    setShowVariantSelector(true);
  };

  const handleCloseVariantSelector = () => {
    setShowVariantSelector(false);
    setSelectedProduct(null);
  };

  const handleAddToCartFromSelector = async (productId: number, variantId: number, tallaId: number, quantity: number) => {
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
            
            {/* Contenido central - texto del carrusel */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-row items-center gap-2 text-white">
              <Image
                className="w-[12.2px] relative max-h-full object-contain"
                width={12.2}
                height={10.9}
                sizes="100vw"
                alt=""
                src="/petalo-1@2x.png"
              />
              <div className={`relative tracking-[4px] leading-6 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)] transition-all duration-300 ease-in-out whitespace-nowrap ${
                isAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
              }`}>
                {t(promoTexts[currentTextIndex])}
              </div>
            </div>

            <div className="flex-[-0.0187] [backdrop-filter:blur(40px)] rounded-[50px] flex flex-row items-center justify-end !pt-2 !pb-2 !pl-[402px] !pr-3 relative gap-2">
              <div className="w-full absolute !!m-[0 important] h-full top-[0px] right-[0px] bottom-[0px] left-[0px] rounded-[100px] overflow-hidden hidden z-[0]">
                <div className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] [backdrop-filter:blur(50px)] [background:linear-gradient(#0d0d0d,_#0d0d0d),_rgba(191,_191,_191,_0.44)]" />
              </div>
              <div className={`w-2 relative shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25),_0px_-1px_1.3px_#fff_inset] rounded-[50px] h-2 z-[1] transition-all duration-500 ease-in-out cursor-pointer ${
                currentTextIndex === 0 ? 'bg-white' : 'bg-white opacity-[0.3] hover:opacity-[0.6]'
              }`} 
              onClick={() => handleDotClick(0)} />
              <div className={`w-2 relative shadow-[0px_2px_4px_#000_inset] rounded-[50px] h-2 z-[2] transition-all duration-500 ease-in-out cursor-pointer ${
                currentTextIndex === 1 ? 'bg-white' : 'bg-white opacity-[0.3] hover:opacity-[0.6]'
              }`}
              onClick={() => handleDotClick(1)} />
            </div>
          </div>
          <div className="self-stretch flex flex-row items-center justify-between !pt-[15px] !pb-[15px] !pl-8 !pr-8 text-M3-white relative">
            <div className="flex flex-row items-center justify-start gap-[33px]">
              <div 
                className="w-[177.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer"
                ref={dropdownRef}
                onMouseEnter={() => setShowCategoriesDropdown(true)}
                onMouseLeave={() => setShowCategoriesDropdown(false)}
              >
                <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                  {t('CATEGORIAS')}
                </div>
                
                {/* Dropdown Menu - Starts below CATEGORIAS */}
                <div 
                  className={`fixed top-[82px] left-0 w-80 sm:w-72 md:w-80 lg:w-80 h-[calc(100vh-82px)] bg-black/30 shadow-2xl z-50 transform transition-all duration-300 ease-out ${
                    showCategoriesDropdown 
                      ? 'translate-x-0 opacity-100' 
                      : '-translate-x-full opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                    <div className="pt-6 pb-8 px-6 h-full flex flex-col overflow-y-auto">
                      <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">{t('CATEGORÍAS DE ROPA')}</h3>
                      <div className="space-y-1">
                        {/* Mostrar indicador de carga */}
                        {categoriesLoading && (
                          <div className="flex items-center justify-center py-4">
                            <div className="text-white text-sm">{t('Cargando categorías...')}</div>
                          </div>
                        )}

                        {/* Mostrar error si ocurre */}
                        {categoriesError && (
                          <div className="text-red-300 text-sm px-4 py-2">
                            {t('Error al cargar categorías')}
                          </div>
                        )}

                        {/* Opción "Todas las categorías" siempre visible */}
                        <Link 
                          href="/catalogo?categoria=todas" 
                          className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md border-b border-gray-600 mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{t('Todas las categorías')}</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>

                        {/* Renderizar categorías dinámicas */}
                        {!categoriesLoading && !categoriesError && activeCategories.map((category) => (
                          <Link 
                            key={category.id} 
                            href={`/catalogo?categoria=${category.slug}`} 
                            className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md"
                          >
                            <div className="flex items-center justify-between">
                              <span>{t(category.name)}</span>
                              <span className="text-gray-400">→</span>
                            </div>
                          </Link>
                        ))}

                        {/* Fallback con categorías estáticas si no hay categorías dinámicas */}
                        {!categoriesLoading && !categoriesError && activeCategories.length === 0 && (
                          <>
                            <Link 
                              href="/catalogo?categoria=todas" 
                              className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md border-b border-gray-600 mb-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{t('Todas las categorías')}</span>
                                <span className="text-gray-400">→</span>
                              </div>
                            </Link>
                            <Link href="/catalogo?categoria=camisas" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                              <div className="flex items-center justify-between">
                                <span>{t('Camisas')}</span>
                                <span className="text-gray-400">→</span>
                              </div>
                            </Link>
                            <Link href="/catalogo?categoria=pantalones" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                              <div className="flex items-center justify-between">
                                <span>{t('Pantalones')}</span>
                                <span className="text-gray-400">→</span>
                              </div>
                            </Link>
                            <Link href="/catalogo?categoria=vestidos" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                              <div className="flex items-center justify-between">
                                <span>{t('Vestidos')}</span>
                                <span className="text-gray-400">→</span>
                              </div>
                            </Link>
                            <Link href="/catalogo?categoria=abrigos" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                              <div className="flex items-center justify-between">
                                <span>{t('Abrigos y Chaquetas')}</span>
                                <span className="text-gray-400">→</span>
                              </div>
                            </Link>
                            <Link href="/catalogo?categoria=faldas" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                              <div className="flex items-center justify-between">
                                <span>{t('Faldas')}</span>
                                <span className="text-gray-400">→</span>
                              </div>
                            </Link>
                            <Link href="/catalogo?categoria=jeans" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                              <div className="flex items-center justify-between">
                                <span>{t('Jeans')}</span>
                                <span className="text-gray-400">→</span>
                              </div>
                            </Link>
                          </>
                        )}
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-700">
                        <p className="text-gray-400 text-sm">
                          {t('Descubre nuestra amplia colección de moda y encuentra el estilo perfecto para ti.')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="/catalogo?filter=populares" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className="w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer">
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                    {t('POPULARES')}
                  </div>
                </div>
              </Link>
              <Link href="/catalogo?filter=nuevos" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className="w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer">
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                    {t('NUEVOS')}
                  </div>
                </div>
              </Link>
              <Link href="/catalogo?filter=basicos" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className="w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer">
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                    {t('BASICOS')}
                  </div>
                </div>
              </Link>
            </div>
            
            {/* Logo centrado con posicionamiento absoluto */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <Link href="/" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className="w-[50px] h-[50px] cursor-pointer flex items-center justify-center my-2">
                  <Image
                    className="w-full h-full object-cover"
                    width={50}
                    height={50}
                    sizes="100vw"
                    alt="Logo Treboluxe - Ir a página principal"
                    src="/sin-ttulo1-2@2x.png"
                  />
                </div>
              </Link>
            </div>
            
            <div className="flex flex-row items-center justify-end gap-[32px]">
              <div 
                className="w-8 relative h-8 cursor-pointer hover:bg-gray-700 rounded p-1 transition-colors duration-200"
                ref={languageDropdownRef}
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                <Image
                  className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] max-w-full overflow-hidden max-h-full"
                  width={20}
                  height={20}
                  sizes="100vw"
                  alt="Selector de idioma y moneda"
                  src="/icon.svg"
                />
                
                {/* Language & Currency Dropdown - Positioned on the right side */}
                <div 
                  className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-50 transform transition-all duration-300 ease-out ${
                    showLanguageDropdown 
                      ? 'translate-x-0 opacity-100' 
                      : 'translate-x-full opacity-0 pointer-events-none'
                  } w-80 sm:w-72 md:w-80 lg:w-80 h-[calc(100vh-82px)] overflow-hidden`}
                >
                  <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                    <div className="pt-6 pb-8 px-6 h-full flex flex-col overflow-y-auto">
                    <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">{t('IDIOMA Y MONEDA')}</h3>
                    
                    {/* Language Section */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-white mb-4 tracking-[1px]">{t('Idioma')}</h4>
                      <div className="space-y-1">
                        <button 
                          onClick={() => changeLanguage('es')}
                          className={`w-full text-left px-4 py-3 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md ${
                            currentLanguage === 'es' ? 'bg-gray-800' : 'bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🇪🇸</span>
                              <span>Español</span>
                            </div>
                            {currentLanguage === 'es' && <span className="text-white font-bold">✓</span>}
                          </div>
                        </button>
                        <button 
                          onClick={() => changeLanguage('en')}
                          className={`w-full text-left px-4 py-3 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md ${
                            currentLanguage === 'en' ? 'bg-gray-800' : 'bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🇺🇸</span>
                              <span>English</span>
                            </div>
                            {currentLanguage === 'en' && <span className="text-white font-bold">✓</span>}
                          </div>
                        </button>
                        <button 
                          onClick={() => changeLanguage('fr')}
                          className={`w-full text-left px-4 py-3 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md ${
                            currentLanguage === 'fr' ? 'bg-gray-800' : 'bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">��</span>
                              <span>Français</span>
                            </div>
                            {currentLanguage === 'fr' && <span className="text-white font-bold">✓</span>}
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Currency Section */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-white mb-4 tracking-[1px]">{t('Moneda')}</h4>
                      <div className="space-y-1">
                        <button 
                          onClick={() => changeCurrency('MXN')}
                          className={`w-full text-left px-4 py-3 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md ${
                            currentCurrency === 'MXN' ? 'bg-gray-800' : 'bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">$</span>
                              <span>MXN - Peso Mexicano</span>
                            </div>
                            {currentCurrency === 'MXN' && <span className="text-white font-bold">✓</span>}
                          </div>
                        </button>
                        <button 
                          onClick={() => changeCurrency('USD')}
                          className={`w-full text-left px-4 py-3 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md ${
                            currentCurrency === 'USD' ? 'bg-gray-800' : 'bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">$</span>
                              <span>USD - Dólar</span>
                            </div>
                            {currentCurrency === 'USD' && <span className="text-white font-bold">✓</span>}
                          </div>
                        </button>
                        <button 
                          onClick={() => changeCurrency('EUR')}
                          className={`w-full text-left px-4 py-3 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md ${
                            currentCurrency === 'EUR' ? 'bg-gray-800' : 'bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">€</span>
                              <span>EUR - Euro</span>
                            </div>
                            {currentCurrency === 'EUR' && <span className="text-white font-bold">✓</span>}
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-6 border-t border-gray-600">
                      <p className="text-gray-300 text-sm">
                        {t('Selecciona tu idioma preferido y la moneda para ver los precios actualizados.')}
                      </p>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botón de Admin - Solo visible para usuarios autenticados y administradores */}
              {isAuthenticated && user && canAccessAdminPanel(user.rol) && (
                <div className="w-8 relative h-8" ref={adminDropdownRef}>
                  <button 
                    onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                    className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    title={t('Panel de Administración')}
                  >
                    <svg 
                      className="h-full w-full object-contain text-white" 
                      width={16} 
                      height={18} 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
                      <path d="M10 14l-3-3 1.41-1.41L10 11.17l5.59-5.58L17 7l-7 7z" fill="white"/>
                    </svg>
                  </button>
                  
                  {/* Admin Dropdown */}
                  <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
                    showAdminDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                  } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
                    <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                      <div className="p-6 text-center">
                        <div className="mb-6">
                          <div className="w-16 h-16 bg-green-600/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
                              <path d="M10 14l-3-3 1.41-1.41L10 11.17l5.59-5.58L17 7l-7 7z" fill="currentColor"/>
                            </svg>
                          </div>
                          <h3 className="text-xl text-white mb-2">{t('Panel de Administración')}</h3>
                          <p className="text-gray-300 text-sm">{t('Gestiona el contenido del sitio')}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <Link 
                            href="/admin"
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 no-underline"
                            onClick={() => setShowAdminDropdown(false)}
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                            </svg>
                            {t('Acceder al Panel')}
                          </Link>
                          <div className="text-xs text-gray-400 bg-white/5 p-3 rounded-lg">
                            <p className="font-medium mb-1">{t('Características:')}</p>
                            <ul className="text-left space-y-1">
                              <li>• {t('Gestión de textos del header')}</li>
                              <li>• {t('Administración de imágenes')}</li>
                              <li>• {t('CRUD de productos')}</li>
                              <li>• {t('Gestión de promociones')}</li>
                              <li>• {t('Control de pedidos')}</li>
                              <li>• {t('Sistema de notas')}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-auto p-6 border-t border-white/20">
                        <p className="text-gray-300 text-xs text-center">
                          {t('Acceso solo para administradores autorizados')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="w-8 relative h-8" ref={loginDropdownRef}>
                <button 
                  onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                  className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                >
                  <Image
                    className="h-full w-full object-contain"
                    width={16}
                    height={18}
                    sizes="100vw"
                    alt="Login"
                    src="/icon1.svg"
                  />
                </button>
                
                {/* Login Dropdown */}
                <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
                  showLoginDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
                  <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                    {isAuthenticated && user ? (
                      // Usuario logueado
                      <div className="p-6">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {user?.nombres?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <h3 className="text-xl text-white mb-1">{t('¡Hola, {{name}}!').replace('{{name}}', `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'Usuario')}</h3>
                          <p className="text-gray-300 text-sm">{user?.correo || ''}</p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <Link 
                            href="/profile"
                            className="w-full bg-white/20 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/30 transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {t('Mi perfil')}
                          </Link>
                          <Link 
                            href="/orders"
                            className="w-full bg-white/20 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/30 transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {t('Mis pedidos')}
                          </Link>
                        </div>
                        
                        <button 
                          onClick={async () => {
                            try {
                              await logout();
                              setShowLoginDropdown(false);
                            } catch (error) {
                              console.error('Error al cerrar sesión:', error);
                            }
                          }}
                          className="w-full bg-transparent border-2 border-red-400 text-red-400 py-3 px-6 rounded-lg font-medium hover:bg-red-400 hover:text-white transition-colors duration-200"
                        >
                          {t('Cerrar sesión')}
                        </button>
                      </div>
                    ) : (
                      // Usuario no logueado
                      <div className="p-6 text-center">
                        <div className="mb-6">
                          <h3 className="text-xl text-white mb-2">{t('¡Bienvenido!')}</h3>
                          <p className="text-gray-300 text-sm">{t('Inicia sesión para acceder a tu cuenta')}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <Link 
                            href="/login"
                            className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 inline-block text-center"
                          >
                            {t('Iniciar sesión')}
                          </Link>
                          <Link 
                            href="/register"
                            className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200 inline-block text-center"
                          >
                            {t('Registrarse')}
                          </Link>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white/20">
                          <p className="text-gray-300 text-xs text-center">
                            {t('Al continuar, aceptas nuestros términos de servicio y política de privacidad.')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-8 relative h-8" ref={searchDropdownRef}>
                <button 
                  onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                  className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                >
                  <Image
                    className="h-full w-full object-contain"
                    width={15}
                    height={15}
                    sizes="100vw"
                    alt="Búsqueda"
                    src="/icon2.svg"
                  />
                </button>
                
                {/* Search Dropdown */}
                <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
                  showSearchDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
                  <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                    <div className="p-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">{t('BÚSQUEDA')}</h3>
                        <p className="text-gray-300 text-sm">{t('Encuentra los productos que buscas')}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <input
                            type="text"
                            placeholder={t('¿Qué estás buscando?')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            className="w-4/5 bg-white/20 border border-white/30 rounded-lg py-3 px-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                          />
                        </div>
                        <div className="flex justify-center">
                          <button 
                            onClick={handleSearch}
                            className="w-4/5 bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {t('Buscar')}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-white/20">
                        <h4 className="text-white font-semibold mb-3">{t('Búsquedas populares:')}</h4>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => window.location.href = '/catalogo?busqueda=Camisas'}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            {t('Camisas')}
                          </button>
                          <button 
                            onClick={() => window.location.href = '/catalogo?busqueda=Pantalones'}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            {t('Pantalones')}
                          </button>
                          <button 
                            onClick={() => window.location.href = '/catalogo?busqueda=Vestidos'}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            {t('Vestidos')}
                          </button>
                          <button 
                            onClick={() => window.location.href = '/catalogo?busqueda=Zapatos'}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            {t('Zapatos')}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto p-6 border-t border-white/20">
                      <p className="text-gray-300 text-xs text-center">
                        {t('Utiliza filtros para encontrar exactamente lo que necesitas.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-8 relative h-8" ref={cartDropdownRef}>
                <button 
                  onClick={() => setShowCartDropdown(!showCartDropdown)}
                  className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity duration-200 relative"
                >
                  <Image
                    className="h-full w-full object-contain"
                    width={19.2}
                    height={17.5}
                    sizes="100vw"
                    alt="Carrito de compras"
                    src="/icon3.svg"
                  />
                  {/* Badge de cantidad */}
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </button>
                
                {/* Cart Dropdown */}
                <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
                  showCartDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
                  <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">{t('CARRITO')}</h3>
                        <p className="text-gray-300 text-sm">{totalItems} {t('productos en tu carrito')}</p>
                      </div>
                      
                      {/* Lista de productos */}
                      <div className="space-y-4 flex-1 overflow-y-auto">
                        {cartItems.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-300 mb-4">{t('Tu carrito está vacío')}</p>
                            <p className="text-gray-400 text-sm">{t('Agrega algunos productos para continuar')}</p>
                          </div>
                        ) : (
                          cartItems.map((item) => (
                            <div key={`${item.variantId}-${item.tallaId}`} className="bg-white/10 rounded-lg p-4 border border-white/20">
                              <div className="flex items-start gap-3">
                                <div className="w-16 h-16 bg-gray-400 rounded-lg flex-shrink-0">
                                  {item.image && (
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      width={64}
                                      height={64}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-medium truncate">{item.name}</h4>
                                  <p className="text-gray-300 text-sm">{t('Talla')}: {item.tallaName}, {item.variantName}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-white font-bold">{formatPrice(item.price, currentCurrency, 'MXN')}</span>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => updateQuantity(item.productId, item.variantId, item.tallaId, Math.max(1, item.quantity - 1))}
                                        className="w-6 h-6 bg-white/20 rounded text-white text-sm hover:bg-white/30 transition-colors"
                                        disabled={isLoading}
                                      >
                                        -
                                      </button>
                                      <span className="text-white text-sm w-8 text-center">{item.quantity}</span>
                                      <button 
                                        onClick={() => updateQuantity(item.productId, item.variantId, item.tallaId, item.quantity + 1)}
                                        className="w-6 h-6 bg-white/20 rounded text-white text-sm hover:bg-white/30 transition-colors"
                                        disabled={isLoading}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.productId, item.variantId, item.tallaId)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  disabled={isLoading}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Resumen del carrito */}
                      {cartItems.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/20">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-300">{t('Subtotal:')}</span>
                            <span className="text-white font-bold">{formatPrice(totalFinal, currentCurrency, 'MXN')}</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-300">{t('Envío:')}</span>
                            <span className="text-green-400 font-medium">{t('Gratis')}</span>
                          </div>
                          <div className="flex justify-between items-center mb-6 text-lg">
                            <span className="text-white font-bold">{t('Total:')}</span>
                            <span className="text-white font-bold">{formatPrice(totalFinal, currentCurrency, 'MXN')}</span>
                          </div>
                          
                          <div className="space-y-3">
                            <Link href="/checkout" className="block">
                              <button className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                                {t('Finalizar Compra')}
                              </button>
                            </Link>
                            <Link href="/carrito" className="block">
                              <button className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200">
                                {t('Ver Carrito Completo')}
                              </button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
      {/* Main Images Section */}
      <div className="self-stretch flex flex-col items-center justify-start h-screen">
        <div className="self-stretch flex flex-row items-center justify-start h-full">
          {leftImage || rightImage ? (
            <>
              {leftImage && (
                <Image
                  className="flex-1 relative max-w-full h-full object-cover"
                  width={960}
                  height={904}
                  sizes="100vw"
                  alt={leftImage.descripcion || "Imagen principal izquierda"}
                  src={leftImage.url}
                />
              )}
              {rightImage && (
                <Image
                  className="flex-1 relative max-w-full h-full object-cover"
                  width={960}
                  height={904}
                  sizes="100vw"
                  alt={rightImage.descripcion || "Imagen principal derecha"}
                  src={rightImage.url}
                />
              )}
            </>
          ) : (
            <div className="flex-1 h-full flex items-center justify-center bg-gray-900/50">
              <div className="text-center text-white/50">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-lg">{t('No hay imágenes configuradas')}</p>
                <p className="text-sm">{t('Configure las imágenes desde el panel de administrador')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Promociones Section */}
      <div className="self-stretch flex flex-col items-start justify-start !p-4 text-[96px] min-h-0 flex-shrink-0">
        <Link href="/catalogo?filter=promociones" className="no-underline w-full">
          <div className="self-stretch rounded-[46px] flex-1 min-h-[500px] flex flex-col items-start justify-start !p-8 box-border relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300 group [box-shadow:none] hover:[box-shadow:none] [filter:none] hover:[filter:none]">
            {/* Imagen de fondo */}
            <div className="absolute inset-0 rounded-[46px] overflow-hidden">
              {bannerImage ? (
                <Image
                  src={bannerImage.url}
                  alt={bannerImage.descripcion || "Banner Promociones"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              ) : (
                <Image
                  src="/promociones-playa.jpg"
                  alt="Banner Promociones"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              )}
            </div>
            
            {/* Overlay para mejor legibilidad del texto */}
            <div className="absolute inset-0 bg-black/40 rounded-[46px] group-hover:bg-black/30 transition-all duration-300"></div>
            
            {/* Contenido de texto con descripción en hover */}
            <div className="relative z-10 tracking-[5px] leading-[100px] [text-shadow:2px_2px_8px_rgba(0,_0,_0,_0.9)] text-white group-hover:text-white transition-colors duration-300">
              {t('Promociones Especiales').split(' ')[0]}
            </div>
            <div className="w-[485px] relative z-10 tracking-[5px] leading-[100px] inline-block [text-shadow:2px_2px_8px_rgba(0,_0,_0,_0.9)] text-white group-hover:text-white transition-colors duration-300">
              {t('Promociones Especiales').split(' ')[1]}
            </div>
            
            {/* Descripción que aparece en hover */}
            {bannerImage?.descripcion && (
              <div className="absolute bottom-8 left-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-sm max-w-xs leading-relaxed">
                  {bannerImage.descripcion}
                </div>
              </div>
            )}
            

          </div>
        </Link>
      </div>

      {/* Sección de productos destacados */}
      <div className="self-stretch bg-transparent flex flex-col items-center justify-start !py-16" style={{paddingLeft: '16pt', paddingRight: '16pt'}}>
        <div className="w-full">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4 tracking-[2px]">{t('AGREGADOS RECIENTEMENTE')}</h2>
            <p className="text-gray-300 text-lg">{t('Descubre nuestros productos más nuevos')}</p>
          </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {featuredProducts.slice(0, 6).map((product) => (
              <Link key={product.id} href={`/producto/${product.id}`} className="no-underline">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                  <div className="relative mb-4">
                    <Image
                      className="w-full h-64 object-cover rounded-lg"
                      width={300}
                      height={256}
                      src={product.image}
                      alt={product.name}
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <span className="text-white font-bold text-lg">{t('Agotado')}</span>
                      </div>
                    )}
                    {/* Mostrar promociones en lugar del descuento calculado */}
                    {renderPromotions(product.id)}
                    {/* Fallback: mostrar descuento calculado si no hay promociones */}
                    {(!promotions[product.id] || promotions[product.id].length === 0) && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-white font-semibold text-lg mb-2">{t(product.name)}</h3>
                  <p className="text-gray-300 text-sm mb-2">{t('Categoría')}: {t(product.category)}</p>
                  <p className="text-gray-300 text-sm mb-2">{t('Marca')}: {product.brand}</p>
                  <p className="text-gray-300 text-sm mb-2">{t('Color')}: {t(product.color)}</p>
                  <p className="text-gray-300 text-sm mb-4">{t('Talla')}: {product.size}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold text-lg">{formatPrice(product.price, currentCurrency, 'MXN')}</span>
                      <span className="text-gray-400 line-through text-sm">{formatPrice(product.originalPrice, currentCurrency, 'MXN')}</span>
                    </div>
                  </div>
                  
                  <button
                    disabled={!product.inStock}
                    className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                      product.inStock 
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (product.inStock) {
                        // Usar la función handleAddToCart
                        handleAddToCart(product);
                      }
                    }}
                  >
                    {product.inStock ? t('Añadir al carrito') : t('Agotado')}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="self-stretch flex flex-col items-start justify-start !pt-1.5 !pb-1.5 !pl-1 !pr-1 gap-[101px] text-center text-black">
        <div className="self-stretch flex flex-row items-center justify-start">
          {activeCategoriesWithContent.map((category, index) => (
            <div 
              key={category.id_categoria}
              className={`flex-1 relative h-[90px] transition-colors duration-300 cursor-pointer ${
                selectedCategory === category.nombre ? 'bg-[#1a6b1a]' : 'bg-gray-100 hover:bg-[#1a6b1a]'
              }`}
              onClick={() => setSelectedCategory(category.nombre)}
            >
              <div className={`absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center transition-colors duration-300 ${
                selectedCategory === category.nombre ? 'text-white' : 'hover:text-white'
              }`}>
                {t(category.nombre)}
              </div>
            </div>
          ))}
          {activeCategoriesWithContent.length === 0 && (
            <div className="flex-1 relative h-[90px] bg-gray-100 flex items-center justify-center">
              <div className="text-gray-500">Cargando categorías...</div>
            </div>
          )}
        </div>

      </div>

      {/* Sección de productos por categoría */}
      <div className="self-stretch bg-transparent flex flex-col items-center justify-start !py-16" style={{paddingLeft: '16pt', paddingRight: '16pt'}}>
        <div className="w-full">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4 tracking-[2px]">{t(selectedCategory.toUpperCase())}</h2>
            <p className="text-gray-300 text-lg">{t('Explora nuestra colección de')} {t(selectedCategory.toLowerCase())}</p>
          </div>
          
          {/* Manejo de estados de carga y error */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-white text-lg">Cargando productos...</div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-200 text-center">Error: {error}</p>
            </div>
          )}
          
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {getFilteredProducts().slice(0, 6).map((product) => (
              <Link key={product.id} href={`/producto/${product.id}`} className="no-underline">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                  <div className="relative mb-4">
                    <Image
                      className="w-full h-64 object-cover rounded-lg"
                      width={300}
                      height={256}
                      src={product.image}
                      alt={product.name}
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <span className="text-white font-bold text-lg">{t('Agotado')}</span>
                      </div>
                    )}
                    {/* Mostrar promociones en lugar del descuento calculado */}
                    {renderPromotions(product.id)}
                    {/* Fallback: mostrar descuento calculado si no hay promociones */}
                    {(!promotions[product.id] || promotions[product.id].length === 0) && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-white font-semibold text-lg mb-2">{t(product.name)}</h3>
                  <p className="text-gray-300 text-sm mb-2">{t('Categoría')}: {t(product.category)}</p>
                  <p className="text-gray-300 text-sm mb-2">{t('Marca')}: {product.brand}</p>
                  <p className="text-gray-300 text-sm mb-2">{t('Color')}: {t(product.color)}</p>
                  <p className="text-gray-300 text-sm mb-4">{t('Talla')}: {product.size}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold text-lg">{formatPrice(product.price, currentCurrency, 'MXN')}</span>
                      <span className="text-gray-400 line-through text-sm">{formatPrice(product.originalPrice, currentCurrency, 'MXN')}</span>
                    </div>
                  </div>
                  
                  <button
                    disabled={!product.inStock}
                    className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                      product.inStock 
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (product.inStock) {
                        // Usar la función handleAddToCart  
                        handleAddToCart(product);
                      }
                    }}
                  >
                    {product.inStock ? t('Añadir al carrito') : t('Agotado')}
                  </button>
                </div>
              </Link>
            ))}
            </div>
          )}
          
          {!loading && getFilteredProducts().length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">{t('No hay productos disponibles en esta categoría.')}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Sección Acerca de */}
      <div className="self-stretch bg-transparent flex flex-col items-center justify-start py-16 px-4">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-[3px]">
              {t('ACERCA DE')} <span className="text-green-400">TREBOLUXE</span>
            </h2>
            <div className="w-24 h-1 bg-green-400 mx-auto"></div>
          </div>
          
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Contenido de texto */}
              <div className="space-y-6">
                <div className="space-y-4 text-gray-300 leading-relaxed text-lg">
                  <p>
                    {t('Treboluxe nació en Monterrey, Nuevo León, México, con una idea clara: llevar estilo, autenticidad y actitud a cada prenda. Fundada en 2022 por Emilio Torres Valdez, un joven emprendedor de 21 años apasionado por la moda urbana, la marca comenzó con una pequeña colección de gorras y camisas con diseños únicos, pensados para quienes buscan destacar sin perder su esencia.')}
                  </p>
                  
                  <p>
                    {t('El nombre Treboluxe une dos conceptos poderosos: la suerte del trébol y el lujo accesible que todos merecen. Creemos que vestir bien no es cuestión de gastar más, sino de saber quién eres y reflejarlo en lo que usas. Cada pieza está cuidadosamente elegida o diseñada para ofrecer estilo, comodidad y autenticidad.')}
                  </p>
                  
                  <p>
                    {t('Con el paso del tiempo, nuestro catálogo se ha expandido, incorporando productos variados dentro del mundo de la ropa, siempre con una visión clara: ofrecer moda con personalidad. En Treboluxe, no solo vendemos ropa; construimos una comunidad que apuesta por lo original, lo diferente y lo auténtico.')}
                  </p>
                  
                  <p>
                    {t('Gracias por formar parte de esta historia. Lo mejor apenas está por comenzar.')}
                  </p>
                </div>
                
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-green-400 italic">
                    {t('Recuerda viste con suerte, vive con estilo')} 🍀
                  </p>
                </div>
                
                {/* Información del fundador */}
                <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/20">
                  <h3 className="text-white font-semibold text-xl mb-2">{t('Fundador')}</h3>
                  <p className="text-green-300 font-medium">Emilio Torres Valdez</p>
                  <p className="text-gray-400">{t('Emprendedor apasionado por la moda urbana')}</p>
                  <p className="text-gray-400">{t('Monterrey, Nuevo León, México')}</p>
                </div>
              </div>
              
              {/* Imagen/Stats */}
              <div className="space-y-8">
                {/* Logo o imagen representativa */}
                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 text-center">
                  <div className="text-6xl mb-4">🍀</div>
                  <h3 className="text-white font-bold text-2xl mb-2">TREBOLUXE</h3>
                  <p className="text-green-200">{t('Estilo • Autenticidad • Actitud')}</p>
                </div>
                
                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 rounded-lg p-6 text-center border border-white/10">
                    <div className="text-3xl font-bold text-green-400">2022</div>
                    <div className="text-gray-300 text-sm">{t('Año de Fundación')}</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-6 text-center border border-white/10">
                    <div className="text-3xl font-bold text-green-400">MTY</div>
                    <div className="text-gray-300 text-sm">{t('Monterrey, NL')}</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-6 text-center border border-white/10">
                    <div className="text-3xl font-bold text-green-400">100%</div>
                    <div className="text-gray-300 text-sm">{t('Auténtico')}</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-6 text-center border border-white/10">
                    <div className="text-3xl font-bold text-green-400">∞</div>
                    <div className="text-gray-300 text-sm">{t('Estilo')}</div>
                  </div>
                </div>
                
                {/* Call to action */}
                <div className="text-center">
                  <Link href="/catalogo" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition-colors duration-300 no-underline">
                    {t('Descubre Nuestra Colección')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer completo */}
      <footer className="self-stretch [background:linear-gradient(180deg,_#000,_#1a6b1a)] overflow-hidden shrink-0 flex flex-col items-start justify-start pt-16 pb-8 px-8 text-Text-Default-Tertiary font-Body-Font-Family">
        <div className="w-full flex flex-row items-start justify-start gap-8 mb-12">
          {/* Logo y redes sociales */}
          <div className="w-60 flex flex-col items-start justify-start gap-6 min-w-[240px]">
            <Image
              className="w-[50px] h-[50px]"
              width={50}
              height={50}
              sizes="100vw"
              alt="Logo Treboluxe"
              src="/sin-ttulo1-2@2x.png"
            />
            <div className="flex flex-col items-start justify-start gap-4">
              <p className="text-white text-sm leading-relaxed">
                {t('Tu tienda de moda online de confianza. Descubre las últimas tendencias y encuentra tu estilo único con nuestra amplia selección de ropa y accesorios.')}
              </p>
              <div className="flex flex-row items-center justify-start gap-4">
                <a 
                  href="https://www.facebook.com/profile.php?id=61576338298512"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    className="w-6 relative h-6"
                    width={24}
                    height={24}
                    sizes="100vw"
                    alt="Facebook"
                    src="/facebook-icon.svg"
                  />
                </a>
                <a 
                  href="https://www.instagram.com/treboluxe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    className="w-6 relative h-6 overflow-hidden shrink-0"
                    width={24}
                    height={24}
                    sizes="100vw"
                    alt="Instagram"
                    src="/logo-instagram.svg"
                  />
                </a>
                <a 
                  href="https://www.tiktok.com/@treboluxe5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    className="w-6 relative h-6 overflow-hidden shrink-0"
                    width={24}
                    height={24}
                    sizes="100vw"
                    alt="TikTok"
                    src="/tiktok-icon.svg"
                  />
                </a>
                <a 
                  href="https://twitter.com/treboluxe?s=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    className="w-6 relative h-6 overflow-hidden shrink-0"
                    width={24}
                    height={24}
                    sizes="100vw"
                    alt="Twitter/X"
                    src="/x-logo.svg"
                  />
                </a>
              </div>
            </div>
          </div>
          
          {/* Columna Compras */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Compras')}
              </h3>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Cómo comprar')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Métodos de pago')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Tabla de tallas')}
              </div>
            </div>
          </div>
          
          {/* Columna Categorías */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Categorías')}
              </h3>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Mujer')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Hombre')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Niños')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Accesorios')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Calzado')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Nueva colección')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Ofertas especiales')}
              </div>
            </div>
          </div>
          
          {/* Columna Atención al cliente */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Atención al cliente')}
              </h3>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Contacto')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Preguntas frecuentes')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Reportar un problema')}
              </div>
            </div>
          </div>
          
          {/* Columna Legal */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Legal')}
              </h3>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Términos y condiciones')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Sobre nosotros')}
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright section */}
        <div className="w-full pt-8 border-t border-white/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 text-sm">
              {t('© 2024 Treboluxe. Todos los derechos reservados.')}
            </div>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <span className="hover:text-white transition-colors cursor-pointer">{t('Mapa del sitio')}</span>
              <span className="hover:text-white transition-colors cursor-pointer">{t('Accesibilidad')}</span>
              <span className="hover:text-white transition-colors cursor-pointer">{t('Configurar cookies')}</span>
            </div>
          </div>
          <div className="mt-4 text-gray-400 text-xs">
            {t('Treboluxe es una marca registrada. Todos los precios incluyen IVA. Los gastos de envío se calculan durante el proceso de compra.')}
          </div>
        </div>
      </footer>

      {/* Selector de Variantes y Tallas */}
      {selectedProduct && (
        <VariantSizeSelector
          isOpen={showVariantSelector}
          onClose={handleCloseVariantSelector}
          product={selectedProduct}
          onAddToCart={handleAddToCartFromSelector}
          currentLanguage={currentLanguage}
        />
      )}
      
      </div>
    </div>
  );
};

export default HomeScreen;
