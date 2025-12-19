// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

// Предоставляем путь к вашему приложению Next.js, чтобы загрузить next.config.js и .env файлы в тестовой среде
const createJestConfig = nextJest({
  dir: './',
});

// Любая пользовательская конфигурация Jest, которую вы хотите добавить
const customJestConfig = {
  // Добавляем больше опций `setupFilesAfterEnv` в Jest
  // В этом файле мы будем импортировать jest-dom для расширения матчеров
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Указываем Jest, где искать тестовые файлы
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],

  // Указываем среду для тестирования. 'jsdom' эмулирует окружение браузера.
  testEnvironment: 'jest-environment-jsdom',

  // Обработка абсолютных импортов и псевдонимов модулей
  // Это должно совпадать с вашим tsconfig.json (`compilerOptions.paths`)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Обработка CSS-модулей
    // https://jestjs.io/docs/webpack#handling-css-files
    '\\.module\\.css$': 'identity-obj-proxy',
  },
};

// createJestConfig асинхронная функция, поэтому мы экспортируем ее таким образом
// чтобы next/jest мог убедиться, что конфигурация Next.js полностью загружена.
module.exports = createJestConfig(customJestConfig);
