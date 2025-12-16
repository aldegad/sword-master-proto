/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
        secondary: {
          DEFAULT: '#64748b',
          hover: '#475569',
        },
        bg: {
          DEFAULT: '#0f172a',
          card: '#1e293b',
          'card-hover': '#334155',
        },
        border: '#334155',
      },
      animation: {
        'spin-slow': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};

