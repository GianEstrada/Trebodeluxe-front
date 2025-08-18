// pages/test-cart-persistence.tsx
import React, { useEffect, useState } from 'react';
import { CartProvider, useCart } from '../contexts/NewCartContext';

// Componente de prueba interno que usa el carrito
const CartTestComponent: React.FC = () => {
  const { 
    addToCart, 
    items, 
    totalItems, 
    totalFinal, 
    isLoading, 
    error,
    refreshCart 
  } = useCart();

  const [testData, setTestData] = useState({
    productId: 1,
    variantId: 1,
    tallaId: 1,
    quantity: 1
  });

  const handleAddToCart = async () => {
    console.log('🛒 Adding product to cart:', testData);
    await addToCart(testData.productId, testData.variantId, testData.tallaId, testData.quantity);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    console.log('🎯 Cart state changed:', { 
      totalItems, 
      itemsLength: items.length, 
      isLoading, 
      error 
    });
  }, [totalItems, items.length, isLoading, error]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🛒 Test Persistencia del Carrito</h1>
      
      {/* Estado del carrito */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '15px', 
        marginBottom: '20px', 
        borderRadius: '5px' 
      }}>
        <h3>📊 Estado Actual</h3>
        <p>🔢 Total Items: <strong>{totalItems}</strong></p>
        <p>💰 Total: <strong>{formatPrice(totalFinal)}</strong></p>
        <p>⏳ Cargando: {isLoading ? 'Sí' : 'No'}</p>
        {error && <p style={{ color: 'red' }}>❌ Error: {error}</p>}
      </div>

      {/* Formulario para agregar productos */}
      <div style={{ marginBottom: '20px' }}>
        <h3>➕ Agregar Producto</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="Product ID"
            value={testData.productId}
            onChange={(e) => setTestData({
              ...testData,
              productId: parseInt(e.target.value) || 1
            })}
            style={{ padding: '5px' }}
          />
          <input
            type="number"
            placeholder="Variant ID"
            value={testData.variantId}
            onChange={(e) => setTestData({
              ...testData,
              variantId: parseInt(e.target.value) || 1
            })}
            style={{ padding: '5px' }}
          />
          <input
            type="number"
            placeholder="Talla ID"
            value={testData.tallaId}
            onChange={(e) => setTestData({
              ...testData,
              tallaId: parseInt(e.target.value) || 1
            })}
            style={{ padding: '5px' }}
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={testData.quantity}
            onChange={(e) => setTestData({
              ...testData,
              quantity: parseInt(e.target.value) || 1
            })}
            style={{ padding: '5px' }}
          />
        </div>
        <button 
          onClick={handleAddToCart}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳ Agregando...' : '➕ Agregar al Carrito'}
        </button>
      </div>

      {/* Botón para refrescar */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={refreshCart}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Refrescar Carrito
        </button>
      </div>

      {/* Lista de productos en el carrito */}
      {items.length > 0 && (
        <div style={{ 
          background: '#e8f5e8', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>🛍️ Productos en el Carrito</h3>
          {items.map((item, index) => (
            <div 
              key={item.id} 
              style={{ 
                background: 'white', 
                padding: '10px', 
                margin: '5px 0', 
                borderRadius: '3px',
                border: '1px solid #ddd'
              }}
            >
              <strong>{item.name}</strong><br/>
              <small>
                {item.variantName} - {item.tallaName} ({item.sistematalla})<br/>
                Cantidad: {item.quantity} | Precio: {formatPrice(item.price)}<br/>
                Total: {formatPrice(item.totalItemPrice)}
                {item.hasDiscount && <span style={{ color: 'green' }}> (Descuento: {item.discountPercentage}%)</span>}
              </small>
            </div>
          ))}
        </div>
      )}

      {/* Instrucciones */}
      <div style={{ 
        background: '#fff3cd', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #ffeaa7'
      }}>
        <h3>📋 Instrucciones para Probar Persistencia</h3>
        <ol>
          <li>Agrega algunos productos al carrito</li>
          <li>Refresca la página (F5)</li>
          <li>Los productos deberían seguir ahí</li>
          <li>Cierra el navegador y vuelve a abrir</li>
          <li>Los productos deberían persistir durante 30 días</li>
        </ol>
        <p><strong>Token de sesión:</strong> Se guarda automáticamente en localStorage</p>
      </div>

      {/* Debug info */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px',
        marginTop: '20px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <h4>🔍 Debug Info</h4>
        <p>Backend URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}</p>
        <p>Session Token: {typeof window !== 'undefined' ? localStorage.getItem('cart-session-token')?.substring(0, 30) + '...' : 'N/A'}</p>
        <p>Items Count: {items.length}</p>
        <p>Is Loading: {isLoading ? 'true' : 'false'}</p>
      </div>
    </div>
  );
};

// Página principal con el provider
const TestCartPersistence: React.FC = () => {
  return (
    <CartProvider>
      <CartTestComponent />
    </CartProvider>
  );
};

export default TestCartPersistence;
