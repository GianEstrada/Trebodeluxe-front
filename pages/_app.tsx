import { Fragment, useState } from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import "./global.css";
import { AuthProvider } from "../contexts/AuthContext";
import { LoadingProvider, useLoading } from "../contexts/LoadingContext";
import LoadingScreen from "../components/LoadingScreen";

// Componente unificado para manejo de carga
function LoadingManager({ children }: { children: React.ReactNode }) {
  const { isLoading } = useLoading();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  return (
    <>
      <LoadingScreen 
        isVisible={isInitialLoading || isLoading}
        message={isInitialLoading ? "Preparando tu experiencia de compra" : "Procesando tu solicitud..."}
        onBackendReady={() => {
          console.log('Backend listo, ocultando pantalla de carga inicial');
          setIsInitialLoading(false);
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
          <LoadingManager>
            <Component {...pageProps} />
          </LoadingManager>
        </LoadingProvider>
      </AuthProvider>
    </Fragment>
  );
}

export default MyApp;
