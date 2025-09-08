// Función de debugging para verificar estado de autenticación
// Ejecutar en la consola del navegador

function debugAuth() {
  console.log('=== DEBUG AUTH STATUS ===');
  
  // 1. Verificar localStorage
  const userStr = localStorage.getItem('user');
  console.log('1. localStorage user:', userStr);
  
  if (userStr) {
    try {
      const userData = JSON.parse(userStr);
      console.log('2. Parsed user data:', userData);
      console.log('3. Has token:', !!userData.token);
      console.log('4. Token length:', userData.token ? userData.token.length : 0);
      console.log('5. Token preview:', userData.token ? userData.token.substring(0, 20) + '...' : 'none');
      console.log('6. User ID:', userData.id_usuario);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // 2. Verificar session token
  const sessionToken = localStorage.getItem('session-token');
  console.log('7. Session token:', sessionToken ? sessionToken.substring(0, 15) + '...' : 'none');
  
  // 3. Test de la función getAuthToken (si está disponible)
  if (typeof window !== 'undefined' && window.getAuthToken) {
    const token = window.getAuthToken();
    console.log('8. getAuthToken result:', token ? token.substring(0, 20) + '...' : 'none');
  }
  
  console.log('=== END DEBUG ===');
}

// Ejecutar inmediatamente
debugAuth();
