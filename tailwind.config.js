/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "Schemes-Surface": "#fef7ff",
        "Schemes-Surface-Container": "#f3edf7",
        "Schemes-On-Surface": "#1d1b20",
        "Schemes-Outline": "#79747e",
        "Icon-Neutral-On-Neutral": "#f3f3f3",
        "Background-Brand-Default": "#2c2c2c",
        "Slate-200": "#e3e3e3",
        "Border-Default-Default": "#d9d9d9",
        "Text-Default-Tertiary": "#b3b3b3",
        "M3-white": "#fff",
        yellow: "#ffff00",
        olive: "#9e990c",
        gold: "#dcdc27",
        springgreen: "#00ff6a",
        gray: {
          100: "#787878",
          200: "rgba(0, 0, 0, 0)",
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
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
