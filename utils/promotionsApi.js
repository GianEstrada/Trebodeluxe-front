// utils/promotionsApi.js - API específica para promociones

import { apiRequest } from './api';

/**
 * API para manejo de promociones
 */
export const promotionsApi = {
  // Obtener promociones activas (público)
  async getActivePromotions() {
    return apiRequest('/api/promotions/active');
  },

  // Obtener promociones específicas para un producto
  async getPromotionsForProduct(productId, categoria = null) {
    const params = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    return apiRequest(`/api/promotions/product/${productId}${params}`);
  },

  // Obtener todas las promociones para administradores
  async getAllForAdmin(token) {
    return apiRequest('/api/promotions/admin', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // FUNCIÓN ELIMINADA: getApplicablePromotions
  // Ahora usamos getActivePromotions() para obtener todas las promociones públicas
  // y filtramos del lado cliente

  // Validar código de promoción
  async validatePromotionCode(codigo) {
    return apiRequest(`/api/promotions/validate/${codigo}`);
  },

  // === FUNCIONES PARA ADMINISTRADORES ===

  // Crear promoción
  async create(data, token) {
    return apiRequest('/api/promotions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },

  // Actualizar promoción
  async update(id, data, token) {
    return apiRequest(`/api/promotions/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  },

  // Eliminar promoción
  async delete(id, token) {
    return apiRequest(`/api/promotions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Aplicar promoción a productos
  async applyToProducts(promotionId, productIds, token) {
    return apiRequest(`/api/promotions/${promotionId}/apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ product_ids: productIds })
    });
  },

  // Obtener productos aplicables a una promoción
  async getPromotionProducts(promotionId, token) {
    return apiRequest(`/api/promotions/${promotionId}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Remover promoción de productos
  async removeFromProducts(promotionId, productIds, token) {
    return apiRequest(`/api/promotions/${promotionId}/remove`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ product_ids: productIds })
    });
  },

  // Calcular descuento para un producto
  async calculateDiscount(productId, variantId, cantidad, codigo = null) {
    return apiRequest('/api/promotions/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_producto: productId,
        id_variante: variantId,
        cantidad: cantidad,
        codigo_promocion: codigo
      })
    });
  }
};

export default promotionsApi;
