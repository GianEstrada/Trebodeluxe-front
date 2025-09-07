# GUÍA DE COMMITS - SISTEMA DE ENVÍOS INTERNACIONALES

## 📋 ESTRATEGIA DE COMMITS

### 🎯 Objetivo
Organizar los commits del sistema de envíos internacionales de manera clara y profesional para facilitar el versionado y seguimiento de cambios.

## 🚀 SECUENCIA RECOMENDADA DE COMMITS

### FRONTEND (Trebodeluxe-front)

#### Commit 1: Interface y tipos base
```bash
git add pages/carrito.tsx
git commit -m "feat: add Country interface and supportedCountries array

- Add Country interface with code, name, flag, postalCodeLength, postalCodeFormat
- Add supportedCountries array with 16 countries and flag emojis
- Include validation rules for postal codes per country
- Prepare base types for international shipping system"
```

#### Commit 2: Estado y dropdown UI
```bash
git add pages/carrito.tsx
git commit -m "feat: implement international country selector dropdown

- Add selectedCountry state with Country type
- Add showCountryDropdown state for UI control
- Add countryDropdownRef for click outside detection
- Implement dropdown UI with flags and country names
- Add visual indicators and selection feedback"
```

#### Commit 3: Validación de códigos postales
```bash
git add pages/carrito.tsx
git commit -m "feat: add country-specific postal code validation

- Implement postal code formatting per country (MX/US: numbers only, CA/GB: alphanumeric)
- Add real-time validation with country-specific rules
- Add placeholder examples showing correct format per country
- Clear validation errors on country change"
```

#### Commit 4: Integración con API híbrida
```bash
git add pages/carrito.tsx
git commit -m "feat: integrate hybrid shipping API endpoints

- Update handleGetShippingQuotes to use hybrid/international endpoints
- Route to quote-hybrid for Mexico, quote-international for other countries
- Pass forceCountry parameter for international shipping
- Update request payload structure for new API"
```

#### Commit 5: Limpieza y eliminación de dependencias
```bash
git add pages/carrito.tsx
git commit -m "refactor: remove CountryPostalSelector component dependency

- Remove import of CountryPostalSelector component
- Replace with native dropdown implementation
- Maintain same functionality with improved UX
- Better integration with existing UI design"
```

### BACKEND (Trebodeluxe-backend)

#### Commit 1: Rutas híbridas base
```bash
git add src/routes/skydropx.routes.js
git commit -m "feat: implement hybrid shipping quote routes

- Add /cart/quote-hybrid endpoint for automatic national/international decision
- Add /cart/quote-international endpoint for forced international shipping
- Implement request validation for cartId, postalCode, and forceCountry
- Add comprehensive error handling and logging"
```

#### Commit 2: Mejora de respuestas API
```bash
git add src/routes/skydropx.routes.js
git commit -m "feat: enhance API responses with decision indicators

- Add isHybrid flag to hybrid route responses
- Add decision field showing 'nacional' or 'internacional'
- Add isInternational flag to international route responses
- Add country detection in response payload
- Improve error messages and debugging information"
```

#### Commit 3: Scripts de testing
```bash
git add test-hybrid-routes.js test-hybrid-routes-local.js test-simple-quote.js test-cart-6-exists.js
git commit -m "test: add comprehensive testing suite for hybrid shipping

- Add test-hybrid-routes.js for production API testing
- Add test-hybrid-routes-local.js for local development testing
- Add test-simple-quote.js for basic functionality validation
- Add test-cart-6-exists.js for database cart verification
- Include timeout handling and error reporting"
```

### DOCUMENTACIÓN

#### Commit 1: Documentación técnica
```bash
git add INTERNATIONAL-SHIPPING-DROPDOWN-IMPLEMENTATION.md INTERNATIONAL-SHIPPING-SYSTEM-COMPLETE.md
git commit -m "docs: add comprehensive international shipping documentation

- Add complete implementation guide with 16 supported countries
- Document API endpoints and request/response formats
- Include country-specific postal code validation rules
- Add testing framework and usage examples
- Document integration with existing hybrid system"
```

## 📝 MENSAJES DE COMMIT DETALLADOS

### Estructura Recomendada:
```
<tipo>: <descripción breve>

<descripción detallada opcional>
- Punto específico 1
- Punto específico 2
- Punto específico 3

<información adicional como breaking changes o issues relacionados>
```

### Tipos de Commit Utilizados:
- `feat`: Nueva funcionalidad
- `refactor`: Refactorización de código existente
- `test`: Adición o modificación de tests
- `docs`: Documentación

## 🔧 COMANDOS ESPECÍFICOS PARA EJECUTAR

