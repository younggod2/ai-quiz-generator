import React, { useState } from 'react';
import PDFUploader from './components/PDFUploader';
import QuizContainer from './components/QuizContainer';
import './App.css';

function App() {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuizGenerated = (quizData) => {
    setQuestions(quizData.questions);
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setQuestions(null);
  };

  const handleLoading = (isLoading) => {
    setLoading(isLoading);
  };

  const handleReset = () => {
    setQuestions(null);
    setError(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Генератор тестов</h1>
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
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;



