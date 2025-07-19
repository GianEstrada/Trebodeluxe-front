import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import Layout from '../components/Layout';

interface CartItem {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  inStock: boolean;
}

const CarritoPage: NextPage = () => {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  
  // Sistema de traducción universal
  const { t } = useUniversalTranslate(currentLanguage);

  // Estado del carrito (simulado - en producción vendría de un contexto de carrito)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: "Camiseta Casual Premium",
      price: 25.99,
      originalPrice: 35.99,
      image: "/sin-ttulo1-2@2x.png",
      size: "M",
      color: "Azul",
      quantity: 2,
      inStock: true
    },
    {
      id: 2,
      name: "Gorra Deportiva",
      price: 18.99,
      originalPrice: 24.99,
      image: "/797e7904b64e13508ab322be3107e368-1@2x.png",
      size: "Única",
      color: "Negro",
      quantity: 1,
      inStock: true
    }
  ]);

  // Cargar configuración guardada
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  // Función para formatear precio
  const formatPrice = (price: number) => {
    const exchangeRates = {
      'EUR': 1,
      'USD': 1.1,
      'MXN': 20.5
    };
    
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'MXN': '$'
    };
    
    const convertedPrice = (price * exchangeRates[currentCurrency as keyof typeof exchangeRates]).toFixed(2);
    const symbol = symbols[currentCurrency as keyof typeof symbols];
    
    return `${symbol}${convertedPrice}`;
  };

  // Funciones del carrito
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  // Cálculos
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 50; // Envío gratis en pedidos > $500
  const total = subtotal + shipping;

  return (
    <Layout>
      <div className="w-full">
        {/* Breadcrumb */}
        <div className="bg-gray-100 py-4 px-4 md:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-600 hover:text-black no-underline">
                {t('Inicio')}
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-black font-medium">{t('Carrito de Compras')}</span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="py-8 px-4 md:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider mb-8">
              {t('CARRITO DE COMPRAS')}
            </h1>

            {cartItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista de productos */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-6">{t('Productos en tu carrito')}</h2>
                      
                      <div className="space-y-6">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row gap-4 pb-6 border-b last:border-b-0">
                            <div className="flex-shrink-0">
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={120}
                                height={120}
                                className="w-24 h-24 sm:w-30 sm:h-30 object-cover rounded-lg"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{t(item.name)}</h3>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                  title={t('Eliminar producto')}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              
                              <p className="text-gray-600 text-sm mb-3">
                                {t('Talla')}: {item.size} • {t('Color')}: {t(item.color)}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                                  >
                                    -
                                  </button>
                                  <span className="w-12 text-center font-medium">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
                                  >
                                    +
                                  </button>
                                </div>
                                
                                <div className="text-right">
                                  <div className="font-bold text-lg">
                                    {formatPrice(item.price * item.quantity)}
                                  </div>
                                  {item.originalPrice && item.originalPrice > item.price && (
                                    <div className="text-gray-400 text-sm line-through">
                                      {formatPrice(item.originalPrice * item.quantity)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Continuar comprando */}
                  <div className="mt-6">
                    <Link 
                      href="/catalogo"
                      className="inline-flex items-center gap-2 text-black hover:text-gray-600 transition-colors duration-200 no-underline"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      {t('Continuar comprando')}
                    </Link>
                  </div>
                </div>

                {/* Resumen del pedido */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm border sticky top-4">
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-6">{t('Resumen del pedido')}</h2>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between">
                          <span>{t('Subtotal')} ({cartItems.length} {t('productos')})</span>
                          <span className="font-medium">{formatPrice(subtotal)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>{t('Envío')}</span>
                          <span className="font-medium">
                            {shipping === 0 ? (
                              <span className="text-green-600">{t('GRATIS')}</span>
                            ) : (
                              formatPrice(shipping)
                            )}
                          </span>
                        </div>
                        
                        {shipping > 0 && (
                          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                            {t('¡Agrega')} {formatPrice(500 - subtotal)} {t('más y obtén envío GRATIS!')}
                          </div>
                        )}
                        
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span>{t('Total')}</span>
                            <span>{formatPrice(total)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => router.push('/checkout')}
                        className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 mb-4"
                      >
                        {t('PROCEDER AL CHECKOUT')}
                      </button>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {t('Compra 100% segura')}
                        </div>
                        
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                          <span>{t('SSL')}</span>
                          <span>•</span>
                          <span>{t('Encriptación')}</span>
                          <span>•</span>
                          <span>{t('Seguridad garantizada')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Carrito vacío
              <div className="text-center py-16">
                <div className="text-gray-400 text-8xl mb-6">🛒</div>
                <h2 className="text-2xl font-bold text-gray-600 mb-4">
                  {t('Tu carrito está vacío')}
                </h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {t('Parece que aún no has agregado ningún producto a tu carrito. ¡Explora nuestro catálogo y encuentra algo que te encante!')}
                </p>
                <Link 
                  href="/catalogo"
                  className="inline-block bg-black text-white px-8 py-3 text-lg font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 no-underline"
                >
                  {t('EXPLORAR PRODUCTOS')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CarritoPage;
