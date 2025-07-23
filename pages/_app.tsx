import { Fragment, useState } from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import "./global.css";
import { AuthProvider } from "../contexts/AuthContext";
import { LoadingProvider, useLoading } from "../contexts/LoadingContext";
import { SiteSettingsProvider } from "../contexts/SiteSettingsContext";
import { MainImagesProvider } from "../contexts/MainImagesContext";
import { CartProvider } from "../contexts/CartContext";
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
          <SiteSettingsProvider>
            <MainImagesProvider>
              <CartProvider>
                <LoadingManager>
                  <Component {...pageProps} />
                </LoadingManager>
              </CartProvider>
            </MainImagesProvider>
          </SiteSettingsProvider>
        </LoadingProvider>
      </AuthProvider>
    </Fragment>
  );
}

export default MyApp;
