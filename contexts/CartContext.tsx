// contexts/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
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
  addItem: (item: Omit<CartItem, 'cantidad'>, cantidad: number) => void;
  removeItem: (id_variante: number, id_talla: number) => void;
  updateQuantity: (id_variante: number, id_talla: number, cantidad: number) => void;
  clearCart: () => void;
  isInCart: (id_variante: number, id_talla: number) => boolean;
  getItemQuantity: (id_variante: number, id_talla: number) => number;
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

  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    const savedCart = localStorage.getItem('treboluxe-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('treboluxe-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'cantidad'>, cantidad: number) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(
        item => item.id_variante === newItem.id_variante && item.id_talla === newItem.id_talla
      );

      if (existingItemIndex >= 0) {
        // Si el item ya existe, actualizar cantidad
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].cantidad += cantidad;
        return updatedItems;
      } else {
        // Si es un item nuevo, agregarlo
        return [...currentItems, { ...newItem, cantidad }];
      }
    });
  };

  const removeItem = (id_variante: number, id_talla: number) => {
    setItems(currentItems => 
      currentItems.filter(item => 
        !(item.id_variante === id_variante && item.id_talla === id_talla)
      )
    );
  };

  const updateQuantity = (id_variante: number, id_talla: number, cantidad: number) => {
    if (cantidad <= 0) {
      removeItem(id_variante, id_talla);
      return;
    }

    setItems(currentItems => 
      currentItems.map(item => 
        item.id_variante === id_variante && item.id_talla === id_talla
          ? { ...item, cantidad }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('treboluxe-cart');
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
  const totalPrice = items.reduce((total, item) => total + (item.precio * item.cantidad), 0);

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
