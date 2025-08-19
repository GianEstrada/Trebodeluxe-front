import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/NewCartContext';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { canAccessAdminPanel } from '../utils/roles';
import { useCategories } from '../hooks/useCategories';

interface HeaderProps {
  currentLanguage?: string;
  setCurrentLanguage?: (lang: string) => void;
  currentCurrency?: string;
  setCurrentCurrency?: (currency: string) => void;
  isTranslating?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  currentLanguage = "es",
  setCurrentLanguage = () => {},
  currentCurrency = "MXN",
  setCurrentCurrency = () => {},
  isTranslating = false
}) => {
  // Estados para dropdowns
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para el carrusel promocional
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Textos promocionales
  const promoTexts = [
    'Descubre nuestras ofertas exclusivas',
    'Nueva colección disponible ahora'
  ];
  
  // Referencias para detectar clicks fuera
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { t } = useUniversalTranslate(currentLanguage);
  const { user, isAuthenticated, logout } = useAuth();
  const { items: cartItems, totalItems, totalFinal: totalPrice, removeFromCart, updateQuantity, clearCart, isLoading } = useCart();
  const { formatPrice } = useExchangeRates();
  
  // Usar categorías dinámicas desde la API
  const { activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();

  // Auto-cambio del carrusel promocional cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % promoTexts.length);
        setIsAnimating(false);
      }, 150);
    }, 5000);

    return () => clearInterval(interval);
  }, [promoTexts.length]);

  // Función para cambiar manualmente el texto del carrusel
  const handleDotClick = (index: number) => {
    if (index !== currentTextIndex) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex(index);
        setIsAnimating(false);
      }, 150);
    }
  };

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
      setShowLoginDropdown(true);
      return false;
    }
    return true;
  };

  // Event listeners para clicks fuera de dropdowns
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

  return (
    <>
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}
      
      <div className="self-stretch flex flex-col items-start justify-start text-Schemes-On-Surface font-Static-Body-Large-Font flex-shrink-0">
        <div className="self-stretch flex flex-col items-start justify-start text-center text-white font-salsa">
          {/* Barra Superior Promocional */}
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
          
          {/* Navbar Principal */}
          <div className="self-stretch flex flex-row items-center justify-between !pt-[15px] !pb-[15px] !pl-8 !pr-8 text-M3-white relative">
            <div className="flex flex-row items-center justify-start gap-[33px]">
              {/* Dropdown de Categorías */}
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
                          href="/catalogo" 
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
                              href="/catalogo" 
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo - Link al Index */}
              <Link href="/" className="no-underline">
                <div className="w-[68px] relative h-[34px] flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors duration-200 rounded">
                  <Image
                    className="w-[40px] relative max-h-full object-contain"
                    width={40}
                    height={34}
                    sizes="100vw"
                    alt="Treboluxe Logo"
                    src="/trebol-1@2x.png"
                  />
                </div>
              </Link>
            </div>

            {/* Controles del lado derecho */}
            <div className="flex flex-row items-center justify-end gap-4 relative">
              {/* Búsqueda */}
              <div className="w-8 relative h-8" ref={searchDropdownRef}>
                <div 
                  className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:bg-gray-700 transition-colors duration-200 rounded flex items-center justify-center"
                  onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                >
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Dropdown de búsqueda */}
                <div className={`absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg z-50 transition-all duration-200 ${
                  showSearchDropdown ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  <div className="p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('Buscar productos...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors duration-200"
                      >
                        {t('Buscar')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de Idioma y Moneda */}
              <div className="w-8 relative h-8" ref={languageDropdownRef}>
                <button 
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:bg-gray-700 transition-colors duration-200 rounded flex items-center justify-center text-white"
                  title={t('Cambiar idioma y moneda')}
                >
                  🌐
                </button>

                {/* Dropdown de idioma y moneda */}
                <div className={`absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg z-50 transition-all duration-200 ${
                  showLanguageDropdown ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">{t('Idioma')}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => changeLanguage('es')}
                          className={`px-3 py-2 text-sm rounded transition-colors duration-200 ${
                            currentLanguage === 'es' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          🇪🇸 Español
                        </button>
                        <button
                          onClick={() => changeLanguage('en')}
                          className={`px-3 py-2 text-sm rounded transition-colors duration-200 ${
                            currentLanguage === 'en' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          🇺🇸 English
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">{t('Moneda')}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => changeCurrency('MXN')}
                          className={`px-3 py-2 text-sm rounded transition-colors duration-200 ${
                            currentCurrency === 'MXN' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          $ MXN
                        </button>
                        <button
                          onClick={() => changeCurrency('USD')}
                          className={`px-3 py-2 text-sm rounded transition-colors duration-200 ${
                            currentCurrency === 'USD' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          $ USD
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-white/20 pt-4">
                      <p className="text-gray-300 text-sm">
                        {t('Selecciona tu idioma preferido y la moneda para ver los precios actualizados.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carrito */}
              <div className="w-8 relative h-8" ref={cartDropdownRef}>
                <button 
                  onClick={() => setShowCartDropdown(!showCartDropdown)}
                  className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:bg-gray-700 transition-colors duration-200 rounded flex items-center justify-center relative"
                  title={t('Carrito de compras')}
                >
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L18 18M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>

                {/* Dropdown del carrito */}
                <div className={`absolute top-full right-0 mt-2 w-96 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg z-50 transition-all duration-200 max-h-96 overflow-y-auto ${
                  showCartDropdown ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  <div className="p-4">
                    <h4 className="text-white font-medium mb-3">{t('Carrito')} ({totalItems} {t('artículos')})</h4>
                    
                    {cartItems.length === 0 ? (
                      <p className="text-gray-300 text-center py-4">{t('Tu carrito está vacío')}</p>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {cartItems.map((item) => (
                            <div key={`${item.productId}-${item.variantId}-${item.tallaId}`} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                              <Image
                                src={item.image || '/placeholder-product.jpg'}
                                alt={item.name}
                                width={50}
                                height={50}
                                className="rounded object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                                <p className="text-gray-300 text-xs">{item.variantName} - {item.tallaName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    onClick={() => updateQuantity(item.productId, item.variantId, item.tallaId, Math.max(0, item.quantity - 1))}
                                    className="w-6 h-6 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center justify-center"
                                  >
                                    -
                                  </button>
                                  <span className="text-white text-sm">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.productId, item.variantId, item.tallaId, item.quantity + 1)}
                                    className="w-6 h-6 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white text-sm font-medium">
                                  {formatPrice(item.finalPrice * item.quantity, currentCurrency)}
                                </p>
                                <button
                                  onClick={() => removeFromCart(item.productId, item.variantId, item.tallaId)}
                                  className="text-red-400 hover:text-red-300 text-xs mt-1"
                                >
                                  {t('Eliminar')}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t border-white/20 pt-3 mt-3">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white font-medium">{t('Total')}:</span>
                            <span className="text-green-400 font-bold text-lg">
                              {formatPrice(totalPrice || 0, currentCurrency)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Link 
                              href="/carrito"
                              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center py-2 rounded transition-colors duration-200 no-underline"
                            >
                              {t('Ver carrito')}
                            </Link>
                            <Link 
                              href="/checkout"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded transition-colors duration-200 no-underline"
                            >
                              {t('Checkout')}
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Login/Usuario */}
              <div className="w-8 relative h-8" ref={loginDropdownRef}>
                <button 
                  onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                  className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:bg-gray-700 transition-colors duration-200 rounded flex items-center justify-center"
                  title={isAuthenticated ? t('Mi cuenta') : t('Iniciar sesión')}
                >
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {/* Dropdown de login/usuario */}
                <div className={`absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg z-50 transition-all duration-200 ${
                  showLoginDropdown ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  <div className="p-4">
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="border-b border-white/20 pb-3">
                          <p className="text-white font-medium">{t('Hola')}, {user?.name || user?.email}</p>
                          <p className="text-gray-300 text-sm">{user?.email}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Link 
                            href="/perfil"
                            className="block w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded transition-colors duration-200 no-underline"
                          >
                            {t('Mi perfil')}
                          </Link>
                          <Link 
                            href="/pedidos"
                            className="block w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded transition-colors duration-200 no-underline"
                          >
                            {t('Mis pedidos')}
                          </Link>
                          <button
                            onClick={logout}
                            className="block w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded transition-colors duration-200"
                          >
                            {t('Cerrar sesión')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-white text-center mb-3">{t('Accede a tu cuenta')}</p>
                        <div className="space-y-2">
                          <Link 
                            href="/login"
                            className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded transition-colors duration-200 no-underline"
                          >
                            {t('Iniciar sesión')}
                          </Link>
                          <Link 
                            href="/registro"
                            className="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center py-2 rounded transition-colors duration-200 no-underline"
                          >
                            {t('Registrarse')}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón de Admin - Solo visible para usuarios con rol = 1 */}
              {isAuthenticated && user && canAccessAdminPanel(user.rol) && (
                <div className="w-8 relative h-8" ref={adminDropdownRef}>
                  <button 
                    onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                    className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:bg-gray-700 transition-colors duration-200 rounded flex items-center justify-center"
                    title={t('Panel de Administración')}
                  >
                    <svg 
                      className="h-6 w-6 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L2 7V10C2 16 6 20.9 12 22C18 20.9 22 16 22 10V7L12 2M12 4.3L19 7.9V10C19 15.1 16.2 19.2 12 20C7.8 19.2 5 15.1 5 10V7.9L12 4.3M12 6L8 8.5V10C8 13.9 9.8 17.2 12 18C14.2 17.2 16 13.9 16 10V8.5L12 6Z"/>
                    </svg>
                  </button>

                  {/* Dropdown de admin */}
                  <div className={`absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg z-50 transition-all duration-200 ${
                    showAdminDropdown ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}>
                    <div className="p-4">
                      <h4 className="text-white font-medium mb-3">{t('Panel de Administración')}</h4>
                      <div className="space-y-2">
                        <Link 
                          href="/admin"
                          className="block w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded transition-colors duration-200 no-underline"
                        >
                          {t('Dashboard Admin')}
                        </Link>
                        <Link 
                          href="/admin/productos"
                          className="block w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded transition-colors duration-200 no-underline"
                        >
                          {t('Gestionar Productos')}
                        </Link>
                        <Link 
                          href="/admin/categorias"
                          className="block w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded transition-colors duration-200 no-underline"
                        >
                          {t('Gestionar Categorías')}
                        </Link>
                        <Link 
                          href="/admin/pedidos"
                          className="block w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded transition-colors duration-200 no-underline"
                        >
                          {t('Gestionar Pedidos')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
