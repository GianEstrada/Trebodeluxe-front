import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { canAccessAdminPanel } from '../utils/roles';
import { useCategories } from '../hooks/useCategories';

interface NavigationBarProps {
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
  currentCurrency: string;
  setCurrentCurrency: (currency: string) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  currentLanguage,
  setCurrentLanguage,
  currentCurrency,
  setCurrentCurrency
}) => {
  // Estados para dropdowns
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
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
  const { items: cartItems, totalItems, totalPrice, removeItem, updateQuantity, clearCart, isLoading } = useCart();
  
  // Usar categorías dinámicas desde la API
  const { activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();

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

  // Event listeners para clicks fuera
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
          
          {/* Dropdown de Categorías */}
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
          
          {/* Dropdown de idioma y moneda */}
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
                
                {/* Sección de idioma */}
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
                
                {/* Sección de moneda */}
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
        
        {/* Botón de Admin - Solo visible para usuarios con rol = 1 */}
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
            
            {/* Dropdown de Admin */}
            <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
              showAdminDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
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
                
                <div className="mt-auto p-6 border-t border-white/20">
                  <p className="text-gray-300 text-xs text-center">
                    {t('Acceso solo para administradores autorizados')}
                  </p>
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
          
          {/* Dropdown de Login */}
          <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
            showLoginDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
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
              width={16}
              height={18}
              sizes="100vw"
              alt="Búsqueda"
              src="/icon2.svg"
            />
          </button>
          
          {/* Dropdown de Búsqueda */}
          <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
            showSearchDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
          } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
            <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
              <div className="p-6">
                <h3 className="text-xl text-white mb-4">{t('Buscar productos')}</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder={t('¿Qué estás buscando?')}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-white"
                  />
                  <button 
                    onClick={handleSearch}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    {t('Buscar')}
                  </button>
                </div>
                <p className="text-gray-300 text-sm">
                  {t('Encuentra exactamente lo que buscas en nuestra colección.')}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Botón del Carrito */}
        <div className="w-8 relative h-8" ref={cartDropdownRef}>
          <button 
            onClick={() => setShowCartDropdown(!showCartDropdown)}
            className="w-full h-full bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity duration-200 relative"
          >
            <Image
              className="h-full w-full object-contain"
              width={16}
              height={18}
              sizes="100vw"
              alt="Carrito de compras"
              src="/icon3.svg"
            />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
          
          {/* Dropdown del Carrito */}
          {showCartDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {t('Tu Carrito')} ({totalItems})
                  </h3>
                  {cartItems.length > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          await clearCart();
                        } catch (error) {
                          console.error('Error clearing cart:', error);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                      disabled={isLoading}
                    >
                      {t('Limpiar')}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">{t('Cargando...')}</p>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Image
                      src="/icon3.svg"
                      alt="Carrito vacío"
                      width={48}
                      height={48}
                      className="mx-auto mb-3 opacity-50"
                    />
                    <p>{t('Tu carrito está vacío')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <div key={`${item.id_variante}-${item.id_talla}`} className="p-4 flex gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.imagen_url ? (
                            <Image
                              src={item.imagen_url}
                              alt={item.nombre_producto}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Sin imagen</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 truncate">
                            {item.nombre_producto}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.nombre_variante} - {item.nombre_talla}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await updateQuantity(item.id_variante, item.id_talla, item.cantidad - 1);
                                  } catch (error) {
                                    console.error('Error updating quantity:', error);
                                  }
                                }}
                                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                                disabled={isLoading || item.cantidad <= 1}
                              >
                                -
                              </button>
                              <span className="text-sm font-medium px-2">{item.cantidad}</span>
                              <button
                                onClick={async () => {
                                  try {
                                    await updateQuantity(item.id_variante, item.id_talla, item.cantidad + 1);
                                  } catch (error) {
                                    console.error('Error updating quantity:', error);
                                  }
                                }}
                                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                                disabled={isLoading}
                              >
                                +
                              </button>
                            </div>
                            
                            <button
                              onClick={async () => {
                                try {
                                  await removeItem(item.id_variante, item.id_talla);
                                } catch (error) {
                                  console.error('Error removing item:', error);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                              disabled={isLoading}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="text-right mt-1">
                            <span className="text-sm font-semibold text-gray-800">
                              ${(item.precio * item.cantidad).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {cartItems.length > 0 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold text-gray-800">{t('Envío:')}</span>
                    <span className="text-xl font-bold text-blue-600">{t('Calculado al final')}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Link href="/carrito">
                      <button
                        onClick={() => setShowCartDropdown(false)}
                        className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors duration-200 font-medium"
                      >
                        {t('Ver Carrito')}
                      </button>
                    </Link>
                    <Link href="/checkout">
                      <button
                        onClick={() => setShowCartDropdown(false)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                      >
                        {t('Finalizar Compra')}
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
