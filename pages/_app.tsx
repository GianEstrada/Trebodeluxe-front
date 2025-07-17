import { Fragment, useState, useEffect } from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import "./global.css";
import { AuthProvider } from "../contexts/AuthContext";
import { LoadingProvider } from "../contexts/LoadingContext";
import LoadingScreen from "../components/LoadingScreen";

function MyApp({ Component, pageProps }: AppProps) {
  // El backend ya está funcionando, por lo que no necesitamos mostrar la pantalla de carga
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(true);
  
  // Dejamos este efecto comentado por si necesitamos volver a activar la pantalla de carga en el futuro
  /*
  useEffect(() => {
    // Verificar el estado del backend al cargar la aplicación
    const checkBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';
        const response = await fetch(`${backendUrl}/api/health`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Establecer un timeout para que no espere indefinidamente
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          setIsBackendLoading(false);
        }
      } catch (error) {
        console.log('Backend en modo sleep o no disponible');
        // Mantener el estado de carga activo
      } finally {
        setInitialCheckDone(true);
      }
    };
    
    checkBackend();
  }, []);
  */
  
  return (
    <Fragment>
      <Head>
        <title>Treboluxe</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <LoadingProvider>
        <AuthProvider>
          {initialCheckDone && (
            <LoadingScreen 
              isVisible={isBackendLoading}
              message="Preparando tu experiencia de compra"
              onBackendReady={() => setIsBackendLoading(false)}
            />
          )}
          <Component {...pageProps} />
        </AuthProvider>
      </LoadingProvider>
    </Fragment>
  );
}

export default MyApp;
