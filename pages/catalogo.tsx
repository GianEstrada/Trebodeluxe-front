import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/NewCartContext";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { canAccessAdminPanel } from "../utils/roles";
import { productsApi, productUtils } from "../utils/productsApi";
import { useCategories } from "../hooks/useCategories";
import VariantSizeSelector from "../components/VariantSizeSelector";

const CatalogoScreen: NextPage = () => {
  const router = useRouter();
  
  // Estados básicos
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  
  // Estados para productos
  const [products, setProducts] = useState<any[]>([]); // Productos mostrados (filtrados)
  const [allProducts, setAllProducts] = useState<any[]>([]); // Todos los productos cargados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros de búsqueda
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [sortOrder, setSortOrder] = useState<string>("nombre-asc");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showSortFilter, setShowSortFilter] = useState(false);
  
  // Estados para carrusel de texto
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Referencias para dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const sortFilterRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const { user, isAuthenticated, logout } = useAuth();
  const { items: cartItems, totalItems, totalFinal, addToCart, updateQuantity, removeFromCart, isLoading } = useCart();
  const { activeCategories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { formatPrice } = useExchangeRates();
  const { headerSettings, loading: settingsLoading } = useSiteSettings();
  
  // Usar textos promocionales desde la base de datos, con fallback específico para catálogo
  const promoTexts = headerSettings?.promoTexts || [
    "CATÁLOGO DE PRODUCTOS",
    "DESCUBRE NUESTRA COLECCIÓN"
  ];
  
  // Cargar productos una sola vez al inicio
  useEffect(() => {
    loadAllProducts();
  }, []); // Solo se ejecuta una vez al montar el componente
  
  // Función para cambiar idioma
  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
    setShowLanguageDropdown(false);
  };
  
  // Función para cambiar moneda
  const changeCurrency = (currency: string) => {
    setCurrentCurrency(currency);
    localStorage.setItem('preferred-currency', currency);
    setShowLanguageDropdown(false);
  };
  
  // Función para manejar la búsqueda (ya no necesita hacer router.push)
  const handleSearch = () => {
    // La búsqueda ya se aplica automáticamente por el useEffect
    console.log('🔍 Búsqueda activada:', searchTerm);
  };
  
  // Opciones de ordenamiento
  const sortOptions = [
    { value: "nombre-asc", label: "Nombre A-Z" },
    { value: "nombre-desc", label: "Nombre Z-A" },
    { value: "precio-asc", label: "Precio: Menor a Mayor" },
    { value: "precio-desc", label: "Precio: Mayor a Menor" },
    { value: "nuevo", label: "Más Recientes" },
    { value: "popular", label: "Más Populares" }
  ];
  
  // Función de búsqueda avanzada en múltiples campos
  const searchInProduct = (product: any, searchTerm: string): boolean => {
    if (!searchTerm || !searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase().trim();
    
    // Buscar en nombre
    const name = (product.name || '').toLowerCase();
    if (name.includes(term)) return true;
    
    // Buscar en categoría
    const category = (product.category || '').toLowerCase();
    if (category.includes(term)) return true;
    
    // Buscar en marca
    const brand = (product.brand || '').toLowerCase();
    if (brand.includes(term)) return true;
    
    // Buscar en color
    const color = (product.color || '').toLowerCase();
    if (color.includes(term)) return true;
    
    // Buscar en talla
    const size = (product.size || '').toLowerCase();
    if (size.includes(term)) return true;
    
    // Buscar en descripción
    const description = (product.description || '').toLowerCase();
    if (description.includes(term)) return true;
    
    return false;
  };

  // Función para aplicar todos los filtros en tiempo real
  const applyFiltersRealTime = () => {
    let filtered = [...allProducts];
    
    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(product => searchInProduct(product, searchTerm));
    }
    
    // Filtro por categoría
    if (selectedCategory && selectedCategory !== 'todas') {
      filtered = filtered.filter(product => {
        const productCategory = (product.category || '').toLowerCase();
        const filterCategory = selectedCategory.toLowerCase();
        return productCategory.includes(filterCategory);
      });
    }
    
    // Aplicar ordenamiento
    filtered = sortProducts(filtered, sortOrder);
    
    setProducts(filtered);
    
    console.log('🔍 Filtros aplicados en tiempo real:', {
      searchTerm,
      selectedCategory,
      sortOrder,
      totalProducts: allProducts.length,
      filteredProducts: filtered.length
    });
  };

  // useEffect para aplicar filtros cuando cambien los estados
  useEffect(() => {
    if (allProducts.length > 0) {
      applyFiltersRealTime();
    }
  }, [searchTerm, selectedCategory, sortOrder, allProducts]);

  // Funciones para cambiar filtros (ya no usan router.push)
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setShowCategoryFilter(false);
  };

  const handleSortChange = (sort: string) => {
    setSortOrder(sort);
    setShowSortFilter(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Función para aplicar filtros
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (searchTerm.trim()) {
      params.set('busqueda', searchTerm.trim());
    }
    
    if (selectedCategory) {
      params.set('categoria', selectedCategory);
    }
    
    if (sortOrder !== 'nombre-asc') {
      params.set('orden', sortOrder);
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `/catalogo?${queryString}` : '/catalogo';
    
    router.push(newUrl);
  };
  
  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("todas");
    setSortOrder("nombre-asc");
  };
  
  // Función para cargar todos los productos (solo una vez al inicio)
  const loadAllProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading all products from API...');
      
      // Usar getFeatured con más productos (misma API que funciona en index)
      const response = await productsApi.getFeatured(100); // Cargar más productos

      if (response && (response as any).success) {
        let products = (response as any).products || [];
        
        // Transformar productos al formato legacy con debugging mejorado
        const transformedProducts = products.map((product: any, index: number) => {
          // Debug detallado para el primer producto
          if (index === 0) {
            console.log('🔍 DEBUGGING PRIMER PRODUCTO:', {
              rawProduct: product,
              id_producto: product.id_producto,
              nombre: product.nombre,
              categoria: product.categoria,
              categoria_nombre: product.categoria_nombre,
              marca: product.marca,
              variantes: product.variantes,
              tallas_disponibles: product.tallas_disponibles,
              stock: product.stock,
            });
          }
          
          const transformed = productUtils.transformToLegacyFormat(product);
          
          // Debug detallado para el primer producto transformado
          if (index === 0) {
            console.log('✨ PRODUCTO TRANSFORMADO:', {
              original_category: product.categoria || product.categoria_nombre,
              transformed_category: transformed?.category,
              original_marca: product.marca,
              transformed_brand: transformed?.brand,
              original_variantes: product.variantes?.length || 0,
              transformed_color: transformed?.color,
              original_tallas: product.tallas_disponibles?.length || 0,
              transformed_size: transformed?.size,
            });
          }
          
          // Si la transformación falló, crear producto básico pero con más información del producto original
          if (!transformed) {
            const basicProduct = {
              id: product.id_producto || product.id || Date.now() + index,
              name: product.nombre || product.producto_nombre || 'Producto sin nombre',
              image: product.imagen_principal || '/sin-titulo1-2@2x.png',
              // Intentar obtener categoría de múltiples fuentes
              category: product.categoria || 
                       product.categoria_nombre || 
                       product.category_name ||
                       product.nombre_categoria ||
                       'Sin categoría',
              // Intentar obtener marca de múltiples fuentes  
              brand: product.marca || 
                    product.brand ||
                    product.nombre_marca ||
                    'Sin marca',
              // Si hay variantes, usar los nombres como colores
              color: (product.variantes && product.variantes.length > 0) ? 
                     product.variantes.map((v: any) => v.nombre).join(', ') :
                     product.color || 'Sin color',
              // Si hay tallas disponibles, usarlas
              size: (product.tallas_disponibles && product.tallas_disponibles.length > 0) ?
                    product.tallas_disponibles.map((t: any) => t.nombre_talla).join(', ') :
                    'Sin tallas',
              price: product.precio_minimo || 0,
              originalPrice: product.precio_minimo ? product.precio_minimo * 1.25 : 0,
              inStock: product.tiene_stock || false,
              description: product.descripcion || ''
            };
            
            console.log('⚠️ Transformación falló, usando producto básico:', basicProduct);
            return basicProduct;
          }
          
          return {
            ...transformed,
            // Sobrescribir campos con valores alternativos si están vacíos
            image: transformed.image || product.imagen_principal || '/sin-titulo1-2@2x.png',
            name: transformed.name || product.nombre || product.producto_nombre || 'Sin nombre',
            // Buscar categoría en múltiples campos
            category: transformed.category || 
                     product.categoria || 
                     product.categoria_nombre ||
                     product.category_name ||
                     product.nombre_categoria ||
                     'Sin categoría',
            // Buscar marca en múltiples campos
            brand: transformed.brand || 
                  product.marca ||
                  product.brand ||
                  product.nombre_marca ||
                  'Sin marca',
            // Si el color está vacío, intentar desde variantes
            color: transformed.color || 
                  (product.variantes && product.variantes.length > 0 ? 
                   product.variantes.map((v: any) => v.nombre).join(', ') :
                   'Sin color'),
            // Si las tallas están vacías, intentar desde tallas_disponibles  
            size: transformed.size || 
                 (product.tallas_disponibles && product.tallas_disponibles.length > 0 ?
                  product.tallas_disponibles.map((t: any) => t.nombre_talla).join(', ') :
                  'Sin tallas'),
            price: transformed.price || product.precio_minimo || 0,
            originalPrice: transformed.originalPrice || (product.precio_minimo ? product.precio_minimo * 1.25 : 0),
            inStock: transformed.inStock !== undefined ? transformed.inStock : (product.tiene_stock || false),
            description: transformed.description || product.descripcion || ''
          };
        });

        // Debug: Ver cómo quedan los productos transformados
        console.log('🔍 COMPARACIÓN DE PRODUCTOS:');
        console.log('📦 Productos originales del API:', products.slice(0, 2));
        console.log('✨ Productos transformados:', transformedProducts.slice(0, 2));
        console.log('🎯 Primer producto final:', {
          name: transformedProducts[0]?.name,
          category: transformedProducts[0]?.category,
          brand: transformedProducts[0]?.brand,
          color: transformedProducts[0]?.color,
          size: transformedProducts[0]?.size,
        });

        console.log('✅ All products loaded and transformed:', transformedProducts.length, 'products');
        
        // Guardar todos los productos (sin filtrar aún)
        setAllProducts(transformedProducts);
        
        // FALLBACK: Si no hay productos o están todos vacíos, crear productos de prueba
        if (transformedProducts.length === 0 || 
            transformedProducts.every((p: any) => !p.category || p.category === 'Sin categoría')) {
          console.log('🚨 FALLBACK: Creando productos de prueba porque no hay datos válidos');
          
          const testProducts = [
            {
              id: 'test-1',
              name: 'Camiseta Básica',
              category: 'Camisetas',
              brand: 'Brand Test',
              color: 'Azul, Rojo, Verde',
              size: 'S, M, L, XL',
              price: 299,
              originalPrice: 399,
              image: '/sin-titulo1-2@2x.png',
              inStock: true,
              description: 'Camiseta básica de alta calidad con tejido suave y cómodo'
            },
            {
              id: 'test-2', 
              name: 'Pantalón Casual',
              category: 'Pantalones',
              brand: 'Test Brand',
              color: 'Negro, Gris',
              size: '28, 30, 32, 34',
              price: 599,
              originalPrice: 799,
              image: '/sin-titulo1-2@2x.png',
              inStock: true,
              description: 'Pantalón casual perfecto para uso diario con diseño moderno'
            },
            {
              id: 'test-3',
              name: 'Zapatos Deportivos',
              category: 'Calzado',
              brand: 'Sport Test',
              color: 'Blanco, Negro, Azul',
              size: '7, 8, 9, 10, 11',
              price: 899,
              originalPrice: 1199,
              image: '/sin-titulo1-2@2x.png',
              inStock: true,
              description: 'Zapatos deportivos cómodos para actividades físicas y casual'
            }
          ];
          
          setAllProducts(testProducts);
        }
      } else {
        console.log('No products found or API error');
        setAllProducts([]);
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError('Error al cargar los productos');
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };  // Función para ordenar productos
  const sortProducts = (products: any[], order: string) => {
    const sorted = [...products];
    
    switch (order) {
      case 'nombre-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'precio-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'precio-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'nuevo':
        return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'popular':
        return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      case 'nombre-asc':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  };
  
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Función para cambiar el texto del carrusel
  const handleDotClick = (index: number) => {
    if (index !== currentTextIndex) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTextIndex(index);
        setIsAnimating(false);
      }, 150);
    }
  };
  
  // Efecto para el carrusel de texto automático
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % promoTexts.length);
        setIsAnimating(false);
      }, 300); // Duración del fade-out
      
    }, 3000); // Cambia cada 3 segundos

    return () => clearInterval(interval);
  }, [promoTexts.length]);
  
  // Event listeners para cerrar dropdowns al hacer clic fuera
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
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) {
        setShowCategoryFilter(false);
      }
      if (sortFilterRef.current && !sortFilterRef.current.contains(event.target as Node)) {
        setShowSortFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        // Aquí puedes agregar la lógica para cargar productos según filtros
        const response = await productsApi.getFeatured();
        setProducts(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error loading products:', error);
        setError('Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

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
                          href="/catalogo" 
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
                              href="/catalogo" 
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
                            onChange={handleSearchChange}
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
      
      {/* Contenido principal del catálogo */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Título del catálogo */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-wider">
              {t('CATÁLOGO')}
            </h1>
            <p className="text-xl text-gray-300 tracking-wide">
              {t('Descubre nuestra colección completa')}
            </p>
          </div>
          
          {/* Barra de búsqueda y filtros */}
          <div className="mb-8">
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10">
              
              {/* Fila principal de búsqueda */}
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                
                {/* Campo de búsqueda */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                      placeholder={t('Buscar productos...')}
                      className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:bg-white/20 transition-all"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <Image
                        src="/lupa.svg"
                        alt="Buscar"
                        width={18}
                        height={18}
                        className="opacity-60"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Filtro de categoría */}
                <div className="relative" ref={categoryFilterRef}>
                  <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className="w-full lg:w-48 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-left flex items-center justify-between hover:bg-white/20 transition-all"
                  >
                    <span>{selectedCategory ? 
                      activeCategories.find(cat => cat.slug === selectedCategory)?.name || selectedCategory 
                      : t('Todas las categorías')}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showCategoryFilter && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 z-50 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          handleCategoryChange("todas");
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition-colors border-b border-white/10"
                      >
                        {t('Todas las categorías')}
                      </button>
                      {activeCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            handleCategoryChange(category.slug);
                          }}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition-colors"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Filtro de ordenamiento */}
                <div className="relative" ref={sortFilterRef}>
                  <button
                    onClick={() => setShowSortFilter(!showSortFilter)}
                    className="w-full lg:w-56 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-left flex items-center justify-between hover:bg-white/20 transition-all"
                  >
                    <span>{t(sortOptions.find(opt => opt.value === sortOrder)?.label || 'Nombre A-Z')}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showSortFilter && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 z-50">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            handleSortChange(option.value);
                          }}
                          className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition-colors"
                        >
                          {t(option.label)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Image src="/lupa.svg" alt="" width={16} height={16} />
                  {t('Buscar')}
                </button>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-medium transition-colors"
                >
                  {t('Limpiar filtros')}
                </button>
              </div>
              
              {/* Indicador de filtros activos */}
              {(searchTerm || selectedCategory || sortOrder !== 'nombre-asc') && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-gray-300 text-sm">{t('Filtros activos:')}</span>
                    {searchTerm && (
                      <span className="px-3 py-1 bg-green-600/20 border border-green-400/30 text-green-300 rounded-full text-sm">
                        "{searchTerm}"
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="px-3 py-1 bg-blue-600/20 border border-blue-400/30 text-blue-300 rounded-full text-sm">
                        {activeCategories.find(cat => cat.slug === selectedCategory)?.name}
                      </span>
                    )}
                    {sortOrder !== 'nombre-asc' && (
                      <span className="px-3 py-1 bg-purple-600/20 border border-purple-400/30 text-purple-300 rounded-full text-sm">
                        {t(sortOptions.find(opt => opt.value === sortOrder)?.label || 'Ordenar')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Filtros y productos */}
          <div className="container mx-auto px-4 pb-20">
            {/* Estado de carga */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <span className="ml-4 text-white text-lg">{t('Cargando productos...')}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-20">
                <div className="bg-red-500/20 border border-red-400/30 text-red-300 px-6 py-4 rounded-lg inline-block">
                  {error}
                </div>
              </div>
            )}

            {/* Productos */}
            {!loading && !error && (
              <>
                {/* Contador de resultados */}
                <div className="mb-8 text-center">
                  <p className="text-white/80">
                    {products.length === 0 
                      ? t('No se encontraron productos')
                      : t(`Mostrando ${products.length} producto${products.length !== 1 ? 's' : ''}`)
                    }
                  </p>
                </div>

                {/* Grid de productos */}
                {products.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {products.map((product: any, index: number) => (
                      <Link key={product.id} href={`/producto/${product.id}`} className="no-underline">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                          <div className="relative mb-4">
                            <Image
                              className="w-full h-64 object-cover rounded-lg"
                              width={300}
                              height={256}
                              src={product.image}
                              alt={product.name}
                            />
                            {!product.inStock && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                <span className="text-white font-bold text-lg">{t('Agotado')}</span>
                              </div>
                            )}
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-white font-semibold text-lg mb-2">{t(product.name)}</h3>
                          <p className="text-gray-300 text-sm mb-2">{t('Categoría')}: {t(product.category)}</p>
                          <p className="text-gray-300 text-sm mb-2">{t('Marca')}: {product.brand}</p>
                          <p className="text-gray-300 text-sm mb-2">{t('Color')}: {t(product.color)}</p>
                          <p className="text-gray-300 text-sm mb-4">{t('Talla')}: {product.size}</p>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-bold text-lg">{formatPrice(product.price, currentCurrency, 'MXN')}</span>
                              {product.originalPrice && product.originalPrice > product.price && (
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
                                // Para productos sin variantes, usar la primera variante disponible
                                if (product.variants && product.variants[0]) {
                                  const variant = product.variants[0];
                                  const talla = variant.tallas?.[0];
                                  if (talla) {
                                    addToCart(product.id, variant.id, talla.id, 1);
                                  }
                                }
                              }
                            }}
                          >
                            {product.inStock ? t('Añadir al carrito') : t('Agotado')}
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

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
              </>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default CatalogoScreen;
