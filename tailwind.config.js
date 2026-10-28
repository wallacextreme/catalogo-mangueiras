/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        counter: {
          bg: '#f8fafc',
          card: '#ffffff',
          darkBg: '#0f172a',
          darkCard: '#1e293b',
          blue: '#1d4ed8',     // Royal Blue Balcão
          amber: '#d97706',    // Âmbar Industrial
          emerald: '#059669',  // Verde Esmeralda Estoque
          border: '#e2e8f0',
          darkBorder: '#334155',
          text: '#0f172a',
          darkText: '#f8fafc',
          muted: '#64748b',
          darkMuted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['Open Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
