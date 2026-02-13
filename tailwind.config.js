/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 深色主题配色
        dark: {
          50: '#f0f6fc',
          100: '#c9d1d9',
          200: '#b1bac4',
          300: '#8b949e',
          400: '#6e7681',
          500: '#484f58',
          600: '#30363d',
          700: '#21262d',
          800: '#161b22',
          900: '#0d1117',
          950: '#010409',
        },
        accent: {
          blue: '#58a6ff',
          purple: '#bc8cff',
          pink: '#f778ba',
          green: '#3fb950',
          orange: '#d29922',
          red: '#f85149',
          cyan: '#39d2c0',
        },
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 3.5s steps(30, end), blink-caret 0.75s step-end infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'typing': {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: '#58a6ff' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.12)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.15), 0 16px 32px rgba(0,0,0,0.15)',
        'glow': '0 0 20px rgba(88, 166, 255, 0.3)',
        'glow-purple': '0 0 20px rgba(188, 140, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
