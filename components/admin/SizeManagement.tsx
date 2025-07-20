// components/admin/SizeManagement.tsx - Componente para gestión de tallas y sistemas de tallas

import React, { useState, useEffect } from 'react';
import { sizesApi } from '../../utils/sizesApi.js';
import { useAuth } from '../../contexts/AuthContext';

// Interfaces para respuestas de API
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  size_systems?: SizeSystem[];
  sizes?: Size[];
  error?: string;
}

interface SizeSystem {
  id_sistema_talla: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fecha_creacion: string;
  total_tallas: number;
}

interface Size {
  id_talla: number;
  id_sistema_talla: number;
  nombre_talla: string;
  abreviacion?: string;
  orden: number;
  activo: boolean;
  sistema_nombre?: string;
}

const SizeManagement: React.FC = () => {
  const { user } = useAuth();
  const [sizeSystems, setSizeSystems] = useState<SizeSystem[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<SizeSystem | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [showSystemForm, setShowSystemForm] = useState(false);
  const [showSizeForm, setShowSizeForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formularios
  const [systemForm, setSystemForm] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });

  const [sizeForm, setSizeForm] = useState({
    id_sistema_talla: '',
    nombre_talla: '',
    abreviacion: '',
    orden: '',
    activo: true
  });

  useEffect(() => {
    if (user?.token) {
      loadSizeSystems();
      loadSizes();
    }
  }, [user]);

  const loadSizeSystems = async () => {
    try {
      setLoading(true);
      const response = await sizesApi.getAllSystems() as ApiResponse<SizeSystem[]>;
      if (response.success && response.size_systems) {
        setSizeSystems(response.size_systems);
      } else if (response.data && Array.isArray(response.data)) {
        setSizeSystems(response.data);
      }
    } catch (error) {
      console.error('Error cargando sistemas de tallas:', error);
      setError('Error al cargar sistemas de tallas');
    } finally {
      setLoading(false);
    }
  };

  const loadSizes = async () => {
    try {
      const response = await sizesApi.getAll() as ApiResponse<Size[]>;
      if (response.success && response.sizes) {
        setSizes(response.sizes);
      } else if (response.data && Array.isArray(response.data)) {
        setSizes(response.data);
      }
    } catch (error) {
      console.error('Error cargando tallas:', error);
      setError('Error al cargar tallas');
    }
  };

  // Gestión de sistemas de tallas
  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.token) {
      setError('No hay token de autenticación');
      return;
    }
    
    try {
      let response: ApiResponse;
      if (selectedSystem) {
        response = await sizesApi.updateSystem(selectedSystem.id_sistema_talla, systemForm, user.token) as ApiResponse;
      } else {
        response = await sizesApi.createSystem(systemForm, user.token) as ApiResponse;
      }

      if (response.success) {
        setShowSystemForm(false);
        setSelectedSystem(null);
        setSystemForm({
          nombre: '',
          descripcion: '',
          activo: true
        });
        loadSizeSystems();
      } else {
        setError(response.message || 'Error al guardar sistema de tallas');
      }
    } catch (error) {
      console.error('Error guardando sistema de tallas:', error);
      setError('Error al guardar sistema de tallas');
    }
  };

  const handleEditSystem = (system: SizeSystem) => {
    setSelectedSystem(system);
    setSystemForm({
      nombre: system.nombre,
      descripcion: system.descripcion || '',
      activo: system.activo
    });
    setShowSystemForm(true);
  };

  const handleDeleteSystem = async (systemId: number) => {
    if (!user?.token) {
      setError('No hay token de autenticación');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar este sistema de tallas?')) {
      try {
        const response = await sizesApi.deleteSystem(systemId, user.token) as ApiResponse;
        if (response.success) {
          loadSizeSystems();
        } else {
          setError(response.message || 'Error al eliminar sistema de tallas');
        }
      } catch (error) {
        console.error('Error eliminando sistema de tallas:', error);
        setError('Error al eliminar sistema de tallas');
      }
    }
  };

  // Gestión de tallas
  const handleSizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.token) {
      setError('No hay token de autenticación');
      return;
    }
    
    try {
      const sizeData = {
        ...sizeForm,
        id_sistema_talla: parseInt(sizeForm.id_sistema_talla),
        orden: parseInt(sizeForm.orden)
      };

      let response: ApiResponse;
      if (selectedSize) {
        response = await sizesApi.updateSize(selectedSize.id_talla, sizeData, user.token) as ApiResponse;
      } else {
        response = await sizesApi.createSize(sizeData, user.token) as ApiResponse;
      }

      if (response.success) {
        setShowSizeForm(false);
        setSelectedSize(null);
        setSizeForm({
          id_sistema_talla: '',
          nombre_talla: '',
          abreviacion: '',
          orden: '',
          activo: true
        });
        loadSizes();
      } else {
        setError(response.message || 'Error al guardar talla');
      }
    } catch (error) {
      console.error('Error guardando talla:', error);
      setError('Error al guardar talla');
    }
  };

  const handleEditSize = (size: Size) => {
    setSelectedSize(size);
    setSizeForm({
      id_sistema_talla: size.id_sistema_talla.toString(),
      nombre_talla: size.nombre_talla,
      abreviacion: size.abreviacion || '',
      orden: size.orden.toString(),
      activo: size.activo
    });
    setShowSizeForm(true);
  };

  const handleDeleteSize = async (sizeId: number) => {
    if (!user?.token) {
      setError('No hay token de autenticación');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar esta talla?')) {
      try {
        const response = await sizesApi.deleteSize(sizeId, user.token) as ApiResponse;
        if (response.success) {
          loadSizes();
        } else {
          setError(response.message || 'Error al eliminar talla');
        }
      } catch (error) {
        console.error('Error eliminando talla:', error);
        setError('Error al eliminar talla');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestión de Tallas</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Sistemas de Tallas */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Sistemas de Tallas</h3>
          <button
            onClick={() => {
              setSelectedSystem(null);
              setSystemForm({
                nombre: '',
                descripcion: '',
                activo: true
              });
              setShowSystemForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Agregar Sistema
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tallas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sizeSystems.map((system) => (
                <tr key={system.id_sistema_talla}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {system.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {system.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {system.total_tallas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      system.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {system.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditSystem(system)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteSystem(system.id_sistema_talla)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tallas */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Tallas</h3>
          <button
            onClick={() => {
              setSelectedSize(null);
              setSizeForm({
                id_sistema_talla: '',
                nombre_talla: '',
                abreviacion: '',
                orden: '',
                activo: true
              });
              setShowSizeForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Agregar Talla
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abreviación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sistema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sizes.map((size) => (
                <tr key={size.id_talla}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {size.nombre_talla}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {size.abreviacion || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {size.sistema_nombre || `Sistema ${size.id_sistema_talla}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {size.orden}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      size.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {size.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditSize(size)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteSize(size.id_talla)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Sistema de Tallas */}
      {showSystemForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedSystem ? 'Editar Sistema de Tallas' : 'Agregar Sistema de Tallas'}
            </h3>
            <form onSubmit={handleSystemSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={systemForm.nombre}
                  onChange={(e) => setSystemForm({...systemForm, nombre: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Descripción
                </label>
                <textarea
                  value={systemForm.descripcion}
                  onChange={(e) => setSystemForm({...systemForm, descripcion: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={systemForm.activo}
                    onChange={(e) => setSystemForm({...systemForm, activo: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowSystemForm(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {selectedSystem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Tallas */}
      {showSizeForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedSize ? 'Editar Talla' : 'Agregar Talla'}
            </h3>
            <form onSubmit={handleSizeSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Sistema de Tallas *
                </label>
                <select
                  value={sizeForm.id_sistema_talla}
                  onChange={(e) => setSizeForm({...sizeForm, id_sistema_talla: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Seleccionar sistema...</option>
                  {sizeSystems.map((system) => (
                    <option key={system.id_sistema_talla} value={system.id_sistema_talla}>
                      {system.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nombre de Talla *
                </label>
                <input
                  type="text"
                  value={sizeForm.nombre_talla}
                  onChange={(e) => setSizeForm({...sizeForm, nombre_talla: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Abreviación
                </label>
                <input
                  type="text"
                  value={sizeForm.abreviacion}
                  onChange={(e) => setSizeForm({...sizeForm, abreviacion: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Orden *
                </label>
                <input
                  type="number"
                  value={sizeForm.orden}
                  onChange={(e) => setSizeForm({...sizeForm, orden: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  min="1"
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sizeForm.activo}
                    onChange={(e) => setSizeForm({...sizeForm, activo: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowSizeForm(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {selectedSize ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SizeManagement;
