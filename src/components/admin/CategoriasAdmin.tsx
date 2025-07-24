import React, { useState, useEffect } from 'react';

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface FormData {
  nombre: string;
  descripcion: string;
  activo: boolean;
  orden: number;
}

const CategoriasAdmin: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    activo: true,
    orden: 0
  });
  const [productosCount, setProductosCount] = useState<{[key: number]: number}>({});

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/categorias', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar categorías');
      }

      const data = await response.json();
      setCategorias(data.data);

      // Obtener conteo de productos para cada categoría
      const countPromises = data.data.map(async (categoria: Categoria) => {
        try {
          const countResponse = await fetch(`/api/admin/categorias/${categoria.id_categoria}/productos`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (countResponse.ok) {
            const countData = await countResponse.json();
            return { id: categoria.id_categoria, count: countData.total };
          }
          return { id: categoria.id_categoria, count: 0 };
        } catch {
          return { id: categoria.id_categoria, count: 0 };
        }
      });

      const counts = await Promise.all(countPromises);
      const countMap = counts.reduce((acc, { id, count }) => {
        acc[id] = count;
        return acc;
      }, {} as {[key: number]: number});

      setProductosCount(countMap);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCategoria 
        ? `/api/admin/categorias/${editingCategoria.id_categoria}`
        : '/api/admin/categorias';
      
      const method = editingCategoria ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar categoría');
      }

      await fetchCategorias();
      resetForm();
      setShowForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      activo: categoria.activo,
      orden: categoria.orden
    });
    setShowForm(true);
  };

  const handleDelete = async (categoria: Categoria) => {
    if (productosCount[categoria.id_categoria] > 0) {
      alert(`No se puede eliminar la categoría "${categoria.nombre}" porque tiene ${productosCount[categoria.id_categoria]} productos asociados.`);
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/categorias/${categoria.id_categoria}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar categoría');
      }

      await fetchCategorias();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      activo: true,
      orden: 0
    });
    setEditingCategoria(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setError(null);
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-gray-600">Administra las categorías de productos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva Categoría
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Camisetas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden
                </label>
                <input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({...formData, orden: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descripción de la categoría..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
                Categoría activa
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCategoria ? 'Actualizar' : 'Crear'} Categoría
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Categorías */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Categorías ({categorias.length})</h2>
        </div>

        {categorias.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay categorías registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categorias.map((categoria) => (
                  <tr key={categoria.id_categoria}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{categoria.nombre}</div>
                      <div className="text-sm text-gray-500">ID: {categoria.id_categoria}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {categoria.descripcion || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {productosCount[categoria.id_categoria] || 0} productos
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        categoria.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {categoria.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {categoria.orden}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(categoria)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(categoria)}
                        className="text-red-600 hover:text-red-900"
                        disabled={productosCount[categoria.id_categoria] > 0}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriasAdmin;
