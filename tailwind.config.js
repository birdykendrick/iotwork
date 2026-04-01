/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['DM Mono', 'JetBrains Mono', 'ui-monospace', 'monospace'],
        mono:    ['JetBrains Mono', 'DM Mono', 'ui-monospace', 'monospace'],
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand: muted teal-green — pharma-appropriate, regulated feel
        brand: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',   // primary action
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#042f2e',
        },
        // Surface: light slate — NOT white, regulated/clinical
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',   // page bg
          100: '#f1f5f9',   // sidebar bg
          200: '#e2e8f0',   // card border, dividers
          300: '#cbd5e1',   // stronger border
          400: '#94a3b8',   // muted text
          500: '#64748b',   // secondary text
          600: '#475569',   // body text
          700: '#334155',   // emphasis text
          800: '#1e293b',   // headings
          900: '#0f172a',   // rarely used dark
        },
      },
      boxShadow: {
        card:   '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
