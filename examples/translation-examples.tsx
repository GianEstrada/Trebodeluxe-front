// EJEMPLO DE CÓMO USAR EL SISTEMA DE TRADUCCIÓN AUTOMÁTICA

// 1. OPCIÓN FÁCIL: Solo escribe el texto en español
// El sistema lo traducirá automáticamente a otros idiomas

import { useSmartTranslate } from '../hooks/useSmartTranslate';

const MiComponente = () => {
  const { t } = useSmartTranslate('en'); // Cambiar a 'en' o 'fr' para probar
  
  return (
    <div>
      <h1>{t('Bienvenido a nuestra tienda')}</h1>
      <p>{t('Encuentra los mejores productos al mejor precio')}</p>
      <button>{t('Comprar ahora')}</button>
      <span>{t('Envío gratuito')}</span>
    </div>
  );
};

// 2. OPCIÓN AVANZADA: Usar API de traducción real
// Reemplaza el contenido de useSmartTranslate.ts con:

/*
import translate from 'translate-google';

const translateWithAPI = async (text: string, targetLang: string): Promise<string> => {
  try {
    const result = await translate(text, { from: 'es', to: targetLang });
    return result;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};
*/

// 3. INTEGRAR CON GOOGLE TRANSLATE API (OFICIAL)
// Instalar: npm install @google-cloud/translate
// Configurar credentials de Google Cloud

/*
const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate({ key: 'TU_API_KEY' });

const translateWithGoogleAPI = async (text: string, targetLang: string) => {
  try {
    const [translation] = await translate.translate(text, targetLang);
    return translation;
  } catch (error) {
    console.error('Google Translate error:', error);
    return text;
  }
};
*/

// 4. USAR DEEPL API (MÁS PRECISO)
// Instalar: npm install deepl-node
// Registrarse en https://www.deepl.com/pro-api

/*
const deepl = require('deepl-node');
const translator = new deepl.Translator('TU_API_KEY');

const translateWithDeepL = async (text: string, targetLang: string) => {
  try {
    const result = await translator.translateText(text, 'es', targetLang);
    return result.text;
  } catch (error) {
    console.error('DeepL error:', error);
    return text;
  }
};
*/

// 5. USAR MICROSOFT TRANSLATOR
// Instalar: npm install axios
// Registrarse en Azure Cognitive Services

/*
import axios from 'axios';

const translateWithMicrosoft = async (text: string, targetLang: string) => {
  try {
    const response = await axios.post(
      'https://api.cognitive.microsofttranslator.com/translate',
      [{ text }],
      {
        headers: {
          'Ocp-Apim-Subscription-Key': 'TU_API_KEY',
          'Content-Type': 'application/json'
        },
        params: {
          'api-version': '3.0',
          from: 'es',
          to: targetLang
        }
      }
    );
    return response.data[0].translations[0].text;
  } catch (error) {
    console.error('Microsoft Translator error:', error);
    return text;
  }
};
*/

export default MiComponente;
