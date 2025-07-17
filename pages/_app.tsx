import { Fragment, useState, useEffect } from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import "./global.css";
import { AuthProvider } from "../contexts/AuthContext";
import { LoadingProvider, useLoading } from "../contexts/LoadingContext";
import LoadingScreen from "../components/LoadingScreen";

// Componente wrapper para mostrar la pantalla de carga basada en el contexto
function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading } = useLoading();
  return (
    <>
      <LoadingScreen 
        isVisible={isLoading}
        message="Procesando tu solicitud..."
      />
      {children}
    </>
  );
}

// Componente para la verificación inicial del backend
function InitialLoadingCheck({ children }: { children: React.ReactNode }) {
  const [isBackendLoading, setIsBackendLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
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
        } else {
          // Si el backend no responde correctamente, mantener la pantalla de carga
          console.log('Backend respondió con error, verificando estado...');
        }
      } catch (error) {
        console.log('Backend en modo sleep o no disponible, mostrando pantalla de carga');
        // Mantener el estado de carga activo
      } finally {
        setInitialCheckDone(true);
      }
    };
    
    checkBackend();
  }, []);
  
  return (
    <>
      {initialCheckDone && (
        <LoadingScreen 
          isVisible={isBackendLoading}
          message="Preparando tu experiencia de compra"
          onBackendReady={() => setIsBackendLoading(false)}
        />
      )}
      {children}
    </>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  
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
        <InitialLoadingCheck>
          <AuthProvider>
            <LoadingWrapper>
              <Component {...pageProps} />
            </LoadingWrapper>
          </AuthProvider>
        </InitialLoadingCheck>
      </LoadingProvider>
    </Fragment>
  );
}

export default MyApp;
