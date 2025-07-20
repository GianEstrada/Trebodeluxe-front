// components/admin/PromotionManagement.tsx - Componente para gestión de promociones

import React, { useState, useEffect } from 'react';
import { promotionsApi } from '../../utils/promotionsApi.js';
import { productsApi } from '../../utils/productsApi.js';
import { useAuth } from '../../contexts/AuthContext';

// Interfaces para respuestas de API
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  promotions?: Promotion[];
  products?: Product[];
  error?: string;
}

interface Promotion {
  id_promocion: number;
  nombre: string;
  descripcion?: string;
  tipo: string; // 'x_por_y' | 'porcentaje' | 'codigo'
  valor_descuento?: number;
  codigo?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  activo: boolean;
  usa_fecha_fin: boolean;
  productos_aplicables?: number;
}

interface Product {
  id_producto: number;
  nombre: string;
  categoria?: string;
  marca?: string;
}

const PromotionManagement: React.FC = () => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulario de promoción
  const [promotionForm, setPromotionForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'porcentaje',
    valor_descuento: '',
    codigo: '',
    fecha_inicio: '',
    fecha_fin: '',
    usa_fecha_fin: false,
    activo: true
  });

  useEffect(() => {
    if (user?.token) {
      loadPromotions();
      loadProducts();
    }
  }, [user]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionsApi.getAllForAdmin(user?.token) as ApiResponse<Promotion[]>;
      if (response.success && response.promotions) {
        setPromotions(response.promotions);
      } else if (response.data && Array.isArray(response.data)) {
        setPromotions(response.data);
      }
    } catch (error) {
      console.error('Error cargando promociones:', error);
      setError('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll() as ApiResponse<Product[]>;
      if (response.success && response.products) {
        setProducts(response.products);
      } else if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.token) {
      setError('No hay token de autenticación');
      return;
    }
    
    try {
      const promotionData = {
        ...promotionForm,
        valor_descuento: promotionForm.valor_descuento ? parseFloat(promotionForm.valor_descuento) : null,
        fecha_fin: promotionForm.usa_fecha_fin ? promotionForm.fecha_fin : null
      };

      let response: ApiResponse;
      if (selectedPromotion) {
        response = await promotionsApi.update(selectedPromotion.id_promocion, promotionData, user.token) as ApiResponse;
      } else {
        response = await promotionsApi.create(promotionData, user.token) as ApiResponse;
      }

      if (response.success) {
        setShowPromotionForm(false);
        setSelectedPromotion(null);
        setPromotionForm({
          nombre: '',
          descripcion: '',
          tipo: 'porcentaje',
          valor_descuento: '',
          codigo: '',
          fecha_inicio: '',
          fecha_fin: '',
          usa_fecha_fin: false,
          activo: true
        });
        loadPromotions();
      } else {
        setError(response.message || 'Error al guardar promoción');
      }
    } catch (error) {
      console.error('Error guardando promoción:', error);
      setError('Error al guardar promoción');
    }
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setPromotionForm({
      nombre: promotion.nombre,
      descripcion: promotion.descripcion || '',
      tipo: promotion.tipo,
      valor_descuento: promotion.valor_descuento?.toString() || '',
      codigo: promotion.codigo || '',
      fecha_inicio: promotion.fecha_inicio ? promotion.fecha_inicio.split('T')[0] : '',
      fecha_fin: promotion.fecha_fin ? promotion.fecha_fin.split('T')[0] : '',
      usa_fecha_fin: promotion.usa_fecha_fin,
      activo: promotion.activo
    });
    setShowPromotionForm(true);
  };

  const handleDeletePromotion = async (promotionId: number) => {
    if (!user?.token) {
      setError('No hay token de autenticación');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar esta promoción?')) {
      try {
        const response = await promotionsApi.delete(promotionId, user.token) as ApiResponse;
        if (response.success) {
          loadPromotions();
        } else {
          setError(response.message || 'Error al eliminar promoción');
        }
      } catch (error) {
        console.error('Error eliminando promoción:', error);
        setError('Error al eliminar promoción');
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'x_por_y': return 'X por Y';
      case 'porcentaje': return 'Porcentaje';
      case 'codigo': return 'Código';
      default: return type;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestión de Promociones</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => {
            setSelectedPromotion(null);
            setPromotionForm({
              nombre: '',
              descripcion: '',
              tipo: 'porcentaje',
              valor_descuento: '',
              codigo: '',
              fecha_inicio: '',
              fecha_fin: '',
              usa_fecha_fin: false,
              activo: true
            });
            setShowPromotionForm(true);
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Agregar Promoción
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descuento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Periodo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {promotions.map((promotion) => (
              <tr key={promotion.id_promocion}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{promotion.nombre}</div>
                  {promotion.descripcion && (
                    <div className="text-sm text-gray-500">{promotion.descripcion}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPromotionTypeLabel(promotion.tipo)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {promotion.valor_descuento ? `${promotion.valor_descuento}%` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {promotion.codigo || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Desde: {formatDate(promotion.fecha_inicio)}</div>
                  {promotion.fecha_fin && (
                    <div>Hasta: {formatDate(promotion.fecha_fin)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    promotion.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {promotion.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditPromotion(promotion)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeletePromotion(promotion.id_promocion)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para Promociones */}
      {showPromotionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedPromotion ? 'Editar Promoción' : 'Agregar Promoción'}
            </h3>
            <form onSubmit={handlePromotionSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={promotionForm.nombre}
                  onChange={(e) => setPromotionForm({...promotionForm, nombre: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Descripción
                </label>
                <textarea
                  value={promotionForm.descripcion}
                  onChange={(e) => setPromotionForm({...promotionForm, descripcion: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Tipo *
                </label>
                <select
                  value={promotionForm.tipo}
                  onChange={(e) => setPromotionForm({...promotionForm, tipo: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="porcentaje">Descuento Porcentaje</option>
                  <option value="x_por_y">X por Y</option>
                  <option value="codigo">Código de Descuento</option>
                </select>
              </div>
              
              {promotionForm.tipo === 'porcentaje' && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Porcentaje de Descuento *
                  </label>
                  <input
                    type="number"
                    value={promotionForm.valor_descuento}
                    onChange={(e) => setPromotionForm({...promotionForm, valor_descuento: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              )}
              
              {promotionForm.tipo === 'codigo' && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={promotionForm.codigo}
                    onChange={(e) => setPromotionForm({...promotionForm, codigo: e.target.value.toUpperCase()})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={promotionForm.fecha_inicio}
                  onChange={(e) => setPromotionForm({...promotionForm, fecha_inicio: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={promotionForm.usa_fecha_fin}
                    onChange={(e) => setPromotionForm({...promotionForm, usa_fecha_fin: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Tiene fecha de fin</span>
                </label>
              </div>
              
              {promotionForm.usa_fecha_fin && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={promotionForm.fecha_fin}
                    onChange={(e) => setPromotionForm({...promotionForm, fecha_fin: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              )}
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={promotionForm.activo}
                    onChange={(e) => setPromotionForm({...promotionForm, activo: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPromotionForm(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {selectedPromotion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionManagement;
