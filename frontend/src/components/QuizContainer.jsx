import React, { useState, useEffect } from 'react';
import QuizCard from './QuizCard';
import './QuizContainer.css';

const STORAGE_KEY_INDEX = 'quiz_current_index';
const STORAGE_KEY_ANSWERS = 'quiz_answers';
const STORAGE_KEY_SHOW_RESULTS = 'quiz_show_results';

function QuizContainer({ questions, onReset }) {
  // Восстанавливаем состояние из localStorage при монтировании
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const savedIndex = localStorage.getItem(STORAGE_KEY_INDEX);
    const index = savedIndex ? parseInt(savedIndex, 10) : 0;
    // Проверяем, что индекс не превышает длину массива вопросов
    // (на случай, если вопросы изменились)
    return index;
  });
  
  const [answers, setAnswers] = useState(() => {
    const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
    return savedAnswers ? JSON.parse(savedAnswers) : [];
  });
  
  const [showResults, setShowResults] = useState(() => {
    const savedShowResults = localStorage.getItem(STORAGE_KEY_SHOW_RESULTS);
    return savedShowResults === 'true';
  });

  // Проверяем корректность индекса при изменении questions
  useEffect(() => {
    if (questions && questions.length > 0) {
      if (currentQuestionIndex >= questions.length) {
        setCurrentQuestionIndex(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  // Сохраняем currentQuestionIndex в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INDEX, currentQuestionIndex.toString());
  }, [currentQuestionIndex]);

  // Сохраняем answers в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answers));
  }, [answers]);

  // Сохраняем showResults в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHOW_RESULTS, showResults.toString());
  }, [showResults]);

  const handleAnswer = (answerData) => {
    setAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      newAnswers[currentQuestionIndex] = answerData;
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
    const correctAnswers = answers.filter(a => a && a.isCorrect === true).length;
    return {
      correct: correctAnswers,
      total: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100)
    };
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="quiz-container" data-testid="quiz-container">
        <div className="results-screen" data-testid="results-screen">
          <h2>🎉 Тест завершен!</h2>
          <div className="score-display" data-testid="score-display">
            <div className="score-circle">
              <span className="score-percentage">{score.percentage}%</span>
              <span className="score-label">Правильных ответов</span>
            </div>
            <div className="score-details">
              <p>Правильных ответов: <strong>{score.correct}</strong> из <strong>{score.total}</strong></p>
            </div>
          </div>
          <button className="reset-button" onClick={onReset} data-testid="reset-button">
            🔄 Создать новый тест
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  // Получаем сохраненный ответ для текущего вопроса
  const savedAnswer = answers[currentQuestionIndex];
  // Проверяем, что ответ был дан (не undefined)
  const hasAnswered = typeof savedAnswer !== 'undefined';

  return (
    <div className="quiz-container" data-testid="quiz-container">
      <div className="quiz-header">
        <button className="back-button" onClick={onReset} data-testid="back-button">
          ← Назад к загрузке
        </button>
        <div className="quiz-progress-bar" data-testid="quiz-progress-bar">
          <div
            className="quiz-progress-fill"
            data-testid="quiz-progress-fill"
            style={{ transform: `scaleX(${(currentQuestionIndex + 1) / questions.length})` }}
          />
        </div>
      </div>

      <QuizCard
        key={currentQuestionIndex}
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        savedAnswer={savedAnswer}
      />

      <div className="navigation-buttons" data-testid="navigation-buttons">
        <button
          className="nav-button prev-button"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          data-testid="prev-button"
        >
          ← Предыдущий
        </button>
        <button
          className="nav-button next-button"
          onClick={handleNext}
          disabled={!hasAnswered}
          data-testid="next-button"
        >
          {currentQuestionIndex === questions.length - 1 ? 'Завершить тест →' : 'Следующий →'}
        </button>
      </div>
    </div>
  );
}

export default QuizContainer;



