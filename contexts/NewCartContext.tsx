// contexts/NewCartContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import * as newCartApi from '../utils/newCartApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

// Interface para los items del carrito basado en la respuesta del backend
export interface CartItem {
  id: string; // Se mapea desde id_contenido para mantener compatibilidad
  id_contenido: number; // ID real del contenido del carrito
  id_carrito: number;
  productId: number; // Se mapea desde id_producto
  variantId: number; // Se mapea desde id_variante
  tallaId: number; // Se mapea desde id_talla
  quantity: number; // Se mapea desde cantidad
  name: string; // Se mapea desde nombre_producto
  description?: string; // Se mapea desde descripcion_producto
  variantName: string; // Se mapea desde nombre_variante
  tallaName: string; // Se mapea desde nombre_talla
  sistematalla: string; // Sistema de tallas
  price: number; // Precio original
  stock: number; // Se mapea desde stock_disponible
  image: string; // Se mapea desde imagen_variante
  totalItemPrice: number; // Precio total del item (precio * cantidad)
  finalPrice: number; // Precio final después de descuentos
  hasDiscount: boolean; // Indica si tiene descuento
  discountPercentage: number; // Porcentaje de descuento aplicado
  fechaAgregado: string; // Fecha cuando se agregó al carrito
}

// Estado del carrito
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalOriginal: number;
  totalFinal: number;
  totalDescuento: number;
  hasDiscounts: boolean;
  isLoading: boolean;
  error: string | null;
  cartId: number | null;
}

// Acciones del reducer
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: newCartApi.CartResponse }
  | { type: 'CLEAR_CART' };

// Reducer del carrito
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_CART':
      const { cart } = action.payload;
      console.log('🛒 [DEBUG] SET_CART reducer - Raw cart data:', cart);
      console.log('🛒 [DEBUG] SET_CART reducer - Cart items:', cart.items);
      
      if (cart.items && cart.items.length > 0) {
        console.log('🛒 [DEBUG] SET_CART reducer - First item raw:', cart.items[0]);
        console.log('🛒 [DEBUG] SET_CART reducer - First item discount fields:', {
          tiene_descuento: cart.items[0].tiene_descuento,
          descuento_porcentaje: cart.items[0].descuento_porcentaje,
          precio_final_item: cart.items[0].precio_final_item,
          precio_total_item: cart.items[0].precio_total_item,
          precio: cart.items[0].precio
        });
      }
      
      return {
        ...state,
        items: cart.items.map(item => {
          const mappedItem = {
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
            totalItemPrice: item.tiene_descuento ? item.precio_final_item : item.precio_total_item,
            finalPrice: item.tiene_descuento ? (item.precio_final_item / item.cantidad) : item.precio,
            hasDiscount: item.tiene_descuento,
            discountPercentage: item.descuento_porcentaje,
            fechaAgregado: item.fecha_agregado,
          };
          
          console.log('🛒 [DEBUG] SET_CART reducer - Mapped item:', {
            name: mappedItem.name,
            hasDiscount: mappedItem.hasDiscount,
            discountPercentage: mappedItem.discountPercentage,
            price: mappedItem.price,
            finalPrice: mappedItem.finalPrice,
            totalItemPrice: mappedItem.totalItemPrice
          });
          
          return mappedItem;
        }),
        totalItems: cart.totalItems,
        totalOriginal: cart.totalOriginal,
        totalFinal: cart.totalFinal,
        totalDescuento: cart.totalDescuento,
        hasDiscounts: cart.tieneDescuentos,
        cartId: cart.id,
        isLoading: false,
        error: null,
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
};

// Contexto del carrito
interface CartContextType {
  // Estado
  items: CartItem[];
  totalItems: number;
  totalOriginal: number;
  totalFinal: number;
  totalDescuento: number;
  hasDiscounts: boolean;
  isLoading: boolean;
  error: string | null;
  cartId: number | null;

  // Acciones
  addToCart: (productId: number, variantId: number, tallaId: number, quantity: number) => Promise<void>;
  updateQuantity: (productId: number, variantId: number, tallaId: number, newQuantity: number) => Promise<void>;
  removeFromCart: (productId: number, variantId: number, tallaId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
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
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError, ToastContainer } = useToast();

  // Función para manejar errores
  const handleError = (error: any) => {
    const message = error.message || 'Error desconocido en el carrito';
    console.error('Cart error:', error);
    dispatch({ type: 'SET_ERROR', payload: message });
  };

