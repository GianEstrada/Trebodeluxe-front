import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import { useAuth } from "../contexts/AuthContext";
import { canAccessAdminPanel } from "../utils/roles";
import { productsApi, productUtils } from "../utils/productsApi";

const CatalogoScreen: NextPage = () => {
  const router = useRouter();
  
  // Estados para dropdowns del header
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  
  // Estados para idioma y moneda
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  
  // Sistema de traducción universal
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const { user, isAuthenticated, logout } = useAuth();
  
  // Estados específicos del catálogo
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [selectedColor, setSelectedColor] = useState("Todos");
  const [selectedSize, setSelectedSize] = useState("Todas");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Estados para datos del API
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Efecto para manejar los parámetros URL
  useEffect(() => {
    if (router.isReady) {
      const filter = router.query.filter as string;
      if (filter) {
        setActiveFilter(filter);
        
        // Si es filtro de promociones, configurar algunos valores por defecto
        if (filter === 'promociones') {
          setSelectedCategory("Todas");
        }
      }
    }
  }, [router.isReady, router.query]);
  
  // Referencias para dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  
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

  // Cargar preferencias guardadas
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  // Efecto para el carrusel de texto
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % promoTexts.length);
        setIsAnimating(false);
      }, 300);
      
    }, 3000);

    return () => clearInterval(interval);
  }, [promoTexts.length]);

  // Event listeners para cerrar dropdowns
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

  // Cargar datos del API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Determinar filtros basados en el estado actual
        const filters: any = {};
        
        if (activeFilter === 'promociones') {
          // Para promociones, usar el endpoint de mejores promociones
          const promoResponse = await productsApi.getBestPromotions(20) as any;
          if (promoResponse.success && promoResponse.products && Array.isArray(promoResponse.products)) {
            setAllProducts(promoResponse.products.map(productUtils.transformToLegacyFormat));
          }
        } else if (selectedCategory && selectedCategory !== 'Todas') {
          filters.categoria = selectedCategory;
        }
        
        if (searchTerm) {
          filters.busqueda = searchTerm;
        }
        
        // Si no es promociones, cargar productos normales
        if (activeFilter !== 'promociones') {
          const productsResponse = await productsApi.getAll(filters) as any;
          if (productsResponse.success && productsResponse.products && Array.isArray(productsResponse.products)) {
            setAllProducts(productsResponse.products.map(productUtils.transformToLegacyFormat));
          }
        }
        
        // Cargar categorías y marcas disponibles
        const [categoriesResponse, brandsResponse] = await Promise.all([
          productsApi.getCategories() as any,
          productsApi.getBrands() as any
        ]);
        
        if (categoriesResponse.success && categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data);
        }
        
        if (brandsResponse.success && brandsResponse.data && Array.isArray(brandsResponse.data)) {
          setBrands(brandsResponse.data);
        }
        
      } catch (err: any) {
        console.error('Error cargando datos:', err);
        setError(err.message || 'Error al cargar productos');
        
        // Productos de fallback en caso de error
        setAllProducts([
          {
            id: 1,
            name: "Camiseta Básica",
            price: 29.99,
            originalPrice: 39.99,
            image: "/look-polo-2-1@2x.png",
            category: "Camisetas",
            brand: "Treboluxe",
            color: "Azul",
            size: "M",
            inStock: true
          },
          {
            id: 2,
            name: "Polo Clásico",
            price: 49.99,
            originalPrice: 59.99,
            image: "/797e7904b64e13508ab322be3107e368-1@2x.png",
            category: "Polos",
            brand: "Treboluxe",
            color: "Blanco",
            size: "L",
            inStock: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeFilter, selectedCategory, searchTerm]);
  
  // Recargar cuando cambian los filtros URL
  useEffect(() => {
    if (router.isReady) {
      const filter = router.query.filter as string;
      const categoria = router.query.categoria as string;
      const busqueda = router.query.busqueda as string;
      
      if (filter !== activeFilter) {
        setActiveFilter(filter || null);
      }
      
      if (categoria && categoria !== selectedCategory) {
        setSelectedCategory(categoria);
      }
      
      if (busqueda && busqueda !== searchTerm) {
        setSearchTerm(busqueda);
      }
    }
  }, [router.isReady, router.query]);

  // Filtrar productos basado en los criterios seleccionados
  const filteredProducts = Array.isArray(allProducts) ? allProducts.filter(product => {
    const matchesSearch = searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "Todas" || product.category === selectedCategory;
    const matchesBrand = selectedBrand === "Todas" || product.brand === selectedBrand;
    const matchesColor = selectedColor === "Todos" || product.color === selectedColor;
    const matchesSize = selectedSize === "Todas" || product.size === selectedSize;
    
    // Filtro específico para promociones (productos con descuento)
    let matchesFilter = true;
    if (activeFilter === 'promociones') {
      matchesFilter = product.originalPrice > product.price; // Solo productos con descuento
    } else if (activeFilter === 'populares') {
      matchesFilter = product.inStock; // Solo productos en stock para populares
    } else if (activeFilter === 'nuevos') {
      matchesFilter = product.id > 2; // Simular productos nuevos (IDs más altos)
    } else if (activeFilter === 'basicos') {
      matchesFilter = product.category === 'Camisetas'; // Solo camisetas para básicos
    }
    
    return matchesSearch && matchesCategory && matchesBrand && matchesColor && matchesSize && matchesFilter;
  }) : [];

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
              onClick={() => handleDotClick(0)} />
              <div className={`w-2 relative shadow-[0px_2px_4px_#000_inset] rounded-[50px] h-2 z-[2] transition-all duration-500 ease-in-out cursor-pointer ${
                currentTextIndex === 1 ? 'bg-white' : 'bg-white opacity-[0.3] hover:opacity-[0.6]'
              }`}
              onClick={() => handleDotClick(1)} />
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
                <div className={`w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer ${activeFilter === 'populares' ? 'bg-green-600' : ''}`}>
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                    {t('POPULARES')}
                  </div>
                </div>
              </Link>
              <Link href="/catalogo?filter=nuevos" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className={`w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer ${activeFilter === 'nuevos' ? 'bg-green-600' : ''}`}>
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                    {t('NUEVOS')}
                  </div>
                </div>
              </Link>
              <Link href="/catalogo?filter=basicos" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className={`w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer ${activeFilter === 'basicos' ? 'bg-green-600' : ''}`}>
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                    {t('BASICOS')}
                  </div>
                </div>
              </Link>
              <Link href="/catalogo?filter=promociones" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className={`w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer ${activeFilter === 'promociones' ? 'bg-green-600' : ''}`}>
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                    {t('PROMOCIONES')}
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
              
              {/* Botón de Admin - Solo visible para usuarios con rol = 1 */}
              {user && canAccessAdminPanel(user.rol) && (
                <div className="w-4 relative h-[18px]" ref={adminDropdownRef}>
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
                  showLoginDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
                } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
                  <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                    {user ? (
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
                  showCartDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
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
                    </div>
                  </div>
                </div>
              </div>
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
              className="flex-1 px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
            />
            <button 
              onClick={handleSearch}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
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
              className="px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              disabled={loading}
            >
              <option value="Todas" className="text-black">{t('Todas las categorías')}</option>
              {Array.isArray(categories) && categories.map(category => (
                <option key={category} value={category} className="text-black">
                  {t(category)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              disabled={loading}
            >
              <option value="Todas" className="text-black">{t('Todas las marcas')}</option>
              {Array.isArray(brands) && brands.map(brand => (
                <option key={brand} value={brand} className="text-black">
                  {brand}
                </option>
              ))}
            </select>
            
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="Todos" className="text-black">{t('Todos los colores')}</option>
              <option value="Azul" className="text-black">{t('Azul')}</option>
              <option value="Blanco" className="text-black">{t('Blanco')}</option>
              <option value="Negro" className="text-black">{t('Negro')}</option>
            </select>
            
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="Todas" className="text-black">{t('Todas las tallas')}</option>
              <option value="S" className="text-black">S</option>
              <option value="M" className="text-black">M</option>
              <option value="L" className="text-black">L</option>
              <option value="XL" className="text-black">XL</option>
            </select>
          </div>
        </div>

        {/* Indicador de error */}
        {error && (
          <div className="w-full max-w-7xl mb-6">
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-red-300 font-medium">
                  {t('Error al cargar productos')}: {error}
                </span>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-red-300 hover:text-white transition-colors text-sm"
              >
                {t('Reintentar')} ↻
              </button>
            </div>
          </div>
        )}

        {/* Indicador de carga */}
        {loading && (
          <div className="w-full max-w-7xl mb-6">
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-300 font-medium">
                  {t('Cargando productos...')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de filtro activo */}
        {activeFilter && !loading && (
          <div className="w-full max-w-7xl mb-6">
            <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-medium">
                  {activeFilter === 'promociones' && t('Mostrando productos en promoción')}
                  {activeFilter === 'populares' && t('Mostrando productos populares')}
                  {activeFilter === 'nuevos' && t('Mostrando productos nuevos')}
                  {activeFilter === 'basicos' && t('Mostrando productos básicos')}
                </span>
                <span className="text-green-400 bg-green-900/30 px-2 py-1 rounded text-sm">
                  {Array.isArray(filteredProducts) ? filteredProducts.length : 0} {t('productos encontrados')}
                </span>
              </div>
              <Link href="/catalogo" className="text-green-300 hover:text-white transition-colors text-sm">
                {t('Limpiar filtro')} ✕
              </Link>
            </div>
          </div>
        )}

        {/* Grid de productos */}
        <div className="w-full max-w-7xl">
          {!loading && Array.isArray(filteredProducts) && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">{t('No se encontraron productos que coincidan con tu búsqueda.')}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.isArray(filteredProducts) && filteredProducts.map((product) => {
              const discount = productUtils.calculateDiscount(product.originalPrice, product.price);
              
              return (
                <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                  <Link href={`/producto/${product.id}`}>
                    <div className="cursor-pointer">
                      <div className="relative mb-4">
                        <Image
                          className="w-full h-64 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                          width={300}
                          height={256}
                          src={product.image || '/sin-ttulo1-2@2x.png'}
                          alt={product.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/sin-ttulo1-2@2x.png';
                          }}
                        />
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <span className="text-white font-bold text-lg">{t('Agotado')}</span>
                          </div>
                        )}
                        {discount > 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                            {discount}% OFF
                          </div>
                        )}
                        {product.variantes && product.variantes.length > 1 && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                            +{product.variantes.length - 1} {t('colores')}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-green-300 transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="space-y-1 mb-3">
                        <p className="text-gray-300 text-sm">{t('Categoría')}: {product.category}</p>
                        <p className="text-gray-300 text-sm">{t('Marca')}: {product.brand}</p>
                        {product.description && (
                          <p className="text-gray-400 text-xs line-clamp-2">{product.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-bold text-lg">{formatPrice(product.price)}</span>
                          {discount > 0 && (
                            <span className="text-gray-400 line-through text-sm">{formatPrice(product.originalPrice)}</span>
                          )}
                        </div>
                        {product.sistema_talla && (
                          <span className="text-gray-400 text-xs">{product.sistema_talla}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/producto/${product.id}`)}
                      className="flex-1 py-3 rounded-lg font-medium transition-colors duration-200 bg-white/20 text-white hover:bg-white/30 border border-white/30"
                    >
                      {t('Ver detalles')}
                    </button>
                    
                    <button
                      disabled={!product.inStock}
                      onClick={(e) => {
                        e.preventDefault();
                        if (product.inStock) {
                          // Aquí puedes agregar lógica para añadir al carrito directamente
                          console.log('Agregando al carrito:', product);
                          alert(t('Funcionalidad de carrito en desarrollo'));
                        }
                      }}
                      className={`flex-1 py-3 rounded-lg font-medium transition-colors duration-200 ${
                        product.inStock 
                          ? 'bg-white text-black hover:bg-gray-100' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {product.inStock ? t('Al carrito') : t('Agotado')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogoScreen;
