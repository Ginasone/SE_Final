import type { Config } from "tailwindcss";
const {fontFamily} = require("tailwindcss/defaultTheme")

export default {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#038C7F",
        secondary: "#038C7F",
        tertiary: {
          dark: "#F27405",
          light: "#F2C641",
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', ...fontFamily.sans]
      }
    },
  },
  plugins: [],
} satisfies Config;
