import { useEffect, useState } from 'react';

interface DebugInfo {
  stripeKey: string;
  stripeKeyType: string;
  stripeKeyLength: number;
  stripeKeyPreview: string;
  allNextPublicVars: Record<string, any>;
  userAgent: string;
  location: string;
}

export default function StripeDebugPage() {
  const [clientInfo, setClientInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    // Debug en el lado del cliente
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    const info = {
      stripeKey: stripeKey || 'UNDEFINED',
      stripeKeyType: typeof stripeKey,
      stripeKeyLength: stripeKey ? stripeKey.length : 0,
      stripeKeyPreview: stripeKey ? `${stripeKey.substring(0, 10)}...` : 'N/A',
      
      // Todas las variables NEXT_PUBLIC_ disponibles en el cliente
      allNextPublicVars: Object.keys(process.env)
        .filter(key => key.startsWith('NEXT_PUBLIC_'))
        .reduce((obj: Record<string, any>, key) => {
          obj[key] = key === 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' 
            ? (process.env[key] ? `${process.env[key]!.substring(0, 10)}...` : 'UNDEFINED')
            : process.env[key];
          return obj;
        }, {}),
      
      // Información del browser
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server Side',
      location: typeof window !== 'undefined' ? window.location.href : 'Server Side',
    };
    
    setClientInfo(info);
    
    // Log en consola del browser
    console.log('🔍 Client-side Stripe Debug:', info);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-red-600">🔍 Stripe Environment Debug (Client-side)</h1>
      
      <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h2 className="text-lg font-semibold mb-2">⚠️ IMPORTANTE:</h2>
        <p>Esta página es solo para debugging. Eliminar después de resolver el problema.</p>
      </div>

      {clientInfo && (
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">🔑 Stripe Key Info</h2>
            <div className="space-y-2 font-mono text-sm">
              <div><strong>Key:</strong> {clientInfo.stripeKey}</div>
              <div><strong>Type:</strong> {clientInfo.stripeKeyType}</div>
              <div><strong>Length:</strong> {clientInfo.stripeKeyLength}</div>
              <div><strong>Preview:</strong> {clientInfo.stripeKeyPreview}</div>
            </div>
          </div>

          <div className="bg-blue-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">🌍 All NEXT_PUBLIC_ Variables</h2>
            <div className="space-y-1 font-mono text-sm">
              {Object.entries(clientInfo.allNextPublicVars).map(([key, value]) => (
                <div key={key}><strong>{key}:</strong> {String(value)}</div>
              ))}
            </div>
          </div>

          <div className="bg-green-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">🖥️ Environment Info</h2>
            <div className="space-y-1 font-mono text-sm">
              <div><strong>User Agent:</strong> {clientInfo.userAgent}</div>
              <div><strong>Location:</strong> {clientInfo.location}</div>
            </div>
          </div>

          {clientInfo.stripeKey === 'UNDEFINED' && (
            <div className="bg-red-100 p-4 rounded border border-red-400">
              <h2 className="text-xl font-semibold mb-3 text-red-700">❌ Stripe Key NOT Found</h2>
              <div className="text-sm space-y-2">
                <p><strong>Problema:</strong> NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no está disponible en el cliente.</p>
                <p><strong>Posibles causas:</strong></p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Variable no configurada en Render</li>
                  <li>Variable no disponible durante el build</li>
                  <li>Error en next.config.js</li>
                  <li>Variable mal escrita (case-sensitive)</li>
                </ul>
              </div>
            </div>
          )}

          {clientInfo.stripeKey !== 'UNDEFINED' && (
            <div className="bg-green-100 p-4 rounded border border-green-400">
              <h2 className="text-xl font-semibold mb-3 text-green-700">✅ Stripe Key Found</h2>
              <p className="text-sm">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY está correctamente configurada.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}