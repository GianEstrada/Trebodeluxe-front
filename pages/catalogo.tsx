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
import VariantSizeSelector from "../components/VariantSizeSelector";
import MobileHeader from "../components/MobileHeader";
import Footer from "../components/Footer";

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
  const [searchQuery, setSearchQuery] = useState(""); // Para la búsqueda del catálogo
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

  // Estados locales para los parámetros de URL que se sincronizan
  const [urlCategoria, setUrlCategoria] = useState<string>('');
  const [urlFilter, setUrlFilter] = useState<string>('');
  const [urlBusqueda, setUrlBusqueda] = useState<string>('');

  // Syncronizar con router.query cuando el router esté listo (con timeout fallback)
  useEffect(() => {
    const syncParams = () => {
      console.log('🔄 Syncing params - Router ready:', router.isReady);
      console.log('🔄 Router query:', router.query);
      setUrlCategoria((router.query.categoria as string) || '');
      setUrlFilter((router.query.filter as string) || '');
      setUrlBusqueda((router.query.busqueda as string) || '');
    };

    if (router.isReady) {
      syncParams();
    } else {
      // Fallback: sincronizar después de un delay si router no está ready
      const timer = setTimeout(() => {
        console.log('⚠️ Timeout fallback - forcing sync');
        syncParams();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [router.isReady, router.query.categoria, router.query.filter, router.query.busqueda]);

  // También escuchar cambios en la URL
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('🛣️ Route changed, syncing params');
      setUrlCategoria((router.query.categoria as string) || '');
      setUrlFilter((router.query.filter as string) || '');
      setUrlBusqueda((router.query.busqueda as string) || '');
    };

    router.events?.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

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
  
  // Estados para productos recomendados (navbar)
  const [recommendedProduct, setRecommendedProduct] = useState<any>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  
  // Estados adicionales para navbar
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Estados para el móvil
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [mobileSidebarContent, setMobileSidebarContent] = useState<'cart' | 'language' | 'profile' | 'search'>('cart');

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

  const handleDotClick = (index: number) => {
    if (currentTextIndex !== index) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex(index);
        setIsAnimating(false);
      }, 150);
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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Resetear página cuando se hace una nueva búsqueda
    setCurrentPage(1);
  };

  // Función para cargar producto aleatorio
  const loadRandomProduct = async () => {
    try {
      setLoadingRecommendation(true);
      console.log('🔍 Iniciando carga de producto recomendado...');
      
      // Usar getRecent que suele ser más confiable
      const response = await productsApi.getRecent(50) as any;
      console.log('📦 Respuesta getRecent:', response);
      
      if (response.success && response.products && response.products.length > 0) {
        console.log('🎯 Productos encontrados:', response.products.length);
        console.log('💰 Estado de promociones:', Object.keys(promotions).length > 0 ? 'Cargadas' : 'No cargadas');
        
        // Seleccionar un producto aleatorio
        const randomIndex = Math.floor(Math.random() * response.products.length);
        let selectedProduct = response.products[randomIndex];
        console.log('🎲 Producto base seleccionado:', selectedProduct);
        console.log('🔍 Propiedades del producto:', Object.keys(selectedProduct));
        console.log('🆔 ID disponibles:', {
          id: selectedProduct.id,
          producto_id: selectedProduct.producto_id,
          productId: selectedProduct.productId,
          _id: selectedProduct._id,
          id_producto: selectedProduct.id_producto
        });
        
        // Verificar que el producto tenga ID válido - más flexible
        let productId = selectedProduct.id || selectedProduct.producto_id || selectedProduct.productId || selectedProduct._id || selectedProduct.id_producto;
        
        if (!productId) {
          console.log('❌ Producto sin ID válido, estructura completa:', selectedProduct);
          // En lugar de fallar, intentemos con otro producto
          if (response.products.length > 1) {
            const fallbackIndex = (randomIndex + 1) % response.products.length;
            selectedProduct = response.products[fallbackIndex];
            productId = selectedProduct.id || selectedProduct.producto_id || selectedProduct.productId || selectedProduct._id || selectedProduct.id_producto;
            console.log('🔄 Intentando producto fallback:', selectedProduct);
          }
          
          if (!productId) {
            console.log('❌ No se encontró producto con ID válido');
            setRecommendedProduct(null);
            return;
          }
        }
        
        // Asegurar que el producto tenga un ID normalizado
        if (!selectedProduct.id && productId) {
          selectedProduct.id = productId;
        }
        
        console.log('✅ ID del producto confirmado:', selectedProduct.id);
        
        // Si hay promociones disponibles, aplicarlas
        if (Object.keys(promotions).length > 0 && promotions[selectedProduct.id]) {
          console.log('✅ Aplicando promociones al producto:', selectedProduct.id);
          selectedProduct = productUtils.applyPromotionDiscounts([selectedProduct], promotions)[0];
          console.log('💸 Producto con promoción aplicada:', selectedProduct);
        }
        
        setRecommendedProduct(selectedProduct);
        console.log('✅ Producto recomendado establecido exitosamente');
      } else {
        console.log('❌ No se encontraron productos en la respuesta');
        setRecommendedProduct(null);
      }
    } catch (error) {
      console.error('❌ Error completo cargando producto:', error);
      setRecommendedProduct(null);
    } finally {
      setLoadingRecommendation(false);
      console.log('🏁 Finalizó la carga del producto recomendado');
    }
  };

  // Función para buscar productos en tiempo real
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      console.log('🔍 Iniciando búsqueda con query:', query);
      
      // Usar los productos que ya están cargados y procesados con promociones
      let allProducts: any[] = [];
      
      // Combinar featuredProducts con productos de categorías
      allProducts = [...featuredProducts];
      console.log('📦 Productos destacados:', allProducts.length);
      
      // Agregar productos de todas las categorías si están disponibles
      if (typeof recentByCategory !== 'undefined') {
        Object.values(recentByCategory).forEach((categoryProducts: any) => {
          if (Array.isArray(categoryProducts)) {
            categoryProducts.forEach((product: any) => {
              // Evitar duplicados comparando por id
              if (!allProducts.find(existing => existing.id === product.id)) {
                allProducts.push(product);
              }
            });
          }
        });
      }
      console.log('📦 Total productos después de combinar:', allProducts.length);

      // Si no hay productos cargados aún, usar los productos filtrados o hacer llamada a la API
      if (allProducts.length === 0) {
        if (filteredProducts.length > 0) {
          allProducts = [...filteredProducts];
          console.log('📦 Usando productos filtrados:', allProducts.length);
        } else {
          console.log('⚠️ No hay productos cargados, consultando API...');
          const response = await productsApi.getAll() as any;
          if (response.success && response.products && response.products.length > 0) {
            // Aplicar promociones a los productos de la API
            const productsWithPromotions = productUtils.applyPromotionDiscounts(response.products, promotions);
            allProducts = productsWithPromotions;
            console.log('📦 Productos de API:', allProducts.length);
          }
        }
      }

      // Mostrar estructura del primer producto para debugging
      if (allProducts.length > 0) {
        console.log('🔍 Ejemplo de producto para debugging:', {
          id: allProducts[0].id,
          nombre: allProducts[0].nombre,
          name: allProducts[0].name,
          descripcion: allProducts[0].descripcion,
          description: allProducts[0].description,
          categoria: allProducts[0].categoria,
          category: allProducts[0].category,
          availableFields: Object.keys(allProducts[0])
        });
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

  // Función para obtener los productos a mostrar (filtrados o destacados)
  // Función memoizada para obtener los productos a mostrar con transformación optimizada
  const productsToShow = useMemo(() => {
    let products = [];
    
    // Determinar qué productos usar como base
    if (filteredProductsWithPromotions.length > 0) {
      console.log('🎯 [MEMO] Usando productos filtrados con promociones:', filteredProductsWithPromotions.length);
      products = filteredProductsWithPromotions;
    } else if (allCategoryProducts.length > 0 && selectedCategory !== 'todas') {
      console.log('📦 [MEMO] Usando productos de categoría completa:', allCategoryProducts.length);
      products = allCategoryProducts;
    } else {
      console.log('📦 [MEMO] Usando productos destacados:', featuredProducts.length);
      products = featuredProducts;
    }
    
    // Aplicar filtro de búsqueda si existe
    if (searchQuery && searchQuery.trim().length > 0) {
      const searchLower = searchQuery.toLowerCase().trim();
      products = products.filter(product => {
        const name = (product.name || product.nombre || '').toLowerCase();
        const description = (product.description || product.descripcion || '').toLowerCase();
        const category = (product.category || product.categoria || '').toLowerCase();
        
        return name.includes(searchLower) || 
               description.includes(searchLower) || 
               category.includes(searchLower);
      });
      console.log('� [MEMO] Productos después del filtro de búsqueda:', products.length, 'para:', searchQuery);
    }
    
    return products;
  }, [filteredProductsWithPromotions, allCategoryProducts, selectedCategory, featuredProducts, searchQuery]); // Dependencias corregidas

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
    console.log('🚀 loadProductsByFilter iniciado:', { urlCategoria, urlFilter, urlBusqueda, selectedCategory });
    console.log('🚀 router.query completo:', router.query);
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading products by filters...', { urlCategoria, urlFilter, urlBusqueda, selectedCategory });
      
      // Determinar el tipo de filtro basado en los parámetros de URL
      if (urlBusqueda && typeof urlBusqueda === 'string') {
        // Busqueda por texto usando getAll con filtro
        console.log('🔍 Loading products by search:', urlBusqueda);
        const searchResponse = await productsApi.getAll({ busqueda: urlBusqueda, limit: 500 }) as any;
        console.log('📡 Search response:', searchResponse);
        if (searchResponse.success) {
          const transformedProducts = searchResponse.products.map(productUtils.transformToLegacyFormat);
          // Aplicar promociones si están disponibles
          const productsWithPromotions = Object.keys(promotions).length > 0 
            ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
            : transformedProducts;
          console.log('✅ Search transformed products:', productsWithPromotions);
          setFeaturedProducts(productsWithPromotions);
        } else {
          console.log('❌ Search failed:', searchResponse);
          // Si falla la búsqueda, mostrar productos destacados como fallback
          console.log('🔄 Fallback to featured products after search error');
          const featuredResponse = await productsApi.getFeatured(500) as any;
          if (featuredResponse.success) {
            const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
            // Aplicar promociones si están disponibles
            const productsWithPromotions = Object.keys(promotions).length > 0 
              ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
              : transformedProducts;
            setFeaturedProducts(productsWithPromotions);
          }
        }
        
      } else if ((urlCategoria && urlCategoria !== 'todas') || (selectedCategory && selectedCategory !== 'todas')) {
        // Filtrar por categoría específica - usar urlCategoria desde URL o selectedCategory desde dropdown
        const categoryToFilter = urlCategoria || selectedCategory;
        console.log('📂 Loading products by category:', categoryToFilter);
        const categoryResponse = await productsApi.getAll({ categoria: categoryToFilter, limit: 500 }) as any;
        console.log('📡 Category response:', categoryResponse);
        if (categoryResponse.success) {
          const transformedProducts = categoryResponse.products.map(productUtils.transformToLegacyFormat);
          // Aplicar promociones si están disponibles
          const productsWithPromotions = Object.keys(promotions).length > 0 
            ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
            : transformedProducts;
          console.log('✅ Category transformed products:', productsWithPromotions);
          setFeaturedProducts(productsWithPromotions);
        } else {
          console.log('❌ Category failed:', categoryResponse);
          // Fallback a productos destacados
          const featuredResponse = await productsApi.getFeatured(500) as any;
          if (featuredResponse.success) {
            const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
            // Aplicar promociones si están disponibles
            const productsWithPromotions = Object.keys(promotions).length > 0 
              ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
              : transformedProducts;
            setFeaturedProducts(productsWithPromotions);
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
              // Aplicar promociones si están disponibles
              const productsWithPromotions = Object.keys(promotions).length > 0 
                ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
                : transformedProducts;
              console.log('✅ Popular transformed products:', productsWithPromotions);
              setFeaturedProducts(productsWithPromotions);
            } else {
              console.log('❌ Popular failed, using fallback');
              // Fallback a productos destacados
              const featuredResponse = await productsApi.getFeatured(500) as any;
              if (featuredResponse.success) {
                const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
                // Aplicar promociones si están disponibles
                const productsWithPromotions = Object.keys(promotions).length > 0 
                  ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
                  : transformedProducts;
                setFeaturedProducts(productsWithPromotions);
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
              // Aplicar promociones si están disponibles
              const productsWithPromotions = Object.keys(promotions).length > 0 
                ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
                : transformedProducts;
              console.log('✅ New transformed products:', productsWithPromotions);
              setFeaturedProducts(productsWithPromotions);
            } else {
              console.log('❌ New failed, using fallback');
              // Fallback a productos destacados
              const featuredResponse = await productsApi.getFeatured(500) as any;
              if (featuredResponse.success) {
                const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
                // Aplicar promociones si están disponibles
                const productsWithPromotions = Object.keys(promotions).length > 0 
                  ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
                  : transformedProducts;
                setFeaturedProducts(productsWithPromotions);
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
              // Aplicar promociones si están disponibles
              const productsWithPromotions = Object.keys(promotions).length > 0 
                ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
                : transformedProducts;
              console.log('✅ Basic transformed products:', productsWithPromotions);
              setFeaturedProducts(productsWithPromotions);
            } else {
              console.log('❌ Basic failed, using fallback');
              // Fallback a productos destacados
              const featuredResponse = await productsApi.getFeatured(500) as any;
              if (featuredResponse.success) {
                const transformedProducts = featuredResponse.products.map(productUtils.transformToLegacyFormat);
                // Aplicar promociones si están disponibles
                const productsWithPromotions = Object.keys(promotions).length > 0 
                  ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
                  : transformedProducts;
                setFeaturedProducts(productsWithPromotions);
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
              // Aplicar promociones si están disponibles
              const productsWithPromotions = Object.keys(promotions).length > 0 
                ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
                : transformedProducts;
              console.log('✅ Featured transformed products:', productsWithPromotions);
              setFeaturedProducts(productsWithPromotions);
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
          // Aplicar promociones si están disponibles
          const productsWithPromotions = Object.keys(promotions).length > 0 
            ? productUtils.applyPromotionDiscounts(transformedProducts, promotions)
            : transformedProducts;
          console.log('✅ Default featured transformed products:', productsWithPromotions);
          setFeaturedProducts(productsWithPromotions);
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
          
          // Preservar información de promociones del producto original de la card
          if (product.originalPrice && product.originalPrice > product.price) {
            fullProduct.hasDiscount = true;
            fullProduct.originalPrice = product.originalPrice;
            fullProduct.discountedPrice = product.price;
            
            // Si hay información de promoción aplicada, preservarla
            const productPromotion = promotions[product.id];
            if (productPromotion) {
              fullProduct.appliedPromotion = productPromotion;
            }
            
            console.log('💰 Preserved promotion data:', {
              hasDiscount: fullProduct.hasDiscount,
              originalPrice: fullProduct.originalPrice,
              discountedPrice: fullProduct.discountedPrice,
              appliedPromotion: fullProduct.appliedPromotion
            });
          }
          
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

  // Sincronizar selectedCategory con la categoria de la URL
  useEffect(() => {
    if (!router.isReady) return;
    
    if (urlCategoria && typeof urlCategoria === 'string') {
      console.log('🔄 Sincronizando selectedCategory con urlCategoria:', urlCategoria);
      setSelectedCategory(urlCategoria);
    } else {
      console.log('🔄 Resetear selectedCategory a "todas" - no hay categoria en URL');
      setSelectedCategory('todas');
    }
  }, [router.isReady, urlCategoria]);

  // Cargar productos al montar el componente y cuando cambien los filtros de URL
  useEffect(() => {
    console.log('🎯🎯🎯 useEffect EJECUTADO - values:', { 
      'router.isReady': router.isReady,
      urlCategoria, 
      urlFilter, 
      urlBusqueda,
      selectedCategory,
    });
    
    if (!router.isReady) {
      console.log('⏳ Router not ready yet, skipping loadProductsByFilter');
      return; 
    }
    
    console.log('✅ Router is ready, executing loadProductsByFilter');
    console.log('📋 router.query:', router.query);
    console.log('📋 Current values:', { urlCategoria, urlFilter, urlBusqueda, selectedCategory });
    
    loadProductsByFilter();
    
  }, [router.isReady, urlCategoria, urlFilter, urlBusqueda, selectedCategory]); // Usar los nuevos estados locales

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

  // useEffect para cargar producto recomendado cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated && user && Object.keys(promotions).length > 0) {
      console.log('👤 Usuario autenticado detectado, cargando producto recomendado...');
      loadRandomProduct();
    }
  }, [isAuthenticated, user, promotions]);

  // useEffect para búsqueda en tiempo real
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
  }, [searchTerm, featuredProducts, filteredProducts, promotions]);

  return (
    <div className="w-full max-w-full relative min-h-screen flex flex-col text-left text-Static-Body-Large-Size text-M3-white font-salsa overflow-x-hidden"
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
        setMobileSidebarContent={(content) => setMobileSidebarContent(content as 'cart' | 'language' | 'profile' | 'search')}
        totalItems={totalItems}
      />
      
      <div className="self-stretch flex flex-col items-start justify-start text-Schemes-On-Surface font-Static-Body-Large-Font flex-shrink-0">
        <div className="self-stretch flex flex-col items-start justify-start text-center text-white font-salsa">
          <div className="self-stretch [background:linear-gradient(90deg,_#1a6b1a,_#0e360e)] h-10 hidden md:flex flex-row items-center justify-between !p-[5px] box-border overflow-x-hidden max-w-full">
            <div className="w-full max-w-[200px] relative tracking-[4px] leading-6 flex items-center justify-center h-[27px] shrink-0 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)]">
            <span className="text-white text-sm">{t('TREBOLUXE')}</span>
          </div>
            
            {/* Contenido central - texto del carrusel */}
            <div className="flex-1 flex flex-row items-center justify-center gap-2 text-white px-4 overflow-hidden">
              <Image
                className="w-[12.2px] relative max-h-full object-contain flex-shrink-0"
                width={12.2}
                height={10.9}
                sizes="100vw"
                alt=""
                src="/petalo-1@2x.png"
              />
              <div className={`relative tracking-[2px] md:tracking-[4px] leading-6 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)] transition-all duration-300 ease-in-out text-sm truncate max-w-full ${
                isAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
              }`}>
                {t(promoTexts[currentTextIndex])}
              </div>
            </div>

            <div className="flex flex-row items-center justify-end gap-2 max-w-[60px] flex-shrink-0">
              <div className={`w-2 h-2 rounded-full shadow-sm transition-all duration-500 ease-in-out cursor-pointer ${
                currentTextIndex === 0 ? 'bg-white' : 'bg-white opacity-30 hover:opacity-60'
              }`} 
              onClick={() => handleDotClick(0)} />
              <div className={`w-2 h-2 rounded-full shadow-sm transition-all duration-500 ease-in-out cursor-pointer ${
                currentTextIndex === 1 ? 'bg-white' : 'bg-white opacity-30 hover:opacity-60'
              }`}
              onClick={() => handleDotClick(1)} />
            </div>
          </div>
          <div className="self-stretch hidden md:flex flex-row items-center justify-between !pt-[15px] !pb-[15px] !pl-8 !pr-8 text-M3-white relative overflow-x-hidden max-w-full">
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

        {/* Contenido principal del catálogo */}
        <div className="flex-1 w-full max-w-full py-8 overflow-x-hidden">
          <div className="mb-8 px-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Catálogo</h1>
            <div className="h-1 w-32 bg-gradient-to-r from-green-500 to-green-300 rounded"></div>
          </div>
          
          {/* Barra de búsqueda y filtros */}
          <div className="mb-8">
            <div className="max-w-[350px] md:max-w-4xl mx-auto px-2">
              {/* Controles de búsqueda y filtro */}
              <div className="flex flex-col gap-4 mb-6">
                {/* Barra de búsqueda */}
                <div className="w-full">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder={t("Buscar productos...")}
                      className="w-full box-border bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-3 pr-10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A6B1A] focus:border-transparent transition-all duration-200 text-sm"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Filtros en responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Filtro de categorías */}
                  <div className="w-full">
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => {
                          const newCategory = e.target.value;
                          console.log('🎯🎯 Category dropdown changed to:', newCategory);
                          console.log('🎯🎯 Previous selectedCategory was:', selectedCategory);
                          console.log('🎯🎯 Current router.query:', router.query);
                          
                          setSelectedCategory(newCategory);
                          setCurrentPage(1);
                          
                          // Actualizar la URL para mantener consistencia
                          if (newCategory === 'todas') {
                            console.log('🎯🎯 Setting categoria to undefined (todas)');
                            // Si es "todas", remover categoria de la URL
                            const newQuery = { ...router.query };
                            delete newQuery.categoria;
                            router.push({
                              pathname: '/catalogo',
                              query: newQuery
                            }, undefined, { shallow: true });
                          } else {
                            console.log('🎯🎯 Setting categoria to:', newCategory);
                            // Si es una categoría específica, actualizar la URL
                            router.push({
                              pathname: '/catalogo',
                              query: { ...router.query, categoria: newCategory }
                            }, undefined, { shallow: true });
                          }
                        }}
                        className="w-full box-border bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-3 pr-8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B1A] focus:border-transparent appearance-none cursor-pointer hover:bg-white/30 transition-all duration-200"
                      >
                        <option value="todas" className="bg-gray-800 text-white">{t('Todas las categorías')}</option>
                        {!categoriesLoading && !categoriesError && activeCategories.map((category) => (
                          <option key={category.id} value={category.slug} className="bg-gray-800 text-white">
                            {t(category.name)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dropdown de ordenamiento */}
                  <div className="w-full">
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value);
                          setCurrentPage(1); // Reset to first page when sorting changes
                        }}
                        className="w-full box-border bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-3 pr-8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B1A] focus:border-transparent appearance-none cursor-pointer hover:bg-white/30 transition-all duration-200"
                      >
                        <option value="nombre" className="bg-gray-800 text-white">{t('Nombre (A-Z)')}</option>
                        <option value="precio_asc" className="bg-gray-800 text-white">{t('Precio: Menor a Mayor')}</option>
                        <option value="precio_desc" className="bg-gray-800 text-white">{t('Precio: Mayor a Menor')}</option>
                        <option value="recientes" className="bg-gray-800 text-white">{t('Más Recientes')}</option>
                      </select>
                      {/* Icono de dropdown personalizado */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Información de filtros activos */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-300 w-full max-w-4xl mx-auto px-2">
                <p className="text-center text-xs leading-tight">
                  {t('Busca por nombre, categoría o descripción del producto')}
                </p>
                {searchQuery && (
                  <span className="bg-blue-600/20 px-2 py-1 rounded-full text-xs text-blue-300 max-w-[140px] truncate">
                    {t('Buscando')}: <strong>&quot;{searchQuery.length > 8 ? searchQuery.substring(0, 8) + '...' : searchQuery}&quot;</strong>
                  </span>
                )}
                {selectedCategory !== 'todas' && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs max-w-[100px] truncate">
                    {t('Categoría')}: <strong>{selectedCategory}</strong>
                  </span>
                )}
                {productsToShow.length > 0 && (
                  <span className="bg-green-600/20 px-2 py-1 rounded-full text-xs text-green-300">
                    {productsToShow.length} {t('productos')}
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
                <div className="w-full max-w-full bg-transparent flex flex-col justify-start py-8 overflow-hidden">
                  <div className="w-full max-w-full min-w-0 overflow-hidden">
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6 max-w-[350px] md:max-w-full mx-auto min-w-0 overflow-hidden">
                      {productsToShow.slice(0, 500).map((product: any) => (
                    <Link key={product.id} href={`/producto/${product.id}`} className="no-underline block min-w-0 max-w-full">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 group flex flex-col min-w-0 max-w-full overflow-hidden">
                        {/* Imagen con altura fija pero proporcionada */}
                        <div className="relative p-2 sm:p-3">
                          <div className="w-full max-w-full h-40 md:h-48 relative bg-white/5 rounded-lg overflow-hidden">
                            <Image
                              className="w-full max-w-full h-full object-contain"
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
                                <span className="text-white font-bold text-sm">{t('Agotado')}</span>
                              </div>
                            )}
                            {/* Mostrar promociones */}
                            <div className="absolute top-2 right-2">
                              {renderPromotions(product.id)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Contenido de la card - ultra compacto */}
                        <div className="flex flex-col px-2 sm:px-3 pb-2 sm:pb-3">
                          <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 leading-tight">{t(product.name)}</h3>
                          
                          {/* Información en grid ultra compacto */}
                          <div className="grid grid-cols-2 gap-x-1 sm:gap-x-2 gap-y-0.5 mb-2 text-xs text-gray-300 min-w-0">
                            <span className="truncate">{t(product.category)}</span>
                            <span className="truncate">{product.brand}</span>
                            <span className="truncate">{t(product.color)}</span>
                            <span className="truncate">{product.size}</span>
                          </div>
                          
                          {/* Precio y botón */}
                          <div className="mb-2">
                            <div className="flex items-center space-x-1 mb-1">
                              <span className="text-white font-bold text-sm truncate">{formatPrice(product.price, currentCurrency, 'MXN')}</span>
                              {product.originalPrice > product.price && (
                                <span className="text-gray-400 line-through text-xs truncate">{formatPrice(product.originalPrice, currentCurrency, 'MXN')}</span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            disabled={!product.inStock}
                            className={`w-full py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
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
                            {product.inStock ? t('Añadir') : t('Agotado')}
                          </button>
                        </div>
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
        <Footer />

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

      {/* Overlay para cerrar menú móvil */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

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
                    ))
                  )}
                </div>

                {/* Botones de acción */}
                {cartItems.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between text-white">
                      <span className="font-medium">{t('Total')}:</span>
                      <span className="text-xl font-bold">{formatPrice(totalFinal, currentCurrency, 'MXN')}</span>
                    </div>
                    <div className="space-y-2">
                      <Link 
                        href="/carrito" 
                        className="w-full bg-gradient-to-r from-green-600 to-green-800 text-white py-2 px-1 rounded-lg font-medium text-center block hover:from-green-700 hover:to-green-900 transition-colors"
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

            {/* Contenido de idioma */}
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
                
                {/* Información adicional */}
                <div className="text-center border-t border-white/20 pt-6">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {t('Los cambios se aplicarán automáticamente a todos los precios mostrados en la tienda.')}
                  </p>
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
                          className="bg-transparent border-2 border-white text-white py-3 px-6 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-200 inline-block text-center"
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
                      <div className="space-y-2 max-h-60 overflow-y-hidden">
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
                            className="w-full text-center text-blue-400 text-sm hover:text-blue-300 transition-colors duration-200 bg-transparent"
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
                      <button 
                        onClick={() => {
                          router.push('/catalogo?busqueda=Zapatos');
                          setShowMobileSidebar(false);
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
      
    </div>
  );
};

export default Catalogo;
