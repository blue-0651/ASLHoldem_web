/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ASL 커스텀 색상 정의
        'asl-bg': '#FDF5E6',
        'asl-header-bg': '#fef8ed',
        'asl-border': '#333333',
        'asl-text': '#333333',
        'asl-button': '#007bff',
        'asl-footer-bg': '#f0ead6',
        'asl-footer-border': '#e0d5c0',
        'asl-company-text': '#5d4e37',
        'asl-info-text': '#6b5b47',
        'asl-copyright-text': '#8b7d6b',
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      height: {
        '225': '225px',  // 매장 갤러리 높이
        '180': '180px',  // 모바일 매장 갤러리 높이
        '150': '150px',  // 작은 화면 매장 갤러리 높이
      },
      screens: {
        'xs': '480px',  // 추가 브레이크포인트
      },
      textShadow: {
        'sm': '1px 1px 2px rgba(0, 0, 0, 0.5)',
        'DEFAULT': '2px 2px 4px rgba(0, 0, 0, 0.5)',
        'lg': '4px 4px 8px rgba(0, 0, 0, 0.5)',
        'strong': '2px 2px 4px rgba(0, 0, 0, 0.9)',
        'light': '1px 1px 3px rgba(0, 0, 0, 0.8)',
      },
      transitionDuration: {
        '600': '600ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [
    // text-shadow 플러그인 추가
    function({ addUtilities }) {
      const textShadows = {
        '.text-shadow-sm': {
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow': {
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-strong': {
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
        },
        '.text-shadow-light': {
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
      }
      addUtilities(textShadows);
    }
  ],
} 