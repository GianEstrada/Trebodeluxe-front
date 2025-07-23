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

// Headers con autenticación
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
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
        id_producto,
        id_variante,
        id_talla,
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
export const updateCartItem = async (id_detalle, cantidad) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id_detalle,
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
export const removeFromCart = async (id_detalle) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/remove/${id_detalle}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
