const { test, expect } = require('@playwright/test');
const path = require('path');
const { setupSuccessMocks, setupValidationErrorMocks, setupEmptyFileErrorMocks, setupApiErrorMocks } = require('../utils/api-mock');
const {
  waitForQuizGeneration,
  answerQuestion,
  goToNextQuestion,
  goToPreviousQuestion,
  uploadPDFFile,
  fillQuizForm,
  submitQuizForm,
  clearLocalStorage,
  getCurrentQuestionNumber,
  getTotalQuestions,
  waitForResultsScreen,
  resetQuiz
} = require('../utils/test-helpers');

const testPDFPath = path.join(__dirname, '../fixtures/sample.pdf');

test.describe('Quiz Flow - PDF Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await clearLocalStorage(page);
  });

  test('должен загрузить главную страницу', async ({ page }) => {
    await expect(page.locator('[data-testid="app-title"]')).toContainText('Генератор тестов');
    // Проверяем, что форма загрузки видна (по умолчанию теперь режим текста)
    await expect(page.locator('[data-testid="pdf-uploader"]')).toBeVisible();
    // Проверяем, что по умолчанию показывается textarea (режим текста)
    await expect(page.locator('[data-testid="text-input"]')).toBeVisible();
  });

  test('должен загрузить PDF файл через input', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 5 });
    
    await uploadPDFFile(page, testPDFPath);
    
    // Проверяем, что файл отображается
    await expect(page.locator('[data-testid="drop-zone"].has-file')).toBeVisible();
  });

  test('должен заполнить форму и создать тест', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 5 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 5, modelType: 'openrouter' });
    await submitQuizForm(page);
    
    // Ждем генерации теста
    await waitForQuizGeneration(page);
    
    // Проверяем, что вопросы отображаются
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
    
    const totalQuestions = await getTotalQuestions(page);
    expect(totalQuestions).toBe(5);
  });

  test('должен отвечать на вопросы и навигировать', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 3 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 3 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Отвечаем на первый вопрос
    await answerQuestion(page, 0);
    await expect(page.locator('[data-testid="result-message"]')).toBeVisible();
    
    // Переходим к следующему вопросу
    await goToNextQuestion(page);
    
    const currentQuestion = await getCurrentQuestionNumber(page);
    expect(currentQuestion).toBe(2);
    
    // Отвечаем на второй вопрос
    await answerQuestion(page, 1);
    
    // Переходим к третьему вопросу
    await goToNextQuestion(page);
    
    // Возвращаемся назад
    await goToPreviousQuestion(page);
    const previousQuestion = await getCurrentQuestionNumber(page);
    expect(previousQuestion).toBe(2);
  });

  test('должен завершить тест и показать результаты', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 2 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 2 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Отвечаем на первый вопрос
    await answerQuestion(page, 0);
    await goToNextQuestion(page);
    
    // Отвечаем на второй вопрос
    await answerQuestion(page, 1);
    
    // Завершаем тест
    await page.click('[data-testid="next-button"]');
    
    // Проверяем экран результатов
    await waitForResultsScreen(page);
    await expect(page.locator('text=Тест завершен')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
  });

  test('должен сбросить тест и вернуться к загрузке', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 2 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 2 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Сбрасываем тест
    await resetQuiz(page);
    
    // Проверяем, что вернулись к форме загрузки
    await expect(page.locator('[data-testid="pdf-uploader"]')).toBeVisible();
    // После сброса форма возвращается к режиму по умолчанию (текст)
    // Проверяем, что виден text-input (режим текста по умолчанию)
    await expect(page.locator('[data-testid="text-input"]')).toBeVisible();
  });

  test('должен показать ошибку при валидации', async ({ page }) => {
    setupValidationErrorMocks(page);
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 0 }); // Неверное количество
    await submitQuizForm(page);
    
    // Ждем появления ошибки
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Количество вопросов');
  });

  test('должен показать ошибку при пустом файле', async ({ page }) => {
    setupEmptyFileErrorMocks(page);
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 5 });
    await submitQuizForm(page);
    
    // Ждем появления ошибки
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('пуст');
  });

  test('должен показать ошибку при ошибке API', async ({ page }) => {
    setupApiErrorMocks(page);
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 5 });
    await submitQuizForm(page);
    
    // Ждем появления ошибки
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('должен переключаться между моделями', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 3 });
    
    await uploadPDFFile(page, testPDFPath);
    
    // Выбираем OpenRouter
    await page.click('[data-testid="model-openrouter"]');
    await expect(page.locator('[data-testid="model-openrouter"]')).toBeChecked();
    
    // Переключаемся на Ollama
    await page.click('[data-testid="model-ollama-mistral"]');
    await expect(page.locator('[data-testid="model-ollama-mistral"]')).toBeChecked();
    
    await fillQuizForm(page, { numQuestions: 3, modelType: 'ollama-mistral' });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
  });

  test('должен валидировать количество вопросов', async ({ page }) => {
    await uploadPDFFile(page, testPDFPath);
    
    const numQuestionsInput = page.locator('[data-testid="num-questions-input"]');
    
    // Пытаемся ввести слишком большое число
    await numQuestionsInput.fill('100');
    await numQuestionsInput.blur();
    
    // Проверяем, что значение ограничено до 20 (как в backend и frontend)
    const value = await numQuestionsInput.inputValue();
    expect(parseInt(value)).toBeLessThanOrEqual(20);
    expect(parseInt(value)).toBe(20); // Должно быть точно 20
    
    // Пытаемся ввести отрицательное число
    await numQuestionsInput.fill('-5');
    await numQuestionsInput.blur();
    
    // Проверяем, что значение ограничено до 1
    const minValue = await numQuestionsInput.inputValue();
    expect(parseInt(minValue)).toBeGreaterThanOrEqual(1);
  });

  test('должен отображать индикатор загрузки', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 3, delay: 2000 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 3 });
    await submitQuizForm(page);
    
    // Проверяем, что индикатор загрузки появляется
    await expect(page.locator('[data-testid="loading-container"]')).toBeVisible();
    await expect(page.locator('text=Генерация теста')).toBeVisible();
    
    // Ждем завершения загрузки
    await waitForQuizGeneration(page);
  });
});

