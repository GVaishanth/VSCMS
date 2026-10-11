/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F6F8',
        surface: '#FFFFFF',
        line: { DEFAULT: '#D8E0E7', soft: '#E8EDF2', strong: '#C3CEDA' },
        ink: { DEFAULT: '#17212B', muted: '#64748B', faint: '#94A3B8' },
        navy: { DEFAULT: '#0E2433', soft: '#17384A', line: '#23455C', hover: '#1B3B4A' },
        accent: { DEFAULT: '#F28C28', deep: '#D9741A', soft: '#FDF1E3' },
        brand: { DEFAULT: '#2563EB', deep: '#1D4ED8', soft: '#EAF1FE' },
        success: { DEFAULT: '#16803C', soft: '#E9F5ED' },
        warning: { DEFAULT: '#B7791F', soft: '#FBF3E2' },
        danger: { DEFAULT: '#C53030', soft: '#FBECEC' },
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        input: '6px',
        dialog: '8px',
        table: '6px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '14px'],
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        lg: ['15px', '22px'],
        xl: ['18px', '24px'],
        '2xl': ['22px', '28px'],
        '3xl': ['28px', '34px'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(14, 36, 51, 0.04)',
        pop: '0 8px 24px rgba(14, 36, 51, 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          from: { transform: 'translateX(12px)', opacity: '0.6' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 140ms ease-out',
        'slide-up': 'slide-up 160ms ease-out',
        'slide-left': 'slide-left 180ms ease-out',
      },
    },
  },
  plugins: [],
};
