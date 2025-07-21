// Utilidades para manejo de roles de usuario

export const ROLES = {
  USER: 0,
  ADMIN: 1,
  MODERATOR: 2
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const getRoleName = (rol: number): string => {
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

export const isAdmin = (rol: number): boolean => {
  return rol === ROLES.ADMIN;
};

export const isModerator = (rol: number): boolean => {
  return rol === ROLES.MODERATOR;
};

export const hasAdminAccess = (rol: number): boolean => {
  return rol === ROLES.ADMIN || rol === ROLES.MODERATOR;
};

export const canAccessAdminPanel = (rol: number | string): boolean => {
  return rol === ROLES.ADMIN || rol === "admin";
};
