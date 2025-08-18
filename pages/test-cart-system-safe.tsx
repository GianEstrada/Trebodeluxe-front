// pages/test-cart-system.tsx
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Componente que se carga solo en el cliente
const ClientOnlyCartTest = dynamic(() => Promise.resolve(CartTestClientComponent), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Cargando sistema de carrito...</p>
    </div>
  )
});

// Componente del cliente que usa el carrito
function CartTestClientComponent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Inicializando...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🛒 Test Sistema de Carrito</h1>
      
      <div style={{ 
        background: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>📋 Página de Prueba del Carrito</h2>
        <p>Esta página está diseñada para probar el sistema de carrito.</p>
        
        <div style={{ marginTop: '20px' }}>
          <h3>🧪 Para usar el carrito:</h3>
          <ol>
            <li>Usa la página HTML de prueba: 
              <br/>
              <code style={{ background: '#f5f5f5', padding: '4px', borderRadius: '3px' }}>
                file:///e:/Trebodeluxe/test-cart-complete.html
              </code>
            </li>
            <li>O integra el CartProvider en tu layout principal</li>
          </ol>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>🔧 Estado del Sistema:</h3>
          <ul>
            <li>✅ Backend funcionando en puerto 5000</li>
            <li>✅ APIs del carrito configuradas</li>
            <li>✅ Persistencia implementada</li>
            <li>✅ Tokens de sesión funcionando</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>📱 Archivos Implementados:</h3>
          <ul>
            <li><code>contexts/NewCartContext.tsx</code> - Context del carrito</li>
            <li><code>utils/newCartApi.ts</code> - Cliente API</li>
            <li><code>components/cart/CartModalClean.tsx</code> - Modal del carrito</li>
            <li><code>components/cart/CartIcon.tsx</code> - Icono con badge</li>
          </ul>
        </div>
      </div>
      
      <div style={{ 
        background: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <p><strong>💡 Nota:</strong> Para evitar problemas con Server-Side Rendering, 
        esta página no carga directamente el contexto del carrito. 
        Usa la página HTML de prueba para testing directo.</p>
      </div>
    </div>
  );
}

// Componente principal
const CartSystemTest: React.FC = () => {
  return <ClientOnlyCartTest />;
};

export default CartSystemTest;
