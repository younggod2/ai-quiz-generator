const { test, expect } = require('@playwright/test');
const { setupSuccessMocks, setupValidationErrorMocks } = require('../utils/api-mock');
const {
  waitForQuizGeneration,
  answerQuestion,
  goToNextQuestion,
  fillQuizForm,
  submitQuizForm,
  switchToTextMode,
  enterText,
  clearLocalStorage,
  getTotalQuestions,
  waitForResultsScreen
} = require('../utils/test-helpers');

test.describe('Text Input Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto('/');
  });

  test('должен переключиться на режим текстового ввода', async ({ page }) => {
    await switchToTextMode(page);
    
    // Проверяем, что textarea появился
    await expect(page.locator('[data-testid="text-input"]')).toBeVisible();
    
    // Проверяем, что input для файла скрыт
    await expect(page.locator('[data-testid="file-input"]')).not.toBeVisible();
  });

  test('должен ввести текст и создать тест', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 4 });
    
    await switchToTextMode(page);
    
    const testText = 'Это тестовый текст для генерации вопросов. ' +
      'Он содержит достаточно информации для создания теста. ' +
      'Программирование - это искусство решения задач с помощью кода. ' +
      'Веб-разработка включает frontend и backend компоненты.';
    
    await enterText(page, testText);
    
    // Проверяем счетчик символов
    await expect(page.locator('[data-testid="text-counter"]')).toContainText('символов');
    
    await fillQuizForm(page, { numQuestions: 4 });
    await submitQuizForm(page);
    
    // Ждем генерации теста
    await waitForQuizGeneration(page);
    
    // Проверяем, что вопросы отображаются
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
    
    const totalQuestions = await getTotalQuestions(page);
    expect(totalQuestions).toBe(4);
  });

  test('должен отображать счетчик символов', async ({ page }) => {
    await switchToTextMode(page);
    
    const testText = 'Тестовый текст';
    await enterText(page, testText);
    
    // Проверяем счетчик
    const counter = page.locator('[data-testid="text-counter"]');
    await expect(counter).toContainText(testText.length.toString());
  });

  test('должен проходить тест, созданный из текста', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 3 });
    
    await switchToTextMode(page);
    
    const testText = 'JavaScript - это язык программирования для веб-разработки. ' +
      'Он используется для создания интерактивных веб-страниц. ' +
      'React - это библиотека для создания пользовательских интерфейсов. ' +
      'Node.js позволяет использовать JavaScript на сервере.';
    
    await enterText(page, testText);
    await fillQuizForm(page, { numQuestions: 3 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Отвечаем на все вопросы
    for (let i = 0; i < 3; i++) {
      await answerQuestion(page, i % 4);
      if (i < 2) {
        await goToNextQuestion(page);
      }
    }
    
    // Завершаем тест
    await page.click('[data-testid="next-button"]');
    
    // Проверяем результаты
    await waitForResultsScreen(page);
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
  });

  test('должен переключаться между режимами PDF и текста', async ({ page }) => {
    await switchToTextMode(page);
    await expect(page.locator('[data-testid="text-input"]')).toBeVisible();
    
    // Переключаемся обратно на PDF
    await page.click('[data-testid="input-mode-pdf"]');
    await expect(page.locator('[data-testid="file-input"]')).toBeAttached();
    await expect(page.locator('[data-testid="text-input"]')).not.toBeVisible();
    
    // Снова переключаемся на текст
    await switchToTextMode(page);
    await expect(page.locator('[data-testid="text-input"]')).toBeVisible();
  });

  test('должен очищать форму при переключении режимов', async ({ page }) => {
    // Вводим текст
    await switchToTextMode(page);
    await enterText(page, 'Тестовый текст');
    
    // Переключаемся на PDF
    await page.click('[data-testid="input-mode-pdf"]');
    
    // Переключаемся обратно на текст
    await switchToTextMode(page);
    
    // Проверяем, что textarea пустой
    const textareaValue = await page.locator('[data-testid="text-input"]').inputValue();
    expect(textareaValue).toBe('');
  });

  test('должен работать с длинным текстом', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 5 });
    
    await switchToTextMode(page);
    
    // Создаем длинный текст
    const longText = Array(10).fill(
      'Это параграф текста для тестирования. ' +
      'Он содержит достаточно информации для генерации вопросов. ' +
      'Текст должен быть достаточно длинным, чтобы модель могла создать разнообразные вопросы. '
    ).join('');
    
    await enterText(page, longText);
    
    // Проверяем счетчик
    const counter = page.locator('[data-testid="text-counter"]');
    await expect(counter).toContainText(longText.length.toString());
    
    await fillQuizForm(page, { numQuestions: 5 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
  });

  test('должен валидировать количество вопросов в текстовом режиме', async ({ page }) => {
    setupValidationErrorMocks(page);
    
    await switchToTextMode(page);
    await enterText(page, 'Тестовый текст для генерации вопросов.');
    
    // Пытаемся создать тест с неверным количеством вопросов
    await fillQuizForm(page, { numQuestions: 0 });
    await submitQuizForm(page);
    
    // Проверяем ошибку валидации
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});

