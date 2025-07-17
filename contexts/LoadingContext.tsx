import React, { createContext, useState, useContext, useEffect } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  isBackendReady: boolean;
  checkBackendStatus: () => Promise<boolean>;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
  isBackendReady: false,
  checkBackendStatus: async () => false,
});

export const useLoading = () => useContext(LoadingContext);

interface LoadingProviderProps {
  children: React.ReactNode;
  backendUrl?: string;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ 
  children,
  backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com'
}) => {
  const [isLoading, setLoading] = useState(false);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [lastCheck, setLastCheck] = useState(0);

  const checkBackendStatus = async (): Promise<boolean> => {
    try {
      // Evitar verificaciones demasiado frecuentes (máximo cada 10 segundos)
      const now = Date.now();
      if (now - lastCheck < 10000 && isBackendReady) {
        return isBackendReady;
      }
      
      setLastCheck(now);
      const response = await fetch(`${backendUrl}/api/health`);
      const isReady = response.ok;
      setIsBackendReady(isReady);
      return isReady;
    } catch (error) {
      console.error('Error al verificar el estado del backend:', error);
      setIsBackendReady(false);
      return false;
    }
  };

  // Verificar el estado del backend al iniciar
  useEffect(() => {
    checkBackendStatus();
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, isBackendReady, checkBackendStatus }}>
      {children}
    </LoadingContext.Provider>
  );
};
