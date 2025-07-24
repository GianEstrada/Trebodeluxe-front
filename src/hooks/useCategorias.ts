import { useState, useEffect } from 'react';

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

interface UseCategorias {
  categorias: Categoria[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCategorias = (): UseCategorias => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categorias');
      
      if (!response.ok) {
        throw new Error('Error al cargar categorías');
      }

      const data = await response.json();
      setCategorias(data.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      console.error('Error fetching categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  return {
    categorias,
    loading,
    error,
    refetch: fetchCategorias
  };
};

export default useCategorias;
