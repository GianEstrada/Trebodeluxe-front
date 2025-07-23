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

  // Cargar carrito cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCart();
    } else {
      // Si no está autenticado, usar localStorage como fallback
      loadFromLocalStorage();
    }
  }, [isAuthenticated, user]);

  // Función para cargar carrito desde la base de datos
  const refreshCart = async () => {
    if (!isAuthenticated) return;
    
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
          precio_original: item.precio_original,
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
      // En caso de error, usar localStorage como fallback
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar desde localStorage (para usuarios no autenticados)
  const loadFromLocalStorage = () => {
    const savedCart = localStorage.getItem('treboluxe-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  };

  // Guardar en localStorage para usuarios no autenticados
  const saveToLocalStorage = (cartItems: CartItem[]) => {
    if (!isAuthenticated) {
      localStorage.setItem('treboluxe-cart', JSON.stringify(cartItems));
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

      if (isAuthenticated) {
        // Usuario autenticado: usar API
        await apiAddToCart({
          id_producto: validatedItem.id_producto,
          id_variante: validatedItem.id_variante,
          id_talla: validatedItem.id_talla,
          cantidad,
          precio_unitario: validatedItem.precio
        });
        
        // Refrescar carrito desde la base de datos
        await refreshCart();
      } else {
        // Usuario no autenticado: usar localStorage
        setItems(currentItems => {
          const existingItemIndex = currentItems.findIndex(
            item => item.id_variante === validatedItem.id_variante && item.id_talla === validatedItem.id_talla
          );

          let updatedItems;
          if (existingItemIndex >= 0) {
            updatedItems = [...currentItems];
            updatedItems[existingItemIndex].cantidad += cantidad;
          } else {
            updatedItems = [...currentItems, { ...validatedItem, cantidad }];
          }
          
          saveToLocalStorage(updatedItems);
          return updatedItems;
        });
      }
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

      if (isAuthenticated) {
        // Usuario autenticado: usar API
        const item = items.find(item => 
          item.id_variante === id_variante && item.id_talla === id_talla
        );
        
        if (item && item.id_detalle) {
          await apiRemoveFromCart(item.id_detalle);
          await refreshCart();
        }
      } else {
        // Usuario no autenticado: usar localStorage
        setItems(currentItems => {
          const updatedItems = currentItems.filter(item => 
            !(item.id_variante === id_variante && item.id_talla === id_talla)
          );
          saveToLocalStorage(updatedItems);
          return updatedItems;
        });
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

      if (isAuthenticated) {
        // Usuario autenticado: usar API
        const item = items.find(item => 
          item.id_variante === id_variante && item.id_talla === id_talla
        );
        
        if (item && item.id_detalle) {
          await updateCartItem(item.id_detalle, cantidad);
          await refreshCart();
        }
      } else {
        // Usuario no autenticado: usar localStorage
        setItems(currentItems => {
          const updatedItems = currentItems.map(item => 
            item.id_variante === id_variante && item.id_talla === id_talla
              ? { ...item, cantidad }
              : item
          );
          saveToLocalStorage(updatedItems);
          return updatedItems;
        });
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

      if (isAuthenticated) {
        // Usuario autenticado: usar API
        await apiClearCart();
        await refreshCart();
      } else {
        // Usuario no autenticado: limpiar localStorage
        setItems([]);
        localStorage.removeItem('treboluxe-cart');
      }
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
