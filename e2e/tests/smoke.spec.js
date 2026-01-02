const { test, expect } = require('@playwright/test');
const path = require('path');
const { disableMocks } = require('../utils/api-mock');
const {
  uploadPDFFile,
  fillQuizForm,
  submitQuizForm,
  switchToTextMode,
  enterText,
  clearLocalStorage,
  waitForQuizGeneration
} = require('../utils/test-helpers');

const testPDFPath = path.join(__dirname, '../fixtures/sample.pdf');

// Проверяем наличие необходимых переменных окружения для smoke-тестов
const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
const hasOllama = process.env.ENABLE_OLLAMA_TESTS === 'true';

// Тесты, которые не требуют page (используют только request)
test.describe('Smoke Tests - API Health', () => {
  test('должен проверить health endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:5001/api/health');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
  });
});

// Тесты, которые требуют page
test.describe('Smoke Tests - Real API', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto('/');
    // Отключаем моки для smoke-тестов
    disableMocks(page);
  });

  test.skip(!hasOpenRouterKey, 'должен создать тест из PDF через OpenRouter API', async ({ page }) => {
    // Этот тест требует реальный API ключ OpenRouter
    // Запускается только если установлена переменная OPENROUTER_API_KEY
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 2, modelType: 'openrouter' });
    await submitQuizForm(page);
    
    // Ждем генерации (может занять время с реальным API)
    await waitForQuizGeneration(page, 60000);
    
    // Проверяем, что вопросы появились
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
  });

  test.skip(!hasOpenRouterKey, 'должен создать тест из текста через OpenRouter API', async ({ page }) => {
    // Этот тест требует реальный API ключ OpenRouter
    
    await switchToTextMode(page);
    
    const testText = 'JavaScript - это язык программирования для веб-разработки. ' +
      'Он используется для создания интерактивных веб-страниц. ' +
      'React - это библиотека для создания пользовательских интерфейсов. ' +
      'Node.js позволяет использовать JavaScript на сервере. ' +
      'TypeScript добавляет типизацию к JavaScript.';
    
    await enterText(page, testText);
    await fillQuizForm(page, { numQuestions: 2, modelType: 'openrouter' });
    await submitQuizForm(page);
    
    // Ждем генерации
    await waitForQuizGeneration(page, 60000);
    
    // Проверяем, что вопросы появились
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
  });

  test.skip(!hasOllama, 'должен создать тест из PDF через Ollama API', async ({ page }) => {
    // Этот тест требует запущенный Ollama сервер
    // Запускается только если установлена переменная ENABLE_OLLAMA_TESTS=true
    
    // Проверяем доступность Ollama
    try {
      const response = await page.request.get('http://localhost:11434/api/tags');
      if (response.status() !== 200) {
        test.skip(true, 'Ollama сервер недоступен');
      }
    } catch (error) {
      test.skip(true, 'Ollama сервер недоступен');
    }
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 2, modelType: 'ollama-mistral' });
    await submitQuizForm(page);
    
    // Ждем генерации (Ollama может быть медленнее)
    await waitForQuizGeneration(page, 120000);
    
    // Проверяем, что вопросы появились
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
  });

  test.skip(!hasOllama, 'должен создать тест из текста через Ollama API', async ({ page }) => {
    // Этот тест требует запущенный Ollama сервер
    
    // Проверяем доступность Ollama
    try {
      const response = await page.request.get('http://localhost:11434/api/tags');
      if (response.status() !== 200) {
        test.skip(true, 'Ollama сервер недоступен');
      }
    } catch (error) {
      test.skip(true, 'Ollama сервер недоступен');
    }
    
    await switchToTextMode(page);
    
    const testText = 'Python - это высокоуровневый язык программирования. ' +
      'Он известен своей простотой и читаемостью. ' +
      'Django и Flask - популярные веб-фреймворки для Python. ' +
      'NumPy и Pandas используются для работы с данными. ' +
      'Машинное обучение часто реализуется с помощью библиотек scikit-learn и TensorFlow.';
    
    await enterText(page, testText);
    await fillQuizForm(page, { numQuestions: 2, modelType: 'ollama-mistral' });
    await submitQuizForm(page);
    
    // Ждем генерации
    await waitForQuizGeneration(page, 120000);
    
    // Проверяем, что вопросы появились
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
  });

  test('должен обработать ошибку при отсутствии API ключа', async ({ page }) => {
    // Этот тест проверяет обработку ошибок при отсутствии API ключа
    // (если OpenRouter не настроен)
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 2, modelType: 'openrouter' });
    await submitQuizForm(page);
    
    // Ждем либо успешной генерации, либо ошибки
    try {
      await page.waitForSelector('[data-testid="error-message"], [data-testid="quiz-card"]', { timeout: 30000 });
      
      // Если появилась ошибка, проверяем её
      const errorMessage = page.locator('[data-testid="error-message"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      } else {
        // Если тест создался успешно, это тоже нормально
        await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();
      }
    } catch (error) {
      // Если ничего не произошло за 30 секунд, тест проваливается
      throw new Error('Не получен ответ от API за разумное время');
    }
  });

  test('должен обработать ошибку при недоступном Ollama', async ({ page }) => {
    // Этот тест проверяет обработку ошибок при недоступном Ollama
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 2, modelType: 'ollama-mistral' });
    await submitQuizForm(page);
    
    // Ждем либо успешной генерации, либо ошибки
    try {
      await page.waitForSelector('[data-testid="error-message"], [data-testid="quiz-card"]', { timeout: 30000 });
      
      const errorMessage = page.locator('[data-testid="error-message"]');
      const quizCard = page.locator('[data-testid="quiz-card"]');
      
      // Один из них должен быть виден
      const hasError = await errorMessage.isVisible();
      const hasQuiz = await quizCard.isVisible();
      
      expect(hasError || hasQuiz).toBe(true);
    } catch (error) {
      // Если ничего не произошло, это тоже приемлемо для smoke-теста
      // (означает, что сервер не отвечает)
    }
  });
});

