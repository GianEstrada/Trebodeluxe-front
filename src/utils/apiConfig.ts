// Configuración centralizada para URLs del API
export const getApiUrl = (): string => {
  // Si estamos en el cliente y hay una variable de entorno definida, usarla
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Si estamos en desarrollo local, usar localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  
  // Por defecto, usar la URL de producción
  return 'https://trebodeluxe-backend.onrender.com';
};

// Configuración para el frontend URL
export const getFrontendUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};