import { useState, useEffect, useCallback } from 'react';

// Diccionario base con traducciones manuales para casos críticos
const baseTranslations: { [key: string]: { [key: string]: string } } = {
  'en': {
    // Navegación y elementos principales
    'TREBOLUXE': 'TREBOLUXE',
    'CATEGORIAS': 'CATEGORIES',
    'POPULARES': 'POPULAR',
    'NUEVOS': 'NEW',
    'BASICOS': 'BASICS',
    
    // Promociones
    'Agrega 4 productos y paga 2': 'Add 4 products and pay for 2',
    '2x1 en gorras': '2x1 on caps',
    'Promociones Especiales': 'Special Promotions',
    
    // Interfaz de usuario
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
    
    // Carrito
    'productos en tu carrito': 'products in your cart',
    'Subtotal:': 'Subtotal:',
    'Envío:': 'Shipping:',
    'Total:': 'Total:',
    'Gratis': 'Free',
    'Finalizar Compra': 'Checkout',
    'Ver Carrito Completo': 'View Full Cart',
    
    // Textos descriptivos
    'Tu tienda de moda online de confianza. Descubre las últimas tendencias y encuentra tu estilo único con nuestra amplia selección de ropa y accesorios.': 'Your trusted online fashion store. Discover the latest trends and find your unique style with our wide selection of clothing and accessories.',
    'Selecciona tu idioma preferido y la moneda para ver los precios actualizados.': 'Select your preferred language and currency to see updated prices.',
    'Al continuar, aceptas nuestros términos de servicio y política de privacidad.': 'By continuing, you accept our terms of service and privacy policy.',
    'Descubre nuestra amplia colección de moda y encuentra el estilo perfecto para ti.': 'Discover our wide fashion collection and find the perfect style for you.',
    'Utiliza filtros para encontrar exactamente lo que necesitas.': 'Use filters to find exactly what you need.',
    
    // Productos del carrito
    'Camisa Polo Clásica': 'Classic Polo Shirt',
    'Talla: M, Color: Azul': 'Size: M, Color: Blue',
    'Pantalón Chino': 'Chino Pants',
    'Talla: 32, Color: Negro': 'Size: 32, Color: Black',
    
    // Categorías de productos
    'Camisas': 'Shirts',
    'Pantalones': 'Pants',
    'Vestidos': 'Dresses',
    'Abrigos y Chaquetas': 'Coats and Jackets',
    'Faldas': 'Skirts',
    'Jeans': 'Jeans',
    'Ropa Interior': 'Underwear',
    'Trajes de Baño': 'Swimwear',
    'Accesorios de Moda': 'Fashion Accessories',
    'Calzado': 'Footwear',
    'Zapatos': 'Shoes',
    
    // Categorías del footer
    'Compras': 'Shopping',
    'Cómo comprar': 'How to buy',
    'Métodos de pago': 'Payment methods',
    'Envíos y entregas': 'Shipping and delivery',
    'Cambios y devoluciones': 'Exchanges and returns',
    'Tabla de tallas': 'Size chart',
    'Gift cards': 'Gift cards',
    'Programa de fidelidad': 'Loyalty program',
    
    'Mujer': 'Women',
    'Hombre': 'Men',
    'Niños': 'Kids',
    'Accesorios': 'Accessories',
    'Nueva colección': 'New collection',
    'Ofertas especiales': 'Special offers',
    
    'Atención al cliente': 'Customer service',
    'Contacto': 'Contact',
    'Preguntas frecuentes': 'FAQ',
    'Centro de ayuda': 'Help center',
    'Chat en vivo': 'Live chat',
    'Seguimiento de pedidos': 'Order tracking',
    'Reportar un problema': 'Report a problem',
    'Ubicación de tiendas': 'Store locations',
    
    'Legal': 'Legal',
    'Términos y condiciones': 'Terms and conditions',
    'Política de privacidad': 'Privacy policy',
    'Política de cookies': 'Cookie policy',
    'Aviso legal': 'Legal notice',
    'Sobre nosotros': 'About us',
    'Trabaja con nosotros': 'Work with us',
    'Sostenibilidad': 'Sustainability',
    
    // Copyright y enlaces finales
    '© 2024 Treboluxe. Todos los derechos reservados.': '© 2024 Treboluxe. All rights reserved.',
    'Mapa del sitio': 'Site map',
    'Accesibilidad': 'Accessibility',
    'Configurar cookies': 'Cookie settings',
    'Treboluxe es una marca registrada. Todos los precios incluyen IVA. Los gastos de envío se calculan durante el proceso de compra.': 'Treboluxe is a registered trademark. All prices include VAT. Shipping costs are calculated during the checkout process.',
    
    // Categorías genéricas
    'Categoria 1': 'Category 1',
    'Categoria 2': 'Category 2',
    'Categoria 3': 'Category 3',
    'Categoria 4': 'Category 4',
    'Categoria 5': 'Category 5',
    'Categoria 6': 'Category 6',
    'Producto': 'Product'
  },
  'fr': {
    // Navegación y elementos principales
    'TREBOLUXE': 'TREBOLUXE',
    'CATEGORIAS': 'CATÉGORIES',
    'POPULARES': 'POPULAIRE',
    'NUEVOS': 'NOUVEAU',
    'BASICOS': 'BASIQUES',
    
    // Promociones
    'Agrega 4 productos y paga 2': 'Ajoutez 4 produits et payez pour 2',
    '2x1 en gorras': '2x1 sur les casquettes',
    'Promociones Especiales': 'Promotions Spéciales',
    
    // Interfaz de usuario
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
    
    // Carrito
    'productos en tu carrito': 'produits dans votre panier',
    'Subtotal:': 'Sous-total:',
    'Envío:': 'Livraison:',
    'Total:': 'Total:',
    'Gratis': 'Gratuit',
    'Finalizar Compra': 'Finaliser la commande',
    'Ver Carrito Completo': 'Voir le panier complet',
    
    // Textos descriptivos
    'Tu tienda de moda online de confianza. Descubre las últimas tendencias y encuentra tu estilo único con nuestra amplia selección de ropa y accesorios.': 'Votre magasin de mode en ligne de confiance. Découvrez les dernières tendances et trouvez votre style unique avec notre large sélection de vêtements et accessoires.',
    'Selecciona tu idioma preferido y la moneda para ver los precios actualizados.': 'Sélectionnez votre langue préférée et la devise pour voir les prix mis à jour.',
    'Al continuar, aceptas nuestros términos de servicio y política de privacidad.': 'En continuant, vous acceptez nos conditions de service et notre politique de confidentialité.',
    'Descubre nuestra amplia colección de moda y encuentra el estilo perfecto para ti.': 'Découvrez notre large collection de mode et trouvez le style parfait pour vous.',
    'Utiliza filtros para encontrar exactamente lo que necesitas.': 'Utilisez des filtres pour trouver exactement ce dont vous avez besoin.',
    
    // Productos del carrito
    'Camisa Polo Clásica': 'Chemise Polo Classique',
    'Talla: M, Color: Azul': 'Taille: M, Couleur: Bleu',
    'Pantalón Chino': 'Pantalon Chino',
    'Talla: 32, Color: Negro': 'Taille: 32, Couleur: Noir',
    
    // Categorías de productos
    'Camisas': 'Chemises',
    'Pantalones': 'Pantalons',
    'Vestidos': 'Robes',
    'Abrigos y Chaquetas': 'Manteaux et Vestes',
    'Faldas': 'Jupes',
    'Jeans': 'Jeans',
    'Ropa Interior': 'Sous-vêtements',
    'Trajes de Baño': 'Maillots de bain',
    'Accesorios de Moda': 'Accessoires de mode',
    'Calzado': 'Chaussures',
    'Zapatos': 'Chaussures',
    
    // Categorías del footer
    'Compras': 'Achats',
    'Cómo comprar': 'Comment acheter',
    'Métodos de pago': 'Méthodes de paiement',
    'Envíos y entregas': 'Expédition et livraison',
    'Cambios y devoluciones': 'Échanges et retours',
    'Tabla de tallas': 'Guide des tailles',
    'Gift cards': 'Cartes cadeaux',
    'Programa de fidelidad': 'Programme de fidélité',
    
    'Mujer': 'Femme',
    'Hombre': 'Homme',
    'Niños': 'Enfants',
    'Accesorios': 'Accessoires',
    'Nueva colección': 'Nouvelle collection',
    'Ofertas especiales': 'Offres spéciales',
    
    'Atención al cliente': 'Service client',
    'Contacto': 'Contact',
    'Preguntas frecuentes': 'FAQ',
    'Centro de ayuda': 'Centre d\'aide',
    'Chat en vivo': 'Chat en direct',
    'Seguimiento de pedidos': 'Suivi des commandes',
    'Reportar un problema': 'Signaler un problème',
    'Ubicación de tiendas': 'Localisation des magasins',
    
    'Legal': 'Légal',
    'Términos y condiciones': 'Termes et conditions',
    'Política de privacidad': 'Politique de confidentialité',
    'Política de cookies': 'Politique des cookies',
    'Aviso legal': 'Avis légal',
    'Sobre nosotros': 'À propos de nous',
    'Trabaja con nosotros': 'Travaillez avec nous',
    'Sostenibilidad': 'Durabilité',
    
    // Copyright y enlaces finales
    '© 2024 Treboluxe. Todos los derechos reservados.': '© 2024 Treboluxe. Tous droits réservés.',
    'Mapa del sitio': 'Plan du site',
    'Accesibilidad': 'Accessibilité',
    'Configurar cookies': 'Configurer les cookies',
    'Treboluxe es una marca registrada. Todos los precios incluyen IVA. Los gastos de envío se calculan durante el proceso de compra.': 'Treboluxe est une marque déposée. Tous les prix incluent la TVA. Les frais d\'expédition sont calculés lors du processus d\'achat.',
    
    // Categorías genéricas
    'Categoria 1': 'Catégorie 1',
    'Categoria 2': 'Catégorie 2',
    'Categoria 3': 'Catégorie 3',
    'Categoria 4': 'Catégorie 4',
    'Categoria 5': 'Catégorie 5',
    'Categoria 6': 'Catégorie 6',
    'Producto': 'Produit'
  }
};

