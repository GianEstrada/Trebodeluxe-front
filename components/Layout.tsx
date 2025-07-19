import React, { useState, useEffect } from 'react';
import NavigationBar from './NavigationBar';

interface LayoutProps {
  children: React.ReactNode;
  showPromoBar?: boolean;
  promoTexts?: string[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showPromoBar = true,
  promoTexts = ["ENVIO GRATIS EN PEDIDOS ARRIBA DE $500 MXN", "OFERTA ESPECIAL: 20% DE DESCUENTO EN SEGUNDA PRENDA"]
}) => {
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [currentCurrency, setCurrentCurrency] = useState("MXN");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Cargar configuración guardada
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
    if (savedCurrency) setCurrentCurrency(savedCurrency);
  }, []);

  // Efecto para el carrusel de texto promocional
  useEffect(() => {
    if (!showPromoBar || promoTexts.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % promoTexts.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [showPromoBar, promoTexts]);

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Barra promocional */}
      {showPromoBar && (
        <div className="bg-black text-white text-center py-2 text-sm overflow-hidden">
          <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {promoTexts[currentTextIndex]}
          </div>
        </div>
      )}
      
      {/* Barra de navegación */}
      <NavigationBar
        currentLanguage={currentLanguage}
        currentCurrency={currentCurrency}
        onLanguageChange={setCurrentLanguage}
        onCurrencyChange={setCurrentCurrency}
      />
      
      {/* Contenido principal */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
