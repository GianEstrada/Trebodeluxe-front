import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useTokenManager } from '../src/hooks/useTokenManager';
import { AdminProtected } from '../src/components/AdminProtected';
import IndexImagesAdmin from '../components/admin/IndexImagesAdmin';
import PromotionsAdmin from '../components/admin/PromotionsAdmin';
import OrdersAdmin from '../components/admin/OrdersAdmin';
import NotesAdmin from '../components/admin/NotesAdmin';
import CategoriasAdmin from '../src/components/admin/CategoriasAdmin';
import SkyDropXConfig from '../src/components/admin/SkyDropXConfig';
import CalculadoraEnvios from '../src/components/admin/CalculadoraEnvios';

interface Product {
  id_producto: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  id_sistema_talla?: number;
  sistema_talla?: string;
  activo: boolean;
}

interface Variant {
  id_variante: number;
  nombre_variante: string;
  variante_activa: boolean;
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  categoria: string;
  marca: string;
  sistema_talla?: string;
  id_sistema_talla?: number;
  precio: number; // Precio de referencia (mínimo)
  precio_minimo?: number; // Precio mínimo de la variante
  precio_maximo?: number; // Precio máximo de la variante
  precios_distintos?: number; // Cantidad de precios diferentes
  precio_unico: boolean; // Si todos los precios son iguales
  imagen_url?: string;
  imagen_public_id?: string;
  imagenes?: Array<{
    id_imagen?: number;
    url: string;
    public_id: string;
    orden?: number;
  }>;
  tallas?: Array<{
    id_talla: number;
    nombre_talla: string;
    cantidad: number;
    precio: number; // Ahora incluye precio por talla
  }>;
  tallas_stock: Array<{
    id_talla: number;
    nombre_talla: string;
    cantidad: number;
    precio: number; // Precio específico por talla
  }>;
}

interface Talla {
  id_talla: number;
  nombre_talla: string;
  orden?: number;
}

interface SizeSystem {
  id_sistema_talla: number;
  nombre: string;
  tallas: Talla[];
}

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  productos_count?: number;
}

interface IndexImage {
  id_imagen: number;
  nombre: string;
  descripcion?: string;
  url: string;
  public_id?: string;
  seccion: 'principal' | 'banner';
  estado: 'activo' | 'inactivo' | 'izquierda' | 'derecha';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface Promotion {
  id_promocion?: number;
  id?: number; // Para compatibilidad
  nombre?: string;
  title?: string; // Para compatibilidad
  descripcion?: string;
  description?: string; // Para compatibilidad
  tipo_descuento: string;
  type?: string; // Para compatibilidad
  valor_descuento: number;
  discountPercentage?: number; // Para compatibilidad
  fecha_inicio: string;
  validFrom?: string; // Para compatibilidad
  fecha_fin: string;
  validTo?: string; // Para compatibilidad
  activo: boolean;
  isActive?: boolean; // Para compatibilidad
  applicationType?: string;
  quantityRequired?: number;
  quantityFree?: number;
  promoCode?: string;
  codeDiscountPercentage?: number;
  codeDiscountAmount?: number;
  targetCategoryId?: string;
  targetProductId?: number;
  image?: string;
  usageLimit?: number;
  currentUsage?: number;
  minPurchaseAmount?: number;
}

interface Order {
  id: number;
  customerName: string;
  email: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

interface HeaderTexts {
  promoTexts: string[];
  brandName: string;
}

interface HomeImages {
  heroImage1: string;
  heroImage2: string;
  promosBannerImage: string;
}

interface PrincipalImage {
  id_imagen: number;
  nombre: string;
  descripcion?: string;
  url: string;
  public_id: string;
  posicion: 'inactiva' | 'izquierda' | 'derecha';
  orden: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface VariantFormData {
  nombre: string;
  imagenes?: Array<{
    url: string;
    public_id: string;
    file?: File; // Para vistas previas locales
    isLocalPreview?: boolean; // Para identificar vistas previas locales
  }>;
  tallas: Array<{
    id_talla: number;
    nombre_talla: string;
    cantidad: number;
    precio: number; // Ahora cada talla tiene su precio
  }>;
  precio_unico: boolean; // Para saber si usar precio único
  precio_referencia?: number; // Precio único para todas las tallas
}

interface ProductFormData {
  producto_nombre: string;
  producto_descripcion: string;
  categoria: string;
  marca: string;
  id_sistema_talla: number;
  variantes: VariantFormData[];
}

const AdminPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { makeAuthenticatedRequest, getToken } = useTokenManager();
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  
  // Usar configuraciones del sitio
  const { headerSettings, updateHeaderSettings, loading: settingsLoading } = useSiteSettings();

  // Estados para las diferentes secciones
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Estados para Categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasLoading, setCategoriasLoading] = useState(false);
  const [categoriaSearchQuery, setCategoriaSearchQuery] = useState('');
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [categoriaFormData, setCategoriaFormData] = useState({
    nombre: '',
    descripcion: '',
    orden: 0
  });

  // Estados para Imágenes del Index
  const [indexImages, setIndexImages] = useState<IndexImage[]>([]);
  const [indexImagesLoading, setIndexImagesLoading] = useState(false);
  const [showIndexImageForm, setShowIndexImageForm] = useState(false);
  const [indexImageFormData, setIndexImageFormData] = useState({
    nombre: '',
    descripcion: '',
    seccion: 'principal' as 'principal' | 'banner',
    imagen: null as File | null,
    previewUrl: ''
  });
  const [uploadingIndexImage, setUploadingIndexImage] = useState(false);
  
  // Estados para Variants
  const [variants, setVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizeSystems, setSizeSystems] = useState<SizeSystem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para búsqueda y filtrado de productos
  const [variantsSearchQuery, setVariantsSearchQuery] = useState('');
  const [filteredVariants, setFilteredVariants] = useState<Variant[]>([]);
  
  // Estados para el formulario de productos/variantes
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [showEditVariantForm, setShowEditVariantForm] = useState(false);
  const [formType, setFormType] = useState<'nuevo_producto' | 'nueva_variante'>('nuevo_producto');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [additionalVariants, setAdditionalVariants] = useState<number>(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

  // Estados para Sistema de Tallas
  const [sizeSystemsData, setSizeSystemsData] = useState<SizeSystem[]>([]);
  const [sizeSystemsLoading, setSizeSystemsLoading] = useState(false);
  const [sizeSystemSearchQuery, setSizeSystemSearchQuery] = useState('');
  const [showSizeSystemForm, setShowSizeSystemForm] = useState(false);
  const [editingSizeSystem, setEditingSizeSystem] = useState<SizeSystem | null>(null);
  const [sizeSystemFormData, setSizeSystemFormData] = useState({
    nombre: '',
    tallas: ['', '', ''] // Mínimo 3 tallas
  });

  // Estados para Header Texts - usar configuraciones desde la base de datos
  const [localHeaderTexts, setLocalHeaderTexts] = useState<HeaderTexts>({
    promoTexts: headerSettings?.promoTexts || [
      'ENVIO GRATIS EN PEDIDOS ARRIBA DE $500 MXN',
      'OFERTA ESPECIAL: 20% DE DESCUENTO EN SEGUNDA PRENDA'
    ],
    brandName: headerSettings?.brandName || 'TREBOLUXE'
  });

  // Estado para la hora actual
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estados para estadísticas del dashboard
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalVariants: 0,
    activePromotions: 0,
    pendingOrders: 0,
    totalOrders: 0,
    totalNotes: 0,
    highPriorityNotes: 0,
    recentHighPriorityNote: null as any,
    loading: false
  });

  // Actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sincronizar con configuraciones del contexto cuando cambian
  useEffect(() => {
    if (headerSettings) {
      setLocalHeaderTexts({
        promoTexts: headerSettings.promoTexts,
        brandName: headerSettings.brandName
      });
    }
  }, [headerSettings]);

  // Estados para Home Images
  const [homeImages, setHomeImages] = useState<HomeImages>({
    heroImage1: '/797e7904b64e13508ab322be3107e368-1@2x.png',
    heroImage2: '/look-polo-2-1@2x.png',
    promosBannerImage: '/promociones-playa.jpg'
  });
  
  // Estados para gestión de imágenes principales
  const [homeImagesLoading, setHomeImagesLoading] = useState(false);
  const [showImageUploadOverlay, setShowImageUploadOverlay] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<'heroImage1' | 'heroImage2' | 'promosBannerImage' | null>(null);
  const [uploadingHomeImage, setUploadingHomeImage] = useState(false);

