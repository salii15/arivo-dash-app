/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#D9FFF2',   // En açık pastel mint
          100: '#d7fbee',  // Çok açık pastel mint
          200: '#c3f8e7', 
          300: '#7ff3c6',  // Lighter mint
          400: '#5ff1b6',  // Light mint
          500: '#39efac',  // Base mint
          600: '#1be79e',  // Darker mint
          700: '#14d994',  // Darker mint
          800: '#0dd18b',  // Darker mint
          900: '#07c983',  // Darker mint
        },
        secondary: {
          300: '#d4d4d4',  // Light gray
          400: '#a3a3a3',  // Gray
          500: '#737373',  // Base gray
          600: '#525252',  // Dark gray
          700: '#404040',  // Darker gray
          800: '#262626',  // Very dark gray
          900: '#171717',  // Almost black
        },
        lavender: {
          50: '#F5F0FE',   // En açık lavender
          100: '#EBE2FD',  // Çok açık lavender
          200: '#DFD0FC',  // Açık lavender
          300: '#D0B8FA',  // Light lavender
          400: '#C4AAF8',  // Light-medium lavender
          500: '#B79CED',  // Base lavender (#B79CED)
          600: '#A185E5',  // Medium-dark lavender
          700: '#8B6EDD',  // Dark lavender
          800: '#7557D5',  // Darker lavender
          900: '#5F40CD',  // En koyu lavender
        },
        dark: '#0a0a0a',
        'dark-light': '#171717',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [{
      dark: {
        ...require("daisyui/src/theming/themes")["dark"],
        primary: '#00FFA2',
        secondary: '#737373',
        "base-100": "#404040",
        "base-200": "#333333",
        "base-300": "#262626",
        "base-400": "#1a1a1a",
        "base-500": "#0f0f0f",
        "neutral": "#171717",
      },
    }],
    darkTheme: "dark",
  },
}
