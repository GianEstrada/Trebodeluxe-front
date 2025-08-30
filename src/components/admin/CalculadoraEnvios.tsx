import React, { useState, useEffect } from 'react';

interface Categoria {
  id_categoria: number;
  nombre: string;
  alto_cm: number;
  largo_cm: number;
  ancho_cm: number;
  peso_kg: number;
  nivel_compresion: string;
}

interface DimensionesEnvio {
  alto_total: number;
  largo_total: number;
  ancho_total: number;
  peso_total: number;
  compresion: string;
}

const CalculadoraEnvios: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [dimensionesCalculadas, setDimensionesCalculadas] = useState<DimensionesEnvio | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/categorias/admin', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar categorías');
      }

      const data = await response.json();
      setCategorias(data.categorias);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const calcularDimensiones = async (idCategoria: number) => {
    setCalculando(true);
    setError(null);

    try {
      const response = await fetch(`/api/categorias/${idCategoria}/dimensiones-envio`);

      if (!response.ok) {
        throw new Error('Error al calcular dimensiones');
      }

      const data = await response.json();
      setDimensionesCalculadas(data.dimensiones);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setCalculando(false);
    }
  };

  const handleCategoriaChange = (idCategoria: number) => {
    setCategoriaSeleccionada(idCategoria);
    setDimensionesCalculadas(null);
    calcularDimensiones(idCategoria);
  };

  const getCompresionColor = (compresion: string) => {
    switch (compresion) {
      case 'alto': return 'bg-green-100 text-green-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'bajo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categoriaActual = categorias.find(c => c.id_categoria === categoriaSeleccionada);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calculadora de Envíos</h1>
        <p className="text-gray-600">Calcula las dimensiones finales de envío para cada categoría</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selector de Categoría */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Seleccionar Categoría</h2>
          
          <select
            value={categoriaSeleccionada || ''}
            onChange={(e) => handleCategoriaChange(parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una categoría...</option>
            {categorias.map(categoria => (
              <option key={categoria.id_categoria} value={categoria.id_categoria}>
                {categoria.nombre}
              </option>
            ))}
          </select>

          {categoriaActual && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Dimensiones Base</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>📏 <strong>Dimensiones:</strong> {categoriaActual.alto_cm} × {categoriaActual.largo_cm} × {categoriaActual.ancho_cm} cm</div>
                <div>⚖️ <strong>Peso:</strong> {categoriaActual.peso_kg} kg</div>
                <div>🗜️ <strong>Compresión:</strong> 
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${getCompresionColor(categoriaActual.nivel_compresion)}`}>
                    {categoriaActual.nivel_compresion}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultado del Cálculo */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Dimensiones de Envío Calculadas</h2>
          
          {calculando ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Calculando...</span>
            </div>
          ) : dimensionesCalculadas ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Alto Final</div>
                  <div className="text-lg font-bold text-blue-900">{dimensionesCalculadas.alto_total} cm</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Largo Final</div>
                  <div className="text-lg font-bold text-green-900">{dimensionesCalculadas.largo_total} cm</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Ancho Final</div>
                  <div className="text-lg font-bold text-purple-900">{dimensionesCalculadas.ancho_total} cm</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">Peso Final</div>
                  <div className="text-lg font-bold text-orange-900">{dimensionesCalculadas.peso_total} kg</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">🧮 Detalles del Cálculo</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>✅ Se agregó margen de empaque automáticamente</div>
                  <div>✅ Se agregó peso del empaque</div>
                  <div>✅ Nivel de compresión: <strong>{dimensionesCalculadas.compresion}</strong></div>
                  <div>📦 Volumen total: <strong>{(dimensionesCalculadas.alto_total * dimensionesCalculadas.largo_total * dimensionesCalculadas.ancho_total / 1000).toFixed(2)} litros</strong></div>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Tip:</strong> Estas son las dimensiones finales que se enviarán a SkyDropX 
                  para calcular el costo de envío.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Selecciona una categoría para calcular las dimensiones de envío
            </div>
          )}
        </div>
      </div>

      {/* Tabla de todas las categorías */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Resumen de Todas las Categorías</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dimensiones Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peso Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compresión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categorias.map((categoria) => (
                <tr key={categoria.id_categoria}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {categoria.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {categoria.alto_cm} × {categoria.largo_cm} × {categoria.ancho_cm} cm
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {categoria.peso_kg} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompresionColor(categoria.nivel_compresion)}`}>
                      {categoria.nivel_compresion}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleCategoriaChange(categoria.id_categoria)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Calcular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraEnvios;
