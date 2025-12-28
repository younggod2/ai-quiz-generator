import React, { useState } from 'react';
import './QuizCard.css';

function QuizCard({ question, questionNumber, totalQuestions, onAnswer }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswerClick = (answerIndex) => {
    if (showResult) return; // Не позволяем менять ответ после проверки

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = question.type === 'multiple_choice'
      ? answerIndex === question.correct_answer
      : answerIndex === (question.correct_answer ? 0 : 1);

    onAnswer(isCorrect);
  };

  const getAnswerClass = (answerIndex) => {
    if (!showResult) return 'answer-option';
    
    const isSelected = selectedAnswer === answerIndex;
    const isCorrect = question.type === 'multiple_choice'
      ? answerIndex === question.correct_answer
      : answerIndex === (question.correct_answer ? 0 : 1);

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
    <div className="quiz-card">
      <div className="question-header">
        <span className="question-number">
          Вопрос {questionNumber} из {totalQuestions}
        </span>
        <span className="question-type">
          {question.type === 'multiple_choice' ? 'Выберите один вариант' : 'Верно/Неверно'}
        </span>
      </div>

      <div className="question-text">
        {question.question}
      </div>

      <div className="answers-container">
        {question.type === 'multiple_choice' ? (
          question.options.map((option, index) => (
            <button
              key={index}
              className={getAnswerClass(index)}
              onClick={() => handleAnswerClick(index)}
              disabled={showResult}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
              {showResult && index === question.correct_answer && (
                <span className="correct-mark">✓</span>
              )}
            </button>
          ))
        ) : (
          <>
            <button
              className={getAnswerClass(0)}
              onClick={() => handleAnswerClick(0)}
              disabled={showResult}
            >
              <span className="option-text">Верно</span>
              {showResult && question.correct_answer && (
                <span className="correct-mark">✓</span>
              )}
            </button>
            <button
              className={getAnswerClass(1)}
              onClick={() => handleAnswerClick(1)}
              disabled={showResult}
            >
              <span className="option-text">Неверно</span>
              {showResult && !question.correct_answer && (
                <span className="correct-mark">✓</span>
              )}
            </button>
          </>
        )}
      </div>

      {showResult && (
        <div className={`result-message ${selectedAnswer === (question.type === 'multiple_choice' ? question.correct_answer : (question.correct_answer ? 0 : 1)) ? 'correct' : 'incorrect'}`}>
          {selectedAnswer === (question.type === 'multiple_choice' ? question.correct_answer : (question.correct_answer ? 0 : 1)) 
            ? '✅ Правильно!' 
            : '❌ Неправильно'}
        </div>
      )}
    </div>
  );
}

export default QuizCard;



