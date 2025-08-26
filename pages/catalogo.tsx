import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/NewCartContext";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { useIndexImages } from "../hooks/useIndexImages";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { canAccessAdminPanel } from "../utils/roles";
import { useCategories } from "../hooks/useCategories";
import ProductSearchBar from "../components/ProductSearchBar";
import CategoryFilter from "../components/CategoryFilter";
import VariantSizeSelector from "../components/VariantSizeSelector";

// Imports para el sistema de productos y promociones
import { productsApi, productUtils } from "../utils/productsApi";
import { promotionsApi } from "../utils/promotionsApi";

// Interfaces para productos y promociones
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  brand: string;
  color: string;
  size: string;
  inStock: boolean;
  promotions?: Promotion[];
}

interface Promotion {
  id_promocion: number;
  nombre: string;
  tipo: 'porcentaje' | 'x_por_y' | 'codigo';
  activo: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  porcentaje_descuento?: number;
  cantidad_comprada?: number;
  cantidad_pagada?: number;
  aplica_a: 'todos' | 'categoria' | 'producto';
  prioridad: number;
}

const Catalogo: NextPage = () => {
  const router = useRouter();
  const { categoria, filter, busqueda } = router.query;
  
  console.log('🎬 Catalogo component mounted/rendered', { categoria, filter, busqueda, isReady: router.isReady });
  
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Estados para filtros y productos (existentes)
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [filteredProductsWithPromotions, setFilteredProductsWithPromotions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Estados para paginación y ordenamiento
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('nombre'); // 'nombre', 'precio_asc', 'precio_desc', 'recientes'
  const [allCategoryProducts, setAllCategoryProducts] = useState<any[]>([]);
  const productsPerPage = 30; // 6 columnas x 5 filas = 30 productos por página

  // Estados del sistema de productos del index
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [recentByCategory, setRecentByCategory] = useState<{[key: string]: any[]}>({});
  const [promotions, setPromotions] = useState<{[productId: number]: any[]}>({});
  const [loading, setLoading] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el selector de variantes
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  
  // Usar el hook de traducción universal y autenticación
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const { user, isAuthenticated, logout } = useAuth();
  
  // Usar el carrito integrado con la base de datos
  const { items: cartItems, totalItems, totalFinal, removeFromCart, updateQuantity, clearCart, isLoading, addToCart } = useCart();
  
  // Usar configuraciones del sitio desde la base de datos
  const { headerSettings, loading: settingsLoading } = useSiteSettings();
  
  // Usar textos promocionales desde la base de datos, con fallback
  const promoTexts = headerSettings?.promoTexts || [
    "Agrega 4 productos y paga 2",
    "2x1 en gorras"
  ];
  
  // Usar imágenes index desde la base de datos
  const { getImageByState, loading: imagesLoading } = useIndexImages();

  // Usar categorías dinámicas desde la API
  const { activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  
  // Usar tasas de cambio dinámicas desde Open Exchange Rates
  const { formatPrice } = useExchangeRates();

  // Funciones de interacción
  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const changeCurrency = (currency: string) => {
    setCurrentCurrency(currency);
    setShowLanguageDropdown(false);
  };

  const handleDotClick = (index: number) => {
    if (currentTextIndex !== index) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex(index);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/catalogo?busqueda=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Funciones para manejar filtros
  const handleCategoryFilter = (filterData: any) => {
    console.log('🔧 handleCategoryFilter llamado con:', filterData);
    console.log('📊 filterData.products:', filterData.products);
    console.log('📋 filterData.category:', filterData.category);
    
    setSelectedCategory(filterData.category);
    setFilteredProducts(filterData.products || []);
    setIsLoadingProducts(false);
    
    console.log('✅ Estado actualizado - filteredProducts length:', filterData.products?.length || 0);
  };

  // Función para limpiar filtros si es necesario
  const clearFilters = () => {
    console.log('🧹 Limpiando filtros...');
    setFilteredProducts([]);
    setSelectedCategory('todas');
    setIsLoadingProducts(false);
  };

  const handleProductSelect = (product: any) => {
    // Redirigir al producto seleccionado usando la estructura de BD correcta
    const productId = product.id_producto || product.id;
    window.location.href = `/producto/${productId}`;
  };

  // Función para obtener los productos a mostrar (filtrados o destacados)
  // Función memoizada para obtener los productos a mostrar con transformación optimizada
  const productsToShow = useMemo(() => {
    // Si hay productos filtrados con promociones aplicadas, mostrar esos
    if (filteredProductsWithPromotions.length > 0) {
      console.log('🎯 [MEMO] Mostrando productos filtrados con promociones:', filteredProductsWithPromotions.length);
      return filteredProductsWithPromotions;
    } else if (allCategoryProducts.length > 0 && selectedCategory !== 'todas') {
      console.log('📦 [MEMO] Usando productos de categoría completa:', allCategoryProducts.length);
      return allCategoryProducts;
    }
    // Si no hay filtros aplicados, mostrar productos destacados (ya tienen promociones aplicadas)
    console.log('📦 [MEMO] Mostrando productos destacados:', featuredProducts.length);
    return featuredProducts;
  }, [filteredProductsWithPromotions, allCategoryProducts, selectedCategory, featuredProducts]); // Dependencias corregidas

  // Función legacy para compatibilidad (ahora solo devuelve el valor memoizado)
  const getProductsToShow = () => productsToShow;

  // Función para obtener el título dinámico basado en filtros de URL
  const getProductsTitle = () => {
    if (busqueda && typeof busqueda === 'string') {
      return t('Resultados para "{{query}}"').replace('{{query}}', busqueda);
    } else if (categoria && typeof categoria === 'string' && categoria !== 'todas') {
      return t('Categoría: {{category}}').replace('{{category}}', categoria);
    } else if (filter && typeof filter === 'string') {
      switch (filter) {
        case 'populares':
          return t('PRODUCTOS POPULARES');
        case 'nuevos':
          return t('PRODUCTOS NUEVOS');
        case 'basicos':
          return t('PRODUCTOS BÁSICOS');
        default:
          return t('PRODUCTOS DESTACADOS');
      }
    } else if (filteredProducts.length > 0) {
      return selectedCategory === 'todas' 
        ? t('Todos los productos') 
        : t('Productos en {{category}}').replace('{{category}}', selectedCategory);
    }
    return t('PRODUCTOS DESTACADOS');
  };

  // Función para obtener el subtítulo dinámico basado en filtros de URL
  const getProductsSubtitle = () => {
    if (busqueda && typeof busqueda === 'string') {
      return t('Productos relacionados con tu búsqueda');
    } else if (categoria && typeof categoria === 'string' && categoria !== 'todas') {
      return t('Descubre nuestra selección en {{category}}').replace('{{category}}', categoria.toLowerCase());
    } else if (filter && typeof filter === 'string') {
      switch (filter) {
        case 'populares':
          return t('Los más solicitados por nuestros clientes');
        case 'nuevos':
          return t('Últimas novedades en nuestra tienda');
        case 'basicos':
          return t('Productos esenciales para tu guardarropa');
        default:
          return promoTexts[currentTextIndex] || t('Encuentra lo que buscas');
      }
    } else if (filteredProducts.length > 0) {
      return selectedCategory === 'todas'
        ? promoTexts[currentTextIndex] || t('Toda nuestra colección disponible')
        : t('Todo en {{category}} con los mejores precios').replace('{{category}}', selectedCategory.toLowerCase());
    }
    return promoTexts[currentTextIndex] || t('Calidad y estilo en cada producto');
  };

  // ===== FUNCIONES DE ORDENAMIENTO Y PAGINACIÓN =====
  
  // Función para ordenar productos
  const sortProducts = (products: any[], sortType: string) => {
    const sorted = [...products];
    switch (sortType) {
      case 'nombre':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'precio_asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'precio_desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'recientes':
        return sorted.sort((a, b) => b.id - a.id);
      default:
        return sorted;
    }
  };

  // Función para cargar TODOS los productos de una categoría (paginación)
  const loadAllCategoryProducts = async (categorySlug: string) => {
    try {
      setIsLoadingProducts(true);
      console.log(`🔄 Cargando TODOS los productos de categoría: ${categorySlug}`);
      
      // Para "todas", obtener productos destacados + recientes
      if (categorySlug === 'todas') {
        const [featuredRes, recentRes] = await Promise.all([
          productsApi.getFeatured(250),
          productsApi.getRecent(250)
        ]);
        
        const allProducts = [
          ...((featuredRes as any).success ? (featuredRes as any).products : []),
          ...((recentRes as any).success ? (recentRes as any).products : [])
        ];
        
        // Eliminar duplicados por ID
        const uniqueProducts = allProducts.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );
        
        const transformedProducts = uniqueProducts.map(productUtils.transformToLegacyFormat).filter(Boolean);
        setAllCategoryProducts(transformedProducts);
        return transformedProducts;
      } else {
        // Para categoría específica, obtener productos con límite alto
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/featured?limit=500`);
        const data = await response.json();
        
        if (data.success && data.products) {
          // Filtrar por categoría específica
          const categoryProducts = data.products.filter((product: any) => {
            const productCategory = (product.categoria_nombre || product.categoria || '').toLowerCase();
            return productCategory.includes(categorySlug.toLowerCase());
          });
          
          const transformedProducts = categoryProducts.map(productUtils.transformToLegacyFormat).filter(Boolean);
          setAllCategoryProducts(transformedProducts);
          return transformedProducts;
        }
      }
    } catch (error) {
      console.error('Error cargando productos de categoría:', error);
      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // ===== SISTEMA DE CARGA DE PRODUCTOS BASADO EN FILTROS =====
  
  // Función principal de carga de productos basada en filtros de URL
  const loadProductsByFilter = async () => {
    console.log('🚀 loadProductsByFilter iniciado:', { categoria, filter, busqueda });
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading products by filters...', { categoria, filter, busqueda });
      
      // Determinar el tipo de filtro basado en los parámetros de URL
      if (busqueda && typeof busqueda === 'string') {
        // Busqueda por texto usando getAll con filtro
        console.log('🔍 Loading products by search:', busqueda);
        const searchResponse = await productsApi.getAll({ busqueda, limit: 500 }) as any;
        console.log('📡 Search response:', searchResponse);
        if (searchResponse.success) {
          const transformedProducts = searchResponse.products.map(productUtils.transformToLegacyFormat);
          console.log('✅ Search transformed products:', transformedProducts);
          setFeaturedProducts(transformedProducts);
        } else {
          console.log('❌ Search failed:', searchResponse);
          // Si falla la búsqueda, mostrar productos destacados como fallback
          console.log('🔄 Fallback to featured products after search error');
          const featuredResponse = await productsApi.getFeatured(500) as any;
          if (featuredResponse.success) {
            const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
            setFeaturedProducts(transformedProducts);
          }
        }
        
      } else if (filter && typeof filter === 'string') {
        // Filtros especiales: populares, nuevos, basicos
        console.log('🎯 Loading products by filter:', filter);
        
        switch (filter) {
          case 'populares':
            // Para productos populares, usar getPromotions
            console.log('⭐ Loading popular products...');
            const popularResponse = await productsApi.getPromotions(500) as any;
            console.log('📡 Popular response:', popularResponse);
            if (popularResponse.success) {
              const transformedProducts = popularResponse.products.map(productUtils.transformToLegacyFormat);
              console.log('✅ Popular transformed products:', transformedProducts);
              setFeaturedProducts(transformedProducts);
            } else {
              console.log('❌ Popular failed, using fallback');
              // Fallback a productos destacados
              const featuredResponse = await productsApi.getFeatured(500) as any;
              if (featuredResponse.success) {
                const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
                setFeaturedProducts(transformedProducts);
              }
            }
            break;
            
          case 'nuevos':
            // Para productos nuevos, usar getRecent
            console.log('🆕 Loading new products...');
            const newResponse = await productsApi.getRecent(500) as any;
            console.log('📡 New response:', newResponse);
            if (newResponse.success) {
              const transformedProducts = newResponse.products.map(productUtils.transformToLegacyFormat);
              console.log('✅ New transformed products:', transformedProducts);
              setFeaturedProducts(transformedProducts);
            } else {
              console.log('❌ New failed, using fallback');
              // Fallback a productos destacados
              const featuredResponse = await productsApi.getFeatured(500) as any;
              if (featuredResponse.success) {
                const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
                setFeaturedProducts(transformedProducts);
              }
            }
            break;
            
          case 'basicos':
            // Para productos básicos, usar getAll sin filtros específicos
            console.log('🎯 Loading basic products...');
            const basicResponse = await productsApi.getAll({ limit: 500 }) as any;
            console.log('📡 Basic response:', basicResponse);
            if (basicResponse.success) {
              const transformedProducts = basicResponse.products.map(productUtils.transformToLegacyFormat);
              console.log('✅ Basic transformed products:', transformedProducts);
              setFeaturedProducts(transformedProducts);
            } else {
              console.log('❌ Basic failed, using fallback');
              // Fallback a productos destacados
              const featuredResponse = await productsApi.getFeatured(500) as any;
              if (featuredResponse.success) {
                const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
                setFeaturedProducts(transformedProducts);
              }
            }
            break;
            
          default:
            // Fallback a productos destacados
            console.log('⭐ Loading featured products (fallback)...');
            const featuredResponse = await productsApi.getFeatured(500) as any;
            console.log('📡 Featured response:', featuredResponse);
            if (featuredResponse.success) {
              const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
              console.log('✅ Featured transformed products:', transformedProducts);
              setFeaturedProducts(transformedProducts);
            } else {
              console.log('❌ Featured failed:', featuredResponse);
            }
        }
        
      } else {
        // Sin filtros específicos, mostrar productos destacados
        console.log('⭐ Loading featured products (default)');
        const featuredResponse = await productsApi.getFeatured(500) as any;
        console.log('📡 Default featured response:', featuredResponse);
        if (featuredResponse.success) {
          const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
          console.log('✅ Default featured transformed products:', transformedProducts);
          setFeaturedProducts(transformedProducts);
        } else {
          console.log('❌ Default featured failed:', featuredResponse);
        }
      }

      console.log('🏁 loadProductsByFilter completed');
    } catch (err: any) {
      console.error('❌ Error cargando productos:', err);
      setError(err.message);
      
      // Sistema de fallback global - cargar productos destacados
      try {
        console.log('🔄 Global fallback - Loading featured products...');
        const fallbackResponse = await productsApi.getFeatured(500) as any;
        if (fallbackResponse.success) {
          const transformedProducts = fallbackResponse.products.map(productUtils.transformToLegacyFormat);
          console.log('✅ Fallback products loaded:', transformedProducts.length);
          setFeaturedProducts(transformedProducts);
          // Limpiar el error si el fallback funciona
          setError(null);
        } else {
          setFeaturedProducts([]);
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr);
        setFeaturedProducts([]);
      }
    } finally {
      setLoading(false);
      console.log('🔒 Loading state set to false');
    }
  };

  // Función para cargar promociones de un producto específico
  const loadPromotionsForProduct = async (productId: number, categoria?: string | null) => {
    // Solo evitar cargar si ya existen promociones para este producto específico
    if (promotions[productId]) return;
    
    try {
      setLoadingPromotions(true);
      const promotionData = await (promotionsApi as any).getPromotionsForProduct(productId, categoria || null);
      
      if (promotionData.success && promotionData.promotions) {
        setPromotions(prev => ({
          ...prev,
          [productId]: promotionData.promotions
        }));
        console.log(`🎯 Promociones cargadas para producto ${productId}:`, promotionData.promotions.length);
      } else {
        console.log(`ℹ️ Sin promociones para producto ${productId}`);
      }
    } catch (error) {
      console.error('Error cargando promociones para producto:', productId, error);
    } finally {
      setLoadingPromotions(false);
    }
  };

  // Función para renderizar promociones en las cards
  const renderPromotions = (productId: number) => {
    const productPromotions = promotions[productId];
    if (!productPromotions || productPromotions.length === 0) return null;

    return (
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {productPromotions.map((promotion) => {
          if (promotion.tipo === 'porcentaje' && promotion.porcentaje_descuento) {
            return (
              <div
                key={promotion.id_promocion}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold"
              >
                {Math.round(promotion.porcentaje_descuento)}% OFF
              </div>
            );
          } else if (promotion.tipo === 'x_por_y' && promotion.cantidad_comprada && promotion.cantidad_pagada) {
            return (
              <div
                key={promotion.id_promocion}
                className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold"
              >
                {promotion.cantidad_comprada}x{promotion.cantidad_pagada}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // Función para manejar agregar al carrito
  const handleAddToCart = async (product: Product) => {
    try {
      console.log('🛒 handleAddToCart called with product:', product);
      console.log('📦 Product ID:', product.id);
      
      // Buscar el producto completo con variantes desde la API
      const productDetail: any = await productsApi.getById(product.id);
      console.log('📡 API Response:', productDetail);
      
      if (productDetail && productDetail.success && productDetail.product) {
        const fullProduct = productDetail.product;
        console.log('✅ Full product data:', fullProduct);
        console.log('🎨 Product variants raw:', fullProduct.variantes);
        
        // Verificar si hay variantes válidas
        const validVariantes = fullProduct.variantes?.filter((v: any) => v && v.id_variante) || [];
        console.log('🔍 Valid variants after filter:', validVariantes);
        
        if (validVariantes.length > 0) {
          console.log('✅ Found valid variants, opening selector');
          // Asegurar que el producto tenga el array de variantes filtrado
          fullProduct.variantes = validVariantes;
          handleOpenVariantSelector(fullProduct);
        } else {
          console.log('❌ No valid variants found');
          console.log('🔍 Raw variantes field:', typeof fullProduct.variantes, fullProduct.variantes);
          alert(t('Este producto no tiene variantes disponibles'));
        }
      } else {
        console.log('❌ API response failed:', productDetail);
        console.log('🔍 Response structure check:');
        console.log('  - success:', productDetail?.success);
        console.log('  - has product:', !!productDetail?.product);
        alert(t('Producto no disponible'));
      }
    } catch (error) {
      console.error('❌ Error al cargar detalles del producto:', error);
      alert(t('Error al cargar el producto'));
    }
  };

  // Funciones para el selector de variantes y tallas
  const handleOpenVariantSelector = (product: any) => {
    setSelectedProduct(product);
    setShowVariantSelector(true);
  };

  const handleCloseVariantSelector = () => {
    setShowVariantSelector(false);
    setSelectedProduct(null);
  };

  const handleAddToCartFromSelector = async (productId: number, variantId: number, tallaId: number, quantity: number) => {
    await addToCart(productId, variantId, tallaId, quantity);
  };

  // ===== USEEFFECTS PARA EL SISTEMA DE PRODUCTOS =====

  // Debug log para ver valores en cada render
  console.log('🔍 DEBUG Current values in render:', { categoria, filter, busqueda });

  // TEST: useEffect sin dependencias para verificar que React funciona
  useEffect(() => {
    console.log('🧪 TEST useEffect sin dependencias - esto SIEMPRE debe ejecutarse');
  }, []);

  // Cargar productos al montar el componente y cuando cambien los filtros de URL (excepto categoria)
  useEffect(() => {
    if (!router.isReady) return; // Solo ejecutar cuando el router esté listo
    
    console.log('🎯🎯🎯 useEffect EJECUTADO - loadProductsByFilter triggered:', { 
      categoria, 
      filter, 
      busqueda,
      isReady: router.isReady
    });
    loadProductsByFilter();
    
  }, [router.isReady, filter, busqueda]); // Remover categoria de las dependencias

  // Cargar promociones para todos los productos featured al cargar
  useEffect(() => {
    if (featuredProducts.length > 0) {
      featuredProducts.forEach(product => {
        loadPromotionsForProduct(product.id, product.category);
      });
    }
  }, [featuredProducts]);

  // Cargar promociones para productos por categoría
  useEffect(() => {
    Object.values(recentByCategory).flat().forEach((product: any) => {
      loadPromotionsForProduct(product.id, product.category);
    });
  }, [recentByCategory]);

  // 🎯 NUEVO: Cargar promociones para productos filtrados
  useEffect(() => {
    if (filteredProducts.length > 0) {
      console.log('🔄 Cargando promociones para productos filtrados:', filteredProducts.length);
      filteredProducts.forEach((product: any) => {
        loadPromotionsForProduct(product.id, product.categoria_nombre || product.categoria);
      });
    }
  }, [filteredProducts]);

  // 🎯 Transformar y aplicar promociones a productos filtrados
  useEffect(() => {
    if (filteredProducts.length > 0) {
      console.log('🔄 Transformando productos filtrados:', filteredProducts.length);
      
      // Transformar productos usando transformToLegacyFormat
      const transformed = filteredProducts.map((product: any) => {
        const transformedProduct = productUtils.transformToLegacyFormat(product);
        return transformedProduct;
      }).filter(Boolean);
      
      // Aplicar promociones si están disponibles
      console.log('🔍 Estado promociones para filtrados:', Object.keys(promotions).length, 'productos con promociones');
      const withPromotions = Object.keys(promotions).length > 0 
        ? productUtils.applyPromotionDiscounts(transformed, promotions)
        : transformed;
      
      console.log('✅ Productos filtrados procesados:', transformed.length, 'con promociones aplicadas:', withPromotions.length);
      setFilteredProductsWithPromotions(withPromotions);
    } else {
      // Si no hay productos filtrados, limpiar el estado
      setFilteredProductsWithPromotions([]);
    }
  }, [filteredProducts, promotions]); // Dependencias: filteredProducts y promotions

  // 🔄 NUEVO: Ordenar productos cuando cambie el criterio de ordenamiento
  useEffect(() => {
    console.log('🔄 Aplicando ordenamiento:', sortBy);
    
    // Ordenar productos filtrados con promociones
    if (filteredProductsWithPromotions.length > 0) {
      const sortedFiltered = sortProducts(filteredProductsWithPromotions, sortBy);
      setFilteredProductsWithPromotions(sortedFiltered);
    }
    
    // Ordenar productos destacados  
    if (featuredProducts.length > 0) {
      const sortedFeatured = sortProducts(featuredProducts, sortBy);
      setFeaturedProducts(sortedFeatured);
    }
    
    // Ordenar productos de categoría completa
    if (allCategoryProducts.length > 0) {
      const sortedCategory = sortProducts(allCategoryProducts, sortBy);
      setAllCategoryProducts(sortedCategory);
    }
  }, [sortBy]); // Solo depende de sortBy para evitar loops infinitos

  // Aplicar descuentos de promociones cuando cambien las promociones
  useEffect(() => {
    if (Object.keys(promotions).length > 0) {
      console.log('🎯 Aplicando descuentos de promociones a productos...');
      
      // Actualizar productos destacados con descuentos
      if (featuredProducts.length > 0) {
        const updatedFeatured = productUtils.applyPromotionDiscounts(featuredProducts, promotions);
        // Solo actualizar si realmente hay cambios
        const hasChanges = updatedFeatured.some((product: any, index: number) => 
          product.price !== featuredProducts[index]?.price
        );
        if (hasChanges) {
          console.log('💰 Actualizando precios en productos destacados');
          setFeaturedProducts(updatedFeatured);
        }
      }

      // Actualizar productos por categoría con descuentos
      if (Object.keys(recentByCategory).length > 0) {
        const updatedByCategory: any = {};
        Object.keys(recentByCategory).forEach(category => {
          updatedByCategory[category] = productUtils.applyPromotionDiscounts(recentByCategory[category], promotions);
        });
        
        // Solo actualizar si hay cambios
        const hasChanges = Object.keys(updatedByCategory).some(category =>
          updatedByCategory[category].some((product: any, index: number) => 
            product.price !== recentByCategory[category][index]?.price
          )
        );
        
        if (hasChanges) {
          console.log('💰 Actualizando precios en productos por categoría');
          setRecentByCategory(updatedByCategory);
        }
      }
    }
  }, [promotions]);

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
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % promoTexts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Debug: Monitorear cambios en productos filtrados
  useEffect(() => {
    console.log('🔍 CAMBIO EN FILTERED PRODUCTS:', {
      length: filteredProducts.length,
      selectedCategory,
      isLoadingProducts,
      products: filteredProducts
    });
    
    // Debug adicional: mostrar estructura de datos de los primeros productos
    if (filteredProducts.length > 0) {
      console.log('🗃️ ESTRUCTURA DEL PRIMER PRODUCTO FILTRADO:');
      const firstProduct = filteredProducts[0];
      console.log('  - id_producto:', firstProduct.id_producto);
      console.log('  - nombre:', firstProduct.nombre);
      console.log('  - categoria_nombre:', firstProduct.categoria_nombre);
      console.log('  - marca:', firstProduct.marca);
      console.log('  - variantes:', firstProduct.variantes);
      console.log('  - stock:', firstProduct.stock);
      console.log('  - tallas_disponibles:', firstProduct.tallas_disponibles);
      console.log('  - precio_minimo:', firstProduct.precio_minimo);
      console.log('  - precio_maximo:', firstProduct.precio_maximo);
      console.log('  - imagen_principal:', firstProduct.imagen_principal);
      console.log('  - imagen_url:', firstProduct.imagen_url);
      console.log('  - tiene_stock:', firstProduct.tiene_stock);
    }
  }, [filteredProducts, selectedCategory, isLoadingProducts]);

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
                                    <span className="text-white font-bold">{formatPrice(item.price, currentCurrency, 'MXN')}</span>
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
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-300">{t('Envío:')}</span>
                            <span className="text-green-400 font-medium">{t('Gratis')}</span>
                          </div>
                          <div className="flex justify-between items-center mb-6 text-lg">
                            <span className="text-white font-bold">{t('Total:')}</span>
                            <span className="text-white font-bold">{formatPrice(totalFinal, currentCurrency, 'MXN')}</span>
                          </div>
                          
                          <div className="space-y-3">
                            <Link href="/checkout" className="block no-underline">
                              <button className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                                {t('Finalizar Compra')}
                              </button>
                            </Link>
                            <Link href="/carrito" className="block no-underline">
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

        {/* Contenido principal del catálogo */}
        <div className="flex-1 w-full px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Catálogo</h1>
            <div className="h-1 w-32 bg-gradient-to-r from-green-500 to-green-300 rounded"></div>
          </div>
          
          {/* Barra de búsqueda y filtros */}
          <div className="mb-8">
            <div className="max-w-4xl mx-auto">
              {/* Controles de búsqueda y filtro */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Barra de búsqueda */}
                <div className="md:col-span-2">
                  <ProductSearchBar
                    placeholder="Buscar productos en tiempo real..."
                    className="w-full"
                    t={t}
                    formatPrice={formatPrice}
                    currentCurrency={currentCurrency}
                    onProductSelect={handleProductSelect}
                  />
                </div>
                
                {/* Filtro de categorías */}
                <div className="md:col-span-1">
                  <CategoryFilter
                    className="w-full"
                    t={t}
                    onFilterChange={handleCategoryFilter}
                    showProductCount={true}
                    initialCategory={categoria as string || 'todas'}
                  />
                </div>
                
                {/* Dropdown de ordenamiento */}
                <div className="md:col-span-1">
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1); // Reset to first page when sorting changes
                      }}
                      className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B1A] focus:border-transparent appearance-none cursor-pointer hover:bg-white/30 transition-all duration-200"
                    >
                      <option value="nombre" className="bg-gray-800 text-white">{t('Nombre (A-Z)')}</option>
                      <option value="precio_asc" className="bg-gray-800 text-white">{t('Precio: Menor a Mayor')}</option>
                      <option value="precio_desc" className="bg-gray-800 text-white">{t('Precio: Mayor a Menor')}</option>
                      <option value="recientes" className="bg-gray-800 text-white">{t('Más Recientes')}</option>
                    </select>
                    {/* Icono de dropdown personalizado */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Información de filtros activos */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-300">
                <p>
                  {t('Busca por nombre, categoría o descripción del producto')}
                </p>
                {selectedCategory !== 'todas' && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                    {t('Filtrando por categoría')}: <strong>{selectedCategory}</strong>
                  </span>
                )}
                {filteredProducts.length > 0 && (
                  <span className="bg-green-600/20 px-3 py-1 rounded-full text-xs text-green-300">
                    {filteredProducts.length} {t('productos encontrados')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* ===== SECCIÓN DE PRODUCTOS (FILTRADOS O DESTACADOS) ===== */}
          {(() => {
            console.log('🎯 Productos a mostrar:', productsToShow.length, 'productos');
            console.log('🔍 Estado filtros:', { 
              filteredProducts: filteredProducts.length,
              featuredProducts: featuredProducts.length,
              isLoadingProducts,
              loading
            });
            
            if (productsToShow.length > 0 && !loading && !isLoadingProducts) {
              return (
                <div className="self-stretch bg-transparent flex flex-col items-center justify-start py-16" style={{paddingLeft: '16pt', paddingRight: '16pt'}}>
                  <div className="w-full">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                      {productsToShow.slice(0, 500).map((product: any) => (
                    <Link key={product.id} href={`/producto/${product.id}`} className="no-underline">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                        <div className="relative mb-4">
                          <Image
                            className="w-full h-64 object-cover rounded-lg"
                            width={300}
                            height={256}
                            src={product.image}
                            alt={product.name}
                            onError={(e) => {
                              // Fallback a logo si la imagen falla
                              (e.target as HTMLImageElement).src = '/sin-ttulo1-2@2x.png';
                            }}
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDMwMCAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjU2IiBmaWxsPSIjMUE2QjFBIiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8L3N2Zz4K"
                          />
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                              <span className="text-white font-bold text-lg">{t('Agotado')}</span>
                            </div>
                          )}
                          {/* Mostrar promociones */}
                          {renderPromotions(product.id)}
                        </div>
                        
                        <h3 className="text-white font-semibold text-lg mb-2">{t(product.name)}</h3>
                        <p className="text-gray-300 text-sm mb-2">{t('Categoría')}: {t(product.category)}</p>
                        <p className="text-gray-300 text-sm mb-2">{t('Marca')}: {product.brand}</p>
                        <p className="text-gray-300 text-sm mb-2">{t('Color')}: {t(product.color)}</p>
                        <p className="text-gray-300 text-sm mb-4">{t('Talla')}: {product.size}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-bold text-lg">{formatPrice(product.price, currentCurrency, 'MXN')}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-gray-400 line-through text-sm">{formatPrice(product.originalPrice, currentCurrency, 'MXN')}</span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          disabled={!product.inStock}
                          className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                            product.inStock 
                              ? 'bg-white text-black hover:bg-gray-100' 
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (product.inStock) {
                              handleAddToCart(product);
                            }
                          }}
                        >
                          {product.inStock ? t('Añadir al carrito') : t('Agotado')}
                        </button>
                      </div>
                    </Link>
                  ))}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Manejo de estados de carga y error para productos destacados */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-white text-lg">Cargando productos...</div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 mx-4">
              <p className="text-red-200 text-center">Error: {error}</p>
            </div>
          )}

          {/* Mensaje de carga unificado */}
          {(loading || isLoadingProducts) && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg">{t('Cargando productos...')}</p>
            </div>
          )}
          
          {/* Mensaje cuando no hay productos */}
          {!loading && !isLoadingProducts && productsToShow.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-white text-xl mb-2">{t('No se encontraron productos')}</p>
              <p className="text-gray-300">{t('Intenta con una búsqueda diferente o explora nuestras categorías')}</p>
            </div>
          )}
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
                  <a 
                    href="https://www.facebook.com/profile.php?id=61576338298512"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Image
                      className="w-6 relative h-6"
                      width={24}
                      height={24}
                      sizes="100vw"
                      alt="Facebook"
                      src="/facebook-icon.svg"
                    />
                  </a>
                  <a 
                    href="https://www.instagram.com/treboluxe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Image
                      className="w-6 relative h-6 overflow-hidden shrink-0"
                      width={24}
                      height={24}
                      sizes="100vw"
                      alt="Instagram"
                      src="/logo-instagram.svg"
                    />
                  </a>
                  <a 
                    href="https://www.tiktok.com/@treboluxe5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Image
                      className="w-6 relative h-6 overflow-hidden shrink-0"
                      width={24}
                      height={24}
                      sizes="100vw"
                      alt="TikTok"
                      src="/tiktok-icon.svg"
                    />
                  </a>
                  <a 
                    href="https://twitter.com/treboluxe?s=21"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Image
                      className="w-6 relative h-6 overflow-hidden shrink-0"
                      width={24}
                      height={24}
                      sizes="100vw"
                      alt="Twitter/X"
                      src="/x-logo.svg"
                    />
                  </a>
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
                  {t('Tabla de tallas')}
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
                  {t('Reportar un problema')}
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
                  {t('Sobre nosotros')}
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

      {/* Selector de Variantes y Tallas */}
      {selectedProduct && (
        <VariantSizeSelector
          isOpen={showVariantSelector}
          onClose={handleCloseVariantSelector}
          product={selectedProduct}
          onAddToCart={handleAddToCartFromSelector}
          currentLanguage={currentLanguage}
        />
      )}
      
      </div>
    </div>
  );
};

export default Catalogo;
