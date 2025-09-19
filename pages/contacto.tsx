import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import Footer from "../components/Footer";

const Contacto: NextPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const router = useRouter();

  const socialNetworks = [
    {
      name: "Facebook",
      url: "https://www.facebook.com/profile.php?id=61576338298512",
      icon: "/facebook-icon.svg",
      color: "from-blue-600 to-blue-800",
      description: t("Síguenos en Facebook para estar al día con nuestras últimas colecciones y ofertas especiales."),
      handle: "@treboluxe"
    },
    {
      name: "Instagram", 
      url: "https://www.instagram.com/treboluxe",
      icon: "/logo-instagram.svg",
      color: "from-pink-500 to-purple-600",
      description: t("Descubre nuestros looks del día y la inspiración detrás de cada prenda en Instagram."),
      handle: "@treboluxe"
    },
    {
      name: "TikTok",
      url: "https://www.tiktok.com/@treboluxe5",
      icon: "/tiktok-icon.svg", 
      color: "from-gray-800 to-black",
      description: t("Contenido dinámico, tendencias de moda y behind the scenes en nuestro TikTok oficial."),
      handle: "@treboluxe5"
    },
    {
      name: "Twitter/X",
      url: "https://twitter.com/treboluxe?s=21",
      icon: "/x-logo.svg",
      color: "from-gray-700 to-gray-900",
      description: t("Mantente conectado con las últimas noticias y actualizaciones de Treboluxe."),
      handle: "@treboluxe"
    }
  ];

  const contactInfo = [
    {
      icon: "📍",
      title: t("Ubicación"),
      content: t("Monterrey, Nuevo León, México"),
      description: t("Nuestra base de operaciones en el corazón de México")
    },
    {
      icon: "⏰", 
      title: t("Horarios de Atención"),
      content: t("Lunes a Viernes: 9:00 AM - 6:00 PM"),
      description: t("Tiempo de respuesta promedio: 24 horas")
    },
    {
      icon: "🚚",
      title: t("Envíos"),
      content: t("A todo México"),
    },
    {
      icon: "💬",
      title: t("Soporte"),
      content: t("Atención personalizada"),
      description: t("Te ayudamos con cualquier duda sobre nuestros productos")
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
              {t("CONTACTO")}
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6">
              {t("¿Tienes alguna pregunta, sugerencia o simplemente quieres decir hola? ¡Nos encanta escuchar de ti! Conéctate con nosotros a través de nuestras redes sociales.")}
            </p>
          </div>

          {/* Información de contacto general */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-black/40 transition-all duration-300 text-center"
              >
                <div className="text-4xl mb-4">{info.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{info.title}</h3>
                <p className="text-green-400 font-semibold mb-2">{info.content}</p>
                <p className="text-gray-400 text-sm">{info.description}</p>
              </div>
            ))}
          </div>

          {/* Redes sociales */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
              {t("🌟 SÍGUENOS EN REDES SOCIALES")}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {socialNetworks.map((social, index) => (
                <div
                  key={index}
                  className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-black/40 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-6">
                    {/* Icono con gradiente */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${social.color} rounded-2xl flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300`}>
                      <Image
                        className="w-8 h-8 filter invert"
                        width={32}
                        height={32}
                        alt={social.name}
                        src={social.icon}
                      />
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl font-bold text-white">{social.name}</h3>
                        <span className="text-gray-400 text-lg">{social.handle}</span>
                      </div>
                      
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {social.description}
                      </p>
                      
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 bg-gradient-to-r ${social.color} text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 no-underline group-hover:scale-105`}
                      >
                        {t("Visitar")} {social.name}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sección de mensaje personalizado */}
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 md:p-12 border border-green-500/20 mb-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                {t("💝 ¡QUEREMOS CONOCERTE!")}
              </h2>
              
              <div className="max-w-3xl mx-auto space-y-6 text-green-100 text-lg leading-relaxed">
                <p>
                  {t("En Treboluxe, cada cliente es parte de nuestra familia. Nos encanta ver cómo llevas nuestras prendas y cómo las haces tuyas.")}
                </p>
                <p>
                  {t("Comparte tus fotos usando nuestras prendas, cuéntanos tu experiencia o simplemente salúdanos. Tu feedback nos ayuda a mejorar cada día.")}
                </p>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/catalogo" className="bg-white text-green-800 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-300 no-underline">
                  {t("Ver Catálogo")}
                </Link>
                <Link href="/sobre-nosotros" className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:text-green-800 transition-colors duration-300 no-underline">
                  {t("Sobre Nosotros")}
                </Link>
              </div>
            </div>
          </div>

          {/* Tips para redes sociales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/20 rounded-xl p-6 border border-white/10 text-center">
              <div className="text-3xl mb-4">📸</div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {t("Comparte tu look")}
              </h3>
              <p className="text-gray-300 text-sm">
                {t("Etiquétanos en tus fotos usando #Treboluxe y podrías aparecer en nuestro feed oficial.")}
              </p>
            </div>

            <div className="bg-black/20 rounded-xl p-6 border border-white/10 text-center">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {t("Danos tu opinión")}
              </h3>
              <p className="text-gray-300 text-sm">
                {t("Tus comentarios y sugerencias nos ayudan a crear productos que realmente amas.")}
              </p>
            </div>

            <div className="bg-black/20 rounded-xl p-6 border border-white/10 text-center">
              <div className="text-3xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {t("Entérate primero")}
              </h3>
              <p className="text-gray-300 text-sm">
                {t("Síguenos para ser el primero en conocer nuestras nuevas colecciones y ofertas exclusivas.")}
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

export default Contacto;