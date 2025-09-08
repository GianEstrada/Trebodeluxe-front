// utils/cartApi.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

// Obtener token de autenticación
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('user');
      console.log('🔍 [CARTAPI] Verificando localStorage para usuario:', savedUser ? 'ENCONTRADO' : 'NO ENCONTRADO');
      
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('🔍 [CARTAPI] Datos del usuario:', {
          hasToken: !!userData.token,
          tokenLength: userData.token ? userData.token.length : 0,
          userId: userData.id_usuario,
          userRole: userData.rol
        });
        
        // Verificar que el token existe y no está vacío
        if (userData.token && userData.token.length > 0) {
          console.log('✅ [CARTAPI] Token válido encontrado para usuario logueado');
          return userData.token;
        } else {
          console.warn('⚠️ [CARTAPI] Usuario encontrado pero sin token válido');
        }
      }
    } catch (error) {
      console.error('❌ [CARTAPI] Error al obtener token de autenticación:', error);
    }
  }
  
  console.log('🔍 [CARTAPI] No hay token de autenticación disponible');
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

// Headers con autenticación y token de sesión
const getAuthHeaders = () => {
  const token = getAuthToken();
  const sessionToken = getOrCreateSessionToken();
  
  console.log('🔍 [CARTAPI] getAuthHeaders - verificando autenticación:', {
    hasAuthToken: !!token,
    hasSessionToken: !!sessionToken,
    authTokenPreview: token ? token.substring(0, 10) + '...' : 'none',
    sessionTokenPreview: sessionToken ? sessionToken.substring(0, 10) + '...' : 'none'
  });
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // LÓGICA DE PRIORIZACIÓN:
  // 1. Si hay token de autenticación (usuario logueado) -> usar Authorization header
  // 2. Si NO hay token de autenticación -> usar session token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('✅ [CARTAPI] Usuario LOGUEADO - usando Authorization header');
    console.log('🔍 [CARTAPI] Authorization header configurado correctamente');
  } else {
    headers['X-Session-Token'] = sessionToken;
    console.log('✅ [CARTAPI] Usuario ANÓNIMO - usando Session-Token header');
  }
  
  // Debug: mostrar headers finales (sin el token completo por seguridad)
  const debugHeaders = { ...headers };
  if (debugHeaders['Authorization']) {
    debugHeaders['Authorization'] = 'Bearer [TOKEN_PRESENTE]';
  }
  console.log('🔍 [CARTAPI] Headers finales:', debugHeaders);
  
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

// Migrar carrito de usuario a token de sesión (para logout)
export const migrateCartToSession = async (sessionToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/migrate-to-session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        sessionToken
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al migrar el carrito');
    }

    return data;
  } catch (error) {
    console.error('Error migrating cart to session:', error);
    throw error;
  }
};
