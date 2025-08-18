// contexts/PersistentCartContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import persistentCartApi from '../utils/persistentCartApi';
import type { CartItem, CartResponse } from '../utils/persistentCartApi';
import { useAuth } from './AuthContext';

// Interface para los items del carrito adaptado para el frontend
export interface FrontendCartItem {
  id: string;
  id_contenido: number;
  id_carrito: number;
  productId: number;
  variantId: number;
  tallaId: number;
  quantity: number;
  name: string;
  description?: string;
  variantName: string;
  tallaName: string;
  sistematalla: string;
  price: number;
  stock: number;
  image: string;
  totalItemPrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountPercentage: number;
  fechaAgregado: string;
}

// Estado del carrito
interface CartState {
  items: FrontendCartItem[];
  totalItems: number;
  totalOriginal: number;
  totalFinal: number;
  totalDescuento: number;
  hasDiscounts: boolean;
  isLoading: boolean;
  error: string | null;
  cartId: number | null;
  isInitialized: boolean;
}

// Acciones del reducer
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: CartResponse }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Función para mapear CartItem a FrontendCartItem
const mapToFrontendItem = (item: CartItem): FrontendCartItem => ({
  id: item.id_contenido.toString(),
  id_contenido: item.id_contenido,
  id_carrito: item.id_carrito,
  productId: item.id_producto,
  variantId: item.id_variante,
  tallaId: item.id_talla,
  quantity: item.cantidad,
  name: item.nombre_producto,
  description: item.descripcion_producto,
  variantName: item.nombre_variante,
  tallaName: item.nombre_talla,
  sistematalla: item.sistema_talla,
  price: item.precio,
  stock: item.stock_disponible,
  image: item.imagen_variante,
  totalItemPrice: item.precio_total_item,
  finalPrice: item.precio_final_item,
  hasDiscount: item.tiene_descuento,
  discountPercentage: item.descuento_porcentaje,
  fechaAgregado: item.fecha_agregado,
});

// Reducer del carrito
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    case 'SET_CART':
      const { cart } = action.payload;
      return {
        ...state,
        items: cart.items.map(mapToFrontendItem),
        totalItems: cart.totalItems,
        totalOriginal: cart.totalOriginal,
        totalFinal: cart.totalFinal,
        totalDescuento: cart.totalDescuento,
        hasDiscounts: cart.tieneDescuentos,
        cartId: cart.id,
        isLoading: false,
        error: null,
        isInitialized: true,
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalOriginal: 0,
        totalFinal: 0,
        totalDescuento: 0,
        hasDiscounts: false,
        cartId: null,
        isLoading: false,
        error: null,
      };
    
    default:
      return state;
  }
};

// Estado inicial del carrito
const initialCartState: CartState = {
  items: [],
  totalItems: 0,
  totalOriginal: 0,
  totalFinal: 0,
  totalDescuento: 0,
  hasDiscounts: false,
  isLoading: false,
  error: null,
  cartId: null,
  isInitialized: false,
};

// Contexto del carrito
interface CartContextType {
  // Estado
  items: FrontendCartItem[];
  totalItems: number;
  totalOriginal: number;
  totalFinal: number;
  totalDescuento: number;
  hasDiscounts: boolean;
  isLoading: boolean;
  error: string | null;
  cartId: number | null;
  isInitialized: boolean;

