/**
 * Моки ответов API для E2E тестов
 */

/**
 * Создает мок успешного ответа для генерации теста
 * @param {number} numQuestions - Количество вопросов
 * @returns {Object} Мок ответа API
 */
function createSuccessResponse(numQuestions = 5) {
  const questions = [];
  
  for (let i = 1; i <= numQuestions; i++) {
    questions.push({
      id: i,
      question: `Тестовый вопрос ${i}?`,
      type: 'multiple_choice',
      options: [
        `Вариант ответа A для вопроса ${i}`,
        `Вариант ответа B для вопроса ${i}`,
        `Вариант ответа C для вопроса ${i}`,
        `Вариант ответа D для вопроса ${i}`
      ],
      correct_answer: (i - 1) % 4 // Распределяем правильные ответы: 0, 1, 2, 3, 0...
    });
  }
  
  return {
    success: true,
    questions: questions,
    total_questions: questions.length
  };
}

/**
 * Мок ответа с ошибкой валидации
 */
const validationErrorResponse = {
  error: 'Количество вопросов должно быть положительным числом'
};

/**
 * Мок ответа с ошибкой пустого файла
 */
const emptyFileErrorResponse = {
  error: 'PDF документ пуст или не может быть обработан'
};

/**
 * Мок ответа с ошибкой неверного типа файла
 */
const invalidFileTypeErrorResponse = {
  error: 'Разрешены только PDF файлы'
};

/**
 * Мок ответа с ошибкой API
 */
const apiErrorResponse = {
  error: 'Ошибка при обработке запроса: Недостаточно кредитов в OpenRouter'
};

/**
 * Мок ответа для пустого текста
 */
const emptyTextErrorResponse = {
  error: 'Текст не может быть пустым'
};

/**
 * Создает мок ответа с задержкой (для тестирования состояний загрузки)
 * @param {number} delay - Задержка в миллисекундах
 * @param {number} numQuestions - Количество вопросов
 * @returns {Promise<Object>} Промис с мок ответом
 */
function createDelayedResponse(delay = 2000, numQuestions = 5) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(createSuccessResponse(numQuestions));
    }, delay);
  });
}

module.exports = {
  createSuccessResponse,
  validationErrorResponse,
  emptyFileErrorResponse,
  invalidFileTypeErrorResponse,
  apiErrorResponse,
  emptyTextErrorResponse,
  createDelayedResponse
};

