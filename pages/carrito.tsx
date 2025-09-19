import React, { useState, useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/NewCartContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { canAccessAdminPanel } from '../utils/roles';
import { productsApi, productUtils } from '../utils/productsApi';
import { promotionsApi } from '../utils/promotionsApi';
import { useCategories } from '../hooks/useCategories';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';

// Interfaces para cotizaciones de envío
interface ShippingQuote {
  carrier: string;
  service?: string;
  price: number | string;
  currency?: string;
  estimatedDays?: number;
  description?: string;
}

// Interface para países soportados
interface Country {
  code: string;
  name: string;
  flag: string;
  postalCodeLength?: number;
  postalCodeFormat?: string;
}

const CarritoPage: NextPage = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { items: cartItems, totalItems, totalFinal: totalPrice, removeFromCart, updateQuantity, clearCart, isLoading, cartId } = useCart();
  
  // Hook de categorías para la navbar
  const { categories: activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  
  // Estados para productos recomendados
  const [recommendedProduct, setRecommendedProduct] = useState<any>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  
  // Estados para búsqueda
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Estados para promociones (como en el index)
  const [promotions, setPromotions] = useState<Record<number, any[]>>({});
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  
  // Estados para dropdowns del header
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  
  // Estados para el carrusel promocional
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Estados para el móvil
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [mobileSidebarContent, setMobileSidebarContent] = useState<'cart' | 'language' | 'profile' | 'search'>('cart');

  // Estados para cotizaciones de envío
  const [postalCode, setPostalCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({ code: 'MX', name: 'México', flag: '🇲🇽' });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [quotesError, setQuotesError] = useState('');
  const [showQuotes, setShowQuotes] = useState(false);

  // Países soportados por el sistema de envío internacional
  const supportedCountries: Country[] = [
    { code: 'MX', name: 'México', flag: '🇲🇽', postalCodeLength: 5, postalCodeFormat: '64000' },
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', postalCodeLength: 5, postalCodeFormat: '90210' },
    { code: 'CA', name: 'Canadá', flag: '🇨🇦', postalCodeLength: 7, postalCodeFormat: 'M5V 3L9' },
    { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', postalCodeLength: 8, postalCodeFormat: 'SW1A 1AA' },
    { code: 'DE', name: 'Alemania', flag: '🇩🇪', postalCodeLength: 5, postalCodeFormat: '10115' },
    { code: 'FR', name: 'Francia', flag: '🇫🇷', postalCodeLength: 5, postalCodeFormat: '75001' },
    { code: 'ES', name: 'España', flag: '🇪🇸', postalCodeLength: 5, postalCodeFormat: '28001' },
    { code: 'IT', name: 'Italia', flag: '🇮🇹', postalCodeLength: 5, postalCodeFormat: '00118' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', postalCodeLength: 4, postalCodeFormat: '2000' },
    { code: 'JP', name: 'Japón', flag: '🇯🇵', postalCodeLength: 7, postalCodeFormat: '100-0001' },
    { code: 'BR', name: 'Brasil', flag: '🇧🇷', postalCodeLength: 8, postalCodeFormat: '01310-100' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', postalCodeLength: 8, postalCodeFormat: 'C1426BWD' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', postalCodeLength: 7, postalCodeFormat: '8320000' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', postalCodeLength: 6, postalCodeFormat: '110111' },
    { code: 'PE', name: 'Perú', flag: '🇵🇪', postalCodeLength: 5, postalCodeFormat: '15001' },
    { code: 'NL', name: 'Países Bajos', flag: '🇳🇱', postalCodeLength: 7, postalCodeFormat: '1012 JS' }
  ];

  // Refs para los dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Textos del carrusel promocional desde la base de datos
  const { headerSettings } = useSiteSettings();
  const promoTexts = headerSettings?.promoTexts || ['ENVIO GRATIS EN PEDIDOS ARRIBA DE $500 MXN', 'OFERTA ESPECIAL: 20% DE DESCUENTO EN SEGUNDA PRENDA'];
  
  // Estados para idioma y moneda
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  
  // Sistema de traducción universal
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  
  // Usar tasas de cambio dinámicas desde Open Exchange Rates
  const { formatPrice } = useExchangeRates();

  // Funciones para cambiar idioma y moneda
  const changeLanguage = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    localStorage.setItem('preferred-language', newLanguage);
    setShowLanguageDropdown(false);
    setShowMobileSidebar(false); // Cerrar sidebar móvil también
  };

  const changeCurrency = (newCurrency: string) => {
    setCurrentCurrency(newCurrency);
    localStorage.setItem('preferred-currency', newCurrency);
    setShowLanguageDropdown(false);
    setShowMobileSidebar(false); // Cerrar sidebar móvil también
  };

  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/catalogo?busqueda=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // UseEffect para búsqueda automática en tiempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const isSearchActive = showMobileSidebar && mobileSidebarContent === 'search';
      
      if (searchTerm && isSearchActive) {
        searchProducts(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, showMobileSidebar, mobileSidebarContent]);

  // Función para búsqueda en tiempo real
  // Función para buscar productos en tiempo real (igual que el index)
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      console.log('🔍 Iniciando búsqueda con query:', query);
      
      // Por ahora usar una búsqueda básica con productsApi similar al index
      // Si no hay productos locales, usar la API
      const response = await productsApi.getAll() as any;
      let allProducts: any[] = [];
      
      if (response.success && response.products && response.products.length > 0) {
        allProducts = response.products;
        console.log('📦 Productos de API:', allProducts.length);
        
        // Enriquecer productos con precios desde variants (igual que useProductosConCategorias)
        try {
          const stockResponse = await fetch(`https://trebodeluxe-backend.onrender.com/api/products/variants`);
          if (stockResponse.ok) {
            const stockData = await stockResponse.json();
            
            // Enriquecer cada producto con su precio base
            console.log('🔍 Ejemplo de variant para debugging:', stockData.variants[0]);
            console.log('🔍 Variant completa:', JSON.stringify(stockData.variants[0], null, 2));
            console.log('🔍 Campos disponibles en variant:', Object.keys(stockData.variants[0]));
            console.log('🔍 Total variants disponibles:', stockData.variants.length);
            
            allProducts = allProducts.map(product => {
              // Obtener el ID del producto usando múltiples posibilidades
              const productId = product.id || product.id_producto || product.producto_id || product.productId || product._id;
              console.log('🔍 Buscando variants para producto:', productId, 'nombre:', product.nombre || product.name);
              
              const productVariants = stockData.variants.filter((v: any) => {
                const variantProductId = v.id_producto || v.producto_id || v.productId || v._id || v.id;
                return variantProductId === productId;
              });
              
              console.log('🔍 Variants encontradas:', productVariants.length, 'para producto:', productId);
              
              if (productVariants.length > 0) {
                const variant = productVariants[0];
                console.log('🔍 Variant seleccionada:', JSON.stringify(variant, null, 2));
                console.log('💰 Campos de precio disponibles en variant:', {
                  precio_base: variant.precio_base,
                  precio: variant.precio,
                  price: variant.price,
                  precio_unitario: variant.precio_unitario,
                  precio_venta: variant.precio_venta,
                  precio_minimo: variant.precio_minimo,
                  cost: variant.cost,
                  costo: variant.costo
                });
                
                // Intentar múltiples campos de precio y convertir a número
                const precioRaw = variant.precio_base || variant.precio || variant.price || variant.precio_unitario || variant.precio_venta || variant.precio_minimo || 0;
                const precio = typeof precioRaw === 'string' ? parseFloat(precioRaw) : Number(precioRaw) || 0;
                console.log('💰 Precio final seleccionado:', precio, '(convertido de:', precioRaw, ') para producto:', product.nombre || product.name);
                
                return {
                  ...product,
                  precio_base: precio,
                  precio: precio,
                  precio_referencia: precio
                };
              }
              console.log('⚠️ No se encontraron variants para producto:', productId);
              return product;
            });
            
            console.log('💰 Productos enriquecidos con precios:', allProducts.length);
            
            // Aplicar promociones a los productos (igual que en el index)
            if (Object.keys(promotions).length > 0) {
              console.log('🎯 Aplicando promociones a productos de búsqueda...');
              allProducts = productUtils.applyPromotionDiscounts(allProducts, promotions);
              console.log('✅ Promociones aplicadas a productos de búsqueda');
            } else {
              console.log('⚠️ No hay promociones cargadas para aplicar');
            }
          }
        } catch (error) {
          console.warn('Error fetching variants for pricing:', error);
        }
      }

      // Mostrar estructura del primer producto para debugging
      if (allProducts.length > 0) {
        console.log('🔍 Ejemplo de producto para debugging:', {
          id: allProducts[0].id,
          id_producto: allProducts[0].id_producto,
          producto_id: allProducts[0].producto_id,
          productId: allProducts[0].productId,
          _id: allProducts[0]._id,
          nombre: allProducts[0].nombre,
          name: allProducts[0].name,
          descripcion: allProducts[0].descripcion,
          description: allProducts[0].description,
          categoria: allProducts[0].categoria,
          category: allProducts[0].category,
          precio_base: allProducts[0].precio_base,
          precio: allProducts[0].precio,
          precio_referencia: allProducts[0].precio_referencia,
          availableFields: Object.keys(allProducts[0])
        });
        
        console.log('🔍 Producto completo para debugging:', allProducts[0]);
      }

      // Filtrar productos por el término de búsqueda con más campos
      const filtered = allProducts.filter((product: any) => {
        const searchTerm = query.toLowerCase();
        const matches = [
          product.nombre?.toLowerCase().includes(searchTerm),
          product.name?.toLowerCase().includes(searchTerm),
          product.descripcion?.toLowerCase().includes(searchTerm),
          product.description?.toLowerCase().includes(searchTerm),
          product.categoria?.toLowerCase().includes(searchTerm),
          product.category?.toLowerCase().includes(searchTerm),
          product.marca?.toLowerCase().includes(searchTerm),
          product.brand?.toLowerCase().includes(searchTerm)
        ];
        
        return matches.some(match => match === true);
      });
      
      console.log('🎯 Productos filtrados:', filtered.length, 'de', allProducts.length);
      setSearchResults(filtered.slice(0, 5)); // Limitar a 5 resultados
    } catch (error) {
      console.error('Error buscando productos:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
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

  // Funciones del carrito usando datos reales
  const handleUpdateQuantity = async (productId: number, variantId: number, tallaId: number, newQuantity: number) => {
    try {
      await updateQuantity(productId, variantId, tallaId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (productId: number, variantId: number, tallaId: number) => {
    try {
      await removeFromCart(productId, variantId, tallaId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const calculateShipping = () => {
    return totalPrice >= 500 ? 0 : 50; // Envío gratis arriba de $500
  };

  // Función para obtener cotizaciones de envío
  const handleGetShippingQuotes = async () => {
    if (!postalCode || postalCode.length < 3) {
      setQuotesError(`Por favor ingresa un código postal válido para ${selectedCountry.name}`);
      return;
    }

    if (!cartId) {
      setQuotesError('No hay carrito disponible para calcular envío');
      return;
    }

    setIsLoadingQuotes(true);
    setQuotesError('');
    setShippingQuotes([]);

    try {
      console.log('🚚 Solicitando cotizaciones híbridas para CP:', postalCode, 'País:', selectedCountry.code, 'CartId:', cartId);
      
      const endpoint = selectedCountry.code === 'MX' 
        ? 'https://trebodeluxe-backend.onrender.com/api/skydropx/cart/quote-hybrid'
        : 'https://trebodeluxe-backend.onrender.com/api/skydropx/cart/quote-international';
      
      const requestBody = selectedCountry.code === 'MX' 
        ? {
            cartId: cartId.toString(),
            postalCode: postalCode
          }
        : {
            cartId: cartId.toString(),
            postalCode: postalCode,
            forceCountry: selectedCountry.code
          };

      // Primera solicitud
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error HTTP:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      let data = await response.json();

      // Si la primera consulta no tiene cotizaciones exitosas, hacer reintento después de 3 segundos
      if (data.success && (!data.quotations || data.quotations.length === 0)) {
        console.log('⏳ Primera consulta sin cotizaciones exitosas. Reintentando en 3 segundos...');
        setQuotesError('Obteniendo cotizaciones de carriers... Por favor espera.');
        
        // Esperar 3 segundos y hacer segunda consulta
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔄 Realizando segunda consulta...');
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          data = await response.json();
          console.log('🔍 Segunda consulta completada');
        }
      }

      if (data.success) {
        setShippingQuotes(data.quotations || []);
        setShowQuotes(true);
        setQuotesError(''); // Limpiar mensaje de espera
        console.log('✅ Cotizaciones obtenidas:', data.quotations);
      } else {
        setQuotesError(data.message || 'Error obteniendo cotizaciones');
        console.error('❌ Error en cotizaciones:', data);
      }

    } catch (error) {
      console.error('❌ Error solicitando cotizaciones:', error);
      setQuotesError('Error de conexión. Inténtalo nuevamente.');
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  // Función para formatear precio de cotización
  const formatQuotePrice = (price: string | number, currency: string = 'MXN') => {
    if (price === null || price === undefined) return '$0.00';
    const numPrice = parseFloat(price.toString()) || 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(numPrice);
  };

  // Cargar preferencias guardadas
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  // Cargar promociones activas al inicializar
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        setLoadingPromotions(true);
        console.log('🎯 Cargando promociones activas...');
        const promotionsResponse = await fetch('https://trebodeluxe-backend.onrender.com/api/promociones/activas');
        
        if (promotionsResponse.ok) {
          const promotionsData = await promotionsResponse.json();
          console.log('📊 Promociones activas encontradas:', promotionsData);
          
          if (promotionsData.promociones && Array.isArray(promotionsData.promociones)) {
            // Organizar promociones por producto
            const promotionsByProduct: Record<number, any[]> = {};
            promotionsData.promociones.forEach((promo: any) => {
              if (promo.id_producto) {
                if (!promotionsByProduct[promo.id_producto]) {
                  promotionsByProduct[promo.id_producto] = [];
                }
                promotionsByProduct[promo.id_producto].push(promo);
              }
            });
            setPromotions(promotionsByProduct);
            console.log('✅ Promociones organizadas por producto:', Object.keys(promotionsByProduct).length, 'productos con promociones');
          }
        }
      } catch (error) {
        console.warn('Error cargando promociones:', error);
      } finally {
        setLoadingPromotions(false);
      }
    };

    loadPromotions();
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
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    const handleScroll = () => {
      setShowCategoriesDropdown(false);
      setShowLanguageDropdown(false);
      setShowLoginDropdown(false);
      setShowSearchDropdown(false);
      setShowCartDropdown(false);
      setShowAdminDropdown(false);
      setShowCountryDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Cargar producto recomendado
  useEffect(() => {
    const loadRecommendedProduct = async () => {
      if (isAuthenticated && user) {
        setLoadingRecommendation(true);
        try {
          // Intentar obtener productos en promoción primero
          let response = await fetch('https://trebodeluxe-backend.onrender.com/api/promociones/activas');
          if (response.ok) {
            const promotionsData = await response.json();
            if (promotionsData.promociones && promotionsData.promociones.length > 0) {
              // Obtener un producto aleatorio de las promociones
              const randomPromotion = promotionsData.promociones[Math.floor(Math.random() * promotionsData.promociones.length)];
              if (randomPromotion.productos && randomPromotion.productos.length > 0) {
                const randomProduct = randomPromotion.productos[Math.floor(Math.random() * randomPromotion.productos.length)];
                setRecommendedProduct({
                  ...randomProduct,
                  hasDiscount: true,
                  originalPrice: randomProduct.precio,
                  price: randomProduct.precio * (1 - randomPromotion.descuento / 100),
                  discountPercentage: randomPromotion.descuento
                });
                setLoadingRecommendation(false);
                return;
              }
            }
          }
          
          // Si no hay promociones, obtener un producto aleatorio
          response = await fetch('https://trebodeluxe-backend.onrender.com/api/productos?limit=10&random=true');
          if (response.ok) {
            const data = await response.json();
            if (data.productos && data.productos.length > 0) {
              const randomProduct = data.productos[Math.floor(Math.random() * data.productos.length)];
              setRecommendedProduct(randomProduct);
            }
          }
        } catch (error) {
          console.error('Error cargando producto recomendado:', error);
        } finally {
          setLoadingRecommendation(false);
        }
      }
    };

    loadRecommendedProduct();
  }, [isAuthenticated, user]);

  // Búsqueda en tiempo real (igual que el index)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const isSearchActive = showSearchDropdown || (showMobileSidebar && mobileSidebarContent === 'search');
      if (searchTerm && isSearchActive) {
        searchProducts(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, showSearchDropdown, showMobileSidebar, mobileSidebarContent]);

  return (
    <div className="w-full relative min-h-screen flex flex-col text-left text-Static-Body-Large-Size text-M3-white font-salsa overflow-x-hidden"
         style={{
           background: 'linear-gradient(180deg, #000 0%, #1a6b1a 25%, #0d3d0d 35%, #000 75%, #000 100%)'
         }}>
      
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}

      {/* Header Móvil */}
      <MobileHeader 
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
        setMobileSidebarContent={setMobileSidebarContent}
        totalItems={totalItems}
      />
      
      <div className="self-stretch flex flex-col items-start justify-start text-Schemes-On-Surface font-Static-Body-Large-Font flex-shrink-0">
        <div className="self-stretch flex flex-col items-start justify-start text-center text-white font-salsa">
          <div className="self-stretch [background:linear-gradient(90deg,_#1a6b1a,_#0e360e)] h-10 hidden md:flex flex-row items-center justify-between !p-[5px] box-border">
            <div className="w-full max-w-[278px] relative tracking-[4px] leading-6 flex items-center justify-center h-[27px] shrink-0 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)]">
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

            <div className="flex-[-0.0187] [backdrop-filter:blur(40px)] rounded-[50px] flex flex-row items-center justify-end !pt-2 !pb-2 !pl-2 md:!pl-[402px] !pr-3 relative gap-2">
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
          <div className="self-stretch hidden md:flex flex-row items-center justify-between !pt-[15px] !pb-[15px] !pl-8 !pr-8 text-M3-white relative">
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
                          href="/catalogo?categoria=todas" 
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
                              href="/catalogo?categoria=todas" 
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
              <Link href="/catalogo?filter=promociones" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className="w-[161.8px] relative h-[34px] hover:bg-green-600/30 bg-green-700/20 transition-colors duration-200 rounded cursor-pointer border border-green-500/30">
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white font-semibold">
                    {t('PROMOCIONES')}
                  </div>
                </div>
              </Link>
              <Link href="/catalogo?filter=nuevos" className="text-white no-underline hover:text-white visited:text-white focus:text-white active:text-white">
                <div className="w-[161.8px] relative h-[34px] hover:bg-blue-600/30 bg-blue-700/20 transition-colors duration-200 rounded cursor-pointer border border-blue-500/30">
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white font-semibold">
                    {t('NUEVOS')}
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
                              <span className="text-2xl">��</span>
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
                        
                        {/* Información de Envío */}
                        <div className="bg-white/10 rounded-lg p-4 mb-4">
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {t('Información de Envío')}
                          </h4>
                          <div className="space-y-2 text-sm text-gray-300">
                            <div className="flex justify-between">
                              <span>{t('Envíos salen:')}</span>
                              <span className="text-green-400">{t('Al día siguiente')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('Entrega estándar:')}</span>
                              <span>{t('3-5 días')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('Entrega express:')}</span>
                              <span>{t('24-48 horas')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Recomendación de Producto */}
                        <div className="bg-white/10 rounded-lg p-4 mb-6">
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            {t('Producto Recomendado')}
                          </h4>
                          {loadingRecommendation ? (
                            <div className="animate-pulse">
                              <div className="bg-white/20 h-20 rounded mb-2"></div>
                              <div className="bg-white/20 h-4 rounded mb-1"></div>
                              <div className="bg-white/20 h-4 rounded w-2/3"></div>
                            </div>
                          ) : recommendedProduct ? (
                            <div 
                              className="cursor-pointer hover:bg-white/20 rounded-lg p-2 transition-colors duration-200"
                              onClick={() => {
                                const productId = recommendedProduct.id || recommendedProduct.producto_id || recommendedProduct.id_producto || recommendedProduct.productId || recommendedProduct._id;
                                console.log('🔗 Navegando al producto con ID:', productId);
                                if (productId) {
                                  router.push(`/producto/${productId}`);
                                  setShowLoginDropdown(false);
                                } else {
                                  console.error('❌ No se puede navegar: ID de producto no válido');
                                }
                              }}
                            >
                              <div className="flex gap-3">
                                <div className="w-16 h-16 bg-gray-400 rounded-lg overflow-hidden flex-shrink-0">
                                  {(() => {
                                    // Buscar imagen en diferentes estructuras
                                    let imageUrl = null;
                                    
                                    console.log('🔍 Producto completo para imagen:', recommendedProduct);
                                    
                                    // Intentar diferentes propiedades de imagen
                                    if (recommendedProduct.imagen_principal) {
                                      imageUrl = recommendedProduct.imagen_principal;
                                    } else if (recommendedProduct.imagenes && Array.isArray(recommendedProduct.imagenes) && recommendedProduct.imagenes.length > 0) {
                                      imageUrl = recommendedProduct.imagenes[0].url || recommendedProduct.imagenes[0];
                                    } else if (recommendedProduct.images && Array.isArray(recommendedProduct.images) && recommendedProduct.images.length > 0) {
                                      imageUrl = recommendedProduct.images[0].url || recommendedProduct.images[0];
                                    } else if (recommendedProduct.variantes && Array.isArray(recommendedProduct.variantes) && recommendedProduct.variantes.length > 0) {
                                      // Buscar imagen en las variantes
                                      const firstVariant = recommendedProduct.variantes[0];
                                      if (firstVariant.imagenes && Array.isArray(firstVariant.imagenes) && firstVariant.imagenes.length > 0) {
                                        imageUrl = firstVariant.imagenes[0].url || firstVariant.imagenes[0];
                                      } else if (firstVariant.imagen_url) {
                                        imageUrl = firstVariant.imagen_url;
                                      }
                                    } else if (recommendedProduct.imagen_url) {
                                      imageUrl = recommendedProduct.imagen_url;
                                    } else if (recommendedProduct.image) {
                                      imageUrl = recommendedProduct.image;
                                    } else if (recommendedProduct.foto) {
                                      imageUrl = recommendedProduct.foto;
                                    }
                                    
                                    console.log('�️ URL de imagen detectada:', imageUrl);
                                    
                                    return imageUrl ? (
                                      <img 
                                        src={imageUrl} 
                                        alt={recommendedProduct.nombre || recommendedProduct.name || 'Producto'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          console.log('❌ Error cargando imagen:', imageUrl);
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          target.nextElementSibling?.setAttribute('style', 'display: flex');
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    );
                                  })()}
                                  {/* Fallback icon (hidden by default, shown when image fails) */}
                                  <div className="w-full h-full bg-gray-500 flex items-center justify-center" style={{display: 'none'}}>
                                    <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-white text-sm font-medium truncate">
                                    {recommendedProduct.nombre || recommendedProduct.name || recommendedProduct.titulo || 'Producto sin nombre'}
                                  </h5>
                                  <p className="text-gray-300 text-xs line-clamp-2">
                                    {recommendedProduct.descripcion || recommendedProduct.description || recommendedProduct.resumen || 'Sin descripción disponible'}
                                  </p>
                                  <div className="mt-1">
                                    {(() => {
                                      // Obtener el precio base del producto
                                      let basePrice = 0;
                                      
                                      // Buscar precio en diferentes estructuras
                                      if (recommendedProduct.variantes && recommendedProduct.variantes.length > 0) {
                                        const firstVariant = recommendedProduct.variantes[0];
                                        basePrice = firstVariant.precio || basePrice;
                                      }
                                      
                                      // Si aún no hay precio, buscar en otros campos
                                      if (basePrice === 0) {
                                        basePrice = recommendedProduct.precio || recommendedProduct.price || 0;
                                      }
                                      
                                      // Verificar si tiene descuento real
                                      const hasRealDiscount = recommendedProduct.hasDiscount && 
                                                            recommendedProduct.price && 
                                                            recommendedProduct.originalPrice && 
                                                            recommendedProduct.price < recommendedProduct.originalPrice;
                                      
                                      if (hasRealDiscount) {
                                        return (
                                          <div className="flex items-center gap-2">
                                            <span className="text-green-400 text-sm font-medium">
                                              {formatPrice(recommendedProduct.price, currentCurrency, 'MXN')}
                                            </span>
                                            <span className="text-gray-400 text-xs line-through">
                                              {formatPrice(recommendedProduct.originalPrice, currentCurrency, 'MXN')}
                                            </span>
                                            <span className="bg-red-500 text-white text-xs px-1 rounded">
                                              -{recommendedProduct.discountPercentage}%
                                            </span>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <span className="text-green-400 text-sm font-medium">
                                            {formatPrice(basePrice, currentCurrency, 'MXN')}
                                          </span>
                                        );
                                      }
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <p className="text-gray-400 text-sm">
                                {t('No hay productos en promoción disponibles')}
                              </p>
                            </div>
                          )}
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
                      <h3 className="text-xl text-white mb-4">{t('Buscar productos')}</h3>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => handleSearchInputChange(e.target.value)}
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
                      
                      {/* Resultados de búsqueda */}
                      {searchTerm && (
                        <div className="mt-4">
                          {searchLoading ? (
                            <div className="space-y-3">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse flex gap-3">
                                  <div className="w-12 h-12 bg-white/20 rounded"></div>
                                  <div className="flex-1">
                                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                                    <div className="h-3 bg-white/20 rounded w-2/3"></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {searchResults.map((product) => (
                                <div
                                  key={product.id}
                                  className="cursor-pointer hover:bg-white/20 rounded-lg p-3 transition-colors duration-200"
                                  onClick={() => {
                                    router.push(`/producto/${product.id}`);
                                    setShowSearchDropdown(false);
                                    setSearchTerm('');
                                  }}
                                >
                                  <div className="flex gap-3">
                                    <div className="w-12 h-12 bg-gray-400 rounded overflow-hidden flex-shrink-0">
                                      {product.imagenes && product.imagenes.length > 0 ? (
                                        <img 
                                          src={product.imagenes[0].url} 
                                          alt={product.nombre}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                                          <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-white text-sm font-medium truncate">{product.nombre}</h5>
                                      <p className="text-gray-300 text-xs truncate">{product.descripcion}</p>
                                      <p className="text-green-400 text-sm font-medium">
                                        ${product.precio?.toFixed(2) || '0.00'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-white/20">
                                <button
                                  onClick={handleSearch}
                                  className="w-full text-center text-blue-400 text-sm hover:text-blue-300 transition-colors duration-200"
                                >
                                  {t('Ver todos los resultados')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-gray-400 text-sm">{t('No se encontraron productos')}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!searchTerm && (
                        <div className="mt-4">
                          <h4 className="text-white font-semibold mb-3">{t('Búsquedas populares:')}</h4>
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => {
                                router.push('/catalogo?busqueda=Camisas');
                                setShowSearchDropdown(false);
                              }}
                              className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                            >
                              {t('Camisas')}
                            </button>
                            <button 
                              onClick={() => {
                                router.push('/catalogo?busqueda=Pantalones');
                                setShowSearchDropdown(false);
                              }}
                              className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                            >
                              {t('Pantalones')}
                            </button>
                            <button 
                              onClick={() => {
                                router.push('/catalogo?busqueda=Vestidos');
                                setShowSearchDropdown(false);
                              }}
                              className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                            >
                              {t('Vestidos')}
                            </button>
                            <button 
                              onClick={() => {
                                router.push('/catalogo?busqueda=Zapatos');
                                setShowSearchDropdown(false);
                              }}
                              className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                            >
                              {t('Zapatos')}
                            </button>
                          </div>
                          <div className="mt-6 pt-4 border-t border-white/20">
                            <p className="text-gray-300 text-sm">
                              {t('Encuentra exactamente lo que buscas en nuestra colección.')}
                            </p>
                          </div>
                        </div>
                      )}
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
                                    </div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.productId, item.variantId, item.tallaId)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  disabled={isLoading}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Resumen del carrito */}
                      {cartItems.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/20">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-300">{t('Subtotal:')}</span>
                            <span className="text-white font-bold">{formatPrice(totalPrice, currentCurrency, 'MXN')}</span>
                          </div>
                          <div className="flex justify-between items-center mb-6">
                            <span className="text-gray-300">{t('Envío:')}</span>
                            <span className="text-blue-400 font-medium">{t('Calculado al final')}</span>
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

      {/* Contenido principal del carrito */}
      <div className="container mx-auto px-2 sm:px-4 md:px-8 py-4 md:py-8 overflow-x-hidden">
        {/* Breadcrumb - Solo visible en desktop */}
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors no-underline text-gray-400">{t('Inicio')}</Link>
          <span>/</span>
          <span className="text-white">{t('Carrito de Compras')}</span>
        </div>

        <div className="max-w-[350px] md:max-w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-white">{t('Tu Carrito')}</h1>
              {cartItems.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-red-400 hover:text-red-300 transition-colors text-sm disabled:opacity-50 bg-transparent"
                  disabled={isLoading}
                >
                  {t('Vaciar carrito')}
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-medium text-white mb-2">{t('Tu carrito está vacío')}</h3>
                <p className="text-gray-400 mb-6">{t('Agrega algunos productos para continuar')}</p>
                <Link
                  href="/catalogo"
                  className="inline-block bg-black/50 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors hover:bg-black/70 no-underline"
                >
                  {t('Explorar Productos')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={`${item.variantId}-${item.tallaId}`} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                    <div className="flex items-start gap-4">
                      {/* Imagen del producto */}
                      <div className="w-24 h-24 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      {/* Información del producto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-white mb-1">{item.name}</h3>
                            <p className="text-sm text-gray-400 mb-2">
                              {t('Talla')}: {item.tallaName} | {t('Variante')}: {item.variantName}
                            </p>
                            <div className="flex items-center space-x-2">
                              {item.hasDiscount ? (
                                <div className="flex flex-col">
                                  <span className="text-sm text-red-400 line-through">
                                    {formatPrice(item.price, currentCurrency, 'MXN')}
                                  </span>
                                  <span className="text-lg font-bold text-green-400">
                                    {formatPrice(item.finalPrice, currentCurrency, 'MXN')}
                                  </span>
                                  <span className="text-xs text-yellow-400">
                                    -{item.discountPercentage}% OFF
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-green-400">
                                  {formatPrice(item.finalPrice, currentCurrency, 'MXN')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Controles de cantidad */}
                          <div className="flex flex-col items-end space-y-3">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.tallaId, item.quantity - 1)}
                                className="w-8 h-8 bg-black/50 backdrop-blur-md border border-white/20 rounded flex items-center justify-center hover:bg-black/70 transition-colors text-white disabled:opacity-50"
                                disabled={isLoading || item.quantity <= 1}
                              >
                                -
                              </button>
                              <span className="w-12 text-center text-white font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.tallaId, item.quantity + 1)}
                                className="w-8 h-8 bg-black/50 backdrop-blur-md border border-white/20 rounded flex items-center justify-center hover:bg-black/70 transition-colors text-white disabled:opacity-50"
                                disabled={isLoading}
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.productId, item.variantId, item.tallaId)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/20 transition-colors py-1 px-3 rounded text-sm font-medium disabled:opacity-50 bg-gray-900/20"
                              disabled={isLoading}
                            >
                              {t('Eliminar')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen del pedido */}
          {cartItems.length > 0 && (
            <div className="lg:col-span-1 max-w-full min-w-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 sticky top-4 overflow-hidden max-w-full w-fit">
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl font-bold text-white mb-6">{t('Resumen del Pedido')}</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">{t('Subtotal')} ({totalItems} {t('productos')})</span>
                      <span className="text-white font-medium">{formatPrice(totalPrice, currentCurrency, 'MXN')}</span>
                    </div>
                    
                    {/* Aviso sobre cálculo de envío */}
                    <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                      <p className="text-blue-200 text-xs text-center">
                        {t('Los cálculos de envío son aproximados. La selección final se realizará en el checkout.')}
                      </p>
                    </div>
                  </div>

                  {/* Sección de Cotizaciones de Envío */}
                  {cartItems.length > 0 && cartId && (
                    <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:p-6 mb-6 max-w-full overflow-x-hidden">
                      <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        {t('Calcular Envío')}
                      </h3>
                    
                    <div className="space-y-4">
                      {/* Selector de País */}
                      <div className="relative" ref={countryDropdownRef}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {t('País de destino')}
                        </label>
                        <button
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="w-full bg-black/50 border border-white/30 rounded-lg px-4 py-3 text-white flex items-center justify-between hover:border-blue-400 focus:border-blue-400 focus:outline-none transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{selectedCountry.flag}</span>
                            <span>{selectedCountry.name}</span>
                          </div>
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                            {supportedCountries.map((country) => (
                              <button
                                key={country.code}
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setShowCountryDropdown(false);
                                  setPostalCode(''); // Limpiar código postal al cambiar país
                                  setQuotesError('');
                                  setShippingQuotes([]);
                                  setShowQuotes(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg"
                              >
                                <span className="text-xl">{country.flag}</span>
                                <span className="text-white">{country.name}</span>
                                {selectedCountry.code === country.code && (
                                  <svg className="w-4 h-4 text-blue-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Input de Código Postal y Botón Calcular */}
                      <div className="space-y-3">
                        <div className="w-full">
                          <input
                            type="text"
                            value={postalCode}
                            onChange={(e) => {
                              let value = e.target.value;
                              
                              // Limpiar formato según el país
                              if (selectedCountry.code === 'MX' || selectedCountry.code === 'US') {
                                value = value.replace(/\D/g, '').slice(0, selectedCountry.postalCodeLength || 5);
                              } else if (selectedCountry.code === 'CA') {
                                // Para Canadá: formato K1A 0A6
                                value = value.toUpperCase().replace(/[^A-Z0-9\s]/g, '').slice(0, 7);
                              } else if (selectedCountry.code === 'GB') {
                                // Para Reino Unido: formato SW1A 1AA
                                value = value.toUpperCase().replace(/[^A-Z0-9\s]/g, '').slice(0, 8);
                              } else {
                                // Para otros países, permitir letras, números y espacios
                                value = value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '').slice(0, selectedCountry.postalCodeLength || 10);
                              }
                              
                              setPostalCode(value);
                              setQuotesError('');
                            }}
                            placeholder={`${t('Código postal')} (${t('ej')}: ${selectedCountry.postalCodeFormat})`}
                            className="bg-black/50 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none transition-colors"
                            maxLength={selectedCountry.postalCodeLength || 10}
                          />
                        </div>
                        <div className="w-full">
                          <button
                            onClick={handleGetShippingQuotes}
                            disabled={isLoadingQuotes || postalCode.length < 3}
                            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            {isLoadingQuotes ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {quotesError.includes('espera') ? t('Reintentando...') : t('Calculando...')}
                              </>
                            ) : (
                              <>{t('Calcular')}</>
                            )}
                          </button>
                        </div>
                      </div>

                      {quotesError && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                          {quotesError}
                        </div>
                      )}

                      {showQuotes && shippingQuotes.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-white font-medium">{t('Opciones de envío disponibles:')}</h4>
                          {shippingQuotes.map((quote, index) => {
                            // Verificar que el quote tenga las propiedades necesarias
                            if (!quote || quote.price === null || quote.price === undefined) {
                              return null; // Skip this quote if it's invalid
                            }
                            
                            const quoteId = `${quote.carrier || 'unknown'}_${quote.service?.replace(/\s+/g, '_') || 'standard'}_${index}`;
                            return (
                              <div
                                key={quoteId}
                                className="p-4 rounded-lg border bg-black/40 border-white/20 hover:bg-black/60 hover:border-green-400/50 transition-all duration-300"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 rounded-full border-2 border-green-400 bg-green-400 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-white"></div>
                                    </div>
                                    <div>
                                      <h3 className="text-white font-medium">
                                        {quote.carrier || 'Transportadora'} - {quote.service || 'Servicio Estándar'}
                                      </h3>
                                      <p className="text-gray-400 text-sm">
                                        {quote.description || `Envío por ${quote.carrier || 'transportadora'}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-white font-bold">
                                      {formatQuotePrice(quote.price, quote.currency)}
                                    </div>
                                    {quote.estimatedDays && (
                                      <div className="text-gray-400 text-sm">
                                        {quote.estimatedDays} {t('días hábiles')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }).filter(Boolean)}
                        </div>
                      )}

                      {showQuotes && shippingQuotes.length === 0 && !isLoadingQuotes && !quotesError && (
                        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 text-blue-300 text-sm">
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="font-medium mb-1">{t('Las cotizaciones están procesándose')}</p>
                              <p className="text-xs text-blue-200">
                                {t('Los carriers pueden tardar unos segundos en calcular precios. Por favor vuelve a intentar en un momento.')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  <div className="space-y-4 w-fit mx-auto">
                    {/* Botones de acción para desktop - En el resumen del pedido */}
                    <div className="hidden md:block space-y-4">
                      <Link
                        href="/checkout"
                        className="block w-fit mx-auto bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:from-green-700 hover:to-green-800 hover:shadow-lg text-center no-underline"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5-6M7 13l-2.5 6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"/>
                          </svg>
                          {t('Proceder al Checkout')}
                        </div>
                      </Link>
                      
                      <Link
                        href="/catalogo"
                        className="block w-fit mx-auto bg-transparent border-2 border-white/40 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/60 text-center no-underline"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {t('Continuar Comprando')}
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="px-6 pb-6 pt-4 border-t border-white/20 text-xs text-gray-400 space-y-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t('Pago 100% seguro')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t('Envío en 24-48 horas')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t('Devoluciones gratuitas')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Botones de acción móvil - Con el mismo ancho que las cards */}
        {cartItems.length > 0 && (
          <div className="block md:hidden mt-6 space-y-4">
            <Link
              href="/checkout"
              className="block w-fit bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:from-green-700 hover:to-green-800 hover:shadow-lg text-center no-underline mx-auto"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5-6M7 13l-2.5 6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"/>
                </svg>
                {t('Proceder al Checkout')}
              </div>
            </Link>
            
            <Link
              href="/catalogo"
              className="block w-fit bg-transparent border-2 border-white/40 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/60 text-center no-underline mx-auto"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {t('Continuar Comprando')}
              </div>
            </Link>
          </div>
        )}
        </div>
      </div>

      {/* Panel Lateral Móvil Derecho (Carrito/Opciones) */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-black/95 backdrop-blur-lg z-50 transform transition-transform duration-300 ease-out ${
        showMobileSidebar ? 'translate-x-0' : 'translate-x-full'
      } md:hidden`}>
        <div className="flex flex-col h-full">
          {/* Header del panel */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="text-white text-lg font-semibold">
              {mobileSidebarContent === 'cart' && t('Carrito')}
              {mobileSidebarContent === 'language' && t('Idioma & Moneda')}
              {mobileSidebarContent === 'profile' && t('Perfil')}
              {mobileSidebarContent === 'search' && t('Buscar')}
            </div>
            <button 
              onClick={() => setShowMobileSidebar(false)}
              className="p-2 text-white bg-gradient-to-br from-red-500 to-red-700 rounded-md transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Contenido del panel */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Contenido del carrito */}
            {mobileSidebarContent === 'cart' && (
              <div className="space-y-4 flex-1 flex flex-col">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">{t('CARRITO')}</h3>
            <p className="text-gray-300 text-sm">{totalItems} {t('productos en tu carrito')}</p>
          </div>
          
          {/* Lista de productos */}
          <div className="space-y-4 flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5-6M7 13l-2.5 6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"/>
                      </svg>
                      <p className="text-gray-300 mb-4">{t('Tu carrito está vacío')}</p>
                      <p className="text-gray-400 text-sm">{t('Agrega algunos productos para continuar')}</p>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={`${item.variantId}-${item.tallaId}`} className="bg-white/10 rounded-lg p-3 border border-white/20">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 bg-gray-400 rounded-lg flex-shrink-0">
                            {item.image && (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/sin-ttulo1-2@2x.png';
                                }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                            <p className="text-gray-300 text-xs">{t('Talla')}: {item.tallaName}</p>
                            {item.variantName && (
                              <p className="text-gray-300 text-xs">{item.variantName}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              {item.hasDiscount ? (
                                <div className="flex flex-col">
                                  <span className="text-xs text-red-400 line-through">
                                    {formatPrice(item.price, currentCurrency, 'MXN')}
                                  </span>
                                  <span className="text-white font-bold text-sm">
                                    {formatPrice(item.finalPrice, currentCurrency, 'MXN')}
                                  </span>
                                  <span className="text-xs text-yellow-400">
                                    -{item.discountPercentage}% OFF
                                  </span>
                                </div>
                              ) : (
                                <span className="text-white font-bold text-sm">
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
                                <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.productId, item.variantId, item.tallaId, item.quantity + 1)}
                                  className="w-6 h-6 bg-white/20 rounded text-white text-sm hover:bg-white/30 transition-colors"
                                  disabled={isLoading}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.productId, item.variantId, item.tallaId)}
                            className="text-red-400 hover:text-red-300 transition-colors bg-transparent p-1 rounded disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Resumen del carrito */}
                {cartItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-300">{t('Subtotal:')}</span>
                      <span className="text-white font-bold">{formatPrice(totalPrice, currentCurrency, 'MXN')}</span>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-gray-300">{t('Envío:')}</span>
                      <span className="text-blue-400 font-medium">{t('Calculado al final')}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <Link href="/checkout" className="block">
                        <button 
                          onClick={() => setShowMobileSidebar(false)}
                          className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
                        >
                          {t('Finalizar Compra')}
                        </button>
                      </Link>
                      <button 
                        onClick={() => setShowMobileSidebar(false)}
                        className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200"
                      >
                        {t('Ver Carrito Completo')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Contenido del panel de idioma/moneda */}
            {mobileSidebarContent === 'language' && (
              <div className="space-y-6">
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
            )}

            {/* Contenido del panel de búsqueda */}
            {mobileSidebarContent === 'search' && (
              <div className="space-y-4">
                <h3 className="text-xl text-white mb-4">{t('Buscar productos')}</h3>
                
                {/* Barra de búsqueda */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
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

                {/* Resultados de búsqueda */}
                {searchTerm && (
                  <div className="mt-4">
                    {searchLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse flex gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-white/20 rounded mb-2"></div>
                              <div className="h-3 bg-white/20 rounded w-2/3"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2 max-h-60">
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            className="cursor-pointer hover:bg-white/20 rounded-lg p-3 transition-colors duration-200"
                            onClick={() => {
                              router.push(`/producto/${product.id}`);
                              setShowMobileSidebar(false);
                              setSearchTerm('');
                            }}
                          >
                            <div className="flex gap-3">
                              <div className="w-12 h-12 bg-gray-400 rounded overflow-hidden flex-shrink-0">
                                {(() => {
                                  // Buscar imagen en diferentes estructuras posibles
                                  let imageUrl = null;
                                  
                                  if (product.imagen_principal) {
                                    imageUrl = product.imagen_principal;
                                  } else if (product.imagenes && Array.isArray(product.imagenes) && product.imagenes.length > 0) {
                                    imageUrl = product.imagenes[0].url || product.imagenes[0];
                                  } else if (product.variantes && Array.isArray(product.variantes) && product.variantes.length > 0) {
                                    const firstVariant = product.variantes[0];
                                    if (firstVariant.imagenes && Array.isArray(firstVariant.imagenes) && firstVariant.imagenes.length > 0) {
                                      imageUrl = firstVariant.imagenes[0].url || firstVariant.imagenes[0];
                                    }
                                  }
                                  
                                  return imageUrl ? (
                                    <Image
                                      src={imageUrl}
                                      alt={product.nombre}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.setAttribute('style', 'display: flex');
                                      }}
                                    />
                                  ) : null;
                                })()}
                                {/* Fallback icon cuando no hay imagen */}
                                <div className="w-full h-full bg-gray-500 flex items-center justify-center" style={{display: 'none'}}>
                                  <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm truncate">{product.nombre}</h4>
                                <p className="text-gray-300 text-xs">{product.categoria}</p>
                                <p className="text-white font-bold text-sm">
                                  {formatPrice(
                                    product.precio_referencia || product.precio || 0, 
                                    currentCurrency, 
                                    'MXN'
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">{t('No se encontraron resultados')}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contenido del panel de perfil */}
            {mobileSidebarContent === 'profile' && (
              <div className="space-y-6">
                {isAuthenticated && user ? (
                  <>
                    {/* Usuario autenticado */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {user?.nombres?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <h3 className="text-xl text-white mb-1">{t('¡Hola, {{name}}!').replace('{{name}}', `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'Usuario')}</h3>
                      <p className="text-gray-300 text-sm">{user?.correo || ''}</p>
                    </div>

                    {/* Información de Envío */}
                    <div className="bg-white/10 rounded-lg p-4 mb-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {t('Información de Envío')}
                      </h4>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex justify-between">
                          <span>{t('Envíos salen:')}</span>
                          <span className="text-green-400">{t('Al día siguiente')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('Entrega estándar:')}</span>
                          <span>{t('3-5 días')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('Entrega express:')}</span>
                          <span>{t('24-48 horas')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recomendación de Producto */}
                    <div className="bg-white/10 rounded-lg p-4 mb-6">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {t('Producto Recomendado')}
                      </h4>
                      {loadingRecommendation ? (
                        <div className="animate-pulse">
                          <div className="bg-white/20 h-20 rounded mb-2"></div>
                          <div className="bg-white/20 h-4 rounded mb-1"></div>
                          <div className="bg-white/20 h-4 rounded w-2/3"></div>
                        </div>
                      ) : recommendedProduct ? (
                        <div 
                          className="cursor-pointer hover:bg-white/20 rounded-lg p-2 transition-colors duration-200"
                          onClick={() => {
                            const productId = recommendedProduct.id || recommendedProduct.producto_id || recommendedProduct.id_producto || recommendedProduct.productId || recommendedProduct._id;
                            console.log('🔗 Navegando al producto con ID:', productId);
                            if (productId) {
                              router.push(`/producto/${productId}`);
                              setShowMobileSidebar(false);
                            } else {
                              console.error('❌ No se puede navegar: ID de producto no válido');
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-gray-400 rounded-lg overflow-hidden flex-shrink-0">
                              {(() => {
                                // Buscar imagen en diferentes estructuras
                                let imageUrl = null;
                                
                                console.log('🔍 Producto completo para imagen:', recommendedProduct);
                                
                                // Intentar diferentes propiedades de imagen
                                if (recommendedProduct.imagen_principal) {
                                  imageUrl = recommendedProduct.imagen_principal;
                                } else if (recommendedProduct.imagenes && Array.isArray(recommendedProduct.imagenes) && recommendedProduct.imagenes.length > 0) {
                                  imageUrl = recommendedProduct.imagenes[0].url || recommendedProduct.imagenes[0];
                                } else if (recommendedProduct.images && Array.isArray(recommendedProduct.images) && recommendedProduct.images.length > 0) {
                                  imageUrl = recommendedProduct.images[0].url || recommendedProduct.images[0];
                                } else if (recommendedProduct.variantes && Array.isArray(recommendedProduct.variantes) && recommendedProduct.variantes.length > 0) {
                                  // Buscar imagen en las variantes
                                  const firstVariant = recommendedProduct.variantes[0];
                                  if (firstVariant.imagenes && Array.isArray(firstVariant.imagenes) && firstVariant.imagenes.length > 0) {
                                    imageUrl = firstVariant.imagenes[0].url || firstVariant.imagenes[0];
                                  } else if (firstVariant.imagen_url) {
                                    imageUrl = firstVariant.imagen_url;
                                  }
                                } else if (recommendedProduct.imagen_url) {
                                  imageUrl = recommendedProduct.imagen_url;
                                } else if (recommendedProduct.image) {
                                  imageUrl = recommendedProduct.image;
                                } else if (recommendedProduct.foto) {
                                  imageUrl = recommendedProduct.foto;
                                }
                                
                                console.log('🖼️ URL de imagen detectada:', imageUrl);
                                
                                return imageUrl ? (
                                  <img 
                                    src={imageUrl} 
                                    alt={recommendedProduct.nombre || recommendedProduct.name || 'Producto'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.log('❌ Error cargando imagen:', imageUrl);
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.setAttribute('style', 'display: flex');
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                );
                              })()}
                              {/* Fallback icon (hidden by default, shown when image fails) */}
                              <div className="w-full h-full bg-gray-500 flex items-center justify-center" style={{display: 'none'}}>
                                <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-white text-sm font-medium truncate">
                                {recommendedProduct.nombre || recommendedProduct.name || recommendedProduct.titulo || 'Producto sin nombre'}
                              </h5>
                              <p className="text-gray-300 text-xs line-clamp-2">
                                {recommendedProduct.descripcion || recommendedProduct.description || recommendedProduct.resumen || 'Sin descripción disponible'}
                              </p>
                              <div className="mt-1">
                                {(() => {
                                  // Obtener el precio base del producto
                                  let basePrice = 0;
                                  
                                  // Buscar precio en diferentes estructuras
                                  if (recommendedProduct.variantes && recommendedProduct.variantes.length > 0) {
                                    const firstVariant = recommendedProduct.variantes[0];
                                    basePrice = firstVariant.precio || basePrice;
                                  }
                                  
                                  // Si aún no hay precio, buscar en otros campos
                                  if (basePrice === 0) {
                                    basePrice = recommendedProduct.precio || recommendedProduct.price || 0;
                                  }
                                  
                                  // Verificar si tiene descuento real
                                  const hasRealDiscount = recommendedProduct.hasDiscount && 
                                                        recommendedProduct.price && 
                                                        recommendedProduct.originalPrice && 
                                                        recommendedProduct.price < recommendedProduct.originalPrice;
                                  
                                  if (hasRealDiscount) {
                                    return (
                                      <div className="flex items-center gap-2">
                                        <span className="text-green-400 text-sm font-medium">
                                          {formatPrice(recommendedProduct.price, currentCurrency, 'MXN')}
                                        </span>
                                        <span className="text-gray-400 text-xs line-through">
                                          {formatPrice(recommendedProduct.originalPrice, currentCurrency, 'MXN')}
                                        </span>
                                        <span className="text-xs text-yellow-400">
                                          -{Math.round(((recommendedProduct.originalPrice - recommendedProduct.price) / recommendedProduct.originalPrice) * 100)}% OFF
                                        </span>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <span className="text-green-400 text-sm font-medium">
                                        {formatPrice(basePrice, currentCurrency, 'MXN')}
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-300 text-sm">{t('No hay recomendaciones disponibles')}</p>
                        </div>
                      )}
                    </div>

                    {/* Opciones del perfil */}
                    <div className="space-y-2">
                      {canAccessAdminPanel && canAccessAdminPanel(user.rol) && (
                        <Link
                          href="/admin"
                          className="block px-4 py-3 text-white hover:bg-white/20 rounded-md transition-colors"
                          onClick={() => setShowMobileSidebar(false)}
                        >
                          {t('Panel de Administración')}
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setShowMobileSidebar(false);
                        }}
                        className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-400 hover:text-white rounded-md transition-colors"
                      >
                        {t('Cerrar Sesión')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-white mb-4">{t('Inicia sesión para acceder a tu cuenta')}</p>
                    <Link
                      href="/login"
                      className="block w-full bg-white text-black text-center py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMobileSidebar(false)}
                    >
                      {t('Iniciar Sesión')}
                    </Link>
                    <Link
                      href="/register"
                      className="block w-full bg-transparent border border-white text-white text-center py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-colors"
                      onClick={() => setShowMobileSidebar(false)}
                    >
                      {t('Registrarse')}
                    </Link>
                  </div>
                )}
              </div>
            )}

          </div>
          
          {/* Botones de navegación inferior */}
          <div className="border-t border-white/20 p-4">
            <div className="grid grid-cols-3 gap-2">
              {mobileSidebarContent !== 'language' && (
                <button
                  onClick={() => setMobileSidebarContent('language')}
                  className="flex flex-col items-center py-3 px-2 text-white bg-gradient-to-br from-green-600 to-green-800 rounded-md"
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span className="text-xs">{t('Idioma')}</span>
                </button>
              )}
              {mobileSidebarContent !== 'profile' && (
                <button
                  onClick={() => setMobileSidebarContent('profile')}
                  className="flex flex-col items-center py-3 px-2 text-white bg-gradient-to-br from-green-600 to-green-800 rounded-md"
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs">{t('Perfil')}</span>
                </button>
              )}
              {mobileSidebarContent !== 'search' && (
                <button
                  onClick={() => setMobileSidebarContent('search')}
                  className="flex flex-col items-center py-3 px-2 text-white bg-gradient-to-br from-green-600 to-green-800 rounded-md"
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-xs">{t('Buscar')}</span>
                </button>
              )}
              {mobileSidebarContent !== 'cart' && (
                <button
                  onClick={() => setMobileSidebarContent('cart')}
                  className="flex flex-col items-center py-3 px-2 text-white bg-gradient-to-br from-green-600 to-green-800 rounded-md relative"
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5-6M7 13l-2.5 6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"/>
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                  <span className="text-xs">{t('Carrito')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      
      {/* Menú Móvil Izquierdo (Categorías) */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-black/95 backdrop-blur-lg z-50 transform transition-transform duration-300 ease-out ${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
      } md:hidden`}>
        <div className="flex flex-col h-full">
          {/* Header del menú con logo */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="text-white text-xl font-bold tracking-[4px]">
              {t('TREBOLUXE')}
            </div>
            <button 
              onClick={() => setShowMobileMenu(false)}
              className="p-2 text-white bg-gradient-to-br from-red-500 to-red-700 rounded-md transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Categorías */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-white text-lg font-semibold mb-4 tracking-[2px]">
              {t('CATEGORÍAS')}
            </h3>
            <div className="space-y-2">
              {/* Todas las categorías */}
              <Link 
                href="/catalogo?categoria=todas" 
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-3 text-white hover:bg-white/20 rounded-md transition-colors border-b border-gray-600/30"
              >
                <span className="font-semibold">{t('Todas las categorías')}</span>
              </Link>
              
              {/* Categorías dinámicas */}
              {activeCategories.map((category) => (
                <Link 
                  key={category.id} 
                  href={`/catalogo?categoria=${category.slug}`} 
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-3 text-white hover:bg-white/20 rounded-md transition-colors"
                >
                  {t(category.name)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar menú móvil izquierdo */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Overlay para cerrar sidebar móvil derecho */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CarritoPage;

