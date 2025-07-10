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
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [selectedPrice, setSelectedPrice] = useState("Todos");
  const [selectedColor, setSelectedColor] = useState("Todos");
  const [selectedSize, setSelectedSize] = useState("Todas");
  const [screenSize, setScreenSize] = useState<'small' | 'large'>('large');
  
  // Referencias para dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const filtersDropdownRef = useRef<HTMLDivElement>(null);
  
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
      if (filtersDropdownRef.current && !filtersDropdownRef.current.contains(event.target as Node)) {
        setShowFiltersDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth >= 768 ? 'large' : 'small');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full relative [background:linear-gradient(180deg,_#323232,_#000)] min-h-screen flex flex-col text-left text-Static-Body-Large-Size text-M3-white font-salsa">
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="self-stretch flex flex-col items-start justify-start text-Schemes-On-Surface font-Static-Body-Large-Font flex-shrink-0">
        {/* Barra superior promocional */}
        <div className="self-stretch bg-M3-white flex flex-row items-center justify-center py-2 px-4 text-center text-M3-on-primary font-Static-Body-Large-Font">
          <div className="flex items-center justify-center min-h-[24px] w-full">
            <div className={`text-black font-semibold transition-all duration-300 ${
              isAnimating ? 'transform scale-110 opacity-70' : 'transform scale-100 opacity-100'
            }`}>
              {t(promoTexts[currentTextIndex])}
            </div>
          </div>
        </div>

        {/* Barra de navegación principal */}
        <div className="self-stretch bg-M3-white flex flex-row items-center justify-between py-4 px-6 text-left text-M3-on-primary font-Static-Body-Large-Font">
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
                <span className="font-medium">{t('CATEGORÍAS')}</span>
                <Image
                  className="w-4 h-4"
                  width={16}
                  height={16}
                  alt="Dropdown"
                  src="/more.svg"
                />
              </button>
              
              {showCategoriesDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <Link href="/catalogo" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    {t('Todas las categorías')}
                  </Link>
                  <Link href="/catalogo?categoria=camisetas" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    {t('Camisetas')}
                  </Link>
                  <Link href="/catalogo?categoria=polos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    {t('Polos')}
                  </Link>
                </div>
              )}
            </div>

            {/* Enlace al catálogo */}
            <Link href="/catalogo" className="text-black hover:text-gray-700 transition-colors duration-200 font-medium">
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
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-black mb-4">Idioma y Moneda</h3>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Idioma</h4>
                      <div className="space-y-1">
                        <button
                          onClick={() => changeLanguage('es')}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
                            currentLanguage === 'es' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                          }`}
                        >
                          🇪🇸 Español
                        </button>
                        <button
                          onClick={() => changeLanguage('en')}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
                            currentLanguage === 'en' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                          }`}
                        >
                          🇺🇸 English
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Moneda</h4>
                      <div className="space-y-1">
                        <button
                          onClick={() => changeCurrency('MXN')}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
                            currentCurrency === 'MXN' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                          }`}
                        >
                          $ MXN - Peso Mexicano
                        </button>
                        <button
                          onClick={() => changeCurrency('USD')}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
                            currentCurrency === 'USD' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                          }`}
                        >
                          $ USD - Dólar Americano
                        </button>
                        <button
                          onClick={() => changeCurrency('EUR')}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
                            currentCurrency === 'EUR' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                          }`}
                        >
                          € EUR - Euro
                        </button>
                      </div>
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
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-black mb-4">Iniciar Sesión</h3>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="password"
                        placeholder="Contraseña"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <button className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-colors duration-200">
                        Iniciar Sesión
                      </button>
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
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="p-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200"
                      >
                        Buscar
                      </button>
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
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-black mb-4">Carrito de Compras</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">Camiseta Básica</span>
                        <span className="font-semibold text-black">{formatPrice(29.99)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">Polo Elegante</span>
                        <span className="font-semibold text-black">{formatPrice(49.99)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 font-bold">
                        <span>Total:</span>
                        <span>{formatPrice(79.98)}</span>
                      </div>
                      <button className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-colors duration-200">
                        Ver Carrito Completo
                      </button>
                    </div>
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
          <h1 className="text-4xl font-bold text-white mb-2">CATÁLOGO</h1>
          <p className="text-gray-300 text-lg">Descubre nuestra colección completa</p>
        </div>

        {/* Barra de búsqueda */}
        <div className="w-full max-w-7xl mb-8">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
            >
              Buscar
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
              <option value="Todas">Todas las categorías</option>
              <option value="Camisetas">Camisetas</option>
              <option value="Polos">Polos</option>
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="Todas">Todas las marcas</option>
              <option value="Trebodeluxe">Trebodeluxe</option>
            </select>

            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="Todos">Todos los colores</option>
              <option value="Azul">Azul</option>
              <option value="Blanco">Blanco</option>
            </select>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300">
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
                      NUEVO
                    </span>
                  )}
                  {product.discount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      -{product.discount}%
                    </span>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold text-lg">{formatPrice(product.price)}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-gray-400 line-through text-sm">{formatPrice(product.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
                    <span>Talla: {product.size}</span>
                    <span>Color: {product.color}</span>
                  </div>
                  
                  <button className="w-full bg-white text-black py-2 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium">
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogoScreen;
