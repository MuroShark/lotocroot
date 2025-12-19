import { defineConfig, devices } from '@playwright/test';

/**
 * Читайте больше о конфигурации здесь: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests', // Папка с тестами
  /* Запускать тесты в файлах параллельно */
  fullyParallel: true,
  /* Завершать работу при первой ошибке */
  forbidOnly: !!process.env.CI,
  /* Количество повторных попыток при неудаче */
  retries: process.env.CI ? 2 : 0,
  /* Количество "воркеров" для параллельного запуска */
  workers: process.env.CI ? 1 : undefined,
  /* Репортер для вывода результатов */
  reporter: 'html',
  
  use: {
    /* Базовый URL для всех действий, например `await page.goto('/')` */
    baseURL: 'http://127.0.0.1:3000',

    /* Собирать трассировку при первой повторной попытке неудачного теста. */
    trace: 'on-first-retry',
  },

  /* ===== НАЧАЛО ВАЖНЫХ ИЗМЕНЕНИЙ ===== */

  // Эта секция говорит Playwright, что нужно сделать перед запуском тестов.
  webServer: {
    // Команда для запуска вашего dev-сервера Next.js
    command: 'npm run dev',
    // URL, по которому Playwright будет проверять доступность сервера
    url: 'http://127.0.0.1:3000',
    // Если сервер уже запущен (например, вы запустили `npm run dev` в другом терминале),
    // Playwright будет использовать его, а не запускать новый. Очень удобно для локальной разработки.
    reuseExistingServer: !process.env.CI,
  },

  /* ===== КОНЕЦ ВАЖНЫХ ИЗМЕНЕНИЙ ===== */

  /* Конфигурация для конкретных проектов (браузеров) */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