  // Refrescar el carrito desde la API
  const refreshCart = useCallback(async () => {
    try {
      console.log('🔄 Refreshing cart...');
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await newCartApi.getCart();
      console.log('✅ Cart loaded successfully:', response);
      dispatch({ type: 'SET_CART', payload: response });
    } catch (error: any) {
      console.log('⚠️ Cart refresh error:', error);
      
      // Si el error es que no hay carrito, no es un error real
      if (error.message?.includes('404') || 
          error.message?.includes('not found') ||
          error.message?.includes('No se encontró carrito')) {
        console.log('📝 No cart found, starting with empty cart');
        dispatch({ type: 'CLEAR_CART' });
      } else {
        handleError(error);
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
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('🛒 [DEBUG] Adding to cart:', { productId, variantId, tallaId, quantity });
      console.log('🛒 [DEBUG] Current page:', window.location.pathname);
      
      const response = await newCartApi.addToCart({
        productId,
        variantId,
        tallaId,
        cantidad: quantity,
      });
      
      console.log('🛒 [DEBUG] Add to cart response:', response);
      console.log('🛒 [DEBUG] Cart items after add:', response.cart?.items);
      console.log('🛒 [DEBUG] Page:', window.location.pathname);
      
      if (response.cart?.items && response.cart.items.length > 0) {
        console.log('🛒 [DEBUG] First item promotion data (' + window.location.pathname + '):', {
          tiene_descuento: response.cart.items[0].tiene_descuento,
          descuento_porcentaje: response.cart.items[0].descuento_porcentaje,
          precio_final_item: response.cart.items[0].precio_final_item,
          precio_total_item: response.cart.items[0].precio_total_item,
          precio: response.cart.items[0].precio
        });
      }
      
      dispatch({ type: 'SET_CART', payload: response });
      
      // Mostrar notificación de éxito
      showSuccess(`¡Producto agregado al carrito! (${quantity} unidad${quantity > 1 ? 'es' : ''})`, 3000);
      
    } catch (error: any) {
      console.error('🛒 [ERROR] Add to cart failed:', error);
      handleError(error);
      showError(error.message || 'Error al agregar producto al carrito', 4000);
    }
  }, [showSuccess, showError]);

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback(async (
    productId: number, 
    variantId: number, 
    tallaId: number, 
    newQuantity: number
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await newCartApi.updateQuantity({
        productId,
        variantId,
        tallaId,
        cantidad: newQuantity,
      });
      dispatch({ type: 'SET_CART', payload: response });
    } catch (error: any) {
      handleError(error);
    }
  }, []);

  // Eliminar producto del carrito
  const removeFromCart = useCallback(async (
    productId: number, 
    variantId: number, 
    tallaId: number
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await newCartApi.removeFromCart({
        productId,
        variantId,
        tallaId,
      });
      dispatch({ type: 'SET_CART', payload: response });
    } catch (error: any) {
      handleError(error);
    }
  }, []);

  // Limpiar todo el carrito
  const clearCart = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await newCartApi.clearCart();
      dispatch({ type: 'CLEAR_CART' });
    } catch (error: any) {
      handleError(error);
    }
  }, []);

  // Migrar carrito cuando el usuario se autentica
  const migrateCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        console.log('🔄 [NEWCART] Usuario autenticado detectado, recargando carrito...');
        // En lugar de migrar, simplemente recargar el carrito del usuario
        await refreshCart();
      } catch (error: any) {
        console.warn('Error refreshing cart after login:', error);
        // No es crítico si falla la recarga
      }
    }
  }, [isAuthenticated, refreshCart]);

  // Efectos
  useEffect(() => {
    // Cargar carrito al inicializar
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    // Solo migrar si el usuario acaba de autenticarse
    if (isAuthenticated) {
      console.log('🔄 [NEWCART] Usuario autenticado detectado, ejecutando migración...');
      migrateCart();
    } else {
      // Usuario hizo logout - limpiar carrito del frontend y cargar carrito anónimo
      console.log('🚪 [NEWCART] Usuario desautenticado detectado, limpiando carrito...');
      dispatch({ type: 'CLEAR_CART' });
      // Recargar carrito para obtener el carrito anónimo
      refreshCart();
    }
  }, [isAuthenticated, migrateCart, refreshCart]);

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

    // Acciones
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </CartContext.Provider>
  );
};

export default CartContext;
