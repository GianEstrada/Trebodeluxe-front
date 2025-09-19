import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useUniversalTranslate } from "../hooks/useUniversalTranslate";
import Footer from "../components/Footer";

const SobreNosotros: NextPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  const router = useRouter();

  const values = [
    {
      icon: "🍀",
      title: t("Suerte"),
      description: t("Creemos que cada prenda lleva consigo un toque de suerte que te acompaña en cada aventura.")
    },
    {
      icon: "✨",
      title: t("Estilo"),
      description: t("Diseñamos pensando en tu personalidad única, para que cada look refleje quién eres realmente.")
    },
    {
      icon: "🎯",
      title: t("Autenticidad"),
      description: t("No seguimos tendencias, las creamos. Apostamos por lo original, lo diferente y lo auténtico.")
    },
    {
      icon: "💎",
      title: t("Calidad"),
      description: t("Cada prenda está cuidadosamente seleccionada para ofrecerte la mejor relación calidad-precio.")
    }
  ];

  const timeline = [
    {
      year: "2022",
      title: t("El Comienzo"),
      description: t("Emilio Torres Valdez funda Treboluxe en Monterrey, comenzando con una pequeña colección de gorras y camisas con diseños únicos."),
      highlight: true
    },
    {
      year: "2023",
      title: t("Expansión del Catálogo"),
      description: t("Incorporamos nuevas categorías de productos, desde accesorios hasta una línea completa de ropa urbana."),
      highlight: false
    },
    {
      year: "2024",
      title: t("Crecimiento Digital"),
      description: t("Lanzamiento de nuestra plataforma e-commerce completa con envíos a todo México."),
      highlight: false
    },
    {
      year: "2025",
      title: t("Comunidad Treboluxe"),
      description: t("Construcción de una comunidad sólida de clientes que comparten nuestra pasión por la moda auténtica."),
      highlight: true
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
          <div className="text-center mb-16">
            <div className="mb-6">
              <Image
                className="w-16 h-16 mx-auto"
                width={64}
                height={64}
                alt="Treboluxe Logo"
                src="/sin-ttulo1-2@2x.png"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-[3px]">
              {t('ACERCA DE')} <span className="text-green-400">TREBOLUXE</span>
            </h1>
            <div className="w-24 h-1 bg-green-400 mx-auto mb-8"></div>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
              {t("Descubre la historia detrás de la marca que está revolucionando la moda urbana en México con estilo, autenticidad y actitud.")}
            </p>
          </div>

          {/* Historia principal - Versión extendida del index */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/10 shadow-2xl mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Contenido de texto - Version extendida */}
              <div className="space-y-6">
                <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
                  <p>
                    {t('Treboluxe nació en Monterrey, Nuevo León, México, con una idea clara: llevar estilo, autenticidad y actitud a cada prenda. Fundada en 2022 por Emilio Torres Valdez, un joven emprendedor de 21 años apasionado por la moda urbana, la marca comenzó con una pequeña colección de gorras y camisas con diseños únicos, pensados para quienes buscan destacar sin perder su esencia.')}
                  </p>
                  
                  <p>
                    {t('El nombre Treboluxe une dos conceptos poderosos: la suerte del trébol y el lujo accesible que todos merecen. Creemos que vestir bien no es cuestión de gastar más, sino de saber quién eres y reflejarlo en lo que usas. Cada pieza está cuidadosamente elegida o diseñada para ofrecer estilo, comodidad y autenticidad.')}
                  </p>
                  
                  <p>
                    {t('Con el paso del tiempo, nuestro catálogo se ha expandido, incorporando productos variados dentro del mundo de la ropa, siempre con una visión clara: ofrecer moda con personalidad. En Treboluxe, no solo vendemos ropa; construimos una comunidad que apuesta por lo original, lo diferente y lo auténtico.')}
                  </p>
                  
                  <p>
                    {t('Cada cliente que elige Treboluxe se convierte en parte de una historia más grande: la de una marca mexicana que cree en el poder de la individualidad y que apuesta por un futuro donde la moda sea accesible, auténtica y llena de personalidad.')}
                  </p>
                  
                  <p>
                    {t('Gracias por formar parte de esta historia. Lo mejor apenas está por comenzar.')}
                  </p>
                </div>
                
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-green-400 italic">
                    {t('Recuerda: viste con suerte, vive con estilo')} 🍀
                  </p>
                </div>
                
                {/* Información del fundador */}
                <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/20">
                  <h3 className="text-white font-semibold text-xl mb-4">{t('Fundador')}</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      E
                    </div>
                    <div>
                      <p className="text-green-300 font-medium text-lg">Emilio Torres Valdez</p>
                      <p className="text-gray-400">{t('Emprendedor apasionado por la moda urbana')}</p>
                      <p className="text-gray-400">{t('Monterrey, Nuevo León, México')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Imagen/Stats */}
              <div className="space-y-8">
                {/* Logo o imagen representativa */}
                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 text-center">
                  <div className="text-6xl mb-4">🍀</div>
                  <h3 className="text-white font-bold text-2xl mb-2">TREBOLUXE</h3>
                  <p className="text-green-200">{t('Estilo • Autenticidad • Actitud')}</p>
                </div>
                
                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 rounded-lg p-6 text-center border border-white/10">
                    <div className="text-3xl font-bold text-green-400">2022</div>
                    <div className="text-gray-300 text-sm">{t('Año de Fundación')}</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-6 text-center border border-white/10">
                    <div className="text-3xl font-bold text-green-400">MTY</div>
                    <div className="text-gray-300 text-sm">{t('Monterrey, NL')}</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-6 text-center border border-white/10">
                    <div className="text-3xl font-bold text-green-400">100%</div>
                    <div className="text-gray-300 text-sm">{t('Auténtico')}</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-6 text-center border border-white/10">
                    <div className="text-3xl font-bold text-green-400">∞</div>
                    <div className="text-gray-300 text-sm">{t('Estilo')}</div>
                  </div>
                </div>
                
                {/* Call to action */}
                <div className="text-center">
                  <Link href="/catalogo" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition-colors duration-300 no-underline">
                    {t('Descubre Nuestra Colección')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Nuestros valores */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              {t("💎 NUESTROS VALORES")}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-black/40 transition-all duration-300 text-center group"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline/Historia */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              {t("📈 NUESTRA HISTORIA")}
            </h2>
            
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="relative">
                  {/* Línea conectora */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-green-500 to-green-700 hidden md:block"></div>
                  )}
                  
                  <div className={`flex flex-col md:flex-row items-start gap-6 p-6 rounded-2xl border transition-all duration-300 ${
                    item.highlight 
                      ? 'bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30 hover:from-green-600/30 hover:to-green-800/30' 
                      : 'bg-black/30 border-white/10 hover:bg-black/40'
                  }`}>
                    {/* Año */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      item.highlight ? 'bg-green-600' : 'bg-gray-700'
                    }`}>
                      {item.year}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                        {item.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensaje final */}
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 md:p-12 border border-green-500/20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t("🚀 EL FUTURO ES NUESTRO")}
            </h2>
            
            <div className="max-w-4xl mx-auto space-y-6 text-green-100 text-lg leading-relaxed">
              <p>
                {t("En Treboluxe seguimos creciendo, innovando y sorprendiendo. Cada día trabajamos para ofrecerte productos únicos que no encontrarás en ningún otro lugar.")}
              </p>
              <p>
                {t("Nuestro compromiso contigo va más allá de la venta: queremos ser parte de tu estilo, de tu personalidad y de los momentos especiales de tu vida.")}
              </p>
              <p className="text-2xl font-bold text-white">
                {t("¡Únete a la familia Treboluxe y vive la experiencia de vestir con suerte!")} 🍀
              </p>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/catalogo" className="bg-white text-green-800 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-300 no-underline">
                {t("Explorar Catálogo")}
              </Link>
              <Link href="/contacto" className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:text-green-800 transition-colors duration-300 no-underline">
                {t("Contáctanos")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default SobreNosotros;