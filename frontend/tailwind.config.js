/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:         '#11245d',
          'dark-light': '#172d74',
          green:        '#0a1844',
          gold:         '#5ce1e6',
          'gold-dark':  '#d4af37',
          'gold-light': '#f0c040',
          blue:         '#5ce1e6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
