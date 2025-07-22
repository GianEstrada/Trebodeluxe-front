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

interface SizeSystem {
  id_sistema_talla: number;
  nombre: string;
  tallas: Array<{
    id_talla: number;
    nombre_talla: string;
    orden: number;
  }>;
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
  
  // Estados para el formulario de productos/variantes
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [formType, setFormType] = useState<'nuevo_producto' | 'nueva_variante'>('nuevo_producto');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [additionalVariants, setAdditionalVariants] = useState<number>(0);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/size-systems');
      const data = await response.json();
      if (data.success) {
        setSizeSystems(data.sizeSystems);
      }
    } catch (error) {
      console.error('Error loading size systems:', error);
    }
  };

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
        <button
          onClick={() => setShowVariantForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + {t('Agregar Variante')}
        </button>
      </div>
      
      {loading ? (
        <div className="text-center text-white">
          <p>{t('Cargando...')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variants.map((variant) => (
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
            onClick={() => setActiveSection('products')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'products' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            📦 {t('Productos')}
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

  const renderContent = () => {
    switch (activeSection) {
      case 'products':
        return renderVariantsList();
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">{t('Dashboard')}</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <p className="text-white">{t('Panel de administración de Trebodeluxe')}</p>
            </div>
          </div>
        );
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
