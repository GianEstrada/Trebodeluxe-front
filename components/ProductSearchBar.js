// components/ProductSearchBar.js - Componente de barra de búsqueda en tiempo real

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useProductSearch from '../hooks/useProductSearch';

const ProductSearchBar = ({ 
  placeholder = 'Buscar productos...', 
  className = '', 
  onProductSelect,
  showDropdown = true,
  t, // Función de traducción pasada como prop
  formatPrice, // Función de formato de precio pasada como prop
  currentCurrency = 'MXN' // Moneda actual pasada como prop
}) => {
  
  const {
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
  } = useProductSearch();

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Manejar clics fuera del componente para cerrar el dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target)
      ) {
        hideResults();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hideResults]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && results.length > 0) {
      const firstResult = results[0];
      handleProductSelect(firstResult);
    } else if (e.key === 'Escape') {
      hideResults();
    }
  };

  const handleProductSelect = (product) => {
    const selectedProduct = selectResult(product);
    if (onProductSelect) {
      onProductSelect(selectedProduct);
    }
  };

  const handleClearSearch = () => {
    clearSearch();
    if (searchRef.current) {
      searchRef.current.focus();
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className={`relative w-full ${className}`} ref={searchRef}>
      {/* Input de búsqueda */}
      <div className="relative flex">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyPress}
          placeholder={t(placeholder)}
          className="w-auto min-w-0 flex-1 bg-white/20 border border-white/30 rounded-lg py-3 px-4 pr-20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
          autoComplete="off"
        />
        
        {/* Iconos del input */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {/* Indicador de carga */}
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          
          {/* Botón limpiar */}
          {query && !isLoading && (
            <button
              onClick={handleClearSearch}
              className="text-gray-300 hover:text-white transition-colors"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Icono de búsqueda */}
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && showResults && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/20 z-50 max-h-96 overflow-y-auto"
        >
          {error && (
            <div className="p-4 text-red-600 text-sm">
              {t('Error')}: {error}
            </div>
          )}
          
          {!error && results.length === 0 && query.trim().length >= 2 && !isLoading && (
            <div className="p-4 text-gray-600 text-sm">
              {t('No se encontraron productos para "{{query}}"').replace('{{query}}', query)}
            </div>
          )}
          
          {!error && results.length > 0 && (
            <>
              <div className="p-3 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-800">
                  {t('Resultados para "{{query}}"').replace('{{query}}', query)} ({results.length})
                </div>
              </div>
              
              {results.map((product) => (
                <Link
                  key={product.id_producto}
                  href={`/product/${product.id_producto}`}
                  className="block no-underline"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="p-3 hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      {/* Imagen del producto */}
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {product.imagen_url ? (
                          <Image
                            src={product.imagen_url}
                            alt={product.nombre || ''}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Información del producto */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {product.nombre}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {truncateText(product.descripcion, 60)}
                        </p>
                        {product.categoria_nombre && (
                          <p className="text-xs text-gray-500">
                            {t('Categoría')}: {product.categoria_nombre}
                          </p>
                        )}
                      </div>
                      
                      {/* Precio */}
                      {product.precio_minimo && (
                        <div className="text-right">
                          <div className="font-bold text-gray-900">
                            {formatPrice(product.precio_minimo, currentCurrency, 'MXN')}
                          </div>
                          {product.precio_maximo && product.precio_maximo !== product.precio_minimo && (
                            <div className="text-xs text-gray-500">
                              - {formatPrice(product.precio_maximo, currentCurrency, 'MXN')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* Ver todos los resultados */}
              <div className="p-3 border-t border-gray-200">
                <Link
                  href={`/catalogo?busqueda=${encodeURIComponent(query)}`}
                  className="block w-full text-center py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors no-underline"
                  onClick={hideResults}
                >
                  {t('Ver todos los resultados ({{count}})').replace('{{count}}', results.length)}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchBar;