  // Acciones
  addToCart: (productId: number, variantId: number, tallaId: number, quantity: number) => Promise<void>;
  updateQuantity: (productId: number, variantId: number, tallaId: number, newQuantity: number) => Promise<void>;
  removeFromCart: (productId: number, variantId: number, tallaId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getStorageInfo: () => any;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook para usar el contexto
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Proveedor del contexto
interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const { isAuthenticated, user } = useAuth ? useAuth() : { isAuthenticated: false, user: null };

  // Función para manejar errores
  const handleError = (error: any, context: string) => {
    const message = error.message || 'Error desconocido en el carrito';
    console.error(`❌ Cart error (${context}):`, error);
    dispatch({ type: 'SET_ERROR', payload: message });
  };

  // Refrescar el carrito desde la API
  const refreshCart = useCallback(async () => {
    try {
      console.log('🔄 Refrescando carrito...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await persistentCartApi.getCart();
      dispatch({ type: 'SET_CART', payload: response });
      
      console.log('✅ Carrito refrescado exitosamente');
    } catch (error: any) {
      // Si el error es que no hay carrito, no es un error real
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        dispatch({ type: 'CLEAR_CART' });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        console.log('ℹ️ No hay carrito existente, iniciando vacío');
      } else {
        handleError(error, 'refreshCart');
      }
    }
  }, []);

  // Agregar producto al carrito
  const addToCart = useCallback(async (
    productId: number, 
    variantId: number, 
    tallaId: number, 
    quantity: number
  ) => {
    try {
      console.log(`➕ Agregando al carrito: Producto ${productId}, Variante ${variantId}, Talla ${tallaId}, Cantidad ${quantity}`);
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await persistentCartApi.addToCart({
        productId,
        variantId,
        tallaId,
        cantidad: quantity,
      });
      
      dispatch({ type: 'SET_CART', payload: response });
      console.log('✅ Producto agregado exitosamente al carrito');
    } catch (error: any) {
      handleError(error, 'addToCart');
    }
  }, []);

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback(async (
    productId: number, 
    variantId: number, 
    tallaId: number, 
    newQuantity: number
  ) => {
    try {
      console.log(`📝 Actualizando cantidad: Producto ${productId}, nueva cantidad ${newQuantity}`);
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await persistentCartApi.updateQuantity({
        productId,
        variantId,
        tallaId,
        cantidad: newQuantity,
      });
      
      dispatch({ type: 'SET_CART', payload: response });
      console.log('✅ Cantidad actualizada exitosamente');
    } catch (error: any) {
      handleError(error, 'updateQuantity');
    }
  }, []);

  // Eliminar producto del carrito
  const removeFromCart = useCallback(async (
    productId: number, 
    variantId: number, 
    tallaId: number
  ) => {
    try {
      console.log(`🗑️ Eliminando del carrito: Producto ${productId}, Variante ${variantId}, Talla ${tallaId}`);
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await persistentCartApi.removeFromCart({
        productId,
        variantId,
        tallaId,
      });
      
      dispatch({ type: 'SET_CART', payload: response });
      console.log('✅ Producto eliminado exitosamente del carrito');
    } catch (error: any) {
      handleError(error, 'removeFromCart');
    }
  }, []);

  // Limpiar todo el carrito
  const clearCart = useCallback(async () => {
    try {
      console.log('🗑️ Limpiando carrito completo...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await persistentCartApi.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      console.log('✅ Carrito limpiado exitosamente');
    } catch (error: any) {
      handleError(error, 'clearCart');
    }
  }, []);

  // Migrar carrito cuando el usuario se autentica
  const migrateCart = useCallback(async () => {
    if (isAuthenticated && state.totalItems > 0 && !user) {
      try {
        console.log('🔄 Migrando carrito a usuario autenticado...');
        const response = await persistentCartApi.migrateCart();
        dispatch({ type: 'SET_CART', payload: response });
        console.log('✅ Carrito migrado exitosamente');
      } catch (error: any) {
        console.warn('⚠️ Error migrando carrito (no crítico):', error);
        // No es crítico si falla la migración
      }
    }
  }, [isAuthenticated, state.totalItems, user]);

  // Función para obtener información de debugging
  const getStorageInfo = useCallback(() => {
    return persistentCartApi.getStorageInfo();
  }, []);

  // Efecto para cargar carrito al inicializar
  useEffect(() => {
    let mounted = true;
    
    const initializeCart = async () => {
      if (!state.isInitialized && mounted) {
        console.log('🚀 Inicializando carrito...');
        await refreshCart();
      }
    };

    // Pequeño delay para asegurar que el componente esté montado
    const timer = setTimeout(initializeCart, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [refreshCart, state.isInitialized]);

  // Efecto para migrar carrito cuando el usuario se autentica
  useEffect(() => {
    let mounted = true;
    
    const handleAuthChange = async () => {
      if (mounted && state.isInitialized) {
        await migrateCart();
      }
    };

    handleAuthChange();
    
    return () => {
      mounted = false;
    };
  }, [migrateCart, state.isInitialized]);

  // Log de debugging en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛒 Estado del carrito:', {
        totalItems: state.totalItems,
        cartId: state.cartId,
        isLoading: state.isLoading,
        error: state.error,
        isInitialized: state.isInitialized,
        storageInfo: persistentCartApi.getStorageInfo()
      });
    }
  }, [state]);

  // Valor del contexto
  const contextValue: CartContextType = {
    // Estado
    items: state.items,
    totalItems: state.totalItems,
    totalOriginal: state.totalOriginal,
    totalFinal: state.totalFinal,
    totalDescuento: state.totalDescuento,
    hasDiscounts: state.hasDiscounts,
    isLoading: state.isLoading,
    error: state.error,
    cartId: state.cartId,
    isInitialized: state.isInitialized,

    // Acciones
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    getStorageInfo,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
