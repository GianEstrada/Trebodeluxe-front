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
  backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com',
  onBackendReady
}) => {
  const [dots, setDots] = useState('');
  const [status, setStatus] = useState<'checking' | 'waking' | 'ready'>('checking');
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

  // Efecto para verificar si el backend está despierto
  useEffect(() => {
    if (!isVisible) return;
    
    const checkBackendStatus = async () => {
      try {
        setStatus('checking');
        const response = await fetch(`${backendUrl}/api/health`, {
          signal: AbortSignal.timeout(8000) // Timeout de 8 segundos
        });
        
        if (response.ok) {
          setStatus('ready');
          if (onBackendReady) {
            onBackendReady();
          }
        } else {
          setStatus('waking');
          setTimeout(checkBackendStatus, 3000); // Intentar de nuevo en 3 segundos
        }
      } catch (error) {
        console.log('Backend en modo sleep, intentando despertar...');
        setStatus('waking');
        setTimeout(checkBackendStatus, 3000); // Intentar de nuevo en 3 segundos
      }
    };

    checkBackendStatus();
  }, [isVisible, backendUrl, onBackendReady]);

  if (!isVisible) return null;

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
          
          {status === 'ready' && (
            <p className="text-green-500 text-lg">{message}</p>
          )}
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'checking' ? 'bg-green-500 w-1/3' : 
              status === 'waking' ? 'bg-yellow-500 animate-pulse w-2/3' : 
              'bg-green-500 w-full'
            }`} 
          />
        </div>
        
        {/* Mensaje informativo sobre el plan gratuito */}
        {status === 'waking' && (
          <p className="text-gray-500 text-xs mt-4">
            Este sitio utiliza un plan gratuito de Render.com que entra en modo reposo después de 15 minutos de inactividad.
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
