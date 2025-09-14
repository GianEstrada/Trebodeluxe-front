// components/Navbar.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/NewCartContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { canAccessAdminPanel } from '../utils/roles';
import { useCategories } from '../hooks/useCategories';

interface NavbarProps {
  currentLanguage: string;
  currentCurrency: string;
  onLanguageChange: (language: string) => void;
  onCurrencyChange: (currency: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSearchSubmit?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  currentCurrency,
  onLanguageChange,
  onCurrencyChange,
  searchTerm = '',
  onSearchChange,
  onSearchSubmit
}) => {
  // Estados para dropdowns
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  // Refs para los dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { t } = useUniversalTranslate(currentLanguage);
  const { user, isAuthenticated, logout } = useAuth();
  const { items: cartItems, totalItems, totalFinal, updateQuantity, removeFromCart, isLoading } = useCart();
  const { headerSettings } = useSiteSettings();
  const { formatPrice } = useExchangeRates();
  const { activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const router = useRouter();

  // Textos del carrusel promocional
  const promoTexts = headerSettings?.promoTexts || ['ENVIO GRATIS EN PEDIDOS ARRIBA DE $500 MXN', 'OFERTA ESPECIAL: 20% DE DESCUENTO EN SEGUNDA PRENDA'];
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Funciones para manejar el cambio de idioma y moneda
  const changeLanguage = (newLanguage: string) => {
    onLanguageChange(newLanguage);
    setShowLanguageDropdown(false);
  };

  const changeCurrency = (newCurrency: string) => {
    onCurrencyChange(newCurrency);
    setShowLanguageDropdown(false);
  };

  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (onSearchSubmit) {
      onSearchSubmit();
    } else if (searchTerm.trim()) {
      router.push(`/catalogo?busqueda=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Función para cambiar manualmente el texto del carrusel
  const handleDotClick = (index: number) => {
    if (index !== currentTextIndex) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex(index);
        setIsAnimating(false);
      }, 300);
    }
  };

  // Cerrar dropdowns al hacer clic fuera
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

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Rotación automática del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex((prev) => (prev + 1) % promoTexts.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [promoTexts.length]);

  return (
    <>
      {/* Header promocional */}
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

      {/* Navbar principal */}
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
            
            {/* Dropdown Menu */}
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
                    {/* Opción "Todas las categorías" */}
                    <Link 
                      href="/catalogo?categoria=todas" 
                      className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md border-b border-gray-600 mb-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{t('Todas las categorías')}</span>
                        <span className="text-gray-400">→</span>
                      </div>
                    </Link>

                    {/* Categorías dinámicas */}
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

                    {/* Fallback categorías estáticas */}
                    {!categoriesLoading && !categoriesError && activeCategories.length === 0 && (
                      <>
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

          {/* Promociones */}
          <Link href="/catalogo?filter=promociones" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
            <div className="w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer">
              <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                {t('PROMOCIONES')}
              </div>
            </div>
          </Link>

          {/* Nuevos */}
          <Link href="/catalogo?filter=nuevos" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
            <div className="w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer">
              <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                {t('NUEVOS')}
              </div>
            </div>
          </Link>
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
        
        {/* Iconos de la derecha */}
        <div className="flex flex-row items-center justify-end gap-[32px]">
          {/* Selector de idioma y moneda */}
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
            
            {/* Language & Currency Dropdown */}
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login/Admin */}
          <div className="w-8 relative h-8" ref={loginDropdownRef}>
            <button 
              onClick={() => setShowLoginDropdown(!showLoginDropdown)}
              className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            >
              <Image
                className="h-full w-full object-contain"
                width={16}
                height={16}
                sizes="100vw"
                alt="Perfil de usuario"
                src="/icon1.svg"
              />
            </button>
            
            {/* User/Admin Dropdown */}
            <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
              showLoginDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
              <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                  {isAuthenticated ? (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">
                          {t('MI CUENTA')}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {t('Bienvenido')}, {user?.nombres || user?.correo}
                        </p>
                      </div>
                      
                      <div className="space-y-3 flex-1">
                        {user?.rol && canAccessAdminPanel(user.rol) && (
                          <Link 
                            href="/admin" 
                            className="block w-full text-left px-4 py-3 text-white bg-green-600 hover:bg-green-700 transition-colors rounded-md no-underline"
                          >
                            <div className="flex items-center gap-3">
                              <span>🛠️</span>
                              <span>{t('Panel de Administración')}</span>
                            </div>
                          </Link>
                        )}
                        
                        <button 
                          onClick={logout}
                          className="w-full text-left px-4 py-3 text-white bg-red-600 hover:bg-red-700 transition-colors rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <span>🚪</span>
                            <span>{t('Cerrar sesión')}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">
                          {t('MI CUENTA')}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {t('Inicia sesión para acceder a tu cuenta')}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Link 
                          href="/login" 
                          className="block w-full text-center px-4 py-3 text-white bg-green-600 hover:bg-green-700 transition-colors rounded-md no-underline"
                        >
                          {t('Iniciar sesión')}
                        </Link>
                        
                        <Link 
                          href="/register" 
                          className="block w-full text-center px-4 py-3 text-white border border-white/30 hover:bg-white/10 transition-colors rounded-md no-underline"
                        >
                          {t('Crear cuenta')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="w-8 relative h-8" ref={searchDropdownRef}>
            <button 
              onClick={() => setShowSearchDropdown(!showSearchDropdown)}
              className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            >
              <Image
                className="h-full w-full object-contain"
                width={16}
                height={16}
                sizes="100vw"
                alt="Buscar productos"
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
                    <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">{t('BUSCAR')}</h3>
                    <p className="text-gray-300 text-sm">
                      {t('Encuentra exactamente lo que buscas en nuestra colección.')}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      placeholder={t('Buscar productos...')}
                      className="flex-1 px-4 py-2 bg-black/50 border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      {t('Buscar')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carrito */}
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
                                {item.hasDiscount ? (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-red-400 line-through">
                                      {formatPrice(item.price, currentCurrency, 'MXN')}
                                    </span>
                                    <span className="text-white font-bold">
                                      {formatPrice(item.finalPrice, currentCurrency, 'MXN')}
                                    </span>
                                    <span className="text-xs text-yellow-400">
                                      -{item.discountPercentage}% OFF
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-white font-bold">
                                    {formatPrice(item.finalPrice, currentCurrency, 'MXN')}
                                  </span>
                                )}
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
                                  <button 
                                    onClick={() => removeFromCart(item.productId, item.variantId, item.tallaId)}
                                    className="w-6 h-6 bg-red-600/70 rounded text-white text-sm hover:bg-red-600 transition-colors"
                                    disabled={isLoading}
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer con total y botones */}
                  {cartItems.length > 0 && (
                    <div className="border-t border-white/20 pt-4 mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-white font-semibold">{t('Total')}</span>
                        <span className="text-white font-bold text-lg">{formatPrice(totalFinal, currentCurrency, 'MXN')}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link 
                          href="/carrito" 
                          className="flex-1 text-center px-4 py-2 border border-white/30 text-white rounded-md hover:bg-white/10 transition-colors no-underline"
                        >
                          {t('Ver carrito')}
                        </Link>
                        <Link 
                          href="/checkout" 
                          className="flex-1 text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors no-underline"
                        >
                          {t('Checkout')}
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
    </>
  );
};

export default Navbar;