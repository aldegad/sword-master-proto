/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 모던한 블루 계열 색상 팔레트
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          light: '#DBEAFE',
          dark: '#1D4ED8',
        },
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
        },
        // 더 깔끔한 다크 테마
        bg: {
          DEFAULT: '#0F172A',
          card: '#1E293B',
          'card-hover': '#334155',
          sidebar: '#0F172A',
        },
        border: '#334155',
        // 텍스트 색상
        text: {
          DEFAULT: '#F8FAFC',
          muted: '#94A3B8',
          subtle: '#64748B',
        },
        // 상태 색상
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'spin-slow': 'spin 1s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
