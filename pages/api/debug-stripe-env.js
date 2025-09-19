// Endpoint temporal para debug específico de Stripe
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Debug completo de todas las variables de entorno relacionadas con Stripe
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  const debugInfo = {
    // Variables de entorno
    stripeKey: stripeKey || 'UNDEFINED',
    stripeKeyType: typeof stripeKey,
    stripeKeyLength: stripeKey ? stripeKey.length : 0,
    stripeKeyStartsWith: stripeKey ? stripeKey.substring(0, 7) : 'N/A',
    
    // Todas las variables que empiezan con NEXT_PUBLIC_
    allNextPublicVars: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .reduce((obj, key) => {
        obj[key] = key === 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' 
          ? (process.env[key] ? `${process.env[key].substring(0, 10)}...` : 'UNDEFINED')
          : process.env[key];
        return obj;
      }, {}),
    
    // Información del entorno
    nodeEnv: process.env.NODE_ENV,
    platform: process.platform,
    buildTime: process.env.BUILD_TIME || 'Not set',
    
    // Test directo de acceso
    directAccess: {
      withBrackets: process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] || 'UNDEFINED',
      normalAccess: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'UNDEFINED',
    }
  };

  res.status(200).json({
    message: 'Stripe Environment Debug - Eliminar después del debug',
    debug: debugInfo,
    timestamp: new Date().toISOString()
  });
}