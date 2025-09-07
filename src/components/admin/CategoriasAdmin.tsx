import React, { useState, useEffect } from 'react';

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  productos_count?: number;
  // Nuevos campos para SkyDropX
  alto_cm: number;
  largo_cm: number;
  ancho_cm: number;
  peso_kg: number;
  nivel_compresion: 'bajo' | 'medio' | 'alto';
  hs_code?: string; // Código del Sistema Armonizado para envíos internacionales
}

interface FormData {
  nombre: string;
  descripcion: string;
  activo: boolean;
  orden: number;
  // Nuevos campos para SkyDropX
  alto_cm: number;
  largo_cm: number;
  ancho_cm: number;
  peso_kg: number;
  nivel_compresion: 'bajo' | 'medio' | 'alto';
  hs_code: string; // Código HS para clasificación arancelaria
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
    orden: 0,
    // Valores por defecto para SkyDropX
    alto_cm: 0,
    largo_cm: 0,
    ancho_cm: 0,
    peso_kg: 0,
    nivel_compresion: 'medio',
    hs_code: '' // Código HS por defecto vacío
  });

  // Configurar URL base del backend
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      let token = localStorage.getItem('adminToken');
      console.log('🔑 Token found:', token ? 'Yes' : 'No');
      
      // Intentar primero con el endpoint con auth
      let response;
      let data;
      
      if (token) {
        try {
          response = await fetch(`${API_BASE_URL}/api/categorias/admin`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            data = await response.json();
            console.log('✅ Authenticated endpoint succeeded');
          } else {
            console.log('❌ Authenticated endpoint failed:', response.status);
            throw new Error('Auth failed');
          }
        } catch (authError) {
          console.log('⚠️ Auth endpoint failed, trying temp endpoint...');
          // Fallback al endpoint temporal
          response = await fetch(`${API_BASE_URL}/api/categorias/admin-temp`);
          if (!response.ok) {
            throw new Error('Error al cargar categorías');
          }
          data = await response.json();
          console.log('✅ Temporary endpoint succeeded');
        }
      } else {
        console.log('⚠️ No token found, using temp endpoint...');
        // Usar endpoint temporal directamente
        response = await fetch(`${API_BASE_URL}/api/categorias/admin-temp`);
        if (!response.ok) {
          throw new Error('Error al cargar categorías');
        }
        data = await response.json();
        console.log('✅ Temporary endpoint succeeded');
      }

      setCategorias(data.categorias || []);
      
      // Mostrar información de diagnóstico
      if (data.skydropx_columns_status) {
        console.log('📊 SkyDropX Columns Status:', data.skydropx_columns_status);
      }
      
      if (data.temp_endpoint) {
        console.log('⚠️ Using temporary endpoint - authentication may need to be fixed');
      }

    } catch (error) {
      console.error('❌ Error loading categories:', error);
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
        ? `${API_BASE_URL}/api/categorias/${editingCategoria.id_categoria}`
        : `${API_BASE_URL}/api/categorias`;
      
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
      orden: categoria.orden,
      alto_cm: categoria.alto_cm || 0,
      largo_cm: categoria.largo_cm || 0,
      ancho_cm: categoria.ancho_cm || 0,
      peso_kg: categoria.peso_kg || 0,
      nivel_compresion: categoria.nivel_compresion || 'medio',
      hs_code: categoria.hs_code || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (categoria: Categoria) => {
    if ((categoria.productos_count || 0) > 0) {
      alert(`No se puede eliminar la categoría "${categoria.nombre}" porque tiene ${categoria.productos_count} productos asociados.`);
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/categorias/${categoria.id_categoria}`, {
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
      orden: 0,
      alto_cm: 0,
      largo_cm: 0,
      ancho_cm: 0,
      peso_kg: 0,
      nivel_compresion: 'medio',
      hs_code: ''
    });
    setEditingCategoria(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setError(null);
  };

  const calcularDimensionesEnvio = async (idCategoria: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categorias/${idCategoria}/dimensiones-envio`);
      
      if (!response.ok) {
        throw new Error('Error al calcular dimensiones');
      }

      const data = await response.json();
      const dimensiones = data.dimensiones;
      
      alert(`Dimensiones de envío calculadas:
      
Alto: ${dimensiones.alto_total} cm
Largo: ${dimensiones.largo_total} cm  
Ancho: ${dimensiones.ancho_total} cm
Peso: ${dimensiones.peso_total} kg
Compresión: ${dimensiones.compresion}
      
Volumen: ${(dimensiones.alto_total * dimensiones.largo_total * dimensiones.ancho_total / 1000).toFixed(2)} litros`);
    } catch (error) {
      alert(`Error al calcular dimensiones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                {editingCategoria ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Incluye configuración de dimensiones para envíos SkyDropX
              </p>
            </div>
          </div>
          
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

            {/* Sección de SkyDropX */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📦</span> Configuración de Envío SkyDropX
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      📏 Alto (cm)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.alto_cm}
                    onChange={(e) => setFormData({...formData, alto_cm: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 10.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Altura del producto empacado</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      📐 Largo (cm)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.largo_cm}
                    onChange={(e) => setFormData({...formData, largo_cm: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 25.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Largo del producto empacado</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      📏 Ancho (cm)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.ancho_cm}
                    onChange={(e) => setFormData({...formData, ancho_cm: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 15.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ancho del producto empacado</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      ⚖️ Peso (kg)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.peso_kg}
                    onChange={(e) => setFormData({...formData, peso_kg: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 0.25"
                  />
                  <p className="text-xs text-gray-500 mt-1">Peso aproximado del producto</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      🗜️ Nivel de Compresión
                    </span>
                  </label>
                  <select
                    value={formData.nivel_compresion}
                    onChange={(e) => setFormData({...formData, nivel_compresion: e.target.value as 'bajo' | 'medio' | 'alto'})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bajo">🔸 Bajo - Rígido (zapatos, electrónicos)</option>
                    <option value="medio">🔹 Medio - Semi-flexible (pantalones, chaquetas)</option>
                    <option value="alto">🔻 Alto - Muy comprimible (camisetas, ropa interior)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Qué tanto se puede comprimir el producto</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      🏛️ Código HS (Sistema Armonizado)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.hs_code}
                    onChange={(e) => setFormData({...formData, hs_code: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 6109.10.00"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Código arancelario para envíos internacionales. 
                    <a 
                      href="https://www.codigosarancelarios.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      Consultar códigos HS ↗
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">💡</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Información importante:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Estas dimensiones se usarán para calcular automáticamente el costo de envío</li>
                      <li>• SkyDropX agregará automáticamente el margen de empaque</li>
                      <li>• El nivel de compresión afecta el volumen final del paquete</li>
                      <li>• El código HS es obligatorio para envíos internacionales fuera de México</li>
                    </ul>
                  </div>
                </div>
              </div>
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
                    📦 Dimensiones (cm)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ⚖️ Peso (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🗜️ Compresión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🏛️ Código HS
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
                      <div className="font-medium text-gray-900 flex items-center">
                        {categoria.nombre}
                        {(categoria.alto_cm > 0 || categoria.largo_cm > 0 || categoria.ancho_cm > 0 || categoria.peso_kg > 0) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            📦 SkyDropX
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">ID: {categoria.id_categoria}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {categoria.descripcion || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {categoria.productos_count || 0} productos
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{categoria.alto_cm || 0} × {categoria.largo_cm || 0} × {categoria.ancho_cm || 0} cm</div>
                        <div className="text-xs text-gray-500">
                          Vol: {((categoria.alto_cm || 0) * (categoria.largo_cm || 0) * (categoria.ancho_cm || 0) / 1000).toFixed(2)}L
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{categoria.peso_kg || 0} kg</div>
                      <div className="text-xs text-gray-500">
                        {categoria.peso_kg > 0 ? 'Configurado' : 'Sin peso'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        categoria.nivel_compresion === 'alto' 
                          ? 'bg-green-100 text-green-800' 
                          : categoria.nivel_compresion === 'medio'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {categoria.nivel_compresion === 'alto' ? '🔻 Alto' :
                         categoria.nivel_compresion === 'medio' ? '🔹 Medio' : '🔸 Bajo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {categoria.hs_code ? (
                          <div>
                            <div className="font-mono font-medium">{categoria.hs_code}</div>
                            <div className="text-xs text-gray-500">Configurado</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-gray-400 italic">Sin código</div>
                            <div className="text-xs text-red-500">⚠️ Requerido para envíos internacionales</div>
                          </div>
                        )}
                      </div>
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
                      {(categoria.alto_cm > 0 || categoria.largo_cm > 0 || categoria.ancho_cm > 0) && (
                        <button
                          onClick={() => calcularDimensionesEnvio(categoria.id_categoria)}
                          className="text-green-600 hover:text-green-900"
                          title="Calcular dimensiones de envío"
                        >
                          📐 Calcular
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(categoria)}
                        className="text-red-600 hover:text-red-900"
                        disabled={(categoria.productos_count || 0) > 0}
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
