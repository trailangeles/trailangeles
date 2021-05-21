module.exports = {
  purge: {
    mode: "all",
    content: ["./**/*.html"],
    options: {
      whitelist: [],
    },
  },
  theme: {
    colors: {
      black: '#000',
      gray: {
        900: '#1F2021'
      },
      green: {
        300: '#92B99D',
        400: '#59966D',
        500: '#74A882',
        600: '#6AA078',
        700: '#3A724F',
        800: '#04472B',
        900: '#02502F'
      },
      yellow: {
        50: '#E4FFAD', // nav highlight
        200: '#FFE67B', // button
        500: '#E27B38' // ticker, button
      },
      white: '#fff'
    },
    container: {
      center: true,
    },
    fontFamily: {
      'sans': ['Catamaran', 'sans-serif']
    },
    extend: {
      colors: {},
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/typography")],
};
