import { useState, useEffect, useCallback, useRef } from 'react';

// Simulación de API de traducción - puedes reemplazar con Google Translate, DeepL, etc.
const translateWithAPI = async (text: string, targetLang: string): Promise<string> => {
  try {
    // Opción 1: Usar Google Translate API gratuita (no oficial)
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    
    // Si falla, usar traducciones básicas
    return getBasicTranslation(text, targetLang);
  } catch (error) {
    console.error('API translation failed:', error);
    return getBasicTranslation(text, targetLang);
  }
};

// Traducciones básicas para casos comunes
const getBasicTranslation = (text: string, targetLang: string): string => {
  const basicTranslations: { [key: string]: { [key: string]: string } } = {
    'en': {
      // Navegación
      'TREBOLUXE': 'TREBOLUXE',
      'CATEGORIAS': 'CATEGORIES',
      'POPULARES': 'POPULAR',
      'NUEVOS': 'NEW',
      'BASICOS': 'BASICS',
      
      // Promociones
      'Agrega 4 productos y paga 2': 'Add 4 products and pay for 2',
      '2x1 en gorras': '2x1 on caps',
      'Promociones Especiales': 'Special Promotions',
      
      // Interfaz
      'IDIOMA Y MONEDA': 'LANGUAGE & CURRENCY',
      'Idioma': 'Language',
      'Moneda': 'Currency',
      'BÚSQUEDA': 'SEARCH',
      'Buscar': 'Search',
      'CARRITO': 'CART',
      
      // Login
      '¡Bienvenido!': 'Welcome!',
      'Parece que no estás logueado': 'It seems you\'re not logged in',
      'Iniciar sesión': 'Log In',
      'Registrarse': 'Sign Up',
      
      // Búsqueda
      '¿Qué estás buscando?': 'What are you looking for?',
      'Encuentra los productos que buscas': 'Find the products you\'re looking for',
      'Búsquedas populares:': 'Popular searches:',
      
      // Carrito
      'productos en tu carrito': 'products in your cart',
      'Subtotal:': 'Subtotal:',
      'Envío:': 'Shipping:',
      'Total:': 'Total:',
      'Gratis': 'Free',
      'Finalizar Compra': 'Checkout',
      'Ver Carrito Completo': 'View Full Cart',
      
      // Descripciones
      'Tu tienda de moda online de confianza. Descubre las últimas tendencias y encuentra tu estilo único con nuestra amplia selección de ropa y accesorios.': 'Your trusted online fashion store. Discover the latest trends and find your unique style with our wide selection of clothing and accessories.',
      'Selecciona tu idioma preferido y la moneda para ver los precios actualizados.': 'Select your preferred language and currency to see updated prices.',
      'Al continuar, aceptas nuestros términos de servicio y política de privacidad.': 'By continuing, you accept our terms of service and privacy policy.',
      'Descubre nuestra amplia colección de moda y encuentra el estilo perfecto para ti.': 'Discover our wide fashion collection and find the perfect style for you.',
      'CATEGORÍAS DE ROPA': 'CLOTHING CATEGORIES'
    },
    'fr': {
      // Navegación
      'TREBOLUXE': 'TREBOLUXE',
      'CATEGORIAS': 'CATÉGORIES',
      'POPULARES': 'POPULAIRE',
      'NUEVOS': 'NOUVEAU',
      'BASICOS': 'BASIQUES',
      
      // Promociones
      'Agrega 4 productos y paga 2': 'Ajoutez 4 produits et payez pour 2',
      '2x1 en gorras': '2x1 sur les casquettes',
      'Promociones Especiales': 'Promotions Spéciales',
      
      // Interfaz
      'IDIOMA Y MONEDA': 'LANGUE ET DEVISE',
      'Idioma': 'Langue',
      'Moneda': 'Devise',
      'BÚSQUEDA': 'RECHERCHE',
      'Buscar': 'Rechercher',
      'CARRITO': 'PANIER',
      
      // Login
      '¡Bienvenido!': 'Bienvenue!',
      'Parece que no estás logueado': 'Il semble que vous ne soyez pas connecté',
      'Iniciar sesión': 'Se connecter',
      'Registrarse': 'S\'inscrire',
      
      // Búsqueda
      '¿Qué estás buscando?': 'Que cherchez-vous?',
      'Encuentra los productos que buscas': 'Trouvez les produits que vous cherchez',
      'Búsquedas populares:': 'Recherches populaires:',
      
      // Carrito
      'productos en tu carrito': 'produits dans votre panier',
      'Subtotal:': 'Sous-total:',
      'Envío:': 'Livraison:',
      'Total:': 'Total:',
      'Gratis': 'Gratuit',
      'Finalizar Compra': 'Finaliser la commande',
      'Ver Carrito Completo': 'Voir le panier complet',
      
      // Descripciones
      'Tu tienda de moda online de confianza. Descubre las últimas tendencias y encuentra tu estilo único con nuestra amplia selección de ropa y accesorios.': 'Votre magasin de mode en ligne de confiance. Découvrez les dernières tendances et trouvez votre style unique avec notre large sélection de vêtements et accessoires.',
      'Selecciona tu idioma preferido y la moneda para ver los precios actualizados.': 'Sélectionnez votre langue préférée et la devise pour voir les prix mis à jour.',
      'Al continuar, aceptas nuestros términos de servicio y política de privacidad.': 'En continuant, vous acceptez nos conditions de service et notre politique de confidentialité.',
      'Descubre nuestra amplia colección de moda y encuentra el estilo perfecto para ti.': 'Découvrez notre large collection de mode et trouvez le style parfait pour vous.',
      'CATEGORÍAS DE ROPA': 'CATÉGORIES DE VÊTEMENTS'
    }
  };

  return basicTranslations[targetLang]?.[text] || text;
};

