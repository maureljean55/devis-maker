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
        gold: "#B8892A",
        "app-bg": "#1a1a1a",
        "app-noir": "#0f0f0f",
        "app-panel": "#232323",
        "app-border": "#2e2e2e",
        "app-text": "#e8e8e8",
        "app-muted": "#888888",
        "app-input": "#2a2a2a",
      },
      fontFamily: {
        montserrat: ["var(--font-montserrat)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
