// utils/cartApi.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

// Obtener token de autenticación
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        return userData.token;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
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

// Headers con autenticación y token de sesión
const getAuthHeaders = () => {
  const token = getAuthToken();
  const sessionToken = getOrCreateSessionToken();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }
  
  return headers;
};

// Obtener carrito activo
export const getActiveCart = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al obtener el carrito');
    }

    return data;
  } catch (error) {
    console.error('Error getting active cart:', error);
    throw error;
  }
};

// Agregar producto al carrito
export const addToCart = async (productData) => {
  try {
    const { id_producto, id_variante, id_talla, cantidad, precio_unitario } = productData;
    
    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        productId: id_producto,
        variantId: id_variante,
        tallaId: id_talla,
        cantidad,
        precio_unitario
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al agregar al carrito');
    }

    return data;
  } catch (error) {
    console.error('Error adding to cart:', error);
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
