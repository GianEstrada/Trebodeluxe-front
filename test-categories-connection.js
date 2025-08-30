// Test directo de categorías
console.log('🔍 Testing categories endpoint...');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';
console.log('API_BASE_URL:', API_BASE_URL);

// Test 1: Endpoint público
fetch(`${API_BASE_URL}/api/categorias`)
  .then(response => {
    console.log('📊 Public endpoint response:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('📊 Public endpoint data:', data);
  })
  .catch(error => {
    console.error('❌ Public endpoint error:', error);
    
    // Test 2: Endpoint temporal como fallback
    console.log('🔄 Trying temp endpoint...');
    return fetch(`${API_BASE_URL}/api/categorias/admin-temp`)
      .then(response => {
        console.log('📊 Temp endpoint response:', response.status, response.statusText);
        return response.json();
      })
      .then(data => {
        console.log('📊 Temp endpoint data:', data);
      })
      .catch(tempError => {
        console.error('❌ Temp endpoint error:', tempError);
      });
  });
