import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        elderly: {
          bg: "#0B1320",
          card: "#162238",
          text: "#FFFFFF",
          accent: "#FBBF24",
          success: "#34D399",
          alert: "#F87171"
        },
        kid: {
          bg: "#FEF9C3",
          card: "#FFFFFF",
          primary: "#F97316",
          secondary: "#8B5CF6",
          accent: "#06B6D4"
        }
      },
    },
  },
  plugins: [],
};
export default config;
