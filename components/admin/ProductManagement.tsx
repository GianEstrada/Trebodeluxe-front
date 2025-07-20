// components/admin/ProductManagement.tsx - Componente para gestión de productos

import React, { useState, useEffect } from 'react';
import { productsApi } from '../../utils/productsApi.js';
import { sizesApi } from '../../utils/sizesApi.js';
import { promotionsApi } from '../../utils/promotionsApi.js';
import { useAuth } from '../../contexts/AuthContext';

// Interfaces para respuestas de API
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  products?: Product[];
  error?: string;
}

interface Product {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  marca?: string;
  id_sistema_talla?: number;
  sistema_talla_nombre?: string;
  activo: boolean;
  fecha_creacion: string;
  variantes?: Variant[];
}

interface Variant {
  id_variante: number;
  nombre?: string;
  precio: number;
  precio_original?: number;
  activo: boolean;
  imagenes: ImageVariant[];
  stock_disponible: number;
  tallas_disponibles: SizeStock[];
}

interface ImageVariant {
  id_imagen: number;
  url: string;
  public_id: string;
  orden: number;
}

interface SizeStock {
  id_talla: number;
  nombre_talla: string;
  orden: number;
  cantidad: number;
}

interface SizeSystem {
  id_sistema_talla: number;
  nombre: string;
  tallas: Size[];
}

interface Size {
  id_talla: number;
  nombre_talla: string;
  orden: number;
}

const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sizesSystems, setSizeSystems] = useState<SizeSystem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulario de producto
  const [productForm, setProductForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    marca: '',
    id_sistema_talla: '',
    activo: true
  });

  useEffect(() => {
    if (user?.token) {
      loadProducts();
      loadSizeSystems();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAllForAdmin(user?.token) as ApiResponse<Product[]>;
      if (response.success && response.products) {
        setProducts(response.products);
      } else if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadSizeSystems = async () => {
    try {
      const response = await sizesApi.getAllSystems();
      if (response.success) {
        setSizeSystems(response.data);
      }
    } catch (error) {
      console.error('Error cargando sistemas de tallas:', error);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.token) {
      setError('No hay token de autenticación');
      return;
    }
    
    try {
      const productData = {
        ...productForm,
        id_sistema_talla: productForm.id_sistema_talla ? parseInt(productForm.id_sistema_talla) : null
      };

      let response: ApiResponse;
      if (selectedProduct) {
        response = await productsApi.update(selectedProduct.id_producto, productData, user.token) as ApiResponse;
      } else {
        response = await productsApi.create(productData, user.token) as ApiResponse;
      }

      if (response.success) {
        setShowProductForm(false);
        setSelectedProduct(null);
        setProductForm({
          nombre: '',
          descripcion: '',
          categoria: '',
          marca: '',
          id_sistema_talla: '',
          activo: true
        });
        loadProducts();
      } else {
        setError(response.message || 'Error al guardar producto');
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      setError('Error al guardar producto');
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      categoria: product.categoria || '',
      marca: product.marca || '',
      id_sistema_talla: product.id_sistema_talla?.toString() || '',
      activo: product.activo
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!user?.token) {
      setError('No hay token de autenticación');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        const response = await productsApi.delete(productId, user.token) as ApiResponse;
        if (response.success) {
          loadProducts();
        } else {
          setError(response.message || 'Error al eliminar producto');
        }
      } catch (error) {
        console.error('Error eliminando producto:', error);
        setError('Error al eliminar producto');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Productos</h2>
        <button
          onClick={() => {
            setSelectedProduct(null);
            setShowProductForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Nuevo Producto
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showProductForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={productForm.nombre}
                    onChange={(e) => setProductForm({...productForm, nombre: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={productForm.descripcion}
                    onChange={(e) => setProductForm({...productForm, descripcion: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <input
                      type="text"
                      value={productForm.categoria}
                      onChange={(e) => setProductForm({...productForm, categoria: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marca</label>
                    <input
                      type="text"
                      value={productForm.marca}
                      onChange={(e) => setProductForm({...productForm, marca: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sistema de Tallas</label>
                  <select
                    value={productForm.id_sistema_talla}
                    onChange={(e) => setProductForm({...productForm, id_sistema_talla: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Sin sistema de tallas</option>
                    {sizesSystems.map(system => (
                      <option key={system.id_sistema_talla} value={system.id_sistema_talla}>
                        {system.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={productForm.activo}
                    onChange={(e) => setProductForm({...productForm, activo: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                    Producto activo
                  </label>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setSelectedProduct(null);
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {selectedProduct ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {products.map((product) => (
            <li key={product.id_producto}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {product.nombre}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      {product.descripcion}
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-4">Categoría: {product.categoria || 'N/A'}</span>
                      <span className="mr-4">Marca: {product.marca || 'N/A'}</span>
                      <span className="mr-4">
                        Sistema de tallas: {product.sistema_talla_nombre || 'N/A'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Variantes: {product.variantes?.length || 0}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id_producto)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProductManagement;
