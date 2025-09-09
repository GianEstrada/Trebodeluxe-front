import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { StripeService } from '../services/stripeService';

// Validar variable de entorno y cargar Stripe
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('❌ STRIPE ERROR: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no está definida en las variables de entorno');
  console.log('🔧 Solución: Configurar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY en Render');
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Componente del formulario de pago
const PaymentForm = ({ 
  amount, 
  currency, 
  metadata, 
  onPaymentSuccess, 
  onPaymentError,
  isProcessing,
  setIsProcessing,
  t
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
      redirect: 'if_required'
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message);
        onPaymentError?.(error);
      } else {
        setMessage(t('Ocurrió un error inesperado.'));
        onPaymentError?.(error);
      }
    } else {
      // Pago exitoso - pasar el payment intent ID al callback
      console.log('✅ [STRIPE] Pago confirmado exitosamente:', paymentIntent.id);
      onPaymentSuccess?.(paymentIntent.id);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-black/40 border border-white/20 rounded-lg p-4">
        <PaymentElement 
          options={{
            layout: "accordion",
            wallets: {
              applePay: 'auto',
              googlePay: 'auto'
            }
          }}
        />
      </div>
      
      {message && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 text-red-300 text-sm">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-medium transition-all duration-300 text-lg"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{t('Procesando...')}</span>
          </div>
        ) : (
          `${t('Pagar con Stripe')} ${amount ? `$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}` : ''}`
        )}
      </button>
    </form>
  );
};

// Componente principal de pago con Stripe
const StripePayment = ({ 
  amount, 
  currency = 'mxn', 
  metadata = {},
  onPaymentSuccess, 
  onPaymentError,
  t
}) => {
  const [clientSecret, setClientSecret] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false); // Prevenir múltiples llamadas

  // Debug: Validar la configuración de Stripe
  console.log('🔍 StripePayment Debug:', {
    keyExists: !!stripePublishableKey,
    keyLength: stripePublishableKey?.length || 0,
    keyPrefix: stripePublishableKey?.substring(0, 20) || 'No disponible',
    stripePromiseExists: !!stripePromise,
    amount,
    currency,
    hasClientSecret: !!clientSecret,
    isCreatingPayment
  });

  useEffect(() => {
    const createPaymentIntent = async () => {
      // Prevenir múltiples llamadas simultáneas
      if (isCreatingPayment) {
        console.log('⏸️ Ya se está creando un Payment Intent, saltando...');
        return;
      }

      try {
        setIsCreatingPayment(true);
        setIsLoading(true);
        setError(null);
        
        console.log('🔄 Creating new Payment Intent for amount:', amount, 'currency:', currency);
        const data = await StripeService.createPaymentIntent(amount, currency, metadata);
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        console.log('✅ Payment Intent created:', data.paymentIntentId, 'for amount:', amount);
      } catch (error) {
        console.error('❌ Error creando payment intent:', error);
        setError(t('Error al inicializar el pago. Por favor, intenta de nuevo.'));
      } finally {
        setIsLoading(false);
        setIsCreatingPayment(false);
      }
    };

    // Solo crear Payment Intent si:
    // 1. Hay un amount válido
    // 2. No hay un clientSecret existente para este amount
    // 3. No se está creando ya uno
    if (amount && amount > 0 && !isCreatingPayment) {
      // Resetear clientSecret si el amount cambió para forzar nueva creación
      if (clientSecret) {
        console.log('💱 Amount changed, resetting Payment Intent');
        setClientSecret('');
        setPaymentIntentId('');
      }
      createPaymentIntent();
    }
  }, [amount, currency]);

  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#10b981',
      colorBackground: 'rgba(0, 0, 0, 0.4)',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      borderRadius: '8px',
    },
  };

  if (isLoading) {
    return (
      <div className="bg-black/40 border border-white/20 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="text-white">{t('Inicializando método de pago...')}</span>
        </div>
      </div>
    );
  }

  // Validar configuración de Stripe
  if (!stripePublishableKey) {
    return (
      <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-red-300 font-semibold">Error de configuración de Stripe</div>
            <div className="text-red-400 text-sm mt-1">
              La clave pública de Stripe no está configurada. 
              Contacta al administrador para configurar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-300">{error}</span>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-6">
        <span className="text-yellow-300">{t('Error al configurar el pago')}</span>
      </div>
    );
  }

  return (
    <div key={clientSecret}> {/* Key force re-render when clientSecret changes */}
      <Elements 
        stripe={stripePromise} 
        options={{ 
          clientSecret, 
          appearance 
        }}
      >
        <PaymentForm
          amount={amount}
          currency={currency}
          metadata={metadata}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          t={t}
        />
      </Elements>
    </div>
  );
};

export default StripePayment;
