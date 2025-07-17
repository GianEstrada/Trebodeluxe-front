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
  login: (data: LoginData) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { setLoading, checkBackendStatus } = useLoading();

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
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Función para verificar que el backend esté despierto antes de hacer peticiones
  const ensureBackendAwake = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const isReady = await checkBackendStatus();
      return isReady;
    } catch (error) {
      console.error('Error al verificar el estado del backend:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData): Promise<boolean> => {
    setLoading(true);
    try {
      // Asegurarse de que el backend esté despierto
      const isBackendReady = await ensureBackendAwake();
      if (!isBackendReady) {
        throw new Error('No se pudo conectar con el servidor');
      }

      // Petición real al backend
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }

      const userData = await response.json();
      
      // Guardar el usuario y token en el estado y localStorage
      const userToSave = {
        id_usuario: userData.id_usuario,
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        correo: userData.correo,
        token: userData.token,
      };
      
      setUser(userToSave);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userToSave));
      return true;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setLoading(true);
    try {
      // Asegurarse de que el backend esté despierto
      const isBackendReady = await ensureBackendAwake();
      if (!isBackendReady) {
        throw new Error('No se pudo conectar con el servidor');
      }

      // Petición real al backend
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar usuario');
      }

      const newUser = await response.json();
      
      // Guardar el usuario y token en el estado y localStorage
      const userToSave = {
        id_usuario: newUser.id_usuario,
        nombres: newUser.nombres,
        apellidos: newUser.apellidos,
        correo: newUser.correo,
        token: newUser.token,
      };
      
      setUser(userToSave);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userToSave));
      return true;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user || !user.token) return false;
    
    setLoading(true);
    try {
      // Asegurarse de que el backend esté despierto
      const isBackendReady = await ensureBackendAwake();
      if (!isBackendReady) {
        throw new Error('No se pudo conectar con el servidor');
      }

      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }

      const updatedUser = await response.json();
      
      // Actualizar el usuario en el estado y localStorage
      const userToSave = {
        ...user,
        ...updatedUser,
      };
      
      setUser(userToSave);
      localStorage.setItem('user', JSON.stringify(userToSave));
      return true;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      register,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
