// Utilidades para manejo de roles de usuario

export const ROLES = {
  USER: 0,
  ADMIN: 1,
  MODERATOR: 2
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES] | string;

// Función actualizada que maneja tanto números como strings
export const getRoleName = (rol: number | string): string => {
  // Si es string, manejamos los nuevos roles
  if (typeof rol === 'string') {
    switch (rol.toLowerCase()) {
      case 'user':
        return 'Usuario';
      case 'admin':
        return 'Administrador';
      case 'moderator':
        return 'Moderador';
      default:
        return 'Desconocido';
    }
  }
  
  // Si es número, mantenemos compatibilidad hacia atrás
  switch (rol) {
    case ROLES.USER:
      return 'Usuario';
    case ROLES.ADMIN:
      return 'Administrador';
    case ROLES.MODERATOR:
      return 'Moderador';
    default:
      return 'Desconocido';
  }
};

export const isAdmin = (rol: number | string): boolean => {
  if (typeof rol === 'string') {
    return rol.toLowerCase() === 'admin';
  }
  return rol === ROLES.ADMIN;
};

export const isModerator = (rol: number | string): boolean => {
  if (typeof rol === 'string') {
    return rol.toLowerCase() === 'moderator';
  }
  return rol === ROLES.MODERATOR;
};

export const hasAdminAccess = (rol: number | string): boolean => {
  if (typeof rol === 'string') {
    const roleLower = rol.toLowerCase();
    return roleLower === 'admin' || roleLower === 'moderator';
  }
  return rol === ROLES.ADMIN || rol === ROLES.MODERATOR;
};

export const canAccessAdminPanel = (rol: number | string): boolean => {
  if (typeof rol === 'string') {
    return rol.toLowerCase() === 'admin';
  }
  return rol === ROLES.ADMIN;
};
