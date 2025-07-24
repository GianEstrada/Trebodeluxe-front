import { useState, useEffect } from 'react';

interface Variant {
  id_variante: number;
  nombre_variante: string;
  variante_activa: boolean;
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  categoria: string;
  marca: string;
  categoria_nombre?: string;
  sistema_talla?: string;
  imagen_url?: string;
  imagen_public_id?: string;
  precio_base?: number;
  precio_original_base?: number;
  precio_unico: boolean;
  tallas_stock: any[];
}

interface UseVariantsV2 {
  variants: Variant[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createVariant: (data: any) => Promise<boolean>;
  updateVariant: (id: number, data: any) => Promise<boolean>;
}

export const useVariantsV2 = (): UseVariantsV2 => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/variants-v2', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar variantes');
      }

      const data = await response.json();
      setVariants(data.variants || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      console.error('Error fetching variants v2:', error);
    } finally {
      setLoading(false);
    }
  };

  const createVariant = async (variantData: any): Promise<boolean> => {
    try {
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/variants-v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(variantData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear variante');
      }

      await fetchVariants(); // Refetch para actualizar la lista
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      console.error('Error creating variant v2:', error);
      return false;
    }
  };

  const updateVariant = async (id: number, variantData: any): Promise<boolean> => {
    try {
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/variants-v2/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(variantData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar variante');
      }

      await fetchVariants(); // Refetch para actualizar la lista
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
      console.error('Error updating variant v2:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  return {
    variants,
    loading,
    error,
    refetch: fetchVariants,
    createVariant,
    updateVariant
  };
};

export default useVariantsV2;
