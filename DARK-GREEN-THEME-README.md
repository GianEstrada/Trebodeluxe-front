# Guía de Implementación del Tema Verde Oscuro

## 🎨 Descripción

Se ha implementado un tema verde oscuro en toda la aplicación Trebodeluxe con textos de alto contraste para garantizar una excelente legibilidad y experiencia de usuario.

## ✅ Cambios Realizados

### Archivos Modificados
1. ✅ `tailwind.config.js` - Nueva paleta de colores verde oscuro
2. ✅ `pages/global.css` - Estilos base actualizados
3. ✅ `styles/dark-green-theme.css` - Nuevo archivo con tema completo
4. ✅ `pages/_app.tsx` - Importación del tema
5. ✅ `components/Layout.tsx` - Gradientes y textos actualizados
6. ✅ `components/Footer.tsx` - Colores actualizados

### Archivos Nuevos
- `styles/dark-green-theme.css` - Sistema completo de estilos con tema verde oscuro
- `DARK-GREEN-THEME-CHANGES.md` - Documentación detallada de cambios

## 🚀 Cómo Probar Localmente

### Opción 1: Desarrollo Local (Recomendado)

```powershell
# Navegar al directorio del frontend
cd J:\Trebodeluxe\Trebodeluxe-front

# Instalar dependencias (si es necesario)
npm install

# Iniciar el servidor de desarrollo
npm run dev

# Abrir en el navegador
# http://localhost:3000
```

### Opción 2: Build de Producción Local

```powershell
# Navegar al directorio del frontend
cd J:\Trebodeluxe\Trebodeluxe-front

# Construir para producción
npm run build

# Iniciar el servidor de producción
npm start

# Abrir en el navegador
# http://localhost:3000
```

## 🌐 Despliegue en Render

Los cambios están listos para desplegarse en Render:

1. **Commit y Push:**
   ```powershell
   cd J:\Trebodeluxe\Trebodeluxe-front
   git add .
   git commit -m "Implementación de tema verde oscuro con alto contraste"
   git push origin main
   ```

2. **Render detectará automáticamente los cambios** y reconstruirá la aplicación.

3. **Los archivos CSS se incluirán automáticamente** gracias a la importación en `_app.tsx`.

## 🎨 Paleta de Colores Implementada

### Fondos Verde Oscuro
- **Principal:** `#0a2f0a` (Verde muy oscuro)
- **Secundario:** `#0d3d0d` (Verde oscuro alternativo)
- **Terciario:** `#1a6b1a` (Verde medio)
- **Acento:** `#289c28` (Verde brillante)

### Textos con Alto Contraste
- **Primario:** `#ffffff` (Blanco puro)
- **Secundario:** `#e8e8e8` (Gris muy claro)
- **Terciario:** `#c8c8c8` (Gris claro)

### Overlays para Elementos Claros
- **Light:** `rgba(255, 255, 255, 0.95)` (Fondo blanco con texto oscuro)
- **Medium:** `rgba(255, 255, 255, 0.85)` (Fondo blanco semi-transparente)
- **Dark:** `rgba(0, 0, 0, 0.7)` (Overlay oscuro)

## 📝 Uso de Clases Tailwind Nuevas

```tsx
// Fondos verde oscuro
<div className="bg-dark-green-primary">...</div>
<div className="bg-dark-green-secondary">...</div>
<div className="bg-dark-green-tertiary">...</div>

// Textos con alto contraste
<h1 className="text-text-primary-light">Título</h1>
<p className="text-text-secondary-light">Párrafo</p>
<span className="text-text-tertiary-light">Nota</span>

// Overlays para cards/modales
<div className="bg-overlay-light text-black">
  <h2>Contenido con fondo claro</h2>
</div>

// Botones con tema oscuro
<button className="dark-theme-button">
  Botón Verde
</button>
```

## 🧪 Verificación Visual

### Elementos a Verificar

1. **Página Principal (/):**
   - ✅ Fondo verde oscuro con gradiente
   - ✅ Textos blancos/claros legibles
   - ✅ Barra de navegación con tema verde
   - ✅ Footer con gradiente verde oscuro

2. **Catálogo (/catalogo):**
   - ✅ Cards de productos con overlay claro
   - ✅ Textos contrastados
   - ✅ Botones visibles y legibles

3. **Carrito (/carrito):**
   - ✅ Modal con fondo claro y texto oscuro
   - ✅ Botones de acción visibles
   - ✅ Información de productos legible

4. **Checkout (/checkout):**
   - ✅ Formularios con fondo claro
   - ✅ Inputs legibles
   - ✅ Botones de pago destacados

5. **Admin (/admin):**
   - ✅ Paneles de administración con buen contraste
   - ✅ Tablas de datos legibles
   - ✅ Formularios funcionales

## 🔧 Personalización Adicional

Si necesitas ajustar colores en componentes específicos:

1. **Componentes individuales:** Edita archivos en `components/` y aplica las clases Tailwind nuevas
2. **Páginas específicas:** Edita archivos en `pages/` y actualiza las clases de color
3. **Ajuste global:** Modifica `styles/dark-green-theme.css` para cambios que afecten toda la app

## 🐛 Solución de Problemas

### Los colores no se aplican
```powershell
# Limpia la caché y reconstruye
npm run build
# o
rm -rf .next
npm run dev
```

### Conflictos con estilos anteriores
Verifica que `styles/dark-green-theme.css` esté importado en `_app.tsx` **después** de `global.css`.

### En producción (Render) no se ven los cambios
1. Verifica que el commit se haya hecho correctamente
2. Revisa los logs de build en Render
3. Fuerza un nuevo deploy manual si es necesario

## 📱 Compatibilidad

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iOS, Android)
- ✅ Mobile (iOS, Android)
- ✅ Modo oscuro del sistema (no afecta)

## 🎯 Ratio de Contraste WCAG

Todos los textos principales cumplen con:
- **WCAG AA:** Mínimo 4.5:1 ✅
- **WCAG AAA:** Mínimo 7:1 ✅

## 📞 Soporte

Si encuentras algún problema o necesitas ajustes adicionales:
1. Revisa la documentación en `DARK-GREEN-THEME-CHANGES.md`
2. Verifica los estilos en `styles/dark-green-theme.css`
3. Consulta las clases Tailwind en `tailwind.config.js`

---

**Creado:** 18 de Noviembre, 2025
**Versión:** 1.0.0
**Estado:** ✅ Listo para Producción
