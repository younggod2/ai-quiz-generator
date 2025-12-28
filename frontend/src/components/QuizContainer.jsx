import React, { useState } from 'react';
import QuizCard from './QuizCard';
import './QuizContainer.css';

function QuizContainer({ questions, onReset }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (isCorrect) => {
    setAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      newAnswers[currentQuestionIndex] = isCorrect;
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    const correctAnswers = answers.filter(a => a === true).length;
    return {
      correct: correctAnswers,
      total: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100)
    };
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="quiz-container">
        <div className="results-screen">
          <h2>🎉 Тест завершен!</h2>
          <div className="score-display">
            <div className="score-circle">
              <span className="score-percentage">{score.percentage}%</span>
              <span className="score-label">Правильных ответов</span>
            </div>
            <div className="score-details">
              <p>Правильных ответов: <strong>{score.correct}</strong> из <strong>{score.total}</strong></p>
            </div>
          </div>
          <button className="reset-button" onClick={onReset}>
            🔄 Создать новый тест
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  // Проверяем, что ответ был дан (может быть true или false, но не undefined)
  const hasAnswered = typeof answers[currentQuestionIndex] !== 'undefined';

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <button className="back-button" onClick={onReset}>
          ← Назад к загрузке
        </button>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <QuizCard
        key={currentQuestionIndex}
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
      />

      <div className="navigation-buttons">
        <button
          className="nav-button prev-button"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          ← Предыдущий
        </button>
        <button
          className="nav-button next-button"
          onClick={handleNext}
          disabled={!hasAnswered}
        >
          {currentQuestionIndex === questions.length - 1 ? 'Завершить тест →' : 'Следующий →'}
        </button>
      </div>
    </div>
  );
}

export default QuizContainer;



