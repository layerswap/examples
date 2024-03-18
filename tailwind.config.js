/** @type {import('tailwindcss').Config} */

const colors = require("tailwindcss/colors");

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--ls-colors-primary, 228, 37, 117), <alpha-value>)',
          '50': 'rgb(var(--ls-colors-primary-50, 248, 200, 220), <alpha-value>)',
          '100': 'rgb(var(--ls-colors-primary-100, 246, 182, 209), <alpha-value>)',
          '200': 'rgb(var(--ls-colors-primary-200, 241, 146, 186), <alpha-value>)',
          '300': 'rgb(var(--ls-colors-primary-300, 237, 110, 163), <alpha-value>)',
          '400': 'rgb(var(--ls-colors-primary-400, 232, 73, 140), <alpha-value>)',
          '500': 'rgb(var(--ls-colors-primary-500, 228, 37, 117), <alpha-value>)',
          '600': 'rgb(var(--ls-colors-primary-600, 166, 51, 94), <alpha-value>)',
          '700': 'rgb(var(--ls-colors-primary-700, 136, 17, 67), <alpha-value>)',
          '800': 'rgb(var(--ls-colors-primary-800, 147, 8, 99), <alpha-value>)',
          '900': 'rgb(var(--ls-colors-primary-900, 110, 0, 64), <alpha-value>)',
          'background': 'rgb(var(--ls-colors-backdrop, 62, 18, 64), <alpha-value>)',
          'text': 'rgb(var(--ls-colors-primary-text, 255, 255, 255), <alpha-value>)',
          'text-muted': 'rgb(var(--ls-colors-primary-text-muted, 86, 97, 123), <alpha-value>)',
          'text-placeholder': 'rgb(var(--ls-colors-text-placeholder, 140, 152, 192), <alpha-value>)',
          'actionButtonText': 'rgb(var(--ls-colors-actionButtonText, 255, 255, 255), <alpha-value>)',
          'buttonTextColor': 'rgb(var(--ls-colors-buttonTextColor, 228, 229, 240), <alpha-value>)',
          'logoColor': 'rgb(var(--ls-colors-logo, 255, 0, 147), <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--ls-colors-secondary, 17, 29, 54), <alpha-value>)',
          '50': 'rgb(var(--ls-colors-secondary-50, 49, 60, 155), <alpha-value>)',
          '100': 'rgb(var(--ls-colors-secondary-100, 46, 59, 147), <alpha-value>)',
          '200': 'rgb(var(--ls-colors-secondary-200, 35, 42, 112), <alpha-value>)',
          '300': 'rgb(var(--ls-colors-secondary-300, 32, 41, 101), <alpha-value>)',
          '400': 'rgb(var(--ls-colors-secondary-400, 28, 39, 89), <alpha-value>)',
          '500': 'rgb(var(--ls-colors-secondary-500, 22, 37, 70), <alpha-value>)',
          '600': 'rgb(var(--ls-colors-secondary-600, 20, 33, 62), <alpha-value>)',
          '700': 'rgb(var(--ls-colors-secondary-700, 17, 29, 54), <alpha-value>)',
          '800': 'rgb(var(--ls-colors-secondary-800, 15, 25, 47), <alpha-value>)',
          '900': 'rgb(var(--ls-colors-secondary-900, 12, 21, 39), <alpha-value>)',
          '950': 'rgb(var(--ls-colors-secondary-900, 11, 17, 35), <alpha-value>)',
          'text': 'rgb(var(--ls-colors-secondary-text, 171, 181, 209), <alpha-value>)',
        },
      }
    },
  },
  plugins: [],
}

