// pages/test-cart-system.tsx
'use client';

import React, { useState } from 'react';
import { CartProvider } from '../contexts/NewCartContext';
import { useCart } from '../contexts/NewCartContext';
import CartIcon from '../components/cart/CartIcon';

// Componente interno que usa el contexto del carrito
const CartTestContent: React.FC = () => {
  const { addToCart, isLoading, error, items, totalItems, totalFinal } = useCart();
  const [testProduct, setTestProduct] = useState({
    productId: 1,
    variantId: 1,
    tallaId: 1,
    quantity: 1,
  });

  const handleAddToCart = async () => {
    try {
      await addToCart(
        testProduct.productId,
        testProduct.variantId,
        testProduct.tallaId,
        testProduct.quantity
      );
      console.log('Producto agregado al carrito');
    } catch (err) {
      console.error('Error agregando al carrito:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con icono del carrito */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Test Sistema de Carrito
            </h1>
            <CartIcon />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de pruebas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Agregar Producto al Carrito</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product ID
                </label>
                <input
                  type="number"
                  value={testProduct.productId}
                  onChange={(e) => setTestProduct({
                    ...testProduct,
                    productId: parseInt(e.target.value) || 1
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variant ID
                </label>
                <input
                  type="number"
                  value={testProduct.variantId}
                  onChange={(e) => setTestProduct({
                    ...testProduct,
                    variantId: parseInt(e.target.value) || 1
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Talla ID
                </label>
                <input
                  type="number"
                  value={testProduct.tallaId}
                  onChange={(e) => setTestProduct({
                    ...testProduct,
                    tallaId: parseInt(e.target.value) || 1
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={testProduct.quantity}
                  onChange={(e) => setTestProduct({
                    ...testProduct,
                    quantity: parseInt(e.target.value) || 1
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Agregando...' : 'Agregar al Carrito'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Resumen del carrito */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Resumen del Carrito</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total de productos:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total a pagar:</span>
                <span className="font-medium text-lg">
                  {formatPrice(totalFinal)}
                </span>
              </div>
            </div>

            {items.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium mb-3">Productos en el carrito:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="text-sm bg-gray-50 p-3 rounded">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-gray-600">
                        {item.variantName} - Talla: {item.tallaName}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Cantidad: {item.quantity}</span>
                        <span>{formatPrice(item.totalItemPrice)}</span>
                      </div>
                      {item.hasDiscount && (
                        <div className="text-green-600 text-xs">
                          Descuento: -{item.discountPercentage}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Instrucciones de Prueba
          </h3>
          <div className="text-blue-800 text-sm space-y-2">
            <p>• Usa los IDs de productos, variantes y tallas reales de tu base de datos</p>
            <p>• El carrito se sincroniza automáticamente con la base de datos</p>
            <p>• Los usuarios no autenticados usan un token de sesión</p>
            <p>• Los usuarios autenticados migran automáticamente su carrito</p>
            <p>• Haz clic en el icono del carrito para ver el modal completo</p>
          </div>
        </div>

        {/* Estado de la API */}
        <div className="mt-4 bg-gray-100 rounded-lg p-4">
          <h4 className="font-medium mb-2">Estado de la API:</h4>
          <div className="text-sm space-y-1">
            <p>Backend URL: {process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com'}</p>
            <p>Cargando: {isLoading ? 'Sí' : 'No'}</p>
            <p>Error: {error || 'Ninguno'}</p>
            <p>Items en carrito: {items.length}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

// Componente principal con el proveedor
const CartSystemTest: React.FC = () => {
  return (
    <CartProvider>
      <CartTestContent />
    </CartProvider>
  );
};

export default CartSystemTest;
