import { Fragment, useState } from "react";
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
  // Este estado controla la visibilidad del LoadingScreen
  const [isVisible, setIsVisible] = useState(true);
  
  return (
    <>
      <LoadingScreen 
        isVisible={isVisible}
        message="Preparando tu experiencia de compra"
        onBackendReady={() => {
          console.log('Backend listo, ocultando pantalla de carga');
          setIsVisible(false);
        }}
      />
      {children}
    </>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Fragment>
      <Head>
        <title>Trebodeluxe - Tienda Online</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <AuthProvider>
        <LoadingProvider>
          <InitialLoadingCheck>
            <LoadingWrapper>
              <Component {...pageProps} />
            </LoadingWrapper>
          </InitialLoadingCheck>
        </LoadingProvider>
      </AuthProvider>
    </Fragment>
  );
}

export default MyApp;
