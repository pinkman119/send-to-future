/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          50: '#E6F6FE', 100: '#C8EBFD', 200: '#92DBFB', 300: '#5CCBF9',
          400: '#26BBF7', 500: '#009EF7', 600: '#0095E8', 700: '#0082CC',
          800: '#006BA8', 900: '#004B75',
        },
        surface: { DEFAULT: '#FFFFFF', dark: '#252A3A', darker: '#1A1F2E' },
        canvas: { DEFAULT: '#F4F4F6', dark: '#1E1E2D' },
        ink: { DEFAULT: '#181C32', muted: '#7E8299', dark: '#FFFFFF', darkMuted: '#9CA3B5' },
        line: { DEFAULT: '#EFF2F5', dark: '#2E3045' },
        success: { DEFAULT: '#50CD89', light: '#E8FFF3', dark: '#1BC5BD' },
        warning: { DEFAULT: '#FFA800', light: '#FFF8DD', dark: '#FFC700' },
        danger: { DEFAULT: '#F1416C', light: '#FFF5F8', dark: '#F2416C' },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'card-dark': '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
        dropdown: '0 12px 40px rgba(0,0,0,0.12)',
        glow: '0 12px 40px rgba(0,158,247,0.35)',
      },
    },
  },
  plugins: [],
}
