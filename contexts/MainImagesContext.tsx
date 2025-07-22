// MainImagesContext.tsx - Context para gestionar las imágenes principales del sitio

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos de imágenes principales
export type ImageType = 'hero_banner' | 'promocion_banner' | 'categoria_destacada';

export interface MainImage {
  id_imagen: number;
  nombre: string;
  url: string;
  public_id?: string;
  tipo: ImageType;
  titulo?: string;
  subtitulo?: string;
  enlace?: string;
  orden: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface MainImagesData {
  all: MainImage[];
  byType: {
    hero_banner: MainImage[];
    promocion_banner: MainImage[];
    categoria_destacada: MainImage[];
  };
}

interface MainImagesContextType {
  images: MainImagesData | null;
  loading: boolean;
  error: string | null;
  refreshImages: () => Promise<void>;
  getImagesByType: (type: ImageType) => MainImage[];
}

const MainImagesContext = createContext<MainImagesContextType | undefined>(undefined);

interface MainImagesProviderProps {
  children: ReactNode;
}

export const MainImagesProvider: React.FC<MainImagesProviderProps> = ({ children }) => {
  const [images, setImages] = useState<MainImagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/main-images`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setImages(result.data);
      } else {
        throw new Error(result.message || 'Error al obtener las imágenes principales');
      }
    } catch (error) {
      console.error('Error fetching main images:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      
      // Datos de fallback en caso de error
      setImages({
        all: [],
        byType: {
          hero_banner: [],
          promocion_banner: [],
          categoria_destacada: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshImages = async () => {
    await fetchImages();
  };

  const getImagesByType = (type: ImageType): MainImage[] => {
    if (!images) return [];
    return images.byType[type] || [];
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const contextValue: MainImagesContextType = {
    images,
    loading,
    error,
    refreshImages,
    getImagesByType
  };

  return (
    <MainImagesContext.Provider value={contextValue}>
      {children}
    </MainImagesContext.Provider>
  );
};

export const useMainImages = (): MainImagesContextType => {
  const context = useContext(MainImagesContext);
  if (!context) {
    throw new Error('useMainImages must be used within a MainImagesProvider');
  }
  return context;
};
