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
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardHolder?: string;
}

const CheckoutPage: NextPage = () => {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  
  // Sistema de traducción universal
  const { t } = useUniversalTranslate(currentLanguage);

  // Estado del carrito (simulado - en producción vendría de un contexto de carrito)
  const [cartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: "Camiseta Casual Premium",
      price: 25.99,
      originalPrice: 35.99,
      image: "/sin-ttulo1-2@2x.png",
      size: "M",
      color: "Azul",
      quantity: 2
    },
    {
      id: 2,
      name: "Gorra Deportiva",
      price: 18.99,
      originalPrice: 24.99,
      image: "/797e7904b64e13508ab322be3107e368-1@2x.png",
      size: "Única",
      color: "Negro",
      quantity: 1
    }
  ]);

  // Estados del formulario
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'MX'
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'credit_card'
  });

  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Cálculos
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 50;
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + shipping + tax;

  // Validaciones
  const isShippingValid = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'postalCode'];
    return requiredFields.every(field => shippingAddress[field as keyof ShippingAddress]?.toString().trim());
  };

  const isPaymentValid = () => {
    if (paymentMethod.type === 'paypal' || paymentMethod.type === 'bank_transfer') {
      return true;
    }
    return paymentMethod.cardNumber && paymentMethod.expiryDate && paymentMethod.cvv && paymentMethod.cardHolder;
  };

  // Handlers
  const handleShippingChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field: keyof PaymentMethod, value: string) => {
    setPaymentMethod(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !isShippingValid()) {
      alert(t('Por favor completa todos los campos obligatorios de envío'));
      return;
    }
    if (currentStep === 2 && !isPaymentValid()) {
      alert(t('Por favor completa la información de pago'));
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmitOrder = async () => {
    if (!agreeToTerms) {
      alert(t('Debes aceptar los términos y condiciones'));
      return;
    }

    setIsProcessing(true);
    
    // Simular procesamiento del pedido
    setTimeout(() => {
      alert(t('¡Pedido procesado exitosamente! Te enviaremos un email de confirmación.'));
      router.push('/');
      setIsProcessing(false);
    }, 2000);
  };

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
              <Link href="/carrito" className="text-gray-600 hover:text-black no-underline">
                {t('Carrito')}
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-black font-medium">{t('Checkout')}</span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="py-8 px-4 md:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider mb-8">
              {t('FINALIZAR COMPRA')}
            </h1>

            {/* Indicador de pasos */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      currentStep >= step 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    <div className={`text-sm ml-2 ${
                      currentStep >= step ? 'text-black font-medium' : 'text-gray-600'
                    }`}>
                      {step === 1 && t('Envío')}
                      {step === 2 && t('Pago')}
                      {step === 3 && t('Confirmación')}
                    </div>
                    {step < 3 && (
                      <div className={`w-8 h-px ml-4 ${
                        currentStep > step ? 'bg-black' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formularios */}
              <div className="lg:col-span-2">
                {/* Paso 1: Información de envío */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-6">{t('Información de Envío')}</h2>
                      
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Nombre')} *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.firstName}
                              onChange={(e) => handleShippingChange('firstName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Apellidos')} *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.lastName}
                              onChange={(e) => handleShippingChange('lastName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Email')} *
                            </label>
                            <input
                              type="email"
                              value={shippingAddress.email}
                              onChange={(e) => handleShippingChange('email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Teléfono')} *
                            </label>
                            <input
                              type="tel"
                              value={shippingAddress.phone}
                              onChange={(e) => handleShippingChange('phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Dirección')} *
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.address}
                            onChange={(e) => handleShippingChange('address', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder={t('Calle, número, colonia')}
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Ciudad')} *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.city}
                              onChange={(e) => handleShippingChange('city', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Estado')} *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.state}
                              onChange={(e) => handleShippingChange('state', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Código Postal')} *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.postalCode}
                              onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              required
                            />
                          </div>
                        </div>
                      </form>
                      
                      <div className="flex justify-end mt-8">
                        <button
                          onClick={handleNextStep}
                          className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
                        >
                          {t('Continuar al Pago')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 2: Método de pago */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-6">{t('Método de Pago')}</h2>
                      
                      {/* Selector de método de pago */}
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'credit_card', label: t('Tarjeta de Crédito'), icon: '💳' },
                            { id: 'debit_card', label: t('Tarjeta de Débito'), icon: '💳' },
                            { id: 'paypal', label: 'PayPal', icon: '🅿️' },
                            { id: 'bank_transfer', label: t('Transferencia Bancaria'), icon: '🏦' }
                          ].map((method) => (
                            <label key={method.id} className="cursor-pointer">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={method.id}
                                checked={paymentMethod.type === method.id}
                                onChange={(e) => handlePaymentChange('type', e.target.value)}
                                className="sr-only"
                              />
                              <div className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                                paymentMethod.type === method.id 
                                  ? 'border-black bg-gray-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}>
                                <span className="text-2xl">{method.icon}</span>
                                <span className="font-medium">{method.label}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Formulario de tarjeta */}
                      {(paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') && (
                        <form className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Número de Tarjeta')} *
                            </label>
                            <input
                              type="text"
                              value={paymentMethod.cardNumber || ''}
                              onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              placeholder="1234 5678 9012 3456"
                              maxLength={19}
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Nombre del Titular')} *
                            </label>
                            <input
                              type="text"
                              value={paymentMethod.cardHolder || ''}
                              onChange={(e) => handlePaymentChange('cardHolder', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                              placeholder={t('Como aparece en la tarjeta')}
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('Fecha de Vencimiento')} *
                              </label>
                              <input
                                type="text"
                                value={paymentMethod.expiryDate || ''}
                                onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="MM/AA"
                                maxLength={5}
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                CVV *
                              </label>
                              <input
                                type="text"
                                value={paymentMethod.cvv || ''}
                                onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="123"
                                maxLength={4}
                                required
                              />
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Información para otros métodos */}
                      {paymentMethod.type === 'paypal' && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            {t('Serás redirigido a PayPal para completar tu pago de forma segura.')}
                          </p>
                        </div>
                      )}

                      {paymentMethod.type === 'bank_transfer' && (
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            {t('Te enviaremos los datos bancarios por email una vez confirmado el pedido.')}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-8">
                        <button
                          onClick={handlePrevStep}
                          className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                        >
                          {t('Volver')}
                        </button>
                        <button
                          onClick={handleNextStep}
                          className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
                        >
                          {t('Revisar Pedido')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 3: Confirmación */}
                {currentStep === 3 && (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-6">{t('Revisar y Confirmar')}</h2>
                      
                      {/* Información de envío */}
                      <div className="mb-6">
                        <h3 className="font-bold text-lg mb-3">{t('Información de Envío')}</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium">
                            {shippingAddress.firstName} {shippingAddress.lastName}
                          </p>
                          <p>{shippingAddress.address}</p>
                          <p>
                            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                          </p>
                          <p>{shippingAddress.phone}</p>
                          <p>{shippingAddress.email}</p>
                        </div>
                      </div>
                      
                      {/* Método de pago */}
                      <div className="mb-6">
                        <h3 className="font-bold text-lg mb-3">{t('Método de Pago')}</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p>
                            {paymentMethod.type === 'credit_card' && t('Tarjeta de Crédito')}
                            {paymentMethod.type === 'debit_card' && t('Tarjeta de Débito')}
                            {paymentMethod.type === 'paypal' && 'PayPal'}
                            {paymentMethod.type === 'bank_transfer' && t('Transferencia Bancaria')}
                          </p>
                          {paymentMethod.cardNumber && (
                            <p>**** **** **** {paymentMethod.cardNumber.slice(-4)}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Términos y condiciones */}
                      <div className="mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                          />
                          <span className="text-sm">
                            {t('Acepto los')}{' '}
                            <Link href="/terminos" className="text-black underline">
                              {t('términos y condiciones')}
                            </Link>
                            {' '}{t('y la')}{' '}
                            <Link href="/privacidad" className="text-black underline">
                              {t('política de privacidad')}
                            </Link>
                          </span>
                        </label>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={handlePrevStep}
                          className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                        >
                          {t('Volver')}
                        </button>
                        <button
                          onClick={handleSubmitOrder}
                          disabled={!agreeToTerms || isProcessing}
                          className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? t('Procesando...') : t('CONFIRMAR PEDIDO')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen del pedido */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border sticky top-4">
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-6">{t('Resumen del Pedido')}</h2>
                    
                    {/* Productos */}
                    <div className="space-y-4 mb-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={60}
                            height={60}
                            className="w-15 h-15 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{t(item.name)}</h3>
                            <p className="text-gray-600 text-xs">
                              {t('Talla')}: {item.size} • {t('Color')}: {t(item.color)}
                            </p>
                            <p className="text-xs">
                              {t('Cantidad')}: {item.quantity}
                            </p>
                            <p className="font-bold text-sm">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Totales */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex justify-between text-sm">
                        <span>{t('Subtotal')}</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>{t('Envío')}</span>
                        <span>
                          {shipping === 0 ? (
                            <span className="text-green-600">{t('GRATIS')}</span>
                          ) : (
                            formatPrice(shipping)
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>{t('IVA')} (16%)</span>
                        <span>{formatPrice(tax)}</span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>{t('Total')}</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
