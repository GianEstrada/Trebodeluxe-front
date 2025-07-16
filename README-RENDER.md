# Treboluxe Frontend - Despliegue en Render

## 🚀 Configuración para Render

Este proyecto está configurado para ser desplegado en [Render](https://render.com) de manera automática.

### Pasos para desplegar:

1. **Crear cuenta en Render**
   - Ve a [render.com](https://render.com)
   - Crea una cuenta gratuita

2. **Conectar repositorio**
   - Sube tu código a GitHub, GitLab o Bitbucket
   - En Render, conecta tu repositorio

3. **Configurar el servicio**
   - Selecciona "Web Service"
   - Elige tu repositorio
   - Configura los siguientes valores:
     - **Name**: treboluxe-frontend
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run start:prod`
     - **Root Directory**: (dejar vacío si el proyecto está en la raíz)

4. **Variables de entorno**
   Configura estas variables en el panel de Render:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com
   NEXT_PUBLIC_SITE_URL=https://tu-frontend.onrender.com
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

### Archivos de configuración incluidos:

- `render.yaml` - Configuración de Render
- `.env.production` - Variables de entorno para producción
- `.env.local` - Variables de entorno para desarrollo
- `Dockerfile` - Para despliegue con contenedores
- `next.config.js` - Configuración optimizada de Next.js

### Scripts disponibles:

- `npm run dev` - Desarrollo local
- `npm run build` - Construir para producción
- `npm run start` - Servidor de producción
- `npm run start:prod` - Servidor de producción con puerto dinámico
- `npm run lint` - Verificar código

### Características de producción:

- ✅ Compresión habilitada
- ✅ Headers de seguridad
- ✅ Optimización de imágenes
- ✅ Output standalone para mejor rendimiento
- ✅ Variables de entorno configuradas
- ✅ Telemetría deshabilitada

### Monitoreo y logs:

Una vez desplegado, puedes monitorear tu aplicación en:
- Panel de Render: logs en tiempo real
- Métricas de rendimiento
- Configuración de dominios personalizados

### Solución de problemas:

1. **Error de build**: Verifica que todas las dependencias estén en `package.json`
2. **Error de variables**: Asegúrate de configurar las variables de entorno en Render
3. **Error 404**: Verifica que el `start command` sea correcto
4. **Error de memoria**: Considera cambiar a un plan pagado para más recursos

## 📱 Desarrollo local

Para ejecutar localmente:

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔧 Configuración adicional

### Dominio personalizado
En el panel de Render, ve a "Settings" > "Custom Domains" para configurar tu dominio.

### SSL/HTTPS
Render proporciona SSL automático para todos los despliegues.

### Escalabilidad
El plan gratuito incluye:
- 500 horas de build por mes
- Suspensión automática después de 15 minutos de inactividad
- Reinicio automático en la siguiente solicitud
