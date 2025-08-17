// Componente para proteger rutas de administrador
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTokenManager } from '../hooks/useTokenManager';

interface AdminProtectedProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const AdminProtected: React.FC<AdminProtectedProps> = ({ 
  children, 
  requiredRole = 'admin' 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { getToken, isTokenExpired, makeAuthenticatedRequest, clearToken } = useTokenManager();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        
        if (!token || isTokenExpired(token)) {
          console.log('🔍 No hay token válido, redirigiendo al login');
          clearToken();
          router.push('/admin/login');
          return;
        }

        // Verificar token con el servidor
        const response = await makeAuthenticatedRequest('https://trebodeluxe-backend.onrender.com/api/auth/verify');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.user && data.user.rol === requiredRole) {
            setIsAuthorized(true);
          } else {
            console.log('🔍 Usuario no tiene permisos de admin');
            clearToken();
            router.push('/admin/login');
          }
        } else {
          console.log('🔍 Token no válido en servidor');
          clearToken();
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        clearToken();
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    // Solo verificar si estamos en una ruta de admin
    if (router.pathname.startsWith('/admin') && router.pathname !== '/admin/login') {
      checkAuth();
    } else {
      setIsLoading(false);
      setIsAuthorized(true);
    }
  }, [getToken, isTokenExpired, makeAuthenticatedRequest, clearToken, router, requiredRole]);

  // Mostrar loading mientras verificamos
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autorizado, no mostrar nada (ya se redirigió)
  if (!isAuthorized) {
    return null;
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
};
