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

interface CotizacionEnvio {
  carrier: string;
  service: string;
  cost: number;
  delivery_time: string;
}

const CalculadoraEnvios: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [dimensionesCalculadas, setDimensionesCalculadas] = useState<DimensionesEnvio | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoPostal, setCodigoPostal] = useState('');
  const [cotizaciones, setCotizaciones] = useState<CotizacionEnvio[]>([]);
  const [cotizando, setCotizando] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      let token = localStorage.getItem('adminToken');
      console.log('🔑 [Calc] Token found:', token ? 'Yes' : 'No');
      
      // Intentar primero con el endpoint con auth
      let response;
      let data;
      
      if (token) {
        try {
          response = await fetch('/api/categorias/admin', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            data = await response.json();
            console.log('✅ [Calc] Authenticated endpoint succeeded');
          } else {
            console.log('❌ [Calc] Authenticated endpoint failed:', response.status);
            throw new Error('Auth failed');
          }
        } catch (authError) {
          console.log('⚠️ [Calc] Auth endpoint failed, trying temp endpoint...');
          // Fallback al endpoint temporal
          response = await fetch('/api/categorias/admin-temp');
          if (!response.ok) {
            throw new Error('Error al cargar categorías');
          }
          data = await response.json();
          console.log('✅ [Calc] Temporary endpoint succeeded');
        }
      } else {
        console.log('⚠️ [Calc] No token found, using temp endpoint...');
        // Usar endpoint temporal directamente
        response = await fetch('/api/categorias/admin-temp');
        if (!response.ok) {
          throw new Error('Error al cargar categorías');
        }
        data = await response.json();
        console.log('✅ [Calc] Temporary endpoint succeeded');
      }

      setCategorias(data.categorias || []);
      
    } catch (error) {
      console.error('❌ [Calc] Error loading categories:', error);
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

  const obtenerCotizaciones = async () => {
    if (!categoriaSeleccionada || !codigoPostal) {
      alert('Selecciona una categoría e ingresa un código postal');
      return;
    }

    setCotizando(true);
    setCotizaciones([]);
    
    try {
      const response = await fetch('/api/skydropx/quote-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category_id: categoriaSeleccionada,
          destination_zip: codigoPostal
        })
      });

      if (!response.ok) {
        throw new Error('Error al obtener cotizaciones');
      }

      const data = await response.json();
      
      if (data.success && data.quotations) {
        setCotizaciones(data.quotations.map((q: any) => ({
          carrier: q.carrier_name || q.carrier,
          service: q.service_level_name || q.service,
          cost: parseFloat(q.total_pricing || q.cost || 0),
          delivery_time: q.delivery_estimate || q.days || 'N/A'
        })));
      } else {
        alert('No se pudieron obtener cotizaciones: ' + (data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error obteniendo cotizaciones:', error);
      alert('Error al obtener cotizaciones: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setCotizando(false);
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

        {/* Cotización de Envío en Tiempo Real */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">🚚 Cotización de Envío SkyDropX</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal de Destino
                </label>
                <input
                  type="text"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  placeholder="Ej: 06100"
                  maxLength={5}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={obtenerCotizaciones}
                  disabled={cotizando || !categoriaSeleccionada || !codigoPostal}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    cotizando || !categoriaSeleccionada || !codigoPostal
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {cotizando ? '🔄 Cotizando...' : '📦 Obtener Cotización'}
                </button>
              </div>
            </div>

            {cotizaciones.length > 0 && (
              <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paquetería
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiempo de Entrega
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cotizaciones.map((cotizacion, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cotizacion.carrier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cotizacion.service}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-bold text-green-600">
                            ${cotizacion.cost.toFixed(2)} MXN
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cotizacion.delivery_time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {codigoPostal && categoriaSeleccionada && cotizaciones.length === 0 && !cotizando && (
              <div className="text-center py-8 text-gray-500">
                Haz clic en "Obtener Cotización" para ver las opciones de envío disponibles
              </div>
            )}
          </div>
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
