import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        // 最小字体栈：霞鹜文楷 + 系统回退
        sans: ['LXGW WenKai', 'system-ui', 'Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6A5AE0',
          500: '#6A5AE0',
          600: '#5a4acb',
        },
        accent: {
          cyan: '#22D3EE',
          purple: '#A78BFA',
          pink: '#F472B6',
        },
      },
      backgroundImage: {
        'radial-fade': 'radial-gradient(1000px 600px at top right, rgba(99,102,241,0.15), transparent 60%), radial-gradient(800px 400px at 10% 20%, rgba(34,211,238,0.12), transparent 55%)',
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
  plugins: [],
} satisfies Config;

