// Hook personalizado para manejar autenticación con renovación automática
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

interface TokenManager {
  getToken: () => string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  isTokenExpired: (token: string) => boolean;
}

export const useTokenManager = (): TokenManager & { 
  makeAuthenticatedRequest: (url: string, options?: RequestInit) => Promise<Response>;
  handleTokenRefresh: (response: Response) => void;
} => {
  const router = useRouter();
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // Funciones básicas del token
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('adminToken');
  }, []);

  const setToken = useCallback((token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adminToken', token);
  }, []);

  const clearToken = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('adminToken');
  }, []);

  const isTokenExpired = useCallback((token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }, []);

  // Función para manejar renovación de token
  const handleTokenRefresh = useCallback((response: Response) => {
    const newToken = response.headers.get('X-New-Token');
    const wasRefreshed = response.headers.get('X-Token-Refreshed');
    
    if (newToken && wasRefreshed === 'true') {
      console.log('🔄 Token renovado automáticamente');
      setToken(newToken);
    }
  }, [setToken]);

  // Función para hacer requests autenticados
  const makeAuthenticatedRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    
    if (!token || isTokenExpired(token)) {
      console.log('🔍 Token expirado o inexistente, redirigiendo al login');
      clearToken();
      router.push('/admin/login');
      throw new Error('Token expirado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Manejar renovación automática de token
      handleTokenRefresh(response);

      // Manejar errores de autenticación
      if (response.status === 401) {
        const data = await response.json().catch(() => ({}));
        if (data.shouldRedirectToLogin) {
          console.log('🔍 Sesión expirada, redirigiendo al login');
          clearToken();
          router.push('/admin/login');
          throw new Error('Sesión expirada');
        }
      }

      return response;
    } catch (error) {
      console.error('Error en request autenticado:', error);
      throw error;
    }
  }, [getToken, isTokenExpired, clearToken, router, handleTokenRefresh]);

  // Detectar actividad del usuario
  const resetActivityTimer = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    isActiveRef.current = true;
    
    // Configurar timeout para inactividad (15 minutos)
    activityTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
      console.log('⏰ Usuario inactivo por 15 minutos');
    }, 15 * 60 * 1000);
  }, []);

  // Configurar listeners de actividad
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleActivity = () => {
      resetActivityTimer();
    };

    // Agregar listeners a todos los eventos
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Inicializar timer
    resetActivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [resetActivityTimer]);

  // Verificar token al cargar
  useEffect(() => {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      console.log('🔍 Token expirado al cargar, limpiando...');
      clearToken();
      if (router.pathname.startsWith('/admin') && router.pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    }
  }, [getToken, isTokenExpired, clearToken, router]);

  return {
    getToken,
    setToken,
    clearToken,
    isTokenExpired,
    makeAuthenticatedRequest,
    handleTokenRefresh
  };
};
