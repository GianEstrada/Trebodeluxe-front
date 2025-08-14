// OrdersAdmin.tsx - Componente para gestión administrativa de pedidos

import React, { useState, useEffect } from 'react';

// Función helper para obtener el token de administrador
const getAdminToken = (): string | null => {
  try {
    // Primero intentar obtener adminToken directo
    const directToken = localStorage.getItem('adminToken');
    if (directToken) return directToken;
    
    // Si no existe, obtener del usuario autenticado
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Verificar que sea un usuario admin y tenga token
      if (user.rol === 'admin' && user.token) {
        return user.token;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting admin token:', error);
    return null;
  }
};

interface OrderDetail {
  id_detalle: number;
  id_producto: number;
  id_variante: number;
  id_talla: number;
  cantidad: number;
  precio_unitario: number;
  producto_nombre: string;
  variante_nombre: string;
  nombre_talla: string;
}

interface Order {
  id_pedido: number;
  fecha_creacion: string;
  estado: string;
  total: number;
  notas: string;
  cliente_nombres: string;
  cliente_apellidos: string;
  cliente_correo: string;
  direccion_nombre: string;
  direccion_telefono: string;
  direccion_ciudad: string;
  direccion_estado: string;
  metodo_envio_nombre: string;
  metodo_pago_nombre: string;
  total_items: number;
  detalles?: OrderDetail[];
}

interface OrderStats {
  total_pedidos: number;
  no_revisado: number;
  en_proceso: number;
  preparado: number;
  enviado: number;
  listo: number;
  ingresos_totales: number;
  ticket_promedio: number;
  pedidos_hoy: number;
  pedidos_semana: number;
}

const ESTADOS_PEDIDO = [
  { value: 'no_revisado', label: 'No Revisado', color: 'bg-gray-100 text-gray-800' },
  { value: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  { value: 'preparado', label: 'Preparado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'enviado', label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  { value: 'listo', label: 'Listo', color: 'bg-green-100 text-green-800' }
];

const OrdersAdmin: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Estados para filtros y búsqueda
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    sort_by: 'fecha_creacion',
    sort_order: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10
  });

  // Estados para actualización de pedidos
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    estado: '',
    notas: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const token = getAdminToken();
      if (!token) {
        console.error('No admin token found - user must be logged in as admin');
        return;
      }

      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/admin/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getAdminToken();
      if (!token) {
        console.error('No admin token found - user must be logged in as admin');
        return;
      }

      const response = await fetch('https://trebodeluxe-backend.onrender.com/api/admin/orders/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const token = getAdminToken();
      if (!token) {
        console.error('No admin token found - user must be logged in as admin');
        return;
      }

      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedOrder(data.data);
        setUpdateForm({
          estado: data.data.estado,
          notas: data.data.notas || ''
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setUpdating(true);
      const token = getAdminToken();
      if (!token) {
        console.error('No admin token found - user must be logged in as admin');
        return;
      }

      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/admin/orders/${selectedOrder.id_pedido}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar el pedido en la lista
        setOrders(orders.map(order => 
          order.id_pedido === selectedOrder.id_pedido 
            ? { ...order, ...updateForm }
            : order
        ));
        
        setShowModal(false);
        fetchStats(); // Actualizar estadísticas
        alert('Pedido actualizado correctamente');
      } else {
        alert('Error al actualizar el pedido: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el pedido');
    } finally {
      setUpdating(false);
    }
  };

  const getEstadoStyle = (estado: string) => {
    const estadoConfig = ESTADOS_PEDIDO.find(e => e.value === estado);
    return estadoConfig ? estadoConfig.color : 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión de Pedidos</h1>

      {/* Estadísticas */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600">Total Pedidos</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total_pedidos}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600">No Revisado</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.no_revisado}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600">En Proceso</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.en_proceso}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-600">Preparado</h3>
              <p className="text-2xl font-bold text-yellow-900">{stats.preparado}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-600">Enviado</h3>
              <p className="text-2xl font-bold text-purple-900">{stats.enviado}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600">Listo</h3>
              <p className="text-2xl font-bold text-green-900">{stats.listo}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-emerald-600">Ingresos Totales</h3>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(parseFloat(stats.ingresos_totales.toString()))}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-indigo-600">Pedidos Hoy</h3>
              <p className="text-2xl font-bold text-indigo-900">{stats.pedidos_hoy}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-pink-600">Pedidos Semana</h3>
              <p className="text-2xl font-bold text-pink-900">{stats.pedidos_semana}</p>
            </div>
          </div>
        </>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Buscar</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              placeholder="ID, nombre o correo del cliente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_PEDIDO.map(estado => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Desde</label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Hasta</label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total / Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Envío / Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id_pedido} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{order.id_pedido}</div>
                        <div className="text-sm text-gray-500">{formatDate(order.fecha_creacion)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.cliente_nombres} {order.cliente_apellidos}
                        </div>
                        <div className="text-sm text-gray-500">{order.cliente_correo}</div>
                        <div className="text-sm text-gray-500">{order.direccion_ciudad}, {order.direccion_estado}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoStyle(order.estado)}`}>
                          {ESTADOS_PEDIDO.find(e => e.value === order.estado)?.label || order.estado}
                        </span>
                        <button
                          onClick={() => fetchOrderDetails(order.id_pedido)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Cambiar estado"
                        >
                          📝
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</div>
                        <div className="text-sm text-gray-500">{order.total_items} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{order.metodo_envio_nombre}</div>
                        <div className="text-sm text-gray-500">{order.metodo_pago_nombre}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => fetchOrderDetails(order.id_pedido)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {pagination.currentPage} de {pagination.totalPages} ({pagination.totalRecords} total)
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page + 1) })}
                disabled={pagination.currentPage === pagination.totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles del pedido */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Gestionar Pedido #{selectedOrder.id_pedido}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Información del cliente */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Información del Cliente</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Nombre:</strong> {selectedOrder.cliente_nombres} {selectedOrder.cliente_apellidos}</p>
                  <p><strong>Email:</strong> {selectedOrder.cliente_correo}</p>
                  <p><strong>Dirección:</strong> {selectedOrder.direccion_nombre}</p>
                  <p><strong>Teléfono:</strong> {selectedOrder.direccion_telefono}</p>
                  <p><strong>Ciudad:</strong> {selectedOrder.direccion_ciudad}, {selectedOrder.direccion_estado}</p>
                </div>
              </div>

              {/* Detalles del pedido */}
              {selectedOrder.detalles && selectedOrder.detalles.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Productos del Pedido</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Variante</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.detalles.map((detalle) => (
                          <tr key={detalle.id_detalle}>
                            <td className="px-4 py-2 text-sm text-gray-900">{detalle.producto_nombre}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{detalle.variante_nombre}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{detalle.nombre_talla}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{detalle.cantidad}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(detalle.precio_unitario)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(detalle.precio_unitario * detalle.cantidad)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Formulario de actualización */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Actualizar Pedido</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Estado del Pedido</label>
                    <select
                      value={updateForm.estado}
                      onChange={(e) => setUpdateForm({ ...updateForm, estado: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ESTADOS_PEDIDO.map(estado => (
                        <option key={estado.value} value={estado.value}>{estado.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Notas Administrativas</label>
                    <textarea
                      value={updateForm.notas}
                      onChange={(e) => setUpdateForm({ ...updateForm, notas: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Agregar notas sobre el estado del pedido..."
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Actualizando...' : 'Actualizar Pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersAdmin;
