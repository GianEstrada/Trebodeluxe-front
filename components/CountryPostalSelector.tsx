import React, { useState, useRef, useEffect } from 'react';

// Países soportados por el sistema de envío internacional
interface Country {
  code: string;
  name: string;
  flag: string;
  postalCodeFormat: string;
  postalCodeLength: number[];
  example: string;
}

export const supportedCountries: Country[] = [
  // México (default)
  {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    postalCodeFormat: '5 dígitos',
    postalCodeLength: [5],
    example: '64000'
  },
  // Estados Unidos
  {
    code: 'US',
    name: 'Estados Unidos',
    flag: '🇺🇸',
    postalCodeFormat: '5 dígitos',
    postalCodeLength: [5],
    example: '90210'
  },
  // Canadá
  {
    code: 'CA',
    name: 'Canadá',
    flag: '🇨🇦',
    postalCodeFormat: 'A1A 1A1',
    postalCodeLength: [6, 7],
    example: 'M5V 3L9'
  },
  // Reino Unido
  {
    code: 'GB',
    name: 'Reino Unido',
    flag: '🇬🇧',
    postalCodeFormat: 'AA1A 1AA',
    postalCodeLength: [6, 7, 8],
    example: 'SW1A 1AA'
  },
  // Francia
  {
    code: 'FR',
    name: 'Francia',
    flag: '🇫🇷',
    postalCodeFormat: '5 dígitos',
    postalCodeLength: [5],
    example: '75001'
  },
  // Alemania
  {
    code: 'DE',
    name: 'Alemania',
    flag: '🇩🇪',
    postalCodeFormat: '5 dígitos',
    postalCodeLength: [5],
    example: '10115'
  },
  // España
  {
    code: 'ES',
    name: 'España',
    flag: '🇪🇸',
    postalCodeFormat: '5 dígitos',
    postalCodeLength: [5],
    example: '28001'
  },
  // Italia
  {
    code: 'IT',
    name: 'Italia',
    flag: '🇮🇹',
    postalCodeFormat: '5 dígitos',
    postalCodeLength: [5],
    example: '00118'
  },
  // Australia
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    postalCodeFormat: '4 dígitos',
    postalCodeLength: [4],
    example: '2000'
  },
  // Japón
  {
    code: 'JP',
    name: 'Japón',
    flag: '🇯🇵',
    postalCodeFormat: '7 dígitos',
    postalCodeLength: [7],
    example: '1000001'
  },
  // Brasil
  {
    code: 'BR',
    name: 'Brasil',
    flag: '🇧🇷',
    postalCodeFormat: '8 dígitos',
    postalCodeLength: [8],
    example: '01310100'
  },
  // Argentina
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    postalCodeFormat: '4 dígitos',
    postalCodeLength: [4],
    example: '1010'
  },
  // Corea del Sur
  {
    code: 'KR',
    name: 'Corea del Sur',
    flag: '🇰🇷',
    postalCodeFormat: '5 dígitos',
    postalCodeLength: [5],
    example: '03722'
  },
  // Países Bajos
  {
    code: 'NL',
    name: 'Países Bajos',
    flag: '🇳🇱',
    postalCodeFormat: '4 dígitos + 2 letras',
    postalCodeLength: [6],
    example: '1012 JS'
  },
  // Suiza
  {
    code: 'CH',
    name: 'Suiza',
    flag: '🇨🇭',
    postalCodeFormat: '4 dígitos',
    postalCodeLength: [4],
    example: '8001'
  },
  // Suecia
  {
    code: 'SE',
    name: 'Suecia',
    flag: '🇸🇪',
    postalCodeFormat: '5 dígitos',
    postalCodeLength: [5],
    example: '11122'
  }
];

interface CountryPostalSelectorProps {
  selectedCountry: string;
  postalCode: string;
  onCountryChange: (countryCode: string) => void;
  onPostalCodeChange: (postalCode: string) => void;
  onCalculateShipping: () => void;
  isLoading: boolean;
  error: string;
  disabled?: boolean;
  className?: string;
}

