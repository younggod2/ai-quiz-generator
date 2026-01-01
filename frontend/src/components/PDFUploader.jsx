import React, { useState } from 'react';
import axios from 'axios';
import './PDFUploader.css';

function PDFUploader({ onQuizGenerated, onError, onLoading, loading }) {
  const [inputMode, setInputMode] = useState('pdf'); // 'pdf' или 'text'
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [numQuestionsInput, setNumQuestionsInput] = useState('10');
  const [selectedModel, setSelectedModel] = useState('openrouter');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        onError('Пожалуйста, загрузите файл в формате PDF');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        onError('Пожалуйста, выберите файл в формате PDF');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (inputMode === 'pdf') {
      if (!file) {
        onError('Пожалуйста, выберите PDF файл');
        return;
      }
    } else {
      if (!text.trim()) {
        onError('Пожалуйста, введите текст');
        return;
      }
    }

    if (numQuestions < 1 || numQuestions > 20) {
      onError('Количество вопросов должно быть от 1 до 20');
      return;
    }

    onLoading(true);
    onError(null);

    try {
      let response;
      
      if (inputMode === 'pdf') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('num_questions', numQuestions);
        formData.append('model_type', selectedModel);

        response = await axios.post('/api/upload-pdf', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await axios.post('/api/process-text', {
          text: text,
          num_questions: numQuestions,
          model_type: selectedModel
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      if (response.data.success) {
        onQuizGenerated(response.data);
      } else {
        onError(response.data.error || 'Ошибка при генерации теста');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка при обработке запроса';
      onError(errorMessage);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="pdf-uploader">
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label className="form-label">
            Режим ввода:
          </label>
          <div className="input-mode-selector">
            <label className="mode-option">
              <input
                type="radio"
                name="inputMode"
                value="pdf"
                checked={inputMode === 'pdf'}
                onChange={(e) => {
                  setInputMode(e.target.value);
                  setFile(null);
                  setText('');
                }}
                disabled={loading}
              />
              <span className="mode-label">
                <span className="mode-name">📄 PDF файл</span>
              </span>
            </label>
            <label className="mode-option">
              <input
                type="radio"
                name="inputMode"
                value="text"
                checked={inputMode === 'text'}
                onChange={(e) => {
                  setInputMode(e.target.value);
                  setFile(null);
                  setText('');
                }}
                disabled={loading}
              />
              <span className="mode-label">
                <span className="mode-name">📝 Текст</span>
              </span>
            </label>
          </div>
        </div>

        {inputMode === 'pdf' ? (
          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              accept=".pdf"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="file-input" className="drop-zone-label">
              {file ? (
                <>
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <span className="upload-icon">📤</span>
                  <span className="upload-text">
                    Перетащите PDF файл сюда или нажмите для выбора
                  </span>
                </>
              )}
            </label>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="text-input" className="form-label">
              Введите текст:
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="text-input"
              placeholder="Вставьте или введите текст для генерации теста..."
              rows={10}
              disabled={loading}
            />
            <div className="text-counter">
              {text.length} символов
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="num-questions" className="form-label">
            Количество вопросов:
          </label>
          <input
            type="number"
            id="num-questions"
            min="1"
            max="20"
            value={numQuestionsInput}
            onChange={(e) => {
              const value = e.target.value;
              setNumQuestionsInput(value);
              const numValue = parseInt(value);
              if (!isNaN(numValue) && value !== '') {
                setNumQuestions(numValue);
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value === '' || isNaN(parseInt(value))) {
                setNumQuestionsInput('10');
                setNumQuestions(10);
              } else {
                const numValue = parseInt(value);
                if (numValue < 1) {
                  setNumQuestionsInput('1');
                  setNumQuestions(1);
                } else if (numValue > 20) {
                  setNumQuestionsInput('20');
                  setNumQuestions(20);
                }
              }
            }}
            className="number-input"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Модель для генерации:
          </label>
          <div className="model-selector">
            <label className="model-option">
              <input
                type="radio"
                name="model"
                value="openrouter"
                checked={selectedModel === 'openrouter'}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={loading}
              />
              <span className="model-label">
                <span className="model-name">OpenRouter</span>
                <span className="model-description">GPT-4o-mini/GPT-4o (облако)</span>
              </span>
            </label>
            <label className="model-option">
              <input
                type="radio"
                name="model"
                value="ollama-mistral"
                checked={selectedModel === 'ollama-mistral'}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={loading}
              />
              <span className="model-label">
                <span className="model-name">Mistral 7B</span>
                <span className="model-description">Локально через Ollama</span>
              </span>
            </label>
          </div>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-text">
              <span className="loading-icon">⏳</span>
              <span>Генерация теста...</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar"></div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={(inputMode === 'pdf' && !file) || (inputMode === 'text' && !text.trim()) || loading}
        >
          🚀 Создать тест
        </button>
      </form>
    </div>
  );
}

export default PDFUploader;



