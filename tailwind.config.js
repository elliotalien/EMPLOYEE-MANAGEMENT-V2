/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./views/include/**/*.ejs",
    "./public/**/*.{js,css}",
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        primaryBtn: "#4318FF",
        primaryText: "#2B3674",
        tablebtn: "#EBEFF8",
        borderColor: "#D3D8E2",
      },
      screens: {
        "min-490": { min: "490px" },
        "min-530": { min: "530px" },
        "min-700": { min: "700px" },
        "min-800": { min: "800px" },
        "min-860": { min: "860px" },
        "min-961": { min: "961px" },
        "min-1150": { min: "1150px" },
        "min-1165": { min: "1165px" },
        "min-1277": { min: "1277px" },
        "max-500": { max: "500px" },
        "max-830": { max: "830px" },
        "max-1000": { max: "1000px" },
        "max-1080": { max: "1080px" },
        "max-1200": { max: "1200px" },
      },
    },
  },
  plugins: [],
};
