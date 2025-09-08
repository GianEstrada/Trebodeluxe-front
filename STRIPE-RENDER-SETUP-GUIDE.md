# 🔑 Configuración de Variables de Entorno en Render

Este documento te guía para configurar las variables de Stripe correctamente en Render.

## 📋 Variables Requeridas

### **Backend (trebodeluxe-backend)**
```
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx (para sandbox) o pk_live_xxxxx (para producción)
STRIPE_SECRET_KEY=sk_test_xxxxx (para sandbox) o sk_live_xxxxx (para producción)  
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### **Frontend (trebodeluxe-front)**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx (para sandbox) o pk_live_xxxxx (para producción)
```

## 🔧 Pasos para Configurar en Render

### 1. **Acceder al Dashboard de Render**
- Ve a https://dashboard.render.com
- Inicia sesión con tu cuenta

### 2. **Configurar Backend**
- Busca el servicio: `trebodeluxe-backend`
- Ve a la pestaña **"Environment"**
- Agrega/actualiza estas variables:
  ```
  STRIPE_PUBLISHABLE_KEY = [tu_clave_publica_de_stripe]
  STRIPE_SECRET_KEY = [tu_clave_secreta_de_stripe]
  STRIPE_WEBHOOK_SECRET = [tu_webhook_secret_de_stripe]
  ```

### 3. **Configurar Frontend**
- Busca el servicio: `trebodeluxe-front`
- Ve a la pestaña **"Environment"**
- Agrega/actualiza esta variable:
  ```
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = [tu_clave_publica_de_stripe]
  ```

### 4. **Reiniciar Servicios**
- Después de configurar las variables, haz clic en **"Manual Deploy"** en cada servicio
- Esto reiniciará los servicios con las nuevas variables

## 🧪 Modo Sandbox vs Producción

### **Para Pruebas (Sandbox)**
- Usa claves que empiecen con `pk_test_` y `sk_test_`
- Los pagos son simulados, no se cobran tarjetas reales

### **Para Producción**
- Usa claves que empiecen con `pk_live_` y `sk_live_`
- Los pagos son reales y se cobran tarjetas reales

## ✅ Verificación

Una vez configurado, deberías ver:
- ✅ Payment Intents creándose correctamente (status 200)
- ✅ No más errores de "Invalid API Key"
- ✅ Formulario de Stripe cargando sin errores 400

## 🔒 Seguridad

✅ **Buenas prácticas implementadas:**
- Las claves no están en el código fuente
- Solo están configuradas en variables de entorno de Render
- Los archivos `.env` locales no contienen claves reales

❌ **NO hagas esto:**
- No subas claves reales al repositorio
- No compartas claves en chats o documentos
- No uses claves de producción para pruebas
