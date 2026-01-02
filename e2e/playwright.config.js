// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Конфигурация Playwright для E2E тестов
 * @see https://playwright.dev/docs/test-configuration
 */
const config = {
  testDir: './tests',
  /* Максимальное время выполнения одного теста */
  timeout: 60 * 1000,
  expect: {
    /* Максимальное время ожидания для expect assertions */
    timeout: 5000
  },
  /* Запускать тесты в параллель */
  fullyParallel: true,
  /* Не запускать тесты в CI, если они падают */
  forbidOnly: !!process.env.CI,
  /* Повторять тесты при падении в CI */
  retries: process.env.CI ? 2 : 0,
  /* Количество воркеров в параллель */
  workers: process.env.CI ? 1 : undefined,
  /* Репортер для результатов */
  reporter: 'html',
  /* Общие настройки для всех проектов */
  use: {
    /* Базовый URL для тестов */
    baseURL: 'http://localhost:3000',
    /* Трассировка при падении теста */
    trace: 'on-first-retry',
    /* Скриншоты при падении */
    screenshot: 'only-on-failure',
    /* Видео при падении */
    video: 'retain-on-failure',
  },

  /* Настройки проектов для разных браузеров */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox и WebKit отключены для ускорения тестов
    // Раскомментируйте при необходимости тестирования в других браузерах
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

};

/* Настройка веб-сервера для разработки */
// В CI режиме серверы запускаются вручную в GitHub Actions workflow
// Поэтому webServer отключен в CI, чтобы избежать конфликтов портов
// В локальной разработке Playwright автоматически запускает серверы
if (!process.env.CI) {
  config.webServer = [
    {
      command: './start.sh',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ];
}

module.exports = defineConfig(config);

