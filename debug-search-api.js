// Script para debuggear la búsqueda en tiempo real
async function testSearchAPI() {
  const searchTerm = "test"; // Cambia esto por un término que sepas que existe
  
  try {
    console.log('🔍 Probando búsqueda con término:', searchTerm);
    
    const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/productos/buscar?q=${encodeURIComponent(searchTerm)}&limit=5`);
    
    console.log('📊 Status de respuesta:', response.status);
    console.log('✅ Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      console.log('🛍️ Productos encontrados:', data.productos || []);
      console.log('📈 Total de productos:', (data.productos || []).length);
      
      // Mostrar estructura del primer producto si existe
      if (data.productos && data.productos.length > 0) {
        console.log('🎯 Primer producto estructura:', data.productos[0]);
      }
    } else {
      console.log('❌ Error en respuesta:', response.statusText);
    }
  } catch (error) {
    console.error('🚨 Error en la búsqueda:', error);
  }
}

// Probar con diferentes términos
async function testMultipleSearchTerms() {
  const terms = ['producto', 'test', 'a', 'phone', 'laptop'];
  
  for (const term of terms) {
    console.log(`\n=== Probando término: "${term}" ===`);
    
    try {
      const response = await fetch(`https://trebodeluxe-backend.onrender.com/api/productos/buscar?q=${encodeURIComponent(term)}&limit=5`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ "${term}": ${(data.productos || []).length} productos encontrados`);
        
        if (data.productos && data.productos.length > 0) {
          console.log(`   - Primer resultado: ${data.productos[0].nombre || 'Sin nombre'}`);
        }
      } else {
        console.log(`❌ "${term}": Error ${response.status}`);
      }
    } catch (error) {
      console.log(`🚨 "${term}": Error -`, error.message);
    }
  }
}

// Ejecutar pruebas
testSearchAPI();
testMultipleSearchTerms();