// utils/newCartApi.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

interface AddToCartRequest {
  productId: number;
  variantId: number;
  tallaId: number;
  cantidad: number;
}

interface UpdateQuantityRequest {
  productId: number;
  variantId: number;
  tallaId: number;
  cantidad: number;
}

interface RemoveFromCartRequest {
  productId: number;
  variantId: number;
  tallaId: number;
}

interface CartResponse {
  success: boolean;
  cart: {
    id: number;
    items: CartItem[];
    totalItems: number;
    totalOriginal: number;
    totalFinal: number;
    totalDescuento: number;
    tieneDescuentos: boolean;
  };
  sessionToken?: string;
  message?: string;
}

interface CartItem {
  id_contenido: number;
  id_carrito: number;
  cantidad: number;
  fecha_agregado: string;
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  id_variante: number;
  nombre_variante: string;
  id_talla: number;
  nombre_talla: string;
  sistema_talla: string;
  precio: number;
  stock_disponible: number;
  imagen_variante: string;
  precio_total_item: number;
  precio_final_item: number;
  tiene_descuento: boolean;
  descuento_porcentaje: number;
}

// Gestión del token de sesión para usuarios no autenticados
let sessionToken: string | null = null;

const getSessionToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionToken || localStorage.getItem('cart-session-token');
  }
  return sessionToken;
};

const setSessionToken = (token: string) => {
  sessionToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart-session-token', token);
  }
};

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Agregar token de autenticación si está disponible
  const authToken = typeof window !== 'undefined' 
    ? localStorage.getItem('authToken') 
    : null;
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Agregar token de sesión si está disponible
  const currentSessionToken = getSessionToken();
  if (currentSessionToken) {
    headers['X-Session-Token'] = currentSessionToken;
  }

  return headers;
};

const handleResponse = async (response: Response): Promise<any> => {
  const data = await response.json();
  
  // Capturar token de sesión si viene en los headers
  const newSessionToken = response.headers.get('X-Session-Token');
  if (newSessionToken) {
    setSessionToken(newSessionToken);
  }

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// Obtener el carrito actual
export const getCart = async (): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error getting cart:', error);
    throw error;
  }
};

// Obtener conteo rápido del carrito
export const getCartCount = async (): Promise<{ success: boolean; totalItems: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/count`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error getting cart count:', error);
    throw error;
  }
};

// Agregar producto al carrito
export const addToCart = async (request: AddToCartRequest): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Actualizar cantidad de un producto en el carrito
export const updateQuantity = async (request: UpdateQuantityRequest): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error updating quantity:', error);
    throw error;
  }
};

// Eliminar producto del carrito
export const removeFromCart = async (request: RemoveFromCartRequest): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/remove`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

// Limpiar todo el carrito
export const clearCart = async (): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Migrar carrito de sesión a usuario autenticado
export const migrateCart = async (): Promise<CartResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cart/migrate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await handleResponse(response);

    // Después de migrar, limpiar el token de sesión ya que ahora está asociado al usuario
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart-session-token');
    }
    sessionToken = null;

    return data;
  } catch (error) {
    console.error('Error migrating cart:', error);
    throw error;
  }
};

export type { CartItem, CartResponse, AddToCartRequest, UpdateQuantityRequest, RemoveFromCartRequest };
