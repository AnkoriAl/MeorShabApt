/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#e7f2ff',
          700: '#c8d9ff', 
          500: '#a6b8dd',
        },
        accent: {
          500: '#5bd5ff',
          600: '#36c6ff',
          700: '#14b5ff',
        },
        success: {
          500: '#22c55e',
        },
        warning: {
          500: '#f59e0b',
        },
        danger: {
          500: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
