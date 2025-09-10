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

  // Obtener stock específico por variante (SOLUCIÓN AL PROBLEMA DE STOCK INCORRECTO)
  async getStockByVariant(variantId) {
    return apiRequest(`/api/products/variants/${variantId}/stock`);
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

    // Depurar estructura de datos recibidos
    console.log('🔧 transformToLegacyFormat - Producto recibido:', {
      id: product.id_producto || product.id,
      nombre: product.nombre,
      categoria: product.categoria,
      categoria_nombre: product.categoria_nombre,
      variantes: product.variantes?.length || 0,
      tallas_disponibles: product.tallas_disponibles?.length || 0,
      stock: product.stock?.length || 0,
      precio_minimo: product.precio_minimo,
      imagen_principal: product.imagen_principal
    });

    // Ordenar variantes por ID ascendente y obtener la primera para precio
    const sortedVariants = product.variantes ? 
      [...product.variantes].sort((a, b) => a.id_variante - b.id_variante) : [];
    
    // Buscar la primera variante que tenga precio válido (no null/undefined)
    const variantWithPrice = sortedVariants.find(v => 
      v.precio !== null && v.precio !== undefined && v.precio > 0
    );
    const firstVariant = variantWithPrice || sortedVariants[0];
    const firstImage = firstVariant && firstVariant.imagenes && firstVariant.imagenes[0];

    // Obtener todos los nombres de variantes (colores) separados por coma
    const allColors = sortedVariants.length > 0 ? 
      sortedVariants.map(v => v.nombre).join(', ') : 'Sin color';

    // Obtener precio correcto de la variante con precio válido
    // El precio viene del backend como string o number, hay que manejarlo correctamente
    let correctPrice = 0;
    if (firstVariant && firstVariant.precio !== null && firstVariant.precio !== undefined) {
      // Si el precio viene como string, parsearlo
      correctPrice = typeof firstVariant.precio === 'string' ? 
        parseFloat(firstVariant.precio) : firstVariant.precio;
    } else if (product.precio_minimo) {
      correctPrice = parseFloat(product.precio_minimo);
    } else if (product.precio) {
      correctPrice = parseFloat(product.precio);
    }

    // Obtener categoría con múltiples fallbacks
    const categoryName = product.categoria_nombre || 
                        product.categoria || 
                        product.category ||
                        (firstVariant && firstVariant.categoria) ||
                        'Sin categoría';

    // Obtener tallas disponibles con múltiples estrategias
    let availableSizes = 'Sin tallas';
    
    if (product.tallas_disponibles && product.tallas_disponibles.length > 0) {
      // Estrategia 1: Usar tallas_disponibles directamente
      availableSizes = product.tallas_disponibles.map(t => t.nombre_talla || t.nombre || t).join(', ');
    } else if (sortedVariants.some(v => v.tallas_stock && v.tallas_stock.length > 0)) {
      // Estrategia 2: Buscar en tallas_stock de variantes
      const allSizes = [...new Set(sortedVariants
        .filter(v => v.tallas_stock && v.tallas_stock.length > 0)
        .flatMap(v => v.tallas_stock.map(t => t.nombre_talla || t.talla || t.nombre))
        .filter(Boolean))];
      availableSizes = allSizes.length > 0 ? allSizes.join(', ') : 'Sin tallas';
    } else if (product.stock && product.stock.length > 0) {
      // Estrategia 3: Buscar en stock general
      const stockSizes = [...new Set(product.stock
        .filter(s => s.cantidad > 0)
        .map(s => s.talla_nombre || s.talla || s.nombre_talla)
        .filter(Boolean))];
      availableSizes = stockSizes.length > 0 ? stockSizes.join(', ') : 'Sin tallas';
    } else if (sortedVariants.length > 0) {
      // Estrategia 4: Buscar tallas en cualquier parte de las variantes
      const variantSizes = sortedVariants
        .flatMap(v => [
          v.talla_nombre,
          v.talla,
          v.size,
          ...(v.tallas || []),
          ...(v.sizes || [])
        ])
        .filter(Boolean);
      
      if (variantSizes.length > 0) {
        availableSizes = [...new Set(variantSizes)].join(', ');
      }
    }

    // Determinar disponibilidad de stock
    const hasStock = product.tiene_stock || 
      (product.disponible !== false) ||
      (product.variantes && product.variantes.some(v => v.disponible && (v.stock_total > 0 || v.cantidad > 0))) ||
      (product.stock && product.stock.some(s => s.cantidad > 0)) || 
      false;

    const transformedProduct = {
      id: product.id_producto || product.id,
      name: product.nombre || product.producto_nombre || 'Producto sin nombre',
      price: correctPrice, // Precio actual de BD - se actualizará con descuentos
      originalPrice: correctPrice, // Precio original de BD - se mantiene fijo
      image: firstImage ? firstImage.url : (product.imagen_principal || product.imagen_url ||
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDMwMCAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjU2IiBmaWxsPSIjMUE2QjFBIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cmVjdCB4PSI3NSIgeT0iNjQiIHdpZHRoPSIxNTAiIGhlaWdodD0iMTI4IiByeD0iOCIgZmlsbD0iIzFBNkIxQSIgZmlsbC1vcGFjaXR5PSIwLjIiLz4KPHN2ZyB4PSIxMzUiIHk9IjExNiIgd2lkdGg9IjMwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMxQTZCMUEiIGZpbGwtb3BhY2l0eT0iMC41Ij4KICA8cGF0aCBkPSJtMjEgMTlWNUg5bDIgMmgxMGEyIDIgMCAwIDEgMiAybC0yIDEwWm0wLTJIOVY3aDEydjEwWk0xIDIxaDJWOUg1VjdIMzYuNjk0IDUuNzY0YTEgMSAwIDAgMSAuMzYyIDEuMzc0TDEuMDU2IDIwLjc2NEExIDEgMCAwIDEgMS4wNTYgMjAuNzY0Wm05LTE0SDJ2MTBoOHYtMTBabS03IDlIM3YtOGg3djhaIi8+Cjwvc3ZnPgo8dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMUE2QjFBIiBmaWxsLW9wYWNpdHk9IjAuNyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2luIEltYWdlbjwvdGV4dD4KPC9zdmc+'),
      category: categoryName,
      brand: product.marca || 'Sin marca',
      color: allColors,
      size: availableSizes,
      description: product.descripcion,
      inStock: hasStock,
      // Datos adicionales de la nueva estructura
      variantes: product.variantes || [],
      tallas_disponibles: product.tallas_disponibles || [],
      stock: product.stock || [],
      sistema_talla: product.sistema_talla_nombre
    };

    console.log('✅ transformToLegacyFormat - Producto transformado:', {
      id: transformedProduct.id,
      name: transformedProduct.name,
      category: transformedProduct.category,
      size: transformedProduct.size,
      color: transformedProduct.color,
      price: transformedProduct.price
    });

    return transformedProduct;
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
  },

  // Aplicar descuentos de promociones a productos
  applyPromotionDiscounts(products, promotions) {
    return products.map(product => {
      const productPromotions = promotions[product.id];
      
      if (!productPromotions || productPromotions.length === 0) {
        // Sin promociones - mantener precio original
        return {
          ...product,
          price: product.originalPrice, // Precio sin descuento
          hasDiscount: false
        };
      }

      // Tomar la primera promoción (más prioritaria)
      const promotion = productPromotions[0];
      let discountedPrice = product.originalPrice;
      
      if (promotion.tipo === 'porcentaje' && promotion.porcentaje_descuento > 0) {
        const discount = promotion.porcentaje_descuento / 100;
        discountedPrice = product.originalPrice * (1 - discount);
      }
      // Nota: promociones x_por_y requieren lógica diferente en carrito

      return {
        ...product,
        price: discountedPrice, // Precio con descuento aplicado
        hasDiscount: discountedPrice < product.originalPrice,
        appliedPromotion: promotion
      };
    });
  }
};

export default productsApi;
