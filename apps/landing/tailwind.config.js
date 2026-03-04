/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Liquid Glass pearl-white palette ── */
        pearl: 'rgb(250, 250, 252)',
        glass: {
          surface: 'rgba(255, 255, 255, 0.72)',
          elevated: 'rgba(255, 255, 255, 0.82)',
          border: 'rgba(203, 213, 225, 0.60)',
        },
        glow: {
          blue: '#93C5FD',
          purple: '#C4B5FD',
          pink: '#F9A8D4',
          green: '#86EFAC',
        },
        /* ── Keep legacy emerald for accent usage ── */
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        glass: '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        'glass-lg': '0 8px 30px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        'glass-xl': '0 20px 40px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)',
      },
      backdropBlur: {
        glass: '20px',
        'glass-heavy': '24px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite alternate',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
