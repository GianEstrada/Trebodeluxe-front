// hooks/useCategories.ts - Hook para gestionar categorías

import { useState, useEffect } from 'react';
import { categoriesApi, categoryUtils } from '../utils/categoriesApi.js';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  order: number;
}

interface CategoriesApiResponse {
  success: boolean;
  categories: any[];
  error?: string;
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  activeCategories: Category[];
  dropdownOptions: Array<{value: number, label: string, slug: string}>;
  refreshCategories: () => Promise<void>;
}

/**
 * Hook para gestionar categorías desde la API
 * @returns {UseCategoriesReturn} Estado y funciones de categorías
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar categorías desde la API
  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await categoriesApi.getAll() as CategoriesApiResponse;
      
      if (response.success) {
        const transformedCategories = response.categories.map((cat: any) => categoryUtils.transformToFrontendFormat(cat)) as Category[];
        setCategories(transformedCategories);
      } else {
        throw new Error(response.error || 'Error al cargar categorías');
      }
    } catch (err: any) {
      console.error('Error en useCategories:', err);
      setError(err.message);
      
      // Fallback con categorías estáticas en caso de error
      setCategories([
        { id: 1, name: 'Camisas', slug: 'camisas', description: '', isActive: true, order: 1 },
        { id: 2, name: 'Pantalones', slug: 'pantalones', description: '', isActive: true, order: 2 },
        { id: 3, name: 'Vestidos', slug: 'vestidos', description: '', isActive: true, order: 3 },
        { id: 4, name: 'Abrigos y Chaquetas', slug: 'abrigos', description: '', isActive: true, order: 4 },
        { id: 5, name: 'Faldas', slug: 'faldas', description: '', isActive: true, order: 5 },
        { id: 6, name: 'Jeans', slug: 'jeans', description: '', isActive: true, order: 6 },
        { id: 7, name: 'Ropa Interior', slug: 'ropa-interior', description: '', isActive: true, order: 7 },
        { id: 8, name: 'Trajes de Baño', slug: 'trajes-baño', description: '', isActive: true, order: 8 },
        { id: 9, name: 'Accesorios de Moda', slug: 'accesorios-moda', description: '', isActive: true, order: 9 },
        { id: 10, name: 'Calzado', slug: 'calzado', description: '', isActive: true, order: 10 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  // Calcular valores derivados
  const activeCategories = categoryUtils.getActiveCategories(categories);
  const dropdownOptions = categoryUtils.toDropdownOptions(activeCategories);

  return {
    categories,
    loading,
    error,
    activeCategories,
    dropdownOptions,
    refreshCategories: loadCategories
  };
}
