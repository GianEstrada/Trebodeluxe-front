import { loadStripe } from '@stripe/stripe-js';

// Cargar Stripe con la clave pública
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Servicio para manejar pagos con Stripe
export class StripeService {
  static async createPaymentIntent(amount, currency = 'mxn', metadata = {}) {
    try {
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

      if (!response.ok) {
        throw new Error('Error al crear el payment intent');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en createPaymentIntent:', error);
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
