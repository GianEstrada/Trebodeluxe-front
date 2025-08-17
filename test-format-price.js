// test-format-price.js - Prueba de la función formatPrice

// Simulando la función formatPrice corregida (precios base en MXN)
function formatPrice(price, currentCurrency = 'MXN') {
    console.log('Input price:', price, typeof price);
    
    const exchangeRates = {
        'MXN': 1,        // Moneda base - sin conversión
        'USD': 0.053,    // 1 peso = ~0.053 USD
        'EUR': 0.049     // 1 peso = ~0.049 EUR
    };
    
    const symbols = {
        'MXN': '$',
        'USD': '$',
        'EUR': '€'
    };
    
    const convertedPrice = (price * exchangeRates[currentCurrency]).toFixed(2);
    console.log('Converted price:', convertedPrice);
    
    const symbol = symbols[currentCurrency];
    console.log('Symbol:', symbol);
    
    const result = `${symbol}${convertedPrice}`;
    console.log('Final result:', result);
    
    return result;
}

// Probar con diferentes valores
console.log('=== PROBANDO formatPrice CORREGIDA ===');
console.log('Precio 599 MXN:', formatPrice(599, 'MXN'));
console.log('Precio 599 USD:', formatPrice(599, 'USD'));
console.log('Precio 599 EUR:', formatPrice(599, 'EUR'));
