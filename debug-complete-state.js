// Función de debugging para verificar estado completo
// Ejecutar en la consola del navegador después del logout

function debugCompleteState() {
  console.log('=== 🔍 ESTADO COMPLETO DE LA APLICACIÓN ===');
  
  // 1. Verificar localStorage
  console.log('📦 localStorage:');
  console.log('  - user:', localStorage.getItem('user'));
  console.log('  - session-token:', localStorage.getItem('session-token'));
  console.log('  - adminToken:', localStorage.getItem('adminToken'));
  console.log('  - treboluxe-cart:', localStorage.getItem('treboluxe-cart'));
  
  // 2. Verificar todas las claves en localStorage
  console.log('📋 Todas las claves en localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
  }
  
  // 3. Test de autenticación
  try {
    const userData = localStorage.getItem('user');
    const isLoggedIn = !!(userData && JSON.parse(userData).token);
    console.log('🔐 Estado de autenticación:', isLoggedIn ? 'LOGUEADO' : 'ANÓNIMO');
  } catch (e) {
    console.log('🔐 Estado de autenticación: ANÓNIMO (error parsing)');
  }
  
  // 4. Test de headers
  console.log('📤 Test de headers:');
  const headers = {'Content-Type': 'application/json'};
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      if (parsed.token) {
        headers['Authorization'] = `Bearer ${parsed.token}`;
        console.log('  ✅ Authorization header sería agregado');
      }
    } catch (e) {
      console.log('  ❌ Error procesando usuario');
    }
  } else {
    const sessionToken = localStorage.getItem('session-token') || 'NEW_SESSION';
    headers['X-Session-Token'] = sessionToken;
    console.log('  ✅ Session-Token header sería agregado');
  }
  
  console.log('📤 Headers que se enviarían:', Object.keys(headers));
  console.log('=== FIN DEBUG ===');
}

// Función para limpiar localStorage manualmente si es necesario
function clearAllLocalStorage() {
  console.log('🧹 Limpiando localStorage manualmente...');
  localStorage.clear();
  console.log('✅ localStorage limpiado completamente');
  location.reload();
}

// Ejecutar debug automáticamente
debugCompleteState();
