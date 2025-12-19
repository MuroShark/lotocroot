import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./widgets/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./entities/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        lubrifont: ['var(--font-wdxl-lubrifont)'], // Прямое указание имени шрифта
      },
      keyframes: {
        'pulse-shadow': {
          '0%, 100%': { content: '""', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
          '50%': { content: '""', boxShadow: '0 0 0 6px rgba(59, 130, 246, 0)' },
        },
      },
      animation: {
        // Добавляем кастомную анимацию для пульсации фона
        'pulse-shadow': 'pulse-shadow 2s infinite',
      },
    },
  },
  plugins: [],
};
export default config;