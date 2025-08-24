// components/CategoryFilter.js - Componente de filtro por categoría instantáneo

import React, { useRef, useEffect, useState } from 'react';
import useCategoryFilter from '../hooks/useCategoryFilter';

const CategoryFilter = ({ 
  className = '', 
  onFilterChange,
  t, // Función de traducción pasada como prop
  showProductCount = true 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const {
    categories,
    selectedCategory,
    selectCategory,
    filteredProducts,
    isLoading,
    error
  } = useCategoryFilter();

  // DEBUG: Log cada render del componente
  console.log('🔥 CategoryFilter RENDER:', {
    categories_length: categories.length,
    categories_data: categories,
    isLoading,
    error,
    selectedCategory
  });

  // Manejar clics fuera del componente para cerrar el dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategorySelect = (categorySlug) => {
    selectCategory(categorySlug);
    setIsDropdownOpen(false);
    
    // Notificar al componente padre sobre el cambio
    if (onFilterChange) {
      onFilterChange({
        category: categorySlug,
        products: filteredProducts
      });
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const getSelectedCategoryName = () => {
    const category = categories.find(cat => cat.slug === selectedCategory || cat.id === selectedCategory);
    if (category) {
      const categoryName = category.name || category.nombre || 'Categoría sin nombre';
      return t(categoryName);
    }
    return t('Todas las categorías');
  };

  const handleKeyDown = (e, categorySlug) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCategorySelect(categorySlug);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Botón de filtro */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="w-full bg-white/20 border border-white/30 rounded-lg py-3 px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 flex items-center justify-between hover:bg-white/25"
        aria-haspopup="true"
        aria-expanded={isDropdownOpen}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          <span className="truncate">
            {getSelectedCategoryName()}
            {showProductCount && filteredProducts.length > 0 && (
              <span className="ml-2 text-sm text-gray-300">({filteredProducts.length})</span>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Indicador de carga */}
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          
          {/* Flecha del dropdown */}
          <svg 
            className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${
              isDropdownOpen ? 'transform rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown de categorías */}
      {isDropdownOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/20 z-50 max-h-80 overflow-hidden"
        >
          {/* Header del dropdown */}
          <div className="p-3 border-b border-gray-200 bg-gray-50/90">
            <div className="text-sm font-medium text-gray-800">
              {t('Filtrar por categoría')}
            </div>
          </div>
          
          {/* Lista de categorías */}
          <div className="overflow-y-auto max-h-64">
            {isLoading && (
              <div className="p-4 text-gray-600 text-sm flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('Cargando categorías...')}
              </div>
            )}
            
            {error && !isLoading && (
              <div className="p-4 text-red-600 text-sm">
                {t('Error')}: {error}
              </div>
            )}
            
            {!error && !isLoading && categories.length === 0 && (
              <div className="p-4 text-gray-600 text-sm">
                {console.log('� ACTIVADO: "No hay categorías" - categories:', categories, 'length:', categories.length, 'isLoading:', isLoading, 'error:', error)}
                {t('No hay categorías disponibles')}
              </div>
            )}
            
            {!error && !isLoading && categories.length > 0 && (
              <div className="py-2">
                {console.log('✅ ACTIVADO: Mostrar lista - categories:', categories, 'length:', categories.length)}
                {categories.map((category) => (
                  <button
                    key={category.id || category.slug}
                    onClick={() => handleCategorySelect(category.slug || category.id)}
                    onKeyDown={(e) => handleKeyDown(e, category.slug || category.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      (selectedCategory === category.slug || selectedCategory === category.id) 
                        ? 'bg-green-50 text-green-800 font-medium' 
                        : 'text-gray-800'
                    }`}
                    role="option"
                    aria-selected={selectedCategory === (category.slug || category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{t(category.name || category.nombre || 'Categoría sin nombre')}</span>
                      {(selectedCategory === category.slug || selectedCategory === category.id) && (
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {/* Mostrar descripción si está disponible */}
                    {(category.description || category.descripcion) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {category.description || category.descripcion}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer del dropdown */}
          {selectedCategory !== 'todas' && (
            <div className="p-3 border-t border-gray-200 bg-gray-50/90">
              <button
                onClick={() => handleCategorySelect('todas')}
                className="w-full text-center py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                {t('Limpiar filtro')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
