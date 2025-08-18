// components/cart/CartIcon.tsx
'use client';

import React, { useState } from 'react';
import { useCart } from '../../contexts/NewCartContext';
import CartModal from './CartModalClean';

interface CartIconProps {
  className?: string;
}

const CartIcon: React.FC<CartIconProps> = ({ className = '' }) => {
  const { totalItems, isLoading } = useCart();
  const [showModal, setShowModal] = useState(false);

  const handleOpenCart = () => {
    setShowModal(true);
  };

  const handleCloseCart = () => {
    setShowModal(false);
  };

  const handleGoToCheckout = () => {
    setShowModal(false);
    // Aquí puedes agregar la lógica para ir al checkout
    console.log('Ir al checkout');
  };

  return (
    <>
      <button
        onClick={handleOpenCart}
        className={`relative p-2 hover:bg-gray-100 rounded-full ${className}`}
        aria-label="Abrir carrito"
      >
        {/* Icono del carrito */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-700"
        >
          <path
            d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V16.5M9 19.5C9.8 19.5 10.5 20.2 10.5 21S9.8 22.5 9 22.5 7.5 21.8 7.5 21 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21S20.8 22.5 20 22.5 18.5 21.8 18.5 21 19.2 19.5 20 19.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Badge con el número de productos */}
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}

        {/* Indicador de carga */}
        {isLoading && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
          </div>
        )}
      </button>

      {/* Modal del carrito */}
      <CartModal
        isOpen={showModal}
        onClose={handleCloseCart}
        onGoToCheckout={handleGoToCheckout}
      />
    </>
  );
};

export default CartIcon;
