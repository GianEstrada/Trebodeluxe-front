// Este es un endpoint temporal para debugging en producción
// Se debe eliminar después de resolver el problema

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Solo mostrar en producción si es necesario para debug
  const envVars = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 
      `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 10)}...` : 
      'NOT_FOUND',
    NODE_ENV: process.env.NODE_ENV,
    // Solo mostrar las primeras letras de Stripe por seguridad
  };

  res.status(200).json({
    message: 'Environment Variables Debug (Eliminar este endpoint después del debug)',
    environment: envVars,
    buildTime: new Date().toISOString()
  });
}