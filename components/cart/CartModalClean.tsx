// components/cart/CartModal.tsx
'use client';

import React from 'react';
import { useCart } from '../../contexts/NewCartContext';
import Image from 'next/image';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCheckout?: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onGoToCheckout }) => {
  const { 
    items, 
    totalItems, 
    totalOriginal, 
    totalFinal, 
    totalDescuento, 
    hasDiscounts,
    isLoading, 
    error,
    updateQuantity, 
    removeFromCart,
    clearCart 
  } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = async (
    productId: number,
    variantId: number,
    tallaId: number,
    currentQuantity: number,
    change: number
  ) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      await removeFromCart(productId, variantId, tallaId);
    } else {
      await updateQuantity(productId, variantId, tallaId, newQuantity);
    }
  };

  const handleRemoveItem = async (productId: number, variantId: number, tallaId: number) => {
    await removeFromCart(productId, variantId, tallaId);
  };

  const handleClearCart = async () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
      await clearCart();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Carrito de Compras</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Resumen del carrito */}
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <span className="text-lg font-medium">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </span>
            {items.length > 0 && (
              <button 
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 text-sm border border-red-200 px-3 py-1 rounded"
              >
                🗑️ Vaciar carrito
              </button>
            )}
          </div>

          {/* Lista de productos */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
              <button 
                onClick={onClose}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  {/* Imagen del producto */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={item.image || '/placeholder-image.jpg'}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="object-cover rounded-md"
                    />
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      {item.variantName}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Talla: {item.tallaName} ({item.sistematalla})
                    </p>
                    
                    {/* Precios */}
                    <div className="flex flex-col gap-1">
                      {item.hasDiscount ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-green-600">
                              {formatPrice(item.finalPrice)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.price)}
                            </span>
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              -{item.discountPercentage}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-lg font-semibold">
                          {formatPrice(item.price)}
                        </span>
                      )}
                      <span className="text-sm text-gray-600">
                        Total: {formatPrice(item.totalItemPrice)}
                      </span>
                    </div>

                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(
                            item.productId,
                            item.variantId,
                            item.tallaId,
                            item.quantity,
                            -1
                          )}
                          disabled={isLoading}
                          className="w-8 h-8 border rounded text-center hover:bg-gray-100 disabled:opacity-50"
                        >
                          -
                        </button>
                        
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => handleQuantityChange(
                            item.productId,
                            item.variantId,
                            item.tallaId,
                            item.quantity,
                            1
                          )}
                          disabled={isLoading || item.quantity >= item.stock}
                          className="w-8 h-8 border rounded text-center hover:bg-gray-100 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(
                          item.productId,
                          item.variantId,
                          item.tallaId
                        )}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 px-2 py-1 text-sm"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Indicador de stock */}
                    {item.stock <= 5 && item.stock > 0 && (
                      <p className="text-sm text-orange-600 mt-2">
                        ¡Solo quedan {item.stock} en stock!
                      </p>
                    )}
                    {item.stock === 0 && (
                      <p className="text-sm text-red-600 mt-2">
                        Sin stock disponible
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con totales y botones */}
        {items.length > 0 && (
          <div className="border-t p-6 space-y-3">
            {hasDiscounts && (
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatPrice(totalOriginal)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuentos:</span>
                  <span>-{formatPrice(totalDescuento)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatPrice(totalFinal)}</span>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                onClick={onClose} 
                className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              >
                Seguir comprando
              </button>
              <button 
                onClick={onGoToCheckout} 
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Ir al checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
