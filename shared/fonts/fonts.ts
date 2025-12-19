import localFont from 'next/font/local';

export const wdxlLubrifont = localFont({
  src: [
    {
      path: './wd-xl-lubrifont-sc/WDXLLubrifontSC-Regular.ttf', // Обновленный путь относительно shared/fonts
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-wdxl-lubrifont', // Задаем CSS-переменную для нового шрифта
});