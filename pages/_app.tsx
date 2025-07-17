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
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [dbStatus, setDbStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  useEffect(() => {
    // Verificar el estado del backend al cargar la aplicación
    const checkBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trebodeluxe-backend.onrender.com';
        const response = await fetch(`${backendUrl}/api/health`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Establecer un timeout para que no espere indefinidamente
          signal: AbortSignal.timeout(8000)
        });
        
        if (response.ok) {
          // Verificar si la respuesta incluye información sobre la base de datos
          const data = await response.json();
          
          if (data.database === 'connected' && data.status === 'ok') {
            // Base de datos conectada, quitar la pantalla de carga
            setDbStatus('connected');
            setIsBackendLoading(false);
            console.log('Backend y base de datos están listos');
          } else if (data.database === 'connected') {
            // Base de datos conectada pero el estado no es ok
            setDbStatus('connected');
            setIsBackendLoading(false);
            console.log('Backend y base de datos conectados, pero el estado no es óptimo');
          } else {
            // Base de datos no está conectada todavía, seguir intentando
            setDbStatus('disconnected');
            if (checkAttempts < 5) {
              console.log(`Intento ${checkAttempts + 1}: Base de datos no está lista, reintentando...`);
              setTimeout(checkBackend, 3000);
              setCheckAttempts(prev => prev + 1);
            } else {
              // Después de 5 intentos, permitir continuar aunque la DB no esté lista
              console.log('Máximo de intentos alcanzado, permitiendo continuar sin DB');
              setIsBackendLoading(false);
            }
          }
        } else {
          // Si el backend no responde correctamente, mantener la pantalla de carga
          console.log('Backend respondió con error, verificando estado...');
          if (checkAttempts < 5) {
            setTimeout(checkBackend, 3000);
            setCheckAttempts(prev => prev + 1);
          } else {
            // Después de 5 intentos, permitir continuar aunque haya errores
            setIsBackendLoading(false);
          }
        }
      } catch (error) {
        console.log('Backend en modo sleep o no disponible, mostrando pantalla de carga');
        // Reintentar si no se ha alcanzado el máximo de intentos
        if (checkAttempts < 5) {
          setTimeout(checkBackend, 3000);
          setCheckAttempts(prev => prev + 1);
        } else {
          // Después de 5 intentos, permitir continuar aunque haya errores
          setIsBackendLoading(false);
        }
      } finally {
        setInitialCheckDone(true);
      }
    };
    
    checkBackend();
  }, [checkAttempts]);
  
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
