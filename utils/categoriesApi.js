// utils/categoriesApi.js - API para gestión de categorías

import { apiRequest, addAuthHeader } from './api.js';

/**
 * API para obtener categorías públicas
 */
export const categoriesApi = {
  /**
   * Obtener todas las categorías activas
   * @returns {Promise<Object>} Lista de categorías
   */
  async getAll() {
    try {
      const response = await apiRequest('/api/categorias');
      return {
        success: true,
        categories: response.categorias || []
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      return {
        success: false,
        error: error.message,
        categories: []
      };
    }
  },

  /**
   * Obtener categoría por ID
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object>} Categoría específica
   */
  async getById(id) {
    try {
      const response = await apiRequest(`/api/categorias/${id}`);
      return {
        success: true,
        category: response.categoria || null
      };
    } catch (error) {
      console.error(`Error getting category ${id}:`, error);
      return {
        success: false,
        error: error.message,
        category: null
      };
    }
  }
};

/**
 * Utilidades para transformar datos de categorías
 */
export const categoryUtils = {
  /**
   * Transforma categoría de la API al formato esperado por el frontend
   * @param {Object} apiCategory - Categoría desde la API
   * @returns {Object} Categoría transformada
   */
  transformToFrontendFormat(apiCategory) {
    return {
      id: apiCategory.id_categoria,
      name: apiCategory.nombre,
      slug: this.generateSlug(apiCategory.nombre),
      description: apiCategory.descripcion || '',
      isActive: apiCategory.activo,
      order: apiCategory.orden || 0
    };
  },

  /**
   * Genera slug para URL a partir del nombre de categoría
   * @param {string} name - Nombre de la categoría
   * @returns {string} Slug para URL
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]/g, '-') // Reemplazar caracteres especiales con guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
  },

  /**
   * Mapea categorías a opciones para dropdowns
   * @param {Array} categories - Lista de categorías
   * @returns {Array} Opciones para dropdown
   */
  toDropdownOptions(categories) {
    return categories.map(category => ({
      value: category.id,
      label: category.name,
      slug: category.slug
    }));
  },

  /**
   * Filtra categorías activas y las ordena
   * @param {Array} categories - Lista de categorías
   * @returns {Array} Categorías activas ordenadas
   */
  getActiveCategories(categories) {
    return categories
      .filter(category => category.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
};
