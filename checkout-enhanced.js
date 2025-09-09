// checkout-enhanced.js - JavaScript para el checkout mejorado
const stripe = Stripe("pk_test_51RcYc8GMXUffSj5qOrBErSzdFCH4xp1Z6yN3QAtJ9GtShaNNRl57f2Z8ZJo85ZcVuICDs2Gb55cKiKChU5VDmbuh00aKfnhM8A");

class CheckoutManager {
    constructor() {
        this.API_BASE = 'https://trebodeluxe-backend.onrender.com';
        this.currentCurrency = 'MXN';
        this.exchangeRates = {};
        this.cartItems = [];
        this.subtotal = 0;
        this.shippingCost = 150;
        this.iva = 0;
        this.total = 0;
        this.elements = null;
        this.paymentElement = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Checkout Manager...');
        
        // Cargar tasas de cambio
        await this.loadExchangeRates();
        
        // Cargar items del carrito
        await this.loadCartItems();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar información del usuario si está logueado
        await this.loadUserInfo();
        
        // Inicializar Stripe
        await this.initializeStripe();
        
        // Calcular totales iniciales
        this.calculateTotals();
        
        console.log('✅ Checkout Manager inicializado');
    }

    async loadExchangeRates() {
        try {
            console.log('💱 Cargando tasas de cambio...');
            const response = await fetch(`${this.API_BASE}/api/currency/rates`);
            const data = await response.json();
            
            if (data.success) {
                this.exchangeRates = data.rates;
                console.log('✅ Tasas de cambio cargadas:', this.exchangeRates);
            }
        } catch (error) {
            console.error('❌ Error cargando tasas de cambio:', error);
            // Usar tasas por defecto si falla
            this.exchangeRates = {
                MXN: { USD: 0.060, EUR: 0.055, MXN: 1.0 },
                USD: { MXN: 16.70, EUR: 0.92, USD: 1.0 },
                EUR: { MXN: 18.20, USD: 1.09, EUR: 1.0 }
            };
        }
    }

