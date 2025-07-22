import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria: string;
  marca: string;
  precio?: number;
  activo: boolean;
  fecha_creacion?: string;
  imagen?: string;
  variantes?: Variant[];
  total_variantes?: number;
  stock_total?: number;
}

interface Variant {
  id: number;
  producto_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  stock_total: number;
  imagen?: string;
  tallas: VariantSize[];
}

interface VariantSize {
  talla_id: number;
  nombre_talla: string;
  cantidad: number;
}

interface Size {
  id: number;
  nombre: string;
  sistema_id: number;
}

interface SizeSystem {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

const AdminPage: NextPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState<'products' | 'promotions' | 'sizes' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Estados para formularios
  const [showProductForm, setShowProductForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Estados adicionales
  const [sizes, setSizes] = useState<Size[]>([]);
  const [sizeSystems, setSizeSystems] = useState<SizeSystem[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!user || user.rol !== 'admin') { // 'admin' es el rol correcto
      router.push('/login');
      return;
    }
    
    loadProducts();
    loadSizes();
    loadSizeSystems();
  }, [user, router]);

  // Función para cargar productos
  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('categoria', categoryFilter);
      if (brandFilter) params.append('marca', brandFilter);
      if (statusFilter !== 'all') {
        params.append('activo', statusFilter === 'active' ? 'true' : 'false');
      }

      const response = await fetch(`/api/admin/products?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.message || 'Error al cargar productos');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar tallas
  const loadSizes = async () => {
    try {
      const response = await fetch('/api/sizes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSizes(data.tallas || []);
      }
    } catch (error) {
      console.error('Error loading sizes:', error);
    }
  };

  // Función para cargar sistemas de tallas
  const loadSizeSystems = async () => {
    try {
      const response = await fetch('/api/sizes/systems', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSizeSystems(data.sistemas || []);
      }
    } catch (error) {
      console.error('Error loading size systems:', error);
    }
  };

  // Función para subir imagen a Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'trebodeluxe');
      
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dyh8tcvzv/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const data: CloudinaryResponse = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Componente para la lista de productos
  const ProductList = () => (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64 px-3 py-2 border border-gray-300 rounded-md"
        />
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Todas las categorías</option>
          <option value="camisetas">Camisetas</option>
          <option value="pantalones">Pantalones</option>
          <option value="zapatos">Zapatos</option>
          <option value="accesorios">Accesorios</option>
        </select>

        <input
          type="text"
          placeholder="Filtrar por marca..."
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>

        <button
          onClick={loadProducts}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Buscar
        </button>
      </div>

      {/* Botón para nuevo producto */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Gestión de Productos</h2>
        <button
          onClick={() => setShowProductForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          + Crear Nuevo
        </button>
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          
          {products.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron productos
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Componente para cada tarjeta de producto
  const ProductCard = ({ product }: { product: Product }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Imagen del producto */}
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {product.imagen ? (
            <Image
              src={product.imagen}
              alt={product.nombre}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{product.nombre}</h3>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                product.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            <p><strong>Categoría:</strong> {product.categoria}</p>
            <p><strong>Marca:</strong> {product.marca}</p>
            {product.precio && <p><strong>Precio base:</strong> ${product.precio}</p>}
          </div>

          {product.descripcion && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{product.descripcion}</p>
          )}

          {/* Información de variantes */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-blue-600">
              {product.total_variantes || 0} variante(s) | Stock total: {product.stock_total || 0}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedProduct(product.id);
                  setShowVariantForm(true);
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                + Variante
              </button>
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setShowProductForm(true);
                }}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variantes del producto */}
      {product.variantes && product.variantes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="font-medium text-sm mb-2">Variantes:</h4>
          <div className="grid gap-2">
            {product.variantes.map((variant) => (
              <VariantCard key={variant.id} variant={variant} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Componente para cada tarjeta de variante
  const VariantCard = ({ variant }: { variant: Variant }) => (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex gap-3">
        {/* Imagen de la variante */}
        <div className="w-12 h-12 bg-white rounded overflow-hidden flex-shrink-0">
          {variant.imagen ? (
            <Image
              src={variant.imagen}
              alt={variant.nombre}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No img
            </div>
          )}
        </div>

        {/* Info de la variante */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h5 className="font-medium text-sm">{variant.nombre}</h5>
              <p className="text-xs text-gray-600">${variant.precio}</p>
            </div>
            <div className="flex gap-1">
              <span className={`px-2 py-1 rounded text-xs ${
                variant.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {variant.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>

          {/* Tallas y stock */}
          {variant.tallas && variant.tallas.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {variant.tallas.map((talla) => (
                  <span
                    key={talla.talla_id}
                    className="px-2 py-1 bg-white rounded text-xs border"
                    title={`Stock: ${talla.cantidad}`}
                  >
                    {talla.nombre_talla}: {talla.cantidad}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              Stock total: {variant.stock_total}
            </span>
            <button
              onClick={() => {
                setEditingVariant(variant);
                setShowVariantForm(true);
              }}
              className="px-2 py-1 bg-yellow-400 text-white rounded text-xs hover:bg-yellow-500"
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Formulario modal para productos y variantes
  const ProductVariantForm = () => {
    const [formType, setFormType] = useState<'product' | 'variant'>('product');
    const [formData, setFormData] = useState({
      nombre: '',
      descripcion: '',
      categoria: '',
      marca: '',
      precio: '',
      imagen: '',
      activo: true,
      stock: {} as Record<number, number> // talla_id -> cantidad
    });

    const isEditing = editingProduct || editingVariant;

    useEffect(() => {
      if (editingProduct) {
        setFormType('product');
        setFormData({
          nombre: editingProduct.nombre,
          descripcion: editingProduct.descripcion || '',
          categoria: editingProduct.categoria,
          marca: editingProduct.marca,
          precio: editingProduct.precio?.toString() || '',
          imagen: editingProduct.imagen || '',
          activo: editingProduct.activo,
          stock: {}
        });
      } else if (editingVariant) {
        setFormType('variant');
        const stockMap = editingVariant.tallas.reduce((acc, talla) => ({
          ...acc,
          [talla.talla_id]: talla.cantidad
        }), {});
        
        setFormData({
          nombre: editingVariant.nombre,
          descripcion: editingVariant.descripcion || '',
          categoria: '',
          marca: '',
          precio: editingVariant.precio.toString(),
          imagen: editingVariant.imagen || '',
          activo: editingVariant.activo,
          stock: stockMap
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          categoria: '',
          marca: '',
          precio: '',
          imagen: '',
          activo: true,
          stock: {}
        });
      }
    }, [editingProduct, editingVariant]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const imageUrl = await uploadToCloudinary(file);
        setFormData(prev => ({ ...prev, imagen: imageUrl }));
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error al subir la imagen');
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        let endpoint = '/api/admin/products';
        let method = 'POST';
        let body: any = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          activo: formData.activo,
          precio: parseFloat(formData.precio) || null,
          imagen: formData.imagen || null
        };

        if (formType === 'product') {
          body.categoria = formData.categoria;
          body.marca = formData.marca;
          
          if (editingProduct) {
            endpoint = `/api/admin/products/${editingProduct.id}`;
            method = 'PUT';
          }
        } else {
          // Para variantes
          body.producto_id = selectedProduct || editingVariant?.producto_id;
          body.stock = Object.entries(formData.stock)
            .filter(([, cantidad]) => cantidad > 0)
            .map(([talla_id, cantidad]) => ({
              talla_id: parseInt(talla_id),
              cantidad
            }));

          if (editingVariant) {
            endpoint = `/api/admin/products/variants/${editingVariant.id}`;
            method = 'PUT';
          } else {
            endpoint = '/api/admin/products/variants';
          }
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (data.success) {
          closeForm();
          loadProducts();
        } else {
          setError(data.message || 'Error al guardar');
        }
      } catch (error) {
        console.error('Error saving:', error);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    const closeForm = () => {
      setShowProductForm(false);
      setShowVariantForm(false);
      setEditingProduct(null);
      setEditingVariant(null);
      setSelectedProduct(null);
    };

    if (!showProductForm && !showVariantForm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {isEditing ? 'Editar' : 'Crear'} {formType === 'product' ? 'Producto' : 'Variante'}
              </h2>
              <button
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Radio buttons para tipo (solo si no está editando) */}
            {!isEditing && (
              <div className="mb-6">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="formType"
                      value="product"
                      checked={formType === 'product'}
                      onChange={(e) => setFormType(e.target.value as 'product' | 'variant')}
                      className="mr-2"
                    />
                    Nuevo Producto
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="formType"
                      value="variant"
                      checked={formType === 'variant'}
                      onChange={(e) => setFormType(e.target.value as 'product' | 'variant')}
                      className="mr-2"
                    />
                    Nueva Variante
                  </label>
                </div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos básicos */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre {formType === 'product' ? 'del Producto' : 'de la Variante'} *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              {/* Campos específicos para productos */}
              {formType === 'product' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Categoría *</label>
                      <select
                        value={formData.categoria}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        <option value="camisetas">Camisetas</option>
                        <option value="pantalones">Pantalones</option>
                        <option value="zapatos">Zapatos</option>
                        <option value="accesorios">Accesorios</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Marca *</label>
                      <input
                        type="text"
                        value={formData.marca}
                        onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Precio {formType === 'product' ? '(base)' : '*'}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required={formType === 'variant'}
                />
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium mb-1">Imagen</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={uploadingImage}
                />
                {uploadingImage && <p className="text-sm text-blue-500 mt-1">Subiendo imagen...</p>}
                {formData.imagen && (
                  <div className="mt-2">
                    <Image
                      src={formData.imagen}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Stock para variantes */}
              {formType === 'variant' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Stock por Talla</label>
                  <div className="grid grid-cols-2 gap-2">
                    {sizes.map((size) => (
                      <div key={size.id} className="flex items-center gap-2">
                        <label className="flex-1 text-sm">{size.nombre}:</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stock[size.id] || 0}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            stock: {
                              ...prev.stock,
                              [size.id]: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado activo */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                    className="mr-2"
                  />
                  Activo
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  disabled={loading || uploadingImage}
                >
                  {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (!user || user.rol !== 'admin') { // 'admin' es el rol correcto
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Bienvenido, {user.nombres}
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'products', label: 'Productos' },
              { key: 'promotions', label: 'Promociones' },
              { key: 'sizes', label: 'Tallas' },
              { key: 'orders', label: 'Pedidos' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {activeTab === 'products' && <ProductList />}
        {activeTab === 'promotions' && (
          <div className="text-center py-8 text-gray-500">
            Gestión de promociones - Por implementar
          </div>
        )}
        {activeTab === 'sizes' && (
          <div className="text-center py-8 text-gray-500">
            Gestión de tallas - Por implementar
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="text-center py-8 text-gray-500">
            Gestión de pedidos - Por implementar
          </div>
        )}
      </main>

      {/* Modals */}
      <ProductVariantForm />
    </div>
  );
};

export default AdminPage;
