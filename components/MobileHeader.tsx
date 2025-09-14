import React, { useState, useEffect } from 'react';
import { useUniversalTranslate } from '../hooks/useUniversalTranslate';
import { useCart } from '../contexts/NewCartContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

interface MobileHeaderProps {
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  showMobileSidebar: boolean;
  setShowMobileSidebar: (show: boolean) => void;
  setMobileSidebarContent: (content: string) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  showMobileMenu,
  setShowMobileMenu,
  showMobileSidebar,
  setShowMobileSidebar,
  setMobileSidebarContent
}) => {
  const { t } = useUniversalTranslate();
  const { totalItems } = useCart();
  const { headerSettings } = useSiteSettings();

  // Estados para el carrusel de textos
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Usar textos promocionales desde la base de datos, con fallback
  const promoTexts = headerSettings?.promoTexts || [
    "Agrega 4 productos y paga 2",
    "2x1 en gorras"
  ];

  // Efecto para el carrusel de texto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % promoTexts.length);
    }, 3000); // Cambia cada 3 segundos

    return () => clearInterval(interval);
  }, [promoTexts.length]);

  return (
    <>
      {/* Navbar Móvil - Solo visible en pantallas pequeñas */}
      <div className="block md:hidden w-full bg-black/90 sticky top-0 z-50 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Botón de Menú (izquierda) */}
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="p-2 text-white bg-gradient-to-br from-green-600 to-green-800 rounded-md"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Texto central TREBOLUXE */}
          <div className="flex-1 text-center">
            <h1 className="text-white text-xl font-bold tracking-[4px]">
              TREBOLUXE
            </h1>
          </div>
          
          {/* Botón de Opciones (derecha) */}
          <button 
            onClick={() => {
              setShowMobileSidebar(true);
              setMobileSidebarContent('cart');
            }}
            className="p-2 text-white bg-gradient-to-br from-green-600 to-green-800 rounded-md relative"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Textos Promocionales Móviles */}
      <div className="block md:hidden bg-gradient-to-r from-green-700 to-green-900 text-white py-2 z-40">
        <div className="overflow-hidden relative w-full h-full">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentTextIndex * 100}%)` }}
          >
            {promoTexts.map((text, index) => (
              <div 
                key={index}
                className="w-full h-full flex-shrink-0 flex items-center justify-center min-h-[36px]"
              >
                <div className="w-full flex items-center justify-center px-2">
                  <span 
                    className="font-medium text-center leading-tight w-full block"
                    style={{
                      fontSize: `clamp(12px, 3.5vw, 16px)`
                    }}
                  >
                    {text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;