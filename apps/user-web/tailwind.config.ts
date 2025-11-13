import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',
          green: '#22c55e'
        }
      }
    }
  },
  plugins: []
};

export default config;
