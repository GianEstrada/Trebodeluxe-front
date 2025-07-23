import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useUniversalTranslate } from '../../hooks/useUniversalTranslate';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { canAccessAdminPanel } from '../../utils/roles';

// Definimos las interfaces para los datos de la nueva estructura
interface Talla {
  id_talla: number;
  nombre_talla: string;
  cantidad: number;
}

interface Variante {
  id_variante: number;
  nombre_variante: string;
  precio: number;
  precio_original?: number;
  imagen_url?: string;
  activo: boolean;
  tallas: Talla[];
}

interface ProductData {
  id_producto: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  variantes: Variante[];
}

const ProductPage: NextPage = () => {
  const router = useRouter();
  const { id, variante } = router.query;
  const { user, isAuthenticated, logout } = useAuth();
  const { addItem } = useCart();
  
  // Estados para idioma
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t } = useUniversalTranslate(currentLanguage);
  const { headerSettings } = useSiteSettings();
  
  // Estados específicos del producto
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variante | null>(null);
  const [selectedSize, setSelectedSize] = useState<Talla | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);

  // Estados para header y navegación  
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCurrency, setCurrentCurrency] = useState('EUR');
  
  // Estados para texto promocional
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Referencias para dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);

  // Cargar datos del producto
  useEffect(() => {
    if (id) {
      loadProductData();
    }
  }, [id]);

  // Seleccionar variante cuando cambie la URL
  useEffect(() => {
    if (productData && variante) {
      const variant = productData.variantes.find(v => v.id_variante === parseInt(variante as string));
      if (variant) {
        setSelectedVariant(variant);
        // Seleccionar la primera talla disponible
        const firstAvailableSize = variant.tallas.find(t => t.cantidad > 0);
        setSelectedSize(firstAvailableSize || variant.tallas[0] || null);
      }
    } else if (productData && productData.variantes.length > 0) {
      // Si no hay variante especificada, seleccionar la primera
      setSelectedVariant(productData.variantes[0]);
      const firstAvailableSize = productData.variantes[0].tallas.find(t => t.cantidad > 0);
      setSelectedSize(firstAvailableSize || productData.variantes[0].tallas[0] || null);
    }
  }, [productData, variante]);

  // Resetear cantidad cuando cambie variante o talla
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant, selectedSize]);

  const loadProductData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener todas las variantes y filtrar por producto
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/variants');
      const variantsData = await response.json();
      
      if (variantsData.success && variantsData.variants) {
        // Filtrar variantes del producto específico
        const productVariants = variantsData.variants.filter((v: any) => 
          v.id_producto === parseInt(id as string)
        );
        
        if (productVariants.length > 0) {
          const firstVariant = productVariants[0];
          const product: ProductData = {
            id_producto: firstVariant.id_producto,
            nombre: firstVariant.nombre_producto,
            descripcion: firstVariant.descripcion_producto,
            categoria: firstVariant.categoria,
            marca: firstVariant.marca,
            variantes: productVariants.map((v: any) => ({
              id_variante: v.id_variante,
              nombre_variante: v.nombre_variante,
              precio: typeof v.precio === 'string' ? parseFloat(v.precio) : (v.precio || 0),
              precio_original: v.precio_original ? (typeof v.precio_original === 'string' ? parseFloat(v.precio_original) : v.precio_original) : undefined,
              imagen_url: v.imagen_url,
              activo: v.variante_activa,
              tallas: v.tallas_stock || []
            }))
          };
          
          setProductData(product);
          
          // Cargar productos relacionados de la misma categoría
          loadRelatedProducts(firstVariant.categoria, firstVariant.id_producto);
        } else {
          setError('Producto no encontrado');
        }
      } else {
        setError('Error al cargar el producto');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async (categoria: string, excludeId: number) => {
    try {
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/variants');
      const variantsData = await response.json();
      
      if (variantsData.success && variantsData.variants) {
        // Agrupar por producto y filtrar por categoría
        const productsMap = new Map();
        
        variantsData.variants
          .filter((v: any) => v.categoria === categoria && v.id_producto !== excludeId)
          .forEach((variant: any) => {
            const productKey = variant.id_producto;
            
            if (!productsMap.has(productKey)) {
              productsMap.set(productKey, {
                id_producto: variant.id_producto,
                nombre: variant.nombre_producto,
                descripcion: variant.descripcion_producto,
                categoria: variant.categoria,
                marca: variant.marca,
                variantes: []
              });
            }
            
            productsMap.get(productKey).variantes.push({
              id_variante: variant.id_variante,
              nombre_variante: variant.nombre_variante,
              precio: typeof variant.precio === 'string' ? parseFloat(variant.precio) : (variant.precio || 0),
              precio_original: variant.precio_original ? (typeof variant.precio_original === 'string' ? parseFloat(variant.precio_original) : variant.precio_original) : undefined,
              imagen_url: variant.imagen_url,
              activo: variant.variante_activa,
              tallas: variant.tallas_stock || []
            });
          });
        
        const relatedArray = Array.from(productsMap.values()).slice(0, 4);
        setRelatedProducts(relatedArray);
      }
    } catch (err) {
      console.error('Error loading related products:', err);
    }
  };

  const handleVariantChange = (variant: Variante) => {
    setSelectedVariant(variant);
    // Actualizar URL
    router.push(`/producto/${id}?variante=${variant.id_variante}`, undefined, { shallow: true });
    // Seleccionar primera talla disponible
    const firstAvailableSize = variant.tallas.find(t => t.cantidad > 0);
    setSelectedSize(firstAvailableSize || variant.tallas[0] || null);
  };

  const handleSizeChange = (size: Talla) => {
    setSelectedSize(size);
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedSize || !productData) {
      alert(t('Selecciona una variante y talla'));
      return;
    }

    if (selectedSize.cantidad === 0) {
      alert(t('Talla sin stock'));
      return;
    }

    const cartItem = {
      id_variante: selectedVariant.id_variante,
      id_producto: productData.id_producto,
      nombre_producto: productData.nombre,
      nombre_variante: selectedVariant.nombre_variante,
      imagen_url: selectedVariant.imagen_url,
      precio: selectedVariant.precio,
      precio_original: selectedVariant.precio_original,
      id_talla: selectedSize.id_talla,
      nombre_talla: selectedSize.nombre_talla,
      categoria: productData.categoria,
      marca: productData.marca
    };

    addItem(cartItem, quantity);
    alert(t('Producto agregado al carrito'));
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Redirigir al checkout después de agregar al carrito
    setTimeout(() => {
      router.push('/checkout');
    }, 500);
  };

  const formatPrice = (price: number | string | null | undefined) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : (price || 0);
    return `$${numPrice.toFixed(2)}`;
  };

  // Funciones para el header
  const promoTexts = headerSettings?.promoTexts || [
    'Envío gratis en compras superiores a $50',
    'Descuentos exclusivos para miembros'
  ];

  // Función para cambiar idioma
  const changeLanguage = (language: string) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred-language', language);
  };

  // Función para cambiar moneda
  const changeCurrency = (currency: string) => {
    setCurrentCurrency(currency);
    localStorage.setItem('preferred-currency', currency);
  };

  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/catalogo?busqueda=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearchDropdown(false);
      setSearchTerm('');
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Función para manejar clicks en los dots del carrusel
  const handleDotClick = (index: number) => {
    if (index !== currentTextIndex) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex(index);
        setIsAnimating(false);
      }, 150);
    }
  };

  // useEffect para carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex(prev => (prev + 1) % promoTexts.length);
        setIsAnimating(false);
      }, 150);
    }, 4000);
    return () => clearInterval(interval);
  }, [promoTexts.length]);

  // useEffect para cerrar dropdowns con clicks fuera
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

  // Cargar preferencias guardadas
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  const calculateDiscount = (original?: number | string | null, current?: number | string | null) => {
    const origNum = typeof original === 'string' ? parseFloat(original) : (original || 0);
    const currNum = typeof current === 'string' ? parseFloat(current) : (current || 0);
    if (!origNum || !currNum || origNum <= currNum) return 0;
    return Math.round(((origNum - currNum) / origNum) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando producto...</div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">{error || 'Producto no encontrado'}</div>
      </div>
    );
  }

  return (
    <div className="w-full relative min-h-screen flex flex-col text-left text-Static-Body-Large-Size text-M3-white font-salsa"
         style={{
           background: 'linear-gradient(180deg, #000 0%, #1a6b1a 25%, #0d3d0d 35%, #000 75%, #000 100%)'
         }}>
      
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
            
            <div className="flex flex-row items-center justify-end gap-[32px]">
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
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    0
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
                        <p className="text-gray-300 text-sm">{t('Tu carrito está vacío')}</p>
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-400 text-center">{t('Agrega productos para ver tu carrito')}</p>
                      </div>
                      
                      {/* Botones del carrito */}
                      <div className="space-y-3">
                        <Link href="/catalogo" className="block">
                          <button className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                            {t('Explorar Productos')}
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

      {/* Breadcrumb */}
      <div className="px-8 py-4">
        <nav className="text-sm text-gray-400">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/catalogo" className="hover:text-white">Catálogo</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{productData.nombre}</span>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Columna izquierda - Imagen */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white/10 rounded-lg overflow-hidden">
              <Image
                src={selectedVariant?.imagen_url || '/sin-ttulo1-2@2x.png'}
                alt={`${productData.nombre} - ${selectedVariant?.nombre_variante}`}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/sin-ttulo1-2@2x.png';
                }}
              />
              {selectedVariant?.precio_original && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg font-bold">
                  {calculateDiscount(selectedVariant.precio_original, selectedVariant.precio)}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha - Información del producto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{productData.nombre}</h1>
              <p className="text-gray-400">{productData.categoria} • {productData.marca}</p>
            </div>

            {/* Variantes */}
            {productData.variantes.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('Variantes')}:</h3>
                <div className="flex flex-wrap gap-2">
                  {productData.variantes.map((variant) => (
                    <button
                      key={variant.id_variante}
                      onClick={() => handleVariantChange(variant)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedVariant?.id_variante === variant.id_variante
                          ? 'border-green-400 bg-green-400/20 text-green-400'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      {variant.nombre_variante}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tallas */}
            {selectedVariant && selectedVariant.tallas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('Tallas')}:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVariant.tallas.map((size) => (
                    <button
                      key={size.id_talla}
                      onClick={() => handleSizeChange(size)}
                      disabled={size.cantidad === 0}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        size.cantidad === 0
                          ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                          : selectedSize?.id_talla === size.id_talla
                          ? 'border-green-400 bg-green-400/20 text-green-400'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      {size.nombre_talla}
                      {size.cantidad === 0 && ' (Agotado)'}
                      {size.cantidad > 0 && size.cantidad <= 5 && ` (${size.cantidad} disponibles)`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Precio */}
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-green-400">
                  {selectedVariant && formatPrice(selectedVariant.precio)}
                </span>
                {selectedVariant?.precio_original && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(selectedVariant.precio_original)}
                  </span>
                )}
              </div>
              {selectedVariant?.precio_original && (
                <p className="text-sm text-green-300">
                  Ahorras {formatPrice((typeof selectedVariant.precio_original === 'string' ? parseFloat(selectedVariant.precio_original) : selectedVariant.precio_original) - (typeof selectedVariant.precio === 'string' ? parseFloat(selectedVariant.precio) : selectedVariant.precio))}
                </p>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t('Cantidad')}:</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-white/30 hover:border-white/50 flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-white/30 hover:border-white/50 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={handleBuyNow}
                disabled={!selectedSize || selectedSize.cantidad === 0}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {selectedSize && selectedSize.cantidad === 0 
                  ? t('Sin stock') 
                  : t('Comprar ahora')
                }
              </button>
              
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || selectedSize.cantidad === 0}
                className="w-full bg-white text-black py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {selectedSize && selectedSize.cantidad === 0 
                  ? t('Sin stock') 
                  : t('Agregar al carrito')
                }
              </button>
            </div>

            {/* Información adicional */}
            <div className="space-y-4 pt-4 border-t border-white/20">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>🚚</span>
                <span>Envío gratis en pedidos mayores a $500 MXN</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>↩️</span>
                <span>Devoluciones gratis en 30 días</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>🔒</span>
                <span>Compra 100% segura</span>
              </div>
            </div>

            {/* Descripción */}
            {productData.descripcion && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('Descripción')}:</h3>
                <p className="text-gray-300 leading-relaxed">{productData.descripcion}</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos relacionados */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4 tracking-[2px]">{t('PRODUCTOS RECOMENDADOS')}</h2>
              <p className="text-gray-300 text-lg">{t('Otros productos de la categoría')} {t(productData.categoria)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => {
                const firstVariant = product.variantes[0];
                if (!firstVariant) return null;

                const hasStock = firstVariant.tallas.some(t => t.cantidad > 0);
                const discount = calculateDiscount(firstVariant.precio_original, firstVariant.precio);

                return (
                  <Link 
                    key={product.id_producto} 
                    href={`/producto/${product.id_producto}?variante=${firstVariant.id_variante}`}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group no-underline"
                  >
                    <div className="relative aspect-square mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={firstVariant.imagen_url || '/sin-ttulo1-2@2x.png'}
                        alt={`${product.nombre} - ${firstVariant.nombre_variante}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/sin-ttulo1-2@2x.png';
                        }}
                      />
                      {discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                          {discount}% OFF
                        </div>
                      )}
                      {!hasStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold">{t('Agotado')}</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-green-300 transition-colors line-clamp-2">
                      {product.nombre}
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">{t('Categoría')}: {t(product.categoria)}</p>
                    <p className="text-gray-300 text-sm mb-4">{t('Marca')}: {product.marca}</p>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 font-bold text-lg">{formatPrice(firstVariant.precio)}</span>
                      {discount > 0 && (
                        <span className="text-gray-400 line-through text-sm">
                          {formatPrice(firstVariant.precio_original!)}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <button className={`w-full py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                        hasStock 
                          ? 'bg-white text-black hover:bg-gray-100' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}>
                        {hasStock ? t('Ver producto') : t('Agotado')}
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Botón para ver más productos de la categoría */}
            <div className="text-center mt-8">
              <Link 
                href={`/catalogo?categoria=${encodeURIComponent(productData.categoria)}`}
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200"
              >
                {t('Ver todos los productos de')} {t(productData.categoria)}
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer completo */}
      <footer className="self-stretch [background:linear-gradient(180deg,_#000,_#1a6b1a)] overflow-hidden shrink-0 flex flex-col items-start justify-start pt-16 pb-8 px-8 text-Text-Default-Tertiary font-Body-Font-Family mt-16">
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