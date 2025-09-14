// contexts/SiteSettingsContext.tsx - Contexto para configuraciones del sitio

import React, { createContext, useContext, useState, useEffect } from 'react';

interface HeaderSettings {
  brandName: string;
  promoTexts: string[];
}

interface SiteSettingsContextType {
  headerSettings: HeaderSettings;
  loading: boolean;
  error: string | null;
  refreshHeaderSettings: () => Promise<void>;
  updateHeaderSettings: (settings: HeaderSettings) => Promise<boolean>;
}

const defaultHeaderSettings: HeaderSettings = {
  brandName: 'TREBOLUXE',
  promoTexts: [
    'ENVIO GRATIS EN PEDIDOS ARRIBA DE $500 MXN',
    'OFERTA ESPECIAL: 20% DE DESCUENTO EN SEGUNDA PRENDA'
  ]
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const useSiteSettings = (): SiteSettingsContextType => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings debe ser usado dentro de SiteSettingsProvider');
  }
  return context;
};

interface SiteSettingsProviderProps {
  children: React.ReactNode;
}

export const SiteSettingsProvider: React.FC<SiteSettingsProviderProps> = ({ children }) => {
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL del backend según el entorno
  const getBackendUrl = () => {
    if (typeof window !== 'undefined') {
      // Cliente
      return process.env.NODE_ENV === 'production'
        ? 'https://trebodeluxe-backend.onrender.com'
        : 'https://trebodeluxe-backend.onrender.com';
    } else {
      // Servidor (SSR)
      return 'https://trebodeluxe-backend.onrender.com';
    }
  };

  // Función para cargar configuraciones del header desde la API
  const refreshHeaderSettings = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getBackendUrl()}/api/site-settings/header`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.headerSettings) {
        console.log('✅ Configuraciones del header cargadas desde BD:', data.headerSettings);
        setHeaderSettings(data.headerSettings);
      } else {
        console.warn('⚠️ No se pudieron cargar configuraciones, usando valores por defecto');
        setHeaderSettings(defaultHeaderSettings);
      }
    } catch (error) {
      console.error('❌ Error cargando configuraciones del header:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      // Usar configuraciones por defecto en caso de error
      setHeaderSettings(defaultHeaderSettings);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar configuraciones del header
  const updateHeaderSettings = async (newSettings: HeaderSettings): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${getBackendUrl()}/api/site-settings/header`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Configuraciones del header actualizadas exitosamente');
        setHeaderSettings(newSettings);
        return true;
      } else {
        throw new Error(data.message || 'Error desconocido al actualizar');
      }
    } catch (error) {
      console.error('❌ Error actualizando configuraciones del header:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    refreshHeaderSettings();
  }, []);

  const contextValue: SiteSettingsContextType = {
    headerSettings,
    loading,
    error,
    refreshHeaderSettings,
    updateHeaderSettings,
  };

  return (
    <SiteSettingsContext.Provider value={contextValue}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export default SiteSettingsContext;
