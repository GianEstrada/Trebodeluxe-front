// utils/productsApi.js - API específica para productos

import { apiRequest } from './api';

/**
 * API para manejo de productos con la nueva estructura de BD
 */
export const productsApi = {
  // Obtener todos los productos con filtros opcionales
  async getAll(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.categoria) queryParams.append('categoria', filters.categoria);
    if (filters.busqueda) queryParams.append('busqueda', filters.busqueda);
    if (filters.marca) queryParams.append('marca', filters.marca);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const queryString = queryParams.toString();
    const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint);
  },

  // Obtener productos con variantes para el catálogo
  async getWithVariants(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.categoria) queryParams.append('categoria', filters.categoria);
    if (filters.busqueda) queryParams.append('busqueda', filters.busqueda);
    if (filters.marca) queryParams.append('marca', filters.marca);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const queryString = queryParams.toString();
    const endpoint = `/api/products/with-variants${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint);
  },

  // Obtener producto por ID con todas sus variantes
  async getById(id) {
    return apiRequest(`/api/products/${id}`);
  },

  // Obtener productos destacados
  async getFeatured(limit = 8) {
    return apiRequest(`/api/products/featured?limit=${limit}`);
  },

  // Obtener productos recientes (agregados recientemente)
  async getRecent(limit = 12) {
    return apiRequest(`/api/products/recent?limit=${limit}`);
  },

  // Obtener productos recientes por categoría
  async getRecentByCategory(limit = 6) {
    return apiRequest(`/api/products/recent-by-category?limit=${limit}`);
  },

  // Obtener productos en promoción
  async getPromotions(limit = 12) {
    return apiRequest(`/api/products/promotions?limit=${limit}`);
  },

  // Obtener mejores promociones (mayor descuento)
  async getBestPromotions(limit = 12) {
    return apiRequest(`/api/products/best-promotions?limit=${limit}`);
  },

  // Obtener categorías disponibles
  async getCategories() {
    return apiRequest('/api/products/categories');
  },

  // Obtener marcas disponibles
  async getBrands() {
    return apiRequest('/api/products/brands');
  },

  // Obtener sistemas de tallas
  async getSizeSystems() {
    return apiRequest('/api/products/size-systems');
  },

  // Verificar stock específico
  async checkStock(idProducto, idVariante, idTalla) {
    return apiRequest(`/api/products/stock/${idProducto}/${idVariante}/${idTalla}`);
  },

  // === FUNCIONES PARA ADMINISTRADORES ===

  // Crear nuevo producto
  async create(productData, token) {
    return apiRequest('/api/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
  },

  // Actualizar producto existente
  async update(productId, productData, token) {
    return apiRequest(`/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
  },

  // Eliminar producto
  async delete(productId, token) {
    return apiRequest(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Obtener productos para administradores (con info completa)
  async getAllForAdmin(token) {
    return apiRequest('/api/products/admin', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Crear nueva variante
  async createVariant(variantData, token) {
    return apiRequest('/api/products/variants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(variantData)
    });
  },

  // Agregar imagen a variante
  async addImage(imageData, token) {
    return apiRequest('/api/products/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(imageData)
    });
  },

  // Actualizar stock
  async updateStock(stockData, token) {
    return apiRequest('/api/products/stock', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(stockData)
    });
  }
};

/**
 * Hook personalizado para productos con caché simple
 */
export const useProductsCache = (() => {
  let cache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  return {
    get: (key) => {
      const item = cache.get(key);
      if (item && Date.now() - item.timestamp < CACHE_TTL) {
        return item.data;
      }
      return null;
    },
    
    set: (key, data) => {
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
    },

    clear: () => {
      cache.clear();
    }
  };
})();

/**
 * Utilidades para transformar datos de productos
 */
export const productUtils = {
  // Transformar producto de la nueva estructura a la estructura legacy del frontend
  transformToLegacyFormat(product) {
    if (!product) return null;

    // Ordenar variantes por ID ascendente y obtener la primera para precio
    const sortedVariants = product.variantes ? 
      [...product.variantes].sort((a, b) => a.id_variante - b.id_variante) : [];
    const firstVariant = sortedVariants[0];
    const firstImage = firstVariant && firstVariant.imagenes && firstVariant.imagenes[0];

    // Obtener todos los nombres de variantes (colores) separados por coma
    const allColors = sortedVariants.length > 0 ? 
      sortedVariants.map(v => v.nombre).join(', ') : '';

    // Obtener precio correcto de la primera variante
    // El precio viene del backend como string o number, hay que manejarlo correctamente
    let correctPrice = 0;
    if (firstVariant && firstVariant.precio !== null && firstVariant.precio !== undefined) {
      // Si el precio viene como string, parsearlo
      correctPrice = typeof firstVariant.precio === 'string' ? 
        parseFloat(firstVariant.precio) : firstVariant.precio;
    } else if (product.precio_minimo) {
      correctPrice = parseFloat(product.precio_minimo);
    }

    // Obtener todas las tallas disponibles en stock
    const availableSizes = product.tallas_disponibles && product.tallas_disponibles.length > 0 ? 
      product.tallas_disponibles.map(t => t.nombre_talla).join(', ') : 
      (product.stock && product.stock.length > 0 ? 
        [...new Set(product.stock
          .filter(s => s.cantidad > 0)
          .map(s => s.talla_nombre || s.talla)
          .filter(Boolean))]
          .join(', ') : 'Sin tallas');

    return {
      id: product.id_producto,
      name: product.nombre || product.producto_nombre,
      price: correctPrice,
      originalPrice: correctPrice * 1.25, // Precio original simulado (25% más)
      image: firstImage ? firstImage.url : (product.imagen_principal || '/sin-ttulo1-2@2x.png'),
      category: product.categoria || product.categoria_nombre || 'Sin categoría',
      brand: product.marca || 'Sin marca',
      color: allColors || 'Sin color',
      size: availableSizes,
      description: product.descripcion,
      inStock: product.tiene_stock || (product.stock && product.stock.some(s => s.cantidad > 0)) || false,
      // Datos adicionales de la nueva estructura
      variantes: product.variantes || [],
      tallas_disponibles: product.tallas_disponibles || [],
      stock: product.stock || [],
      sistema_talla: product.sistema_talla_nombre
    };
  },

  // Obtener todas las variantes de color de un producto
  getColorVariants(product) {
    if (!product.variantes) return [];
    return product.variantes.map(variant => ({
      id: variant.id_variante,
      name: variant.nombre,
      price: parseFloat(variant.precio),
      originalPrice: parseFloat(variant.precio_original || variant.precio),
      images: variant.imagenes || []
    }));
  },

  // Obtener stock disponible para una variante y talla específica
  getVariantStock(product, variantId, tallaId) {
    if (!product.stock) return 0;
    
    const stockItem = product.stock.find(s => 
      s.id_variante === variantId && s.id_talla === tallaId
    );
    
    return stockItem ? stockItem.cantidad : 0;
  },

  // Verificar si un producto tiene stock en alguna variante/talla
  hasAnyStock(product) {
    if (!product.stock) return false;
    return product.stock.some(s => s.cantidad > 0);
  },

  // Calcular precio con descuento
  calculateDiscount(originalPrice, currentPrice) {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
};

export default productsApi;
