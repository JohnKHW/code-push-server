import { type Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#87CEEB',
          50: '#EAF7FE',
          100: '#D5EEFD',
          200: '#ABE0FB',
          300: '#81D2F9',
          400: '#57C4F7',
          500: '#2DB6F5',
          600: '#1C95CD',
          700: '#15729C',
          800: '#0D4E6A',
          900: '#062B39',
        },
      },
    },
  },
} satisfies Config;