// OrdersAdmin.tsx - Componente para gestión administrativa de pedidos
// Updated: 2025-08-15 - Fixed token authentication

import React, { useState, useEffect } from 'react';

// Función helper para obtener el token de administrador
const getAdminToken = (): string | null => {
  try {
    // Primero intentar obtener adminToken directo
    const directToken = localStorage.getItem('adminToken');
    if (directToken) {
      console.log('🔑 Using direct adminToken');
      return directToken;
    }
    
    // Si no existe, obtener del usuario autenticado
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('👤 User found in localStorage:', { usuario: user.usuario, rol: user.rol, hasToken: !!user.token });
      // Verificar que sea un usuario admin y tenga token
      if (user.rol === 'admin' && user.token) {
        console.log('✅ Using token from authenticated admin user');
        return user.token;
      } else {
        console.warn('❌ User is not admin or missing token:', { rol: user.rol, hasToken: !!user.token });
      }
    } else {
      console.warn('❌ No user found in localStorage');
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting admin token:', error);
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
  numero_referencia: string;
  skydropx_order_id: string;
  stripe_payment_intent_id: string;
  fecha_creacion: string;
  estado: string;
  total: number;
  costo_envio: number;
  seguro_envio: boolean;
  notas: string;
  cliente_nombres: string;
  cliente_apellidos: string;
  cliente_correo: string;
  direccion_nombre: string;
  direccion_telefono: string;
  direccion_ciudad: string;
  direccion_estado: string;
  direccion_calle: string;
  direccion_colonia: string;
  direccion_codigo_postal: string;
  direccion_referencia: string;
  metodo_envio_nombre: string;
  metodo_pago_nombre: string;
  total_items: number;
  detalles?: OrderDetail[];
}

interface OrderStats {
  total_pedidos: number;
  procesando: number;
  preparado: number;
  enviado: number;
  completado: number;
  cancelado: number;
  ingresos_totales: number;
  ticket_promedio: number;
  pedidos_hoy: number;
  pedidos_semana: number;
}

const ESTADOS_PEDIDO = [
  { value: 'procesando', label: 'Procesando', color: 'bg-blue-100 text-blue-800' },
  { value: 'preparado', label: 'Preparado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'enviado', label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  { value: 'completado', label: 'Completado', color: 'bg-green-100 text-green-800' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
];

const OrdersAdmin: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  
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
    console.log('🔍 Fetching order details for ID:', orderId);
    try {
      const token = getAdminToken();
      if (!token) {
        console.error('❌ No admin token found - user must be logged in as admin');
        alert('No se encontró token de autenticación. Por favor, inicia sesión como administrador.');
        return;
      }
      console.log('✅ Token found, making request');

      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📄 Response data:', data);
      
      if (data.success) {
        console.log('✅ Setting selected order and showing modal');
        setSelectedOrder(data.data);
        setUpdateForm({
          estado: data.data.estado,
          notas: data.data.notas || ''
        });
        setShowModal(true);
      } else {
        console.error('❌ API returned success: false', data);
        alert(`Error: ${data.message || 'No se pudo cargar el pedido'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      alert('Error al cargar los detalles del pedido');
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

  // Función para alternar expansión de orden
  const toggleOrderExpansion = async (orderId: number) => {
    const newExpandedOrders = new Set(expandedOrders);
    
    if (expandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
      // Si no tiene detalles cargados, cargarlos
      const order = orders.find(o => o.id_pedido === orderId);
      if (order && !order.detalles) {
        await loadOrderDetails(orderId);
      }
    }
    
    setExpandedOrders(newExpandedOrders);
  };

  // Función para cargar detalles de orden sin modal
  const loadOrderDetails = async (orderId: number) => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar la orden con los detalles cargados
        setOrders(orders.map(order => 
          order.id_pedido === orderId 
            ? { ...order, detalles: data.data.detalles }
            : order
        ));
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión de Pedidos</h1>

      {/* Estadísticas */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600">Total Pedidos</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total_pedidos}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600">Procesando</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.procesando || 0}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-600">Preparado</h3>
              <p className="text-2xl font-bold text-yellow-900">{stats.preparado || 0}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-600">Enviado</h3>
              <p className="text-2xl font-bold text-purple-900">{stats.enviado || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600">Completado</h3>
              <p className="text-2xl font-bold text-green-900">{stats.completado || 0}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          <table className="min-w-full divide-y divide-gray-200 table-fixed"
                 style={{ width: '100%' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Ver
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Pedido & IDs
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Cliente & Contacto
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Estado & Fecha
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Total & Items
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Envío & Seguro
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Pago & Métodos
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <React.Fragment key={order.id_pedido}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-2 py-3 whitespace-nowrap">
                        <button
                          onClick={() => toggleOrderExpansion(order.id_pedido)}
                          className="text-blue-600 hover:text-blue-800 focus:outline-none text-lg"
                          title="Ver detalles"
                        >
                          {expandedOrders.has(order.id_pedido) ? '🔽' : '▶️'}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{order.id_pedido}</div>
                          <div className="text-xs text-blue-600 truncate">SKY: {order.skydropx_order_id || 'N/A'}</div>
                          <div className="text-xs text-purple-600 truncate">STR: {order.stripe_payment_intent_id || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {order.cliente_nombres} {order.cliente_apellidos}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{order.cliente_correo}</div>
                          <div className="text-xs text-gray-500">{order.direccion_telefono || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
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
                          <div className="text-xs text-gray-500">{formatDate(order.fecha_creacion)}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</div>
                          <div className="text-xs text-gray-500">{order.total_items} items</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(order.costo_envio || 0)}</div>
                          <div className="text-xs text-gray-600">{order.metodo_envio_nombre}</div>
                          <div className="flex items-center mt-1">
                            {order.seguro_envio ? (
                              <span className="text-green-600 text-xs">✅ Seguro</span>
                            ) : (
                              <span className="text-gray-400 text-xs">❌ Sin seguro</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <div className="text-sm text-gray-900">{order.metodo_pago_nombre}</div>
                          <div className="text-xs text-gray-500">Pago online</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => fetchOrderDetails(order.id_pedido)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                    
                    {/* Fila expandida con detalles */}
                    {expandedOrders.has(order.id_pedido) && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="space-y-4">
                            {/* Información de la orden */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <h4 className="font-semibold text-gray-700 mb-2">📦 Información de Envío</h4>
                                <p className="text-sm"><strong>Nombre:</strong> {order.direccion_nombre}</p>
                                <p className="text-sm"><strong>Teléfono:</strong> {order.direccion_telefono}</p>
                                <p className="text-sm"><strong>Ciudad:</strong> {order.direccion_ciudad}</p>
                                <p className="text-sm"><strong>Estado:</strong> {order.direccion_estado}</p>
                                <p className="text-sm"><strong>Método:</strong> {order.metodo_envio_nombre}</p>
                                <p className="text-sm"><strong>Costo:</strong> {formatCurrency(order.costo_envio || 0)}</p>
                                <p className="text-sm"><strong>Seguro:</strong> 
                                  <span className={order.seguro_envio ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                    {order.seguro_envio ? '✅ Incluido' : '❌ No incluido'}
                                  </span>
                                </p>
                              </div>
                              
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <h4 className="font-semibold text-gray-700 mb-2">� Dirección Completa</h4>
                                <p className="text-sm"><strong>Calle:</strong> {order.direccion_calle || 'N/A'}</p>
                                <p className="text-sm"><strong>Colonia:</strong> {order.direccion_colonia || 'N/A'}</p>
                                <p className="text-sm"><strong>CP:</strong> {order.direccion_codigo_postal || 'N/A'}</p>
                                <p className="text-sm"><strong>Referencias:</strong> {order.direccion_referencia || 'Sin referencias'}</p>
                              </div>
                              
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <h4 className="font-semibold text-gray-700 mb-2">�💳 Información de Pago</h4>
                                <p className="text-sm"><strong>Método:</strong> {order.metodo_pago_nombre}</p>
                                <p className="text-sm"><strong>Total:</strong> {formatCurrency(order.total)}</p>
                                <p className="text-sm"><strong>Estado:</strong> {order.estado}</p>
                                <p className="text-sm"><strong>Items:</strong> {order.total_items}</p>
                              </div>
                              
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <h4 className="font-semibold text-gray-700 mb-2">📝 Información Adicional</h4>
                                <p className="text-sm"><strong>Cliente:</strong> {order.cliente_nombres} {order.cliente_apellidos}</p>
                                <p className="text-sm"><strong>Email:</strong> {order.cliente_correo}</p>
                                <p className="text-sm"><strong>Fecha:</strong> {formatDate(order.fecha_creacion)}</p>
                                <p className="text-sm"><strong>SkyDropX ID:</strong> 
                                  <span className="text-blue-600 ml-1">{order.skydropx_order_id || 'N/A'}</span>
                                </p>
                                <p className="text-sm"><strong>Stripe ID:</strong> 
                                  <span className="text-purple-600 ml-1">{order.stripe_payment_intent_id || 'N/A'}</span>
                                </p>
                                <p className="text-sm"><strong>Ref. Núm.:</strong> {order.numero_referencia || 'N/A'}</p>
                                <p className="text-sm"><strong>Notas:</strong> {order.notas || 'Sin notas'}</p>
                              </div>
                            </div>
                            
                            {/* Detalles de productos */}
                            {order.detalles && order.detalles.length > 0 ? (
                              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <h4 className="font-semibold text-gray-700 p-3 bg-gray-100">🛍️ Productos del Pedido</h4>
                                <div className="overflow-x-auto">
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
                                      {order.detalles.map((detalle) => (
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
                            ) : (
                              <div className="bg-white p-4 rounded-lg shadow-sm text-center text-gray-500">
                                {expandedOrders.has(order.id_pedido) ? 'Cargando detalles...' : 'Haz clic en el botón expandir para ver los detalles'}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
