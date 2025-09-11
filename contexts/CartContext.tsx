// contexts/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getActiveCart, addToCart as apiAddToCart, updateCartItem, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart } from '../utils/cartApi';

export interface CartItem {
  id_detalle?: number; // ID del detalle del carrito en BD
  id_variante: number;
  id_producto: number;
  nombre_producto: string;
  nombre_variante: string;
  imagen_url?: string;
  precio: number;
  precio_original?: number;
  precio_final_item?: number; // Precio final con descuentos aplicados
  tiene_descuento?: boolean; // Indica si tiene descuento
  descuento_porcentaje?: number; // Porcentaje de descuento
  id_talla: number;
  nombre_talla: string;
  cantidad: number;
  categoria: string;
  marca: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, 'cantidad' | 'id_detalle'>, cantidad: number) => Promise<void>;
  removeItem: (id_variante: number, id_talla: number) => Promise<void>;
  updateQuantity: (id_variante: number, id_talla: number, cantidad: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (id_variante: number, id_talla: number) => boolean;
  getItemQuantity: (id_variante: number, id_talla: number) => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Cargar carrito al inicializar el contexto y cuando cambie la autenticación
  useEffect(() => {
    if (isAuthenticated === true && user) {
      // Usuario acaba de iniciar sesión: cargar su carrito personal desde BD
      console.log('🔄 [CART] Usuario autenticado detectado, cargando carrito personal...');
      refreshCart();
    } else if (isAuthenticated === false) {
      // Usuario no autenticado: usar carrito con session-token
      console.log('🔄 [CART] Usuario anónimo detectado, cargando carrito con session-token...');
      refreshCart();
    }
  }, [isAuthenticated, user]);

  // Detectar logout y limpiar carrito en frontend
  useEffect(() => {
    if (isAuthenticated === false && items.length > 0) {
      // Usuario se deslogueó, limpiar carrito en frontend
      console.log('🧹 [CART] Logout detectado, limpiando carrito en frontend...');
      setItems([]);
      // Luego cargar carrito anónimo
      setTimeout(() => {
        refreshCart();
      }, 100);
    }
  }, [isAuthenticated]);

  // Función para cargar carrito desde la base de datos (para todos los usuarios)
  const refreshCart = async () => {
    try {
      setIsLoading(true);
      const response = await getActiveCart();
      
      if (response.success) {
        const dbItems = response.cart.items.map((item: any) => ({
          id_detalle: item.id_detalle,
          id_variante: item.id_variante,
          id_producto: item.id_producto,
          nombre_producto: item.nombre_producto,
          nombre_variante: item.nombre_variante,
          imagen_url: item.imagen_url,
          precio: typeof item.precio === 'string' ? parseFloat(item.precio) : (item.precio || 0),
          precio_original: item.precio_original ? 
            (typeof item.precio_original === 'string' ? parseFloat(item.precio_original) : item.precio_original) : 
            undefined,
          precio_final_item: item.precio_final_item ? 
            (typeof item.precio_final_item === 'string' ? parseFloat(item.precio_final_item) : item.precio_final_item) : 
            undefined,
          tiene_descuento: item.tiene_descuento || false,
          descuento_porcentaje: item.descuento_porcentaje || 0,
          id_talla: item.id_talla,
          nombre_talla: item.nombre_talla,
          cantidad: item.cantidad,
          categoria: item.categoria,
          marca: item.marca
        }));
        
        setItems(dbItems);
      }
    } catch (error) {
      console.error('Error loading cart from database:', error);
      // En caso de error severo, inicializar carrito vacío
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (newItem: Omit<CartItem, 'cantidad' | 'id_detalle'>, cantidad: number) => {
    const validatedItem = {
      ...newItem,
      precio: typeof newItem.precio === 'string' ? parseFloat(newItem.precio) : (newItem.precio || 0),
      precio_original: newItem.precio_original 
        ? (typeof newItem.precio_original === 'string' ? parseFloat(newItem.precio_original) : newItem.precio_original)
        : undefined
    };

    try {
      setIsLoading(true);

      // Siempre usar la API (tanto para usuarios autenticados como no autenticados)
      await apiAddToCart({
        id_producto: validatedItem.id_producto,
        id_variante: validatedItem.id_variante,
        id_talla: validatedItem.id_talla,
        cantidad,
        precio_unitario: validatedItem.precio
      });
      
      // Refrescar carrito desde la base de datos
      await refreshCart();
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (id_variante: number, id_talla: number) => {
    try {
      setIsLoading(true);

      // Buscar el item en el carrito actual
      const item = items.find(item => 
        item.id_variante === id_variante && item.id_talla === id_talla
      );
      
      if (item) {
        // Usar la nueva API que acepta productId, variantId y tallaId
        await apiRemoveFromCart({
          productId: item.id_producto,
          variantId: item.id_variante,
          tallaId: item.id_talla
        });
        
        await refreshCart();
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (id_variante: number, id_talla: number, cantidad: number) => {
    if (cantidad <= 0) {
      await removeItem(id_variante, id_talla);
      return;
    }

    try {
      setIsLoading(true);

      // Buscar el item en el carrito actual
      const item = items.find(item => 
        item.id_variante === id_variante && item.id_talla === id_talla
      );
      
      if (item) {
        await updateCartItem({
          productId: item.id_producto,
          variantId: item.id_variante,
          tallaId: item.id_talla,
          cantidad
        });
        
        await refreshCart();
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);

      // Siempre usar la API para limpiar el carrito
      await apiClearCart();
      await refreshCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isInCart = (id_variante: number, id_talla: number): boolean => {
    return items.some(item => 
      item.id_variante === id_variante && item.id_talla === id_talla
    );
  };

  const getItemQuantity = (id_variante: number, id_talla: number): number => {
    const item = items.find(item => 
      item.id_variante === id_variante && item.id_talla === id_talla
    );
    return item ? item.cantidad : 0;
  };

  const totalItems = items.reduce((total, item) => total + item.cantidad, 0);
  const totalPrice = items.reduce((total, item) => {
    const precio = typeof item.precio === 'string' ? parseFloat(item.precio) : (item.precio || 0);
    return total + (precio * item.cantidad);
  }, 0);

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