// API de traducción automática con manejo de errores mejorado
const translateWithAPI = async (text: string, targetLang: string): Promise<string> => {
  // Si es un texto muy corto (menos de 2 caracteres), devolverlo tal como está
  if (text.length < 2) return text;
  
  // Si contiene solo números, símbolos o caracteres especiales, no traducir
  if (!/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(text)) return text;
  
  try {
    // Usar un timeout para evitar que la API se cuelgue
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
    }
    
    return text;
  } catch (error) {
    // Si hay error de red, timeout o abort, devolver texto original
    console.warn('Translation API failed for:', text, error);
    return text;
  }
};

// Cache global para traducciones
const globalTranslationCache = new Map<string, string>();

// Debounce para evitar muchas llamadas a la API
let translationQueue: { text: string; targetLang: string }[] = [];
let isProcessingQueue = false;

const processTranslationQueue = async () => {
  if (isProcessingQueue || translationQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  // Procesar máximo 5 traducciones a la vez
  const batch = translationQueue.splice(0, 5);
  
  try {
    const promises = batch.map(({ text, targetLang }) => 
      translateWithAPI(text, targetLang).then(result => ({ text, targetLang, result }))
    );
    
    const results = await Promise.all(promises);
    
    results.forEach(({ text, targetLang, result }) => {
      const cacheKey = `${text}_${targetLang}`;
      globalTranslationCache.set(cacheKey, result);
    });
    
  } catch (error) {
    console.warn('Batch translation failed:', error);
  } finally {
    isProcessingQueue = false;
    
    // Si hay más elementos en la cola, procesarlos después de un delay
    if (translationQueue.length > 0) {
      setTimeout(processTranslationQueue, 1000);
    }
  }
};

export const useUniversalTranslate = (currentLanguage: string = 'es') => {
  const [dynamicTranslations, setDynamicTranslations] = useState<{ [key: string]: string }>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [pendingTranslations, setPendingTranslations] = useState<Set<string>>(new Set());

  // Función principal de traducción
  const t = useCallback((text: string): string => {
    // Si es español, devolver tal como está
    if (currentLanguage === 'es') {
      return text;
    }

    // Buscar en traducciones base
    if (baseTranslations[currentLanguage]?.[text]) {
      return baseTranslations[currentLanguage][text];
    }

    // Buscar en traducciones dinámicas
    if (dynamicTranslations[text]) {
      return dynamicTranslations[text];
    }

    // Buscar en cache global
    const cacheKey = `${text}_${currentLanguage}`;
    if (globalTranslationCache.has(cacheKey)) {
      const cachedTranslation = globalTranslationCache.get(cacheKey)!;
      // Actualizar estado local de forma asíncrona
      setTimeout(() => {
        setDynamicTranslations(prev => ({ ...prev, [text]: cachedTranslation }));
      }, 0);
      return cachedTranslation;
    }

    // Si no existe traducción y no está siendo traducido, iniciar traducción
    if (!pendingTranslations.has(text)) {
      setPendingTranslations(prev => new Set(prev).add(text));
      translateText(text, currentLanguage);
    }
    
    // Mientras tanto, devolver texto original
    return text;
  }, [currentLanguage, dynamicTranslations, pendingTranslations]);

  // Función para traducir texto automáticamente con mejor manejo de errores
  const translateText = useCallback(async (text: string, targetLang: string) => {
    if (targetLang === 'es') return text;

    const cacheKey = `${text}_${targetLang}`;
    
    // Evitar traducir si ya está en cache
    if (globalTranslationCache.has(cacheKey)) {
      setPendingTranslations(prev => {
        const newSet = new Set(prev);
        newSet.delete(text);
        return newSet;
      });
      return;
    }
    
    // Añadir a la cola de traducción en lugar de traducir inmediatamente
    translationQueue.push({ text, targetLang });
    
    // Iniciar procesamiento de la cola
    processTranslationQueue();
    
    // Simular progreso mientras se procesa
    setTimeout(() => {
      const cachedResult = globalTranslationCache.get(cacheKey);
      if (cachedResult) {
        setDynamicTranslations(prev => ({ 
          ...prev, 
          [text]: cachedResult 
        }));
      }
      
      setPendingTranslations(prev => {
        const newSet = new Set(prev);
        newSet.delete(text);
        return newSet;
      });
    }, 2000); // Dar tiempo para que la traducción se complete
    
  }, []);

  // Limpiar traducciones dinámicas cuando cambie el idioma
  useEffect(() => {
    setDynamicTranslations({});
    setPendingTranslations(new Set());
  }, [currentLanguage]);

  return {
    t,
    isTranslating: isTranslating || pendingTranslations.size > 0
  };
};
