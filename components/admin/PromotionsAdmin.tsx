// PromotionsAdmin.tsx - Componente para administrar promociones

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Promotion {
  id_promocion: number;
  nombre: string;
  tipo: 'x_por_y' | 'porcentaje' | 'codigo';
  fecha_inicio: string;
  fecha_fin: string;
  uso_maximo: number | null;
  veces_usado: number;
  activo: boolean;
  cantidad_comprada?: number;
  cantidad_pagada?: number;
  porcentaje?: number;
  codigo?: string;
  descuento?: number;
  tipo_descuento?: 'porcentaje' | 'monto';
  applications?: Array<{
    tipo_objetivo: 'todos' | 'categoria' | 'producto';
    id_categoria?: string;
    id_producto?: number;
  }>;
}

interface PromotionsAdminProps {
  onClose?: () => void;
}

const PromotionsAdmin: React.FC<PromotionsAdminProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Función helper para obtener token
  const getAuthToken = () => {
    let token = user?.token;
    if (!token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        token = userData.token;
      }
    }
    return token;
  };

  // Función helper para hacer peticiones autenticadas
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'porcentaje' as 'x_por_y' | 'porcentaje' | 'codigo',
    fecha_inicio: '',
    fecha_fin: '',
    uso_maximo: '',
    activo: true,
    // Campos específicos
    cantidad_comprada: '',
    cantidad_pagada: '',
    porcentaje: '',
    codigo: '',
    descuento: '',
    tipo_descuento: 'porcentaje' as 'porcentaje' | 'monto',
    // Aplicaciones
    aplicacion_tipo: 'todos' as 'todos' | 'categoria' | 'producto',
    aplicacion_categoria: '',
    aplicacion_producto: ''
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

  const fetchPromotions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/promotions?page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setPromotions(data.data);
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      alert('Error al cargar las promociones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'porcentaje',
      fecha_inicio: '',
      fecha_fin: '',
      uso_maximo: '',
      activo: true,
      cantidad_comprada: '',
      cantidad_pagada: '',
      porcentaje: '',
      codigo: '',
      descuento: '',
      tipo_descuento: 'porcentaje',
      aplicacion_tipo: 'todos',
      aplicacion_categoria: '',
      aplicacion_producto: ''
    });
    setEditingPromotion(null);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      nombre: promotion.nombre,
      tipo: promotion.tipo,
      fecha_inicio: promotion.fecha_inicio.slice(0, 16), // Format for datetime-local
      fecha_fin: promotion.fecha_fin.slice(0, 16),
      uso_maximo: promotion.uso_maximo?.toString() || '',
      activo: promotion.activo,
      cantidad_comprada: promotion.cantidad_comprada?.toString() || '',
      cantidad_pagada: promotion.cantidad_pagada?.toString() || '',
      porcentaje: promotion.porcentaje?.toString() || '',
      codigo: promotion.codigo || '',
      descuento: promotion.descuento?.toString() || '',
      tipo_descuento: promotion.tipo_descuento || 'porcentaje',
      aplicacion_tipo: 'todos',
      aplicacion_categoria: '',
      aplicacion_producto: ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: any = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        uso_maximo: formData.uso_maximo ? parseInt(formData.uso_maximo) : null,
        activo: formData.activo
      };

      // Agregar campos específicos según el tipo
      if (formData.tipo === 'x_por_y') {
        payload.cantidad_comprada = parseInt(formData.cantidad_comprada);
        payload.cantidad_pagada = parseInt(formData.cantidad_pagada);
      } else if (formData.tipo === 'porcentaje') {
        payload.porcentaje = parseFloat(formData.porcentaje);
      } else if (formData.tipo === 'codigo') {
        payload.codigo = formData.codigo;
        payload.descuento = parseFloat(formData.descuento);
        payload.tipo_descuento = formData.tipo_descuento;
      }

      // Agregar aplicaciones
      payload.applications = [{
        tipo_objetivo: formData.aplicacion_tipo,
        id_categoria: formData.aplicacion_categoria || null,
        id_producto: formData.aplicacion_producto ? parseInt(formData.aplicacion_producto) : null
      }];

      const url = editingPromotion 
        ? `${API_BASE_URL}/api/admin/promotions/${editingPromotion.id_promocion}`
        : `${API_BASE_URL}/api/admin/promotions`;
      
      const method = editingPromotion ? 'PUT' : 'POST';
      
      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchPromotions(currentPage);
        setShowAddModal(false);
        resetForm();
        alert(editingPromotion ? 'Promoción actualizada exitosamente' : 'Promoción creada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la promoción');
    }
  };

  const handleDelete = async (promotionId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta promoción?')) return;

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/promotions/${promotionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPromotions(currentPage);
        alert('Promoción eliminada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la promoción');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPromotionDetails = (promo: Promotion) => {
    if (promo.tipo === 'x_por_y') {
      return `${promo.cantidad_comprada}x${promo.cantidad_pagada}`;
    } else if (promo.tipo === 'porcentaje') {
      return `${promo.porcentaje}% descuento`;
    } else if (promo.tipo === 'codigo') {
      return `Código: ${promo.codigo} (${promo.descuento}${promo.tipo_descuento === 'porcentaje' ? '%' : ' MXN'})`;
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Cargando promociones...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Promociones</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Crear Nueva Promoción
        </button>
      </div>

      {/* Promotions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detalles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uso
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
            {promotions.map(promo => (
              <tr key={promo.id_promocion}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{promo.nombre}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    promo.tipo === 'x_por_y' ? 'bg-blue-100 text-blue-800' :
                    promo.tipo === 'porcentaje' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {promo.tipo === 'x_por_y' ? 'X por Y' : 
                     promo.tipo === 'porcentaje' ? 'Porcentaje' : 'Código'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPromotionDetails(promo)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{formatDate(promo.fecha_inicio)}</div>
                  <div>→ {formatDate(promo.fecha_fin)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {promo.veces_usado} / {promo.uso_maximo || '∞'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    promo.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {promo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(promo)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id_promocion)}
                    className="text-red-600 hover:text-red-900"
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchPromotions(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingPromotion ? 'Editar Promoción' : 'Crear Nueva Promoción'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="porcentaje">Porcentaje</option>
                    <option value="x_por_y">X por Y</option>
                    <option value="codigo">Código</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              {/* Campos específicos según el tipo */}
              {formData.tipo === 'x_por_y' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Comprada *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cantidad_comprada}
                      onChange={(e) => setFormData({...formData, cantidad_comprada: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Pagada *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cantidad_pagada}
                      onChange={(e) => setFormData({...formData, cantidad_pagada: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>
              )}

              {formData.tipo === 'porcentaje' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porcentaje de Descuento * (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    value={formData.porcentaje}
                    onChange={(e) => setFormData({...formData, porcentaje: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              )}

              {formData.tipo === 'codigo' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descuento *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.descuento}
                      onChange={(e) => setFormData({...formData, descuento: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.tipo_descuento}
                      onChange={(e) => setFormData({...formData, tipo_descuento: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    >
                      <option value="porcentaje">Porcentaje</option>
                      <option value="monto">Monto Fijo</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uso Máximo
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.uso_maximo}
                    onChange={(e) => setFormData({...formData, uso_maximo: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ilimitado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aplicar a
                  </label>
                  <select
                    value={formData.aplicacion_tipo}
                    onChange={(e) => setFormData({...formData, aplicacion_tipo: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="todos">Todos los productos</option>
                    <option value="categoria">Categoría específica</option>
                    <option value="producto">Producto específico</option>
                  </select>
                </div>
              </div>

              {formData.aplicacion_tipo === 'categoria' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.aplicacion_categoria}
                    onChange={(e) => setFormData({...formData, aplicacion_categoria: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Camisetas, Pantalones, etc."
                  />
                </div>
              )}

              {formData.aplicacion_tipo === 'producto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID del Producto
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.aplicacion_producto}
                    onChange={(e) => setFormData({...formData, aplicacion_producto: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Promoción activa
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPromotion ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsAdmin;
