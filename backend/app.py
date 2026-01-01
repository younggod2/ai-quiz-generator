from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from werkzeug.utils import secure_filename
from pdf_processor import process_pdf
from model_client import create_model_client

app = Flask(__name__)
CORS(app)

# Настройки для загрузки файлов
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE


def allowed_file(filename):
    """Проверяет, что файл имеет разрешенное расширение."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _validate_quiz_parameters(num_questions, model_type):
    """Валидирует параметры для генерации теста."""
    if not num_questions or num_questions < 1:
        raise ValueError("Количество вопросов должно быть положительным числом")
    
    if num_questions > 20:
        raise ValueError("Максимальное количество вопросов - 20")
    
    valid_models = ['openrouter', 'ollama-mistral']
    if model_type not in valid_models:
        raise ValueError(f"Неизвестный тип модели. Доступные: {', '.join(valid_models)}")
    
    return True


def _generate_quiz_from_content(content, num_questions, model_type):
    """Генерирует вопросы из контента."""
    # Валидация параметров
    _validate_quiz_parameters(num_questions, model_type)
    
    # Создаем клиент модели и генерируем вопросы
    model_client = create_model_client(model_type)
    questions = model_client.generate_quiz_questions(content, num_questions)
    
    return questions


@app.route('/api/health', methods=['GET'])
def health_check():
    """Проверка работоспособности API."""
    return jsonify({"status": "ok"})


@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    """Обрабатывает загруженный PDF и генерирует тест."""
    try:
        # Проверяем наличие файла
        if 'file' not in request.files:
            return jsonify({"error": "Файл не найден в запросе"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "Файл не выбран"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Разрешены только PDF файлы"}), 400
        
        # Получаем количество вопросов
        try:
            num_questions = int(request.form.get('num_questions', 0))
        except (ValueError, TypeError):
            num_questions = 0
        # Получаем тип модели (по умолчанию openrouter)
        model_type = request.form.get('model_type', 'openrouter')
        
        # Сохраняем файл временно
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Обрабатываем PDF
            pdf_content = process_pdf(filepath)
            
            # Проверяем, что PDF не пустой
            if not pdf_content.get("text") and not pdf_content.get("images"):
                return jsonify({"error": "PDF документ пуст или не может быть обработан"}), 400
            
            # Генерируем вопросы (валидация параметров внутри функции)
            questions = _generate_quiz_from_content(pdf_content, num_questions, model_type)
            
            # Удаляем временный файл
            os.remove(filepath)
            
            return jsonify({
                "success": True,
                "questions": questions,
                "total_questions": len(questions)
            })
            
        except Exception as e:
            # Удаляем временный файл в случае ошибки
            if os.path.exists(filepath):
                os.remove(filepath)
            raise e
            
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Ошибка при обработке запроса: {str(e)}"}), 500


@app.route('/api/process-text', methods=['POST'])
def process_text():
    """Обрабатывает вставленный текст и генерирует тест."""
    try:
        data = request.get_json()
        
        # Проверяем наличие текста
        if not data or 'text' not in data:
            return jsonify({"error": "Текст не найден в запросе"}), 400
        
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({"error": "Текст не может быть пустым"}), 400
        
        # Получаем количество вопросов
        try:
            num_questions = int(data.get('num_questions', 0))
        except (ValueError, TypeError):
            num_questions = 0
        
        # Получаем тип модели (по умолчанию openrouter)
        model_type = data.get('model_type', 'openrouter')
        
        # Формируем контент в том же формате, что и для PDF
        text_content = {
            "text": text,
            "images": [],  # Текстовый режим не поддерживает изображения
            "total_pages": 0
        }
        
        # Генерируем вопросы (валидация параметров внутри функции)
        questions = _generate_quiz_from_content(text_content, num_questions, model_type)
        
        return jsonify({
            "success": True,
            "questions": questions,
            "total_questions": len(questions)
        })
            
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Ошибка при обработке запроса: {str(e)}"}), 500


if __name__ == '__main__':
    # Проверяем наличие API ключа (только для OpenRouter)
    if not os.getenv("OPENROUTER_API_KEY"):
        print("ВНИМАНИЕ: OPENROUTER_API_KEY не установлен. Создайте файл .env в папке backend с переменной OPENROUTER_API_KEY=your_key")
        print("Примечание: Для использования локальной Mistral через Ollama API ключ не требуется.")
    
    app.run(debug=True, port=5001)



