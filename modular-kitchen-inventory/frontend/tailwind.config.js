/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Luxury Gold Brand Palette
        brand: {
          50: '#faf6e7',
          100: '#f3ebc5',
          200: '#e7d78d',
          300: '#d9c054',
          400: '#cfae33',
          500: '#c5a059', // Primary Gold
          600: '#b38e47', // Hover Gold
          700: '#8c6c2e',
          800: '#664e1f',
          900: '#423212',
          950: '#221905',
        },
        // Premium Forest Green Palette
        forest: {
          50: '#f1f6f3',
          100: '#dceae2',
          200: '#b9d5c6',
          300: '#8bbaa2',
          400: '#5a9877',
          500: '#3d7c5a',
          600: '#2e6246',
          700: '#244f38',
          800: '#1d3f2d',
          900: '#0b2316', // Dark Green Panels
          950: '#05160e', // Obsidian Canvas Green
        },
        // Warm Wood Craftsman Palette
        wood: {
          50: '#faf8f5',
          100: '#f4ece3',
          200: '#e9dac4',
          300: '#dac09d',
          400: '#c9a374',
          500: '#b78752', // Warm Walnut / Oak
          600: '#a57243',
          700: '#895a32',
          800: '#6e4727',
          900: '#55371f',
          950: '#342011',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'premium': '0 4px 20px -2px rgba(197, 160, 89, 0.1), 0 2px 8px -1px rgba(197, 160, 89, 0.05)',
        'premium-dark': '0 4px 24px -2px rgba(0, 0, 0, 0.6), 0 4px 12px -1px rgba(197, 160, 89, 0.15)',
        'glass': '0 8px 32px 0 rgba(11, 35, 22, 0.05)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' }
        }
      },
      animation: {
        'slide-in': 'slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'zoom-in': 'zoom-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'shake': 'shake 0.4s ease-in-out'
      }
    },
  },
  plugins: [],
}
