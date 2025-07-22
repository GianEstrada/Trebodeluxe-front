import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useAuth } from '../contexts/AuthContext';

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
  precio: number;
  precio_original?: number;
  variante_activa: boolean;
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  categoria: string;
  marca: string;
  sistema_talla?: string;
  imagen_url?: string;
  imagen_public_id?: string;
  tallas_stock: Array<{
    id_talla: number;
    nombre_talla: string;
    cantidad: number;
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

interface VariantFormData {
  nombre: string;
  precio: number;
  precio_original?: number;
  imagen_url?: string;
  imagen_public_id?: string;
  tallas: Array<{
    id_talla: number;
    nombre_talla: string;
    cantidad: number;
    precio?: number;
  }>;
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
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);

  // Estados para las diferentes secciones
  const [activeSection, setActiveSection] = useState('dashboard');
  
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
  const [formType, setFormType] = useState<'nuevo_producto' | 'nueva_variante'>('nuevo_producto');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [additionalVariants, setAdditionalVariants] = useState<number>(0);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Estados para Header Texts
  const [headerTexts, setHeaderTexts] = useState<HeaderTexts>({
    promoTexts: [
      'ENVIO GRATIS EN PEDIDOS ARRIBA DE $500 MXN',
      'OFERTA ESPECIAL: 20% DE DESCUENTO EN SEGUNDA PRENDA'
    ],
    brandName: 'TREBOLUXE'
  });

  // Estados para Home Images
  const [homeImages, setHomeImages] = useState<HomeImages>({
    heroImage1: '/797e7904b64e13508ab322be3107e368-1@2x.png',
    heroImage2: '/look-polo-2-1@2x.png',
    promosBannerImage: '/promociones-playa.jpg'
  });

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
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Cargar datos iniciales
  useEffect(() => {
    loadVariants();
    loadProducts();
    loadSizeSystems();
  }, []);

  const loadVariants = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/variants');
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
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadSizeSystems = async () => {
    try {
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/size-systems');
      const data = await response.json();
      if (data.success) {
        setSizeSystems(data.sizeSystems);
      }
    } catch (error) {
      console.error('Error loading size systems:', error);
    }
  };

  // Función de búsqueda para productos/variantes
  const searchVariants = (searchTerm: string) => {
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
  };

  // Efecto para buscar cuando cambia el término de búsqueda
  useEffect(() => {
    searchVariants(variantsSearchQuery);
  }, [variantsSearchQuery, variants]);

  const uploadImageToCloudinary = async (file: File): Promise<{url: string, public_id: string}> => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/upload-image', {
        method: 'POST',
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

  const renderVariantsList = () => (
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
            onClick={() => setShowVariantForm(true)}
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
                        {variant.precio_original && (
                          <span className="text-sm text-gray-400 line-through ml-2">${variant.precio_original}</span>
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
                        >
                          {talla.nombre_talla}: {talla.cantidad}
                        </span>
                      ))}
                    </div>
                    {variant.tallas_stock.length === 0 && (
                      <span className="text-xs text-gray-500">{t('Sin tallas configuradas')}</span>
                    )}
                  </div>
                  
                  {/* Total de stock */}
                  <div className="text-sm text-gray-300">
                    <strong>{t('Total en stock:')} {variant.tallas_stock.reduce((total, talla) => total + talla.cantidad, 0)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const VariantForm = () => {
    const [productFormData, setProductFormData] = useState<ProductFormData>({
      producto_nombre: '',
      producto_descripcion: '',
      categoria: '',
      marca: '',
      id_sistema_talla: 0,
      variantes: [
        {
          nombre: '',
          precio: 0,
          precio_original: undefined,
          imagen_url: undefined,
          imagen_public_id: undefined,
          tallas: []
        }
      ]
    });

    const [singleVariantData, setSingleVariantData] = useState<VariantFormData>({
      nombre: '',
      precio: 0,
      precio_original: undefined,
      imagen_url: undefined,
      imagen_public_id: undefined,
      tallas: []
    });

    const [uniquePrice, setUniquePrice] = useState(true);
    const [uniquePriceValue, setUniquePriceValue] = useState(0);

    const handleSizeSystemChange = (systemId: number) => {
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
      try {
        const result = await uploadImageToCloudinary(file);
        
        if (formType === 'nuevo_producto' && variantIndex !== undefined) {
          setProductFormData(prev => ({
            ...prev,
            variantes: prev.variantes.map((v, index) => 
              index === variantIndex 
                ? { ...v, imagen_url: result.url, imagen_public_id: result.public_id }
                : v
            )
          }));
        } else {
          setSingleVariantData(prev => ({
            ...prev,
            imagen_url: result.url,
            imagen_public_id: result.public_id
          }));
        }
      } catch (error) {
        alert('Error al subir imagen: ' + error);
      }
    };

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
            precio: 0,
            precio_original: undefined,
            imagen_url: undefined,
            imagen_public_id: undefined,
            tallas: tallasDefault
          }
        ]
      }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        let response;
        
        if (formType === 'nuevo_producto') {
          response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productFormData),
          });
        } else {
          const payload = {
            id_producto: selectedProductId,
            ...singleVariantData
          };
          
          response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/variants', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
              onClick={() => setShowVariantForm(false)}
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
                      <input
                        type="text"
                        value={productFormData.categoria}
                        onChange={(e) => setProductFormData(prev => ({...prev, categoria: e.target.value}))}
                        className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                        required
                      />
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
                          {t('Imagen')}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, index);
                          }}
                          className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                        />
                        {uploadingImage && <p className="text-yellow-400 text-sm mt-1">{t('Subiendo imagen...')}</p>}
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
                    {t('Imagen')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white"
                  />
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
                      value={singleVariantData.precio}
                      onChange={(e) => setSingleVariantData(prev => ({...prev, precio: Number(e.target.value)}))}
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
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={uploadingImage}
              >
                {uploadingImage ? t('Guardando...') : t('Guardar')}
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
            🖼️ {t('Imágenes Principales')}
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
      console.log('Updating header texts:', headerTexts);
      alert(t('Textos del header actualizados correctamente'));
    } catch (error) {
      console.error('Error updating header texts:', error);
      alert(t('Error al actualizar los textos'));
    }
  };

  // Funciones para Home Images  
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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Dashboard')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">{t('Total Variantes')}</h3>
          <p className="text-3xl font-bold text-green-400">{variants.length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">{t('Promociones Activas')}</h3>
          <p className="text-3xl font-bold text-blue-400">{promotions.filter(p => p.isActive).length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">{t('Pedidos Pendientes')}</h3>
          <p className="text-3xl font-bold text-yellow-400">{orders.filter(o => o.status === 'pending').length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">{t('Notas')}</h3>
          <p className="text-3xl font-bold text-purple-400">{notes.length}</p>
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
                value={headerTexts.brandName}
                onChange={(e) => setHeaderTexts({...headerTexts, brandName: e.target.value})}
                className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                placeholder={t('Nombre de la marca')}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-white font-medium">{t('Textos Promocionales')}</label>
                <button
                  onClick={() => {
                    setHeaderTexts({
                      ...headerTexts,
                      promoTexts: [...headerTexts.promoTexts, '']
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  + {t('Agregar')}
                </button>
              </div>

              <div className="space-y-3">
                {headerTexts.promoTexts.map((text, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => {
                        const newTexts = [...headerTexts.promoTexts];
                        newTexts[index] = e.target.value;
                        setHeaderTexts({...headerTexts, promoTexts: newTexts});
                      }}
                      className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-colors"
                      placeholder={t('Texto promocional {{number}}').replace('{{number}}', (index + 1).toString())}
                    />
                    <button
                      onClick={() => {
                        const newTexts = headerTexts.promoTexts.filter((_, i) => i !== index);
                        setHeaderTexts({...headerTexts, promoTexts: newTexts});
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors"
                      disabled={headerTexts.promoTexts.length <= 1}
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

  const renderHomeImages = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Imágenes Principales')}</h2>

      <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-2xl space-y-8">
        <div className="bg-black/20 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <label className="text-white font-semibold text-lg">{t('Imagen Principal 1')}</label>
          </div>
          <input
            type="text"
            value={homeImages.heroImage1}
            onChange={(e) => setHomeImages({...homeImages, heroImage1: e.target.value})}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none mb-4"
            placeholder={t('URL de la primera imagen')}
          />
          <div className="w-48 h-24 bg-black/40 rounded-lg overflow-hidden border border-white/10">
            <Image
              src={homeImages.heroImage1}
              alt="Imagen 1"
              width={192}
              height={96}
              className="w-full h-full object-cover"
              onError={() => console.log('Error loading image 1')}
            />
          </div>
        </div>

        <div className="bg-black/20 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <label className="text-white font-semibold text-lg">{t('Imagen Principal 2')}</label>
          </div>
          <input
            type="text"
            value={homeImages.heroImage2}
            onChange={(e) => setHomeImages({...homeImages, heroImage2: e.target.value})}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:border-gray-400 focus:outline-none mb-4"
            placeholder={t('URL de la segunda imagen')}
          />
          <div className="w-48 h-24 bg-black/40 rounded-lg overflow-hidden border border-white/10">
            <Image
              src={homeImages.heroImage2}
              alt="Imagen 2"
              width={192}
              height={96}
              className="w-full h-full object-cover"
              onError={() => console.log('Error loading image 2')}
            />
          </div>
        </div>

        <button
          onClick={updateHomeImages}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          {t('💾 Actualizar Todas las Imágenes')}
        </button>
      </div>
    </div>
  );

  const renderPromotions = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Promociones')}</h2>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <p className="text-white">{t('Funcionalidad de promociones en desarrollo')}</p>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Gestión de Pedidos')}</h2>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {t('Pedido')} #{order.id}
                </h3>
                <p className="text-gray-300">{order.customerName} - {order.email}</p>
                <p className="text-gray-400 text-sm">{order.orderDate}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold text-xl">${order.total}</p>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                  className="mt-2 bg-black/50 border border-white/20 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="pending">{t('Pendiente')}</option>
                  <option value="processing">{t('Procesando')}</option>
                  <option value="shipped">{t('Enviado')}</option>
                  <option value="delivered">{t('Entregado')}</option>
                  <option value="cancelled">{t('Cancelado')}</option>
                </select>
              </div>
            </div>

            <div className="border-t border-white/20 pt-4">
              <h4 className="text-white font-medium mb-2">{t('Productos:')}</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.productName} x{item.quantity}
                    </span>
                    <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">{t('Notas')}</h2>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <p className="text-white">{t('Funcionalidad de notas en desarrollo')}</p>
      </div>
    </div>
  );

  const renderSizeSystems = () => {
    // Cargar sistemas de tallas
    const loadSizeSystems = async (search = '') => {
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

    // Efecto para cargar datos iniciales - se maneja en el useEffect principal

    // Manejar búsqueda
    const handleSearch = () => {
      loadSizeSystems(sizeSystemSearchQuery);
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
          loadSizeSystems(sizeSystemSearchQuery);
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
          {loading && <div className="text-green-400">⏳ {t('Cargando...')}</div>}
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

          {/* Lista de sistemas de tallas */}
          <div className="space-y-4">
            {sizeSystemsData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {loading ? t('Cargando sistemas...') : t('No se encontraron sistemas de tallas')}
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

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'header':
        return renderHeaderTexts();
      case 'images':
        return renderHomeImages();
      case 'products':
        return renderVariantsList();
      case 'promotions':
        return renderPromotions();
      case 'orders':
        return renderOrders();
      case 'notes':
        return renderNotes();
      case 'sizes':
        return renderSizeSystems();
      default:
        return renderDashboard();
    }
  };

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
        {renderContent()}
      </div>

      {/* Formulario modal */}
      {showVariantForm && <VariantForm />}
    </div>
  );
};

export default AdminPage;
