// Test directo para verificar el envío de headers
// Ejecutar en la consola del navegador

async function testAuthHeaders() {
  console.log('=== TEST DE HEADERS DE AUTENTICACIÓN ===');
  
  // 1. Verificar datos del usuario
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('1. Usuario en localStorage:', {
    hasUser: !!userData.id_usuario,
    hasToken: !!userData.token,
    tokenLength: userData.token ? userData.token.length : 0
  });
  
  // 2. Simular getAuthToken
  const token = userData.token;
  console.log('2. Token extraído:', token ? 'PRESENTE' : 'AUSENTE');
  
  // 3. Crear headers manualmente
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('3. ✅ Authorization header agregado');
  } else {
    const sessionToken = localStorage.getItem('session-token') || 'sess_test';
    headers['X-Session-Token'] = sessionToken;
    console.log('3. ⚠️ Usando session token como fallback');
  }
  
  console.log('4. Headers finales:', Object.keys(headers));
  
  // 4. Test de petición real
  try {
    console.log('5. Haciendo petición a /api/cart...');
    const response = await fetch('https://trebodeluxe-backend.onrender.com/api/cart', {
      method: 'GET',
      headers: headers
    });
    
    console.log('6. Respuesta recibida:', {
      status: response.status,
      statusText: response.statusText
    });
    
    const data = await response.json();
    console.log('7. Datos de respuesta:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error en la petición:', error);
  }
}

// Ejecutar el test
testAuthHeaders();
