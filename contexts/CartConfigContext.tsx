import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartConfigContextType {
  isCartEnabled: boolean;
  toggleCart: () => void;
}

const CartConfigContext = createContext<CartConfigContextType | undefined>(undefined);

export const CartConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCartEnabled, setIsCartEnabled] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Cargar el estado desde localStorage al montar el componente
  useEffect(() => {
    const stored = localStorage.getItem('cartEnabled');
    if (stored !== null) {
      setIsCartEnabled(stored === 'true');
    }
    setMounted(true);
  }, []);

  // Guardar el estado en localStorage cuando cambie
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cartEnabled', String(isCartEnabled));
    }
  }, [isCartEnabled, mounted]);

  const toggleCart = () => {
    setIsCartEnabled((prev) => !prev);
  };

  return (
    <CartConfigContext.Provider value={{ isCartEnabled, toggleCart }}>
      {children}
    </CartConfigContext.Provider>
  );
};

export const useCartConfig = () => {
  const context = useContext(CartConfigContext);
  if (context === undefined) {
    throw new Error('useCartConfig must be used within a CartConfigProvider');
  }
  return context;
};
