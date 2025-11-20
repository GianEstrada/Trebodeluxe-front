import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useUniversalTranslate } from '../../hooks/useUniversalTranslate';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/NewCartContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { useCategories } from '../../hooks/useCategories';
import { canAccessAdminPanel } from '../../utils/roles';
import { productsApi } from '../../utils/productsApi';
import { promotionsApi } from '../../utils/promotionsApi';
import Footer from '../../components/Footer';

// Interfaces para la nueva estructura de datos
interface ImagenVariante {
  id_imagen: number;
  url: string;
  public_id: string;
  orden: number;
}

interface TallaDisponible {
  id_talla: number;
  nombre_talla: string;
  cantidad?: number;
  precio?: number; // Precio específico por talla
}

interface Variante {
  id_variante: number;
  nombre: string;
  nombre_variante: string;
  precio: number | null;
  precio_original?: number;
  descuento_porcentaje: number | null;
  imagen_url?: string;
  imagenes: ImagenVariante[];
  stock_total: number;
  disponible: boolean;
  tallas_disponibles?: TallaDisponible[];
}

interface ProductData {
  id_producto: number;
  nombre: string;
  descripcion: string;
  categoria_nombre: string;
  id_categoria: number;
  marca: string;
  sistema_talla_nombre?: string;
  variantes: Variante[];
  tallas_disponibles: TallaDisponible[];
}

