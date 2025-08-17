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
  },

  /**
   * Obtener las categorías activas que tienen contenido (productos, variantes o promociones)
   * @param {number} limit - Número máximo de categorías a devolver (por defecto 5)
   * @returns {Promise<Object>} Lista de categorías activas con contenido
   */
  async getActiveCategoriesWithContent(limit = 5) {
    try {
      // Obtener todas las categorías
      const categoriesResponse = await this.getAll();
      if (!categoriesResponse.success) {
        throw new Error('No se pudieron obtener las categorías');
      }

      // Obtener productos para verificar qué categorías tienen contenido
      const productsResponse = await apiRequest('/api/products');
      const products = productsResponse.products || [];

      // Filtrar categorías que tienen productos
      const categoriesWithContent = categoriesResponse.categories.filter(category => {
        const hasProducts = products.some(product => 
          product.categoria === category.nombre || 
          product.categoria_id === category.id_categoria
        );
        return hasProducts;
      });

      // Limitar el número de categorías devueltas
      const limitedCategories = categoriesWithContent.slice(0, limit);

      return {
        success: true,
        categories: limitedCategories,
        total: categoriesWithContent.length
      };
    } catch (error) {
      console.error('Error getting active categories with content:', error);
      return {
        success: false,
        error: error.message,
        categories: [],
        total: 0
      };
    }
  },

  /**
   * Obtener categorías activas con contenido (sin límite)
   * @returns {Promise<Object>} Lista de categorías con contenido
   */
  async getActiveCategoriesWithContent() {
    try {
      const response = await apiRequest('/api/categorias/activas-con-contenido');
      return {
        success: true,
        categories: response.categorias || []
      };
    } catch (error) {
      console.error('Error getting active categories with content:', error);
      return {
        success: false,
        error: error.message,
        categories: []
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
