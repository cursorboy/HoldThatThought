/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        void: '#0A0C10',
        'deep-space': '#12151C',
        nebula: '#1A1F2A',
        signal: '#00FFB2',
        'signal-dim': '#00CC8E',
        warn: '#FFB800',
        alert: '#FF6B6B',
        ghost: '#B8C0CC',
        muted: '#6B7280',
        border: '#2A3140',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
