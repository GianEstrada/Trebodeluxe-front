import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLoading } from './LoadingContext';

interface User {
  id_usuario: string;
  nombres: string;
  apellidos: string;
  correo: string;
  usuario: string;
  rol: string; // 'user', 'admin', 'moderator'
  token?: string;
  shippingInfo?: {
    id_informacion?: number;
    nombre_completo?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    estado?: string;
    codigo_postal?: string;
    pais?: string;
  };
}

interface LoginData {
  usuario: string;
  contrasena: string;
}

interface RegisterData {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  usuario: string;
  shippingInfo?: {
    nombre_completo?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    estado?: string;
    codigo_postal?: string;
    pais?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { setLoading } = useLoading();

  // Configurar la URL del backend
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Cargar usuario del localStorage al inicializar
  useEffect(() => {
    // Inicializar inmediatamente para no bloquear la UI
    setIsInitialized(true);
    
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Función para verificar que el backend esté despierto
  const ensureBackendAwake = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // Reducido a 5 segundos
      });
      
      return response.ok;
    } catch (error) {
      console.warn('Backend no disponible:', error);
      // Retornar true para permitir que la app continúe funcionando
      // en modo offline o con backend no disponible
      return true;
    }
  };

  const login = async (data: LoginData) => {
    try {
      setLoading(true);
      
      // Verificar que el backend esté disponible (pero no bloquear si no está)
      const isBackendReady = await ensureBackendAwake();
      if (!isBackendReady) {
        throw new Error('El servidor no está disponible en este momento. Inténtalo más tarde.');
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000) // Timeout de 10 segundos para login
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Credenciales inválidas');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor. Inténtalo más tarde.');
        } else {
          throw new Error('Error de conexión. Verifica tu internet.');
        }
      }

      const result = await response.json();
      
      if (result.success) {
        const userData = {
          ...result.user,
          token: result.token
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);

      // Verificar que el backend esté disponible (pero no bloquear si no está)
      const isBackendReady = await ensureBackendAwake();
      if (!isBackendReady) {
        throw new Error('El servidor no está disponible en este momento. Inténtalo más tarde.');
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000) // Timeout de 10 segundos para registro
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('El correo electrónico ya está registrado');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor. Inténtalo más tarde.');
        } else {
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en el registro');
          } catch {
            throw new Error('Error de conexión. Verifica tu internet.');
          }
        }
      }

      const result = await response.json();
      
      if (result.success) {
        const userData = {
          ...result.user,
          token: result.token
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(result.message || 'Error en el registro');
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Si hay un usuario logueado, notificar al backend
      if (user?.token) {
        setLoading(true);
        try {
          await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            signal: AbortSignal.timeout(5000)
          });
        } catch (error) {
          // Ignorar errores del backend para logout
          console.warn('Error al notificar logout al backend:', error);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Siempre limpiar la sesión local, independientemente del resultado del backend
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user?.token) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado o inválido
          logout();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor. Inténtalo más tarde.');
        } else {
          throw new Error('Error al actualizar el perfil');
        }
      }

      const result = await response.json();
      if (result.success) {
        const updatedUser = {
          ...user,
          ...result.user
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        throw new Error(result.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isInitialized,
      login,
      register,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
