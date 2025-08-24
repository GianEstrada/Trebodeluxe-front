import { useState, useEffect } from 'react';

// Interfaz para las tasas de cambio
interface ExchangeRates {
  [key: string]: number;
}

// Configuración del servicio
const OPEN_EXCHANGE_RATES_APP_ID = '8423d770aba146d79f310b600a96c86b';
const BASE_URL = 'https://openexchangerates.org/api';

// Monedas soportadas
const SUPPORTED_CURRENCIES = ['USD', 'MXN', 'EUR'];

// Símbolos de moneda
const CURRENCY_SYMBOLS: { [key: string]: string } = {
  'MXN': '$',
  'USD': '$',
  'EUR': '€'
};

export const useExchangeRates = () => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    'USD': 1,      // USD como base en Open Exchange Rates
    'MXN': 20.5,   // Fallback rate
    'EUR': 0.92    // Fallback rate
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Función para obtener tasas de cambio desde Open Exchange Rates
  const fetchExchangeRates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Obteniendo tasas de cambio desde Open Exchange Rates...');
      
      const response = await fetch(`${BASE_URL}/latest.json?app_id=${OPEN_EXCHANGE_RATES_APP_ID}&symbols=${SUPPORTED_CURRENCIES.join(',')}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Respuesta de Open Exchange Rates:', data);
      
      if (data.rates) {
        setExchangeRates(data.rates);
        setLastUpdated(new Date());
        
        // Guardar en localStorage para uso offline
        localStorage.setItem('exchange-rates', JSON.stringify({
          rates: data.rates,
          timestamp: new Date().toISOString()
        }));
        
        console.log('✅ Tasas de cambio actualizadas:', data.rates);
      }
    } catch (err) {
      console.error('❌ Error obteniendo tasas de cambio:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Intentar cargar desde localStorage como fallback
      const cachedData = localStorage.getItem('exchange-rates');
      if (cachedData) {
        try {
          const { rates, timestamp } = JSON.parse(cachedData);
          const cacheAge = new Date().getTime() - new Date(timestamp).getTime();
          
          // Si el cache es menor a 1 hora, usarlo
          if (cacheAge < 3600000) {
            setExchangeRates(rates);
            setLastUpdated(new Date(timestamp));
            console.log('⚠️ Usando tasas de cambio desde cache');
          }
        } catch (cacheError) {
          console.error('Error leyendo cache:', cacheError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear precio con conversión
  const formatPrice = (price: number | string | null | undefined, targetCurrency: string = 'MXN', baseCurrency: string = 'MXN') => {
    // Convertir el precio a número de manera segura
    let numericPrice: number;
    
    if (typeof price === 'string') {
      numericPrice = parseFloat(price);
    } else if (typeof price === 'number') {
      numericPrice = price;
    } else {
      numericPrice = 0;
    }
    
    // Validar que sea un número válido y mayor que 0
    if (!numericPrice || isNaN(numericPrice) || numericPrice <= 0) {
      return `${CURRENCY_SYMBOLS[targetCurrency] || '$'}0.00`;
    }
    
    let convertedPrice: number;
    
    if (baseCurrency === targetCurrency) {
      // Sin conversión necesaria
      convertedPrice = numericPrice;
    } else {
      // Convertir desde la moneda base a USD (base de Open Exchange Rates)
      let priceInUSD: number;
      if (baseCurrency === 'USD') {
        priceInUSD = numericPrice;
      } else {
        const baseRate = exchangeRates[baseCurrency] || 1;
        priceInUSD = numericPrice / baseRate;
      }
      
      // Convertir de USD a la moneda objetivo
      if (targetCurrency === 'USD') {
        convertedPrice = priceInUSD;
      } else {
        const targetRate = exchangeRates[targetCurrency] || 1;
        convertedPrice = priceInUSD * targetRate;
      }
    }
    
    // Validar que convertedPrice sea un número válido antes de usar toFixed
    if (isNaN(convertedPrice) || !isFinite(convertedPrice)) {
      return `${CURRENCY_SYMBOLS[targetCurrency] || '$'}0.00`;
    }
    
    const formattedPrice = convertedPrice.toFixed(2);
    const symbol = CURRENCY_SYMBOLS[targetCurrency] || '$';
    
    return `${symbol}${formattedPrice}`;
  };

  // Obtener tasa de conversión específica
  const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return 1;
    
    if (fromCurrency === 'USD') {
      return exchangeRates[toCurrency] || 1;
    } else if (toCurrency === 'USD') {
      return 1 / (exchangeRates[fromCurrency] || 1);
    } else {
      // Conversión a través de USD
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[toCurrency] || 1;
      return toRate / fromRate;
    }
  };

  // Cargar tasas al montar el componente
  useEffect(() => {
    // Cargar desde cache primero
    const cachedData = localStorage.getItem('exchange-rates');
    if (cachedData) {
      try {
        const { rates, timestamp } = JSON.parse(cachedData);
        const cacheAge = new Date().getTime() - new Date(timestamp).getTime();
        
        // Si el cache es menor a 1 hora, usarlo temporalmente
        if (cacheAge < 3600000) {
          setExchangeRates(rates);
          setLastUpdated(new Date(timestamp));
        }
      } catch (error) {
        console.error('Error leyendo cache inicial:', error);
      }
    }
    
    // Obtener tasas actualizadas
    fetchExchangeRates();
  }, []);

  // Función para forzar actualización
  const refreshRates = () => {
    fetchExchangeRates();
  };

  return {
    exchangeRates,
    loading,
    error,
    lastUpdated,
    formatPrice,
    getExchangeRate,
    refreshRates,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    currencySymbols: CURRENCY_SYMBOLS
  };
};

export default useExchangeRates;
