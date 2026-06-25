/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '480px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },

    extend: {
      fontFamily: {
        'open-sans': 'Open Sans',
        'poppins': 'Poppins'
      },

      colors: {
        'mapua-blue': '#172851',
        'mapua-red': '#e9242a',
        'sidebar-hover': '#0f1b37',
        'facebook': '#3b5999',
        'twitter': '#55acee',
        'ig-yellow': '#feda75',
        'ig-pink': '#d62976',
        'ig-purple': '#962fbf',
        'new-red': '#EA4228',
        'new-orange': '#FFA500',
        'new-yellow': '#FDDA0D',
        'new-yellow-green': '#9ACD32',
        'new-green': '#4CBB17',
      },

      transitionProperty: {
        'width': 'width'
      }
    },
  },
  plugins: [],
}