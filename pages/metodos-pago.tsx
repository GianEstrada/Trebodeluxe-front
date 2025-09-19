import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import Footer from "../components/Footer";

const MetodosPago: NextPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const router = useRouter();

  const paymentMethods = [
    {
      category: t("Tarjetas de Crédito"),
      cards: [
        { name: "Visa", logo: "💳", color: "from-blue-600 to-blue-800" },
        { name: "Mastercard", logo: "💳", color: "from-red-600 to-red-800" },
        { name: "American Express", logo: "💳", color: "from-green-600 to-green-800" },
        { name: "Discover", logo: "💳", color: "from-orange-600 to-orange-800" }
      ]
    },
    {
      category: t("Tarjetas de Débito"),
      cards: [
        { name: "Visa Débito", logo: "💳", color: "from-blue-500 to-blue-700" },
        { name: "Mastercard Débito", logo: "💳", color: "from-red-500 to-red-700" },
        { name: "Maestro", logo: "💳", color: "from-purple-600 to-purple-800" }
      ]
    },
    {
      category: t("Billeteras Digitales"),
      cards: [
        { name: "Apple Pay", logo: "📱", color: "from-gray-700 to-gray-900" },
        { name: "Google Pay", logo: "📱", color: "from-yellow-600 to-yellow-800" },
        { name: "Samsung Pay", logo: "📱", color: "from-blue-700 to-blue-900" }
      ]
    },
    {
      category: t("Otros Métodos"),
      cards: [
        { name: "SEPA", logo: "🏦", color: "from-indigo-600 to-indigo-800" },
        { name: "SOFORT", logo: "🏦", color: "from-teal-600 to-teal-800" },
        { name: "iDEAL", logo: "🏦", color: "from-orange-500 to-orange-700" }
      ]
    }
  ];

  const securityFeatures = [
    {
      icon: "🔒",
      title: t("Encriptación SSL"),
      description: t("Todos los datos se transmiten de forma segura con encriptación de 256 bits")
    },
    {
      icon: "🛡️", 
      title: t("Protección PCI DSS"),
      description: t("Cumplimos con los más altos estándares de seguridad de la industria")
    },
    {
      icon: "👥",
      title: t("Verificación 3D Secure"),
      description: t("Verificación adicional para mayor seguridad en tus transacciones")
    },
    {
      icon: "🔄",
      title: t("Procesamiento seguro"),
      description: t("Powered by Stripe, líder mundial en procesamiento de pagos")
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
        <div className="w-full max-w-6xl">
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
              {t("MÉTODOS DE PAGO")}
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6">
              {t("En Treboluxe aceptamos múltiples métodos de pago para tu comodidad. Todos procesados de forma segura a través de Stripe.")}
            </p>
            
            {/* Logo de Stripe */}
            <div className="flex justify-center items-center gap-2 text-gray-400 text-sm">
              <span>{t("Procesado por")}</span>
              <div className="bg-white rounded px-3 py-1">
                <span className="text-indigo-600 font-bold">stripe</span>
              </div>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-12">
            {paymentMethods.map((method, index) => (
              <div key={index} className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
                  {method.category}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {method.cards.map((card, cardIndex) => (
                    <div
                      key={cardIndex}
                      className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 border border-white/10 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">{card.logo}</span>
                        <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">
                        {card.name}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {t("Aceptado")} ✓
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Características de seguridad */}
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              {t("🔐 TU SEGURIDAD ES NUESTRA PRIORIDAD")}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-black/40 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{feature.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-16 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 border border-green-500/20">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {t("💰 PROCESO DE PAGO SIMPLE Y SEGURO")}
              </h2>
              <p className="text-green-100 text-lg mb-6 max-w-3xl mx-auto">
                {t("Al realizar tu compra, serás redirigido a la plataforma segura de Stripe donde podrás introducir tus datos de pago. Nunca almacenamos información de tarjetas en nuestros servidores.")}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔒</div>
                  <h3 className="text-white font-semibold mb-1">{t("Datos protegidos")}</h3>
                  <p className="text-green-100 text-sm">{t("Encriptación de extremo a extremo")}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="text-white font-semibold mb-1">{t("Procesamiento rápido")}</h3>
                  <p className="text-green-100 text-sm">{t("Confirmación inmediata")}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">📧</div>
                  <h3 className="text-white font-semibold mb-1">{t("Confirmación por email")}</h3>
                  <p className="text-green-100 text-sm">{t("Recibo detallado de tu compra")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-12 text-center">
            <Link href="/catalogo" className="inline-block bg-white text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-300 no-underline mr-4">
              {t("Comenzar a Comprar")}
            </Link>
            <Link href="/como-comprar" className="inline-block bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:text-gray-900 transition-colors duration-300 no-underline">
              {t("¿Cómo Comprar?")}
            </Link>
          </div>

          {/* FAQ rápida */}
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              {t("❓ PREGUNTAS FRECUENTES")}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t("¿Es seguro pagar con tarjeta?")}
                </h3>
                <p className="text-gray-300 text-sm">
                  {t("Sí, completamente seguro. Utilizamos Stripe, una de las plataformas de pago más seguras del mundo, con encriptación de grado bancario.")}
                </p>
              </div>

              <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t("¿Qué pasa si mi pago es rechazado?")}
                </h3>
                <p className="text-gray-300 text-sm">
                  {t("Si tu pago es rechazado, recibirás una notificación inmediata. Puedes intentar con otra tarjeta o contactar a tu banco.")}
                </p>
              </div>

              <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t("¿Almacenan mis datos de tarjeta?")}
                </h3>
                <p className="text-gray-300 text-sm">
                  {t("No, nunca almacenamos información de tarjetas. Stripe se encarga del procesamiento seguro y cumple con todos los estándares PCI DSS.")}
                </p>
              </div>

              <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {t("¿Puedo cancelar mi compra?")}
                </h3>
                <p className="text-gray-300 text-sm">
                  {t("Sí, puedes cancelar tu pedido antes del envío. Una vez procesado, aplican nuestras políticas de devolución.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MetodosPago;