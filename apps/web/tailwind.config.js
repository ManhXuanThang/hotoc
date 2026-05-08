/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#F5F0E8',
        ink: '#1C1A17',
        teal: '#0F6E56',
        gold: '#C8960C',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
    },
  },
  plugins: [],
}
