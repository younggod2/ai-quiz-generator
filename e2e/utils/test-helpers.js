/**
 * Вспомогательные функции для E2E тестов
 */

/**
 * Ожидает появления вопросов на странице после генерации теста
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @param {number} timeout - Таймаут в миллисекундах
 */
async function waitForQuizGeneration(page, timeout = 30000) {
  // Ждем исчезновения индикатора загрузки
  await page.waitForSelector('[data-testid="loading-container"]', { state: 'hidden', timeout });
  
  // Ждем появления карточки вопроса
  await page.waitForSelector('[data-testid="quiz-card"]', { timeout });
  
  // Проверяем, что вопрос отображается
  await page.waitForSelector('[data-testid="question-text"]', { timeout: 5000 });
}

/**
 * Выбирает ответ на текущий вопрос
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @param {number} answerIndex - Индекс ответа (0-3)
 */
async function answerQuestion(page, answerIndex) {
  const answerButton = page.locator(`[data-testid="answer-option-${answerIndex}"]`);
  await answerButton.click();
  
  // Ждем, пока ответ обработается - проверяем появление результата
  try {
    await page.waitForSelector('[data-testid="result-message"]', { state: 'visible', timeout: 2000 });
  } catch (e) {
    // Если результат не появился, просто ждем небольшую задержку
    // Используем более безопасный способ ожидания
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Навигация к следующему вопросу
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
async function goToNextQuestion(page) {
  await page.click('[data-testid="next-button"]');
  // Ждем обновления страницы - проверяем изменение номера вопроса или появление следующего вопроса
  try {
    await page.waitForLoadState('networkidle', { timeout: 2000 });
  } catch (e) {
    // Если networkidle не сработал, просто ждем небольшую задержку
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

/**
 * Навигация к предыдущему вопросу
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
async function goToPreviousQuestion(page) {
  await page.click('[data-testid="prev-button"]');
  // Ждем обновления страницы
  try {
    await page.waitForLoadState('networkidle', { timeout: 2000 });
  } catch (e) {
    // Если networkidle не сработал, просто ждем небольшую задержку
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

/**
 * Навигация к конкретному вопросу (через навигацию вперед/назад)
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @param {number} targetIndex - Целевой индекс вопроса (0-based)
 */
async function navigateToQuestion(page, targetIndex) {
  // Получаем текущий индекс вопроса из текста
  const currentQuestionText = await page.locator('[data-testid="question-number"]').textContent();
  const currentMatch = currentQuestionText.match(/Вопрос (\d+)/);
  const currentIndex = currentMatch ? parseInt(currentMatch[1]) - 1 : 0;
  
  if (targetIndex > currentIndex) {
    // Идем вперед
    for (let i = currentIndex; i < targetIndex; i++) {
      await goToNextQuestion(page);
    }
  } else if (targetIndex < currentIndex) {
    // Идем назад
    for (let i = currentIndex; i > targetIndex; i--) {
      await goToPreviousQuestion(page);
    }
  }
}

/**
 * Загружает PDF файл через input
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @param {string} filePath - Путь к PDF файлу
 */
async function uploadPDFFile(page, filePath) {
  // Сначала переключаемся в режим PDF, если еще не в нем
  // Проверяем, виден ли file input, если нет - переключаемся
  const fileInput = page.locator('[data-testid="file-input"]');
  const isFileInputVisible = await fileInput.isVisible().catch(() => false);
  
  if (!isFileInputVisible) {
    await switchToPDFMode(page);
  }
  
  // Теперь загружаем файл
  await fileInput.setInputFiles(filePath);
  
  // Ждем, пока файл загрузится - проверяем появление имени файла
  try {
    await page.waitForSelector('[data-testid="drop-zone"].has-file', { state: 'visible', timeout: 1000 });
  } catch (e) {
    // Если элемент не появился, просто ждем небольшую задержку
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Заполняет форму для генерации теста
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @param {Object} options - Опции формы
 * @param {number} options.numQuestions - Количество вопросов
 * @param {string} options.modelType - Тип модели ('openrouter' или 'ollama-mistral')
 */
async function fillQuizForm(page, options = {}) {
  const { numQuestions = 10, modelType = 'openrouter' } = options;
  
  // Заполняем количество вопросов
  const numQuestionsInput = page.locator('[data-testid="num-questions-input"]');
  await numQuestionsInput.fill(numQuestions.toString());
  
  // Выбираем модель
  if (modelType === 'ollama-mistral') {
    await page.click('[data-testid="model-ollama-mistral"]');
  } else {
    await page.click('[data-testid="model-openrouter"]');
  }
  
  // Ждем обновления UI
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Отправляет форму для генерации теста
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
async function submitQuizForm(page) {
  await page.click('[data-testid="submit-button"]');
}

/**
 * Переключается на режим PDF загрузки
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
async function switchToPDFMode(page) {
  await page.click('[data-testid="input-mode-pdf"]');
  // Ждем появления file input
  try {
    await page.waitForSelector('[data-testid="file-input"]', { state: 'visible', timeout: 1000 });
  } catch (e) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Переключается на режим текстового ввода
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
async function switchToTextMode(page) {
  await page.click('[data-testid="input-mode-text"]');
  // Ждем появления textarea
  try {
    await page.waitForSelector('[data-testid="text-input"]', { state: 'visible', timeout: 1000 });
  } catch (e) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Вводит текст в textarea
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @param {string} text - Текст для ввода
 */
async function enterText(page, text) {
  const textarea = page.locator('[data-testid="text-input"]');
  await textarea.fill(text);
  // Ждем обновления счетчика символов
  try {
    await page.waitForSelector('[data-testid="text-counter"]', { state: 'visible', timeout: 1000 });
  } catch (e) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Очищает localStorage
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
async function clearLocalStorage(page) {
  try {
    // Ждем, пока страница загрузится и будет доступен localStorage
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      try {
        if (typeof Storage !== 'undefined' && window.localStorage) {
          localStorage.clear();
        }
      } catch (e) {
        // Игнорируем ошибки доступа к localStorage
      }
    });
  } catch (error) {
    // Игнорируем ошибки доступа к localStorage (может быть недоступен на некоторых страницах)
    // Не выводим предупреждение, так как это нормально для некоторых контекстов
  }
}

/**
 * Получает текущий номер вопроса
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @returns {Promise<number>} Номер текущего вопроса (1-based)
 */
async function getCurrentQuestionNumber(page) {
  const questionText = await page.locator('[data-testid="question-number"]').textContent();
  const match = questionText.match(/Вопрос (\d+)/);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Получает общее количество вопросов
 * @param {import('@playwright/test').Page} page - Страница Playwright
 * @returns {Promise<number>} Общее количество вопросов
 */
async function getTotalQuestions(page) {
  const questionText = await page.locator('[data-testid="question-number"]').textContent();
  const match = questionText.match(/из (\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Проверяет, что отображается экран результатов
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
async function waitForResultsScreen(page) {
  await page.waitForSelector('[data-testid="results-screen"]', { timeout: 10000 });
  await page.waitForSelector('text=Тест завершен', { timeout: 5000 });
}

/**
 * Сбрасывает тест и возвращается к загрузке
 * @param {import('@playwright/test').Page} page - Страница Playwright
 */
async function resetQuiz(page) {
  const resetButton = page.locator('[data-testid="reset-button"], [data-testid="back-button"]');
  if (await resetButton.count() > 0) {
    await resetButton.first().click();
    // Ждем возврата к форме загрузки
    try {
      await page.waitForSelector('[data-testid="pdf-uploader"]', { state: 'visible', timeout: 2000 });
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

/**
 * Создает моковые вопросы для тестирования
 * @param {number} count - Количество вопросов
 * @returns {Array} Массив вопросов
 */
function createMockQuestions(count = 5) {
  const questions = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      id: i,
      question: `Тестовый вопрос ${i}?`,
      type: 'multiple_choice',
      options: [
        `Вариант A для вопроса ${i}`,
        `Вариант B для вопроса ${i}`,
        `Вариант C для вопроса ${i}`,
        `Вариант D для вопроса ${i}`
      ],
      correct_answer: (i - 1) % 4
    });
  }
  return questions;
}

module.exports = {
  waitForQuizGeneration,
  answerQuestion,
  goToNextQuestion,
  goToPreviousQuestion,
  navigateToQuestion,
  uploadPDFFile,
  fillQuizForm,
  submitQuizForm,
  switchToPDFMode,
  switchToTextMode,
  enterText,
  clearLocalStorage,
  getCurrentQuestionNumber,
  getTotalQuestions,
  waitForResultsScreen,
  resetQuiz,
  createMockQuestions
};