const ProductPage: NextPage = () => {
  const router = useRouter();
  const { id, variante } = router.query;
  const { user, isAuthenticated, logout } = useAuth();
  const { items: cartItems, addToCart, removeFromCart, clearCart, totalItems, totalFinal, updateQuantity, isLoading } = useCart();
  
  // Categories hook - exact same as catalog
  const { activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  
  // Exchange rates and formatting - exact same as catalog
  const { formatPrice } = useExchangeRates();
  
  // Estados para idioma
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t } = useUniversalTranslate(currentLanguage);
  const { headerSettings } = useSiteSettings();
  
  // Estados específicos del producto
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variante | null>(null);
  const [selectedSize, setSelectedSize] = useState<TallaDisponible | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);
  const [promotions, setPromotions] = useState<any>({});
  
  // 🔥 NUEVO: Estado para stock específico por variante (SOLUCIÓN AL PROBLEMA)
  const [variantStock, setVariantStock] = useState<TallaDisponible[]>([]);

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
  
  // Estados para animación del carrusel
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  
  // Estados para móvil
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [mobileSidebarContent, setMobileSidebarContent] = useState<'cart' | 'language' | 'profile' | 'search'>('cart');
  
  // Estados para búsqueda móvil - exact same as catalog
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recommendedProduct, setRecommendedProduct] = useState<any>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  
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

  // useEffect para cargar producto recomendado cuando el usuario está autenticado - EXACTO COMO EN CATÁLOGO
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('👤 Usuario autenticado detectado, cargando producto recomendado...');
      loadRandomProduct();
    }
  }, [isAuthenticated, user]);

  // useEffect para búsqueda en tiempo real - EXACTO COMO EN CATÁLOGO
  useEffect(() => {
    if (searchTerm.trim()) {
      console.log('🔍 Iniciando búsqueda en tiempo real para:', searchTerm);
      const debounceTimer = setTimeout(() => {
        searchProducts(searchTerm);
      }, 300); // Debounce de 300ms
      
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }
  }, [searchTerm]);

  // Seleccionar variante cuando cambie la URL o se carguen los datos
  useEffect(() => {
    if (productData && variante) {
      const variant = productData.variantes.find(v => v.id_variante === parseInt(variante as string));
      if (variant) {
        setSelectedVariant(variant);
        setSelectedImageIndex(0); // Reset image carousel
        // Seleccionar la primera talla disponible que tenga stock
        const firstAvailableSize = productData.tallas_disponibles.find(t => 
          // Buscar si esta talla tiene stock para esta variante específica
          // Por ahora seleccionamos la primera talla disponible
          true // TODO: implementar lógica de stock por talla
        );
        setSelectedSize(firstAvailableSize || productData.tallas_disponibles[0] || null);
      }
    } else if (productData && productData.variantes.length > 0) {
      // Si no hay variante especificada, seleccionar la primera con stock
      const firstAvailableVariant = productData.variantes.find(v => v.disponible && v.stock_total > 0) || productData.variantes[0];
      setSelectedVariant(firstAvailableVariant);
      setSelectedImageIndex(0);
      const firstAvailableSize = productData.tallas_disponibles[0] || null;
      setSelectedSize(firstAvailableSize);
    }
  }, [productData, variante]);

  // Resetear cantidad cuando cambie variante o talla
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant, selectedSize]);

  // Helper function para aplicar promociones a un precio
  const applyPromotion = (precio: number, varianteId: number) => {
    // Buscar promociones específicas para este producto
    const productPromotions = productData?.id_producto ? promotions[productData.id_producto] : null;
    
    if (!productPromotions || productPromotions.length === 0) {
      // Sin promociones - mostrar precio normal
      return {
        finalPrice: precio,
        originalPrice: precio,
        hasDiscount: false,
        discountPercentage: 0
      };
    }
    
    // Tomar la primera promoción (más prioritaria)
    const promotion = productPromotions[0];
    let discountedPrice = precio;
    let discountPercentage = 0;
    
    if (promotion.tipo === 'porcentaje' && promotion.porcentaje_descuento > 0) {
      discountPercentage = promotion.porcentaje_descuento;
      const discount = discountPercentage / 100;
      discountedPrice = precio * (1 - discount);
    }
    
    const result = {
      finalPrice: discountedPrice,
      originalPrice: precio,
      hasDiscount: discountedPrice < precio,
      discountPercentage,
      promotion
    };
    
    return result;
  };

  // 🔥 NUEVO: Cargar stock cuando se seleccione una variante (SOLUCIÓN AL PROBLEMA)
  useEffect(() => {
    if (selectedVariant) {
      loadVariantStock(selectedVariant.id_variante);
    }
  }, [selectedVariant]);

  const loadProductData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar la API utility para obtener el producto por ID
      const data = await productsApi.getById(id as string) as any;
      
      if (data.success && data.product) {
        const product = data.product;
        
        const productData: ProductData = {
          id_producto: product.id_producto,
          nombre: product.nombre,
          descripcion: product.descripcion,
          categoria_nombre: product.categoria_nombre,
          id_categoria: product.id_categoria,
          marca: product.marca,
          sistema_talla_nombre: product.sistema_talla_nombre,
          variantes: product.variantes || [],
          tallas_disponibles: product.tallas_disponibles || []
        };
        
        setProductData(productData);
        
        // Cargar promociones para este producto específico
        try {
          console.log('🔄 Iniciando carga de promociones para producto:', product.id_producto, 'categoría ID:', product.id_categoria);
          const promotionsResponse = await (promotionsApi as any).getPromotionsForProduct(product.id_producto, product.id_categoria);
          
          console.log('📡 Respuesta completa de promociones:', promotionsResponse);
          console.log('📊 Estructura de respuesta:', {
            hasSuccess: !!promotionsResponse?.success,
            hasPromotions: !!promotionsResponse?.promotions,
            hasProductKey: !!promotionsResponse?.[product.id_producto],
            keys: promotionsResponse ? Object.keys(promotionsResponse) : []
          });
          
          // Usar la misma lógica que en el index
          if (promotionsResponse && promotionsResponse.success && promotionsResponse.promotions) {
            setPromotions({ [product.id_producto]: promotionsResponse.promotions });
            console.log('🎯 Promociones cargadas correctamente:', promotionsResponse.promotions);
          } else {
            setPromotions({});
            console.log('ℹ️ No hay promociones para este producto - estructura no reconocida');
          }
        } catch (promotionError) {
          console.error('Error cargando promociones:', promotionError);
          setPromotions({});
        }
        
        // Para productos relacionados, usamos productos recientes de la misma categoría
        const relatedResponse = await productsApi.getRecentByCategory(4) as any;
        if (relatedResponse.success && relatedResponse.products) {
          const relatedProducts = relatedResponse.products
            .filter((p: any) => p.id_producto !== product.id_producto && p.categoria_nombre === product.categoria_nombre)
            .slice(0, 4)
            .map((p: any) => ({
              id_producto: p.id_producto,
              nombre: p.nombre,
              descripcion: p.descripcion,
              categoria_nombre: p.categoria_nombre,
              id_categoria: p.id_categoria,
              marca: p.marca,
              variantes: p.variantes || [],
              tallas_disponibles: p.tallas_disponibles || []
            }));
          
          setRelatedProducts(relatedProducts);
          
          // Cargar promociones para productos relacionados
          try {
            const relatedPromotions: any = {};
            for (const relatedProduct of relatedProducts) {
              try {
                const promotionResponse = await (promotionsApi as any).getPromotionsForProduct(relatedProduct.id_producto, relatedProduct.id_categoria);
                if (promotionResponse && promotionResponse.success && promotionResponse.promotions) {
                  relatedPromotions[relatedProduct.id_producto] = promotionResponse.promotions;
                }
              } catch (error) {
                console.log(`Sin promociones para producto ${relatedProduct.id_producto}`);
              }
            }
            
            // Combinar promociones del producto actual con las de productos relacionados
            setPromotions((prevPromotions: any) => ({ ...prevPromotions, ...relatedPromotions }));
            console.log('🎯 Promociones cargadas para productos relacionados:', relatedPromotions);
          } catch (error) {
            console.error('Error cargando promociones para productos relacionados:', error);
          }
        } else {
          // Si no hay productos por categoría específica, usar productos recientes generales
          const fallbackResponse = await productsApi.getRecent(8) as any;
          if (fallbackResponse.success && fallbackResponse.products) {
            const fallbackProducts = fallbackResponse.products
              .filter((p: any) => p.id_producto !== product.id_producto)
              .slice(0, 4)
              .map((p: any) => ({
                id_producto: p.id_producto,
                nombre: p.nombre,
                descripcion: p.descripcion,
                categoria_nombre: p.categoria_nombre,
                id_categoria: p.id_categoria,
                marca: p.marca,
                variantes: p.variantes || [],
                tallas_disponibles: p.tallas_disponibles || []
              }));
            
            setRelatedProducts(fallbackProducts);
            
            // Cargar promociones para productos relacionados (fallback)
            try {
              const relatedPromotions: any = {};
              for (const relatedProduct of fallbackProducts) {
                try {
                  const promotionResponse = await (promotionsApi as any).getPromotionsForProduct(relatedProduct.id_producto, relatedProduct.id_categoria);
                  if (promotionResponse && promotionResponse.success && promotionResponse.promotions) {
                    relatedPromotions[relatedProduct.id_producto] = promotionResponse.promotions;
                  }
                } catch (error) {
                  console.log(`Sin promociones para producto ${relatedProduct.id_producto}`);
                }
              }
              
              // Combinar promociones del producto actual con las de productos relacionados
              setPromotions((prevPromotions: any) => ({ ...prevPromotions, ...relatedPromotions }));
              console.log('🎯 Promociones cargadas para productos relacionados (fallback):', relatedPromotions);
            } catch (error) {
              console.error('Error cargando promociones para productos relacionados (fallback):', error);
            }
          }
        }
      } else {
        setError('Producto no encontrado');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };  const loadRelatedProducts = async (categoria: string, excludeId: number) => {
    try {
      const response = await productsApi.getRecent(20) as any;
      
      if (response.success && response.products) {
        // Filtrar productos de la misma categoría
        const relatedProducts = response.products
          .filter((p: any) => p.categoria_nombre === categoria && p.id_producto !== excludeId)
          .slice(0, 4)
          .map((p: any) => ({
            id_producto: p.id_producto,
            nombre: p.nombre,
            descripcion: p.descripcion,
            categoria_nombre: p.categoria_nombre,
            marca: p.marca,
            variantes: p.variantes || [],
            tallas_disponibles: p.tallas_disponibles || []
          }));

        setRelatedProducts(relatedProducts);
      }
    } catch (err) {
      console.error('Error loading related products:', err);
    }
  };

  const handleVariantChange = async (variant: Variante) => {
    setSelectedVariant(variant);
    setSelectedImageIndex(0); // Reset carousel
    
    // 🔥 NUEVO: Obtener stock específico por variante (SOLUCIÓN AL PROBLEMA)
    try {
      console.log(`🔍 Cargando stock para variante: ${variant.nombre} (ID: ${variant.id_variante})`);
      const stockResponse = await productsApi.getStockByVariant(variant.id_variante) as any;
      
      if (stockResponse.success && stockResponse.data.tallas_stock) {
        console.log(`✅ Stock obtenido para ${variant.nombre}:`, stockResponse.data.tallas_stock);
        setVariantStock(stockResponse.data.tallas_stock);
        
        // Resetear talla seleccionada para que el usuario elija nueva
        setSelectedSize(null);
      } else {
        console.warn(`⚠️ No se pudo obtener stock para variante ${variant.id_variante}`);
        setVariantStock([]);
      }
    } catch (error) {
      console.error('❌ Error obteniendo stock por variante:', error);
      setVariantStock([]);
    }
    
    // Cambiar la URL para reflejar la nueva variante
    router.push(`/producto/${id}?variante=${variant.id_variante}`, undefined, { shallow: true });
  };

  // 🔥 NUEVO: Función para cargar stock de variante específica
  const loadVariantStock = async (variantId: number) => {
    try {
      console.log(`🔍 Cargando stock inicial para variante ID: ${variantId}`);
      const stockResponse = await productsApi.getStockByVariant(variantId) as any;
      
      if (stockResponse.success && stockResponse.data.tallas_stock) {
        console.log(`✅ Stock inicial obtenido:`, stockResponse.data.tallas_stock);
        setVariantStock(stockResponse.data.tallas_stock);
      } else {
        console.warn(`⚠️ No se pudo obtener stock inicial para variante ${variantId}`);
        setVariantStock([]);
      }
    } catch (error) {
      console.error('❌ Error obteniendo stock inicial:', error);
      setVariantStock([]);
    }
  };

  const handleSizeChange = (size: TallaDisponible) => {
    setSelectedSize(size);
  };

  const handleImageChange = (index: number) => {
    setIsImageTransitioning(true);
    setTimeout(() => {
      setSelectedImageIndex(index);
      setIsImageTransitioning(false);
    }, 150);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedSize || !productData) {
      alert(t('Selecciona una variante y talla'));
      return;
    }

    // Validar que haya precio válido
    if (!selectedVariant.precio || selectedVariant.precio <= 0) {
      alert(t('Esta variante no está disponible'));
      return;
    }

    try {
      // Usar la nueva función addToCart con los parámetros correctos
      await addToCart(
        productData.id_producto,
        selectedVariant.id_variante,
        selectedSize.id_talla,
        quantity
      );
      
      // Nota: El toast/notificación se maneja automáticamente en el Context
      // Ya no necesitamos el alert manual
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(t('Error al agregar al carrito. Inténtalo de nuevo.'));
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    // Redirigir al checkout después de agregar al carrito
    setTimeout(() => {
      router.push('/checkout');
    }, 1000); // Dar más tiempo para que se complete la operación
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

  // Cargar preferencias guardadas al iniciar
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  // Función para manejar la búsqueda (redirige al catálogo)
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

  // Función para buscar productos en tiempo real - EXACTO COMO EN CATÁLOGO
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      console.log('🔍 Iniciando búsqueda con query:', query);
      
      // Buscar productos usando la API
      const response = await productsApi.getAll() as any;
      let allProducts = [];
      
      console.log('📦 Respuesta de API completa:', response);
      
      if (response.success && response.products) {
        allProducts = response.products;
        console.log('✅ Productos encontrados en response.products:', allProducts.length);
      } else if (response.success && response.data) {
        allProducts = response.data;
        console.log('✅ Productos encontrados en response.data:', allProducts.length);
      }
      
      console.log('🔍 Primer producto para debug:', allProducts[0]);
      
      // Filtrar productos que coincidan con la búsqueda
      const filtered = allProducts.filter((product: any) => {
        const searchInName = product.nombre?.toLowerCase().includes(query.toLowerCase());
        const searchInDescription = product.descripcion?.toLowerCase().includes(query.toLowerCase());
        const searchInCategory = product.categoria_nombre?.toLowerCase().includes(query.toLowerCase());
        
        console.log('🔍 Buscando en producto:', {
          nombre: product.nombre,
          descripcion: product.descripcion,
          categoria: product.categoria_nombre,
          matchName: searchInName,
          matchDescription: searchInDescription,
          matchCategory: searchInCategory
        });
        
        return searchInName || searchInDescription || searchInCategory;
      });

      console.log(`🎯 Encontrados ${filtered.length} productos para "${query}"`);
      
      // Procesar productos para agregar imágenes
      const processedResults = filtered.map((product: any) => {
        let imageUrl = null;
        
        // Intentar diferentes estructuras de imagen
        if (product.variantes && product.variantes[0]) {
          const firstVariant = product.variantes[0];
          
          // Nueva estructura: variantes[0].imagenes[0].url
          if (firstVariant.imagenes && firstVariant.imagenes[0] && firstVariant.imagenes[0].url) {
            imageUrl = firstVariant.imagenes[0].url;
          }
          // Estructura anterior: variantes[0].imagenes_variante[0].url
          else if (firstVariant.imagenes_variante && firstVariant.imagenes_variante[0] && firstVariant.imagenes_variante[0].url) {
            imageUrl = firstVariant.imagenes_variante[0].url;
          }
        }
        
        return {
          ...product,
          image: imageUrl,
          // Asegurar que tenga un ID consistente
          id: product.id_producto || product.id
        };
      });
      
      setSearchResults(processedResults.slice(0, 10)); // Limitar a 10 resultados
      
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Función para cargar producto recomendado - EXACTO COMO EN CATÁLOGO
  const loadRandomProduct = async () => {
    try {
      setLoadingRecommendation(true);
      console.log('🎲 Cargando producto recomendado...');
      
      const response = await productsApi.getAll() as any;
      if (response.success && response.data && response.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * response.data.length);
        const randomProduct = response.data[randomIndex];
        
        // Agregar imagen si está disponible
        if (randomProduct.variantes && randomProduct.variantes[0]) {
          const firstVariant = randomProduct.variantes[0];
          
          // Nueva estructura: variantes[0].imagenes[0].url
          if (firstVariant.imagenes && firstVariant.imagenes[0] && firstVariant.imagenes[0].url) {
            randomProduct.image = firstVariant.imagenes[0].url;
          }
          // Estructura anterior: variantes[0].imagenes_variante[0].url
          else if (firstVariant.imagenes_variante && firstVariant.imagenes_variante[0] && firstVariant.imagenes_variante[0].url) {
            randomProduct.image = firstVariant.imagenes_variante[0].url;
          }
        }
        
        setRecommendedProduct(randomProduct);
        console.log('✅ Producto recomendado cargado:', randomProduct.nombre);
      }
    } catch (error) {
      console.error('❌ Error cargando producto recomendado:', error);
    } finally {
      setLoadingRecommendation(false);
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
      <>
        <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
          <div className="text-white text-xl">Cargando producto...</div>
        </div>
      </>
    );
  }

  if (error || !productData) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
          <div className="text-white text-xl">{error || 'Producto no encontrado'}</div>
        </div>
      </>
    );
  }

  return (
    <>      
      {/* Navbar Móvil - Solo visible en pantallas pequeñas */}
      <div className="block md:hidden w-full bg-black/90 sticky top-0 z-50 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Botón de Menú (izquierda) */}
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="p-2 text-white bg-gradient-to-br from-green-600 to-green-800 rounded-md"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Texto central TREBOLUXE con botón home */}
          <div className="flex-1 flex items-center justify-center gap-3">
            <Link 
              href="/"
              className="p-2 text-white bg-gradient-to-br from-green-600 to-green-800 rounded-md hover:from-green-700 hover:to-green-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <h1 className="text-white text-xl font-bold tracking-[4px]">
              TREBOLUXE
            </h1>
          </div>
          
          {/* Botón de Opciones (derecha) */}
          <button 
            onClick={() => {
              setShowMobileSidebar(true);
              setMobileSidebarContent('cart');
            }}
            className="p-2 text-white bg-gradient-to-br from-green-600 to-green-800 rounded-md relative"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Textos Promocionales Móviles */}
      <div className="block md:hidden bg-gradient-to-r from-green-700 to-green-900 text-white py-2 z-40">
        <div className="overflow-hidden relative w-full h-full">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentTextIndex * 100}%)` }}
          >
            {promoTexts.map((text, index) => (
              <div 
                key={index}
                className="w-full h-full flex-shrink-0 flex items-center justify-center min-h-[36px]"
              >
                <div className="w-full flex items-center justify-center px-2">
                  <span 
                    className="font-medium text-center leading-tight w-full block"
                    style={{
                      fontSize: `clamp(12px, 3.5vw, 16px)`
                    }}
                  >
                    {t(text)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-full relative min-h-screen flex flex-col text-left text-Static-Body-Large-Size text-M3-white font-salsa overflow-x-hidden"
         style={{
           background: 'linear-gradient(180deg, #000 0%, #1a6b1a 25%, #0d3d0d 35%, #000 75%, #000 100%)'
         }}>
      
      <div className="self-stretch flex flex-col items-start justify-start text-Schemes-On-Surface font-Static-Body-Large-Font flex-shrink-0">
        <div className="self-stretch flex flex-col items-start justify-start text-center text-white font-salsa">
          <div className="self-stretch [background:linear-gradient(90deg,_#1a6b1a,_#0e360e)] h-10 hidden md:flex flex-row items-center justify-between !p-[5px] box-border">
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
                        <Link 
                          href="/catalogo" 
                          className="block px-4 py-3 text-white hover:bg-gray-700 transition-colors duration-200 no-underline rounded-md border-b border-gray-600 mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{t('Todas las categorías')}</span>
                            <span className="text-gray-400">→</span>
                          </div>
                        </Link>

                        {/* Renderizar categorías dinámicas - EXACTO COMO EN CATÁLOGO */}
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

                        {/* Fallback con categorías estáticas si no hay categorías dinámicas - EXACTO COMO EN CATÁLOGO */}
                        {!categoriesLoading && !categoriesError && activeCategories.length === 0 && (
                          <>
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
                          </>
                        )}

                        {/* Loading state - EXACTO COMO EN CATÁLOGO */}
                        {categoriesLoading && (
                          <div className="block px-4 py-3 text-gray-400">
                            <span>{t('Cargando categorías...')}</span>
                          </div>
                        )}

                        {/* Error state - EXACTO COMO EN CATÁLOGO */}
                        {categoriesError && (
                          <div className="block px-4 py-3 text-red-400">
                            <span>{t('Error al cargar categorías')}</span>
                          </div>
                        )}
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
                            <Image
                              className="w-8 h-8 object-contain"
                              width={32}
                              height={32}
                              sizes="100vw"
                              alt="Administración"
                              src="/engranaje.svg"
                            />
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
                        <div className="bg-white/10 rounded-lg p-4 mb-4 hidden">
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
              <div className="w-8 relative h-8 hidden" ref={searchDropdownRef}>
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
                    <div className="p-6 flex-1 flex flex-col">
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
                      
                      {/* Resultados de búsqueda - flex-1 para ocupar espacio restante */}
                      {searchTerm && (
                        <div className="flex-1 flex flex-col min-h-0">{/* min-h-0 permite que el contenido se contraiga */}
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
                            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-2">
                              <div className="space-y-3">
                                {searchResults.map((product) => (
                                <div
                                  key={product.id}
                                  className="cursor-pointer hover:bg-white/20 rounded-lg transition-colors duration-200 overflow-hidden"
                                  onClick={() => {
                                    router.push(`/producto/${product.id}`);
                                    setShowSearchDropdown(false);
                                    setSearchTerm('');
                                  }}
                                >
                                  <div className="flex flex-col gap-2">
                                    {/* Imagen que ocupa TODO el ancho sin márgenes */}
                                    <div className="w-fill h-fill overflow-hidden flex items-center justify-center">
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
                                            className="w-full h-full object-contain"
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
                                    
                                    {/* Información del producto debajo de la imagen */}
                                    <div className="w-full text-center px-3 pb-2">
                                      <h5 className="text-white text-sm font-medium truncate mb-1">
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
                                    onClick={handleSearch}
                                    className="w-full text-center text-white text-sm bg-transparent hover:bg-white-200 hover:text-blue-300 transition-colors duration-200"
                                  >
                                    {t('Ver todos los resultados')}
                                  </button>
                                </div>

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
              <div className="w-8 relative h-8 hidden" ref={cartDropdownRef}>
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
                                            <span className="text-white font-bold">{formatPrice(totalFinal, currentCurrency, 'MXN')}</span>
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

      {/* Breadcrumb - Solo visible en desktop */}
      <div className="hidden md:block px-8 py-4">
        <nav className="text-sm text-gray-400">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/catalogo" className="hover:text-white">Catálogo</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{productData.nombre}</span>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="w-full max-w-full container mx-auto px-2 sm:px-4 md:px-8 py-4 md:py-8 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-12 max-w-[350px] md:max-w-full mx-auto">
          {/* Columna izquierda - Carrusel de imágenes */}
          <div className="space-y-2 sm:space-y-4 w-full">
            <div className="relative aspect-square bg-white/10 rounded-lg overflow-hidden w-full max-w-[320px] md:max-w-none mx-auto">
              {selectedVariant && selectedVariant.imagenes && selectedVariant.imagenes.length > 0 ? (
                <>
                  <div className={`transition-opacity duration-300 ${isImageTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    <Image
                      src={selectedVariant.imagenes[selectedImageIndex]?.url || '/sin-ttulo1-2@2x.png'}
                      alt={`${productData.nombre} - ${selectedVariant.nombre} - Imagen ${selectedImageIndex + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/sin-ttulo1-2@2x.png';
                      }}
                    />
                  </div>
                  
                  {/* Indicadores de descuento */}
                  {selectedVariant.descuento_porcentaje && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg font-bold">
                      {Math.round(selectedVariant.descuento_porcentaje)}% OFF
                    </div>
                  )}
                  
                  {/* Navegación del carrusel */}
                  {selectedVariant.imagenes.length > 1 && (
                    <>
                      <button
                        onClick={() => handleImageChange(
                          selectedImageIndex > 0 
                            ? selectedImageIndex - 1 
                            : selectedVariant.imagenes.length - 1
                        )}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => handleImageChange(
                          selectedImageIndex < selectedVariant.imagenes.length - 1 
                            ? selectedImageIndex + 1 
                            : 0
                        )}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        →
                      </button>
                    </>
                  )}
                </>
              ) : (
                <Image
                  src="/sin-ttulo1-2@2x.png"
                  alt={productData.nombre}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            
            {/* Thumbnails del carrusel */}
            {selectedVariant && selectedVariant.imagenes && selectedVariant.imagenes.length > 1 && (
              <div className="flex space-x-1 sm:space-x-2 overflow-x-auto px-2 mx-auto max-w-[320px] md:max-w-none md:px-0">
                {selectedVariant.imagenes.map((imagen, index) => (
                  <button
                    key={imagen.id_imagen}
                    onClick={() => handleImageChange(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === selectedImageIndex 
                        ? 'border-green-400' 
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <Image
                      src={imagen.url}
                      alt={`${productData.nombre} - Vista ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/sin-ttulo1-2@2x.png';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha - Información del producto */}
          <div className="space-y-4 sm:space-y-6 px-1 sm:px-2 md:px-0 w-full">
            <div className="text-center md:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 leading-tight">{productData.nombre}</h1>
              <p className="text-gray-400 text-sm sm:text-base">{productData.categoria_nombre} • {productData.marca}</p>
            </div>

            {/* Botones de variantes */}
            {productData.variantes.length > 1 && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-center md:text-left">{t('Colores disponibles')}:</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
                  {productData.variantes.map((variant) => (
                    <button
                      key={variant.id_variante}
                      onClick={() => handleVariantChange(variant)}
                      disabled={!variant.disponible || variant.stock_total <= 0}
                      className={`px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg border-2 transition-all duration-200 font-medium text-xs sm:text-sm md:text-base ${
                        selectedVariant?.id_variante === variant.id_variante
                          ? 'border-green-400 bg-green-400/20 text-green-400 shadow-lg'
                          : variant.disponible && variant.stock_total > 0
                          ? 'border-white/30 hover:border-white/50 hover:bg-white/10'
                          : 'border-gray-600 text-gray-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {variant.nombre}
                      {variant.stock_total <= 0 && ' (Agotado)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de tallas */}
            {variantStock && variantStock.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-center md:text-left">
                  {t('Tallas disponibles')} ({productData.sistema_talla_nombre || t('Sistema estándar')}):
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-2 md:gap-3 justify-center md:justify-start">
                  {variantStock.map((size) => {
                    const hasStock = size.cantidad && size.cantidad > 0;
                    const isSelected = selectedSize?.id_talla === size.id_talla;
                    
                    return (
                      <button
                        key={size.id_talla}
                        onClick={() => hasStock ? handleSizeChange(size) : null}
                        disabled={!hasStock}
                        className={`px-2 sm:px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all duration-200 font-medium min-w-[45px] sm:min-w-[50px] md:min-w-[60px] text-center text-xs sm:text-sm md:text-base ${
                          isSelected && hasStock
                            ? 'border-green-400 bg-green-400/20 text-green-400 shadow-lg transform scale-105'
                            : hasStock
                            ? 'border-white/30 hover:border-white/50 hover:bg-grey/10 hover:transform hover:scale-105 text-black '
                            : 'border-gray-600 bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                        title={
                          hasStock 
                            ? `${size.nombre_talla} - Stock: ${size.cantidad}${size.precio ? ` - Precio: ${formatPrice(size.precio, currentCurrency, 'MXN')}` : ''}` 
                            : `${size.nombre_talla} - Agotado`
                        }
                      >
                        <div className="text-xs md:text-sm font-bold">{size.nombre_talla}</div>
                        <div className="text-xs mt-1">
                          {hasStock ? `Stock: ${size.cantidad}` : t('Agotado')}
                        </div>
                        {size.precio && hasStock && (
                          <div className="text-xs mt-1 text-black-800 font-semibold">
                            {formatPrice(size.precio, currentCurrency, 'MXN')}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  <span>💡 {t('Consejo')}: {t('El stock mostrado es específico para la variante seleccionada')}</span>
                </div>
              </div>
            )}

            {/* Precio */}
            <div className="space-y-2 text-center md:text-left">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                {(() => {
                  // Si hay una talla seleccionada, usar su precio específico
                  if (selectedSize && variantStock) {
                    const sizeWithPrice = variantStock.find(s => s.id_talla === selectedSize.id_talla);
                    if (sizeWithPrice && sizeWithPrice.precio && selectedVariant) {
                      const priceInfo = applyPromotion(sizeWithPrice.precio, selectedVariant.id_variante);
                      
                      return (
                        <div className="flex flex-col">
                          {priceInfo.hasDiscount ? (
                            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <span className="text-lg sm:text-2xl text-gray-400 line-through">
                                {formatPrice(priceInfo.originalPrice, currentCurrency, 'MXN')}
                              </span>
                              <span className="text-2xl sm:text-3xl font-bold text-green-400">
                                {formatPrice(priceInfo.finalPrice, currentCurrency, 'MXN')}
                              </span>
                              <span className="text-xs sm:text-sm bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                                -{priceInfo.discountPercentage}% OFF
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center md:justify-start">
                              <span className="text-2xl sm:text-3xl font-bold text-green-400">
                                {formatPrice(priceInfo.finalPrice, currentCurrency, 'MXN')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  
                  // Si no hay talla seleccionada, mostrar rango de precios de la variante
                  if (selectedVariant && variantStock && variantStock.length > 0) {
                    const prices = variantStock
                      .map(s => s.precio)
                      .filter((p): p is number => p !== undefined && p !== null && p > 0)
                      .sort((a, b) => a - b);
                    
                    if (prices.length > 0) {
                      const minPrice = prices[0];
                      const maxPrice = prices[prices.length - 1];
                      const minPriceInfo = applyPromotion(minPrice, selectedVariant.id_variante);
                      const maxPriceInfo = applyPromotion(maxPrice, selectedVariant.id_variante);
                      
                      return (
                        <div className="flex flex-col">
                          {minPriceInfo.hasDiscount || maxPriceInfo.hasDiscount ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl text-gray-400 line-through">
                                {minPrice === maxPrice 
                                  ? formatPrice(minPriceInfo.originalPrice, currentCurrency, 'MXN')
                                  : `${formatPrice(minPriceInfo.originalPrice, currentCurrency, 'MXN')} - ${formatPrice(maxPriceInfo.originalPrice, currentCurrency, 'MXN')}`
                                }
                              </span>
                              <span className="text-3xl font-bold text-green-400">
                                {minPrice === maxPrice 
                                  ? formatPrice(minPriceInfo.finalPrice, currentCurrency, 'MXN') 
                                  : `${formatPrice(minPriceInfo.finalPrice, currentCurrency, 'MXN')} - ${formatPrice(maxPriceInfo.finalPrice, currentCurrency, 'MXN')}`
                                }
                              </span>
                              <span className="text-sm bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                                -{minPriceInfo.discountPercentage}% OFF
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-3xl font-bold text-green-400">
                                {minPrice === maxPrice 
                                  ? formatPrice(minPriceInfo.finalPrice, currentCurrency, 'MXN') 
                                  : `${formatPrice(minPriceInfo.finalPrice, currentCurrency, 'MXN')} - ${formatPrice(maxPriceInfo.finalPrice, currentCurrency, 'MXN')}`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  
                  // Fallback al precio general de la variante
                  if (selectedVariant && selectedVariant.precio) {
                    const priceInfo = applyPromotion(selectedVariant.precio, selectedVariant.id_variante);
                    
                    return (
                      <div className="flex flex-col">
                        {priceInfo.hasDiscount ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl text-gray-400 line-through">
                              {formatPrice(priceInfo.originalPrice, currentCurrency, 'MXN')}
                            </span>
                            <span className="text-3xl font-bold text-green-400">
                              {formatPrice(priceInfo.finalPrice, currentCurrency, 'MXN')}
                            </span>
                            <span className="text-sm bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                              -{priceInfo.discountPercentage}% OFF
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-3xl font-bold text-green-400">
                              {formatPrice(priceInfo.finalPrice, currentCurrency, 'MXN')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return 'Precio no disponible';
                })()}
              </div>
              {selectedSize && (
                <p className="text-sm text-gray-400">
                  Precio para talla {selectedSize.nombre_talla}
                </p>
              )}
              {!selectedSize && variantStock && variantStock.length > 0 && (
                <p className="text-sm text-yellow-400">
                  💡 Selecciona una talla para ver el precio específico
                </p>
              )}
            </div>

            {/* Cantidad */}
            <div className="text-center md:text-left">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">{t('Cantidad')}:</h3>
              <div className="flex items-center space-x-3 sm:space-x-4 justify-center md:justify-start">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-white/30 hover:border-white/50 flex items-center justify-center transition-colors text-sm sm:text-base"
                >
                  -
                </button>
                <span className="text-lg sm:text-xl font-semibold w-6 sm:w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-white/30 hover:border-white/50 flex items-center justify-center transition-colors text-sm sm:text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* Botón de regresar */}
            <div className="space-y-2 sm:space-y-3 px-1 sm:px-2 md:px-0 flex flex-col items-start">
              <button
                onClick={() => router.push('/')}
                className="w-96 bg-green-600 text-white py-3 sm:py-3 md:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                {t('Regresar')}
              </button>
            </div>

            {/* Información adicional */}
            <div className="space-y-4 pt-4 border-t border-white/20 text-center md:text-left hidden">
              <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-gray-300">
                <span>🔒</span>
                <span>Compra 100% segura</span>
              </div>
            </div>

            {/* Descripción */}
            {productData.descripcion && (
              <div className="text-center md:text-left">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">{t('Descripción')}:</h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{productData.descripcion}</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos Recomendados */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 sm:mt-12 md:mt-16 max-w-[350px] md:max-w-full mx-auto">
            <div className="mb-6 sm:mb-8 text-center md:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                {t('Productos Recomendados')}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">
                {t('Productos recientes de la misma categoría')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {relatedProducts.map((product) => {
                // Obtener la primera variante disponible
                const firstVariant = product.variantes.find(v => v.disponible) || product.variantes[0];
                if (!firstVariant) return null;

                // Obtener la primera imagen de la primera variante
                const firstImage = firstVariant.imagenes?.[0]?.url || '/sin-ttulo1-2@2x.png';
                
                // Aplicar promociones reales de la BD (similar al index)
                const productPromotions = promotions[product.id_producto];
                let finalPrice = firstVariant.precio || 0;
                let originalPrice = firstVariant.precio || 0;
                let hasRealDiscount = false;
                let discountPercentage = 0;
                
                if (productPromotions && productPromotions.length > 0 && originalPrice > 0) {
                  const promotion = productPromotions[0];
                  if (promotion.tipo === 'porcentaje' && promotion.porcentaje_descuento > 0) {
                    discountPercentage = promotion.porcentaje_descuento;
                    finalPrice = originalPrice * (1 - discountPercentage / 100);
                    hasRealDiscount = true;
                  }
                }
                
                // Verificar si tiene stock
                const hasStock = firstVariant.stock_total > 0;

                return (
                  <Link 
                    key={product.id_producto} 
                    href={`/producto/${product.id_producto}?variante=${firstVariant.id_variante}`}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group no-underline transform hover:scale-105"
                  >
                    <div className="relative aspect-square mb-3 sm:mb-4 rounded-lg overflow-hidden bg-white/5">
                      <Image
                        src={firstImage}
                        alt={`${product.nombre} - ${firstVariant.nombre}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/sin-ttulo1-2@2x.png';
                        }}
                      />
                      {hasRealDiscount && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                          -{discountPercentage}%
                        </div>
                      )}
                      {!hasStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-bold text-sm bg-red-500 px-3 py-1 rounded-full">
                            {t('Agotado')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="text-white font-semibold text-sm sm:text-base group-hover:text-green-300 transition-colors line-clamp-2 min-h-[40px] sm:min-h-[48px]">
                        {product.nombre}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="truncate">{product.marca}</span>
                        <span className="truncate">{t(product.categoria_nombre)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {finalPrice > 0 && (
                          <>
                            <span className="text-green-400 font-bold text-base sm:text-lg">
                              {formatPrice(finalPrice)}
                            </span>
                            {hasRealDiscount && originalPrice > finalPrice && (
                              <span className="text-gray-400 line-through text-xs sm:text-sm">
                                {formatPrice(originalPrice)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      
                      <button className={`w-full py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 mt-2 sm:mt-3 ${
                        hasStock 
                          ? 'bg-white text-black hover:bg-green-400 hover:text-white transform hover:scale-105' 
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}>
                        {hasStock ? t('Ver producto') : t('Sin stock')}
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Botón para ver más productos de la categoría */}
            <div className="text-center mt-8">
              <Link 
                href={`/catalogo?categoria=${encodeURIComponent(productData.categoria_nombre)}`}
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-all duration-200 transform hover:scale-105"
              >
                {t('Ver todos los productos de')} {t(productData.categoria_nombre)}
              </Link>
            </div>
          </div>
        )}
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
            
            {/* Categorías dinámicas - EXACTO COMO EN CATÁLOGO */}
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

            {/* Loading state para categorías móviles */}
            {categoriesLoading && (
              <div className="block px-4 py-3 text-gray-400">
                <span>{t('Cargando categorías...')}</span>
              </div>
            )}

            {/* Error state para categorías móviles */}
            {categoriesError && (
              <div className="block px-4 py-3 text-red-400">
                <span>{t('Error al cargar categorías')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Overlay para cerrar menú móvil */}
    {showMobileMenu && (
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => setShowMobileMenu(false)}
      />
    )}

    {/* Panel Lateral Móvil Derecho (Carrito/Opciones) - EXACTO COMO CATÁLOGO */}
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
        <div className="flex-1 flex flex-col min-h-0">
          {/* Contenido del carrito */}
          {mobileSidebarContent === 'cart' && (
            <div className="flex flex-col h-full">
              <div className="p-4 pb-2">
                <h3 className="text-xl font-bold text-white mb-2 tracking-[2px]">{t('CARRITO')}</h3>
                <p className="text-gray-300 text-sm">{totalItems} {t('productos en tu carrito')}</p>
              </div>
              
              {/* Lista de productos - SCROLLEABLE */}
              <div className="flex-1 overflow-y-auto px-4">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5-6M7 13l-2.5 6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"/>
                    </svg>
                    <p className="text-gray-300 mb-4">{t('Tu carrito está vacío')}</p>
                    <p className="text-gray-400 text-sm">{t('Agrega algunos productos para continuar')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
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
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                          <p className="text-gray-300 text-xs">{t('Talla')}: {item.tallaName}, {item.variantName}</p>
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
                                className="w-6 h-6 bg-white/20 rounded text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                                disabled={isLoading}
                              >
                                -
                              </button>
                              <span className="text-white text-sm w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.variantId, item.tallaId, item.quantity + 1)}
                                className="w-6 h-6 bg-white/20 rounded text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                                disabled={isLoading}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.productId, item.variantId, item.tallaId)}
                          className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 bg-transparent p-1 rounded"
                          disabled={isLoading}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>

              {/* Botones de acción - SIEMPRE VISIBLES */}
              {cartItems.length > 0 && (
                <div className="p-4 pt-2 border-t border-white/20 bg-black/95">
                  <div className="flex items-center justify-between text-white mb-3">
                    <span className="font-medium">{t('Total')}:</span>
                    <span className="text-xl font-bold">{formatPrice(totalFinal, currentCurrency, 'MXN')}</span>
                  </div>
                  <div className="space-y-2">
                    <Link 
                      href="/carrito" 
                      className="bg-gradient-to-r from-green-600 to-green-800 text-white py-3 px-4 rounded-lg font-medium text-center block hover:from-green-700 hover:to-green-900 transition-colors"
                      onClick={() => setShowMobileSidebar(false)}
                    >
                      {t('Ver Carrito Completo')}
                    </Link>
                    <button 
                      onClick={() => setShowMobileSidebar(false)}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      {t('Seguir Comprando')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido de idioma - EXACTO COMO EN CATÁLOGO */}
          {mobileSidebarContent === 'language' && (
            <div className="flex flex-col h-full">
              <div className="p-4 pb-2">
                <h3 className="text-xl font-bold text-white mb-6 tracking-[2px]">{t('IDIOMA Y MONEDA')}</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4 space-y-6">
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
              
              {/* Información adicional */}
              <div className="text-center border-t border-white/20 pt-6">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {t('Los cambios se aplicarán automáticamente a todos los precios mostrados en la tienda.')}
                </p>
              </div>
              </div>
            </div>
          )}

          {/* Contenido del panel de perfil - SOLO ENVÍOS Y PRODUCTOS RECOMENDADOS */}
          {mobileSidebarContent === 'profile' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4">
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

                  {/* Recomendación de Producto - EXACTO COMO EN CATÁLOGO */}
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
                          const productId = recommendedProduct.id_producto || recommendedProduct.id || recommendedProduct.producto_id;
                          console.log('🔗 Navegando al producto con ID:', productId);
                          if (productId) {
                            router.push(`/producto/${productId}`);
                            setShowMobileSidebar(false);
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-400 rounded-lg overflow-hidden flex-shrink-0">
                            {recommendedProduct.image ? (
                              <Image
                                src={recommendedProduct.image}
                                alt={recommendedProduct.nombre || 'Producto'}
                                width={64}
                                height={64}
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
                            <h5 className="text-white text-sm font-medium truncate">
                              {recommendedProduct.nombre || 'Producto sin nombre'}
                            </h5>
                            <p className="text-gray-300 text-xs line-clamp-2">
                              {recommendedProduct.descripcion || 'Sin descripción disponible'}
                            </p>
                            <div className="mt-1">
                              <span className="text-green-400 text-sm font-medium">
                                {formatPrice(recommendedProduct.precio || 0, currentCurrency, 'MXN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <p className="text-gray-400 text-sm">{t('Cargando productos...')}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Usuario no autenticado */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl text-white mb-2">{t('¡Bienvenido!')}</h3>
                    <p className="text-gray-300 text-sm">{t('Inicia sesión para acceder a tu perfil')}</p>
                  </div>

                  {/* Botones de acceso */}
                  <div className="space-y-3">
                    <Link 
                      href="/login"
                      className="bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 inline-block text-center"
                    >
                      {t('Iniciar sesión')}
                    </Link>
                    <Link 
                      href="/register"
                      className="bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200 inline-block text-center"
                    >
                      {t('Registrarse')}
                    </Link>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/20">
                    <p className="text-gray-300 text-xs text-center">
                      {t('Al continuar, aceptas nuestros términos de servicio y política de privacidad.')}
                    </p>
                  </div>
                </>
              )}
              </div>
              </div>
            </div>
          )}

          {/* Contenido del panel de búsqueda - EXACTO COMO EN CATÁLOGO */}
          {mobileSidebarContent === 'search' && (
            <div className="flex flex-col h-full">
              <div className="p-4 pb-2">
                <h3 className="text-xl text-white mb-4">{t('Buscar productos')}</h3>
              </div>
              
              <div className="flex-1 px-4">
              <div className="space-y-4">
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
                          key={product.id || product.id_producto}
                          className="cursor-pointer hover:bg-white/20 rounded-lg p-3 transition-colors duration-200"
                          onClick={() => {
                            const productId = product.id || product.id_producto;
                            router.push(`/producto/${productId}`);
                            setShowMobileSidebar(false);
                            setSearchTerm('');
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="w-12 h-12 bg-gray-400 rounded overflow-hidden flex-shrink-0">
                              {(() => {
                                let imageUrl = null;
                                
                                // Primero intentar usar la imagen procesada
                                if (product.image) {
                                  imageUrl = product.image;
                                }
                                // Fallback: buscar directamente en las variantes
                                else if (product.variantes && product.variantes[0]) {
                                  const firstVariant = product.variantes[0];
                                  
                                  // Nueva estructura: variantes[0].imagenes[0].url
                                  if (firstVariant.imagenes && firstVariant.imagenes[0] && firstVariant.imagenes[0].url) {
                                    imageUrl = firstVariant.imagenes[0].url;
                                  }
                                  // Estructura anterior: variantes[0].imagenes_variante[0].url
                                  else if (firstVariant.imagenes_variante && firstVariant.imagenes_variante[0] && firstVariant.imagenes_variante[0].url) {
                                    imageUrl = firstVariant.imagenes_variante[0].url;
                                  }
                                }
                                
                                return imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={product.nombre || 'Producto'}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white text-sm truncate">{product.nombre}</h4>
                              <p className="text-gray-300 text-xs truncate">{product.descripcion}</p>
                              <p className="text-white text-sm font-bold mt-1">
                                {formatPrice(product.precio || (product.variantes && product.variantes[0] ? product.variantes[0].precio : 0), currentCurrency, 'MXN')}
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
                  ) : searchTerm.length > 2 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-gray-300">{t('No se encontraron productos')}</p>
                      <p className="text-gray-400 text-sm mt-1">{t('Prueba con otros términos de búsqueda')}</p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Categorías rápidas */}
              <div className="border-t border-white/20 pt-6">
                <h4 className="text-lg text-white font-medium mb-4">{t('Buscar por categoría')}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {activeCategories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/catalogo?categoria=${category.slug}`}
                      onClick={() => setShowMobileSidebar(false)}
                      className="p-3 bg-white/10 rounded-lg text-center text-white hover:bg-white/20 transition-colors"
                    >
                      <span className="text-sm">{t(category.name)}</span>
                    </Link>
                  ))}
                </div>
              </div>
              </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Botones de navegación inferior - EXACTO COMO EN CATÁLOGO */}
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

    {/* Overlay para cerrar sidebar móvil */}
    {showMobileSidebar && (
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => setShowMobileSidebar(false)}
      />
    )}
    
    <Footer />
    </>
  );
};

export default ProductPage;