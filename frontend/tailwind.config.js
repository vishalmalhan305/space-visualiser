/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: { bg: '#0a0e1a', navy: '#111827', accent: '#3b82f6', amber: '#f59e0b' }
      }
    }
  },
  plugins: []
}