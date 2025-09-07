import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { useUniversalTranslate } from '../../hooks/useUniversalTranslate';

// Cargar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CheckoutCompletePage: NextPage = () => {
  const router = useRouter();
  const { t } = useUniversalTranslate();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'succeeded' | 'failed' | 'processing'>('loading');
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe no se pudo cargar');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const clientSecret = urlParams.get('payment_intent_client_secret');

        if (!clientSecret) {
          setError(t('No se encontró información del pago'));
          setPaymentStatus('failed');
          return;
        }

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
        setPaymentIntent(paymentIntent);

        switch (paymentIntent?.status) {
          case 'succeeded':
            setPaymentStatus('succeeded');
            break;
          case 'processing':
            setPaymentStatus('processing');
            break;
          case 'requires_payment_method':
            setPaymentStatus('failed');
            setError(t('El pago no se pudo procesar. Por favor, intenta con otro método de pago.'));
            break;
          default:
            setPaymentStatus('failed');
            setError(t('Estado de pago desconocido'));
            break;
        }
      } catch (err: any) {
        console.error('Error verificando el estado del pago:', err);
        setError(err.message || t('Error al verificar el estado del pago'));
        setPaymentStatus('failed');
      }
    };

    checkPaymentStatus();
  }, [t]);

  const handleReturnToHome = () => {
    router.push('/');
  };

  const handleRetryPayment = () => {
    router.push('/checkout');
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'succeeded':
        return (
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        );
      case 'failed':
        return (
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        );
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'succeeded':
        return t('¡Pago Exitoso!');
      case 'processing':
        return t('Procesando Pago...');
      case 'failed':
        return t('Pago Fallido');
      default:
        return t('Verificando Pago...');
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'succeeded':
        return t('Tu pago se ha procesado exitosamente. Recibirás una confirmación por email en breve.');
      case 'processing':
        return t('Tu pago se está procesando. Esto puede tomar unos minutos.');
      case 'failed':
        return error || t('Hubo un problema con tu pago. Por favor, intenta de nuevo.');
      default:
        return t('Verificando el estado de tu pago...');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
        {getStatusIcon()}
        
        <h1 className="text-2xl font-bold text-white mb-4">
          {getStatusTitle()}
        </h1>
        
        <p className="text-gray-300 mb-6">
          {getStatusMessage()}
        </p>

        {paymentIntent && (
          <div className="bg-black/40 border border-white/20 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-white font-medium mb-2">{t('Detalles del Pago')}</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>{t('ID de Pago')}:</span>
                <span className="font-mono">{paymentIntent.id}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Estado')}:</span>
                <span className={`capitalize ${
                  paymentIntent.status === 'succeeded' ? 'text-green-400' :
                  paymentIntent.status === 'processing' ? 'text-blue-400' :
                  'text-red-400'
                }`}>
                  {paymentIntent.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('Monto')}:</span>
                <span>${(paymentIntent.amount / 100).toFixed(2)} {paymentIntent.currency.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {paymentStatus === 'succeeded' && (
            <button
              onClick={handleReturnToHome}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
            >
              {t('Volver al Inicio')}
            </button>
          )}
          
          {paymentStatus === 'failed' && (
            <>
              <button
                onClick={handleRetryPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                {t('Intentar de Nuevo')}
              </button>
              <button
                onClick={handleReturnToHome}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                {t('Volver al Inicio')}
              </button>
            </>
          )}

          {paymentStatus === 'processing' && (
            <button
              onClick={handleReturnToHome}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
            >
              {t('Volver al Inicio')}
            </button>
          )}
        </div>

        {paymentIntent && paymentStatus === 'succeeded' && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <a
              href={`https://dashboard.stripe.com/payments/${paymentIntent.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center space-x-1"
            >
              <span>{t('Ver detalles en Stripe')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutCompletePage;