// Traducciones de respaldo para casos críticos
const fallbackTranslations: { [key: string]: { [key: string]: string } } = {
  'en': {
    // Navegación principal
    'TREBOLUXE': 'TREBOLUXE',
    'CATEGORIAS': 'CATEGORIES',
    'POPULARES': 'POPULAR',
    'NUEVOS': 'NEW',
    'BASICOS': 'BASICS',
    
    // Promociones y ofertas
    'Agrega 4 productos y paga 2': 'Add 4 products and pay for 2',
    '2x1 en gorras': '2x1 on caps',
    'Promociones Especiales': 'Special Promotions',
    
    // Menús e interfaz
    'IDIOMA Y MONEDA': 'LANGUAGE & CURRENCY',
    'Idioma': 'Language',
    'Moneda': 'Currency',
    'BÚSQUEDA': 'SEARCH',
    'Buscar': 'Search',
    'CARRITO': 'CART',
    'CATEGORÍAS DE ROPA': 'CLOTHING CATEGORIES',
    
    // Autenticación
    '¡Bienvenido!': 'Welcome!',
    'Parece que no estás logueado': 'It seems you\'re not logged in',
    'Iniciar sesión': 'Log In',
    'Registrarse': 'Sign Up',
    
    // Búsqueda
    '¿Qué estás buscando?': 'What are you looking for?',
    'Encuentra los productos que buscas': 'Find the products you\'re looking for',
    'Búsquedas populares:': 'Popular searches:',
    
    // Carrito de compras
    'productos en tu carrito': 'products in your cart',
    'Subtotal:': 'Subtotal:',
    'Envío:': 'Shipping:',
    'Total:': 'Total:',
    'Gratis': 'Free',
    'Finalizar Compra': 'Checkout',
    'Ver Carrito Completo': 'View Full Cart',
    
    // Textos largos y descripciones
    'Tu tienda de moda online de confianza. Descubre las últimas tendencias y encuentra tu estilo único con nuestra amplia selección de ropa y accesorios.': 'Your trusted online fashion store. Discover the latest trends and find your unique style with our wide selection of clothing and accessories.',
    'Selecciona tu idioma preferido y la moneda para ver los precios actualizados.': 'Select your preferred language and currency to see updated prices.',
    'Al continuar, aceptas nuestros términos de servicio y política de privacidad.': 'By continuing, you accept our terms of service and privacy policy.',
    'Descubre nuestra amplia colección de moda y encuentra el estilo perfecto para ti.': 'Discover our wide fashion collection and find the perfect style for you.',
    
    // Palabras comunes
    'de': 'of',
    'y': 'and',
    'en': 'in',
    'para': 'for',
    'con': 'with',
    'por': 'by',
    'tu': 'your',
    'la': 'the',
    'el': 'the',
    'un': 'a',
    'una': 'a'
  },
  'fr': {
    // Navegación principal
    'TREBOLUXE': 'TREBOLUXE',
    'CATEGORIAS': 'CATÉGORIES',
    'POPULARES': 'POPULAIRE',
    'NUEVOS': 'NOUVEAU',
    'BASICOS': 'BASIQUES',
    
    // Promociones y ofertas
    'Agrega 4 productos y paga 2': 'Ajoutez 4 produits et payez pour 2',
    '2x1 en gorras': '2x1 sur les casquettes',
    'Promociones Especiales': 'Promotions Spéciales',
    
    // Menús e interfaz
    'IDIOMA Y MONEDA': 'LANGUE ET DEVISE',
    'Idioma': 'Langue',
    'Moneda': 'Devise',
    'BÚSQUEDA': 'RECHERCHE',
    'Buscar': 'Rechercher',
    'CARRITO': 'PANIER',
    'CATEGORÍAS DE ROPA': 'CATÉGORIES DE VÊTEMENTS',
    
    // Autenticación
    '¡Bienvenido!': 'Bienvenue!',
    'Parece que no estás logueado': 'Il semble que vous ne soyez pas connecté',
    'Iniciar sesión': 'Se connecter',
    'Registrarse': 'S\'inscrire',
    
    // Búsqueda
    '¿Qué estás buscando?': 'Que cherchez-vous?',
    'Encuentra los productos que buscas': 'Trouvez les produits que vous cherchez',
    'Búsquedas populares:': 'Recherches populaires:',
    
    // Carrito de compras
    'productos en tu carrito': 'produits dans votre panier',
    'Subtotal:': 'Sous-total:',
    'Envío:': 'Livraison:',
    'Total:': 'Total:',
    'Gratis': 'Gratuit',
    'Finalizar Compra': 'Finaliser la commande',
    'Ver Carrito Completo': 'Voir le panier complet',
    
    // Textos largos y descripciones
    'Tu tienda de moda online de confianza. Descubre las últimas tendencias y encuentra tu estilo único con nuestra amplia selección de ropa y accesorios.': 'Votre magasin de mode en ligne de confiance. Découvrez les dernières tendances et trouvez votre style unique avec notre large sélection de vêtements et accessoires.',
    'Selecciona tu idioma preferido y la moneda para ver los precios actualizados.': 'Sélectionnez votre langue préférée et la devise pour voir les prix mis à jour.',
    'Al continuar, aceptas nuestros términos de servicio y política de privacidad.': 'En continuant, vous acceptez nos conditions de service et notre politique de confidentialité.',
    'Descubre nuestra amplia colección de moda y encuentra el estilo perfecto para ti.': 'Découvrez notre large collection de mode et trouvez le style parfait pour vous.',
    
    // Palabras comunes
    'de': 'de',
    'y': 'et',
    'en': 'en',
    'para': 'pour',
    'con': 'avec',
    'por': 'par',
    'tu': 'votre',
    'la': 'la',
    'el': 'le',
    'un': 'un',
    'una': 'une'
  }
};

