// utils/cartApi.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

// Verificar si el usuario está logueado
const isUserLoggedIn = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        return !!(userData.token && userData.id_usuario);
      }
    } catch (error) {
      console.error('❌ [CARTAPI] Error verificando usuario logueado:', error);
    }
  }
  return false;
};

// Obtener token de autenticación (simplificado)
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        return userData.token || null;
      }
    } catch (error) {
      console.error('❌ [CARTAPI] Error obteniendo token:', error);
    }
  }
  return null;
};

// Obtener o generar token de sesión para usuarios no autenticados
export const getOrCreateSessionToken = () => {
  if (typeof window !== 'undefined') {
    let sessionToken = localStorage.getItem('session-token');
    
    if (!sessionToken) {
      // Generar nuevo token de sesión
      sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('session-token', sessionToken);
    }
    
    return sessionToken;
  }
  return null;
};

// Headers con autenticación simplificada
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // LÓGICA SIMPLIFICADA:
  // 1. Si hay usuario en localStorage -> Usar Authorization header
  // 2. Si NO hay usuario -> Usar session token
  
  const userLoggedIn = isUserLoggedIn();
  console.log('🔍 [CARTAPI] Estado de autenticación:', userLoggedIn ? 'USUARIO LOGUEADO' : 'USUARIO ANÓNIMO');
  
  if (userLoggedIn) {
    const token = getAuthToken();
    console.log('🔍 [CARTAPI] Token obtenido:', token ? 'PRESENTE' : 'AUSENTE');
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ [CARTAPI] Authorization header agregado correctamente');
      console.log('🔍 [CARTAPI] Header Authorization:', headers['Authorization'] ? 'SET' : 'NOT SET');
    } else {
      console.warn('⚠️ [CARTAPI] Usuario detectado pero sin token válido');
    }
  } else {
    const sessionToken = getOrCreateSessionToken();
    headers['X-Session-Token'] = sessionToken;
    console.log('✅ [CARTAPI] Usando Session-Token para usuario anónimo');
  }
  
  // Debug final de headers
  console.log('🔍 [CARTAPI] Headers finales que se enviarán:', Object.keys(headers));
  
  return headers;
};

// Obtener carrito activo
export const getActiveCart = async () => {
  try {
    console.log('🛒 [CARTAPI] getActiveCart called');
    
    const headers = getAuthHeaders();
    const url = `${API_BASE_URL}/api/cart`;
    
    console.log('🔍 [CARTAPI] Making request to:', url);
    console.log('🔍 [CARTAPI] Request headers:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('🔍 [CARTAPI] Response status:', response.status);
    
    const data = await response.json();
    
    console.log('🔍 [CARTAPI] Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Error al obtener el carrito');
    }

    return data;
  } catch (error) {
    console.error('❌ [CARTAPI] Error getting active cart:', error);
    throw error;
  }
};

// Agregar producto al carrito
export const addToCart = async (productData) => {
  try {
    const { id_producto, id_variante, id_talla, cantidad, precio_unitario } = productData;
    
    console.log('🛒 [CARTAPI] addToCart called with:', {
      id_producto,
      id_variante,
      id_talla,
      cantidad,
      precio_unitario
    });
    
    // Obtener headers de autenticación
    const headers = getAuthHeaders();
    const url = `${API_BASE_URL}/api/cart/add`;
    
    console.log('🔍 [CARTAPI] Making request to:', url);
    console.log('🔍 [CARTAPI] Request headers:', headers);
    
    // Verificar específicamente si Authorization header está presente
    if (headers['Authorization']) {
      console.log('✅ [CARTAPI] Authorization header CONFIRMADO presente');
    } else if (headers['X-Session-Token']) {
      console.log('✅ [CARTAPI] Session-Token header presente');
    } else {
      console.warn('⚠️ [CARTAPI] NINGÚN header de autenticación presente');
    }
    
    const requestOptions = {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productId: id_producto,
        variantId: id_variante,
        tallaId: id_talla,
        cantidad,
        precio_unitario
      }),
    };
    
    console.log('🔍 [CARTAPI] Opciones de request completas:', {
      method: requestOptions.method,
      url: url,
      hasBody: !!requestOptions.body,
      headerKeys: Object.keys(requestOptions.headers)
    });
    
    const response = await fetch(url, requestOptions);

    console.log('🔍 [CARTAPI] Response status:', response.status);
    
    const data = await response.json();
    
    console.log('🔍 [CARTAPI] Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al agregar al carrito');
    }

    return data;
  } catch (error) {
    console.error('❌ [CARTAPI] Error adding to cart:', error);
    throw error;
  }
};

// Actualizar cantidad de un item en el carrito
export const updateCartItem = async (updateData) => {
  try {
    const { productId, variantId, tallaId, cantidad } = updateData;
    
    const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        productId,
        variantId,
        tallaId,
        cantidad
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al actualizar el carrito');
    }

    return data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

// Eliminar item del carrito
export const removeFromCart = async (removeData) => {
  try {
    const { productId, variantId, tallaId } = removeData;
    
    const response = await fetch(`${API_BASE_URL}/api/cart/remove`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        productId,
        variantId,
        tallaId
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al eliminar del carrito');
    }

    return data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

// Limpiar carrito completo
export const clearCart = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al limpiar el carrito');
    }

    return data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Cargar carrito del usuario autenticado (sin migrar carrito anónimo)
export const migrateCartToUser = async () => {
  try {
    console.log('🔄 [CARTAPI] Cargando carrito del usuario autenticado...');
    
    // Simplemente obtener el carrito del usuario desde BD
    // El backend filtra automáticamente por usuario autenticado
    const response = await getActiveCart();
    
    console.log('✅ [CARTAPI] Carrito del usuario cargado (sustituye carrito anónimo):', response);
    return response;
  } catch (error) {
    console.error('❌ [CARTAPI] Error cargando carrito del usuario:', error);
    throw error;
  }
};

// Función para limpiar carrito en frontend (logout)
export const clearCartOnLogout = () => {
  console.log('🧹 [CARTAPI] Limpiando carrito en frontend (logout)');
  // No hacemos nada con BD, solo notificamos que se debe limpiar el frontend
  // El carrito del usuario permanece en BD para futuras sesiones
  return Promise.resolve();
};
