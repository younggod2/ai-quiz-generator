import React, { useState, useEffect } from 'react';
import './QuizCard.css';

function QuizCard({ question, questionNumber, totalQuestions, onAnswer, savedAnswer }) {
  // Восстанавливаем состояние из savedAnswer, если оно есть
  const [selectedAnswer, setSelectedAnswer] = useState(savedAnswer?.selectedIndex ?? null);
  const [showResult, setShowResult] = useState(savedAnswer !== undefined);

  // Обновляем состояние при изменении savedAnswer (при переключении между вопросами)
  useEffect(() => {
    if (savedAnswer !== undefined) {
      setSelectedAnswer(savedAnswer.selectedIndex);
      setShowResult(true);
    } else {
      setSelectedAnswer(null);
      setShowResult(false);
    }
  }, [savedAnswer]);

  const handleAnswerClick = (answerIndex) => {
    if (showResult) return; // Не позволяем менять ответ после проверки

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === question.correct_answer;

    // Сохраняем и индекс выбранного ответа, и правильность
    onAnswer({
      selectedIndex: answerIndex,
      isCorrect: isCorrect
    });
  };

  const getAnswerClass = (answerIndex) => {
    if (!showResult) return 'answer-option';
    
    const isSelected = selectedAnswer === answerIndex;
    const isCorrect = answerIndex === question.correct_answer;

    if (isSelected && isCorrect) {
      return 'answer-option correct';
    } else if (isSelected && !isCorrect) {
      return 'answer-option incorrect';
    } else if (!isSelected && isCorrect) {
      return 'answer-option correct-not-selected';
    }
    return 'answer-option';
  };

  return (
    <div className="quiz-card" data-testid="quiz-card">
      <div className="question-header">
        <span className="question-number" data-testid="question-number">
          Вопрос {questionNumber} из {totalQuestions}
        </span>
        <span className="question-type">
          Выберите один вариант
        </span>
      </div>

      <div className="question-text" data-testid="question-text">
        {question.question}
      </div>

      <div className="answers-container" data-testid="answers-container">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={getAnswerClass(index)}
            onClick={() => handleAnswerClick(index)}
            disabled={showResult}
            data-testid={`answer-option-${index}`}
          >
            <span className="option-letter">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="option-text">{option}</span>
            {showResult && index === question.correct_answer && (
              <span className="correct-mark">✓</span>
            )}
          </button>
        ))}
      </div>

      {showResult && (
        <div className={`result-message ${selectedAnswer === question.correct_answer ? 'correct' : 'incorrect'}`} data-testid="result-message">
          {selectedAnswer === question.correct_answer 
            ? '✅ Правильно!' 
            : '❌ Неправильно'}
        </div>
      )}
    </div>
  );
}

export default QuizCard;



