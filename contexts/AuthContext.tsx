import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLoading } from './LoadingContext';

interface User {
  id_usuario: string;
  nombres: string;
  apellidos: string;
  correo: string;
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
  correo: string;
  contrasena: string;
}

interface RegisterData {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { setLoading } = useLoading();

  // Configurar la URL del backend
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

  // Cargar usuario del localStorage al inicializar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsInitialized(true);
  }, []);

  // Función para verificar que el backend esté despierto
  const ensureBackendAwake = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        console.error('Backend health check failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking backend health:', error);
      return false;
    }
  };

  const login = async (data: LoginData) => {
    try {
      setLoading(true);
      
      // Verificar que el backend esté disponible
      const isBackendReady = await ensureBackendAwake();
      if (!isBackendReady) {
        throw new Error('El servidor no está disponible en este momento');
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
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

      // Verificar que el backend esté disponible
      const isBackendReady = await ensureBackendAwake();
      if (!isBackendReady) {
        throw new Error('El servidor no está disponible en este momento');
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el registro');
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

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
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
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el perfil');
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
