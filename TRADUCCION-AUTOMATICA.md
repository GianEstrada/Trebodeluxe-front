# 🌍 Sistema de Traducción Automática - Treboluxe

## 🎯 ¿Qué es esto?

Un sistema que **traduce automáticamente** todos los textos de tu página web sin que tengas que escribir las traducciones manualmente. Solo escribes el texto en español y el sistema lo traduce automáticamente a inglés, francés, y otros idiomas.

## 🚀 Uso Básico

### 1. Importa el hook:
```tsx
import { useSmartTranslate } from '../hooks/useSmartTranslate';
```

### 2. Úsalo en tu componente:
```tsx
const MiComponente = () => {
  const [idioma, setIdioma] = useState('es');
  const { t } = useSmartTranslate(idioma);
  
  return (
    <div>
      <h1>{t('Bienvenido a nuestra tienda')}</h1>
      <p>{t('Los mejores productos al mejor precio')}</p>
      <button>{t('Comprar ahora')}</button>
      
      {/* Cambiar idioma */}
      <button onClick={() => setIdioma('en')}>English</button>
      <button onClick={() => setIdioma('fr')}>Français</button>
    </div>
  );
};
```

### 3. ¡Listo! Los textos se traducen automáticamente:
- **Español**: "Bienvenido a nuestra tienda"
- **Inglés**: "Welcome to our store" (automático)
- **Francés**: "Bienvenue dans notre magasin" (automático)

## 🔧 Configuración Avanzada

### Opción 1: Google Translate API (Gratis)
```bash
# Ya está configurado en useSmartTranslate.ts
# Usa la API no oficial de Google Translate
```

### Opción 2: Google Translate API (Oficial)
```bash
npm install @google-cloud/translate
```

```tsx
// En useSmartTranslate.ts
const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate({ key: 'TU_API_KEY' });

const translateWithGoogleAPI = async (text: string, targetLang: string) => {
  const [translation] = await translate.translate(text, targetLang);
  return translation;
};
```

### Opción 3: DeepL API (Más preciso)
```bash
npm install deepl-node
```

```tsx
const deepl = require('deepl-node');
const translator = new deepl.Translator('TU_API_KEY');

const translateWithDeepL = async (text: string, targetLang: string) => {
  const result = await translator.translateText(text, 'es', targetLang);
  return result.text;
};
```

### Opción 4: Microsoft Translator
```bash
npm install axios
```

```tsx
import axios from 'axios';

const translateWithMicrosoft = async (text: string, targetLang: string) => {
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
};
```

## 📋 Características del Sistema

### ✅ **Ventajas:**
- 🔄 **Automático**: Solo escribes en español
- 🚀 **Rápido**: Traducciones instantáneas
- 💾 **Cache**: Guarda traducciones para evitar llamadas repetidas
- 🔙 **Fallback**: Traducciones de respaldo para casos críticos
- 📱 **Reactivo**: Cambia en tiempo real
- 🎯 **Inteligente**: Evita traducir textos ya traducidos

### ⚠️ **Consideraciones:**
- 🌐 **Conexión**: Necesita internet para traducir
- 💰 **Costo**: APIs oficiales pueden tener costo
- 🎯 **Precisión**: Traducciones automáticas pueden no ser 100% exactas
- 📊 **Límites**: APIs tienen límites de uso

## 🛠️ Configuración por Pasos

### 1. Sistema Actual (Gratis)
Ya está funcionando con Google Translate gratuito.

### 2. Mejorar con API Oficial
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto y habilitar "Cloud Translation API"
3. Crear API Key
4. Reemplazar en `useSmartTranslate.ts`:

```tsx
const API_KEY = 'TU_API_KEY_AQUI';
const translateWithAPI = async (text: string, targetLang: string) => {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'es',
        target: targetLang
      })
    }
  );
  const data = await response.json();
  return data.data.translations[0].translatedText;
};
```

### 3. Agregar Más Idiomas
En `useSmartTranslate.ts`, añadir más idiomas al fallback:

```tsx
const fallbackTranslations = {
  'en': { /* traducciones inglés */ },
  'fr': { /* traducciones francés */ },
  'de': { /* traducciones alemán */ },
  'it': { /* traducciones italiano */ },
  'pt': { /* traducciones portugués */ },
  'zh': { /* traducciones chino */ },
  'ja': { /* traducciones japonés */ },
  'ko': { /* traducciones coreano */ }
};
```

## 🎮 Ejemplo Completo

```tsx
import { useState } from 'react';
import { useSmartTranslate } from '../hooks/useSmartTranslate';

const TiendaOnline = () => {
  const [idioma, setIdioma] = useState('es');
  const { t, isLoading } = useSmartTranslate(idioma);

  return (
    <div>
      {/* Selector de idioma */}
      <div>
        <button onClick={() => setIdioma('es')}>🇪🇸 Español</button>
        <button onClick={() => setIdioma('en')}>🇺🇸 English</button>
        <button onClick={() => setIdioma('fr')}>🇫🇷 Français</button>
      </div>

      {/* Contenido que se traduce automáticamente */}
      <header>
        <h1>{t('Bienvenido a Treboluxe')}</h1>
        <p>{t('Tu tienda de moda online de confianza')}</p>
      </header>

      <nav>
        <a href="#">{t('Inicio')}</a>
        <a href="#">{t('Productos')}</a>
        <a href="#">{t('Ofertas')}</a>
        <a href="#">{t('Contacto')}</a>
      </nav>

      <section>
        <h2>{t('Productos Destacados')}</h2>
        <button>{t('Ver todos los productos')}</button>
      </section>

      <footer>
        <p>{t('© 2024 Treboluxe. Todos los derechos reservados.')}</p>
      </footer>

      {/* Indicador de carga */}
      {isLoading && <div>Traduciendo...</div>}
    </div>
  );
};
```

## 🔥 Resultado Final

Con este sistema, puedes:
1. **Escribir solo en español** 🇪🇸
2. **Obtener traducciones automáticas** 🤖
3. **Cambiar idioma en tiempo real** ⚡
4. **Guardar traducciones** 💾
5. **Agregar nuevos idiomas fácilmente** 🌍

¡Ya no necesitas escribir traducciones manualmente! 🎉
