// hooks/useProductSearch.js - Hook personalizado para búsqueda de productos en tiempo real

import { useState, useEffect, useRef } from 'react';
import { productsApi } from '../utils/productsApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

const useProductSearch = (initialQuery = '', delay = 300) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  // Referencia para cancelar solicitudes anteriores
  const searchTimeout = useRef(null);
  const abortController = useRef(null);

  const search = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Cancelar la solicitud anterior si existe
      if (abortController.current) {
        abortController.current.abort();
      }

      // Crear un nuevo AbortController para esta solicitud
      abortController.current = new AbortController();

      // Llamar a la API usando el endpoint de búsqueda
      const response = await fetch(`${API_BASE_URL}/api/products/search?q=${encodeURIComponent(searchTerm)}&limit=10`, {
        signal: abortController.current.signal
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setResults(data.products || []);
        setShowResults(true);
      } else {
        setError(data.message || 'Error en la búsqueda');
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error en búsqueda:', error);
        setError(error.message);
        setResults([]);
        setShowResults(false);
      }
    } finally {
      if (abortController.current && !abortController.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    // Limpiar el timeout anterior
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Si la consulta está vacía, limpiar resultados inmediatamente
    if (!query || query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      setIsLoading(false);
      return;
    }

    // Configurar el nuevo timeout
    searchTimeout.current = setTimeout(() => {
      search(query.trim());
    }, delay);

    // Cleanup function
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, delay]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError(null);
    setIsLoading(false);
  };

  const hideResults = () => {
    setShowResults(false);
  };

  const selectResult = (product) => {
    setQuery(product.nombre || '');
    setShowResults(false);
    return product;
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    showResults,
    clearSearch,
    hideResults,
    selectResult,
    setShowResults
  };
};

export default useProductSearch;
