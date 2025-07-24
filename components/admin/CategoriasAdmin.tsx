import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  productos_count?: number;
}

interface CategoriasAdminProps {
  onCategoryChange?: () => void;
}

const CategoriasAdmin: React.FC<CategoriasAdminProps> = ({ onCategoryChange }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    orden: 0,
    activo: true
  });

  // Función helper para obtener token
  const getAuthToken = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      return userData.token;
    }
    return null;
  };

  // Cargar categorías
  const loadCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/categorias/admin?search=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setCategorias(data.categorias);
      }
    } catch (error) {
      console.error('Error loading categorias:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Cargar al inicio
  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

  // Manejar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      const token = getAuthToken();
      const url = editingCategoria 
        ? `https://trebodeluxe-backend.onrender.com/api/categorias/${editingCategoria.id_categoria}`
        : 'https://trebodeluxe-backend.onrender.com/api/categorias';
      
      const response = await fetch(url, {
        method: editingCategoria ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(editingCategoria ? 'Categoría actualizada' : 'Categoría creada');
        setShowForm(false);
        setEditingCategoria(null);
        setFormData({ nombre: '', descripcion: '', orden: 0, activo: true });
        loadCategorias();
        onCategoryChange?.();
      } else {
        alert(data.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving categoria:', error);
      alert('Error al guardar');
    }
  };

  // Editar categoría
  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      orden: categoria.orden,
      activo: categoria.activo
    });
    setShowForm(true);
  };

  // Eliminar categoría
  const handleDelete = async (categoria: Categoria) => {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/categorias/${categoria.id_categoria}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Categoría eliminada');
        loadCategorias();
        onCategoryChange?.();
      } else {
        alert(data.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting categoria:', error);
      alert('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">📁 Gestión de Categorías</h2>
        {loading && <div className="text-green-400">⏳ Cargando...</div>}
      </div>

      {/* Barra de búsqueda y botón agregar */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
          />
          <button
            onClick={loadCategorias}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            🔍 Buscar
          </button>
          <button
            onClick={() => {
              setEditingCategoria(null);
              setFormData({ nombre: '', descripcion: '', orden: 0, activo: true });
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            + Agregar Categoría
          </button>
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorias.map((categoria) => (
          <div key={categoria.id_categoria} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">{categoria.nombre}</h3>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded ${categoria.activo ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                  {categoria.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
            
            {categoria.descripcion && (
              <p className="text-gray-300 text-sm mb-4">{categoria.descripcion}</p>
            )}
            
            <div className="text-sm text-gray-400 mb-4">
              <p>Orden: {categoria.orden}</p>
              <p>Productos: {categoria.productos_count || 0}</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(categoria)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDelete(categoria)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                disabled={(categoria.productos_count || 0) > 0}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({...prev, nombre: e.target.value}))}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-blue-400/50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({...prev, descripcion: e.target.value}))}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-blue-400/50 focus:outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData(prev => ({...prev, orden: parseInt(e.target.value) || 0}))}
                  className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white focus:border-blue-400/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData(prev => ({...prev, activo: e.target.checked}))}
                    className="mr-2"
                  />
                  Categoría activa
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  💾 Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriasAdmin;
