// hooks/useCategoryFilter.js - Hook para filtro de categorías en tiempo real

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

/**
 * Hook personalizado para filtrado de productos por categoría
 * Proporciona funcionalidad para cargar categorías y filtrar productos
 */
const useCategoryFilter = (initialCategory = 'todas') => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Referencia para cancelar solicitudes anteriores
  const abortController = useRef(null);

  // Cargar categorías disponibles
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cancelar la solicitud anterior si existe
      if (abortController.current) {
        abortController.current.abort();
      }

      // Crear un nuevo AbortController
      abortController.current = new AbortController();

      const response = await fetch(`${API_BASE_URL}/api/products/categories`, {
        signal: abortController.current.signal
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Agregar "Todas las categorías" al inicio
        const allCategories = [
          { id: 'todas', name: 'Todas las categorías', slug: 'todas' },
          ...(data.categories || [])
        ];
        setCategories(allCategories);
      } else {
        setError(data.message || 'Error al cargar categorías');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error cargando categorías:', error);
        setError(error.message);
      }
    } finally {
      if (abortController.current && !abortController.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Filtrar productos por categoría
  const filterProductsByCategory = async (categorySlug) => {
    if (!categorySlug) return;

    try {
      setIsLoading(true);
      setError(null);

      // Cancelar la solicitud anterior si existe
      if (abortController.current) {
        abortController.current.abort();
      }

      // Crear un nuevo AbortController
      abortController.current = new AbortController();

      let endpoint = `${API_BASE_URL}/api/products/catalog-items?limit=20`;
      
      if (categorySlug !== 'todas') {
        endpoint += `&categoria=${encodeURIComponent(categorySlug)}`;
      }

      const response = await fetch(endpoint, {
        signal: abortController.current.signal
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setFilteredProducts(data.products || []);
      } else {
        setError(data.message || 'Error al filtrar productos');
        setFilteredProducts([]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error filtrando productos:', error);
        setError(error.message);
        setFilteredProducts([]);
      }
    } finally {
      if (abortController.current && !abortController.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();

    // Cleanup al desmontar
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Filtrar productos cuando cambia la categoría seleccionada
  useEffect(() => {
    if (selectedCategory) {
      filterProductsByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const selectCategory = (categorySlug) => {
    setSelectedCategory(categorySlug);
  };

  const resetFilter = () => {
    setSelectedCategory('todas');
  };

  return {
    categories,
    selectedCategory,
    selectCategory,
    resetFilter,
    filteredProducts,
    isLoading,
    error,
    loadCategories
  };
};

export default useCategoryFilter;
