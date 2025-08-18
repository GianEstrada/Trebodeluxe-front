// utils/persistentCartApi.ts
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

// Constantes para el almacenamiento
const STORAGE_KEYS = {
  SESSION_TOKEN: 'trebodeluxe-cart-session-token',
  CART_DATA: 'trebodeluxe-cart-data',
  CART_TIMESTAMP: 'trebodeluxe-cart-timestamp'
};

// TTL para el cache del carrito (24 horas)
const CART_CACHE_TTL = 24 * 60 * 60 * 1000;

// Clase para manejar la persistencia del carrito
class PersistentCartManager {
  private sessionToken: string | null = null;
  private isInitialized = false;

  // Inicializar el manager (se llama automáticamente)
  private initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    // Recuperar token de sesión existente
    this.sessionToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    
    // Si no hay token, generar uno nuevo
    if (!this.sessionToken) {
      this.sessionToken = this.generateSessionToken();
      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, this.sessionToken);
      console.log('🔑 Nuevo token de sesión generado:', this.sessionToken.substring(0, 20) + '...');
    } else {
      console.log('🔑 Token de sesión recuperado:', this.sessionToken.substring(0, 20) + '...');
    }
    
    this.isInitialized = true;
  }

  // Generar un token de sesión único
  private generateSessionToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const userAgent = typeof navigator !== 'undefined' ? 
      navigator.userAgent.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '') : 
      'web';
    
    return `session_${timestamp}_${random}_${userAgent}`;
  }

  // Obtener el token de sesión actual
  getSessionToken(): string {
    this.initialize();
    return this.sessionToken!;
  }

  // Actualizar el token de sesión (cuando el backend envía uno nuevo)
  setSessionToken(token: string) {
    if (typeof window === 'undefined') return;
    
    this.sessionToken = token;
    localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
    console.log('🔄 Token de sesión actualizado:', token.substring(0, 20) + '...');
  }

  // Guardar datos del carrito en localStorage
  saveCartData(cartData: any) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.CART_DATA, JSON.stringify(cartData));
      localStorage.setItem(STORAGE_KEYS.CART_TIMESTAMP, Date.now().toString());
      console.log('💾 Carrito guardado localmente');
    } catch (error) {
      console.warn('⚠️ Error guardando carrito local:', error);
    }
  }

  // Recuperar datos del carrito desde localStorage
  getCachedCartData(): any | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const timestamp = localStorage.getItem(STORAGE_KEYS.CART_TIMESTAMP);
      const cartData = localStorage.getItem(STORAGE_KEYS.CART_DATA);
      
      if (!timestamp || !cartData) return null;
      
      // Verificar si los datos no han expirado
      const age = Date.now() - parseInt(timestamp);
      if (age > CART_CACHE_TTL) {
        this.clearCachedCartData();
        return null;
      }
      
      const parsed = JSON.parse(cartData);
      console.log('📦 Carrito recuperado desde cache local');
      return parsed;
    } catch (error) {
      console.warn('⚠️ Error recuperando carrito local:', error);
      return null;
    }
  }

  // Limpiar datos del carrito del localStorage
  clearCachedCartData() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(STORAGE_KEYS.CART_DATA);
    localStorage.removeItem(STORAGE_KEYS.CART_TIMESTAMP);
    console.log('🗑️ Cache del carrito limpiado');
  }

  // Generar headers para las peticiones
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Agregar token de autenticación si está disponible
    const authToken = typeof window !== 'undefined' 
      ? localStorage.getItem('authToken') || localStorage.getItem('token')
      : null;
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Agregar token de sesión
    const sessionToken = this.getSessionToken();
    if (sessionToken) {
      headers['X-Session-Token'] = sessionToken;
    }

    return headers;
  }

  // Manejar respuesta de la API
  async handleResponse(response: Response): Promise<any> {
    console.log(`📡 Respuesta API: ${response.status} ${response.statusText}`);
    
    // Capturar nuevo token de sesión si viene en los headers
    const newSessionToken = response.headers.get('X-Session-Token');
    if (newSessionToken && newSessionToken !== this.sessionToken) {
      this.setSessionToken(newSessionToken);
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error(`Error parsing response: ${error}`);
    }

    if (!response.ok) {
      console.error('❌ Error en respuesta API:', data);
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    // Guardar datos del carrito si vienen en la respuesta
    if (data.cart) {
      this.saveCartData(data);
    }

    console.log('✅ Respuesta API exitosa:', data);
    return data;
  }
}

