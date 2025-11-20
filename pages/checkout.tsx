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
import StripePayment from '../components/StripePayment';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryTime: string;
}

const CheckoutPage: NextPage = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  
  // Hook de categorías para la navbar
  const { categories: activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  
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

  // Refs para los dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

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

  // Usar el carrito integrado con la base de datos
  const { items: cartItems, totalItems, totalFinal: totalPrice, removeFromCart, updateQuantity, isLoading, cartId } = useCart();

  // Información personal
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Información de envío
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'México',
    colonia: '',
    referencias: ''
  });

  // Estados para auto-llenado de información de envío
  const [userShippingLoaded, setUserShippingLoaded] = useState(false);
  const [shippingUpdateAvailable, setShippingUpdateAvailable] = useState(false);
  const [updateShippingInfo, setUpdateShippingInfo] = useState(false);

  // Métodos de envío disponibles
  const shippingMethods: ShippingMethod[] = [
    {
      id: 'standard',
      name: 'Envío Estándar',
      description: 'Entrega en 5-7 días hábiles',
      price: 50,
      deliveryTime: '5-7 días'
    },
    {
      id: 'express',
      name: 'Envío Express',
      description: 'Entrega en 2-3 días hábiles',
      price: 120,
      deliveryTime: '2-3 días'
    },
    {
      id: 'overnight',
      name: 'Envío Nocturno',
      description: 'Entrega al día siguiente',
      price: 200,
      deliveryTime: '1 día'
    }
  ];

  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [acceptPromotions, setAcceptPromotions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'traditional'>('stripe');
  
  // Estado para seguro del paquete
  const [packageInsurance, setPackageInsurance] = useState(false);

  // Estados para cotizaciones dinámicas de envío
  const [shippingQuotes, setShippingQuotes] = useState<any[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [quotesError, setQuotesError] = useState('');
  const [formsCompleted, setFormsCompleted] = useState(false);

  // Estados para el producto recomendado
  const [recommendedProduct, setRecommendedProduct] = useState<any>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  // Estados para búsqueda
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Estados para promociones (como en carrito e index)
  const [promotions, setPromotions] = useState<Record<number, any[]>>({});
  const [loadingPromotions, setLoadingPromotions] = useState(false);

  // Helper function para detectar país México de forma robusta
  const isMexico = (country: string) => {
    if (!country) return true; // Default a México si no hay país
    const normalized = country.toLowerCase().trim();
    return normalized === 'méxico' || 
           normalized === 'mexico' || 
           normalized === 'mx' ||
           normalized === 'mex';
  };

  // Estados para manejo de colonias dinámicas
  const [colonias, setColonias] = useState<Array<{nombre: string, tipo: string}>>([]);
  const [loadingColonias, setLoadingColonias] = useState(false);
  const [cpError, setCpError] = useState('');

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

  // Función para manejar la búsqueda en tiempo real (igual que carrito)
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

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      console.log('🔍 [CHECKOUT] Iniciando búsqueda con query:', query);
      
      // Usar productsApi.getAll() como en el carrito
      const response = await productsApi.getAll() as any;
      let allProducts: any[] = [];
      
      if (response.success && response.products && response.products.length > 0) {
        allProducts = response.products;
        console.log('📦 [CHECKOUT] Productos de API:', allProducts.length);

        // Enriquecer con precios de variants
        try {
          const stockResponse = await fetch('/api/products/variants');
          if (stockResponse.ok) {
            const stockData = await stockResponse.json();
            
            allProducts = allProducts.map(product => {
              const productId = product.id || product.id_producto || product.producto_id || product.productId || product._id;
              const productVariants = stockData.variants.filter((v: any) => {
                const variantProductId = v.id_producto || v.producto_id || v.productId || v._id || v.id;
                return variantProductId === productId;
              });
              
              if (productVariants.length > 0) {
                const variant = productVariants[0];
                const precioRaw = variant.precio_base || variant.precio || variant.price || variant.precio_unitario || variant.precio_venta || variant.precio_minimo || 0;
                const precio = typeof precioRaw === 'string' ? parseFloat(precioRaw) : Number(precioRaw) || 0;
                
                return {
                  ...product,
                  precio_base: precio,
                  precio: precio,
                  precio_referencia: precio
                };
              }
              return product;
            });
            
            console.log('💰 [CHECKOUT] Productos enriquecidos con precios:', allProducts.length);
            
            // Aplicar promociones si están disponibles
            if (Object.keys(promotions).length > 0) {
              allProducts = productUtils.applyPromotionDiscounts(allProducts, promotions);
              console.log('✅ [CHECKOUT] Promociones aplicadas a productos de búsqueda');
            }
          }
        } catch (error) {
          console.warn('[CHECKOUT] Error fetching variants for pricing:', error);
        }
      }

      // Filtrar productos
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
      
      console.log('🎯 [CHECKOUT] Productos filtrados:', filtered.length, 'de', allProducts.length);
      setSearchResults(filtered.slice(0, 5)); // Limitar a 5 resultados
    } catch (error) {
      console.error('[CHECKOUT] Error buscando productos:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = async (value: string) => {
    setSearchTerm(value);
    
    if (value.trim().length >= 2) {
      // Usar debounce
      setTimeout(() => {
        if (value === searchTerm) { // Solo ejecutar si el valor no ha cambiado
          searchProducts(value);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }
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

  // Funciones para menú móvil (como en carrito e index)
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const openMobileSidebar = (content: 'cart' | 'language' | 'profile' | 'search') => {
    setMobileSidebarContent(content);
    setShowMobileSidebar(true);
    setShowMobileMenu(false);
  };

  const closeMobileSidebar = () => {
    setShowMobileSidebar(false);
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

  // Cálculos del pedido - usar totalPrice del carrito
  const calculateSubtotal = () => {
    return totalPrice;
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    
    // Si no hay método de envío seleccionado, retornar 0
    if (!selectedShippingMethod) {
      return 0;
    }
    
    // Si hay cotizaciones dinámicas disponibles y una está seleccionada
    if (shippingQuotes.length > 0) {
      const selectedQuote = shippingQuotes.find((quote, index) => {
        if (!quote) return false;
        const quoteId = `${quote.carrier || 'unknown'}_${quote.service?.replace(/\s+/g, '_') || 'standard'}_${index}`;
        return quoteId === selectedShippingMethod;
      });
      
      if (selectedQuote && selectedQuote.price !== null && selectedQuote.price !== undefined) {
        return parseFloat(selectedQuote.price.toString()) || 0;
      }
    }
    
    // Fallback a los métodos estáticos si no hay cotizaciones dinámicas
    if (subtotal >= 500) return 0; // Envío gratis
    const selectedMethod = shippingMethods.find(method => method.id === selectedShippingMethod);
    return selectedMethod ? selectedMethod.price : 0;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.16; // 16% IVA
  };

  const calculateInsurance = () => {
    if (!packageInsurance) return 0;
    return calculateSubtotal() * 0.10; // 10% del valor declarado
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax() + calculateInsurance();
  };

  // Función para procesar el pago tradicional (fallback)
  const handleTraditionalPayment = async () => {
    setIsProcessing(true);
    
    // Simulación de procesamiento de pago
    setTimeout(() => {
      setIsProcessing(false);
      alert(t('¡Pago procesado exitosamente! Pronto recibirás una confirmación por email.'));
      router.push('/');
    }, 3000);
  };

  // Función para manejar el éxito del pago con Stripe
  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    console.log('✅ [CHECKOUT] Pago exitoso con Stripe, creando orden...', paymentIntentId);
    
    try {
      // 1. Guardar información de envío si el usuario lo solicita
      if (user && updateShippingInfo) {
        await saveUserShippingInfo();
      }

      // 2. Preparar datos para crear la orden
      const orderData = {
        // Datos del carrito
        cartItems: cartItems.map(item => ({
          id_producto: item.productId,
          id_variante: item.variantId,
          id_talla: item.tallaId,
          cantidad: item.quantity,
          precio_unitario: item.finalPrice, // Usar precio final con descuento aplicado
          producto_nombre: item.name,
          categoria: 'general', // Por defecto, se puede obtener de la BD después
          peso_gramos: 100 // Peso por defecto, se puede obtener de la BD después
        })),
        
        // Datos del usuario
        userId: user?.id_usuario || null,
        
        // Datos de envío
        shippingInfo: {
          nombre_completo: `${personalInfo.firstName} ${personalInfo.lastName}`,
          telefono: personalInfo.phone,
          direccion: shippingInfo.address,
          ciudad: shippingInfo.city,
          estado: shippingInfo.state,
          codigo_postal: shippingInfo.zipCode,
          colonia: shippingInfo.colonia,
          referencias: shippingInfo.referencias,
          pais: isMexico(shippingInfo.country) ? 'MX' : 
                shippingInfo.country === 'Estados Unidos' ? 'US' : 
                shippingInfo.country === 'Canadá' ? 'CA' : 'MX',
          correo: personalInfo.email
        },
        
        // Datos del pago
        paymentIntentId: paymentIntentId,
        paymentStatus: 'succeeded',
        
        // Datos de costos
        subtotal: calculateSubtotal(),
        iva: calculateTax(),
        total: calculateTotal(),
        moneda: currentCurrency.toUpperCase(),
        tasaCambio: 1.0,
        
        // Datos de envío
        metodoEnvio: selectedShippingMethod,
        costoEnvio: calculateShipping(),
        
        // Datos de seguro del paquete
        seguroPaquete: packageInsurance,
        costoSeguro: calculateInsurance()
      };

      console.log('📦 [CHECKOUT] Datos de la orden preparados:', orderData);

      // 3. Crear la orden en el backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ [CHECKOUT] Orden creada exitosamente:', result.order);
        
        // 4. Mostrar mensaje de éxito con información de la orden
        alert(t(`¡Pago procesado exitosamente! 
        
Número de orden: ${result.order.numero_referencia}
Total: $${result.order.total} ${result.order.moneda}

${result.order.skydropx_created ? 
  'Tu orden ha sido enviada automáticamente a nuestro sistema de envíos.' : 
  'Tu orden está siendo procesada.'
}

Pronto recibirás una confirmación por email.`));
        
        // 5. Limpiar carrito y redirigir
        // clearCart(); // Si tienes esta función en el contexto del carrito
        router.push('/');
        
      } else {
        console.error('❌ [CHECKOUT] Error creando orden:', result.message);
        alert(t('El pago fue exitoso, pero ocurrió un error procesando tu orden. Por favor contacta soporte con tu referencia de pago.'));
      }

    } catch (error) {
      console.error('❌ [CHECKOUT] Error en post-pago:', error);
      alert(t('El pago fue exitoso, pero ocurrió un error procesando tu orden. Por favor contacta soporte.'));
    }
  };

  // Función para manejar errores de pago con Stripe
  const handleStripePaymentError = (error: any) => {
    console.error('Error en el pago con Stripe:', error);
    setIsProcessing(false);
  };

  // Validación del formulario
  const isFormValid = () => {
    return (
      personalInfo.firstName &&
      personalInfo.lastName &&
      personalInfo.email &&
      personalInfo.phone &&
      shippingInfo.address &&
      shippingInfo.city &&
      shippingInfo.state &&
      shippingInfo.zipCode &&
      shippingInfo.colonia &&
      selectedShippingMethod
    );
  };

  // Función para verificar si los formularios están completos
  const areFormsCompleted = () => {
    return (
      personalInfo.firstName.trim() &&
      personalInfo.lastName.trim() &&
      personalInfo.email.trim() &&
      personalInfo.phone.trim() &&
      shippingInfo.address.trim() &&
      shippingInfo.city.trim() &&
      shippingInfo.state.trim() &&
      shippingInfo.zipCode.trim() &&
      shippingInfo.country.trim() &&
      shippingInfo.colonia.trim()
    );
  };

  // Función para solicitar cotizaciones de envío
  const handleGetShippingQuotes = async () => {
    if (!areFormsCompleted()) {
      console.log('📋 Formularios incompletos, no se pueden solicitar cotizaciones');
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
      console.log('🚚 Solicitando cotizaciones para checkout - CP:', shippingInfo.zipCode, 'CartId:', cartId);
      console.log('🔍 [DEBUG] shippingInfo.country valor exacto:', JSON.stringify(shippingInfo.country));
      console.log('🔍 [DEBUG] Comparación con México:', isMexico(shippingInfo.country));
      console.log('🔍 [DEBUG] Tipo de dato:', typeof shippingInfo.country);
      
      // Determinar endpoint según el país - versión robusta
      const endpoint = isMexico(shippingInfo.country)
        ? 'https://trebodeluxe-backend.onrender.com/api/skydropx/cart/quote-hybrid'
        : 'https://trebodeluxe-backend.onrender.com/api/skydropx/cart/quote-international';
      
      console.log('🔍 [DEBUG] Endpoint seleccionado:', endpoint.includes('hybrid') ? 'NACIONAL (hybrid)' : 'INTERNACIONAL');
      
      const requestBody = isMexico(shippingInfo.country) 
        ? {
            cartId: cartId.toString(),
            postalCode: shippingInfo.zipCode
          }
        : {
            cartId: cartId.toString(),
            postalCode: shippingInfo.zipCode,
            forceCountry: shippingInfo.country === 'Estados Unidos' ? 'US' : 
                         shippingInfo.country === 'Canadá' ? 'CA' : 'MX'
          };

      console.log('📡 Enviando request a:', endpoint);
      console.log('📦 Request body:', requestBody);

      // Primera solicitud
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error HTTP:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      let data = await response.json();
      console.log('📊 Respuesta recibida:', data);

      // Si la primera consulta no tiene cotizaciones exitosas, hacer reintento después de 3 segundos
      if (data.success && (!data.quotations || data.quotations.length === 0)) {
        console.log('⏳ Primera consulta sin cotizaciones exitosas. Reintentando en 3 segundos...');
        setQuotesError('Obteniendo cotizaciones de carriers... Por favor espera.');
        
        // Esperar 3 segundos y hacer segunda consulta
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔄 Realizando segunda consulta...');
        console.log('📡 Reintentando request a:', endpoint);
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📊 Retry response status:', response.status);
        if (response.ok) {
          data = await response.json();
          console.log('🔍 Segunda consulta completada:', data);
        }
      }

      if (data.success) {
        setShippingQuotes(data.quotations || []);
        setQuotesError(''); // Limpiar mensaje de espera
        console.log('✅ Cotizaciones obtenidas para checkout:', data.quotations);
        
        // No auto-seleccionar ninguna cotización para que el usuario elija
        if (data.quotations && data.quotations.length > 0) {
          console.log('📦 Cotizaciones disponibles, esperando selección del usuario');
        }
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

  // Función para cargar colonias por código postal
  const loadColoniasByCP = async (codigoPostal: string) => {
    if (!codigoPostal || codigoPostal.length < 5) {
      setColonias([]);
      setCpError('');
      return;
    }

    setLoadingColonias(true);
    setCpError('');

    try {
      console.log('🔍 [COLONIAS] Buscando colonias para CP:', codigoPostal);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/postal-codes/colonias/${codigoPostal}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [COLONIAS] Colonias encontradas:', data.colonias?.length || 0);
        setColonias(data.colonias || []);
        
        // Auto-llenar ubicación si está disponible
        if (data.success && data.estado && data.ciudad) {
          setShippingInfo(prev => ({
            ...prev,
            state: data.estado || prev.state,
            city: data.ciudad || prev.city
          }));
        }
      } else {
        const errorData = await response.json();
        console.log('❌ [COLONIAS] CP no encontrado:', errorData.error);
        setColonias([]);
        setCpError(errorData.error || 'Código postal no encontrado');
      }
    } catch (error) {
      console.error('❌ [COLONIAS] Error:', error);
      setColonias([]);
      setCpError('Error al buscar colonias');
    } finally {
      setLoadingColonias(false);
    }
  };

  // Handler para cambio de código postal
  const handleZipCodeChange = (value: string) => {
    setShippingInfo(prev => ({
      ...prev,
      zipCode: value,
      colonia: '' // Limpiar colonia al cambiar CP
    }));
    
    // Cargar colonias si el CP tiene 5 dígitos
    if (value.length === 5) {
      loadColoniasByCP(value);
    } else {
      setColonias([]);
      setCpError('');
    }
  };

  // Función para cargar información de envío del usuario logueado
  const loadUserShippingInfo = async () => {
    if (!user) {
      console.log('❌ [CHECKOUT] No hay usuario logueado');
      return;
    }

    try {
      console.log('📦 [CHECKOUT] Cargando información de envío para usuario:', user.nombres);
      
      const token = localStorage.getItem('token');
      console.log('🔍 [CHECKOUT] Token encontrado:', token ? `Sí (${token.length} caracteres)` : 'No');
      
      if (!token) {
        console.error('❌ [CHECKOUT] No se encontró token en localStorage');
        return;
      }

      // Verificar formato del token
      const tokenParts = token.split('.');
      console.log('🔍 [CHECKOUT] Token tiene', tokenParts.length, 'partes (debe ser 3 para JWT)');
      
      if (tokenParts.length !== 3) {
        console.error('❌ [CHECKOUT] Token tiene formato incorrecto, no es un JWT válido');
        console.log('🔍 [CHECKOUT] Token:', token.substring(0, 50) + '...');
        return;
      }

      console.log('📡 [CHECKOUT] Enviando request a:', `${process.env.NEXT_PUBLIC_API_URL}/api/shipping`);
      console.log('🔑 [CHECKOUT] Usando token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      console.log('📊 [CHECKOUT] Response status:', response.status);
      console.log('📊 [CHECKOUT] Response data:', data);
      
      if (data.success && data.shippingInfo) {
        const shipping = data.shippingInfo;
        console.log('✅ [CHECKOUT] Información de envío cargada:', shipping);
        
        // Llenar información personal
        setPersonalInfo({
          firstName: shipping.nombre_completo.split(' ')[0] || '',
          lastName: shipping.nombre_completo.split(' ').slice(1).join(' ') || '',
          email: user.correo || '',
          phone: shipping.telefono || ''
        });

        // Llenar información de envío
        setShippingInfo({
          address: shipping.direccion || '',
          city: shipping.ciudad || '',
          state: shipping.estado || '',
          zipCode: shipping.codigo_postal || '',
          country: shipping.pais || 'México',
          colonia: shipping.colonia || '',
          referencias: shipping.referencias || ''
        });

        // Cargar colonias si hay código postal
        if (shipping.codigo_postal) {
          loadColoniasByCP(shipping.codigo_postal);
        }

        setUserShippingLoaded(true);
        setShippingUpdateAvailable(true);
        
        console.log('✅ [CHECKOUT] Formularios auto-llenados para usuario logueado');
      } else {
        console.log('ℹ️ [CHECKOUT] No se encontró información de envío guardada');
        setUserShippingLoaded(false);
        setShippingUpdateAvailable(false);
      }
    } catch (error) {
      console.error('❌ [CHECKOUT] Error cargando información de envío:', error);
      setUserShippingLoaded(false);
      setShippingUpdateAvailable(false);
    }
  };

  // Función para actualizar información de envío del usuario
  const saveUserShippingInfo = async () => {
    if (!user || !updateShippingInfo) return;

    try {
      console.log('💾 [CHECKOUT] Guardando información de envío actualizada');
      
      const token = localStorage.getItem('token');
      const shippingData = {
        nombre_completo: `${personalInfo.firstName} ${personalInfo.lastName}`.trim(),
        telefono: personalInfo.phone,
        direccion: shippingInfo.address,
        ciudad: shippingInfo.city,
        estado: shippingInfo.state,
        codigo_postal: shippingInfo.zipCode,
        colonia: shippingInfo.colonia,
        pais: shippingInfo.country,
        referencias: shippingInfo.referencias || ''
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shippingData)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [CHECKOUT] Información de envío guardada exitosamente');
        // Mostrar feedback temporal al usuario
        alert('✅ Tu información de envío ha sido actualizada');
      } else {
        console.error('❌ [CHECKOUT] Error guardando información:', data.message);
      }
    } catch (error) {
      console.error('❌ [CHECKOUT] Error guardando información de envío:', error);
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

  // Cargar promociones activas al inicializar (igual que en carrito)
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        setLoadingPromotions(true);
        console.log('🎯 [CHECKOUT] Cargando promociones activas...');
        const promotionsResponse = await fetch('https://trebodeluxe-backend.onrender.com/api/promociones/activas');
        
        if (promotionsResponse.ok) {
          const promotionsData = await promotionsResponse.json();
          console.log('📊 [CHECKOUT] Promociones activas encontradas:', promotionsData);
          
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
            console.log('✅ [CHECKOUT] Promociones organizadas por producto:', Object.keys(promotionsByProduct).length, 'productos con promociones');
          }
        }
      } catch (error) {
        console.warn('[CHECKOUT] Error cargando promociones:', error);
      } finally {
        setLoadingPromotions(false);
      }
    };

    loadPromotions();
  }, []);

  // Forzar actualización de traducciones cuando cambia el idioma
  useEffect(() => {
    console.log('🌐 [CHECKOUT] Idioma cambiado a:', currentLanguage);
    // Forzar re-render del hook de traducción
  }, [currentLanguage]);

  // Cargar información de envío del usuario logueado
  useEffect(() => {
    if (user && !userShippingLoaded) {
      loadUserShippingInfo();
    }
  }, [user, userShippingLoaded]);

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

  // Efecto para detectar formularios completos y solicitar cotizaciones automáticamente
  useEffect(() => {
    const formsAreCompleted = areFormsCompleted();
    
    if (formsAreCompleted && !formsCompleted) {
      console.log('📋 Formularios completados, solicitando cotizaciones automáticamente...');
      setFormsCompleted(true);
      handleGetShippingQuotes();
    } else if (!formsAreCompleted && formsCompleted) {
      console.log('📋 Formularios incompletos, reseteando cotizaciones...');
      setFormsCompleted(false);
      setShippingQuotes([]);
      setQuotesError('');
    }
  }, [personalInfo, shippingInfo, formsCompleted]);

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
                <div className="w-[161.8px] relative h-[34px] hover:bg-gray-700 transition-colors duration-200 rounded cursor-pointer">
                  <div className="absolute h-full w-full top-[0%] left-[0%] tracking-[4px] leading-6 flex items-center justify-center text-white">
                    {t('PROMOCIONES')}
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
                    <Image
                      className="h-full w-full object-contain"
                      width={20}
                      height={20}
                      sizes="100vw"
                      alt="Panel de Administración"
                      src="/engranaje.svg"
                    />
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
                                {Object.keys(promotions).length === 0 
                                  ? t('Cargando productos...')
                                  : t('No hay productos en promoción disponibles')
                                }
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

      {/* Contenido principal del checkout */}
      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors no-underline text-gray-400">{t('Inicio')}</Link>
          <span>/</span>
          <Link href="/carrito" className="hover:text-white transition-colors no-underline text-gray-400">{t('Carrito')}</Link>
          <span>/</span>
          <span className="text-white">{t('Checkout')}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de checkout */}
          <div className="lg:col-span-2 space-y-8">
            <h1 className="text-3xl font-bold text-white">{t('Finalizar Compra')}</h1>

            {/* Banner de usuario logueado */}
            {user && (
              <div className="bg-gradient-to-r from-green-600/20 to-green-400/20 backdrop-blur-sm rounded-lg p-4 border border-green-400/30">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-300 text-sm font-bold">👤</span>
                  </div>
                  <div>
                    <h3 className="text-green-300 font-semibold">
                      {t('¡Hola')} {user.nombres}!
                    </h3>
                    <p className="text-green-200 text-sm">
                      {userShippingLoaded 
                        ? t('Hemos llenado tus datos automáticamente')
                        : t('Completa tu información para agilizar futuras compras')
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen del pedido en móvil */}
            <div className="lg:hidden bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">{t('Resumen del Pedido')}</h2>
              
              {/* Lista de productos */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={`${item.variantId}-${item.tallaId}`} className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-sm font-medium truncate">{item.name}</h3>
                      <p className="text-gray-400 text-xs">
                        {item.tallaName} | {item.variantName} | {t('Cantidad')}: {item.quantity}
                      </p>
                      <div className="text-sm">
                        {item.hasDiscount ? (
                          <div className="space-y-1">
                            <p className="text-xs text-red-400 line-through">
                              {formatPrice(item.price * item.quantity, currentCurrency, 'MXN')}
                            </p>
                            <p className="text-green-400 font-bold">
                              {formatPrice(item.finalPrice * item.quantity, currentCurrency, 'MXN')}
                            </p>
                            <p className="text-xs text-yellow-400">
                              -{item.discountPercentage}% OFF
                            </p>
                          </div>
                        ) : (
                          <p className="text-green-400 font-bold">
                            {formatPrice(item.finalPrice * item.quantity, currentCurrency, 'MXN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3 mb-6 border-t border-white/20 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t('Subtotal')}</span>
                  <span className="text-white font-medium">{formatPrice(calculateSubtotal(), currentCurrency, 'MXN')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t('Envío')}</span>
                  <span className={`font-medium ${
                    !selectedShippingMethod ? 'text-orange-400' :
                    calculateShipping() === 0 ? 'text-green-400' : 'text-white'
                  }`}>
                    {!selectedShippingMethod 
                      ? t('Seleccione un método de envío')
                      : calculateShipping() === 0 
                        ? t('Gratis') 
                        : formatPrice(calculateShipping(), currentCurrency, 'MXN')
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t('IVA (16%)')}</span>
                  <span className="text-white font-medium">{formatPrice(calculateTax(), currentCurrency, 'MXN')}</span>
                </div>
                
                {packageInsurance && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">{t('Seguro del paquete (10%)')}</span>
                    <span className="text-white font-medium">{formatPrice(calculateInsurance(), currentCurrency, 'MXN')}</span>
                  </div>
                )}
                
                <div className="border-t border-white/20 pt-3">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-white font-bold">{t('Total')}</span>
                    <span className="text-white font-bold">{formatPrice(calculateTotal(), currentCurrency, 'MXN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Personal */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">{t('Información Personal')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    {t('Nombre')} *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.firstName}
                    onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                    className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                    placeholder={t('Ingresa tu nombre')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    {t('Apellido')} *
                  </label>
                  <input
                    type="text"
                    value={personalInfo.lastName}
                    onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                    className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                    placeholder={t('Ingresa tu apellido')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    {t('Email')} *
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                    placeholder={t('correo@ejemplo.com')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    {t('Teléfono')} *
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                    className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                    placeholder={t('+52 123 456 7890')}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información de Envío */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">{t('Dirección de Envío')}</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    {t('Dirección')} *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                    className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                    placeholder={t('Calle y número')}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      {t('Ciudad')} *
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                      className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                      placeholder={t('Ciudad')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      {t('Estado')} *
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                      className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                      placeholder={t('Estado')}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      {t('Código Postal')} *
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.zipCode}
                      onChange={(e) => handleZipCodeChange(e.target.value)}
                      className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                      placeholder={t('12345')}
                      maxLength={5}
                      required
                    />
                    {cpError && (
                      <p className="text-red-400 text-sm mt-1">{cpError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      {t('País')} *
                    </label>
                    <select
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                      className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400/50 transition-colors"
                    >
                      <option value="México">{t('México')}</option>
                      <option value="Estados Unidos">{t('Estados Unidos')}</option>
                      <option value="Canadá">{t('Canadá')}</option>
                    </select>
                  </div>
                </div>

                {/* Segunda fila: Colonia y Referencias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      {t('Colonia')} *
                    </label>
                    {loadingColonias ? (
                      <div className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-gray-400 flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Cargando colonias...
                      </div>
                    ) : colonias.length > 0 ? (
                      <select
                        value={shippingInfo.colonia}
                        onChange={(e) => setShippingInfo({...shippingInfo, colonia: e.target.value})}
                        className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400/50 transition-colors"
                        required
                      >
                        <option value="">{t('Selecciona una colonia')}</option>
                        {colonias.map((colonia, index) => (
                          <option key={index} value={colonia.nombre}>
                            {colonia.nombre} ({colonia.tipo})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={shippingInfo.colonia}
                        onChange={(e) => setShippingInfo({...shippingInfo, colonia: e.target.value})}
                        className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                        placeholder={t('Ingresa la colonia manualmente')}
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      {t('Referencias del domicilio')}
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.referencias}
                      onChange={(e) => setShippingInfo({...shippingInfo, referencias: e.target.value})}
                      className="w-11/12 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                      placeholder={t('Ej: Entre calle A y B, edificio azul')}
                    />
                  </div>
                </div>
              </div>
              
              {/* Checkbox para actualizar información de envío del usuario logueado */}
              {user && shippingUpdateAvailable && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateShippingInfo}
                      onChange={(e) => setUpdateShippingInfo(e.target.checked)}
                      className="mt-1 w-4 h-4 text-green-500 bg-black/50 border border-white/20 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div>
                      <span className="text-white text-sm font-medium">
                        💾 {t('Guardar esta información para futuras compras')}
                      </span>
                      <p className="text-gray-300 text-xs mt-1">
                        {t('Si cambias algún dato, marca esta opción para actualizar tu información guardada')}
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Método de Envío */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">{t('Método de Envío')}</h2>
              
              {!formsCompleted && (
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 text-blue-300 text-sm mb-4">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium">{t('Completa la información para ver métodos de envío')}</p>
                      <p className="text-xs text-blue-200 mt-1">
                        {t('Llena todos los campos de información personal y dirección de envío para calcular opciones de envío automáticamente.')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen del carrito en móvil - ya no necesario */}
              {false && (
                <div className="lg:hidden bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
                  <h2 className="text-xl font-bold text-white mb-6">{t('Tu Pedido')}</h2>
                  
                  {/* Lista de productos */}
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={`${item.variantId}-${item.tallaId}`} className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white text-sm font-medium truncate">{item.name}</h3>
                          <p className="text-gray-400 text-xs">
                            {item.tallaName} | {item.variantName} | {t('Cantidad')}: {item.quantity}
                          </p>
                          <div className="text-sm">
                            {item.hasDiscount ? (
                              <div className="space-y-1">
                                <p className="text-xs text-red-400 line-through">
                                  {formatPrice(item.price * item.quantity, currentCurrency, 'MXN')}
                                </p>
                                <p className="text-white font-medium">
                                  {formatPrice(item.finalPrice * item.quantity, currentCurrency, 'MXN')}
                                  <span className="text-green-400 text-xs ml-2">
                                    -{Math.round(((item.price - item.finalPrice) / item.price) * 100)}%
                                  </span>
                                </p>
                              </div>
                            ) : (
                              <p className="text-white font-medium">
                                {formatPrice(item.price * item.quantity, currentCurrency, 'MXN')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Resumen de precios */}
                  <div className="border-t border-white/20 pt-4 space-y-3">
                    <div className="flex justify-between text-gray-400">
                      <span>{t('Subtotal')}</span>
                      <span>{formatPrice(calculateSubtotal(), currentCurrency)}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-400">
                      <span>{t('Envío')}</span>
                      <span>
                        {selectedShippingMethod ? formatPrice(calculateShipping(), currentCurrency) : t('Calculando...')}
                      </span>
                    </div>
                    
                    {packageInsurance && (
                      <div className="flex justify-between text-gray-400">
                        <span>{t('Seguro del paquete')}</span>
                        <span>{formatPrice(calculateTotal() * 0.02, currentCurrency)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-white text-lg font-bold pt-3 border-t border-white/20">
                      <span>{t('Total')}</span>
                      <span>{formatPrice(calculateTotal(), currentCurrency)}</span>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingQuotes && (
                <div className="bg-black/40 border border-white/20 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-white">
                      {quotesError.includes('espera') ? t('Reintentando...') : t('Calculando opciones de envío...')}
                    </span>
                  </div>
                  {quotesError && (
                    <p className="text-blue-300 text-sm mt-2">{quotesError}</p>
                  )}
                </div>
              )}

              {quotesError && !isLoadingQuotes && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 text-red-300 text-sm mb-4">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium">{t('Error al calcular envío')}</p>
                      <p className="text-xs text-red-200 mt-1">{quotesError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {shippingQuotes.length > 0 ? (
                  // Mostrar cotizaciones dinámicas
                  shippingQuotes.map((quote, index) => {
                    // Verificar que el quote tenga las propiedades necesarias
                    if (!quote || quote.price === null || quote.price === undefined) {
                      return null; // Skip this quote if it's invalid
                    }
                    
                    const quoteId = `${quote.carrier || 'unknown'}_${quote.service?.replace(/\s+/g, '_') || 'standard'}_${index}`;
                    return (
                      <div
                        key={quoteId}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                          selectedShippingMethod === quoteId
                            ? 'bg-black/60 border-green-400 shadow-lg shadow-green-400/20'
                            : 'bg-black/40 border-white/20 hover:bg-black/60 hover:border-green-400/50'
                        }`}
                        onClick={() => setSelectedShippingMethod(quoteId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedShippingMethod === quoteId
                                ? 'border-green-400 bg-green-400'
                                : 'border-white/50'
                            }`}>
                              {selectedShippingMethod === quoteId && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
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
                  }).filter(Boolean) // Remove null elements
                ) : formsCompleted && !isLoadingQuotes && !quotesError ? (
                  // Mostrar mensaje cuando no hay cotizaciones disponibles
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-yellow-300 text-sm">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium">{t('No hay opciones de envío disponibles')}</p>
                        <p className="text-xs text-yellow-200 mt-1">
                          {t('No se encontraron opciones de envío para la dirección especificada. Verifica el código postal.')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : !formsCompleted ? (
                  // Mostrar métodos de envío por defecto cuando los formularios no están completos
                  shippingMethods.map((method) => (
                    <div
                      key={method.id}
                      className="p-4 rounded-lg border bg-black/20 border-white/10 opacity-50 cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full border-2 border-white/30"></div>
                          <div>
                            <h3 className="text-white font-medium">{t(method.name)}</h3>
                            <p className="text-gray-400 text-sm">{t(method.description)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">
                            {method.price === 0 ? t('Gratis') : formatPrice(method.price, currentCurrency, 'MXN')}
                          </div>
                          <div className="text-gray-400 text-sm">{method.deliveryTime}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </div>

            {/* Método de Pago */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">{t('Método de Pago')}</h2>
              
              {/* Selector de método de pago */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer p-4 bg-black/40 border border-white/20 rounded-lg hover:bg-black/60 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'traditional')}
                      className="w-4 h-4 text-green-400 bg-black/50 border-white/20 focus:ring-green-400"
                    />
                    <div className="flex items-center space-x-3">
                      <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M1 4c0-1.1.9-2 2-2h18c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V4zm2 0v16h18V4H3z"/>
                        <path d="M5 6h14c.55 0 1 .45 1 1s-.45 1-1 1H5c-.55 0-1-.45-1-1s.45-1 1-1z"/>
                        <path d="M5 10h6c.55 0 1 .45 1 1s-.45 1-1 1H5c-.55 0-1-.45-1-1s.45-1 1-1z"/>
                      </svg>
                      <div>
                        <h3 className="text-white font-medium">{t('Stripe - Pago Seguro')}</h3>
                        <p className="text-gray-400 text-sm">{t('Tarjeta de crédito/débito, Apple Pay, Google Pay')}</p>
                      </div>
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer p-4 bg-black/40 border border-white/20 rounded-lg hover:bg-black/60 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="traditional"
                      checked={paymentMethod === 'traditional'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'traditional')}
                      className="w-4 h-4 text-green-400 bg-black/50 border-white/20 focus:ring-green-400"
                    />
                    <div className="flex items-center space-x-3">
                      <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <div>
                        <h3 className="text-white font-medium">{t('Método Tradicional')}</h3>
                        <p className="text-gray-400 text-sm">{t('Transferencia bancaria o pago en tienda')}</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Componente de pago según el método seleccionado */}
              {paymentMethod === 'stripe' && (
                <div className="mt-6">
                  {!selectedShippingMethod ? (
                    <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-6">
                      <div className="flex items-center space-x-3">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <div className="text-orange-300 font-semibold">{t('Método de envío requerido')}</div>
                          <div className="text-orange-400 text-sm mt-1">
                            {t('Por favor selecciona un método de envío para continuar con el pago.')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <StripePayment
                      amount={Math.round(calculateTotal() * 100)} // Convertir a centavos
                      currency={currentCurrency.toLowerCase()}
                      metadata={{
                        customer_email: personalInfo.email,
                        customer_name: `${personalInfo.firstName} ${personalInfo.lastName}`,
                        shipping_method: selectedShippingMethod,
                        order_items: cartItems.length.toString(),
                        shipping_cost: calculateShipping().toString()
                      }}
                      onPaymentSuccess={handleStripePaymentSuccess}
                      onPaymentError={handleStripePaymentError}
                      t={t}
                    />
                  )}
                </div>
              )}

              {paymentMethod === 'traditional' && (
                <div className="mt-6">
                  <div className="bg-black/30 border border-white/10 rounded-lg p-4 text-center text-gray-400">
                    <p className="mb-2">{t('🏦 Información para pago tradicional')}</p>
                    <p className="text-sm">{t('Se enviará la información de pago por email después de confirmar el pedido')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox de seguro del paquete */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={packageInsurance}
                  onChange={(e) => setPackageInsurance(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-400 bg-black/50 border-white/20 rounded focus:ring-blue-400 focus:ring-2"
                />
                <div>
                  <span className="text-white font-medium">
                    {t('Protección del paquete')} 
                    <span className="text-blue-400 ml-2">
                      (+{formatPrice(calculateInsurance(), currentCurrency, 'MXN')})
                    </span>
                  </span>
                  <p className="text-gray-400 text-sm mt-1">
                    {t('Protege tu paquete contra pérdidas o daños durante el envío. Costo: 10% del valor declarado.')}
                  </p>
                </div>
              </label>
            </div>

            {/* Checkbox de promociones */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptPromotions}
                  onChange={(e) => setAcceptPromotions(e.target.checked)}
                  className="mt-1 w-4 h-4 text-green-400 bg-black/50 border-white/20 rounded focus:ring-green-400 focus:ring-2"
                />
                <div>
                  <span className="text-white font-medium">
                    {t('Recibir ofertas y promociones por email')}
                  </span>
                  <p className="text-gray-400 text-sm mt-1">
                    {t('Mantente informado sobre nuestras últimas ofertas, nuevos productos y promociones exclusivas.')}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 sticky top-4">
              <h2 className="text-xl font-bold text-white mb-6">{t('Resumen del Pedido')}</h2>
              
              {/* Lista de productos */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={`${item.variantId}-${item.tallaId}`} className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-sm font-medium truncate">{item.name}</h3>
                      <p className="text-gray-400 text-xs">
                        {item.tallaName} | {item.variantName} | {t('Cantidad')}: {item.quantity}
                      </p>
                      <div className="text-sm">
                        {item.hasDiscount ? (
                          <div className="space-y-1">
                            <p className="text-xs text-red-400 line-through">
                              {formatPrice(item.price * item.quantity, currentCurrency, 'MXN')}
                            </p>
                            <p className="text-green-400 font-bold">
                              {formatPrice(item.finalPrice * item.quantity, currentCurrency, 'MXN')}
                            </p>
                            <p className="text-xs text-yellow-400">
                              -{item.discountPercentage}% OFF
                            </p>
                          </div>
                        ) : (
                          <p className="text-green-400 font-bold">
                            {formatPrice(item.finalPrice * item.quantity, currentCurrency, 'MXN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3 mb-6 border-t border-white/20 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t('Subtotal')}</span>
                  <span className="text-white font-medium">{formatPrice(calculateSubtotal(), currentCurrency, 'MXN')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t('Envío')}</span>
                  <span className={`font-medium ${
                    !selectedShippingMethod ? 'text-orange-400' :
                    calculateShipping() === 0 ? 'text-green-400' : 'text-white'
                  }`}>
                    {!selectedShippingMethod 
                      ? t('Seleccione un método de envío')
                      : calculateShipping() === 0 
                        ? t('Gratis') 
                        : formatPrice(calculateShipping(), currentCurrency, 'MXN')
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t('IVA (16%)')}</span>
                  <span className="text-white font-medium">{formatPrice(calculateTax(), currentCurrency, 'MXN')}</span>
                </div>
                
                {packageInsurance && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">{t('Seguro del paquete (10%)')}</span>
                    <span className="text-white font-medium">{formatPrice(calculateInsurance(), currentCurrency, 'MXN')}</span>
                  </div>
                )}
                
                <div className="border-t border-white/20 pt-3">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-white font-bold">{t('Total')}</span>
                    <span className="text-white font-bold">{formatPrice(calculateTotal(), currentCurrency, 'MXN')}</span>
                  </div>
                </div>
              </div>

              {/* Botón de pago solo para método tradicional */}
              {paymentMethod === 'traditional' && (
                <button
                  onClick={handleTraditionalPayment}
                  disabled={!isFormValid() || isProcessing}
                  className="w-full bg-black/60 backdrop-blur-md border border-green-400/40 disabled:bg-black/30 disabled:border-white/20 disabled:cursor-not-allowed text-white disabled:text-gray-500 py-4 px-6 rounded-lg font-medium transition-all duration-300 text-lg hover:bg-black/80 hover:border-green-400/60 hover:text-green-300"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('Procesando...')}</span>
                    </div>
                  ) : (
                    `${t('Confirmar Pedido')} ${formatPrice(calculateTotal(), currentCurrency, 'MXN')}`
                  )}
                </button>
              )}

              {/* Información de seguridad */}
              <div className="mt-6 pt-6 border-t border-white/20 text-xs text-gray-400 space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>{t('Pago 100% seguro con SSL')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('Garantía de devolución de 30 días')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{t('Confirmación por email')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel lateral móvil */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-black/95 backdrop-blur-lg z-50 transform transition-transform duration-300 ease-out ${
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
              <div className="space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🛒</div>
                    <p className="text-white mb-4">{t('Tu carrito está vacío')}</p>
                    <Link href="/catalogo" className="inline-block bg-white text-black py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors">
                      {t('Explorar Productos')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={`${item.productId}-${item.variantId}-${item.tallaId}`} className="border border-white/20 rounded-lg p-3 bg-white/10">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-400 rounded overflow-hidden">
                            {item.image && (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                            {item.variantName && <p className="text-gray-300 text-xs">{item.variantName}</p>}
                            {item.tallaName && <p className="text-gray-300 text-xs">Talla: {item.tallaName}</p>}
                            <p className="text-white font-bold text-sm">{formatPrice(item.finalPrice, currentCurrency)}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.variantId, item.tallaId, Math.max(1, item.quantity - 1))}
                                  className="w-6 h-6 bg-white/20 text-white rounded text-xs flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="text-white text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.variantId, item.tallaId, item.quantity + 1)}
                                  className="w-6 h-6 bg-white/20 text-white rounded text-xs flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.productId, item.variantId, item.tallaId)}
                                className="text-red-400 hover:text-red-300 text-xs bg-transparent hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
                              >
                                {t('Eliminar')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-4 bg-white/10 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-white font-bold">{t('Total')}</span>
                        <span className="text-white font-bold text-lg">{formatPrice(totalPrice, currentCurrency)}</span>
                      </div>
                      <div className="text-gray-300 text-sm text-center">
                        {t('Ya estás en el proceso de checkout')}
                      </div>
                    </div>
                  </div>
                )}
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
                              setShowMobileSidebar(false);
                              setSearchTerm('');
                            }}
                          >
                            <div className="flex gap-3">
                              <div className="w-12 h-12 bg-gray-400 rounded overflow-hidden flex-shrink-0">
                                {(() => {
                                  // Buscar imagen en diferentes estructuras
                                  let imageUrl = null;
                                  
                                  // Intentar diferentes propiedades de imagen
                                  if (product.imagen_principal) {
                                    imageUrl = product.imagen_principal;
                                  } else if (product.imagenes && Array.isArray(product.imagenes) && product.imagenes.length > 0) {
                                    imageUrl = product.imagenes[0].url || product.imagenes[0];
                                  } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                                    imageUrl = product.images[0].url || product.images[0];
                                  } else if (product.variantes && Array.isArray(product.variantes) && product.variantes.length > 0) {
                                    // Buscar imagen en las variantes
                                    const firstVariant = product.variantes[0];
                                    if (firstVariant.imagenes && Array.isArray(firstVariant.imagenes) && firstVariant.imagenes.length > 0) {
                                      imageUrl = firstVariant.imagenes[0].url || firstVariant.imagenes[0];
                                    } else if (firstVariant.imagen_url) {
                                      imageUrl = firstVariant.imagen_url;
                                    }
                                  } else if (product.imagen_url) {
                                    imageUrl = product.imagen_url;
                                  } else if (product.image) {
                                    imageUrl = product.image;
                                  } else if (product.foto) {
                                    imageUrl = product.foto;
                                  }
                                  
                                  return imageUrl ? (
                                    <img 
                                      src={imageUrl} 
                                      alt={product.nombre || product.name || 'Producto'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
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
                                  {product.nombre || product.name || 'Producto sin nombre'}
                                </h5>
                                <p className="text-gray-300 text-xs truncate">
                                  {product.descripcion || product.description || 'Sin descripción disponible'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-white/20">
                          <button
                            onClick={() => {
                              handleSearch();
                              setShowMobileSidebar(false);
                            }}
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
                          setShowMobileSidebar(false);
                        }}
                        className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                      >
                        {t('Camisas')}
                      </button>
                      <button 
                        onClick={() => {
                          router.push('/catalogo?busqueda=Pantalones');
                          setShowMobileSidebar(false);
                        }}
                        className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                      >
                        {t('Pantalones')}
                      </button>
                      <button 
                        onClick={() => {
                          router.push('/catalogo?busqueda=Vestidos');
                          setShowMobileSidebar(false);
                        }}
                        className="bg-white/20 text-white px-3 py-1 rounded-full text-sm hover:bg-white/30 transition-colors duration-200"
                      >
                        {t('Vestidos')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contenido del panel de idioma */}
            {mobileSidebarContent === 'language' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 tracking-[1px]">{t('Idioma')}</h4>
                  <div className="space-y-2">
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

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 tracking-[1px]">{t('Moneda')}</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => changeCurrency('MXN')}
                      className={`w-full text-left px-4 py-3 text-white hover:bg-white hover:text-black transition-colors duration-200 rounded-md ${
                        currentCurrency === 'MXN' ? 'bg-gray-800' : 'bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🇲🇽</span>
                          <span>Peso Mexicano (MXN)</span>
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
                          <span className="text-2xl">🇺🇸</span>
                          <span>Dólar Americano (USD)</span>
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
                          <span className="text-2xl">🇪🇺</span>
                          <span>Euro (EUR)</span>
                        </div>
                        {currentCurrency === 'EUR' && <span className="text-white font-bold">✓</span>}
                      </div>
                    </button>
                  </div>
                </div>
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
                            {Object.keys(promotions).length === 0 
                              ? t('Cargando productos...')
                              : t('No hay productos en promoción disponibles')
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={async () => {
                        try {
                          await logout();
                          setShowMobileSidebar(false);
                        } catch (error) {
                          console.error('Error al cerrar sesión:', error);
                        }
                      }}
                      className="w-full bg-transparent border-2 border-red-400 text-red-400 py-3 px-6 rounded-lg font-medium hover:bg-red-400 hover:text-white transition-colors duration-200"
                    >
                      {t('Cerrar sesión')}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Usuario no logueado */}
                    <div className="text-center">
                      <div className="mb-6">
                        <h3 className="text-xl text-white mb-2">{t('¡Bienvenido!')}</h3>
                        <p className="text-gray-300 text-sm">{t('Inicia sesión para acceder a tu cuenta')}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <Link 
                          href="/login"
                          className="bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 inline-block text-center"
                          onClick={() => setShowMobileSidebar(false)}
                        >
                          {t('Iniciar sesión')}
                        </Link>
                        <Link 
                          href="/register"
                          className=" bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200 inline-block text-center"
                          onClick={() => setShowMobileSidebar(false)}
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
                  </>
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

export default CheckoutPage;
