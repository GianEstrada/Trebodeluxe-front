# 🚨 CORRECCIÓN IMPORTANTE: Start Command para Render

## ❌ **INCORRECTO** (lo que tienes ahora):
```
Start Command: serve -s build
```

## ✅ **CORRECTO** (lo que debes usar):
```
Start Command: npm start
```

## 🔧 **Configuración completa para Render:**

### En el Dashboard de Render:
1. **Build Command**: `npm install && npm run build`
2. **Start Command**: `npm start`
3. **Environment Variables**:
   - `NODE_ENV=production`
   - `PORT=10000`

### O usar render.yaml:
```yaml
services:
  - type: web
    name: treboluxe-frontend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

## 🎯 **¿Por qué está mal `serve -s build`?**
- `serve` es para aplicaciones React estáticas (Create React App)
- Next.js es un framework con servidor integrado
- Next.js genera archivos en `.next/` no en `build/`
- Next.js necesita su propio servidor para SSR y API routes

## 🔄 **Scripts disponibles en tu package.json:**
- `npm start` → `next start -H 0.0.0.0 -p ${PORT:-10000}`
- `npm run build` → `next build`
- `npm run dev` → `next dev -H 0.0.0.0`

## 📋 **Pasos para corregir en Render:**
1. Ve a tu servicio en Render Dashboard
2. Edita la configuración
3. Cambia Start Command a: `npm start`
4. Guarda los cambios
5. Redeploy

¡Esto debería resolver el error "serve: command not found"! 🎉
