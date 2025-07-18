import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  message?: string;
  isVisible: boolean;
  backendUrl?: string;
  onBackendReady?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Procesando tu solicitud...',
  isVisible,
  backendUrl = 'https://trebodeluxe-backend.onrender.com', // URL fija para pruebas
  onBackendReady
}) => {
  const [dots, setDots] = useState('');
  const [status, setStatus] = useState<'initial' | 'checking' | 'waking' | 'db-connecting' | 'ready'>('initial');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dbConnected, setDbConnected] = useState(false);
  const [initialWaitComplete, setInitialWaitComplete] = useState(false);

  // Log de cambios de estado
  useEffect(() => {
    console.log('Estado actual del LoadingScreen:', {
      dbConnected,
      status,
      initialWaitComplete,
      isVisible
    });
  }, [dbConnected, status, initialWaitComplete, isVisible]);

  // Efecto para animar los puntos suspensivos
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  // Efecto para contar el tiempo transcurrido
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  // Efecto para el tiempo de espera inicial
  useEffect(() => {
    if (!isVisible) return;

    // Comenzar inmediatamente pero con estado 'initial'
    setStatus('initial');
    
    // Después de 2 segundos, permitir que se muestren otros estados
    const timer = setTimeout(() => {
      setInitialWaitComplete(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isVisible]);

  // Efecto para verificar si el backend está despierto
  useEffect(() => {
    if (!isVisible) return;
    
    const checkBackendStatus = async () => {
      try {
        if (status !== 'initial') {
          setStatus('checking');
        }
        console.log('Verificando backend en:', backendUrl);
        
        // Función para hacer un solo intento
        const fetchWithTimeout = async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
            
            const url = `${backendUrl}/api/health`;
            console.log('Intentando conexión a:', url);
            
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              mode: 'cors',
              signal: controller.signal
            });
            
            console.log('Respuesta recibida:', {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries())
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data = await response.json();
              return { ok: true, data };
            }
            
            // Si la respuesta no es OK, intentamos leer el mensaje de error
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
          } catch (error: any) {
            console.error('Error en la petición fetch:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
            
            if (error.name === 'AbortError') {
              throw new Error('Timeout al intentar conectar con el servidor');
            }
            throw new Error(`Error de red: ${error.message}`);
          }
        };

        try {
          const { data } = await fetchWithTimeout();
          console.log('Respuesta del backend:', data);
          
          if (data.database === 'connected' || (data.status === 'ok' && data.message?.includes('correctamente'))) {
            console.log('Backend y base de datos conectados correctamente');
            // Actualizamos los estados de forma síncrona
            setDbConnected(true);
            setStatus('ready');
            
            // Ejecutamos el callback si existe
            if (onBackendReady) {
              try {
                await Promise.resolve(onBackendReady());
              } catch (error) {
                console.error('Error en onBackendReady:', error);
              }
            }
            
            console.log('Estados actualizados y callbacks ejecutados:', { 
              dbConnected: true, 
              status: 'ready',
              timestamp: new Date().toISOString()
            });
            return;
          } else if (data.database === 'disconnected' || data.status === 'warning') {
            console.log('Backend activo pero base de datos desconectada:', data);
            setDbConnected(false);
            setStatus('db-connecting');
          } else {
            console.log('Backend responde pero en estado desconocido:', data);
            setDbConnected(false);
            setStatus('db-connecting');
          }
        } catch (error: any) {
          console.error('Error al verificar el backend:', error.message);
          setDbConnected(false);
          setStatus('waking');
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Error desconocido';
        console.error('Error al verificar el backend:', errorMessage);
        
        if (errorMessage.includes('CORS')) {
          console.error('Error de CORS detectado. Verificar la configuración del backend y la URL:', backendUrl);
        }
        
        setStatus('waking');
      }
    };

    console.log('Iniciando verificación del backend...');
    
    // Verificar inmediatamente
    checkBackendStatus();

    // Configurar verificación periódica cada 3 segundos para no sobrecargar el servidor
    const interval = setInterval(checkBackendStatus, 3000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [isVisible, backendUrl, onBackendReady]);

  // Si el componente no debe ser visible, retornamos null
  if (!isVisible) {
    return null;
  }

  // Si el backend está listo y conectado, también retornamos null
  if (dbConnected && status === 'ready' && initialWaitComplete) {
    console.log('Condiciones cumplidas para ocultar la pantalla:', {
      dbConnected,
      status,
      initialWaitComplete
    });
    return null;
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 z-50">
      <div className="max-w-md mx-auto text-center p-6">
        {/* Logo animado */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto relative">
            <Image 
              src="/icon.svg" 
              alt="Trebodeluxe Logo" 
              width={128} 
              height={128}
              className={`animate-pulse ${status === 'ready' ? 'animate-bounce' : ''}`}
            />
          </div>
        </div>
        
        {/* Título con animación */}
        <h2 className="text-3xl font-bold text-white mb-4">
          TREBOLUXE
        </h2>
        
        {/* Mensaje de estado */}
        <div className="mb-6">
          {status === 'initial' && (
            <p className="text-blue-400 text-lg">Preparando la aplicación{dots}</p>
          )}
          
          {status === 'checking' && (
            <p className="text-green-400 text-lg">Verificando conexión al servidor{dots}</p>
          )}
          
          {status === 'waking' && (
            <div>
              <p className="text-yellow-400 text-lg">Despertando el servidor{dots}</p>
              <p className="text-gray-400 mt-2 text-sm">
                Esto puede tomar hasta 30 segundos en la primera visita
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Tiempo transcurrido: {elapsedTime} segundos
              </p>
            </div>
          )}
          
          {status === 'db-connecting' && (
            <div>
              <p className="text-yellow-400 text-lg">Esperando conexión a la base de datos{dots}</p>
              <p className="text-gray-400 mt-2 text-sm">
                El servidor está activo pero la base de datos está desconectada
              </p>
              <p className="text-gray-400 mt-2 text-sm">
                Por favor, espera mientras se restablece la conexión
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Tiempo transcurrido: {elapsedTime} segundos
              </p>
            </div>
          )}
          
          {status === 'ready' && (
            <p className="text-green-500 text-lg">{message}</p>
          )}
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'initial' ? 'bg-blue-500 w-1/5' :
              status === 'checking' ? 'bg-green-500 w-2/5' : 
              status === 'waking' ? 'bg-yellow-500 animate-pulse w-3/5' : 
              status === 'db-connecting' ? 'bg-blue-500 animate-pulse w-4/5' :
              'bg-green-500 w-full'
            }`} 
          />
        </div>
        
        {/* Mensaje informativo sobre el estado */}
        {status === 'waking' && (
          <p className="text-gray-500 text-xs mt-4">
            Este sitio utiliza un plan gratuito de Render.com que entra en modo reposo después de 15 minutos de inactividad.
          </p>
        )}
        
        {status === 'db-connecting' && (
          <p className="text-gray-500 text-xs mt-4">
            La base de datos puede tardar un poco más en establecer la conexión cuando ha estado inactiva.
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
