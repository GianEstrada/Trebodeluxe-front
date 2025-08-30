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

  // Configurar URL base del backend
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [useCategorias] Starting fetch...');
      console.log('🔄 [useCategorias] API_BASE_URL:', API_BASE_URL);
      
      // Intentar primero el endpoint público
      let response = await fetch(`${API_BASE_URL}/api/categorias`);
      console.log('🔄 [useCategorias] Public endpoint response:', response.status);
      
      if (!response.ok) {
        // Si falla, intentar el endpoint temporal como fallback
        console.log('⚠️ [useCategorias] Public endpoint failed, trying temp endpoint...');
        response = await fetch(`${API_BASE_URL}/api/categorias/admin-temp`);
        console.log('🔄 [useCategorias] Temp endpoint response:', response.status);
        
        if (!response.ok) {
          throw new Error('Error al cargar categorías');
        }
      }

      const data = await response.json();
      console.log('🔍 [useCategorias] Raw response data:', data);
      
      // Manejar tanto el formato público como admin
      const categoriasData = data.categorias || data.data || [];
      console.log('🔍 [useCategorias] Processed categories data:', categoriasData);
      
      setCategorias(categoriasData);
      console.log(`✅ [useCategorias] Loaded ${categoriasData.length} categories`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      console.error('❌ [useCategorias] Error fetching categorias:', error);
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
