import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import Footer from "../components/Footer";

const ComoComprar: NextPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const router = useRouter();

  const steps = [
    {
      number: "01",
      title: t("Seleccionar un producto"),
      description: t("Navega por nuestro catálogo y encuentra el producto que más te guste. Puedes filtrar por categoría, marca, color o precio."),
      icon: "🛍️"
    },
    {
      number: "02", 
      title: t("Agregar al carrito"),
      description: t("Una vez que hayas encontrado tu producto favorito, haz clic en el botón 'Agregar al carrito'."),
      icon: "🛒"
    },
    {
      number: "03",
      title: t("Seleccionar talla"),
      description: t("Se abrirá un selector donde podrás elegir la talla y cantidad deseada del producto."),
      icon: "📏"
    },
    {
      number: "04", 
      title: t("Ver carrito completo"),
      description: t("Revisa todos los productos en tu carrito, puedes modificar cantidades o eliminar productos si lo deseas."),
      icon: "👀"
    },
    {
      number: "05",
      title: t("Calcular envío"),
      description: t("Ingresa tu código postal para calcular el costo de envío a tu ubicación."),
      icon: "📮"
    },
    {
      number: "06",
      title: t("Ir al checkout"),
      description: t("Una vez que estés satisfecho con tu pedido, haz clic en 'Ir al checkout' para proceder con la compra."),
      icon: "💳"
    },
    {
      number: "07",
      title: t("Información personal y envío"),
      description: t("Completa o actualiza tu información personal y la dirección de envío donde quieres recibir tu pedido."),
      icon: "📝"
    },
    {
      number: "08",
      title: t("Método de envío"),
      description: t("Selecciona el método de envío que prefieras entre las opciones disponibles (estándar, express, etc.)."),
      icon: "🚚"
    },
    {
      number: "09",
      title: t("Seguro de envío"),
      description: t("Decide si quieres agregar seguro de envío para proteger tu pedido durante el transporte."),
      icon: "🛡️"
    },
    {
      number: "10",
      title: t("Información de pago"),
      description: t("Introduce los datos de tu tarjeta de crédito o débito de forma segura a través de Stripe."),
      icon: "💰"
    },
    {
      number: "11",
      title: t("Completar pago"),
      description: t("Revisa todos los datos y completa tu pago. Recibirás una confirmación por email con los detalles de tu pedido."),
      icon: "✅"
    }
  ];

  return (
    <div className="w-full min-h-screen [background:linear-gradient(180deg,_#323232,_#000)] flex flex-col">
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}

      {/* Header simple */}
      <header className="w-full bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image
              className="w-8 h-8"
              width={32}
              height={32}
              alt="Treboluxe Logo"
              src="/sin-ttulo1-2@2x.png"
            />
            <span className="text-white font-bold text-xl">Treboluxe</span>
          </Link>
          
          <button
            onClick={() => router.back()}
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t("Volver")}
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 md:py-16">
        <div className="w-full max-w-4xl">
          {/* Título principal */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <Image
                className="w-16 h-16 mx-auto"
                width={64}
                height={64}
                alt="Treboluxe Logo"
                src="/sin-ttulo1-2@2x.png"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-wide">
              {t("¿CÓMO COMPRAR?")}
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              {t("Sigue estos sencillos pasos para realizar tu compra en Treboluxe y recibe tu pedido en la comodidad de tu hogar.")}
            </p>
          </div>

          {/* Pasos */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Línea conectora */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 md:left-12 top-20 w-0.5 h-16 bg-gradient-to-b from-green-500 to-green-700 hidden md:block"></div>
                )}
                
                <div className="flex flex-col md:flex-row items-start gap-6 p-6 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-black/40 transition-all duration-300">
                  {/* Número y icono */}
                  <div className="flex-shrink-0 flex items-center gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white font-bold text-xl md:text-2xl">
                      {step.number}
                    </div>
                    <div className="text-3xl md:text-4xl">
                      {step.icon}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to action */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 border border-green-500/20">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {t("¿Listo para empezar?")}
              </h2>
              <p className="text-green-100 text-lg mb-6">
                {t("Explora nuestro catálogo y encuentra tu estilo único")}
              </p>
              <Link href="/catalogo" className="inline-block bg-white text-green-800 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-300 no-underline">
                {t("Ver Catálogo")}
              </Link>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/20 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                📞 {t("¿Necesitas ayuda?")}
              </h3>
              <p className="text-gray-300 text-sm">
                {t("Si tienes alguna duda durante el proceso de compra, no dudes en contactarnos. Estamos aquí para ayudarte.")}
              </p>
            </div>

            <div className="bg-black/20 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                🔒 {t("Compra segura")}
              </h3>
              <p className="text-gray-300 text-sm">
                {t("Todas nuestras transacciones están protegidas con encriptación SSL y procesadas de forma segura a través de Stripe.")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ComoComprar;