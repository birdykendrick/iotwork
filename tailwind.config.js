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
        mono: ['JetBrains Mono', 'DM Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        700: '700',
      },
      colors: {
        brand: {
          300: '#4ade80',
          400: '#26a269',
          500: '#1d8a55',
          600: '#166534',
          700: '#14532d',
        },
        surface: {
          300: '#64748b',
          400: '#3d5068',
          500: '#253245',
          600: '#1c2738',
          700: '#151e2e',
          800: '#101828',
          900: '#0c1220',
        },
      },
    },
  },
  plugins: [],
}