export const useSmartTranslate = (currentLanguage: string = 'es') => {
  const [translations, setTranslations] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const translationQueue = useRef<Set<string>>(new Set());
  const processingRef = useRef<boolean>(false);

  // Función para traducir con cache y fallback
  const translateText = useCallback(async (text: string): Promise<string> => {
    if (currentLanguage === 'es') return text;
    
    // Verificar fallback primero
    if (fallbackTranslations[currentLanguage]?.[text]) {
      return fallbackTranslations[currentLanguage][text];
    }

    // Verificar cache
    if (translations[text]) {
      return translations[text];
    }

    try {
      const translated = await translateWithAPI(text, currentLanguage);
      setTranslations(prev => ({ ...prev, [text]: translated }));
      return translated;
    } catch (error) {
      return text;
    }
  }, [currentLanguage, translations]);

  // Procesar cola de traducciones
  const processTranslationQueue = useCallback(async () => {
    if (processingRef.current || translationQueue.current.size === 0) return;
    
    processingRef.current = true;
    setIsLoading(true);
    
    const textsToTranslate = Array.from(translationQueue.current);
    translationQueue.current.clear();
    
    const newTranslations: { [key: string]: string } = {};
    
    for (const text of textsToTranslate) {
      if (currentLanguage === 'es') {
        newTranslations[text] = text;
      } else if (fallbackTranslations[currentLanguage]?.[text]) {
        newTranslations[text] = fallbackTranslations[currentLanguage][text];
      } else {
        // Primero intentar traducción básica
        const basicTranslation = getBasicTranslation(text, currentLanguage);
        if (basicTranslation !== text) {
          newTranslations[text] = basicTranslation;
        } else {
          // Si no hay traducción básica, usar API
          try {
            const translated = await translateWithAPI(text, currentLanguage);
            newTranslations[text] = translated;
          } catch (error) {
            console.error('Translation failed for:', text, error);
            newTranslations[text] = text;
          }
        }
      }
      
      // Pequeña pausa para evitar sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setTranslations(prev => ({ ...prev, ...newTranslations }));
    setIsLoading(false);
    processingRef.current = false;
  }, [currentLanguage]);

  // Función principal para obtener traducción
  const t = useCallback((text: string): string => {
    if (currentLanguage === 'es') return text;
    
    // Si ya está traducido, devolverlo
    if (translations[text]) {
      return translations[text];
    }
    
    // Si existe fallback, usarlo
    if (fallbackTranslations[currentLanguage]?.[text]) {
      return fallbackTranslations[currentLanguage][text];
    }
    
    // Intentar traducir usando las traducciones básicas
    const basicTranslation = getBasicTranslation(text, currentLanguage);
    if (basicTranslation !== text) {
      // Guardar la traducción para no repetir
      setTranslations(prev => ({ ...prev, [text]: basicTranslation }));
      return basicTranslation;
    }
    
    // Agregar a cola para traducir con API
    translationQueue.current.add(text);
    
    // Retornar texto original mientras se traduce
    return text;
  }, [currentLanguage, translations]);

  // Efecto para procesar cola cuando cambie el idioma
  useEffect(() => {
    const timer = setTimeout(processTranslationQueue, 100);
    return () => clearTimeout(timer);
  }, [currentLanguage, processTranslationQueue]);

  // Limpiar traducciones cuando cambie el idioma
  useEffect(() => {
    setTranslations({});
  }, [currentLanguage]);

  return {
    t,
    isLoading,
    translateText,
    translations
  };
};
