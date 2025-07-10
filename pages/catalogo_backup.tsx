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
    <div className="w-full relative [background:linear-gradient(180deg,_#323232,_#000)] min-h-screen flex flex-col text-left text-Static-Body-Large-Size text-M3-white font-salsa">
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
              onClick={() => setCurrentTextIndex(0)} />
              <div className={`w-2 relative shadow-[0px_2px_4px_#000_inset] rounded-[50px] h-2 z-[2] transition-all duration-500 ease-in-out cursor-pointer ${
                currentTextIndex === 1 ? 'bg-white' : 'bg-white opacity-[0.3] hover:opacity-[0.6]'
              }`}
              onClick={() => setCurrentTextIndex(1)} />
            </div>
          </div>
          <div className="self-stretch flex flex-row items-center !pt-[15px] !pb-[15px] !pl-8 !pr-8 text-M3-white relative">
            <div className="flex-1 flex flex-row items-center justify-start gap-[33px]">
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
                    <div className="pt-6 pb-8 px-6 h-full flex flex-col overflow-y-auto">
                      <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">{t('CATEGORÍAS DE ROPA')}</h3>
                      <div className="space-y-1">
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
                        <Link href="/catalogo?categoria=ropa-interior" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>{t('Ropa Interior')}</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=trajes-baño" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>{t('Trajes de Baño')}</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=accesorios-moda" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>{t('Accesorios de Moda')}</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=calzado" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>{t('Calzado')}</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-700">
                        <p className="text-gray-400 text-sm">
                          {t('Descubre nuestra amplia colección de moda y encuentra el estilo perfecto para ti.')}
                        </p>
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
            
            <div className="flex-1 flex flex-row items-center justify-end gap-[31px]">
              <div 
                className="w-5 relative h-5 cursor-pointer hover:bg-gray-700 rounded p-1 transition-colors duration-200"
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
              <div className="w-4 relative h-[18px]" ref={loginDropdownRef}>
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
                    <div className="p-6 text-center">
                      <div className="mb-6">
                        <h3 className="text-xl text-white mb-2">{t('¡Bienvenido!')}</h3>
                        <p className="text-gray-300 text-sm">{t('Parece que no estás logueado')}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <button className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                          {t('Iniciar sesión')}
                        </button>
                        <button className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200">
                          {t('Registrarse')}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-auto p-6 border-t border-white/20">
                      <p className="text-gray-300 text-xs text-center">
                        {t('Al continuar, aceptas nuestros términos de servicio y política de privacidad.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-[15px] relative h-[15px]" ref={searchDropdownRef}>
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
              <div className="w-[19.2px] relative h-[17.5px]" ref={cartDropdownRef}>
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
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    2
                  </span>
                </button>
                
                {/* Cart Dropdown */}
                <div className={`fixed top-[82px] right-0 bg-black/30 backdrop-blur-md z-[100] transition-all duration-300 ${
                  showCartDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
                  <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">{t('CARRITO')}</h3>
                        <p className="text-gray-300 text-sm">2 {t('productos en tu carrito')}</p>
                      </div>
                      
                      {/* Lista de productos */}
                      <div className="space-y-4 flex-1 overflow-y-auto">
                        {/* Producto 1 */}
                        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 bg-gray-400 rounded-lg flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium truncate">{t('Camisa Polo Clásica')}</h4>
                              <p className="text-gray-300 text-sm">{t('Talla: M, Color: Azul')}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-white font-bold">{formatPrice(29.99)}</span>
                                <div className="flex items-center gap-2">
                                  <button className="w-6 h-6 bg-white/20 rounded text-white text-sm hover:bg-white/30 transition-colors">
                                    -
                                  </button>
                                  <span className="text-white text-sm w-8 text-center">1</span>
                                  <button className="w-6 h-6 bg-white/20 rounded text-white text-sm hover:bg-white/30 transition-colors">
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button className="text-red-400 hover:text-red-300 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Producto 2 */}
                        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 bg-gray-400 rounded-lg flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium truncate">{t('Pantalón Chino')}</h4>
                              <p className="text-gray-300 text-sm">{t('Talla: 32, Color: Negro')}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-white font-bold">{formatPrice(45.99)}</span>
                                <div className="flex items-center gap-2">
                                  <button className="w-6 h-6 bg-white/20 rounded text-white text-sm hover:bg-white/30 transition-colors">
                                    -
                                  </button>
                                  <span className="text-white text-sm w-8 text-center">1</span>
                                  <button className="w-6 h-6 bg-white/20 rounded text-white text-sm hover:bg-white/30 transition-colors">
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button className="text-red-400 hover:text-red-300 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Resumen del carrito */}
                      <div className="mt-6 pt-4 border-t border-white/20">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-300">{t('Subtotal:')}</span>
                          <span className="text-white font-bold">{formatPrice(75.98)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-300">{t('Envío:')}</span>
                          <span className="text-green-400 font-medium">{t('Gratis')}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6 text-lg">
                          <span className="text-white font-bold">{t('Total:')}</span>
                          <span className="text-white font-bold">{formatPrice(75.98)}</span>
                        </div>
                        
                        <div className="space-y-3">
                          <button className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                            {t('Finalizar Compra')}
                          </button>
                          <button className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200">
                            {t('Ver Carrito Completo')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
                    <h4 className="text-sm font-medium text-gray-300 mb-2">{t('Idioma')}</h4>
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
                    <h4 className="text-sm font-medium text-gray-300 mb-2">{t('Moneda')}</h4>
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
