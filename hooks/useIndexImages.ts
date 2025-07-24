import { useState, useEffect, useCallback } from 'react';

export interface IndexImage {
  id_imagen: number;
  nombre: string;
  descripcion?: string;
  url: string;
  public_id: string;
  seccion: 'principal' | 'banner';
  estado: 'activo' | 'inactivo' | 'izquierda' | 'derecha';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export const useIndexImages = () => {
  const [images, setImages] = useState<IndexImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/index-images');
      const data = await response.json();
      
      if (data.success) {
        setImages(data.images);
        setError(null);
      } else {
        setError(data.error || 'Error al cargar imágenes');
      }
    } catch (err) {
      console.error('Error loading index images:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Función helper para obtener imagen por sección y estado
  const getImageByState = useCallback((seccion: 'principal' | 'banner', estado: string): IndexImage | undefined => {
    return images.find(img => img.seccion === seccion && img.estado === estado);
  }, [images]);

  // Función helper para obtener imágenes por sección
  const getImagesBySection = useCallback((seccion: 'principal' | 'banner'): IndexImage[] => {
    return images.filter(img => img.seccion === seccion);
  }, [images]);

  return {
    images,
    loading,
    error,
    getImageByState,
    getImagesBySection,
    refetch: loadImages
  };
};
