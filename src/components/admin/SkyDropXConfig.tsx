import React, { useState, useEffect } from 'react';

interface ConfiguracionSkyDropX {
  clave: string;
  valor: string;
  tipo: string;
  descripcion: string;
}

const SkyDropXConfig: React.FC = () => {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionSkyDropX[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchConfiguraciones();
  }, []);

  const fetchConfiguraciones = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/categorias/admin/skydropx-config', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar configuraciones');
      }

      const data = await response.json();
      setConfiguraciones(data.configuraciones);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (clave: string, valor: string) => {
    setConfiguraciones(prev => 
      prev.map(config => 
        config.clave === clave 
          ? { ...config, valor }
          : config
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/categorias/admin/skydropx-config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configuraciones)
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuraciones');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    const apiKey = configuraciones.find(c => c.clave === 'skydropx_api_key')?.valor;
    
    if (!apiKey) {
      alert('Primero debes configurar tu API Key de SkyDropX');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/skydropx/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Conexión exitosa con SkyDropX!\n\nDetalles de la cuenta:\n' + JSON.stringify(result.data, null, 2));
      } else {
        alert('❌ Error al conectar con SkyDropX:\n' + (result.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error probando conexión:', error);
      alert('❌ Error al probar la conexión: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setTesting(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Configuración SkyDropX</h1>
          <p className="text-gray-600">Configurar integración con SkyDropX para envíos</p>
        </div>
        <button
          onClick={testConnection}
          disabled={testing}
          className={`px-4 py-2 rounded-lg transition-colors ${
            testing
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {testing ? '🔄 Probando...' : '🧪 Probar Conexión'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <strong>Éxito:</strong> Configuraciones guardadas correctamente
        </div>
      )}

      {/* Configuraciones */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6">Configuraciones de SkyDropX</h2>
        
        <div className="space-y-6">
          {configuraciones.map((config) => (
            <div key={config.clave} className="border-b border-gray-200 pb-4 last:border-b-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.descripcion}
              </label>
              
              {config.tipo === 'boolean' ? (
                <select
                  value={config.valor}
                  onChange={(e) => handleConfigChange(config.clave, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Habilitado</option>
                  <option value="false">Deshabilitado</option>
                </select>
              ) : config.tipo === 'number' ? (
                <input
                  type="number"
                  step="0.01"
                  value={config.valor}
                  onChange={(e) => handleConfigChange(config.clave, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : config.clave === 'skydropx_api_key' ? (
                <input
                  type="password"
                  value={config.valor}
                  onChange={(e) => handleConfigChange(config.clave, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingresa tu API Key de SkyDropX"
                />
              ) : (
                <input
                  type="text"
                  value={config.valor}
                  onChange={(e) => handleConfigChange(config.clave, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              <p className="text-sm text-gray-500 mt-1">
                Clave: <code className="bg-gray-100 px-1 rounded">{config.clave}</code>
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Configuraciones'}
          </button>
        </div>
      </div>

      {/* Información de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">📖 Guía de Configuración</h3>
        
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <strong>skydropx_api_key:</strong> Tu clave API de SkyDropX. Obténla desde tu panel de SkyDropX.
          </div>
          <div>
            <strong>skydropx_webhook_url:</strong> URL donde SkyDropX enviará notificaciones de estado. 
            Usa: <code>https://trebodeluxe-backend.onrender.com/webhooks/skydropx</code>
          </div>
          <div>
            <strong>skydropx_enabled:</strong> Habilita o deshabilita la integración con SkyDropX.
          </div>
          <div>
            <strong>empaque_peso_extra_kg:</strong> Peso adicional del empaque que se agregará automáticamente.
          </div>
          <div>
            <strong>empaque_margen_cm:</strong> Margen adicional en centímetros que se agregará a las dimensiones.
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Importante:</strong> Después de configurar, no olvides habilitar SkyDropX 
            y probar la conexión antes de usar en producción.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SkyDropXConfig;
