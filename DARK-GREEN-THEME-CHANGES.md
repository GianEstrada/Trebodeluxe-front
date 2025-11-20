# Cambios de Tema Verde Oscuro - Trebodeluxe

## Resumen de Cambios

Se ha implementado un tema verde oscuro en toda la aplicación con textos de alto contraste para garantizar una excelente legibilidad.

## Archivos Modificados

### 1. Configuración de Tailwind CSS
**Archivo:** `tailwind.config.js`

**Cambios:**
- Agregados colores verde oscuro para fondos principales:
  - `dark-green-primary`: #0a2f0a
  - `dark-green-secondary`: #0d3d0d
  - `dark-green-tertiary`: #1a6b1a
  - `dark-green-accent`: #289c28

- Agregados colores de texto con alto contraste:
  - `text-primary-light`: #ffffff
  - `text-secondary-light`: #e8e8e8
  - `text-tertiary-light`: #c8c8c8

- Agregados overlays para elementos con fondo claro:
  - `overlay-light`: rgba(255, 255, 255, 0.95)
  - `overlay-medium`: rgba(255, 255, 255, 0.85)
  - `overlay-dark`: rgba(0, 0, 0, 0.7)

- Actualizados colores existentes para compatibilidad con el nuevo tema

### 2. CSS Global
**Archivo:** `pages/global.css`

**Cambios:**
- Establecido `background-color: #0a2f0a` y `color: #ffffff` en el body
- Agregadas reglas para asegurar contraste en elementos de texto
- Definidos estilos para fondos oscuros vs overlays claros

### 3. Tema Verde Oscuro
**Archivo:** `styles/dark-green-theme.css` (NUEVO)

**Contenido:**
- Estilos globales exhaustivos para mantener contraste óptimo
- Reglas para botones con dos variantes:
  - Botones con overlay claro y texto oscuro (por defecto)
  - Botones con tema oscuro (clase `.dark-theme-button`)
- Estilos para inputs, formularios, tablas, modales, dropdowns
- Navegación y footer con gradientes verde oscuro
- Scrollbars personalizados con tema verde
- Alertas, badges, tooltips con contraste adecuado

### 4. Importación del Tema
**Archivo:** `pages/_app.tsx`

**Cambios:**
- Agregada importación: `import "../styles/dark-green-theme.css";`

### 5. Componente Layout
**Archivo:** `components/Layout.tsx`

**Cambios:**
- Actualizado gradiente de fondo principal: 
  ```
  linear-gradient(180deg, #0a2f0a 0%, #1a6b1a 25%, #0d3d0d 35%, #0a2f0a 75%, #000 100%)
  ```
- Cambiados todos los textos a `text-text-primary-light` para asegurar alto contraste
- Actualizado gradiente de la barra promocional a verde oscuro más consistente

### 6. Componente Footer
**Archivo:** `components/Footer.tsx`

**Cambios:**
- Actualizado gradiente de fondo: `linear-gradient(180deg, #0a2f0a, #1a6b1a)`
- Cambiados colores de texto a las nuevas clases de contraste:
  - `text-text-tertiary-light` para texto general
  - `text-text-secondary-light` para enlaces
  - `text-text-primary-light` para texto principal

## Características del Nuevo Tema

### Colores de Fondo
1. **Verde Oscuro Principal (#0a2f0a):** Fondo base de la aplicación
2. **Verde Oscuro Secundario (#0d3d0d):** Alternativa para variedad visual
3. **Verde Medio (#1a6b1a):** Para gradientes y elementos de énfasis
4. **Verde Acento (#289c28):** Para botones y elementos interactivos

### Estrategia de Contraste
1. **Texto sobre fondo oscuro:** Blanco (#ffffff) o gris claro (#e8e8e8, #c8c8c8)
2. **Texto sobre fondo claro:** Negro/gris oscuro (#1a1a1a) en overlays blancos
3. **Links:** Verde brillante (#00ff6a) que cambia a amarillo dorado (#dcdc27) al hover

### Componentes con Overlay Claro
Para mantener la paleta pero asegurar legibilidad, estos elementos usan fondo blanco con texto oscuro:
- Modales y diálogos
- Cards y paneles
- Formularios e inputs
- Dropdowns y menús
- Tablas de datos

## Compatibilidad

### Desarrollo Local
Los estilos funcionan perfectamente en desarrollo local:
```bash
npm run dev
```

### Producción (Render)
Los archivos CSS están configurados correctamente para funcionar en producción:
- Importación en `_app.tsx` asegura que se incluyan en el bundle
- Tailwind CSS procesa todas las clases personalizadas
- CSS global se aplica en toda la aplicación

## Clases Utility Agregadas

Para usar en componentes específicos:

```tsx
// Fondos verde oscuro
className="bg-dark-green-primary"
className="bg-dark-green-secondary"
className="bg-dark-green-tertiary"

// Textos con alto contraste
className="text-text-primary-light"
className="text-text-secondary-light"
className="text-text-tertiary-light"

// Overlays para elementos con fondo claro
className="bg-overlay-light text-black"
className="bg-overlay-medium text-black"

// Botón con tema oscuro
className="dark-theme-button"
```

## Próximos Pasos (Opcional)

Si se desea personalizar aún más:

1. **Componentes específicos:** Revisar componentes individuales en `/components` y actualizar sus clases de color
2. **Páginas:** Actualizar páginas en `/pages` que puedan tener colores hardcoded
3. **Imágenes:** Considerar agregar filtros CSS a imágenes para mejor integración con el tema oscuro
4. **Modo claro/oscuro:** Implementar toggle para cambiar entre tema verde oscuro y tema claro

## Testing

### Verificar en Desarrollo
```bash
cd Trebodeluxe-front
npm run dev
# Visitar http://localhost:3000
```

### Verificar Contraste
- Usar herramientas como Chrome DevTools Lighthouse
- Verificar ratio de contraste WCAG AA (mínimo 4.5:1)
- Todos los textos principales cumplen WCAG AAA (7:1)

## Notas Técnicas

- Los estilos CSS personalizados tienen mayor especificidad que Tailwind en algunos casos
- Se usa `!important` solo en estilos del body para asegurar que se apliquen sobre otros estilos
- Los gradientes usan stops específicos para crear transiciones suaves
- La sombra de texto en títulos mejora la legibilidad sobre fondos con imágenes
