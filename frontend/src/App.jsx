import React, { useState, useEffect } from 'react';
import PDFUploader from './components/PDFUploader';
import QuizContainer from './components/QuizContainer';
import './App.css';

const STORAGE_KEY_QUESTIONS = 'quiz_questions';

function App() {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Восстанавливаем вопросы из localStorage при загрузке
  useEffect(() => {
    const savedQuestions = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (savedQuestions) {
      try {
        const parsedQuestions = JSON.parse(savedQuestions);
        setQuestions(parsedQuestions);
      } catch (e) {
        console.error('Ошибка при восстановлении вопросов из localStorage:', e);
        localStorage.removeItem(STORAGE_KEY_QUESTIONS);
      }
    }
  }, []);

  const handleQuizGenerated = (quizData) => {
    setQuestions(quizData.questions);
    setError(null);
    // Сохраняем вопросы в localStorage
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(quizData.questions));
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setQuestions(null);
    localStorage.removeItem(STORAGE_KEY_QUESTIONS);
  };

  const handleLoading = (isLoading) => {
    setLoading(isLoading);
  };

  const handleReset = () => {
    setQuestions(null);
    setError(null);
    // Очищаем все данные из localStorage
    localStorage.removeItem(STORAGE_KEY_QUESTIONS);
    localStorage.removeItem('quiz_current_index');
    localStorage.removeItem('quiz_answers');
    localStorage.removeItem('quiz_show_results');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 data-testid="app-title">📚 Генератор тестов</h1>
        <p>Загрузите PDF документ или вставьте текст и получите персонализированный тест.</p>
      </header>

      <main className="App-main">
        {!questions ? (
          <PDFUploader
            onQuizGenerated={handleQuizGenerated}
            onError={handleError}
            onLoading={handleLoading}
            loading={loading}
          />
        ) : (
          <QuizContainer
            questions={questions}
            onReset={handleReset}
          />
        )}

        {error && (
          <div className="error-message" data-testid="error-message">
            <p>❌ {error}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;



