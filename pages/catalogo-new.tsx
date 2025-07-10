import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";

const CatalogoScreen: NextPage = () => {
  // Estados para dropdowns del header
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  
  // Estados para idioma y moneda
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  
  // Sistema de traducción universal
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  
  // Estados específicos del catálogo
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [selectedColor, setSelectedColor] = useState("Todos");
  const [selectedSize, setSelectedSize] = useState("Todas");
  
  // Referencias para dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  
  // Estados para el carrusel del header
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Textos del carrusel
  const promoTexts = [
    "Agrega 4 productos y paga 2",
    "2x1 en gorras"
  ];

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

  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (searchTerm.trim()) {
      window.location.href = `/catalogo?busqueda=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  // Función para manejar Enter en el input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Datos simulados de productos
  const allProducts = [
    {
      id: 1,
      name: "Camiseta Básica",
      price: 29.99,
      originalPrice: 39.99,
      image: "/look-polo-2-1@2x.png",
      category: "Camisetas",
      brand: "Trebodeluxe",
      color: "Azul",
      size: "M",
      discount: 25,
      isNew: true
    },
    {
      id: 2,
      name: "Polo Elegante",
      price: 49.99,
      originalPrice: 59.99,
      image: "/sin-ttulo1-2@2x.png",
      category: "Polos",
      brand: "Trebodeluxe",
      color: "Blanco",
      size: "L",
      discount: 17,
      isNew: false
    },
    {
      id: 3,
      name: "Camiseta Premium",
      price: 39.99,
      originalPrice: 49.99,
      image: "/look-polo-2-1@2x.png",
      category: "Camisetas",
      brand: "Trebodeluxe",
      color: "Negro",
      size: "S",
      discount: 20,
      isNew: true
    },
    {
      id: 4,
      name: "Polo Deportivo",
      price: 44.99,
      originalPrice: 54.99,
      image: "/sin-ttulo1-2@2x.png",
      category: "Polos",
      brand: "Trebodeluxe",
      color: "Azul",
      size: "XL",
      discount: 18,
      isNew: false
    }
  ];

  // Filtrar productos
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || product.category === selectedCategory;
    const matchesBrand = selectedBrand === "Todas" || product.brand === selectedBrand;
    const matchesColor = selectedColor === "Todos" || product.color === selectedColor;
    const matchesSize = selectedSize === "Todas" || product.size === selectedSize;
    
    return matchesSearch && matchesCategory && matchesBrand && matchesColor && matchesSize;
  });

  // Efectos para carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex((prev) => (prev + 1) % promoTexts.length);
        setIsAnimating(false);
      }, 150);
    }, 3000);

    return () => clearInterval(interval);
  }, [promoTexts.length]);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar preferencias guardadas
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
    if (savedCurrency) {
      setCurrentCurrency(savedCurrency);
    }
  }, []);

  return (
    <div className="w-full relative bg-gradient-to-b from-gray-800 to-black min-h-screen flex flex-col text-left text-white font-salsa">
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="self-stretch flex flex-col items-start justify-start text-black font-inter flex-shrink-0">
        {/* Barra superior promocional */}
        <div className="self-stretch bg-white flex flex-row items-center justify-center py-2 px-4 text-center text-black font-inter">
          <div className="flex items-center justify-center min-h-[24px] w-full">
            <div className={`text-black font-semibold transition-all duration-300 ${
              isAnimating ? 'transform scale-110 opacity-70' : 'transform scale-100 opacity-100'
            }`}>
              {t(promoTexts[currentTextIndex])}
            </div>
          </div>
        </div>

        {/* Barra de navegación principal */}
        <div className="self-stretch bg-white flex flex-row items-center justify-between py-4 px-6 text-left text-black font-inter">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                className="w-[100px] h-[40px] object-contain"
                width={100}
                height={40}
                alt="Logo"
                src="/797e7904b64e13508ab322be3107e368-1@2x.png"
              />
            </Link>
          </div>

          {/* Navegación central */}
          <div className="flex items-center space-x-8">
            {/* Categorías dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                className="flex items-center space-x-2 text-black hover:text-gray-700 transition-colors duration-200"
              >
                <span className="font-medium tracking-[2px]">{t('CATEGORÍAS')}</span>
                <Image
                  className="w-4 h-4"
                  width={16}
                  height={16}
                  alt="Dropdown"
                  src="/more.svg"
                />
              </button>
              
              {showCategoriesDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg z-50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 tracking-[2px]">{t('CATEGORÍAS')}</h3>
                  <div className="space-y-2">
                    <Link href="/catalogo" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                      <div className="flex items-center justify-between">
                        <span>{t('Todas las categorías')}</span>
                        <span className="text-gray-400">→</span>
                      </div>
                    </Link>
                    <Link href="/catalogo?categoria=camisetas" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                      <div className="flex items-center justify-between">
                        <span>{t('Camisetas')}</span>
                        <span className="text-gray-400">→</span>
                      </div>
                    </Link>
                    <Link href="/catalogo?categoria=polos" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                      <div className="flex items-center justify-between">
                        <span>{t('Polos')}</span>
                        <span className="text-gray-400">→</span>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Enlace al catálogo */}
            <Link href="/catalogo" className="text-black hover:text-gray-700 transition-colors duration-200 font-medium tracking-[2px]">
              {t('CATÁLOGO')}
            </Link>
          </div>

          {/* Controles de usuario */}
          <div className="flex items-center space-x-4">
            {/* Idioma y moneda */}
            <div className="relative" ref={languageDropdownRef}>
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center space-x-2 text-black hover:text-gray-700 transition-colors duration-200"
              >
                <Image
                  className="w-4 h-4"
                  width={16}
                  height={16}
                  alt="Idioma"
                  src="/icon.svg"
                />
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg z-50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 tracking-[2px]">{t('IDIOMA Y MONEDA')}</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">{t('Idioma')}</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => changeLanguage('es')}
                        className={`w-full text-left px-4 py-3 rounded-md transition-colors duration-200 ${
                          currentLanguage === 'es' ? 'bg-gray-800 text-white' : 'text-white hover:bg-gray-700'
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
                        className={`w-full text-left px-4 py-3 rounded-md transition-colors duration-200 ${
                          currentLanguage === 'en' ? 'bg-gray-800 text-white' : 'text-white hover:bg-gray-700'
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
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">{t('Moneda')}</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => changeCurrency('MXN')}
                        className={`w-full text-left px-4 py-3 rounded-md transition-colors duration-200 ${
                          currentCurrency === 'MXN' ? 'bg-gray-800 text-white' : 'text-white hover:bg-gray-700'
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
                        className={`w-full text-left px-4 py-3 rounded-md transition-colors duration-200 ${
                          currentCurrency === 'USD' ? 'bg-gray-800 text-white' : 'text-white hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">$</span>
                            <span>USD - Dólar Americano</span>
                          </div>
                          {currentCurrency === 'USD' && <span className="text-white font-bold">✓</span>}
                        </div>
                      </button>
                      <button
                        onClick={() => changeCurrency('EUR')}
                        className={`w-full text-left px-4 py-3 rounded-md transition-colors duration-200 ${
                          currentCurrency === 'EUR' ? 'bg-gray-800 text-white' : 'text-white hover:bg-gray-700'
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
                </div>
              )}
            </div>

            {/* Login */}
            <div className="relative" ref={loginDropdownRef}>
              <button
                onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                className="flex items-center space-x-2 text-black hover:text-gray-700 transition-colors duration-200"
              >
                <Image
                  className="w-4 h-4"
                  width={16}
                  height={16}
                  alt="Login"
                  src="/icon1.svg"
                />
              </button>
              
              {showLoginDropdown && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg z-50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 tracking-[2px]">{t('INICIAR SESIÓN')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t('Correo electrónico')}</label>
                      <input
                        type="email"
                        placeholder={t('Ingresa tu correo')}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">{t('Contraseña')}</label>
                      <input
                        type="password"
                        placeholder={t('Ingresa tu contraseña')}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                    </div>
                    <button className="w-full bg-white text-black py-3 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium">
                      {t('Iniciar Sesión')}
                    </button>
                    <div className="text-center">
                      <a href="#" className="text-gray-300 hover:text-white text-sm">{t('¿Olvidaste tu contraseña?')}</a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Búsqueda */}
            <div className="relative" ref={searchDropdownRef}>
              <button
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                className="flex items-center space-x-2 text-black hover:text-gray-700 transition-colors duration-200"
              >
                <Image
                  className="w-4 h-4"
                  width={16}
                  height={16}
                  alt="Búsqueda"
                  src="/icon2.svg"
                />
              </button>
              
              {showSearchDropdown && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg z-50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 tracking-[2px]">{t('BUSCAR')}</h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder={t('Buscar productos...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                      <button
                        onClick={handleSearch}
                        className="px-6 py-3 bg-white text-black rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium"
                      >
                        {t('Buscar')}
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">
                      {t('Busca por nombre, categoría o marca')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Carrito */}
            <div className="relative" ref={cartDropdownRef}>
              <button
                onClick={() => setShowCartDropdown(!showCartDropdown)}
                className="flex items-center space-x-2 text-black hover:text-gray-700 transition-colors duration-200"
              >
                <Image
                  className="w-4 h-4"
                  width={16}
                  height={16}
                  alt="Carrito"
                  src="/icon3.svg"
                />
              </button>
              
              {showCartDropdown && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg z-50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 tracking-[2px]">{t('CARRITO')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <Image
                          className="w-12 h-12 object-cover rounded"
                          width={48}
                          height={48}
                          alt="Producto"
                          src="/look-polo-2-1@2x.png"
                        />
                        <div>
                          <p className="text-white font-medium">{t('Camiseta Básica')}</p>
                          <p className="text-gray-400 text-sm">{t('Talla: M')}</p>
                        </div>
                      </div>
                      <span className="text-white font-bold">{formatPrice(29.99)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <Image
                          className="w-12 h-12 object-cover rounded"
                          width={48}
                          height={48}
                          alt="Producto"
                          src="/sin-ttulo1-2@2x.png"
                        />
                        <div>
                          <p className="text-white font-medium">{t('Polo Elegante')}</p>
                          <p className="text-gray-400 text-sm">{t('Talla: L')}</p>
                        </div>
                      </div>
                      <span className="text-white font-bold">{formatPrice(49.99)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <span className="text-white font-bold text-lg">{t('Total:')}</span>
                      <span className="text-white font-bold text-lg">{formatPrice(79.98)}</span>
                    </div>
                    <button className="w-full bg-white text-black py-3 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium">
                      {t('Ver Carrito Completo')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido principal del catálogo */}
      <div className="self-stretch flex-1 flex flex-col items-center justify-start px-4 py-8 min-h-screen">
        {/* Título de página */}
        <div className="w-full max-w-7xl mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-[2px]">{t('CATÁLOGO')}</h1>
          <p className="text-gray-300 text-lg">{t('Descubre nuestra colección completa')}</p>
        </div>

        {/* Barra de búsqueda */}
        <div className="w-full max-w-7xl mb-8">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder={t('Buscar productos...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
            >
              {t('Buscar')}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="w-full max-w-7xl mb-8">
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="Todas" className="text-black">{t('Todas las categorías')}</option>
              <option value="Camisetas" className="text-black">{t('Camisetas')}</option>
              <option value="Polos" className="text-black">{t('Polos')}</option>
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="Todas" className="text-black">{t('Todas las marcas')}</option>
              <option value="Trebodeluxe" className="text-black">Trebodeluxe</option>
            </select>

            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="Todos" className="text-black">{t('Todos los colores')}</option>
              <option value="Azul" className="text-black">{t('Azul')}</option>
              <option value="Blanco" className="text-black">{t('Blanco')}</option>
              <option value="Negro" className="text-black">{t('Negro')}</option>
            </select>

            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="Todas" className="text-black">{t('Todas las tallas')}</option>
              <option value="S" className="text-black">S</option>
              <option value="M" className="text-black">M</option>
              <option value="L" className="text-black">L</option>
              <option value="XL" className="text-black">XL</option>
            </select>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 border border-white/20">
                <div className="relative">
                  <Image
                    className="w-full h-64 object-cover"
                    width={300}
                    height={256}
                    alt={product.name}
                    src={product.image}
                  />
                  {product.isNew && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      {t('NUEVO')}
                    </span>
                  )}
                  {product.discount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      -{product.discount}%
                    </span>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2">{t(product.name)}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold text-lg">{formatPrice(product.price)}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-gray-400 line-through text-sm">{formatPrice(product.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
                    <span>{t('Talla')}: {product.size}</span>
                    <span>{t('Color')}: {t(product.color)}</span>
                  </div>
                  
                  <button className="w-full bg-white text-black py-2 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium">
                    {t('Agregar al Carrito')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">{t('No se encontraron productos que coincidan con tu búsqueda.')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogoScreen;
