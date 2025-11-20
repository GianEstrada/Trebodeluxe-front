/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores de fondo verde oscuro
        "dark-green-primary": "#0a2f0a",
        "dark-green-secondary": "#0d3d0d",
        "dark-green-tertiary": "#1a6b1a",
        "dark-green-accent": "#289c28",
        
        // Colores de texto con alto contraste
        "text-primary-light": "#ffffff",
        "text-secondary-light": "#e8e8e8",
        "text-tertiary-light": "#c8c8c8",
        
        // Overlays claros para fondos alternativos
        "overlay-light": "rgba(255, 255, 255, 0.95)",
        "overlay-medium": "rgba(255, 255, 255, 0.85)",
        "overlay-dark": "rgba(0, 0, 0, 0.7)",
        
        // Colores originales mantenidos para compatibilidad
        "Schemes-Surface": "#0a2f0a",
        "Schemes-Surface-Container": "#0d3d0d",
        "Schemes-On-Surface": "#ffffff",
        "Schemes-Outline": "#c8c8c8",
        "Icon-Neutral-On-Neutral": "#f3f3f3",
        "Background-Brand-Default": "#0a2f0a",
        "Slate-200": "#e8e8e8",
        "Border-Default-Default": "#289c28",
        "Text-Default-Tertiary": "#c8c8c8",
        "M3-white": "#fff",
        yellow: "#ffff00",
        olive: "#9e990c",
        gold: "#dcdc27",
        springgreen: "#00ff6a",
        gray: {
          100: "#c8c8c8",
          200: "rgba(255, 255, 255, 0.1)",
        },
        forestgreen: "#289c28",
        black: "#000",
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        expand: 'expand 0.4s ease-out forwards',
        contract: 'contract 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        expand: {
          '0%': { width: 'var(--initial-width)', maxWidth: 'var(--initial-width)' },
          '100%': { width: 'var(--expanded-width)', maxWidth: 'var(--expanded-width)' },
        },
        contract: {
          '0%': { width: 'var(--expanded-width)', maxWidth: 'var(--expanded-width)' },
          '100%': { width: 'var(--initial-width)', maxWidth: 'var(--initial-width)' },
        },
      },
      spacing: {
        "Space-400": "16px",
        "Space-200": "8px",
        "Space-600": "24px",
        "Space-300": "12px",
      },
      fontFamily: {
        "Static-Body-Large-Font": "Roboto",
        "Body-Font-Family": "Inter",
        salsa: "Salsa",
      },
      borderRadius: {
        "Radius-200": "8px",
      },
      borderWidth: {
        "Stroke-Border": "1px",
      },
    },
    fontSize: {
      "Static-Body-Large-Size": "16px",
      "Body-Size-Medium": "16px",
      "Body-Size-Small": "14px",
    },
    fontWeight: {
      "Body-Font-Weight-Regular": "400",
      "Body-Font-Weight-Strong": "600",
    },
    lineHeight: {
      "Static-Body-Large-Line-Height": "24px",
    },
    letterSpacing: {
      "Static-Body-Large-Tracking": "0.5px",
    },
  },
  corePlugins: {
    preflight: false,
  },
};
