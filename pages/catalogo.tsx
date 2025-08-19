import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/NewCartContext";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { canAccessAdminPanel } from "../utils/roles";
import { productsApi, productUtils } from "../utils/productsApi";
import { useCategories } from "../hooks/useCategories";
import VariantSizeSelector from "../components/VariantSizeSelector";

const CatalogoScreen: NextPage = () => {
  const router = useRouter();
  
  // Estados básicos
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  
  // Estados para productos
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias para dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const { user, isAuthenticated, logout } = useAuth();
  const { items: cartItems, totalItems, totalFinal, addToCart } = useCart();
  const { activeCategories } = useCategories();
  const { formatPrice } = useExchangeRates();
  
  // Función para cambiar idioma
  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
    setShowLanguageDropdown(false);
  };
  
  // Función para cambiar moneda
  const changeCurrency = (currency: string) => {
    setCurrentCurrency(currency);
    localStorage.setItem('preferred-currency', currency);
    setShowLanguageDropdown(false);
  };
  
  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/catalogo?busqueda=${encodeURIComponent(searchTerm.trim())}`);
    }
  };
  
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Event listeners para cerrar dropdowns al hacer clic fuera
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        // Aquí puedes agregar la lógica para cargar productos según filtros
        const response = await productsApi.getFeatured();
        setProducts(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error loading products:', error);
        setError('Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

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
          
          {/* Header superior */}
          <div className="self-stretch [background:linear-gradient(90deg,_#1a6b1a,_#0e360e)] h-10 flex flex-row items-center justify-between !p-[5px] box-border">
            <div className="w-[278px] relative tracking-[4px] leading-6 flex items-center justify-center h-[27px] shrink-0 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)]">
              <span className="text-white">{t('TREBOLUXE')}</span>
            </div>
            
            {/* Contenido central */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-row items-center gap-2 text-white">
              <Image
                className="w-[12.2px] relative max-h-full object-contain"
                width={12.2}
                height={10.9}
                sizes="100vw"
                alt=""
                src="/petalo-1@2x.png"
              />
              <div className="relative tracking-[4px] leading-6 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)] whitespace-nowrap">
                {t('CATÁLOGO DE PRODUCTOS')}
              </div>
              <Image
                className="w-[12.2px] relative max-h-full object-contain"
                width={12.2}
                height={10.9}
                sizes="100vw"
                alt=""
                src="/petalo-1@2x.png"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Image
                className="w-[12.2px] relative max-h-full object-contain"
                width={12.2}
                height={10.9}
                sizes="100vw"
                alt=""
                src="/petalo-1@2x.png"
              />
            </div>
          </div>
          
          {/* Navbar principal */}
          <div className="self-stretch flex flex-row items-center justify-center !p-[16px] box-border min-h-[82px] relative">
            <div className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] [backdrop-filter:blur(50px)] [background:linear-gradient(#0d0d0d,_#0d0d0d),_rgba(191,_191,_191,_0.44)]" />
            
            {/* Contenedor principal del navbar */}
            <div className="flex flex-row items-center justify-between w-full relative z-10">
              
              {/* Sección izquierda: Categorías */}
              <div className="flex items-center gap-6">
                <div className="relative" ref={dropdownRef}>
                  <div 
                    className="w-[177.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer"
                    onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                  >
                    <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                      {t('CATEGORÍAS')}
                    </div>
                  </div>
                  
                  {/* Dropdown de categorías */}
                  <div 
                    className={`fixed top-[82px] left-0 w-80 sm:w-72 md:w-80 lg:w-80 h-[calc(100vh-82px)] bg-black/30 shadow-2xl z-50 transform transition-all duration-300 ease-out ${
                      showCategoriesDropdown 
                        ? 'translate-x-0 opacity-100' 
                        : '-translate-x-full opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                      <div className="pt-6 pb-8 px-6 h-full flex flex-col overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">{t('CATEGORÍAS')}</h3>
                        
                        <div className="space-y-2 mb-8">
                          {/* Todas las categorías */}
                          <Link 
                            href="/catalogo" 
                            className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md border-b border-gray-600 mb-2"
                            onClick={() => setShowCategoriesDropdown(false)}
                          >
                            {t('Todas las categorías')}
                          </Link>
                          
                          {/* Categorías dinámicas */}
                          {activeCategories.map((category: any) => (
                            <Link 
                              key={category.id_categoria}
                              href={`/catalogo?categoria=${category.slug}`} 
                              className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md"
                              onClick={() => setShowCategoriesDropdown(false)}
                            >
                              {category.nombre}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Logo centrado */}
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
              
              {/* Sección derecha: Idioma/Moneda, Login, Búsqueda, Carrito */}
              <div className="flex flex-row items-center justify-end gap-[32px]">
                
                {/* Idioma/Moneda */}
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
                </div>
                
                {/* Login */}
                <div className="w-8 relative h-8" ref={loginDropdownRef}>
                  <div 
                    className="cursor-pointer hover:bg-gray-700 rounded p-1 transition-colors duration-200 w-full h-full flex items-center justify-center"
                    onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                  >
                    <Image
                      className="w-5 h-5"
                      width={20}
                      height={20}
                      sizes="100vw"
                      alt="Login"
                      src="/login.svg"
                    />
                  </div>
                </div>
                
                {/* Búsqueda */}
                <div className="w-8 relative h-8" ref={searchDropdownRef}>
                  <div 
                    className="cursor-pointer hover:bg-gray-700 rounded p-1 transition-colors duration-200 w-full h-full flex items-center justify-center"
                    onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                  >
                    <Image
                      className="w-5 h-5"
                      width={20}
                      height={20}
                      sizes="100vw"
                      alt="Buscar productos"
                      src="/lupa.svg"
                    />
                  </div>
                </div>
                
                {/* Carrito */}
                <div className="w-8 relative h-8" ref={cartDropdownRef}>
                  <div 
                    className="cursor-pointer hover:bg-gray-700 rounded p-1 transition-colors duration-200 w-full h-full flex items-center justify-center"
                    onClick={() => setShowCartDropdown(!showCartDropdown)}
                  >
                    <Image
                      className="w-5 h-5"
                      width={20}
                      height={20}
                      sizes="100vw"
                      alt="Carrito de compras"
                      src="/shopping-cart.svg"
                    />
                    {totalItems > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalItems}
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Contenido principal del catálogo */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Título del catálogo */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-wider">
              {t('CATÁLOGO')}
            </h1>
            <p className="text-xl text-gray-300 tracking-wide">
              {t('Descubre nuestra colección completa')}
            </p>
          </div>
          
          {/* Filtros y productos aquí */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-white text-xl">{t('Cargando productos...')}</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-xl">{error}</div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-white text-xl">{t('Aquí se mostrarán los productos')}</div>
              <div className="text-gray-400 text-sm mt-4">
                {t('Total de productos:')} {products.length}
              </div>
            </div>
          )}
          
        </div>
      </div>
      
    </div>
  );
};

export default CatalogoScreen;
