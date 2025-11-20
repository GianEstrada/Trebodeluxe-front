import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import NavigationBar from './NavigationBar';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';

interface LayoutProps {
  children: React.ReactNode;
  showPromoBar?: boolean;
  promoTexts?: string[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showPromoBar = true, 
  promoTexts = ["Agrega 4 productos y paga 2", "2x1 en gorras"] 
}) => {
  // Estados para idioma y moneda
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  
  // Estado del carrusel de texto
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Hook de traducción
  const { t, isTranslating } = useUniversalTranslate(currentLanguage);
  
  // Cargar configuración guardada
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  // Efecto para el carrusel de texto
  useEffect(() => {
    if (showPromoBar && promoTexts && promoTexts.length > 1) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        
        setTimeout(() => {
          setCurrentTextIndex((prevIndex) => (prevIndex + 1) % promoTexts.length);
          setIsAnimating(false);
        }, 300);
        
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [promoTexts, showPromoBar]);

  // Función para cambiar manualmente el texto
  const handleDotClick = (index: number) => {
    if (index !== currentTextIndex && promoTexts) {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTextIndex(index);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <div className="w-full relative min-h-screen flex flex-col text-left text-Static-Body-Large-Size text-M3-white font-salsa"
         style={{
           background: 'linear-gradient(180deg, #0a2f0a 0%, #000 100%)'
         }}>
      
      {/* Indicador de traducción */}
      {isTranslating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-400 z-50">
          <div className="h-full bg-white opacity-50 animate-pulse"></div>
        </div>
      )}
      
      <div className="self-stretch flex flex-col items-start justify-start text-Schemes-On-Surface font-Static-Body-Large-Font flex-shrink-0">
        <div className="self-stretch flex flex-col items-start justify-start text-center text-white font-salsa">
          
          {/* Barra promocional superior */}
          {showPromoBar && (
            <div className="self-stretch [background:linear-gradient(90deg,_#1a6b1a,_#0e360e)] h-10 flex flex-row items-center justify-between !p-[5px] box-border">
              <div className="w-[278px] relative tracking-[4px] leading-6 flex items-center justify-center h-[27px] shrink-0 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)]">
                <span className="text-white">{t('TREBOLUXE')}</span>
              </div>
              
              {/* Contenido central - texto del carrusel */}
              {promoTexts && promoTexts.length > 0 && (
                <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-row items-center gap-2 text-white">
                  <Image
                    className="w-[12.2px] relative max-h-full object-contain"
                    width={12.2}
                    height={10.9}
                    sizes="100vw"
                    alt=""
                    src="/petalo-1@2x.png"
                  />
                  <div className={`relative tracking-[4px] leading-6 [text-shadow:0px_4px_4px_rgba(0,_0,_0,_0.25)] transition-all duration-300 ease-in-out whitespace-nowrap ${
                    isAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
                  }`}>
                    {t(promoTexts[currentTextIndex])}
                  </div>
                </div>
              )}

              {/* Indicadores de carrusel (solo si hay más de un texto) */}
              {promoTexts && promoTexts.length > 1 && (
                <div className="flex-[-0.0187] [backdrop-filter:blur(40px)] rounded-[50px] flex flex-row items-center justify-end !pt-2 !pb-2 !pl-[402px] !pr-3 relative gap-2">
                  <div className="w-full absolute !!m-[0 important] h-full top-[0px] right-[0px] bottom-[0px] left-[0px] rounded-[100px] overflow-hidden hidden z-[0]">
                    <div className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] [backdrop-filter:blur(50px)] [background:linear-gradient(#0d0d0d,_#0d0d0d),_rgba(191,_191,_191,_0.44)]" />
                  </div>
                  {promoTexts.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 relative shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25),_0px_-1px_1.3px_#fff_inset] rounded-[50px] h-2 z-[1] transition-all duration-500 ease-in-out cursor-pointer ${
                        currentTextIndex === index ? 'bg-white' : 'bg-white opacity-[0.3] hover:opacity-[0.6]'
                      }`} 
                      onClick={() => handleDotClick(index)} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Barra de navegación */}
          <NavigationBar 
            currentLanguage={currentLanguage}
            setCurrentLanguage={setCurrentLanguage}
            currentCurrency={currentCurrency}
            setCurrentCurrency={setCurrentCurrency}
          />
          
        </div>
      </div>
      
      {/* Contenido de la página */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default Layout;
