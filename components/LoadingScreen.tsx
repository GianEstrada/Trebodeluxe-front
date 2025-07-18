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
  backendUrl = 'https://trebodeluxe-backend.onrender.com',
  onBackendReady
}) => {
  const [dots, setDots] = useState('');
  const [status, setStatus] = useState<'initial' | 'checking' | 'ready'>('initial');
  const [elapsedTime, setElapsedTime] = useState(0);

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

  // Efecto principal: inicialización simplificada
  useEffect(() => {
    if (!isVisible) return;

    setStatus('initial');
    
    // Después de 1 segundo, intentar verificar backend
    const initialTimer = setTimeout(() => {
      setStatus('checking');
      
      // Función simplificada para verificar backend
      const checkBackend = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(`${backendUrl}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log('Backend conectado correctamente');
          } else {
            console.warn('Backend respondió con error:', response.status);
          }
        } catch (error) {
          console.warn('No se pudo conectar al backend:', error);
        } finally {
          // Siempre continuar después de la verificación
          setTimeout(() => {
            setStatus('ready');
            if (onBackendReady) {
              onBackendReady();
            }
          }, 500); // Pequeño delay para mostrar el estado ready
        }
      };
      
      checkBackend();
      
      // Timeout de seguridad: si después de 3 segundos no está listo, forzar
      const forceReadyTimer = setTimeout(() => {
        setStatus('ready');
        if (onBackendReady) {
          onBackendReady();
        }
      }, 3000);
      
      return () => clearTimeout(forceReadyTimer);
    }, 1000);
    
    return () => clearTimeout(initialTimer);
  }, [isVisible, backendUrl, onBackendReady]);

  // Ocultar la pantalla cuando esté lista
  useEffect(() => {
    if (status === 'ready') {
      const hideTimer = setTimeout(() => {
        // Este efecto se ejecutará pero la pantalla se ocultará porque onBackendReady se habrá llamado
      }, 1000);
      
      return () => clearTimeout(hideTimer);
    }
  }, [status]);

  // Obtener mensaje según el estado
  const getStatusMessage = () => {
    switch (status) {
      case 'initial':
        return 'Preparando tu experiencia de compra';
      case 'checking':
        return 'Verificando conexión con el servidor';
      case 'ready':
        return 'Listo para comenzar';
      default:
        return message;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-green-900 flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-blue-500/20 to-purple-600/20 animate-pulse"></div>
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-md">
        {/* Logo animado */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-75 animate-ping"></div>
          <div className="relative bg-white rounded-full p-4 shadow-2xl">
            <Image
              src="/sin-ttulo1-2@2x.png"
              alt="Treboluxe Logo"
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>

        {/* Texto principal */}
        <h1 className="text-3xl font-bold text-white mb-4 tracking-wide">
          TREBOLUXE
        </h1>
        
        {/* Mensaje de estado */}
        <p className="text-lg text-gray-300 mb-6">
          {getStatusMessage()}{dots}
        </p>

        {/* Barra de progreso */}
        <div className="w-full max-w-xs mb-6">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Tiempo transcurrido */}
        <p className="text-sm text-gray-400">
          {elapsedTime}s
        </p>

        {/* Indicador de estados */}
        <div className="flex space-x-2 mt-4">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            status === 'initial' ? 'bg-green-400' : 'bg-gray-600'
          }`}></div>
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            status === 'checking' ? 'bg-green-400' : 'bg-gray-600'
          }`}></div>
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            status === 'ready' ? 'bg-green-400' : 'bg-gray-600'
          }`}></div>
        </div>
      </div>

      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-green-500/10 rounded-full animate-bounce"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-blue-500/10 rounded-full animate-bounce delay-75"></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-purple-500/10 rounded-full animate-bounce delay-150"></div>
    </div>
  );
};

export default LoadingScreen;
