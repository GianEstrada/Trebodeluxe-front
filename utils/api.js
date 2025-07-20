// utils/api.js - Utilidades generales para API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';

/**
 * Función helper para realizar requests a la API
 * @param {string} endpoint - Endpoint de la API (ej: '/api/products')
 * @param {Object} options - Opciones del fetch (method, headers, body, etc.)
 * @returns {Promise<Object>} - Respuesta de la API
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const config = {
    ...defaultOptions,
    ...options
  };

  try {
    console.log(`API Request: ${config.method} ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`API Response:`, data);
    
    return data;
  } catch (error) {
    console.error(`API Error for ${config.method} ${url}:`, error);
    throw error;
  }
}

/**
 * Helper para obtener token de autenticación desde localStorage
 * @returns {string|null} - Token de autenticación
 */
export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Helper para agregar token de autenticación a headers
 * @param {Object} headers - Headers existentes
 * @returns {Object} - Headers con token agregado
 */
export function addAuthHeader(headers = {}) {
  const token = getAuthToken();
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return headers;
}

/**
 * Configuración global de la API
 */
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos
  retries: 3
};