  // Estados para Promotions
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: 1,
      title: "Descuento de Verano",
      description: "20% de descuento en toda la colección de verano",
      type: "percentage",
      tipo_descuento: "percentage",
      discountPercentage: 20,
      valor_descuento: 20,
      applicationType: "all_products",
      validFrom: "2025-06-01",
      fecha_inicio: "2025-06-01",
      validTo: "2025-08-31",
      fecha_fin: "2025-08-31",
      isActive: true,
      activo: true,
      currentUsage: 0
    }
  ]);

  // Estados para Orders
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1001,
      customerName: "Juan Pérez",
      email: "juan@email.com",
      total: 149.97,
      status: "processing",
      orderDate: "2025-07-13",
      items: [
        { productName: "Camiseta Básica Premium", quantity: 2, price: 24.99 },
        { productName: "Polo Clásico", quantity: 1, price: 34.99 }
      ]
    }
  ]);

  // Estados para Notes
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Recordatorio importante",
      content: "Revisar inventario de productos antes del fin de mes",
      createdAt: "2025-07-13",
      priority: "high"
    }
  ]);

  // Verificar si el usuario es administrador
  useEffect(() => {
    const token = getToken();
    if (!user || !token) {
      router.push('/login');
    }
  }, [user, getToken, router]);

  // Cargar datos iniciales
  useEffect(() => {
    loadVariants();
    loadProducts();
    loadSizeSystems();
    loadDashboardStats();
    loadHomeImages(); // Cargar imágenes principales
    loadCategorias(); // Cargar categorías
    loadIndexImages(); // Cargar imágenes del index
  }, []);

  // Función para cargar categorías - Memoizada
  const loadCategorias = useCallback(async () => {
    setCategoriasLoading(true);
    try {
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/categorias/admin', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setCategorias(data.categorias);
      }
    } catch (error) {
      console.error('Error loading categorias:', error);
    } finally {
      setCategoriasLoading(false);
    }
  }, []);

  // Función para cargar imágenes del index - Memoizada
  const loadIndexImages = useCallback(async () => {
    setIndexImagesLoading(true);
    try {
      const response = await makeAuthenticatedRequest('https://trebodeluxe-backend.onrender.com/api/admin/index-images');
      const data = await response.json();
      if (data.success) {
        setIndexImages(data.images);
      }
    } catch (error) {
      console.error('Error loading index images:', error);
    } finally {
      setIndexImagesLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  // Función para cargar estadísticas del dashboard
  const loadDashboardStats = async () => {
    console.log('🔄 INICIANDO loadDashboardStats...');
    setDashboardStats(prev => {
      console.log('📊 Estado anterior dashboardStats:', prev);
      return { ...prev, loading: true };
    });
    
    try {
      const baseUrl = 'https://trebodeluxe-backend.onrender.com';
      console.log('🔄 Cargando estadísticas del dashboard...');
      
      // Inicializar datos por defecto
      let variantsData: any = { success: false, variants: [] };
      let promotionsData: any = { success: false, data: [] };
      let ordersData: any = { success: false, data: [] };
      let notesStatsData: any = { success: false, data: { total_notas: 0, urgentes: 0, altas: 0 } };
      let recentNotesData: any = { success: false, data: [] };

      // Cargar variants
      try {
        const variantsResponse = await makeAuthenticatedRequest(`${baseUrl}/api/admin/variants`);
        variantsData = await variantsResponse.json();
        console.log('📦 Variants data:', variantsData);
      } catch (error) {
        console.error('❌ Error loading variants:', error);
      }

      // Cargar promotions
      try {
        const promotionsResponse = await makeAuthenticatedRequest(`${baseUrl}/api/admin/promotions`);
        promotionsData = await promotionsResponse.json();
        console.log('🏷️ Promotions data:', promotionsData);
      } catch (error) {
        console.error('❌ Error loading promotions:', error);
      }

      // Cargar orders (intentar diferentes endpoints)
      try {
        const ordersResponse = await makeAuthenticatedRequest(`${baseUrl}/api/admin/orders`);
        if (!ordersResponse.ok) {
          // Intentar endpoint alternativo
          const altOrdersResponse = await makeAuthenticatedRequest(`${baseUrl}/api/orders`);
          ordersData = await altOrdersResponse.json();
        } else {
          ordersData = await ordersResponse.json();
        }
        console.log('📋 Orders data:', ordersData);
      } catch (error) {
        console.error('❌ Error loading orders:', error);
      }

      // Cargar notes stats
      try {
        const notesStatsResponse = await fetch(`${baseUrl}/api/notes/stats`);
        notesStatsData = await notesStatsResponse.json();
        console.log('📊 Notes stats:', notesStatsData);
      } catch (error) {
        console.error('❌ Error loading notes stats:', error);
      }

      // Cargar recent high priority notes
      try {
        const notesResponse = await fetch(`${baseUrl}/api/notes?prioridad=alta&limit=1&sort_order=desc`);
        recentNotesData = await notesResponse.json();
        console.log('📝 Recent notes:', recentNotesData);
      } catch (error) {
        console.error('❌ Error loading recent notes:', error);
      }

      // Calcular estadísticas
      const stats = {
        totalVariants: variantsData.success && variantsData.variants ? variantsData.variants.length : 0,
        totalProducts: variantsData.success && variantsData.variants ? new Set(variantsData.variants.map((v: any) => v.id_producto)).size : 0,
        activePromotions: promotionsData.success && promotionsData.data ? promotionsData.data.filter((p: any) => p.activo).length : 0,
        pendingOrders: ordersData.success && ordersData.data ? ordersData.data.filter((o: any) => o.estado === 'pendiente' || o.status === 'pending').length : 0,
        totalOrders: ordersData.success && ordersData.data ? ordersData.data.length : 0,
        totalNotes: notesStatsData.success && notesStatsData.data ? notesStatsData.data.total_notas : 0,
        highPriorityNotes: notesStatsData.success && notesStatsData.data ? (notesStatsData.data.urgentes + notesStatsData.data.altas) : 0,
        recentHighPriorityNote: recentNotesData.success && recentNotesData.data && recentNotesData.data.length > 0 ? recentNotesData.data[0] : null,
        loading: false
      };

      console.log('📊 Estadísticas calculadas:', stats);
      console.log('🔄 Actualizando estado dashboardStats...');
      setDashboardStats(stats);
      console.log('✅ Estado dashboardStats actualizado!');
    } catch (error) {
      console.error('❌ Error general loading dashboard stats:', error);
      setDashboardStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Recargar estadísticas cuando se cambie a dashboard
  useEffect(() => {
    if (activeSection === 'dashboard') {
      console.log('📊 Sección dashboard activada, cargando estadísticas...');
      loadDashboardStats();
    }
  }, [activeSection]);

  // Efecto para cargar size systems inicialmente en sizeSystemsData
  useEffect(() => {
    if (activeSection === 'sizes' && sizeSystemsData.length === 0) {
      console.log('Cargando size systems para la sección de tallas...');
      const loadInitialSizeSystems = async () => {
        setSizeSystemsLoading(true);
        try {
          const response = await fetch('https://trebodeluxe-backend.onrender.com/api/size-systems');
          const data = await response.json();
          console.log('Respuesta de size systems:', data);
          if (data.success) {
            setSizeSystemsData(data.sizeSystems || []);
          } else {
            console.error('Error en respuesta de size systems:', data.message);
          }
        } catch (error) {
          console.error('Error loading initial size systems:', error);
        } finally {
          setSizeSystemsLoading(false);
        }
      };
      loadInitialSizeSystems();
    }
  }, [activeSection, sizeSystemsData.length]);

  // Cargar datos iniciales - Memoizado
  const loadVariants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest('https://trebodeluxe-backend.onrender.com/api/admin/variants');
      const data = await response.json();
      if (data.success) {
        setVariants(data.variants);
        setFilteredVariants(data.variants);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  const loadProducts = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('https://trebodeluxe-backend.onrender.com/api/admin/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, [makeAuthenticatedRequest]);

  const loadSizeSystems = useCallback(async () => {
    console.log('loadSizeSystems: Iniciando carga de sistemas de tallas...');
    try {
      const url = 'https://trebodeluxe-backend.onrender.com/api/size-systems';
      console.log('loadSizeSystems: Haciendo fetch a:', url);
      
      const response = await fetch(url);
      console.log('loadSizeSystems: Respuesta recibida, status:', response.status);
      
      const data = await response.json();
      console.log('loadSizeSystems: Datos recibidos:', data);
      
      if (data.success) {
        console.log('loadSizeSystems: Actualizando sizeSystems con', data.sizeSystems?.length || 0, 'sistemas');
        setSizeSystems(data.sizeSystems);
        setSizeSystemsData(data.sizeSystems); // También actualizar sizeSystemsData
      } else {
        console.error('loadSizeSystems: Error en respuesta:', data.message);
      }
    } catch (error) {
      console.error('loadSizeSystems: Error de conexión:', error);
    }
  }, []);

  // Función de búsqueda para productos/variantes - Memoizada
  const searchVariants = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredVariants(variants);
      return;
    }

    const filtered = variants.filter(variant => 
      variant.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.nombre_variante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (variant.descripcion_producto && variant.descripcion_producto.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredVariants(filtered);
  }, [variants]);

  // Efecto para buscar cuando cambia el término de búsqueda - Optimizado
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchVariants(variantsSearchQuery);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [variantsSearchQuery, searchVariants]);

  const uploadImageToCloudinary = async (file: File): Promise<{url: string, public_id: string}> => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Obtener token del contexto de usuario primero, luego localStorage
      let token = user?.token;
      if (!token) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            token = userData.token;
          } catch (parseError) {
            console.error('Error al parsear datos de localStorage:', parseError);
          }
        }
      }
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        return {
          url: data.url,
          public_id: data.public_id
        };
      }
      throw new Error(data.message || 'Error uploading image');
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Funciones para editar y eliminar variantes
  const handleEditVariant = useCallback(async (variantId: number) => {
    try {
      console.log('🔍 [DEBUG] Editando variante:', variantId);
      
      // Obtener los datos de la variante
      const response = await makeAuthenticatedRequest(`https://trebodeluxe-backend.onrender.com/api/admin/variants/${variantId}`);
      const data = await response.json();
      
      if (data.success) {
        const variant = data.variant;
        
        // Configurar el estado de edición
        setEditingVariant(variant);
        
        // Abrir el modal de edición específico
        setShowEditVariantForm(true);
      } else {
        alert(t('Error al cargar los datos de la variante'));
      }
    } catch (error) {
      console.error('Error loading variant for edit:', error);
      alert(t('Error al cargar los datos de la variante'));
    }
  }, [makeAuthenticatedRequest, t]);

  const handleDeleteVariant = useCallback(async (variantId: number, variantName: string) => {
    if (!confirm(t(`¿Estás seguro de que deseas eliminar la variante "${variantName}"?`))) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(`https://trebodeluxe-backend.onrender.com/api/admin/variants/${variantId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(t('Variante eliminada correctamente'));
        loadVariants(); // Recargar las variantes
      } else {
        alert(t('Error al eliminar la variante: ') + data.message);
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert(t('Error al eliminar la variante'));
    }
  }, [makeAuthenticatedRequest, t, loadVariants]);

  const renderVariantsList = useMemo(() => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Productos y Variantes')}</h2>
        {loading && <div className="text-green-400">⏳ {t('Cargando...')}</div>}
      </div>

      {/* Barra de búsqueda y botón agregar */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder={t('Buscar productos o variantes...')}
            value={variantsSearchQuery}
            onChange={(e) => setVariantsSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchVariants(variantsSearchQuery)}
            className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
          />
          <button
            onClick={() => searchVariants(variantsSearchQuery)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            🔍 {t('Buscar')}
          </button>
          <button
            onClick={() => {
              console.log('🔍 [DEBUG] Abriendo modal de variante...');
              console.log('🔍 [DEBUG] Usuario en contexto antes de abrir modal:', user ? {
                id: user.id_usuario,
                usuario: user.usuario,
                tieneToken: !!user.token,
                tokenLength: user.token?.length || 0
              } : 'No user in context');
              
              const savedUser = localStorage.getItem('user');
              if (savedUser) {
                try {
                  const userData = JSON.parse(savedUser);
                  console.log('🔍 [DEBUG] Usuario en localStorage antes de abrir modal:', {
                    id: userData.id_usuario,
                    usuario: userData.usuario,
                    tieneToken: !!userData.token,
                    tokenLength: userData.token?.length || 0
                  });
                } catch (e) {
                  console.log('🔍 [DEBUG] Error al parsear localStorage:', e);
                }
              } else {
                console.log('🔍 [DEBUG] No hay usuario en localStorage');
              }
              
              setShowVariantForm(true);
            }}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            + {t('Agregar Variante')}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center text-white">
          <p>{t('Cargando...')}</p>
        </div>
      ) : (
        <div>
          {/* Contador de resultados */}
          <div className="mb-4 text-gray-300">
            {variantsSearchQuery ? (
              <p>{t('Se encontraron')} {filteredVariants.length} {t('resultados para')}: "{variantsSearchQuery}"</p>
            ) : (
              <p>{t('Total de variantes')}: {filteredVariants.length}</p>
            )}
          </div>

          {filteredVariants.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {variantsSearchQuery ? 
                t('No se encontraron productos o variantes que coincidan con tu búsqueda') : 
                t('No se encontraron productos o variantes')
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVariants.map((variant) => (
                <div key={variant.id_variante} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  {/* Nombre del producto */}
                  <h3 className="text-lg font-bold text-white mb-3">{variant.nombre_producto}</h3>
                  
                  <div className="flex gap-4 mb-4">
                    {/* Imagen de la variante */}
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {variant.imagen_url ? (
                        <Image
                          src={variant.imagen_url}
                          alt={variant.nombre_variante}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    
                    {/* Información de la variante */}
                    <div className="flex-1">
                      <h4 className="text-md font-semibold text-green-400 mb-2">{variant.nombre_variante}</h4>
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">{variant.descripcion_producto}</p>
                      
                      {/* Precio */}
                      <div className="mb-2">
                        <span className="text-lg font-bold text-white">${variant.precio}</span>
                        {!variant.precio_unico && (
                          <span className="text-sm text-gray-400 ml-2">{t('Precios variables')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tallas y stock */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">{t('Tallas y Stock:')}</p>
                    <div className="flex flex-wrap gap-1">
                      {variant.tallas_stock.map((talla) => (
                        <span
                          key={talla.id_talla}
                          className={`text-xs px-2 py-1 rounded ${
                            talla.cantidad > 0 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-600 text-gray-300'
                          }`}
                          title={`${talla.nombre_talla}: ${talla.cantidad} unidades - $${talla.precio}`}
                        >
                          {talla.nombre_talla}: {talla.cantidad} (${talla.precio})
                        </span>
                      ))}
                    </div>
                    {variant.tallas_stock.length === 0 && (
                      <span className="text-xs text-gray-500">{t('Sin tallas configuradas')}</span>
                    )}
                  </div>
                  
                  {/* Indicador de tipo de precio */}
                  <div className="text-sm text-gray-300 mb-2">
                    {variant.precio_unico ? (
                      <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs">
                        💰 {t('Precio único')}
                      </span>
                    ) : (
                      <span className="bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded text-xs">
                        💰 {t('Precios por talla')}
                      </span>
                    )}
                  </div>
                  
                  {/* Total de stock */}
                  <div className="text-sm text-gray-300 mb-4">
                    <strong>{t('Total en stock:')} {variant.tallas_stock.reduce((total, talla) => total + talla.cantidad, 0)}</strong>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditVariant(variant.id_variante)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      ✏️ {t('Editar')}
                    </button>
                    <button
                      onClick={() => handleDeleteVariant(variant.id_variante, variant.nombre_variante)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      🗑️ {t('Eliminar')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ), [t, loading, variantsSearchQuery, filteredVariants, handleEditVariant, handleDeleteVariant, searchVariants]);

  // Nuevo componente para editar variantes - Optimizado para evitar re-renders
  const EditVariantForm = useMemo(() => {
    const EditVariantFormComponent = () => {
      if (!editingVariant) return null;
      const [originalData, setOriginalData] = useState<any>(null);
      const [editData, setEditData] = useState<{
        // Datos del producto
        nombre_producto: string;
        categoria: string;
        descripcion_producto: string;
        marca: string;
        // Datos de la variante
        nombre_variante: string;
        precio_unico: boolean;
        precio_referencia?: number;
        imagenes: Array<{
          url: string;
          public_id: string;
          file?: File;
          isLocalPreview?: boolean;
        }>;
        tallas: Array<{
          id_talla: number;
          nombre_talla: string;
          cantidad: number;
          precio: number;
        }>;
      }>({
        // Datos del producto
        nombre_producto: '',
        categoria: '',
        descripcion_producto: '',
        marca: '',
        // Datos de la variante
        nombre_variante: '',
        precio_unico: true,
        precio_referencia: 0,
        imagenes: [],
        tallas: []
      });
      const [uniquePrice, setUniquePrice] = useState(true);
      const [hasChanges, setHasChanges] = useState(false);
      const [isUpdating, setIsUpdating] = useState(false);

      // Cargar datos cuando se abre el formulario
      useEffect(() => {
        if (editingVariant) {
          console.log('📝 Cargando datos de variante para edición:', editingVariant);
          
        const initialData = {
          // Datos del producto
          nombre_producto: editingVariant.nombre_producto,
          categoria: editingVariant.categoria,
          descripcion_producto: editingVariant.descripcion_producto,
          marca: editingVariant.marca,
          // Datos de la variante
          nombre_variante: editingVariant.nombre_variante,
          precio_unico: editingVariant.precio_unico || true,
          precio_referencia: editingVariant.precio_unico ? (editingVariant.precio_minimo || editingVariant.precio || 0) : 0,
          imagenes: editingVariant.imagenes ? editingVariant.imagenes.map((img: any) => ({
            url: img.url,
            public_id: img.public_id,
            isLocalPreview: false
          })) : [],
          tallas: editingVariant.tallas ? editingVariant.tallas.map((talla: any) => ({
            id_talla: talla.id_talla,
            nombre_talla: talla.nombre_talla,
            cantidad: talla.cantidad,
            precio: talla.precio || 0
          })) : editingVariant.tallas_stock ? editingVariant.tallas_stock.map((talla: any) => ({
            id_talla: talla.id_talla,
            nombre_talla: talla.nombre_talla,
            cantidad: talla.cantidad,
            precio: talla.precio || 0
          })) : []
        };

        console.log('📝 Cargando datos de variante para edición:', editingVariant);
        console.log('🎯 Precio único detectado:', editingVariant.precio_unico);
        console.log('💰 Precio de referencia inicializado:', initialData.precio_referencia);

        setOriginalData(JSON.parse(JSON.stringify(initialData)));
        setEditData(initialData);
        setUniquePrice(initialData.precio_unico); // Usar el valor detectado del backend
        }
      }, [editingVariant]);

      // Detectar cambios
      useEffect(() => {
        if (originalData && editData) {
          const changed = JSON.stringify(originalData) !== JSON.stringify(editData);
          setHasChanges(changed);
        }
      }, [originalData, editData]);

      const handleImageUpload = async (file: File) => {
        console.log('📸 Subiendo nueva imagen:', file.name);
        
        const previewUrl = URL.createObjectURL(file);
        const imagePreview = {
          url: previewUrl,
          public_id: 'local-preview-' + Date.now(),
          file: file,
          isLocalPreview: true
        };
        
        setEditData(prev => ({
          ...prev,
          imagenes: [...prev.imagenes, imagePreview]
        }));
      };

      const handleRemoveImage = async (imageIndex: number) => {
        const imageToRemove = editData.imagenes[imageIndex];
        
        // Si es una imagen existente en Cloudinary, eliminarla
        if (!imageToRemove.isLocalPreview && imageToRemove.public_id) {
          try {
            const token = getToken();
            if (!token) {
              throw new Error('No hay token de autenticación');
            }

            const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/delete-image', {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                public_id: imageToRemove.public_id,
                variant_id: editingVariant?.id_variante 
              }),
            });

            const data = await response.json();
            if (!data.success) {
              console.warn('Error al eliminar imagen de Cloudinary:', data.message);
            }
          } catch (error) {
            console.error('Error eliminando imagen:', error);
          }
        }

        // Remover imagen del estado local
        setEditData(prev => ({
          ...prev,
          imagenes: prev.imagenes.filter((_, index) => index !== imageIndex)
        }));
      };

      const uploadLocalImagesToCloudinary = async (imagenes: any[]) => {
        const uploadedImages = [];
        
        for (const imagen of imagenes) {
          if (imagen.isLocalPreview && imagen.file) {
            const token = getToken();
            if (!token) {
              throw new Error('No hay token de autenticación');
            }
            
            const formData = new FormData();
            formData.append('image', imagen.file);
            
            const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/upload-image', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData,
            });
            
            const data = await response.json();
            if (!data.success) {
              throw new Error(data.message || 'Error uploading image');
            }
            
            URL.revokeObjectURL(imagen.url);
            
            uploadedImages.push({
              url: data.url,
              public_id: data.public_id
            });
          } else {
            uploadedImages.push({
              url: imagen.url,
              public_id: imagen.public_id
            });
          }
        }
        
        return uploadedImages;
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!hasChanges) {
          alert(t('No hay cambios para guardar'));
          return;
        }

        setIsUpdating(true);
        
        try {
          // Subir imágenes locales a Cloudinary
          const uploadedImages = await uploadLocalImagesToCloudinary(editData.imagenes);
          
          const payload = {
            // Datos del producto
            id_producto: editingVariant?.id_producto,
            nombre_producto: editData.nombre_producto,
            categoria: editData.categoria,
            descripcion_producto: editData.descripcion_producto,
            marca: editData.marca,
            // Datos de la variante
            id_variante: editingVariant?.id_variante,
            nombre_variante: editData.nombre_variante,
            precio_unico: editData.precio_unico,
            precio: editData.precio_referencia, // Cambiar precio_referencia por precio
            imagenes: uploadedImages,
            tallas: editData.tallas
          };

          console.log('🚀 [DEBUG] Payload enviado al backend:', payload);
          console.log('🎯 [DEBUG] Precio único:', payload.precio_unico);
          console.log('💰 [DEBUG] Precio general:', payload.precio);
          console.log('📦 [DEBUG] Tallas detalle:', payload.tallas);
          
          const response = await makeAuthenticatedRequest(`https://trebodeluxe-backend.onrender.com/api/admin/variants/${editingVariant?.id_variante}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
          
          const data = await response.json();
          
          if (data.success) {
            alert(t('Variante actualizada correctamente'));
            setShowEditVariantForm(false);
            setEditingVariant(null);
            loadVariants(); // Recargar lista
          } else {
            alert(t('Error al actualizar: ') + data.message);
          }
        } catch (error) {
          console.error('Error updating variant:', error);
          alert(t('Error al actualizar la variante'));
        } finally {
          setIsUpdating(false);
        }
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                ✏️ {t('Editar Variante')}
              </h3>
              <button
                onClick={() => {
                  setShowEditVariantForm(false);
                  setEditingVariant(null);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sección: Información del Producto (Editable) */}
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
                  📦 {t('Información del Producto')} 
                  <span className="ml-2 text-xs bg-blue-500/20 px-2 py-1 rounded-full">
                    {t('Editable')}
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('Nombre del Producto')} *
                    </label>
                    <input
                      type="text"
                      value={editData.nombre_producto}
                      onChange={(e) => setEditData(prev => ({...prev, nombre_producto: e.target.value}))}
                      className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-blue-400/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('Categoría')} *
                    </label>
                    <select
                      value={editData.categoria}
                      onChange={(e) => setEditData(prev => ({...prev, categoria: e.target.value}))}
                      className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-blue-400/50 focus:outline-none"
                      required
                    >
                      <option value="">{t('Seleccionar categoría')}</option>
                      {categorias.map((cat) => (
                        <option key={cat.id_categoria} value={cat.nombre}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('Marca')}
                    </label>
                    <input
                      type="text"
                      value={editData.marca}
                      onChange={(e) => setEditData(prev => ({...prev, marca: e.target.value}))}
                      className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-blue-400/50 focus:outline-none"
                    />
                  </div>
                  <div></div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('Descripción del Producto')}
                    </label>
                    <textarea
                      value={editData.descripcion_producto}
                      onChange={(e) => setEditData(prev => ({...prev, descripcion_producto: e.target.value}))}
                      className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-blue-400/50 focus:outline-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Datos de la Variante (Editable) */}
              <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                <h4 className="text-lg font-semibold text-green-300 mb-4 flex items-center">
                  🎨 {t('Datos de la Variante')}
                  {hasChanges && (
                    <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full animate-pulse">
                      ⚠️ {t('Cambios detectados')}
                    </span>
                  )}
                </h4>

                {/* Nombre de la variante */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Nombre de la Variante')} *
                  </label>
                  <input
                    type="text"
                    value={editData.nombre_variante}
                    onChange={(e) => setEditData(prev => ({...prev, nombre_variante: e.target.value}))}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-green-400/50 focus:outline-none"
                    required
                  />
                </div>

                {/* Imágenes de la variante */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('Imágenes de la Variante')}
                  </label>
                  
                  {/* Vista previa de imágenes existentes */}
                  {editData.imagenes && editData.imagenes.length > 0 ? (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-3">
                        {editData.imagenes.map((img, imgIndex) => (
                          <div key={imgIndex} className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden relative group">
                            <Image
                              src={img.url}
                              alt={`${editData.nombre_variante} - ${imgIndex + 1}`}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Botón X para eliminar (sin número de orden) */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(imgIndex)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title={t('Eliminar imagen')}
                            >
                              ×
                            </button>
                            
                            {/* Indicador de imagen local vs Cloudinary */}
                            {img.isLocalPreview && (
                              <div className="absolute bottom-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">
                                {t('Nueva')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{t('Imágenes actuales de la variante')}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm mb-3">{t('No hay imágenes asignadas a esta variante')}</p>
                  )}
                  
                  {/* Input para subir nueva imagen */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-green-600 file:text-white hover:file:bg-green-700"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('Puedes agregar nuevas imágenes a la variante')}</p>
                </div>

                {/* Checkbox de precio único */}
                <div className="mb-4">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={uniquePrice}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUniquePrice(checked);
                        setEditData(prev => ({...prev, precio_unico: checked}));
                      }}
                      className="mr-2"
                    />
                    {t('Precio único para todas las tallas')}
                  </label>
                </div>

                {/* Precio único */}
                {uniquePrice ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('Precio')} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editData.precio_referencia || 0}
                      onChange={(e) => setEditData(prev => ({...prev, precio_referencia: Number(e.target.value)}))}
                      className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-green-400/50 focus:outline-none"
                      required
                    />
                  </div>
                ) : null}

                {/* Tabla de inventario por tallas */}
                {editData.tallas.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">{t('Inventario por Tallas')}</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-white/20 rounded-lg">
                        <thead>
                          <tr className="bg-black/50">
                            <th className="p-3 text-white text-center border-b border-white/20">
                              {t('Talla')}
                            </th>
                            <th className="p-3 text-white text-center border-b border-white/20">
                              {t('Cantidad en Stock')}
                            </th>
                            {!uniquePrice && (
                              <th className="p-3 text-white text-center border-b border-white/20">
                                {t('Precio por Talla')}
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {editData.tallas.map((talla) => (
                            <tr key={talla.id_talla} className="border-b border-white/10">
                              <td className="p-3 text-white text-center font-medium">
                                {talla.nombre_talla}
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={talla.cantidad}
                                  onChange={(e) => setEditData(prev => ({
                                    ...prev,
                                    tallas: prev.tallas.map(t => 
                                      t.id_talla === talla.id_talla 
                                        ? {...t, cantidad: Number(e.target.value)}
                                        : t
                                    )
                                  }))}
                                  className="w-full p-2 bg-black/50 border border-white/20 rounded text-white text-center focus:border-green-400/50 focus:outline-none"
                                  placeholder="0"
                                />
                              </td>
                              {!uniquePrice && (
                                <td className="p-3">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={talla.precio || 0}
                                    onChange={(e) => setEditData(prev => ({
                                      ...prev,
                                      tallas: prev.tallas.map(t => 
                                        t.id_talla === talla.id_talla 
                                          ? {...t, precio: Number(e.target.value)}
                                          : t
                                      )
                                    }))}
                                    className="w-full p-2 bg-black/50 border border-white/20 rounded text-white text-center focus:border-green-400/50 focus:outline-none"
                                    placeholder="0.00"
                                  />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={!hasChanges || isUpdating}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    hasChanges && !isUpdating
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isUpdating ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      {t('Actualizando...')}
                    </span>
                  ) : hasChanges ? (
                    <span className="flex items-center justify-center">
                      💾 {t('Actualizar Variante')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      ✓ {t('Sin cambios')}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditVariantForm(false);
                    setEditingVariant(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ❌ {t('Cancelar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };
    
    return <EditVariantFormComponent />;
  }, [editingVariant]);

  const VariantForm = useMemo(() => {
    const VariantFormComponent = () => {
      const [productFormData, setProductFormData] = useState<ProductFormData>({
        producto_nombre: '',
        producto_descripcion: '',
        categoria: '',
        marca: '',
        id_sistema_talla: 0,
        variantes: [
          {
            nombre: '',
            precio_unico: true,
            precio_referencia: 0,
            imagenes: [],
            tallas: []
          }
        ]
      });

      const [singleVariantData, setSingleVariantData] = useState<VariantFormData>({
        nombre: '',
        precio_unico: true,
        precio_referencia: 0,
        imagenes: [],
        tallas: []
      });

    const [uniquePrice, setUniquePrice] = useState(true);
    const [uniquePriceValue, setUniquePriceValue] = useState(0);
    const [localUploadingImage, setLocalUploadingImage] = useState(false);
    const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
    const [uploadingToCloudinary, setUploadingToCloudinary] = useState(false);

      // useEffect para resetear formulario al cambiar tipo
      useEffect(() => {
        // Resetear datos cuando no estamos editando
        setProductFormData({
          producto_nombre: '',
          producto_descripcion: '',
          categoria: '',
          marca: '',
          id_sistema_talla: 0,
          variantes: [
            {
              nombre: '',
              precio_unico: true,
              precio_referencia: 0,
              imagenes: [],
              tallas: []
            }
          ]
        });
        
        setSingleVariantData({
          nombre: '',
          precio_unico: true,
          precio_referencia: 0,
          imagenes: [],
          tallas: []
        });
      }, [formType]);    const handleSizeSystemChange = (systemId: number) => {
      const system = sizeSystems.find(s => s.id_sistema_talla === systemId);
      if (system) {
        const tallasDefault = system.tallas.map(talla => ({
          id_talla: talla.id_talla,
          nombre_talla: talla.nombre_talla,
          cantidad: 0,
          precio: uniquePrice ? uniquePriceValue : 0
        }));

        if (formType === 'nuevo_producto') {
          setProductFormData(prev => ({
            ...prev,
            id_sistema_talla: systemId,
            variantes: prev.variantes.map((v, index) => 
              index === 0 ? { ...v, tallas: tallasDefault } : v
            )
          }));
        } else {
          setSingleVariantData(prev => ({
            ...prev,
            tallas: tallasDefault
          }));
        }
      }
    };

    const handleImageUpload = async (file: File, variantIndex?: number) => {
      console.log('🔍 [DEBUG] Creando vista previa local para:', file.name);
      
      // Crear URL local para vista previa inmediata
      const previewUrl = URL.createObjectURL(file);
      
      const imagePreview = {
        url: previewUrl,
        public_id: 'local-preview-' + Date.now(), // ID temporal para vista previa
        file: file, // Guardamos el archivo para subirlo después
        isLocalPreview: true // Marca para identificar vistas previas locales
      };
      
      if (formType === 'nuevo_producto' && variantIndex !== undefined) {
        setProductFormData(prev => ({
          ...prev,
          variantes: prev.variantes.map((v, index) => 
            index === variantIndex 
              ? { 
                  ...v, 
                  imagenes: v.imagenes ? [...v.imagenes, imagePreview] : [imagePreview]
                }
              : v
          )
        }));
      } else {
        setSingleVariantData(prev => ({
          ...prev,
          imagenes: prev.imagenes ? [...prev.imagenes, imagePreview] : [imagePreview]
        }));
      }
      
      console.log('🔍 [DEBUG] Vista previa agregada exitosamente');
    };

    // Función para eliminar imagen
    const handleRemoveImage = useCallback((imageIndex: number, variantIndex?: number) => {
      console.log('🔍 [DEBUG] Eliminando imagen en índice:', imageIndex);
      
      if (formType === 'nuevo_producto' && variantIndex !== undefined) {
        setProductFormData(prev => ({
          ...prev,
          variantes: prev.variantes.map((v, index) => 
            index === variantIndex 
              ? { 
                  ...v, 
                  imagenes: v.imagenes?.filter((_, imgIndex) => imgIndex !== imageIndex) || []
                }
              : v
          )
        }));
      } else {
        setSingleVariantData(prev => ({
          ...prev,
          imagenes: prev.imagenes?.filter((_, imgIndex) => imgIndex !== imageIndex) || []
        }));
      }
      
      console.log('🔍 [DEBUG] Imagen eliminada exitosamente');
    }, [formType]);

    const addNewVariant = () => {
      const system = sizeSystems.find(s => s.id_sistema_talla === productFormData.id_sistema_talla);
      const tallasDefault = system ? system.tallas.map(talla => ({
        id_talla: talla.id_talla,
        nombre_talla: talla.nombre_talla,
        cantidad: 0,
        precio: uniquePrice ? uniquePriceValue : 0
      })) : [];

      setProductFormData(prev => ({
        ...prev,
        variantes: [
          ...prev.variantes,
          {
            nombre: '',
            precio_unico: true,
            precio_referencia: 0,
            imagenes: [],
            tallas: tallasDefault
          }
        ]
      }));
    };

    // Función para subir imágenes locales a Cloudinary
    const uploadLocalImagesToCloudinary = async (imagenes: any[]) => {
      console.log('🔍 [DEBUG] Subiendo imágenes locales a Cloudinary...');
      
      const uploadedImages = [];
      
      for (const imagen of imagenes) {
        if (imagen.isLocalPreview && imagen.file) {
          console.log('🔍 [DEBUG] Subiendo imagen local:', imagen.file.name);
          
          // Obtener token
          const token = getToken();
          if (!token) {
            throw new Error('No hay token de autenticación');
          }
          
          const formData = new FormData();
          formData.append('image', imagen.file);
          
          const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/upload-image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData,
          });
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.message || 'Error uploading image');
          }
          
          // Limpiar URL local
          URL.revokeObjectURL(imagen.url);
          
          uploadedImages.push({
            url: data.url,
            public_id: data.public_id
          });
        } else {
          // Imagen ya subida, mantenerla
          uploadedImages.push({
            url: imagen.url,
            public_id: imagen.public_id
          });
        }
      }
      
      return uploadedImages;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      console.log('🔍 [DEBUG] Iniciando handleSubmit...');
      setUploadingToCloudinary(true);
      
      try {
        let response;
        
        if (formType === 'nuevo_producto') {
          // Subir imágenes locales de todas las variantes
          console.log('🔍 [DEBUG] Subiendo imágenes locales para nuevo producto...');
          const updatedVariantes = await Promise.all(
            productFormData.variantes.map(async (variante) => {
              if (variante.imagenes && variante.imagenes.length > 0) {
                const uploadedImages = await uploadLocalImagesToCloudinary(variante.imagenes);
                return {
                  ...variante,
                  imagenes: uploadedImages
                };
              }
              return variante;
            })
          );
          
          const updatedProductData = {
            ...productFormData,
            variantes: updatedVariantes
          };
          
          response = await makeAuthenticatedRequest('https://trebodeluxe-backend.onrender.com/api/admin/products', {
            method: 'POST',
            body: JSON.stringify(updatedProductData),
          });
        } else {
          // Para nueva variante
          console.log('🔍 [DEBUG] Procesando nueva variante...');
          let updatedVariantData = { ...singleVariantData };
          
          if (singleVariantData.imagenes && singleVariantData.imagenes.length > 0) {
            const uploadedImages = await uploadLocalImagesToCloudinary(singleVariantData.imagenes);
            updatedVariantData.imagenes = uploadedImages;
          }
          
          // Modo creación - nueva variante
          const payload = {
            id_producto: selectedProductId,
            ...updatedVariantData
          };
          
          response = await makeAuthenticatedRequest('https://trebodeluxe-backend.onrender.com/api/admin/products/variants', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
        }
        
        const data = await response.json();
        
        if (data.success) {
          alert(t('Guardado correctamente'));
          setShowVariantForm(false);
          loadVariants();
          loadProducts();
        } else {
          alert(t('Error al guardar: ') + data.message);
        }
      } catch (error) {
        console.error('Error saving:', error);
        alert(t('Error al guardar'));
      } finally {
        setUploadingToCloudinary(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">
              {formType === 'nuevo_producto' ? t('Nuevo Producto') : t('Nueva Variante')}
            </h3>
            <button
              onClick={() => {
                setShowVariantForm(false);
              }}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Radio buttons */}
            <div className="flex gap-6">
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  name="formType"
                  value="nuevo_producto"
                  checked={formType === 'nuevo_producto'}
                  onChange={(e) => setFormType(e.target.value as 'nuevo_producto' | 'nueva_variante')}
                  className="mr-2"
                />
                {t('Nuevo Producto')}
              </label>
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  name="formType"
                  value="nueva_variante"
                  checked={formType === 'nueva_variante'}
                  onChange={(e) => setFormType(e.target.value as 'nuevo_producto' | 'nueva_variante')}
                  className="mr-2"
                />
                {t('Nueva Variante')}
              </label>
            </div>

            {formType === 'nuevo_producto' ? (
              <div className="space-y-6">
                {/* Formulario de producto */}
                <div className="bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-300 mb-4">{t('Datos del Producto')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {t('Nombre del Producto')}
                      </label>
                      <input
                        type="text"
                        value={productFormData.producto_nombre}
                        onChange={(e) => setProductFormData(prev => ({...prev, producto_nombre: e.target.value}))}
                        className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {t('Categoría')}
                      </label>
                      <select
                        value={productFormData.categoria}
                        onChange={(e) => setProductFormData(prev => ({...prev, categoria: e.target.value}))}
                        className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                        required
                      >
                        <option value="">{t('Seleccionar categoría')}</option>
                        {categorias.map((categoria) => (
                          <option key={categoria.id_categoria} value={categoria.nombre}>
                            {categoria.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {t('Descripción')}
                      </label>
                      <textarea
                        value={productFormData.producto_descripcion}
                        onChange={(e) => setProductFormData(prev => ({...prev, producto_descripcion: e.target.value}))}
                        className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {t('Marca')}
                      </label>
                      <input
                        type="text"
                        value={productFormData.marca}
                        onChange={(e) => setProductFormData(prev => ({...prev, marca: e.target.value}))}
                        className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {t('Sistema de Tallas')}
                      </label>
                      <select
                        value={productFormData.id_sistema_talla}
                        onChange={(e) => handleSizeSystemChange(Number(e.target.value))}
                        className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                        required
                      >
                        <option value={0}>{t('Seleccionar sistema de tallas')}</option>
                        {sizeSystems.map((system) => (
                          <option key={system.id_sistema_talla} value={system.id_sistema_talla}>
                            {system.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Formularios de variantes */}
                {productFormData.variantes.map((variant, index) => (
                  <div key={index} className="bg-green-900/20 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-300 mb-4">
                      {t('Variante')} {index + 1}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {t('Nombre de la Variante')}
                        </label>
                        <input
                          type="text"
                          value={variant.nombre}
                          onChange={(e) => setProductFormData(prev => ({
                            ...prev,
                            variantes: prev.variantes.map((v, i) => 
                              i === index ? {...v, nombre: e.target.value} : v
                            )
                          }))}
                          className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {t('Imágenes')}
                        </label>
                        
                        {/* Vista previa de imágenes existentes */}
                        {variant.imagenes && variant.imagenes.length > 0 ? (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-2">
                              {/* Imágenes */}
                              {variant.imagenes.map((imagen, imgIndex) => (
                                <div key={imgIndex} className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden relative">
                                  <Image
                                    src={imagen.url}
                                    alt={variant.nombre}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl">{imgIndex + 1}</div>
                                </div>
                              ))}
                              {/* Imágenes adicionales */}
                              {variant.imagenes?.map((img, imgIndex) => (
                                <div key={imgIndex} className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden relative group">
                                  <Image
                                    src={img.url}
                                    alt={`${variant.nombre} - ${imgIndex + 2}`}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">{imgIndex + 2}</div>
                                  {/* Botón X para eliminar */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(imgIndex, index)}
                                    className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Eliminar imagen"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{t('Imágenes actuales')}</p>
                          </div>
                        ) : null}
                        
                        {/* Input para subir nueva imagen */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, index);
                          }}
                          className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-green-600 file:text-white hover:file:bg-green-700"
                        />
                        <p className="text-xs text-gray-400 mt-1">{t('Puedes subir múltiples imágenes por variante')}</p>
                        
                        {/* Estados de carga */}
                        {localUploadingImage && uploadingVariantIndex === index && (
                          <p className="text-yellow-400 text-sm mt-1 flex items-center">
                            <span className="animate-spin mr-2">⏳</span>
                            {t('Subiendo imagen...')}
                          </p>
                        )}
                        
                        {variant.imagenes && variant.imagenes.length > 0 && (
                          <p className="text-green-400 text-sm mt-1 flex items-center">
                            <span className="mr-2">✓</span>
                            {t('Imagen(es) cargada(s) exitosamente')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Checkbox de precio único */}
                    <div className="mb-4">
                      <label className="flex items-center text-white">
                        <input
                          type="checkbox"
                          checked={uniquePrice}
                          onChange={(e) => setUniquePrice(e.target.checked)}
                          className="mr-2"
                        />
                        {t('Precio único')}
                      </label>
                    </div>

                    {uniquePrice ? (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {t('Precio')}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={uniquePriceValue}
                          onChange={(e) => {
                            const price = Number(e.target.value);
                            setUniquePriceValue(price);
                            setProductFormData(prev => ({
                              ...prev,
                              variantes: prev.variantes.map((v, i) => 
                                i === index ? {
                                  ...v, 
                                  precio: price,
                                  tallas: v.tallas.map(t => ({...t, precio: price}))
                                } : v
                              )
                            }));
                          }}
                          className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                          required
                        />
                      </div>
                    ) : null}

                    {/* Tabla de tallas */}
                    {productFormData.id_sistema_talla > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">{t('Tallas y Stock')}</h5>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-black/50">
                                {variant.tallas.map((talla) => (
                                  <th key={talla.id_talla} className="p-2 text-white text-center">
                                    {talla.nombre_talla}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {variant.tallas.map((talla) => (
                                  <td key={`cantidad-${talla.id_talla}`} className="p-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={talla.cantidad}
                                      onChange={(e) => setProductFormData(prev => ({
                                        ...prev,
                                        variantes: prev.variantes.map((v, i) => 
                                          i === index ? {
                                            ...v,
                                            tallas: v.tallas.map(t => 
                                              t.id_talla === talla.id_talla 
                                                ? {...t, cantidad: Number(e.target.value)}
                                                : t
                                            )
                                          } : v
                                        )
                                      }))}
                                      className="w-full p-1 bg-black/50 border border-white/20 rounded text-white text-center"
                                      placeholder="0"
                                    />
                                  </td>
                                ))}
                              </tr>
                              {!uniquePrice && (
                                <tr>
                                  {variant.tallas.map((talla) => (
                                    <td key={`precio-${talla.id_talla}`} className="p-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={talla.precio || 0}
                                        onChange={(e) => setProductFormData(prev => ({
                                          ...prev,
                                          variantes: prev.variantes.map((v, i) => 
                                            i === index ? {
                                              ...v,
                                              tallas: v.tallas.map(t => 
                                                t.id_talla === talla.id_talla 
                                                  ? {...t, precio: Number(e.target.value)}
                                                  : t
                                              )
                                            } : v
                                          )
                                        }))}
                                        className="w-full p-1 bg-black/50 border border-white/20 rounded text-white text-center"
                                        placeholder="0.00"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Botón para agregar variante */}
                <button
                  type="button"
                  onClick={addNewVariant}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + {t('Nueva Variante')}
                </button>
              </div>
            ) : (
              /* Formulario de nueva variante para producto existente */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Seleccionar Producto')}
                  </label>
                  <select
                    value={selectedProductId || ''}
                    onChange={(e) => {
                      const productId = Number(e.target.value);
                      setSelectedProductId(productId);
                      
                      // Auto-configurar tallas basado en el sistema del producto
                      const product = products.find(p => p.id_producto === productId);
                      if (product?.id_sistema_talla) {
                        handleSizeSystemChange(product.id_sistema_talla);
                      }
                    }}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                    required
                  >
                    <option value="">{t('Seleccionar producto')}</option>
                    {products.map((product) => (
                      <option key={product.id_producto} value={product.id_producto}>
                        {product.nombre} - {product.categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Nombre de la Variante')}
                  </label>
                  <input
                    type="text"
                    value={singleVariantData.nombre}
                    onChange={(e) => setSingleVariantData(prev => ({...prev, nombre: e.target.value}))}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Imágenes')}
                  </label>
                  
                  {/* Vista previa de imágenes existentes */}
                  {singleVariantData.imagenes && singleVariantData.imagenes.length > 0 ? (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-2">
                        {/* Imágenes */}
                        {singleVariantData.imagenes?.map((img, imgIndex) => (
                          <div key={imgIndex} className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden relative group">
                            <Image
                              src={img.url}
                              alt={`${singleVariantData.nombre} - ${imgIndex + 2}`}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">{imgIndex + 2}</div>
                            {/* Botón X para eliminar */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(imgIndex)}
                              className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Eliminar imagen"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{t('Imágenes actuales')}</p>
                    </div>
                  ) : null}
                  
                  {/* Input para subir nueva imagen */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-green-600 file:text-white hover:file:bg-green-700"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('Puedes subir múltiples imágenes por variante')}</p>
                  
                  {/* Estados de carga */}
                  {localUploadingImage && (
                    <p className="text-yellow-400 text-sm mt-1 flex items-center">
                      <span className="animate-spin mr-2">⏳</span>
                      {t('Subiendo imagen...')}
                    </p>
                  )}
                  
                  {singleVariantData.imagenes && singleVariantData.imagenes.length > 0 && (
                    <p className="text-green-400 text-sm mt-1 flex items-center">
                      <span className="mr-2">✓</span>
                      {t('Imagen(es) cargada(s) exitosamente')}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={uniquePrice}
                      onChange={(e) => setUniquePrice(e.target.checked)}
                      className="mr-2"
                    />
                    {t('Precio único')}
                  </label>
                </div>

                {uniquePrice ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {t('Precio')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={singleVariantData.precio_referencia || 0}
                      onChange={(e) => setSingleVariantData(prev => ({...prev, precio_referencia: Number(e.target.value)}))}
                      className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                      required
                    />
                  </div>
                ) : null}

                {/* Tabla de tallas para variante individual */}
                {selectedProductId && singleVariantData.tallas.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">{t('Tallas y Stock')}</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-black/50">
                            {singleVariantData.tallas.map((talla) => (
                              <th key={talla.id_talla} className="p-2 text-white text-center">
                                {talla.nombre_talla}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {singleVariantData.tallas.map((talla) => (
                              <td key={`cantidad-${talla.id_talla}`} className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={talla.cantidad}
                                  onChange={(e) => setSingleVariantData(prev => ({
                                    ...prev,
                                    tallas: prev.tallas.map(t => 
                                      t.id_talla === talla.id_talla 
                                        ? {...t, cantidad: Number(e.target.value)}
                                        : t
                                    )
                                  }))}
                                  className="w-full p-1 bg-black/50 border border-white/20 rounded text-white text-center"
                                  placeholder="0"
                                />
                              </td>
                            ))}
                          </tr>
                          {!uniquePrice && (
                            <tr>
                              {singleVariantData.tallas.map((talla) => (
                                <td key={`precio-${talla.id_talla}`} className="p-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={talla.precio || 0}
                                    onChange={(e) => setSingleVariantData(prev => ({
                                      ...prev,
                                      tallas: prev.tallas.map(t => 
                                        t.id_talla === talla.id_talla 
                                          ? {...t, precio: Number(e.target.value)}
                                          : t
                                      )
                                    }))}
                                    className="w-full p-1 bg-black/50 border border-white/20 rounded text-white text-center"
                                    placeholder="0.00"
                                  />
                                </td>
                              ))}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botones del formulario */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={uploadingToCloudinary}
              >
                {uploadingToCloudinary ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">⏳</span>
                    {t('Subiendo a Cloudinary...')}
                  </span>
                ) : (
                  t('Guardar')
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowVariantForm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {t('Cancelar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
    };
    
    return <VariantFormComponent />;
  }, [
    formType, 
    selectedProductId, 
    additionalVariants, 
    sizeSystems, 
    products, 
    t,
    user
  ]);

  // Función para formatear la fecha y hora
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Función para obtener el saludo según la hora
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Renderizar card de usuario
  const renderUserCard = () => (
    <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">
              {user?.nombres ? user.nombres.charAt(0).toUpperCase() : '👤'}
            </span>
          </div>
          <div>
            <h2 className="text-white font-bold text-xl mb-1">
              {getGreeting()}, {user?.nombres || 'Usuario'} {user?.apellidos || ''}
            </h2>
            <div className="flex items-center space-x-4 text-sm">
              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-medium border border-green-500/30">
                🎭 {user?.rol?.toUpperCase() || 'ADMIN'}
              </span>
              <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-medium border border-blue-500/30">
                👤 ID: {user?.id_usuario || 'N/A'}
              </span>
              <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-medium border border-purple-500/30">
                � {user?.correo || 'Sin email'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end space-y-2">
          <div className="bg-black/20 rounded-lg p-3 border border-white/20">
            <div className="text-white/90 text-sm font-medium mb-1">
              📅 {formatDateTime(currentTime).split(' ').slice(0, 4).join(' ')}
            </div>
            <div className="text-green-300 text-2xl font-mono font-bold text-center">
              🕐 {currentTime.toLocaleTimeString('es-MX', { hour12: false })}
            </div>
          </div>
          <div className="text-white/60 text-xs text-center">
            Sesión activa desde {currentTime.toLocaleDateString('es-MX')}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-64 bg-black/80 backdrop-blur-md border-r border-white/20 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-8">{t('Panel de Admin')}</h1>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'dashboard'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📊 {t('Dashboard')}
          </button>
          <button
            onClick={() => setActiveSection('header')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'header'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📝 {t('Textos del Header')}
          </button>
          <button
            onClick={() => setActiveSection('images')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'images'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            🖼️ {t('Imágenes Index')}
          </button>
          <button
            onClick={() => setActiveSection('products')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'products'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📦 {t('Productos y Variantes')}
          </button>
          <button
            onClick={() => setActiveSection('categorias')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'categorias'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📁 {t('Categorías')}
          </button>
          <button
            onClick={() => setActiveSection('promotions')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'promotions'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            🎯 {t('Promociones')}
          </button>
          <button
            onClick={() => setActiveSection('orders')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'orders'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            � {t('Pedidos')}
          </button>
          <button
            onClick={() => setActiveSection('notes')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'notes'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📝 {t('Notas')}
          </button>
          <button
            onClick={() => setActiveSection('sizes')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'sizes'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📏 {t('Sistemas de Tallas')}
          </button>
          
          {/* Sección SkyDropX */}
          <div className="border-t border-gray-600 pt-2 mt-4">
            <p className="px-4 py-2 text-xs uppercase text-gray-400 font-semibold">SkyDropX</p>
            <button
              onClick={() => setActiveSection('skydropx-config')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'skydropx-config'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              ⚙️ {t('Configuración SkyDropX')}
            </button>
            <button
              onClick={() => setActiveSection('calculadora-envios')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'calculadora-envios'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              🧮 {t('Calculadora de Envíos')}
            </button>
          </div>
        </nav>
      </div>
      <div className="absolute bottom-6 left-6">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          ← {t('Volver al sitio')}
        </Link>
      </div>
    </div>
  );

  // Funciones para Header Texts
  const updateHeaderTexts = async () => {
    try {
      console.log('Updating header texts:', localHeaderTexts);
      
      // Llamar al contexto para actualizar en la base de datos
      const success = await updateHeaderSettings({
        brandName: localHeaderTexts.brandName,
        promoTexts: localHeaderTexts.promoTexts
      });
      
      if (success) {
        alert(t('Textos del header actualizados correctamente'));
      } else {
        alert(t('Error al actualizar los textos'));
      }
    } catch (error) {
      console.error('Error updating header texts:', error);
      alert(t('Error al actualizar los textos'));
    }
  };

  // Funciones para Home Images  
  const loadHomeImages = useCallback(async () => {
    setHomeImagesLoading(true);
    try {
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/home-images');
      const data = await response.json();
      
      if (data.success) {
        setHomeImages(data.images);
      } else {
        console.error('Error loading home images:', data.message);
      }
    } catch (error) {
      console.error('Error loading home images:', error);
    } finally {
      setHomeImagesLoading(false);
    }
  }, []);

  const updateHomeImage = async (imageType: 'heroImage1' | 'heroImage2' | 'promosBannerImage', file: File) => {
    setUploadingHomeImage(true);
    try {
      // Subir imagen a Cloudinary
      const formData = new FormData();
      formData.append('image', file);
      
      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const uploadResponse = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      const uploadData = await uploadResponse.json();
      if (!uploadData.success) {
        throw new Error(uploadData.message || 'Error uploading image');
      }
      
      // Actualizar en el backend
      const updateResponse = await makeAuthenticatedRequest('https://trebodeluxe-backend.onrender.com/api/admin/home-images', {
        method: 'PUT',
        body: JSON.stringify({
          imageType,
          url: uploadData.url,
          public_id: uploadData.public_id
        })
      });
      
      const updateData = await updateResponse.json();
      if (updateData.success) {
        // Actualizar estado local
        setHomeImages(prev => ({
          ...prev,
          [imageType]: uploadData.url
        }));
        
        alert(t('Imagen actualizada correctamente'));
        setShowImageUploadOverlay(false);
        setCurrentImageType(null);
      } else {
        throw new Error(updateData.message || 'Error updating image');
      }
    } catch (error) {
      console.error('Error updating home image:', error);
      alert(t('Error al actualizar la imagen'));
    } finally {
      setUploadingHomeImage(false);
    }
  };

  const updateHomeImages = async () => {
    try {
      console.log('Updating home images:', homeImages);
      alert(t('Imágenes actualizadas correctamente'));
    } catch (error) {
      console.error('Error updating images:', error);
      alert(t('Error al actualizar las imágenes'));
    }
  };

  // Funciones para Orders Management
  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      console.log('Updating order status:', orderId, newStatus);
      alert(t('Estado del pedido actualizado'));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(t('Error al actualizar el estado'));
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">{t('Dashboard General')}</h2>
        <button
          onClick={loadDashboardStats}
          disabled={dashboardStats.loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {dashboardStats.loading ? '⏳' : '🔄'} {dashboardStats.loading ? 'Cargando...' : 'Actualizar'}
        </button>
        
        <button
          onClick={() => {
            console.log('📊 Estado actual dashboardStats:', dashboardStats);
            console.log('🔍 Test manual de loadDashboardStats...');
            loadDashboardStats();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          🔍 Debug
        </button>
      </div>

      {/* Estadísticas principales */}
      {dashboardStats.loading && (
        <div className="text-center py-8 text-white/80">
          <div className="inline-flex items-center gap-3">
            <div className="animate-spin text-2xl">⏳</div>
            <span className="text-lg">Cargando estadísticas del dashboard...</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-200 mb-1">Productos Únicos</h3>
              <p className="text-3xl font-bold text-green-400">{dashboardStats.totalProducts || '0'}</p>
            </div>
            <div className="text-green-400 text-3xl">📦</div>
          </div>
          <p className="text-green-200 text-sm mt-2">{dashboardStats.totalVariants || '0'} variantes totales</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-200 mb-1">Promociones</h3>
              <p className="text-3xl font-bold text-blue-400">{dashboardStats.activePromotions || '0'}</p>
            </div>
            <div className="text-blue-400 text-3xl">🏷️</div>
          </div>
          <p className="text-blue-200 text-sm mt-2">Activas actualmente</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-200 mb-1">Pedidos</h3>
              <p className="text-3xl font-bold text-yellow-400">{dashboardStats.pendingOrders || '0'}</p>
            </div>
            <div className="text-yellow-400 text-3xl">⏳</div>
          </div>
          <p className="text-yellow-200 text-sm mt-2">{dashboardStats.totalOrders || '0'} pedidos totales</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-200 mb-1">Notas</h3>
              <p className="text-3xl font-bold text-purple-400">{dashboardStats.totalNotes || '0'}</p>
            </div>
            <div className="text-purple-400 text-3xl">📝</div>
          </div>
          <p className="text-purple-200 text-sm mt-2">{dashboardStats.highPriorityNotes || '0'} de alta prioridad</p>
        </div>
      </div>

      {/* Sección de accesos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accesos rápidos */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">🚀 Accesos Rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveSection('products')}
              className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg p-4 text-left transition-colors group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📦</div>
              <div className="text-white font-medium">Productos</div>
              <div className="text-green-200 text-sm">{dashboardStats.totalVariants} variantes</div>
            </button>
            
            <button
              onClick={() => setActiveSection('promotions')}
              className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg p-4 text-left transition-colors group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🏷️</div>
              <div className="text-white font-medium">Promociones</div>
              <div className="text-blue-200 text-sm">{dashboardStats.activePromotions} activas</div>
            </button>
            
            <button
              onClick={() => setActiveSection('orders')}
              className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg p-4 text-left transition-colors group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📋</div>
              <div className="text-white font-medium">Pedidos</div>
              <div className="text-yellow-200 text-sm">{dashboardStats.pendingOrders} pendientes</div>
            </button>
            
            <button
              onClick={() => setActiveSection('notes')}
              className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg p-4 text-left transition-colors group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📝</div>
              <div className="text-white font-medium">Notas</div>
              <div className="text-purple-200 text-sm">{dashboardStats.highPriorityNotes} prioritarias</div>
            </button>
          </div>
        </div>

        {/* Nota de alta prioridad más reciente */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">🔥 Nota de Alta Prioridad</h3>
          {dashboardStats.recentHighPriorityNote ? (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-white font-semibold text-lg">{dashboardStats.recentHighPriorityNote.titulo}</h4>
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  {dashboardStats.recentHighPriorityNote.prioridad.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-300 mb-3 overflow-hidden text-ellipsis"
                 style={{
                   display: '-webkit-box',
                   WebkitLineClamp: 3,
                   WebkitBoxOrient: 'vertical'
                 }}>
                {dashboardStats.recentHighPriorityNote.contenido}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  👤 {dashboardStats.recentHighPriorityNote.nombre_usuario_creador}
                </span>
                <span className="text-gray-400">
                  📅 {new Date(dashboardStats.recentHighPriorityNote.fecha_creacion).toLocaleDateString('es-MX')}
                </span>
              </div>
              <button
                onClick={() => setActiveSection('notes')}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                Ver Todas las Notas
              </button>
            </div>
          ) : (
            <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-4 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-300">No hay notas de alta prioridad</p>
              <button
                onClick={() => setActiveSection('notes')}
                className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Crear Nueva Nota
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sección de configuración rápida */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">⚙️ Configuración del Sitio</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveSection('header')}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg p-4 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl group-hover:scale-110 transition-transform">🏷️</div>
              <div>
                <div className="text-white font-medium">Textos del Header</div>
                <div className="text-indigo-200 text-sm">Configurar marca y promociones</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('images')}
            className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg p-4 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl group-hover:scale-110 transition-transform">🖼️</div>
              <div>
                <div className="text-white font-medium">Imágenes Principales</div>
                <div className="text-green-200 text-sm">Hero, banners y promociones</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('sizes')}
            className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg p-4 text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl group-hover:scale-110 transition-transform">📏</div>
              <div>
                <div className="text-white font-medium">Sistema de Tallas</div>
                <div className="text-orange-200 text-sm">Gestionar tallas y sistemas</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderHeaderTexts = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Textos del Header')}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-4">{t('Configuración de Textos')}</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-3">{t('Nombre de la Marca')}</label>
              <input
                type="text"
                value={localHeaderTexts.brandName}
                onChange={(e) => setLocalHeaderTexts({...localHeaderTexts, brandName: e.target.value})}
                className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                placeholder={t('Nombre de la marca')}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-white font-medium">{t('Textos Promocionales')}</label>
                <button
                  onClick={() => {
                    setLocalHeaderTexts({
                      ...localHeaderTexts,
                      promoTexts: [...localHeaderTexts.promoTexts, '']
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  + {t('Agregar')}
                </button>
              </div>

              <div className="space-y-3">
                {localHeaderTexts.promoTexts.map((text: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => {
                        const newTexts = [...localHeaderTexts.promoTexts];
                        newTexts[index] = e.target.value;
                        setLocalHeaderTexts({...localHeaderTexts, promoTexts: newTexts});
                      }}
                      className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                      placeholder={t('Texto promocional {{number}}').replace('{{number}}', (index + 1).toString())}
                    />
                    <button
                      onClick={() => {
                        const newTexts = localHeaderTexts.promoTexts.filter((_: string, i: number) => i !== index);
                        setLocalHeaderTexts({...localHeaderTexts, promoTexts: newTexts});
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors"
                      disabled={localHeaderTexts.promoTexts.length <= 1}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={updateHeaderTexts}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('Guardar Cambios')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHomeImages = () => {
    const [principalImages, setPrincipalImages] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadFormData, setUploadFormData] = useState({
      nombre: '',
      descripcion: '',
      posicion: 'inactiva'
    });

    // Cargar imágenes principales
    const loadPrincipalImages = useCallback(async (search = '') => {
      setLoading(true);
      try {
        const url = search 
          ? `https://trebodeluxe-backend.onrender.com/api/admin/principal-images?search=${encodeURIComponent(search)}`
          : 'https://trebodeluxe-backend.onrender.com/api/admin/principal-images';
        
        const response = await makeAuthenticatedRequest(url);
        const data = await response.json();
        
        if (data.success) {
          setPrincipalImages(data.images || []);
        } else {
          console.error('Error loading principal images:', data.message);
        }
      } catch (error) {
        console.error('Error loading principal images:', error);
      } finally {
        setLoading(false);
      }
    }, [makeAuthenticatedRequest]);

    // Cargar imágenes al montar el componente
    useEffect(() => {
      loadPrincipalImages();
    }, [loadPrincipalImages]);

    // Manejar cambio de posición
    const handlePositionChange = async (imageId: number, newPosition: string) => {
      try {
        const response = await makeAuthenticatedRequest(`https://trebodeluxe-backend.onrender.com/api/admin/principal-images/${imageId}/position`, {
          method: 'PUT',
          body: JSON.stringify({ posicion: newPosition }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          loadPrincipalImages(searchQuery); // Recargar lista
        } else {
          alert(t('Error al actualizar posición: ') + data.message);
        }
      } catch (error) {
        console.error('Error updating position:', error);
        alert(t('Error al actualizar la posición'));
      }
    };

    // Manejar subida de nueva imagen
    const handleImageUpload = async (file: File) => {
      try {
        setUploadingHomeImage(true);
        
        // Subir imagen a Cloudinary
        const imageData = await uploadImageToCloudinary(file);
        
        // Crear registro en base de datos
        const response = await makeAuthenticatedRequest('https://trebodeluxe-backend.onrender.com/api/admin/principal-images', {
          method: 'POST',
          body: JSON.stringify({
            nombre: uploadFormData.nombre,
            descripcion: uploadFormData.descripcion,
            url: imageData.url,
            public_id: imageData.public_id,
            posicion: uploadFormData.posicion
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setShowUploadForm(false);
          setUploadFormData({ nombre: '', descripcion: '', posicion: 'inactiva' });
          loadPrincipalImages(searchQuery);
          alert(t('Imagen subida correctamente'));
        } else {
          alert(t('Error al guardar imagen: ') + data.message);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(t('Error al subir la imagen'));
      } finally {
        setUploadingHomeImage(false);
      }
    };

    // Eliminar imagen
    const handleDeleteImage = async (imageId: number, imageName: string) => {
      if (!confirm(t(`¿Estás seguro de que deseas eliminar la imagen "${imageName}"?`))) {
        return;
      }

      try {
        const response = await makeAuthenticatedRequest(`https://trebodeluxe-backend.onrender.com/api/admin/principal-images/${imageId}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (data.success) {
          loadPrincipalImages(searchQuery);
          alert(t('Imagen eliminada correctamente'));
        } else {
          alert(t('Error al eliminar imagen: ') + data.message);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        alert(t('Error al eliminar la imagen'));
      }
    };

    // Filtrar imágenes por posición
    const imagesByPosition = {
      izquierda: principalImages.filter(img => img.posicion === 'izquierda'),
      derecha: principalImages.filter(img => img.posicion === 'derecha'),
      inactiva: principalImages.filter(img => img.posicion === 'inactiva')
    };

    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Imágenes')}</h2>

        {/* Subsección 1: Imágenes Principales */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
              🖼️ {t('Imágenes Principales')}
            </h3>
            
            {/* Controles de búsqueda y agregar */}
            <div className="flex gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('Buscar por nombre...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadPrincipalImages(searchQuery)}
                  className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-400/50"
                />
                <button
                  onClick={() => loadPrincipalImages(searchQuery)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  �
                </button>
              </div>
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                + {t('Subir Imagen')}
              </button>
            </div>
          </div>

          {/* Imágenes actualmente activas */}
          <div className="mb-8">
            <h4 className="text-lg font-medium text-gray-300 mb-4">{t('Imágenes Activas')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Imagen Izquierda */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-white font-medium">{t('Posición Izquierda')}</h5>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                    {imagesByPosition.izquierda.length > 0 ? t('Activa') : t('Vacía')}
                  </span>
                </div>
                {imagesByPosition.izquierda.length > 0 ? (
                  <div className="space-y-2">
                    {imagesByPosition.izquierda.map((image) => (
                      <div key={image.id_imagen} className="bg-black/30 rounded-lg p-3">
                        <div className="flex gap-3">
                          <Image
                            src={image.url}
                            alt={image.nombre}
                            width={60}
                            height={40}
                            className="w-15 h-10 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h6 className="text-white text-sm font-medium truncate">{image.nombre}</h6>
                            {image.descripcion && (
                              <p className="text-gray-400 text-xs truncate">{image.descripcion}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-sm">{t('No hay imagen asignada')}</p>
                  </div>
                )}
              </div>

              {/* Imagen Derecha */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-white font-medium">{t('Posición Derecha')}</h5>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                    {imagesByPosition.derecha.length > 0 ? t('Activa') : t('Vacía')}
                  </span>
                </div>
                {imagesByPosition.derecha.length > 0 ? (
                  <div className="space-y-2">
                    {imagesByPosition.derecha.map((image) => (
                      <div key={image.id_imagen} className="bg-black/30 rounded-lg p-3">
                        <div className="flex gap-3">
                          <Image
                            src={image.url}
                            alt={image.nombre}
                            width={60}
                            height={40}
                            className="w-15 h-10 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h6 className="text-white text-sm font-medium truncate">{image.nombre}</h6>
                            {image.descripcion && (
                              <p className="text-gray-400 text-xs truncate">{image.descripcion}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-sm">{t('No hay imagen asignada')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Todas las imágenes */}
          <div>
            <h4 className="text-lg font-medium text-gray-300 mb-4">
              {t('Todas las Imágenes')} 
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({principalImages.length} {t('total')})
              </span>
            </h4>
            
            {loading ? (
              <div className="text-center text-white py-8">
                <p>{t('Cargando imágenes...')}</p>
              </div>
            ) : principalImages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>{t('No se encontraron imágenes')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {principalImages.map((image) => (
                  <div key={image.id_imagen} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="relative group mb-3">
                      <Image
                        src={image.url}
                        alt={image.nombre}
                        width={300}
                        height={200}
                        className="w-full h-32 object-cover rounded"
                      />
                      
                      {/* Overlay con controles */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteImage(image.id_imagen, image.nombre)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                        >
                          🗑️ {t('Eliminar')}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h6 className="text-white font-medium text-sm truncate">{image.nombre}</h6>
                      {image.descripcion && (
                        <p className="text-gray-400 text-xs line-clamp-2">{image.descripcion}</p>
                      )}
                      
                      {/* Dropdown de posición */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">{t('Posición')}</label>
                        <select
                          value={image.posicion}
                          onChange={(e) => handlePositionChange(image.id_imagen, e.target.value)}
                          className="w-full bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-400/50"
                        >
                          <option value="inactiva">{t('Inactiva')}</option>
                          <option value="izquierda">{t('Izquierda')}</option>
                          <option value="derecha">{t('Derecha')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subsección 2: Banner */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="text-2xl font-semibold text-white flex items-center gap-2 mb-6">
            🎯 {t('Banner')}
          </h3>
          
          <div className="text-center text-gray-400 py-8">
            <p>{t('Funcionalidad de banner en desarrollo')}</p>
          </div>
        </div>

        {/* Modal para subir imagen */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  📸 {t('Subir Nueva Imagen')}
                </h3>
                <button
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadFormData({ nombre: '', descripcion: '', posicion: 'inactiva' });
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Nombre')} *
                  </label>
                  <input
                    type="text"
                    value={uploadFormData.nombre}
                    onChange={(e) => setUploadFormData({...uploadFormData, nombre: e.target.value})}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Descripción')}
                  </label>
                  <textarea
                    value={uploadFormData.descripcion}
                    onChange={(e) => setUploadFormData({...uploadFormData, descripcion: e.target.value})}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Posición')}
                  </label>
                  <select
                    value={uploadFormData.posicion}
                    onChange={(e) => setUploadFormData({...uploadFormData, posicion: e.target.value})}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                  >
                    <option value="inactiva">{t('Inactiva')}</option>
                    <option value="izquierda">{t('Izquierda')}</option>
                    <option value="derecha">{t('Derecha')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('Archivo de Imagen')} *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && uploadFormData.nombre) {
                        handleImageUpload(file);
                      } else if (!uploadFormData.nombre) {
                        alert(t('Por favor ingresa un nombre para la imagen'));
                      }
                    }}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    disabled={uploadingHomeImage}
                  />
                </div>

                {uploadingHomeImage && (
                  <div className="text-center text-blue-400">
                    <p>{t('Subiendo imagen...')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPromotions = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Promociones')}</h2>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <p className="text-white">{t('Funcionalidad de promociones en desarrollo')}</p>
      </div>
    </div>
  );

  const renderOrders = () => <OrdersAdmin />;

  const renderNotes = () => <NotesAdmin />;

  const renderSizeSystems = () => {
    // Función para cargar sistemas con búsqueda
    const loadSizeSystemsWithSearch = async (search = '') => {
      setSizeSystemsLoading(true);
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://trebodeluxe-backend.onrender.com' 
          : 'http://localhost:5000';
        
        const url = search 
          ? `${baseUrl}/api/size-systems/search?search=${encodeURIComponent(search)}`
          : `${baseUrl}/api/size-systems`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setSizeSystemsData(data.sizeSystems || []);
        } else {
          alert(t('Error al cargar sistemas de tallas'));
        }
      } catch (error) {
        console.error('Error loading size systems:', error);
        alert(t('Error de conexión al cargar sistemas de tallas'));
      } finally {
        setSizeSystemsLoading(false);
      }
    };

    // Manejar búsqueda
    const handleSearch = () => {
      loadSizeSystemsWithSearch(sizeSystemSearchQuery);
    };

    // Agregar talla al formulario
    const addSizeInput = () => {
      setSizeSystemFormData({
        ...sizeSystemFormData,
        tallas: [...sizeSystemFormData.tallas, '']
      });
    };

    // Quitar talla del formulario
    const removeSizeInput = (index: number) => {
      if (sizeSystemFormData.tallas.length > 3) {
        const newTallas = sizeSystemFormData.tallas.filter((_, i) => i !== index);
        setSizeSystemFormData({
          ...sizeSystemFormData,
          tallas: newTallas
        });
      }
    };

    // Actualizar talla específica
    const updateSizeInput = (index: number, value: string) => {
      const newTallas = [...sizeSystemFormData.tallas];
      newTallas[index] = value;
      setSizeSystemFormData({
        ...sizeSystemFormData,
        tallas: newTallas
      });
    };

    // Abrir formulario para crear nuevo
    const openCreateForm = () => {
      setSizeSystemFormData({
        nombre: '',
        tallas: ['', '', '']
      });
      setEditingSizeSystem(null);
      setShowSizeSystemForm(true);
    };

    // Abrir formulario para editar
    const openEditForm = (system: SizeSystem) => {
      setSizeSystemFormData({
        nombre: system.nombre,
        tallas: system.tallas.map(t => t.nombre_talla)
      });
      setEditingSizeSystem(system);
      setShowSizeSystemForm(true);
    };

    // Cerrar formulario
    const closeForm = () => {
      setShowSizeSystemForm(false);
      setEditingSizeSystem(null);
      setSizeSystemFormData({
        nombre: '',
        tallas: ['', '', '']
      });
    };

    // Guardar sistema de tallas
    const saveSizeSystem = async () => {
      if (!sizeSystemFormData.nombre.trim()) {
        alert(t('El nombre del sistema es requerido'));
        return;
      }

      const tallasValidas = sizeSystemFormData.tallas.filter((t: string) => t.trim());
      if (tallasValidas.length === 0) {
        alert(t('Debe agregar al menos una talla'));
        return;
      }

      setSizeSystemsLoading(true);
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://trebodeluxe-backend.onrender.com' 
          : 'http://localhost:5000';

        const url = editingSizeSystem 
          ? `${baseUrl}/api/size-systems/${editingSizeSystem.id_sistema_talla}`
          : `${baseUrl}/api/size-systems`;

        const method = editingSizeSystem ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: sizeSystemFormData.nombre.trim(),
            tallas: tallasValidas
          })
        });

        const data = await response.json();

        if (data.success) {
          alert(editingSizeSystem ? t('Sistema actualizado exitosamente') : t('Sistema creado exitosamente'));
          closeForm();
          loadSizeSystems();
        } else {
          alert(data.message || t('Error al guardar el sistema'));
        }
      } catch (error) {
        console.error('Error saving size system:', error);
        alert(t('Error de conexión al guardar'));
      } finally {
        setSizeSystemsLoading(false);
      }
    };

    // Eliminar sistema de tallas
    const deleteSizeSystem = async (system: SizeSystem) => {
      if (!confirm(t('¿Está seguro de que desea eliminar este sistema de tallas? Esta acción no se puede deshacer.'))) {
        return;
      }

      setLoading(true);
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://trebodeluxe-backend.onrender.com' 
          : 'http://localhost:5000';

        const response = await fetch(`${baseUrl}/api/size-systems/${system.id_sistema_talla}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          alert(t('Sistema eliminado correctamente'));
          loadSizeSystemsWithSearch(sizeSystemSearchQuery);
        } else {
          alert(data.message || t('Error al eliminar el sistema'));
        }
      } catch (error) {
        console.error('Error deleting size system:', error);
        alert(t('Error de conexión al eliminar'));
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white mb-6">{t('Sistemas de Tallas')}</h2>
          <div className="flex items-center gap-4">
            {sizeSystemsLoading && <div className="text-green-400">⏳ {t('Cargando...')}</div>}
            <button
              onClick={() => {
                console.log('Debug: Recargando sistemas de tallas...');
                loadSizeSystems();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              🔄 Debug Reload
            </button>
          </div>
        </div>

        {/* Barra de búsqueda y botón agregar */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder={t('Buscar sistema de tallas...')}
              value={sizeSystemSearchQuery}
              onChange={(e) => setSizeSystemSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              🔍 {t('Buscar')}
            </button>
            <button
              onClick={openCreateForm}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              + {t('Agregar Sistema')}
            </button>
          </div>

          {/* Debug info */}
          <div className="mb-4 p-3 bg-gray-800 rounded text-sm text-gray-300">
            <p>Debug: sizeSystemsData.length = {sizeSystemsData.length}</p>
            <p>Debug: sizeSystems.length = {sizeSystems.length}</p>
            <p>Debug: sizeSystemsLoading = {sizeSystemsLoading.toString()}</p>
          </div>

          {/* Lista de sistemas de tallas */}
          <div className="space-y-4">
            {sizeSystemsData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {sizeSystemsLoading ? t('Cargando sistemas...') : t('No se encontraron sistemas de tallas')}
              </div>
            ) : (
              sizeSystemsData.map((system) => (
                <div 
                  key={system.id_sistema_talla}
                  className="flex items-center bg-black/30 rounded-lg p-4 border border-white/10"
                >
                  {/* Nombre del sistema */}
                  <div className="font-semibold text-white min-w-[150px]">
                    {system.nombre}
                  </div>

                  {/* Línea separadora */}
                  <div className="w-px h-8 bg-white/20 mx-4"></div>

                  {/* Tallas */}
                  <div className="flex-1 flex flex-wrap gap-2">
                    {system.tallas.map((talla, index) => (
                      <span 
                        key={talla.id_talla}
                        className="bg-green-600/20 border border-green-400/30 text-green-300 px-3 py-1 rounded-full text-sm"
                      >
                        {talla.nombre_talla}
                      </span>
                    ))}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openEditForm(system)}
                      disabled={loading}
                      className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      ✏️ {t('Editar')}
                    </button>
                    <button
                      onClick={() => deleteSizeSystem(system)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      🗑️ {t('Eliminar')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Formulario Modal */}
        {showSizeSystemForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/90 border border-white/20 rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingSizeSystem ? t('Editar Sistema') : t('Nuevo Sistema')}
                </h3>
                <button
                  onClick={closeForm}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre del sistema */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    {t('Nombre del Sistema')}
                  </label>
                  <input
                    type="text"
                    value={sizeSystemFormData.nombre}
                    onChange={(e) => setSizeSystemFormData({...sizeSystemFormData, nombre: e.target.value})}
                    placeholder={t('Ej: Tallas Estándar')}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
                  />
                </div>

                {/* Tallas */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    {t('Tallas')}
                  </label>
                  <div className="space-y-2">
                    {sizeSystemFormData.tallas.map((talla, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={talla}
                          onChange={(e) => updateSizeInput(index, e.target.value)}
                          placeholder={t('Ej: XS, S, M, L...')}
                          className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
                        />
                        {sizeSystemFormData.tallas.length > 3 && (
                          <button
                            onClick={() => removeSizeInput(index)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                          >
                            -
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addSizeInput}
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    + {t('Agregar Talla')}
                  </button>
                </div>

                {/* Botones del formulario */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={saveSizeSystem}
                    disabled={sizeSystemsLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {sizeSystemsLoading ? t('Guardando...') : (editingSizeSystem ? t('Actualizar') : t('Crear'))}
                  </button>
                  <button
                    onClick={closeForm}
                    disabled={sizeSystemsLoading}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {t('Cancelar')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = useCallback(() => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'header':
        return renderHeaderTexts();
      case 'images':
        return <IndexImagesAdmin currentLanguage={currentLanguage} />;
      case 'index-images':
        return <IndexImagesAdmin currentLanguage={currentLanguage} />;
      case 'categorias':
        return <CategoriasAdmin />;
      case 'products':
        return renderVariantsList;
      case 'promotions':
        return <PromotionsAdmin />;
      case 'orders':
        return renderOrders();
      case 'notes':
        return renderNotes();
      case 'sizes':
        return renderSizeSystems();
      case 'skydropx-config':
        return <SkyDropXConfig />;
      case 'calculadora-envios':
        return <CalculadoraEnvios />;
      default:
        return renderDashboard();
    }
  }, [activeSection, renderDashboard, renderVariantsList, renderSizeSystems]);

  if (!user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Cargando...</div>
    </div>;
  }

  return (
    <div className="min-h-screen flex"
         style={{
           background: 'linear-gradient(180deg, #000 0%, #1a6b1a 25%, #0d3d0d 35%, #000 75%, #000 100%)'
         }}>
      
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Card de Usuario */}
        {renderUserCard()}
        
        {renderContent()}
      </div>

      {/* Formularios modales */}
      {showVariantForm && VariantForm}
      {showEditVariantForm && EditVariantForm}
    </div>
  );
};

// Envolver el componente con AdminProtected para gestionar la autenticación
const ProtectedAdminPage: NextPage = () => (
  <AdminProtected>
    <AdminPage />
  </AdminProtected>
);

export default ProtectedAdminPage;
