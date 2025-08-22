const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://trebodeluxe-backend.onrender.com'
  : 'http://localhost:3001';

class PromotionsApi {
  async getPromotionsForProduct(productId, categoria = null) {
    try {
      const url = new URL(`${API_BASE_URL}/api/promotions/product/${productId}`);
      if (categoria) {
        url.searchParams.append('categoria', categoria);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching promotions for product:', error);
      throw error;
    }
  }

  async getActivePromotions() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/promotions/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      throw error;
    }
  }
}

const promotionsApi = new PromotionsApi();

export default promotionsApi;