export const CountryPostalSelector: React.FC<CountryPostalSelectorProps> = ({
  selectedCountry,
  postalCode,
  onCountryChange,
  onPostalCodeChange,
  onCalculateShipping,
  isLoading,
  error,
  disabled = false,
  className = ''
}) => {
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCountry = supportedCountries.find(c => c.code === selectedCountry) || supportedCountries[0];

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validar formato del código postal según el país
  const isValidPostalCode = (code: string, country: Country): boolean => {
    if (!code.trim()) return false;
    
    // Para países con formato alfanumérico (Reino Unido, Canadá)
    if (country.code === 'GB' || country.code === 'CA') {
      return country.postalCodeLength.includes(code.replace(/\s+/g, '').length);
    }
    
    // Para países que solo usan números
    if (['MX', 'US', 'FR', 'DE', 'ES', 'IT', 'AU', 'JP', 'BR', 'AR', 'KR', 'CH', 'SE'].includes(country.code)) {
      const numericCode = code.replace(/\D/g, '');
      return country.postalCodeLength.includes(numericCode.length);
    }
    
    // Para Países Bajos (números + letras específico)
    if (country.code === 'NL') {
      const cleanCode = code.replace(/\s+/g, '');
      return /^\d{4}[A-Z]{2}$/i.test(cleanCode);
    }
    
    return false;
  };

  // Formatear input según el país
  const formatPostalCode = (value: string, country: Country): string => {
    let cleanValue = value.replace(/\s+/g, '');
    
    switch (country.code) {
      case 'MX':
      case 'US':
      case 'FR':
      case 'DE':
      case 'ES':
      case 'IT':
      case 'KR':
        // Solo números
        return cleanValue.replace(/\D/g, '').slice(0, Math.max(...country.postalCodeLength));
        
      case 'AU':
      case 'CH':
      case 'AR':
        // Solo números, longitud específica
        return cleanValue.replace(/\D/g, '').slice(0, Math.max(...country.postalCodeLength));
        
      case 'JP':
      case 'BR':
        // Solo números, longitud específica
        return cleanValue.replace(/\D/g, '').slice(0, Math.max(...country.postalCodeLength));
        
      case 'SE':
        // Solo números, 5 dígitos
        return cleanValue.replace(/\D/g, '').slice(0, 5);
        
      case 'CA':
        // Formato A1A 1A1
        cleanValue = cleanValue.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleanValue.length > 3) {
          return `${cleanValue.slice(0, 3)} ${cleanValue.slice(3, 6)}`;
        }
        return cleanValue.slice(0, 6);
        
      case 'GB':
        // Formato libre para Reino Unido
        return cleanValue.toUpperCase().slice(0, 8);
        
      case 'NL':
        // Formato 1234 AB
        cleanValue = cleanValue.toUpperCase();
        const numbers = cleanValue.replace(/[^0-9]/g, '').slice(0, 4);
        const letters = cleanValue.replace(/[^A-Z]/g, '').slice(0, 2);
        if (numbers.length === 4 && letters.length > 0) {
          return `${numbers} ${letters}`;
        }
        return numbers + letters;
        
      default:
        return cleanValue.slice(0, 10);
    }
  };

  const handleCountrySelect = (country: Country) => {
    onCountryChange(country.code);
    onPostalCodeChange(''); // Limpiar código postal al cambiar país
    setShowCountryDropdown(false);
  };

  const handlePostalCodeInput = (value: string) => {
    const formatted = formatPostalCode(value, currentCountry);
    onPostalCodeChange(formatted);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidPostalCode(postalCode, currentCountry)) {
      onCalculateShipping();
    }
  };

  const isValid = isValidPostalCode(postalCode, currentCountry);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selector de País */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-white text-sm font-medium mb-2">
          País de destino
        </label>
        <button
          type="button"
          onClick={() => !disabled && setShowCountryDropdown(!showCountryDropdown)}
          disabled={disabled}
          className="w-full bg-black/50 border border-white/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none transition-colors flex items-center justify-between disabled:opacity-50"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{currentCountry.flag}</span>
            <div className="text-left">
              <div className="font-medium">{currentCountry.name}</div>
              <div className="text-xs text-gray-400">{currentCountry.postalCodeFormat}</div>
            </div>
          </div>
          <svg className={`h-4 w-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showCountryDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-white/30 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {supportedCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-3 border-b border-white/10 last:border-b-0"
              >
                <span className="text-xl">{country.flag}</span>
                <div className="flex-1">
                  <div className="text-white font-medium">{country.name}</div>
                  <div className="text-xs text-gray-400">{country.postalCodeFormat}</div>
                </div>
                {country.code === selectedCountry && (
                  <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input de Código Postal */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Código postal
        </label>
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={postalCode}
              onChange={(e) => handlePostalCodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ejemplo: ${currentCountry.example}`}
              disabled={disabled}
              className={`w-full bg-black/50 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors disabled:opacity-50 ${
                error 
                  ? 'border-red-500 focus:border-red-400' 
                  : isValid 
                    ? 'border-green-500 focus:border-green-400'
                    : 'border-white/30 focus:border-blue-400'
              }`}
            />
            {postalCode && (
              <div className="mt-1 text-xs flex items-center">
                {isValid ? (
                  <span className="text-green-400 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Formato válido
                  </span>
                ) : (
                  <span className="text-orange-400 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Formato: {currentCountry.postalCodeFormat}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onCalculateShipping}
            disabled={disabled || isLoading || !isValid}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculando...
              </>
            ) : (
              'Calcular'
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};
