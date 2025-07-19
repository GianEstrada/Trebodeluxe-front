import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useAuth } from '../contexts/AuthContext';
import { canAccessAdminPanel } from '../utils/roles';

interface NavigationBarProps {
  currentLanguage?: string;
  currentCurrency?: string;
  onLanguageChange?: (lang: string) => void;
  onCurrencyChange?: (currency: string) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  currentLanguage = "es",
  currentCurrency = "MXN",
  onLanguageChange,
  onCurrencyChange
}) => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useUniversalTranslate(currentLanguage);

  // Estados para dropdowns
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");

  // Refs para dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // Función para cambiar idioma
  const changeLanguage = (lang: string) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
    localStorage.setItem('preferred-language', lang);
  };

  // Función para cambiar moneda
  const changeCurrency = (currency: string) => {
    if (onCurrencyChange) {
      onCurrencyChange(currency);
    }
    localStorage.setItem('preferred-currency', currency);
  };

  // Función para formatear precio con la moneda seleccionada
  const formatPrice = (price: number) => {
    const exchangeRates = {
      'EUR': 1,
      'USD': 1.1,
      'MXN': 20.5
    };
    
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'MXN': '$'
    };
    
    const convertedPrice = (price * exchangeRates[currentCurrency as keyof typeof exchangeRates]).toFixed(2);
    const symbol = symbols[currentCurrency as keyof typeof symbols];
    
    return `${symbol}${convertedPrice}`;
  };

  // Efecto para manejar clicks fuera de los dropdowns
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

  return (
    <div className="w-full relative bg-black">
      <div className="bg-black flex flex-row items-center justify-between py-[24px] px-[20px] md:px-[40px] lg:px-[80px] text-white">
        {/* Logo y categorías */}
        <div className="flex flex-row items-center gap-[40px]">
          <Link href="/" className="no-underline">
            <div className="flex flex-row items-center gap-[8px] cursor-pointer hover:opacity-80 transition-opacity duration-200">
              <div className="w-[26px] h-[26px] relative">
                <Image
                  className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] max-w-full overflow-hidden max-h-full object-contain"
                  width={26}
                  height={26}
                  alt="Logo Trebodeluxe"
                  src="/icon.svg"
                />
              </div>
              <div className="relative leading-[28px] font-medium text-white tracking-[2px]">
                TREBODELUXE
              </div>
            </div>
          </Link>

          {/* Dropdown de Categorías */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
              className="bg-transparent border-none text-white cursor-pointer hover:opacity-80 transition-opacity duration-200 tracking-[1px]"
            >
              {t('CATEGORÍAS')}
            </button>
            
            {showCategoriesDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 py-2">
                <Link href="/catalogo" onClick={() => setShowCategoriesDropdown(false)} className="block px-4 py-2 text-black hover:bg-gray-100 transition-colors duration-200 no-underline">
                  {t('Todas las Categorías')}
                </Link>
                <Link href="/catalogo?categoria=camisetas" onClick={() => setShowCategoriesDropdown(false)} className="block px-4 py-2 text-black hover:bg-gray-100 transition-colors duration-200 no-underline">
                  {t('Camisetas')}
                </Link>
                <Link href="/catalogo?categoria=pantalones" onClick={() => setShowCategoriesDropdown(false)} className="block px-4 py-2 text-black hover:bg-gray-100 transition-colors duration-200 no-underline">
                  {t('Pantalones')}
                </Link>
                <Link href="/catalogo?categoria=accesorios" onClick={() => setShowCategoriesDropdown(false)} className="block px-4 py-2 text-black hover:bg-gray-100 transition-colors duration-200 no-underline">
                  {t('Accesorios')}
                </Link>
                <Link href="/catalogo?categoria=calzado" onClick={() => setShowCategoriesDropdown(false)} className="block px-4 py-2 text-black hover:bg-gray-100 transition-colors duration-200 no-underline">
                  {t('Calzado')}
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Iconos de navegación */}
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
                    <button 
                      onClick={() => changeLanguage('fr')}
                      className={`w-full text-left px-4 py-3 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md ${
                        currentLanguage === 'fr' ? 'bg-gray-800' : 'bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🇫🇷</span>
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
          
          {/* Botón de Admin */}
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Botón de Login/Usuario */}
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
                        className="w-full bg-white/20 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/30 transition-colors duration-200 flex items-center justify-center gap-2 no-underline"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t('Mi perfil')}
                      </Link>
                      <Link 
                        href="/orders"
                        className="w-full bg-white/20 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/30 transition-colors duration-200 flex items-center justify-center gap-2 no-underline"
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
                        className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 inline-block text-center no-underline"
                      >
                        {t('Iniciar sesión')}
                      </Link>
                      <Link 
                        href="/register"
                        className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200 inline-block text-center no-underline"
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

          {/* Botón de Búsqueda */}
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
                  <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">{t('BÚSQUEDA')}</h3>
                  
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder={t('Buscar productos...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (searchTerm.trim()) {
                        router.push(`/catalogo?search=${encodeURIComponent(searchTerm)}`);
                        setShowSearchDropdown(false);
                      }
                    }}
                    className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
                  >
                    {t('Buscar')}
                  </button>
                  
                  <div className="mt-6">
                    <h4 className="text-white font-medium mb-3">{t('Búsquedas populares:')}</h4>
                    <div className="space-y-2">
                      {['Camisetas', 'Pantalones', 'Accesorios', 'Ofertas'].map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            setSearchTerm(term);
                            router.push(`/catalogo?search=${encodeURIComponent(term)}`);
                            setShowSearchDropdown(false);
                          }}
                          className="block text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                        >
                          {t(term)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Carrito */}
          <div className="w-8 relative h-8" ref={cartDropdownRef}>
            <button 
              onClick={() => setShowCartDropdown(!showCartDropdown)}
              className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            >
              <Image
                className="h-full w-full object-contain"
                width={15}
                height={15}
                sizes="100vw"
                alt="Carrito"
                src="/icon3.svg"
              />
            </button>
            
            {/* Cart Dropdown */}
            <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
              showCartDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
              <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">{t('CARRITO')}</h3>
                  
                  <div className="text-center text-gray-300 py-8">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m8-5v5a1 1 0 01-1 1H9a1 1 0 01-1-1v-5m8 0V9a1 1 0 00-1-1H9a1 1 0 00-1-1v5"/>
                    </svg>
                    <p className="mb-4">{t('Tu carrito está vacío')}</p>
                    <Link 
                      href="/catalogo"
                      onClick={() => setShowCartDropdown(false)}
                      className="inline-block bg-white text-black py-2 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 no-underline"
                    >
                      {t('Explorar productos')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