    async loadCartItems() {
        try {
            console.log('🛒 Cargando items del carrito...');
            
            // Usar la API del carrito existente
            const authHeaders = this.getAuthHeaders();
            const response = await fetch(`${this.API_BASE}/api/cart`, {
                headers: authHeaders
            });
            
            const data = await response.json();
            
            if (data.success && data.items) {
                this.cartItems = data.items;
                this.displayCartItems();
                console.log('✅ Items del carrito cargados:', this.cartItems.length);
            } else {
                console.warn('⚠️ No se encontraron items en el carrito');
                this.cartItems = [];
            }
        } catch (error) {
            console.error('❌ Error cargando carrito:', error);
            this.cartItems = [];
        }
    }

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Verificar si hay usuario logueado
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                if (userData.token) {
                    headers['Authorization'] = `Bearer ${userData.token}`;
                    return headers;
                }
            } catch (e) {
                console.warn('Error parsing user data');
            }
        }
        
        // Usuario anónimo - usar session token
        let sessionToken = localStorage.getItem('session-token');
        if (!sessionToken) {
            sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('session-token', sessionToken);
        }
        headers['X-Session-Token'] = sessionToken;
        
        return headers;
    }

    displayCartItems() {
        const container = document.getElementById('cart-items');
        
        if (this.cartItems.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No hay items en el carrito</p>';
            return;
        }

        container.innerHTML = this.cartItems.map(item => `
            <div class="cart-item">
                <div class="item-details">
                    <div class="item-name">${item.nombre_producto || 'Producto'}</div>
                    <div class="item-variant">
                        ${item.color ? `Color: ${item.color}` : ''} 
                        ${item.talla_nombre ? `| Talla: ${item.talla_nombre}` : ''}
                        ${item.cantidad ? `| Cantidad: ${item.cantidad}` : ''}
                    </div>
                </div>
                <div class="item-price">
                    <span class="original-price" data-price="${item.precio_unitario}">
                        $${this.formatPrice(this.convertCurrency(item.precio_unitario || 0, 'MXN', this.currentCurrency))}
                    </span>
                </div>
            </div>
        `).join('');

        this.calculateTotals();
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;
        
        const rate = this.exchangeRates[fromCurrency]?.[toCurrency] || 1;
        return amount * rate;
    }

    formatPrice(amount) {
        return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    getCurrencySymbol(currency) {
        const symbols = {
            MXN: '$',
            USD: '$',
            EUR: '€'
        };
        return symbols[currency] || '$';
    }

    calculateTotals() {
        // Calcular subtotal en la moneda actual
        this.subtotal = this.cartItems.reduce((sum, item) => {
            const priceInCurrentCurrency = this.convertCurrency(
                item.precio_unitario || 0, 
                'MXN', 
                this.currentCurrency
            );
            return sum + (priceInCurrentCurrency * (item.cantidad || 1));
        }, 0);

        // Convertir costo de envío a la moneda actual
        const shippingInCurrentCurrency = this.convertCurrency(
            this.shippingCost, 
            'MXN', 
            this.currentCurrency
        );

        // Calcular IVA (16%)
        this.iva = this.subtotal * 0.16;
        
        // Calcular total
        this.total = this.subtotal + this.iva + shippingInCurrentCurrency;

        // Actualizar UI
        this.updateTotalDisplay();
    }

    updateTotalDisplay() {
        const symbol = this.getCurrencySymbol(this.currentCurrency);
        const shippingInCurrentCurrency = this.convertCurrency(this.shippingCost, 'MXN', this.currentCurrency);
        
        document.getElementById('subtotal-amount').textContent = 
            `${symbol}${this.formatPrice(this.subtotal)} ${this.currentCurrency}`;
        
        document.getElementById('shipping-amount').textContent = 
            `${symbol}${this.formatPrice(shippingInCurrentCurrency)} ${this.currentCurrency}`;
        
        document.getElementById('iva-amount').textContent = 
            `${symbol}${this.formatPrice(this.iva)} ${this.currentCurrency}`;
        
        document.getElementById('total-amount').textContent = 
            `${symbol}${this.formatPrice(this.total)} ${this.currentCurrency}`;
    }

    setupEventListeners() {
        // Botones de moneda
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeCurrency(e.target.dataset.currency);
            });
        });

        // Opciones de envío
        document.querySelectorAll('.shipping-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectShippingOption(e.currentTarget);
            });
        });

        // Botón de checkout
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.processPayment();
        });
    }

    changeCurrency(newCurrency) {
        console.log(`💱 Cambiando moneda de ${this.currentCurrency} a ${newCurrency}`);
        
        // Actualizar botones
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-currency="${newCurrency}"]`).classList.add('active');
        
        // Actualizar moneda actual
        this.currentCurrency = newCurrency;
        
        // Recalcular totales
        this.calculateTotals();
        
        // Actualizar opciones de envío
        this.updateShippingOptions();
        
        // Actualizar display de items
        this.displayCartItems();
    }

    updateShippingOptions() {
        document.querySelectorAll('.shipping-option').forEach(option => {
            const baseCostMXN = parseInt(option.dataset.cost);
            const costInCurrentCurrency = this.convertCurrency(baseCostMXN, 'MXN', this.currentCurrency);
            const symbol = this.getCurrencySymbol(this.currentCurrency);
            
            option.querySelector('.shipping-cost').textContent = 
                `${symbol}${this.formatPrice(costInCurrentCurrency)} ${this.currentCurrency}`;
        });
    }

    selectShippingOption(optionElement) {
        // Remover selección anterior
        document.querySelectorAll('.shipping-option').forEach(option => {
            option.classList.remove('selected');
            option.querySelector('input[type="radio"]').checked = false;
        });
        
        // Seleccionar nueva opción
        optionElement.classList.add('selected');
        optionElement.querySelector('input[type="radio"]').checked = true;
        
        // Actualizar costo de envío
        const baseCostMXN = parseInt(optionElement.dataset.cost);
        this.shippingCost = baseCostMXN;
        
        // Recalcular totales
        this.calculateTotals();
    }

    async loadUserInfo() {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                console.log('👤 Usuario logueado detectado:', userData.nombres);
                
                // Si hay información de envío, cargarla
                if (userData.shippingInfo) {
                    this.fillShippingForm(userData.shippingInfo);
                }
            } catch (error) {
                console.warn('Error cargando info del usuario:', error);
            }
        }
    }

    fillShippingForm(shippingInfo) {
        const fields = [
            'nombre_completo', 'telefono', 'direccion', 
            'ciudad', 'estado', 'codigo_postal', 'pais'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && shippingInfo[field]) {
                element.value = shippingInfo[field];
            }
        });
    }

    async initializeStripe() {
        try {
            console.log('💳 Inicializando Stripe...');
            
            // Crear payment intent
            const intentResponse = await fetch(`${this.API_BASE}/api/stripe/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: Math.round(this.total * 100), // Convertir a centavos
                    currency: this.currentCurrency.toLowerCase(),
                    metadata: {
                        items_count: this.cartItems.length,
                        shipping_method: document.querySelector('input[name="shipping"]:checked')?.value || 'standard'
                    }
                }),
            });

            const intentData = await intentResponse.json();
            
            if (!intentData.success) {
                throw new Error(intentData.message || 'Error creando payment intent');
            }

            // Configurar Stripe Elements
            const appearance = {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#3498db',
                }
            };

            this.elements = stripe.elements({ 
                appearance, 
                clientSecret: intentData.clientSecret 
            });

            this.paymentElement = this.elements.create('payment');
            this.paymentElement.mount('#payment-element');

            console.log('✅ Stripe inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando Stripe:', error);
            this.showError('Error configurando el sistema de pagos. Por favor, recargue la página.');
        }
    }

    async processPayment() {
        try {
            this.showLoading(true);
            
            // Validar formulario
            const formData = this.getFormData();
            if (!this.validateForm(formData)) {
                this.showLoading(false);
                return;
            }

            console.log('💳 Procesando pago...');

            // Confirmar pago con Stripe
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: `${window.location.origin}/checkout-complete.html`,
                },
                redirect: 'if_required'
            });

            if (error) {
                console.error('❌ Error en pago:', error);
                this.showError(error.message);
                this.showLoading(false);
                return;
            }

            console.log('✅ Pago confirmado:', paymentIntent.id);

            // Crear orden en el backend
            await this.createOrder(paymentIntent, formData);

        } catch (error) {
            console.error('❌ Error procesando pago:', error);
            this.showError('Error procesando el pago. Por favor, inténtelo de nuevo.');
            this.showLoading(false);
        }
    }

    getFormData() {
        const form = document.getElementById('checkout-form');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Agregar método de envío seleccionado
        const selectedShipping = document.querySelector('input[name="shipping"]:checked');
        data.metodo_envio = selectedShipping ? selectedShipping.value : 'standard';
        data.costo_envio = this.shippingCost;
        
        return data;
    }

    validateForm(formData) {
        const required = ['nombre_completo', 'telefono', 'direccion', 'ciudad', 'estado', 'codigo_postal', 'pais'];
        
        for (let field of required) {
            if (!formData[field] || formData[field].trim() === '') {
                this.showError(`El campo ${field.replace('_', ' ')} es obligatorio`);
                return false;
            }
        }
        
        if (this.cartItems.length === 0) {
            this.showError('No hay items en el carrito');
            return false;
        }
        
        return true;
    }

    async createOrder(paymentIntent, formData) {
        try {
            console.log('📝 Creando orden en el sistema...');

            // Preparar datos de la orden
            const orderData = {
                // Items del carrito
                cartItems: this.cartItems,
                
                // Usuario (si está logueado)
                userId: this.getCurrentUserId(),
                
                // Información de envío
                shippingInfo: {
                    nombre_completo: formData.nombre_completo,
                    telefono: formData.telefono,
                    correo: formData.correo || '',
                    direccion: formData.direccion,
                    ciudad: formData.ciudad,
                    estado: formData.estado,
                    codigo_postal: formData.codigo_postal,
                    pais: formData.pais
                },
                
                // Datos del pago
                paymentIntentId: paymentIntent.id,
                paymentStatus: paymentIntent.status,
                
                // Totales (en MXN como base)
                subtotal: this.convertCurrency(this.subtotal, this.currentCurrency, 'MXN'),
                iva: this.convertCurrency(this.iva, this.currentCurrency, 'MXN'),
                total: this.convertCurrency(this.total, this.currentCurrency, 'MXN'),
                moneda: this.currentCurrency,
                tasaCambio: this.exchangeRates['MXN'][this.currentCurrency] || 1.0,
                
                // Envío
                metodoEnvio: formData.metodo_envio,
                costoEnvio: this.shippingCost
            };

            console.log('📋 Datos de orden preparados:', orderData);

            // Enviar al backend
            const response = await fetch(`${this.API_BASE}/api/orders/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Orden creada exitosamente:', result.order.numero_referencia);
                
                // Limpiar carrito
                await this.clearCart();
                
                // Mostrar éxito
                this.showSuccess(result.order);
            } else {
                throw new Error(result.message || 'Error creando la orden');
            }

        } catch (error) {
            console.error('❌ Error creando orden:', error);
            this.showError('Error creando la orden. Por favor, contacte soporte con el ID de pago: ' + paymentIntent.id);
        } finally {
            this.showLoading(false);
        }
    }

    getCurrentUserId() {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                return userData.id_usuario || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    async clearCart() {
        try {
            const authHeaders = this.getAuthHeaders();
            await fetch(`${this.API_BASE}/api/cart/clear`, {
                method: 'DELETE',
                headers: authHeaders
            });
            console.log('🧹 Carrito limpiado');
        } catch (error) {
            console.warn('Advertencia: Error limpiando carrito:', error);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const btn = document.getElementById('checkout-btn');
        
        if (show) {
            loading.style.display = 'block';
            btn.disabled = true;
            btn.textContent = 'Procesando...';
        } else {
            loading.style.display = 'none';
            btn.disabled = false;
            btn.textContent = 'Procesar Pago';
        }
    }

    showSuccess(order) {
        const alert = document.getElementById('success-alert');
        const referenceElement = document.getElementById('order-reference');
        
        referenceElement.textContent = order.numero_referencia;
        alert.style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Ocultar formulario
        document.querySelector('.checkout-form').style.display = 'none';
    }

    showError(message) {
        const alert = document.getElementById('error-alert');
        const messageElement = document.getElementById('error-message');
        
        messageElement.textContent = message;
        alert.style.display = 'block';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            alert.style.display = 'none';
        }, 10000);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new CheckoutManager();
});
