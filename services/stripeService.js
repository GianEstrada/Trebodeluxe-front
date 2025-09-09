import { loadStripe } from '@stripe/stripe-js';

// Cargar Stripe con la clave pública
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Servicio para manejar pagos con Stripe
export class StripeService {
  // Montos mínimos por moneda según Stripe (en centavos)
  static MINIMUM_AMOUNTS = {
    mxn: 1000, // $10.00 MXN
    usd: 50,   // $0.50 USD
    eur: 50    // €0.50 EUR
  };

  static validateMinimumAmount(amount, currency) {
    const minAmount = this.MINIMUM_AMOUNTS[currency.toLowerCase()];
    if (!minAmount) {
      console.warn(`⚠️ No se encontró monto mínimo para la moneda: ${currency}`);
      return { isValid: true }; // Permitir si no conocemos la moneda
    }

    if (amount < minAmount) {
      const formattedMin = (minAmount / 100).toFixed(2);
      const formattedAmount = (amount / 100).toFixed(2);
      
      return {
        isValid: false,
        message: `El monto mínimo para ${currency.toUpperCase()} es $${formattedMin}. Monto actual: $${formattedAmount}`,
        minimumAmount: minAmount,
        currentAmount: amount
      };
    }

    return { isValid: true };
  }

  static async createPaymentIntent(amount, currency = 'mxn', metadata = {}) {
    try {
      console.log('🔄 Creating Payment Intent:', { amount, currency, metadata });
      
      // Validar monto mínimo antes de enviar a Stripe
      const validation = this.validateMinimumAmount(amount, currency);
      if (!validation.isValid) {
        console.error('❌ Monto menor al mínimo permitido:', validation.message);
        throw new Error(validation.message);
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          metadata
        }),
      });

      console.log('📥 Payment Intent Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Payment Intent Error Response:', errorText);
        throw new Error(`Error al crear el payment intent: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Payment Intent Created Successfully:', data);
      return data;
    } catch (error) {
      console.error('💥 Error en createPaymentIntent:', error);
      throw error;
    }
  }

  static async confirmPayment(stripe, elements, clientSecret, returnUrl) {
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      return result;
    } catch (error) {
      console.error('Error en confirmPayment:', error);
      throw error;
    }
  }

  static async getPaymentStatus(paymentIntentId) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/payment-intent/${paymentIntentId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener el estado del pago');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getPaymentStatus:', error);
      throw error;
    }
  }

  static async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          amount,
          reason
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el reembolso');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en createRefund:', error);
      throw error;
    }
  }
}

export { stripePromise };
