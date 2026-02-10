/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d'
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce'
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb'
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c'
        }
      },
      width: {
        '280': '280px'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-down': 'slideDown 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideDown: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'auto', opacity: '1' }
        },
        slideUp: {
          '0%': { height: 'auto', opacity: '1' },
          '100%': { height: '0', opacity: '0' }
        }
      }
    }
  },
  plugins: []
}
