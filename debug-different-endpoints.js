// Script para probar diferentes endpoints de API
async function testBasicProductsAPI() {
  console.log('🔍 Probando endpoint básico de productos...');
  
  try {
    const response = await fetch('https://trebodeluxe-backend.onrender.com/api/productos');
    console.log('📊 Status:', response.status);
    console.log('✅ Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      console.log('🛍️ Productos encontrados:', data.productos ? data.productos.length : 'No hay productos');
    } else {
      console.log('❌ Error:', response.statusText);
    }
  } catch (error) {
    console.error('🚨 Error:', error);
  }
}

async function testProductsWithQuery() {
  console.log('\n🔍 Probando endpoint de productos con query de búsqueda...');
  
  try {
    const response = await fetch('https://trebodeluxe-backend.onrender.com/api/productos?busqueda=test');
    console.log('📊 Status:', response.status);
    console.log('✅ Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
    } else {
      console.log('❌ Error:', response.statusText);
    }
  } catch (error) {
    console.error('🚨 Error:', error);
  }
}

async function testSearchEndpoint() {
  console.log('\n🔍 Probando endpoint de search directo...');
  
  try {
    const response = await fetch('https://trebodeluxe-backend.onrender.com/api/search?q=test');
    console.log('📊 Status:', response.status);
    console.log('✅ Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
    } else {
      console.log('❌ Error:', response.statusText);
    }
  } catch (error) {
    console.error('🚨 Error:', error);
  }
}

// Ejecutar todas las pruebas
testBasicProductsAPI();
testProductsWithQuery();
testSearchEndpoint();