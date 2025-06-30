import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const Catalogo: NextPage = () => {
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  
  // Carrusel de texto
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const promoTexts = [
    "Agrega 4 productos y paga 2",
    "2x1 en gorras"
  ];

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

    const handleScroll = () => {
      setShowCategoriesDropdown(false);
      setShowLanguageDropdown(false);
      setShowLoginDropdown(false);
      setShowSearchDropdown(false);
      setShowCartDropdown(false);
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
  }, []); // Dependencias vacías para ejecutar solo una vez

  // Función para cambiar manualmente el texto
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

  // Función para manejar Enter en el input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full relative [background:linear-gradient(180deg,_#323232,_#000)] h-screen flex flex-col text-left text-Static-Body-Large-Size text-M3-white font-salsa overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="self-stretch flex flex-col items-start justify-start text-Schemes-On-Surface font-Static-Body-Large-Font fixed top-0 left-0 right-0 z-40">
        <div className="self-stretch flex flex-col items-start justify-start text-center text-yellow font-salsa">
          <div className="self-stretch [background:linear-gradient(90deg,_#289c28,_#0e360e)] h-10 flex flex-row items-center justify-between !p-[5px] box-border">
            <div className="w-[278px] relative tracking-[4px] leading-6 flex items-center justify-center h-[27px] shrink-0 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)]">
              <span className="text-yellow">TREBOLUXE</span>
            </div>
            
            {/* Contenido central - texto del carrusel */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-row items-center gap-2 text-olive">
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
                {promoTexts[currentTextIndex]}
              </div>
            </div>

            <div className="flex-[-0.0187] [backdrop-filter:blur(40px)] rounded-[50px] flex flex-row items-center justify-end !pt-2 !pb-2 !pl-[402px] !pr-3 relative gap-2">
              <div className="w-full absolute !!m-[0 important] h-full top-[0px] right-[0px] bottom-[0px] left-[0px] rounded-[100px] overflow-hidden hidden z-[0]">
                <div className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] [backdrop-filter:blur(50px)] [background:linear-gradient(#0d0d0d,_#0d0d0d),_rgba(191,_191,_191,_0.44)]" />
              </div>
              <div className={`w-2 relative shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25),_0px_-1px_1.3px_#fff_inset] rounded-[50px] h-2 z-[1] transition-all duration-500 ease-in-out cursor-pointer ${
                currentTextIndex === 0 ? 'bg-gold' : 'bg-springgreen opacity-[0.3] hover:opacity-[0.6]'
              }`} 
              onClick={() => handleDotClick(0)} />
              <div className={`w-2 relative shadow-[0px_2px_4px_#000_inset] rounded-[50px] h-2 z-[2] transition-all duration-500 ease-in-out cursor-pointer ${
                currentTextIndex === 1 ? 'bg-gold' : 'bg-springgreen opacity-[0.3] hover:opacity-[0.6]'
              }`}
              onClick={() => handleDotClick(1)} />
            </div>
          </div>
          
          {/* Navigation */}
          <div className="self-stretch flex flex-row items-center !pt-[15px] !pb-[15px] !pl-8 !pr-8 text-M3-white relative">
            <div className="flex-1 flex flex-row items-center justify-start gap-[33px]">
              <div 
                className="w-[177.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer"
                ref={dropdownRef}
                onMouseEnter={() => setShowCategoriesDropdown(true)}
                onMouseLeave={() => setShowCategoriesDropdown(false)}
              >
                <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-M3-white">
                  CATEGORIAS
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
                      <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">CATEGORÍAS DE ROPA</h3>
                      <div className="space-y-1">
                        <Link href="/catalogo?categoria=camisas" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Camisas</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=pantalones" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Pantalones</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=vestidos" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Vestidos</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=abrigos" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Abrigos y Chaquetas</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=faldas" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Faldas</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=jeans" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Jeans</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=ropa-interior" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Ropa Interior</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=trajes-baño" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Trajes de Baño</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=accesorios-moda" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Accesorios de Moda</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                        <Link href="/catalogo?categoria=calzado" className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md">
                          <div className="flex items-center justify-between">
                            <span>Calzado</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-700">
                        <p className="text-gray-400 text-sm">
                          Descubre nuestra amplia colección de moda y encuentra el estilo perfecto para ti.
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
              <Link href="/catalogo?filter=populares" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className="w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer">
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-M3-white">
                    POPULARES
                  </div>
                </div>
              </Link>
              <Link href="/catalogo?filter=nuevos" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className="w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer">
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-M3-white">
                    NUEVOS
                  </div>
                </div>
              </Link>
              <Link href="/catalogo?filter=basicos" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className="w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer">
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-M3-white">
                    BASICOS
                  </div>
                </div>
              </Link>
            </div>
            
            {/* Logo centrado con posicionamiento absoluto */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <Link href="/" className="text-yellow no-underline hover:text-yellow visited:text-yellow focus:text-yellow active:text-yellow">
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
                    <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">IDIOMA Y MONEDA</h3>
                    
                    {/* Language Section */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-white mb-4 tracking-[1px]">Idioma</h4>
                      <div className="space-y-1">
                        <button className="w-full text-left px-4 py-3 bg-gray-800 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🇪🇸</span>
                              <span>Español</span>
                            </div>
                            <span className="text-yellow font-bold">✓</span>
                          </div>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-700 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🇺🇸</span>
                              <span>English</span>
                            </div>
                          </div>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-700 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🇫🇷</span>
                              <span>Français</span>
                            </div>
                          </div>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-700 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🇩🇪</span>
                              <span>Deutsch</span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Currency Section */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-white mb-4 tracking-[1px]">Moneda</h4>
                      <div className="space-y-1">
                        <button className="w-full text-left px-4 py-3 bg-gray-800 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-yellow">€</span>
                              <span>EUR - Euro</span>
                            </div>
                            <span className="text-yellow font-bold">✓</span>
                          </div>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-700 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">$</span>
                              <span>USD - Dólar</span>
                            </div>
                          </div>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-700 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">£</span>
                              <span>GBP - Libra</span>
                            </div>
                          </div>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-700 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">¥</span>
                              <span>JPY - Yen</span>
                            </div>
                          </div>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-gray-700 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-white">$</span>
                              <span>MXN - Peso Mexicano</span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-6 border-t border-gray-600">
                      <p className="text-gray-300 text-sm">
                        Selecciona tu idioma preferido y la moneda para ver los precios actualizados.
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
                        <h3 className="text-xl text-white mb-2">¡Bienvenido!</h3>
                        <p className="text-gray-300 text-sm">Parece que no estás logueado</p>
                      </div>
                      
                      <div className="space-y-4">
                        <button className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                          Iniciar sesión
                        </button>
                        <button className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200">
                          Registrarse
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-auto p-6 border-t border-white/20">
                      <p className="text-gray-300 text-xs text-center">
                        Al continuar, aceptas nuestros términos de servicio y política de privacidad.
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
                        <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">BÚSQUEDA</h3>
                        <p className="text-gray-300 text-sm">Encuentra los productos que buscas</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="¿Qué estás buscando?"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            className="w-full bg-white/20 border border-white/30 rounded-lg py-3 px-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                          />
                        </div>
                        <button 
                          onClick={handleSearch}
                          className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Buscar
                        </button>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-white/20">
                        <h4 className="text-white font-semibold mb-3">Búsquedas populares:</h4>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => window.location.href = '/catalogo?busqueda=Camisas'}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            Camisas
                          </button>
                          <button 
                            onClick={() => window.location.href = '/catalogo?busqueda=Pantalones'}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            Pantalones
                          </button>
                          <button 
                            onClick={() => window.location.href = '/catalogo?busqueda=Vestidos'}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            Vestidos
                          </button>
                          <button 
                            onClick={() => window.location.href = '/catalogo?busqueda=Zapatos'}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            Zapatos
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto p-6 border-t border-white/20">
                      <p className="text-gray-300 text-xs text-center">
                        Utiliza filtros para encontrar exactamente lo que necesitas.
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
                        <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">CARRITO</h3>
                        <p className="text-gray-300 text-sm">2 productos en tu carrito</p>
                      </div>
                      
                      {/* Lista de productos */}
                      <div className="space-y-4 flex-1 overflow-y-auto">
                        {/* Producto 1 */}
                        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 bg-gray-400 rounded-lg flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium truncate">Camisa Polo Clásica</h4>
                              <p className="text-gray-300 text-sm">Talla: M, Color: Azul</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-white font-bold">€29.99</span>
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
                              <h4 className="text-white font-medium truncate">Pantalón Chino</h4>
                              <p className="text-gray-300 text-sm">Talla: 32, Color: Negro</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-white font-bold">€45.99</span>
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
                          <span className="text-gray-300">Subtotal:</span>
                          <span className="text-white font-bold">€75.98</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-300">Envío:</span>
                          <span className="text-green-400 font-medium">Gratis</span>
                        </div>
                        <div className="flex justify-between items-center mb-6 text-lg">
                          <span className="text-white font-bold">Total:</span>
                          <span className="text-white font-bold">€75.98</span>
                        </div>
                        
                        <div className="space-y-3">
                          <button className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                            Finalizar Compra
                          </button>
                          <button className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200">
                            Ver Carrito Completo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>        </div>

        {/* Page Title */}
        <div className="self-stretch flex flex-col items-center justify-start !pt-8 !pb-8 !pl-8 !pr-8">
          <h1 className="text-6xl font-bold text-M3-white tracking-[5px] leading-[100px] [text-shadow:0px_14px_4px_rgba(0,_0,_0,_0.29)]">
            CATÁLOGO
          </h1>
        </div>

        {/* Products Grid - This section should fill remaining space */}
        <div className="flex-1 bg-gray-200 flex flex-col items-center justify-start !pt-8 !pb-8 !pl-8 !pr-8 font-Body-Font-Family min-h-0">
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* Product Card 1 */}
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 hover:bg-[#279a27] transition-colors duration-300 cursor-pointer group">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-full flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%] text-white group-hover:text-black transition-colors duration-300">Producto 1</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold text-white group-hover:text-black transition-colors duration-300">$29.99</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%] text-gray-300 group-hover:text-black transition-colors duration-300">Descripción del producto 1</div>
              </div>
            </div>
          </div>

          {/* Product Card 2 */}
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 hover:bg-[#279a27] transition-colors duration-300 cursor-pointer group">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-full flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%] text-white group-hover:text-black transition-colors duration-300">Producto 2</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold text-white group-hover:text-black transition-colors duration-300">$39.99</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%] text-gray-300 group-hover:text-black transition-colors duration-300">Descripción del producto 2</div>
              </div>
            </div>
          </div>

          {/* Product Card 3 */}
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 hover:bg-[#279a27] transition-colors duration-300 cursor-pointer group">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-full flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%] text-white group-hover:text-black transition-colors duration-300">Producto 3</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold text-white group-hover:text-black transition-colors duration-300">$49.99</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%] text-gray-300 group-hover:text-black transition-colors duration-300">Descripción del producto 3</div>
              </div>
            </div>
          </div>

          {/* Product Card 4 */}
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 hover:bg-[#279a27] transition-colors duration-300 cursor-pointer group">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-full flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%] text-white group-hover:text-black transition-colors duration-300">Producto 4</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold text-white group-hover:text-black transition-colors duration-300">$59.99</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%] text-gray-300 group-hover:text-black transition-colors duration-300">Descripción del producto 4</div>
              </div>
            </div>
          </div>

          {/* Product Card 5 */}
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 hover:bg-[#279a27] transition-colors duration-300 cursor-pointer group">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-full flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%] text-white group-hover:text-black transition-colors duration-300">Producto 5</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold text-white group-hover:text-black transition-colors duration-300">$69.99</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%] text-gray-300 group-hover:text-black transition-colors duration-300">Descripción del producto 5</div>
              </div>
            </div>
          </div>

          {/* Product Card 6 */}
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 hover:bg-[#279a27] transition-colors duration-300 cursor-pointer group">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-full flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%] text-white group-hover:text-black transition-colors duration-300">Producto 6</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold text-white group-hover:text-black transition-colors duration-300">$79.99</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%] text-gray-300 group-hover:text-black transition-colors duration-300">Descripción del producto 6</div>
              </div>
            </div>
          </div>

          {/* Product Card 7 */}
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 hover:bg-[#279a27] transition-colors duration-300 cursor-pointer group">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-full flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%] text-white group-hover:text-black transition-colors duration-300">Producto 7</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold text-white group-hover:text-black transition-colors duration-300">$89.99</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%] text-gray-300 group-hover:text-black transition-colors duration-300">Descripción del producto 7</div>
              </div>
            </div>
          </div>

          {/* Product Card 8 */}
          <div className="shadow-[0px_18px_13.1px_16px_rgba(0,_0,_0,_0.31)] rounded-Radius-200 bg-Background-Brand-Default border-forestgreen border-solid border-Stroke-Border box-border flex flex-col items-start justify-start !p-Space-400 gap-Space-400 hover:bg-[#279a27] transition-colors duration-300 cursor-pointer group">
            <Image
              className="self-stretch max-w-full overflow-hidden h-[247px] shrink-0 object-cover"
              width={208}
              height={247}
              sizes="100vw"
              alt=""
              src="/image@2x.png"
            />
            <div className="w-full flex flex-col items-start justify-start gap-Space-200">
              <div className="self-stretch flex flex-row items-start justify-start">
                <div className="flex-1 relative leading-[140%] text-white group-hover:text-black transition-colors duration-300">Producto 8</div>
              </div>
              <div className="flex flex-row items-start justify-start">
                <div className="relative leading-[140%] font-semibold text-white group-hover:text-black transition-colors duration-300">$99.99</div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-start text-Body-Size-Small">
                <div className="relative leading-[140%] text-gray-300 group-hover:text-black transition-colors duration-300">Descripción del producto 8</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="self-stretch [background:linear-gradient(11.21deg,_#279a27_39.9%,_#000)] overflow-hidden shrink-0 flex flex-row items-start justify-start !pt-16 !pb-2 !pl-8 !pr-8 text-Text-Default-Tertiary font-Body-Font-Family">
        <div className="flex flex-row items-start justify-start gap-[23px]">
          <div className="w-60 flex flex-col items-start justify-start gap-Space-600 min-w-[240px]">
            <Image
              className="w-[23.3px] h-[35px]"
              width={23.3}
              height={35}
              sizes="100vw"
              alt=""
              src="/logo.svg"
            />
            <div className="flex flex-row items-center justify-start gap-Space-400">
              <Image
                className="w-6 relative h-6"
                width={24}
                height={24}
                sizes="100vw"
                alt=""
                src="/facebook.svg"
              />
              <Image
                className="w-6 relative h-6 overflow-hidden shrink-0"
                width={24}
                height={24}
                sizes="100vw"
                alt=""
                src="/instagram.svg"
              />
              <Image
                className="w-6 relative h-6 overflow-hidden shrink-0"
                width={24}
                height={24}
                sizes="100vw"
                alt=""
                src="/twitter.svg"
              />
              <Image
                className="w-6 relative h-6 overflow-hidden shrink-0"
                width={24}
                height={24}
                sizes="100vw"
                alt=""
                src="/youtube.svg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Catalogo;
