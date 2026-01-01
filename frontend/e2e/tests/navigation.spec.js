const { test, expect } = require('@playwright/test');
const path = require('path');
const { setupSuccessMocks } = require('../utils/api-mock');
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
  navigateToQuestion
} = require('../utils/test-helpers');

const testPDFPath = path.join(__dirname, '../fixtures/sample.pdf');

test.describe('Navigation and LocalStorage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ждем загрузки страницы
    await page.waitForLoadState('domcontentloaded');
    await clearLocalStorage(page);
  });

  test('должен сохранять состояние в localStorage', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 5 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 5 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Отвечаем на несколько вопросов
    await answerQuestion(page, 0);
    await goToNextQuestion(page);
    await answerQuestion(page, 1);
    await goToNextQuestion(page);
    
    // Проверяем, что данные сохранены в localStorage
    const questions = await page.evaluate(() => {
      try {
        return localStorage.getItem('quiz_questions');
      } catch (e) {
        return null;
      }
    });
    expect(questions).not.toBeNull();
    
    const currentIndex = await page.evaluate(() => {
      try {
        return localStorage.getItem('quiz_current_index');
      } catch (e) {
        return null;
      }
    });
    expect(currentIndex).toBe('2');
    
    const answers = await page.evaluate(() => {
      try {
        return localStorage.getItem('quiz_answers');
      } catch (e) {
        return null;
      }
    });
    expect(answers).not.toBeNull();
  });

  test('должен восстанавливать состояние после перезагрузки', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 4 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 4 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Отвечаем на вопросы
    await answerQuestion(page, 0);
    await goToNextQuestion(page);
    await answerQuestion(page, 1);
    await goToNextQuestion(page);
    
    const currentIndexBefore = await getCurrentQuestionNumber(page);
    
    // Перезагружаем страницу
    await page.reload();
    
    // Ждем восстановления состояния
    await page.waitForSelector('[data-testid="quiz-card"]', { timeout: 5000 });
    
    // Проверяем, что мы на том же вопросе
    const currentIndexAfter = await getCurrentQuestionNumber(page);
    expect(currentIndexAfter).toBe(currentIndexBefore);
    
    // Проверяем, что ответы сохранены
    const savedAnswer = await page.evaluate(() => {
      try {
        const answers = JSON.parse(localStorage.getItem('quiz_answers') || '[]');
        return answers[1]; // Ответ на второй вопрос (индекс 1)
      } catch (e) {
        return undefined;
      }
    });
    expect(savedAnswer).not.toBeUndefined();
    expect(savedAnswer.selectedIndex).toBe(1);
  });

  test('должен блокировать кнопку "Следующий" без ответа', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 3 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 3 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Проверяем, что кнопка "Следующий" заблокирована
    const nextButton = page.locator('[data-testid="next-button"]');
    await expect(nextButton).toBeDisabled();
    
    // Отвечаем на вопрос
    await answerQuestion(page, 0);
    
    // Теперь кнопка должна быть активна
    await expect(nextButton).toBeEnabled();
  });

  test('должен блокировать кнопку "Предыдущий" на первом вопросе', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 3 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 3 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Проверяем, что кнопка "Предыдущий" заблокирована на первом вопросе
    const prevButton = page.locator('[data-testid="prev-button"]');
    await expect(prevButton).toBeDisabled();
    
    // Отвечаем и переходим вперед
    await answerQuestion(page, 0);
    await goToNextQuestion(page);
    
    // Теперь кнопка "Предыдущий" должна быть активна
    await expect(prevButton).toBeEnabled();
  });

  test('должен обновлять прогресс-бар при навигации', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 5 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 5 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Проверяем прогресс-бар на первом вопросе
    const progressBar = page.locator('[data-testid="quiz-progress-fill"]');
    const initialTransform = await progressBar.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });
    
    // Переходим к следующему вопросу
    await answerQuestion(page, 0);
    await goToNextQuestion(page);
    
    // Проверяем, что прогресс-бар обновился
    await page.waitForTimeout(300);
    const updatedTransform = await progressBar.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });
    
    // Transform должен измениться
    expect(updatedTransform).not.toBe(initialTransform);
  });

  test('должен отображать правильный номер вопроса', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 4 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 4 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Проверяем первый вопрос
    let questionNumber = await getCurrentQuestionNumber(page);
    expect(questionNumber).toBe(1);
    await expect(page.locator('[data-testid="question-number"]')).toContainText('Вопрос 1 из 4');
    
    // Переходим ко второму вопросу
    await answerQuestion(page, 0);
    await goToNextQuestion(page);
    
    questionNumber = await getCurrentQuestionNumber(page);
    expect(questionNumber).toBe(2);
    await expect(page.locator('[data-testid="question-number"]')).toContainText('Вопрос 2 из 4');
  });

  test('должен сохранять выбранные ответы при навигации', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 3 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 3 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Отвечаем на первый вопрос
    await answerQuestion(page, 0);
    
    // Переходим ко второму вопросу
    await goToNextQuestion(page);
    await answerQuestion(page, 1);
    
    // Возвращаемся к первому вопросу
    await goToPreviousQuestion(page);
    
    // Проверяем, что ответ сохранен и отображается
    const firstAnswer = page.locator('[data-testid="answer-option-0"]');
    await expect(firstAnswer).toHaveClass(/correct|incorrect/);
    
    // Переходим ко второму вопросу
    await goToNextQuestion(page);
    
    // Проверяем, что ответ на второй вопрос тоже сохранен
    const secondAnswer = page.locator('[data-testid="answer-option-1"]');
    await expect(secondAnswer).toHaveClass(/correct|incorrect/);
  });

  test('должен очищать localStorage при сбросе', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 3 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 3 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Отвечаем на вопросы
    await answerQuestion(page, 0);
    await goToNextQuestion(page);
    
    // Проверяем, что данные в localStorage
    const questionsBefore = await page.evaluate(() => {
      try {
        return localStorage.getItem('quiz_questions');
      } catch (e) {
        return null;
      }
    });
    expect(questionsBefore).not.toBeNull();
    
    // Сбрасываем тест
    await page.click('[data-testid="back-button"]');
    
    // Проверяем, что localStorage очищен
    const questionsAfter = await page.evaluate(() => {
      try {
        return localStorage.getItem('quiz_questions');
      } catch (e) {
        return null;
      }
    });
    expect(questionsAfter).toBeNull();
    
    const answersAfter = await page.evaluate(() => {
      try {
        return localStorage.getItem('quiz_answers');
      } catch (e) {
        return null;
      }
    });
    expect(answersAfter).toBeNull();
  });

  test('должен корректно обрабатывать навигацию на последнем вопросе', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 3 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 3 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Переходим к последнему вопросу
    await answerQuestion(page, 0);
    await goToNextQuestion(page);
    await answerQuestion(page, 1);
    await goToNextQuestion(page);
    
    // Проверяем, что мы на последнем вопросе
    const totalQuestions = await getTotalQuestions(page);
    const currentQuestion = await getCurrentQuestionNumber(page);
    expect(currentQuestion).toBe(totalQuestions);
    
    // Проверяем, что кнопка "Следующий" заменена на "Завершить"
    const nextButton = page.locator('[data-testid="next-button"]');
    await expect(nextButton).toContainText('Завершить');
    
    // Кнопка "Предыдущий" должна быть активна
    await expect(page.locator('[data-testid="prev-button"]')).toBeEnabled();
  });

  test('должен сохранять состояние showResults', async ({ page }) => {
    setupSuccessMocks(page, { numQuestions: 2 });
    
    await uploadPDFFile(page, testPDFPath);
    await fillQuizForm(page, { numQuestions: 2 });
    await submitQuizForm(page);
    
    await waitForQuizGeneration(page);
    
    // Завершаем тест
    await answerQuestion(page, 0);
    await goToNextQuestion(page);
    await answerQuestion(page, 1);
    await page.click('[data-testid="next-button"]');
    
    // Проверяем, что showResults сохранен
    const showResults = await page.evaluate(() => {
      try {
        return localStorage.getItem('quiz_show_results');
      } catch (e) {
        return null;
      }
    });
    expect(showResults).toBe('true');
    
    // Перезагружаем страницу
    await page.reload();
    
    // Проверяем, что экран результатов отображается
    await page.waitForSelector('[data-testid="results-screen"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="results-screen"]')).toBeVisible();
  });
});

