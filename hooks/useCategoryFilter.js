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
  const [isLoading, setIsLoading] = useState(true); // Iniciar como true
  const [error, setError] = useState(null);
  
  // Referencias separadas para categorías y productos
  const categoriesAbortController = useRef(null);
  const productsAbortController = useRef(null);

  // Cargar categorías disponibles
  const loadCategories = async () => {
    // Si ya tenemos categorías, no recargar
    if (categories.length > 0) {
      console.log('🔄 Hook useCategoryFilter - Categorías ya cargadas, skipping');
      return;
    }
    
    try {
      console.log('🚀 Hook useCategoryFilter - Iniciando carga de categorías');
      setIsLoading(true);
      setError(null);

      // NO abortar para categorías - se cargan una sola vez
      // Solo crear AbortController si no existe
      if (!categoriesAbortController.current) {
        categoriesAbortController.current = new AbortController();
      }

      const response = await fetch(`${API_BASE_URL}/api/products/categories`, {
        signal: categoriesAbortController.current.signal
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
        console.log('🎯 Hook useCategoryFilter - Cargando categorías:', allCategories);
        setCategories(allCategories);
        console.log('✅ Hook useCategoryFilter - Categorías establecidas, length:', allCategories.length);
        setIsLoading(false); // Mover aquí para evitar race condition
      } else {
        console.log('❌ Hook useCategoryFilter - API error:', data.message);
        setError(data.message || 'Error al cargar categorías');
        setIsLoading(false); // También aquí en caso de error
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Hook useCategoryFilter - Error catch:', error);
        setError(error.message);
        setIsLoading(false); // Mover aquí para errores reales
      } else {
        console.log('🚫 Hook useCategoryFilter - Request aborted');
      }
    } finally {
      // Solo limpiar el categoriesAbortController, no cambiar isLoading aquí
      if (categoriesAbortController.current && categoriesAbortController.current.signal.aborted) {
        console.log('🧹 Hook useCategoryFilter - Limpiando request abortado');
      }
    }
  };

  // Filtrar productos por categoría
  const filterProductsByCategory = async (categorySlug) => {
    if (!categorySlug) return;

    try {
      setIsLoading(true);
      setError(null);

      // Cancelar la solicitud anterior de productos si existe
      if (productsAbortController.current) {
        productsAbortController.current.abort();
      }

      // Crear un nuevo AbortController para productos
      productsAbortController.current = new AbortController();

      let endpoint = `${API_BASE_URL}/api/products/with-variants?limit=20`;
      
      if (categorySlug !== 'todas') {
        endpoint += `&categoria=${encodeURIComponent(categorySlug)}`;
      }

      const response = await fetch(endpoint, {
        signal: productsAbortController.current.signal
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
      if (productsAbortController.current && !productsAbortController.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();

    // Cleanup al desmontar - limpiar ambos controllers
    return () => {
      if (categoriesAbortController.current) {
        categoriesAbortController.current.abort();
      }
      if (productsAbortController.current) {
        productsAbortController.current.abort();
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
