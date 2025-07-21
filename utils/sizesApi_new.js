// utils/sizesApi.js - API específica para tallas y sistemas de tallas

import { apiRequest } from './api';

/**
 * API para manejo de tallas y sistemas de tallas
 */
export const sizesApi = {
  // Obtener todos los sistemas de tallas
  async getAllSystems() {
    return apiRequest('/api/sizes/systems');
  },

  // Obtener todas las tallas
  async getAll() {
    return apiRequest('/api/sizes');
  },

  // Obtener sistema de tallas por ID
  async getSystemById(id) {
    return apiRequest(`/api/sizes/systems/${id}`);
  },

  // Obtener tallas por sistema
  async getSizesBySystem(systemId) {
    return apiRequest(`/api/sizes/by-system/${systemId}`);
  },

  // === FUNCIONES PARA ADMINISTRADORES ===

  // Crear sistema de tallas
  async createSystem(data, token) {
    return apiRequest('/api/sizes/systems', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },

  // Actualizar sistema de tallas
  async updateSystem(id, data, token) {
    return apiRequest(`/api/sizes/systems/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },

  // Eliminar sistema de tallas
  async deleteSystem(id, token) {
    return apiRequest(`/api/sizes/systems/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Crear talla
  async createSize(data, token) {
    return apiRequest('/api/sizes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },

  // Actualizar talla
  async updateSize(id, data, token) {
    return apiRequest(`/api/sizes/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },

  // Eliminar talla
  async deleteSize(id, token) {
    return apiRequest(`/api/sizes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Actualizar stock
  async updateStock(data, token) {
    return apiRequest('/api/sizes/stock', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }
};

export default sizesApi;
