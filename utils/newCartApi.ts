// utils/newCartApi.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

const generateSessionToken = (): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const browserFingerprint = typeof window !== 'undefined' 
    ? btoa(navigator.userAgent + (screen.width + screen.height).toString()).substring(0, 10)
    : 'server';
  return `session_${timestamp}_${randomString}_${browserFingerprint}`;
};

const getSessionToken = (): string => {
  if (typeof window !== 'undefined') {
    // Primero revisar en memoria
    if (sessionToken) {
      return sessionToken;
    }
    
    // Luego revisar en localStorage
    const storedToken = localStorage.getItem('cart-session-token');
    if (storedToken) {
      sessionToken = storedToken;
      return storedToken;
    }
    
    // Si no hay token, generar uno nuevo
    const newToken = generateSessionToken();
    setSessionToken(newToken);
    return newToken;
  }
  
  // En servidor, usar token en memoria o generar uno temporal
  return sessionToken || generateSessionToken();
};

const setSessionToken = (token: string) => {
  sessionToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart-session-token', token);
    // También guardarlo con fecha de expiración (30 días)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    localStorage.setItem('cart-session-expires', expirationDate.toISOString());
  }
};

const isTokenExpired = (): boolean => {
  if (typeof window !== 'undefined') {
    const expirationStr = localStorage.getItem('cart-session-expires');
    if (expirationStr) {
      const expirationDate = new Date(expirationStr);
      return new Date() > expirationDate;
    }
  }
  return false;
};

const clearExpiredToken = () => {
  if (typeof window !== 'undefined' && isTokenExpired()) {
    localStorage.removeItem('cart-session-token');
    localStorage.removeItem('cart-session-expires');
    sessionToken = null;
  }
};

const getAuthHeaders = () => {
  // Limpiar tokens expirados antes de usar
  clearExpiredToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Agregar token de autenticación si está disponible
  const authToken = typeof window !== 'undefined' 
    ? localStorage.getItem('authToken') 
    : null;
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  } else {
    // Si no hay usuario autenticado, usar token de sesión
    const currentSessionToken = getSessionToken();
    if (currentSessionToken) {
      headers['X-Session-Token'] = currentSessionToken;
    }
  }

  return headers;
};

const handleResponse = async (response: Response): Promise<any> => {
  // Log para debugging
  console.log('🔍 Cart API Response:', {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });

  let data;
  try {
    data = await response.json();
    console.log('📦 Cart API Data:', data);
  } catch (error) {
    console.error('❌ Error parsing JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
  
  // Capturar token de sesión si viene en los headers
  const newSessionToken = response.headers.get('X-Session-Token');
  if (newSessionToken) {
    console.log('🔑 New session token received:', newSessionToken);
    setSessionToken(newSessionToken);
  }

  if (!response.ok) {
    console.error('❌ Cart API Error:', {
      status: response.status,
      message: data.message || `HTTP error! status: ${response.status}`,
      data
    });
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// Obtener el carrito actual
export const getCart = async (): Promise<CartResponse> => {
  try {
    console.log('🛒 Getting cart...');
    const headers = getAuthHeaders();
    console.log('📡 Request headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'GET',
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    console.error('❌ Error getting cart:', error);
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
    console.log('➕ Adding to cart:', request);
    const headers = getAuthHeaders();
    console.log('📡 Request headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    const result = await handleResponse(response);
    console.log('✅ Product added successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
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