// Instancia global del manager
const cartManager = new PersistentCartManager();

// Funciones de la API del carrito
export const persistentCartApi = {
  // Obtener el carrito actual
  async getCart(): Promise<CartResponse> {
    console.log('📋 Obteniendo carrito...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'GET',
        headers: cartManager.getHeaders(),
      });

      return cartManager.handleResponse(response);
    } catch (error) {
      console.warn('⚠️ Error obteniendo carrito del servidor, usando cache local:', error);
      
      // Intentar usar datos en cache como fallback
      const cachedData = cartManager.getCachedCartData();
      if (cachedData) {
        return cachedData;
      }
      
      throw error;
    }
  },

  // Obtener conteo rápido del carrito
  async getCartCount(): Promise<{ success: boolean; totalItems: number }> {
    console.log('🔢 Obteniendo contador del carrito...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/count`, {
        method: 'GET',
        headers: cartManager.getHeaders(),
      });

      return cartManager.handleResponse(response);
    } catch (error) {
      console.warn('⚠️ Error obteniendo contador, usando cache local:', error);
      
      const cachedData = cartManager.getCachedCartData();
      if (cachedData && cachedData.cart) {
        return {
          success: true,
          totalItems: cachedData.cart.totalItems || 0
        };
      }
      
      return { success: false, totalItems: 0 };
    }
  },

  // Agregar producto al carrito
  async addToCart(request: AddToCartRequest): Promise<CartResponse> {
    console.log('➕ Agregando producto al carrito:', request);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: cartManager.getHeaders(),
        body: JSON.stringify(request),
      });

      const result = await cartManager.handleResponse(response);
      console.log('✅ Producto agregado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error agregando producto:', error);
      throw error;
    }
  },

  // Actualizar cantidad de un producto
  async updateQuantity(request: UpdateQuantityRequest): Promise<CartResponse> {
    console.log('📝 Actualizando cantidad:', request);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: 'PUT',
        headers: cartManager.getHeaders(),
        body: JSON.stringify(request),
      });

      return cartManager.handleResponse(response);
    } catch (error) {
      console.error('❌ Error actualizando cantidad:', error);
      throw error;
    }
  },

  // Eliminar producto del carrito
  async removeFromCart(request: RemoveFromCartRequest): Promise<CartResponse> {
    console.log('🗑️ Eliminando producto del carrito:', request);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/remove`, {
        method: 'DELETE',
        headers: cartManager.getHeaders(),
        body: JSON.stringify(request),
      });

      return cartManager.handleResponse(response);
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      throw error;
    }
  },

  // Limpiar todo el carrito
  async clearCart(): Promise<CartResponse> {
    console.log('🗑️ Limpiando carrito completo...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
        method: 'DELETE',
        headers: cartManager.getHeaders(),
      });

      const result = await cartManager.handleResponse(response);
      cartManager.clearCachedCartData();
      return result;
    } catch (error) {
      console.error('❌ Error limpiando carrito:', error);
      throw error;
    }
  },

  // Migrar carrito de sesión a usuario autenticado
  async migrateCart(): Promise<CartResponse> {
    console.log('🔄 Migrando carrito a usuario autenticado...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/migrate`, {
        method: 'POST',
        headers: cartManager.getHeaders(),
      });

      const result = await cartManager.handleResponse(response);
      
      // Después de migrar exitosamente, limpiar el token de sesión
      cartManager.clearCachedCartData();
      
      return result;
    } catch (error) {
      console.error('❌ Error migrando carrito:', error);
      throw error;
    }
  },

  // Funciones de utilidad
  getSessionToken: () => cartManager.getSessionToken(),
  clearCache: () => cartManager.clearCachedCartData(),
  
  // Para debugging
  getStorageInfo: () => {
    if (typeof window === 'undefined') return null;
    
    return {
      sessionToken: cartManager.getSessionToken().substring(0, 20) + '...',
      hasCachedData: !!localStorage.getItem(STORAGE_KEYS.CART_DATA),
      cacheTimestamp: localStorage.getItem(STORAGE_KEYS.CART_TIMESTAMP),
      cacheAge: localStorage.getItem(STORAGE_KEYS.CART_TIMESTAMP) 
        ? Date.now() - parseInt(localStorage.getItem(STORAGE_KEYS.CART_TIMESTAMP)!)
        : null
    };
  }
};

export type { CartItem, CartResponse, AddToCartRequest, UpdateQuantityRequest, RemoveFromCartRequest };
export default persistentCartApi;
