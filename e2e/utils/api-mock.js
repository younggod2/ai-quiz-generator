const { createSuccessResponse, validationErrorResponse, emptyFileErrorResponse, invalidFileTypeErrorResponse, apiErrorResponse, emptyTextErrorResponse } = require('../fixtures/mock-responses');

/**
 * Утилиты для мокирования API запросов в Playwright тестах
 */

/**
 * Настраивает моки для успешных API запросов
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @param {Object} options - Опции для моков
 * @param {number} options.numQuestions - Количество вопросов в ответе
 * @param {number} options.delay - Задержка ответа в миллисекундах
 */
function setupSuccessMocks(page, options = {}) {
  const { numQuestions = 5, delay = 500 } = options;
  
  // Мок для /api/upload-pdf
  page.route('**/api/upload-pdf', async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createSuccessResponse(numQuestions))
    });
  });
  
  // Мок для /api/process-text
  page.route('**/api/process-text', async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createSuccessResponse(numQuestions))
    });
  });
}

/**
 * Настраивает моки для ошибок валидации
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
function setupValidationErrorMocks(page) {
  page.route('**/api/upload-pdf', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(validationErrorResponse)
    });
  });
  
  page.route('**/api/process-text', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(validationErrorResponse)
    });
  });
}

/**
 * Настраивает моки для ошибки пустого файла
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
function setupEmptyFileErrorMocks(page) {
  page.route('**/api/upload-pdf', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(emptyFileErrorResponse)
    });
  });
}

/**
 * Настраивает моки для ошибки неверного типа файла
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
function setupInvalidFileTypeErrorMocks(page) {
  page.route('**/api/upload-pdf', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(invalidFileTypeErrorResponse)
    });
  });
}

/**
 * Настраивает моки для ошибки пустого текста
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
function setupEmptyTextErrorMocks(page) {
  page.route('**/api/process-text', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify(emptyTextErrorResponse)
    });
  });
}

/**
 * Настраивает моки для ошибки API
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
function setupApiErrorMocks(page) {
  page.route('**/api/upload-pdf', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(apiErrorResponse)
    });
  });
  
  page.route('**/api/process-text', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(apiErrorResponse)
    });
  });
}

/**
 * Отключает все моки (для smoke-тестов с реальными API)
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
function disableMocks(page) {
  page.unroute('**/api/upload-pdf');
  page.unroute('**/api/process-text');
}

module.exports = {
  setupSuccessMocks,
  setupValidationErrorMocks,
  setupEmptyFileErrorMocks,
  setupInvalidFileTypeErrorMocks,
  setupEmptyTextErrorMocks,
  setupApiErrorMocks,
  disableMocks
};