### Frontend Repository (Trebodeluxe-front):
```bash
# Navegar al directorio del frontend
cd "E:\Trebodeluxe\Trebodeluxe-front"

# Commit 1 - Interface base
git add pages/carrito.tsx
git commit -m "feat: add Country interface and supportedCountries array

- Add Country interface with code, name, flag, postalCodeLength, postalCodeFormat
- Add supportedCountries array with 16 countries and flag emojis
- Include validation rules for postal codes per country
- Prepare base types for international shipping system"

# Commit 2 - Estado y UI
git add pages/carrito.tsx
git commit -m "feat: implement international country selector dropdown

- Add selectedCountry state with Country type
- Add showCountryDropdown state for UI control
- Add countryDropdownRef for click outside detection
- Implement dropdown UI with flags and country names
- Add visual indicators and selection feedback"

# Commit 3 - Validación
git add pages/carrito.tsx
git commit -m "feat: add country-specific postal code validation

- Implement postal code formatting per country (MX/US: numbers only, CA/GB: alphanumeric)
- Add real-time validation with country-specific rules
- Add placeholder examples showing correct format per country
- Clear validation errors on country change"

# Commit 4 - Integración API
git add pages/carrito.tsx
git commit -m "feat: integrate hybrid shipping API endpoints

- Update handleGetShippingQuotes to use hybrid/international endpoints
- Route to quote-hybrid for Mexico, quote-international for other countries
- Pass forceCountry parameter for international shipping
- Update request payload structure for new API"

# Commit 5 - Refactor
git add pages/carrito.tsx
git commit -m "refactor: remove CountryPostalSelector component dependency

- Remove import of CountryPostalSelector component
- Replace with native dropdown implementation
- Maintain same functionality with improved UX
- Better integration with existing UI design"
```

### Backend Repository (Trebodeluxe-backend):
```bash
# Navegar al directorio del backend
cd "E:\Trebodeluxe\Trebodeluxe-backend"

# Commit 1 - Rutas híbridas
git add src/routes/skydropx.routes.js
git commit -m "feat: implement hybrid shipping quote routes

- Add /cart/quote-hybrid endpoint for automatic national/international decision
- Add /cart/quote-international endpoint for forced international shipping
- Implement request validation for cartId, postalCode, and forceCountry
- Add comprehensive error handling and logging"

# Commit 2 - Mejoras API
git add src/routes/skydropx.routes.js
git commit -m "feat: enhance API responses with decision indicators

- Add isHybrid flag to hybrid route responses
- Add decision field showing 'nacional' or 'internacional'
- Add isInternational flag to international route responses
- Add country detection in response payload
- Improve error messages and debugging information"

# Commit 3 - Scripts de testing
git add test-hybrid-routes.js test-hybrid-routes-local.js test-simple-quote.js test-cart-6-exists.js
git commit -m "test: add comprehensive testing suite for hybrid shipping

- Add test-hybrid-routes.js for production API testing
- Add test-hybrid-routes-local.js for local development testing
- Add test-simple-quote.js for basic functionality validation
- Add test-cart-6-exists.js for database cart verification
- Include timeout handling and error reporting"
```

### Documentación Global:
```bash
# En el directorio raíz del proyecto
cd "E:\Trebodeluxe"

# Commit de documentación
git add INTERNATIONAL-SHIPPING-DROPDOWN-IMPLEMENTATION.md INTERNATIONAL-SHIPPING-SYSTEM-COMPLETE.md
git commit -m "docs: add comprehensive international shipping documentation

- Add complete implementation guide with 16 supported countries
- Document API endpoints and request/response formats
- Include country-specific postal code validation rules
- Add testing framework and usage examples
- Document integration with existing hybrid system"
```

## 🎯 RESULTADO FINAL

Después de ejecutar todos estos commits tendrás:

1. **Historia clara** del desarrollo del sistema de envíos internacionales
2. **Commits atómicos** que se pueden revertir individualmente si es necesario
3. **Mensajes descriptivos** que explican qué se hizo y por qué
4. **Separación lógica** entre frontend, backend y documentación
5. **Tests incluidos** para validar la funcionalidad

## 📋 CHECKLIST PRE-COMMIT

Antes de hacer los commits, asegúrate de:

- [ ] El código está funcionando correctamente
- [ ] Los tests pasan (si aplica)
- [ ] No hay código comentado o console.logs innecesarios en producción
- [ ] La documentación está actualizada
- [ ] Los nombres de variables y funciones son descriptivos

---

*Esta guía te ayudará a mantener un historial de git limpio y profesional para el sistema de envíos internacionales.*
