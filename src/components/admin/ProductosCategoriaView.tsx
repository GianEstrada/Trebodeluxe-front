import React, { useState } from 'react';
import { useCategorias } from '../../hooks/useCategorias';
import { useProductosConCategorias } from '../../hooks/useProductosConCategorias';
import CategoriaSelector from './CategoriaSelector';

interface ProductosCategoriaViewProps {
  currentLanguage: string;
}

const ProductosCategoriaView: React.FC<ProductosCategoriaViewProps> = ({ currentLanguage }) => {
  const { categorias, loading: categoriasLoading } = useCategorias();
  const { productos, loading: productosLoading, error, updateProductCategoria } = useProductosConCategorias();
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);

  const handleCategoriaChange = async (productId: number, categoriaId: number | null) => {
    if (categoriaId) {
      const success = await updateProductCategoria(productId, categoriaId);
      if (success) {
        setEditingProduct(null);
      }
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return 'Sin precio';
    return `$${price.toFixed(2)}`;
  };

  // Filtrar productos
  const productosFiltrados = filtroCategoria 
    ? productos.filter(p => p.id_categoria === filtroCategoria)
    : productos;

  // Agrupar productos por categoría
  const productosAgrupados = categorias.reduce((acc, categoria) => {
    acc[categoria.id_categoria] = productos.filter(p => p.id_categoria === categoria.id_categoria);
    return acc;
  }, {} as {[key: number]: any[]});

  // Productos sin categoría
  const productosSinCategoria = productos.filter(p => !p.id_categoria);

  if (categoriasLoading || productosLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos por Categoría</h1>
          <p className="text-gray-600">Gestiona la asignación de productos a categorías</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={filtroCategoria || ''}
            onChange={(e) => setFiltroCategoria(e.target.value ? parseInt(e.target.value) : null)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(categoria => (
              <option key={categoria.id_categoria} value={categoria.id_categoria}>
                {categoria.nombre}
              </option>
            ))}
            <option value="sin-categoria">Sin categoría</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800">Total Productos</h3>
          <p className="text-2xl font-bold text-blue-900">{productos.length}</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800">Con Categoría</h3>
          <p className="text-2xl font-bold text-green-900">
            {productos.filter(p => p.id_categoria).length}
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800">Sin Categoría</h3>
          <p className="text-2xl font-bold text-yellow-900">{productosSinCategoria.length}</p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-800">Categorías Activas</h3>
          <p className="text-2xl font-bold text-purple-900">
            {categorias.filter(c => c.activo).length}
          </p>
        </div>
      </div>

      {/* Vista por categorías */}
      {!filtroCategoria && (
        <div className="space-y-6">
          {/* Productos sin categoría */}
          {productosSinCategoria.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-4">
                Productos sin categoría ({productosSinCategoria.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productosSinCategoria.map(producto => (
                  <div key={producto.id_producto} className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                    <p className="text-sm text-gray-600 mb-2">{producto.marca}</p>
                    <p className="text-sm font-medium text-green-600 mb-3">
                      {formatPrice(producto.precio_base)}
                    </p>
                    
                    {editingProduct === producto.id_producto ? (
                      <div className="space-y-2">
                        <CategoriaSelector
                          value={null}
                          onChange={(categoriaId) => handleCategoriaChange(producto.id_producto, categoriaId)}
                          placeholder="Asignar categoría"
                          required
                        />
                        <button
                          onClick={() => setEditingProduct(null)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingProduct(producto.id_producto)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Asignar categoría
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productos por categoría */}
          {categorias.map(categoria => {
            const productosCategoria = productosAgrupados[categoria.id_categoria] || [];
            
            return (
              <div key={categoria.id_categoria} className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">
                      {categoria.nombre} ({productosCategoria.length} productos)
                    </h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      categoria.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {categoria.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {categoria.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">{categoria.descripcion}</p>
                  )}
                </div>

                {productosCategoria.length > 0 ? (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productosCategoria.map(producto => (
                        <div key={producto.id_producto} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                          <p className="text-sm text-gray-600">{producto.marca}</p>
                          <p className="text-sm font-medium text-green-600 mb-2">
                            {formatPrice(producto.precio_base)}
                          </p>
                          
                          {editingProduct === producto.id_producto ? (
                            <div className="space-y-2">
                              <CategoriaSelector
                                value={producto.id_categoria}
                                onChange={(categoriaId) => handleCategoriaChange(producto.id_producto, categoriaId)}
                                placeholder="Cambiar categoría"
                              />
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingProduct(producto.id_producto)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Cambiar categoría
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No hay productos en esta categoría
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vista filtrada */}
      {filtroCategoria && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Productos filtrados ({productosFiltrados.length})
            </h2>
          </div>

          {productosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Base
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosFiltrados.map(producto => (
                    <tr key={producto.id_producto}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{producto.nombre}</div>
                        <div className="text-sm text-gray-500">{producto.descripcion}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.marca}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatPrice(producto.precio_base)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {producto.categoria_nombre || producto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setEditingProduct(producto.id_producto)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Cambiar categoría
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No hay productos en el filtro seleccionado
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductosCategoriaView;
