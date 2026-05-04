/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        primary: '#7000FF',
        accent: '#00CFFF',
        success: '#00FF94',
        danger: '#FF3B6F',
        surface: '#13131f',
        border: '#2a2a3f',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        ui: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
