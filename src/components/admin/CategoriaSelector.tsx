import React from 'react';
import { useCategorias } from '../../hooks/useCategorias';

interface CategoriaSelectorProps {
  value?: number | null;
  onChange: (categoriaId: number | null) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const CategoriaSelector: React.FC<CategoriaSelectorProps> = ({
  value,
  onChange,
  required = false,
  placeholder = "Seleccionar categoría",
  className = ""
}) => {
  const { categorias, loading, error } = useCategorias();
  
  // Debug logging
  console.log('🔍 [CategoriaSelector] Render state:', {
    categorias: categorias.length,
    loading,
    error,
    value
  });

  if (loading) {
    console.log('⏳ [CategoriaSelector] Still loading...');
    return (
      <select 
        disabled 
        className={`w-full p-3 border border-gray-300 rounded-lg bg-gray-100 ${className}`}
      >
        <option>Cargando categorías...</option>
      </select>
    );
  }

  if (error) {
    console.error('❌ [CategoriaSelector] Error state:', error);
    return (
      <div className="text-red-600 text-sm">
        Error al cargar categorías: {error}
      </div>
    );
  }

  const categoriasActivas = categorias.filter(cat => cat.activo);
  console.log('🔍 [CategoriaSelector] Active categories:', categoriasActivas.length);

  return (
    <select
      value={value || ''}
      onChange={(e) => {
        const selectedValue = e.target.value;
        onChange(selectedValue ? parseInt(selectedValue) : null);
      }}
      required={required}
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    >
      <option value="">{placeholder}</option>
      {categoriasActivas
        .sort((a, b) => a.orden - b.orden)
        .map((categoria) => (
          <option key={categoria.id_categoria} value={categoria.id_categoria}>
            {categoria.nombre}
          </option>
        ))}
    </select>
  );
};

export default CategoriaSelector;
