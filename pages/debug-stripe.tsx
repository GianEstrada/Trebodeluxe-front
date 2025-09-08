// Debug script para verificar variables de entorno de Stripe
console.log('🔍 Debug de variables de entorno de Stripe:');
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
console.log('Tipo:', typeof process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
console.log('Es undefined:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === undefined);
console.log('Es null:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === null);
console.log('Es string vacío:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === '');

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error('❌ CRÍTICO: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no está definida');
    console.log('📋 Para solucionarlo en Render:');
    console.log('1. Ve a https://dashboard.render.com');
    console.log('2. Busca el servicio trebodeluxe-front');
    console.log('3. Ve a la pestaña "Environment"');
    console.log('4. Agrega: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = tu_clave_publica');
    console.log('5. Haz "Manual Deploy" para reiniciar');
}

export default function StripeDebugPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold mb-6">🔧 Debug de Stripe</h1>
            
            <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded">
                    <h2 className="text-xl font-semibold mb-2">Variables de Entorno:</h2>
                    <div className="font-mono text-sm">
                        <div>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
                            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
                                ? `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...` 
                                : '❌ NO DEFINIDA'
                        }</div>
                        <div>Tipo: {typeof process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}</div>
                    </div>
                </div>
                
                {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                    <div className="bg-red-900/50 border border-red-500 p-4 rounded">
                        <h3 className="text-red-400 font-semibold">🚨 Problema Crítico</h3>
                        <p className="mt-2">La variable NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no está configurada en Render.</p>
                        <div className="mt-3 text-sm">
                            <p><strong>Solución:</strong></p>
                            <ol className="list-decimal list-inside mt-1 space-y-1">
                                <li>Ve a https://dashboard.render.com</li>
                                <li>Busca el servicio trebodeluxe-front</li>
                                <li>Ve a la pestaña &quot;Environment&quot;</li>
                                <li>Agrega: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</li>
                                <li>Usa tu clave pública de Stripe (pk_test_... o pk_live_...)</li>
                                <li>Haz &quot;Manual Deploy&quot; para reiniciar</li>
                            </ol>
                        </div>
                    </div>
                )}
                
                {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                    <div className="bg-green-900/50 border border-green-500 p-4 rounded">
                        <h3 className="text-green-400 font-semibold">✅ Variable Configurada</h3>
                        <p className="mt-2">La variable está definida correctamente.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
