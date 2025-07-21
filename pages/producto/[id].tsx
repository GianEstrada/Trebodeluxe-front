import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useUniversalTranslate } from '../../hooks/useUniversalTranslate';
import { useAuth } from '../../contexts/AuthContext';
import { productsApi, productUtils } from '../../utils/productsApi';

// Definimos el tipo Product para este archivo
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  brand: string;
  color?: string;
  size?: string;
  inStock: boolean;
  description?: string;
  features?: string[];
  materials?: string[];
  sizes?: string[];
  colors?: string[];
  // Nuevas propiedades de la API
  variantes?: any[];
  tallas_disponibles?: any[];
  stock?: any[];
  sistema_talla?: string;
}

const ProductPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, logout } = useAuth();
  
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
  
  // Estados específicos del producto
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  
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
    "ENVIO GRATIS EN PEDIDOS ARRIBA DE $500 MXN",
    "OFERTA ESPECIAL: 20% DE DESCUENTO EN SEGUNDA PRENDA"
  ];

  // Datos de productos simulados
  const products: Product[] = [
    {
      id: 1,
      name: "Camiseta Básica Premium",
      price: 24.99,
      originalPrice: 29.99,
      image: "/797e7904b64e13508ab322be3107e368-1@2x.png",
      category: "Camisetas",
      brand: "TreboLuxe",
      color: "Blanco",
      size: "M",
      inStock: true,
      description: "Camiseta básica de algodón 100% premium, perfecta para el uso diario. Diseño clásico y cómodo que combina con cualquier outfit.",
      features: [
        "Algodón 100% premium",
        "Corte clásico",
        "Cuello redondo",
        "Manga corta",
        "Lavable a máquina"
      ],
      materials: ["100% Algodón orgánico"],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: ["Blanco", "Negro", "Gris", "Azul marino"]
    },
    {
      id: 2,
      name: "Pantalón Chino Classic",
      price: 48.99,
      originalPrice: 59.99,
      image: "/sin-ttulo1-2@2x.png",
      category: "Pantalones",
      brand: "ClassicFit",
      color: "Beige",
      size: "32",
      inStock: true,
      description: "Pantalón chino clásico de corte moderno. Ideal para looks casuales y semi-formales.",
      features: [
        "Corte moderno",
        "Tela stretch",
        "Cintura ajustable",
        "Bolsillos funcionales",
        "Resistente al desgaste"
      ],
      materials: ["97% Algodón", "3% Elastano"],
      sizes: ["28", "30", "32", "34", "36", "38"],
      colors: ["Beige", "Negro", "Azul marino", "Gris"]
    }
  ];

  // Funciones para cambiar idioma y moneda
  const changeLanguage = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    localStorage.setItem('preferred-language', newLanguage);
    setShowLanguageDropdown(false);
  };

  const changeCurrency = (newCurrency: string) => {
    setCurrentCurrency(newCurrency);
    localStorage.setItem('preferred-currency', newCurrency);
    setShowLanguageDropdown(false);
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
      router.push(`/catalogo?busqueda=${encodeURIComponent(searchTerm.trim())}`);
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

  // Cargar producto desde la API
  useEffect(() => {
    const loadProduct = async () => {
      if (!id || Array.isArray(id)) return;
      
      setLoading(true);
      
      try {
        const response = await productsApi.getById(parseInt(id)) as any;
        if (response.success && response.product) {
          const transformedProduct = productUtils.transformToLegacyFormat(response.product);
          if (transformedProduct) {
            setProduct(transformedProduct);
            
            // Configurar talla por defecto desde tallas_disponibles
            if (transformedProduct.tallas_disponibles && transformedProduct.tallas_disponibles.length > 0) {
              setSelectedSize(transformedProduct.tallas_disponibles[0].nombre);
            }
            
            // Configurar color por defecto desde la primera variante
            if (transformedProduct.variantes && transformedProduct.variantes.length > 0) {
              setSelectedColor(transformedProduct.variantes[0].nombre);
            }
          } else {
            setProduct(null);
          }
        } else {
          setProduct(null);
        }
      } catch (err: any) {
        console.error('Error cargando producto:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

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
    };

    const handleScroll = () => {
      setShowCategoriesDropdown(false);
      setShowLanguageDropdown(false);
      setShowLoginDropdown(false);
      setShowSearchDropdown(false);
      setShowCartDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleAddToCart = () => {
    if (!product || !selectedSize || !selectedColor) return;
    alert(t('Producto agregado al carrito'));
  };

  const handleBuyNow = () => {
    if (!product || !selectedSize || !selectedColor) return;
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="w-full relative [background:linear-gradient(180deg,_#000,_#1a6b1a)] min-h-screen flex items-center justify-center text-white">
        <div className="text-xl">{t('Cargando...')}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full relative [background:linear-gradient(180deg,_#000,_#1a6b1a)] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl mb-4">{t('Producto no encontrado')}</h1>
          <Link 
            href="/"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
          >
            {t('Volver al inicio')}
          </Link>
        </div>
      </div>
    );
  }

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
      
      {/* Header igual al del index */}
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
              
              {/* Botón de Admin - Solo visible para usuarios autenticados y administradores */}
              {user && (
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
                  showLoginDropdown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                } w-80 max-w-[90vw] sm:w-96 h-[calc(100vh-82px)] overflow-hidden`}>
                  <div className="w-full h-full bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col">
                    {user ? (
                      // Usuario logueado
                      <div className="p-6">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {user.nombres.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-xl text-white mb-1">{t('¡Hola, {{name}}!').replace('{{name}}', `${user.nombres} ${user.apellidos}`)}</h3>
                          <p className="text-gray-300 text-sm">{user.correo}</p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <Link 
                            href="/profile"
                            className="w-full bg-white/20 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/30 transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {t('Mi perfil')}
                          </Link>
                          <Link 
                            href="/orders"
                            className="w-full bg-white/20 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/30 transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {t('Mis pedidos')}
                          </Link>
                        </div>
                        
                        <button 
                          onClick={logout}
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
                            className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 inline-block text-center"
                          >
                            {t('Iniciar sesión')}
                          </Link>
                          <Link 
                            href="/register"
                            className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200 inline-block text-center"
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
                            onClick={() => router.push('/catalogo?busqueda=Camisas')}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            {t('Camisas')}
                          </button>
                          <button 
                            onClick={() => router.push('/catalogo?busqueda=Pantalones')}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            {t('Pantalones')}
                          </button>
                          <button 
                            onClick={() => router.push('/catalogo?busqueda=Vestidos')}
                            className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                          >
                            {t('Vestidos')}
                          </button>
                          <button 
                            onClick={() => router.push('/catalogo?busqueda=Zapatos')}
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

      {/* Contenido principal del producto */}
      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors no-underline text-gray-400">{t('Inicio')}</Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-white transition-colors no-underline text-gray-400">{t('Catálogo')}</Link>
          <span>/</span>
          <span className="text-white">{t(product.name)}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Imagen del producto */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <Image
                src={product.image}
                alt={product.name}
                width={500}
                height={500}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">{t(product.name)}</h1>
              <p className="text-gray-400 mb-4">{t(product.brand)}</p>
              
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-green-400">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <p className="text-gray-300 leading-relaxed text-lg">
                {t(product.description || '')}
              </p>
            </div>

            {/* Estado de stock */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">
                {product.inStock ? t('En stock') : t('Agotado')}
              </span>
            </div>

            {/* Selecciones */}
            <div className="space-y-6">
              {/* Talla */}
              <div>
                <label className="block text-sm font-medium mb-3 text-white">
                  {t('Talla')}
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg backdrop-blur-md transition-all duration-300 ${
                        selectedSize === size
                          ? 'bg-black/60 border-2 border-green-400 text-green-400 font-bold shadow-lg shadow-green-400/20'
                          : 'bg-black/40 border border-white/20 text-white hover:bg-black/60 hover:border-green-400/50 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-3 text-white">
                  {t('Color')}
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.colors?.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg backdrop-blur-md transition-all duration-300 ${
                        selectedColor === color
                          ? 'bg-black/60 border-2 border-green-400 text-green-400 font-bold shadow-lg shadow-green-400/20'
                          : 'bg-black/40 border border-white/20 text-white hover:bg-black/60 hover:border-green-400/50 hover:text-white'
                      }`}
                    >
                      {t(color)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium mb-3 text-white">
                  {t('Cantidad')}
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center hover:bg-black/70 hover:border-green-400/50 transition-all duration-300 text-white hover:text-white text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-white text-lg font-medium bg-black/50 backdrop-blur-md py-2 rounded-lg border border-white/20">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center hover:bg-black/70 hover:border-green-400/50 transition-all duration-300 text-white hover:text-white text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || !selectedColor || !product.inStock}
                className="w-full bg-black/50 backdrop-blur-md border border-white/30 disabled:bg-black/30 disabled:cursor-not-allowed disabled:text-gray-500 text-white py-4 rounded-lg font-medium transition-all duration-300 text-lg hover:bg-black/70 hover:border-green-400/50 hover:shadow-lg hover:shadow-white/10"
              >
                {product.inStock ? t('Agregar al carrito') : t('Agotado')}
              </button>
              
              <button
                onClick={handleBuyNow}
                disabled={!selectedSize || !selectedColor || !product.inStock}
                className="w-full bg-black/60 backdrop-blur-md border border-green-400/40 disabled:bg-black/30 disabled:cursor-not-allowed disabled:text-gray-500 text-white py-4 rounded-lg font-medium transition-all duration-300 text-lg hover:bg-black/80 hover:border-green-400/60 hover:text-green-300 hover:shadow-lg hover:shadow-green-400/20"
              >
                {t('Comprar ahora')}
              </button>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Características */}
          {product.features && product.features.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-white">{t('Características')}</h3>
              <ul className="space-y-3">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-green-400 mt-1 text-lg">•</span>
                    <span className="text-gray-300">{t(feature)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Materiales */}
          {product.materials && product.materials.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-white">{t('Materiales')}</h3>
              <ul className="space-y-3">
                {product.materials.map((material, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-green-400 mt-1 text-lg">•</span>
                    <span className="text-gray-300">{material}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sección de productos recomendados */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">{t('Productos Recomendados')}</h2>
            <p className="text-gray-400 text-lg">{t('Descubre otros productos que podrían interesarte')}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card Producto 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 group">
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src="/797e7904b64e13508ab322be3107e368-1@2x.png"
                  alt="Camiseta Premium"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {t('Nuevo')}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium mb-2 group-hover:text-green-400 transition-colors">
                  {t('Camiseta Premium Básica')}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{t('TreboLuxe')}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-bold">{formatPrice(24.99)}</span>
                    <span className="text-gray-500 text-sm line-through">{formatPrice(29.99)}</span>
                  </div>
                  <Link 
                    href="/producto/2"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm transition-colors no-underline"
                  >
                    {t('Ver')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Card Producto 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 group">
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src="/look-polo-2-1@2x.png"
                  alt="Polo Clásico"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {t('Oferta')}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium mb-2 group-hover:text-green-400 transition-colors">
                  {t('Polo Clásico Elegante')}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{t('TreboLuxe')}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-bold">{formatPrice(34.99)}</span>
                    <span className="text-gray-500 text-sm line-through">{formatPrice(44.99)}</span>
                  </div>
                  <Link 
                    href="/producto/3"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm transition-colors no-underline"
                  >
                    {t('Ver')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Card Producto 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 group">
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src="/image@2x.png"
                  alt="Chaqueta Moderna"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {t('Popular')}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium mb-2 group-hover:text-green-400 transition-colors">
                  {t('Chaqueta Moderna Sport')}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{t('TreboLuxe')}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-bold">{formatPrice(89.99)}</span>
                  </div>
                  <Link 
                    href="/producto/4"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm transition-colors no-underline"
                  >
                    {t('Ver')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Card Producto 4 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 group">
              <div className="relative aspect-square overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-white text-6xl opacity-30">👕</span>
                </div>
                <div className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {t('Limitado')}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-medium mb-2 group-hover:text-green-400 transition-colors">
                  {t('Sudadera Comfort Pro')}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{t('TreboLuxe')}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-bold">{formatPrice(54.99)}</span>
                    <span className="text-gray-500 text-sm line-through">{formatPrice(69.99)}</span>
                  </div>
                  <Link 
                    href="/producto/5"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm transition-colors no-underline"
                  >
                    {t('Ver')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Botón ver más productos */}
          <div className="text-center mt-10">
            <Link 
              href="/catalogo"
              className="inline-block bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors no-underline border border-gray-600"
            >
              {t('Ver Todos los Productos')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer completo */}
      <footer className="self-stretch [background:linear-gradient(180deg,_#000,_#1a6b1a)] overflow-hidden shrink-0 flex flex-col items-start justify-start pt-16 pb-8 px-8 text-Text-Default-Tertiary font-Body-Font-Family">
        <div className="w-full flex flex-row items-start justify-start gap-8 mb-12">
          {/* Logo y redes sociales */}
          <div className="w-60 flex flex-col items-start justify-start gap-6 min-w-[240px]">
            <Image
              className="w-[50px] h-[50px]"
              width={50}
              height={50}
              sizes="100vw"
              alt="Logo Treboluxe"
              src="/sin-ttulo1-2@2x.png"
            />
            <div className="flex flex-col items-start justify-start gap-4">
              <p className="text-white text-sm leading-relaxed">
                {t('Tu tienda de moda online de confianza. Descubre las últimas tendencias y encuentra tu estilo único con nuestra amplia selección de ropa y accesorios.')}
              </p>
              <div className="flex flex-row items-center justify-start gap-4">
                <Image
                  className="w-6 relative h-6 hover:opacity-80 transition-opacity cursor-pointer"
                  width={24}
                  height={24}
                  sizes="100vw"
                  alt="Facebook"
                  src="/figma.svg"
                />
                <Image
                  className="w-6 relative h-6 overflow-hidden shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                  width={24}
                  height={24}
                  sizes="100vw"
                  alt="Instagram"
                  src="/logo-instagram.svg"
                />
                <Image
                  className="w-6 relative h-6 overflow-hidden shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                  width={24}
                  height={24}
                  sizes="100vw"
                  alt="Twitter/X"
                  src="/x-logo.svg"
                />
                <Image
                  className="w-6 relative h-6 overflow-hidden shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                  width={24}
                  height={24}
                  sizes="100vw"
                  alt="YouTube"
                  src="/logo-youtube.svg"
                />
                <Image
                  className="w-6 relative h-6 overflow-hidden shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                  width={24}
                  height={24}
                  sizes="100vw"
                  alt="LinkedIn"
                  src="/linkedin.svg"
                />
              </div>
            </div>
          </div>
          
          {/* Columna Compras */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Compras')}
              </h3>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Cómo comprar')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Métodos de pago')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Envíos y entregas')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Cambios y devoluciones')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Tabla de tallas')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Gift cards')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Programa de fidelidad')}
              </div>
            </div>
          </div>
          
          {/* Columna Categorías */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Categorías')}
              </h3>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Mujer')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Hombre')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Niños')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Accesorios')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Calzado')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Nueva colección')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Ofertas especiales')}
              </div>
            </div>
          </div>
          
          {/* Columna Atención al cliente */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Atención al cliente')}
              </h3>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Contacto')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Preguntas frecuentes')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Centro de ayuda')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Chat en vivo')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Seguimiento de pedidos')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Reportar un problema')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Ubicación de tiendas')}
              </div>
            </div>
          </div>
          
          {/* Columna Legal */}
          <div className="w-[262px] flex flex-col items-start justify-start gap-3">
            <div className="self-stretch flex flex-col items-start justify-start pb-4">
              <h3 className="relative leading-[140%] font-semibold text-white text-lg">
                {t('Legal')}
              </h3>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Términos y condiciones')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Política de privacidad')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Política de cookies')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Aviso legal')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Sobre nosotros')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Trabaja con nosotros')}
              </div>
            </div>
            <div className="w-full">
              <div className="text-gray-300 leading-[140%] hover:text-white transition-colors cursor-pointer">
                {t('Sostenibilidad')}
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright section */}
        <div className="w-full pt-8 border-t border-white/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 text-sm">
              {t('© 2024 Treboluxe. Todos los derechos reservados.')}
            </div>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <span className="hover:text-white transition-colors cursor-pointer">{t('Mapa del sitio')}</span>
              <span className="hover:text-white transition-colors cursor-pointer">{t('Accesibilidad')}</span>
              <span className="hover:text-white transition-colors cursor-pointer">{t('Configurar cookies')}</span>
            </div>
          </div>
          <div className="mt-4 text-gray-400 text-xs">
            {t('Treboluxe es una marca registrada. Todos los precios incluyen IVA. Los gastos de envío se calculan durante el proceso de compra.')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductPage;