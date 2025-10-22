import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/theme';

export default {
  important: true,
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // 最小字体栈：霞鹜文楷 + 系统回退
        sans: ['LXGW WenKai', 'system-ui', 'Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#007AFF',
          500: '#007AFF',
          600: '#0066D6',
        },
        accent: {
          cyan: '#22D3EE',
          purple: '#A78BFA',
          pink: '#F472B6',
        },
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      backgroundImage: {
        'radial-fade':
          'radial-gradient(1000px 600px at top right, rgba(99,102,241,0.15), transparent 60%), radial-gradient(800px 400px at 10% 20%, rgba(34,211,238,0.12), transparent 55%)',
        'gradient-brand': 'linear-gradient(90deg, #22D3EE 0%, #A78BFA 50%, #F472B6 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {},
        dark: {},
      },
    }),
  ],
} satisfies Config;
