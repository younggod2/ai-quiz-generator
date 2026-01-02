# Сравнение Flask и FastAPI на примере проекта Quiz

## Архитектурные различия

### Flask (текущий проект)

**Подход:** Минималистичный, гибкий фреймворк с декораторами

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})
```

**Особенности:**
- Императивный стиль (как делать)
- Ручная валидация данных
- Ручная обработка ошибок
- Декораторы для маршрутизации
- Глобальный объект `request` (thread-local)

### FastAPI (альтернатива)

**Подход:** Современный, основанный на типах и стандартах

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class HealthResponse(BaseModel):
    status: str

@app.get('/api/health', response_model=HealthResponse)
def health_check():
    return {"status": "ok"}
```

**Особенности:**
- Декларативный стиль (что делать)
- Автоматическая валидация через Pydantic
- Автоматическая документация (OpenAPI/Swagger)
- Type hints для валидации
- Асинхронная поддержка из коробки

---

## Детальное сравнение по категориям

### 1. Валидация данных

#### Flask (текущая реализация)

```python
@app.route('/api/process-text', methods=['POST'])
def process_text():
    try:
        data = request.get_json()
        
        # Ручная проверка наличия данных
        if not data or 'text' not in data:
            return jsonify({"error": "Текст не найден в запросе"}), 400
        
        text = data.get('text', '').strip()
        
        # Ручная валидация
        if not text:
            return jsonify({"error": "Текст не может быть пустым"}), 400
        
        # Ручная конвертация и проверка типов
        try:
            num_questions = int(data.get('num_questions', 0))
        except (ValueError, TypeError):
            num_questions = 0
```

**Проблемы:**
- Много повторяющегося кода
- Легко забыть валидацию
- Нет автоматической документации
- Ошибки валидации обрабатываются вручную

#### FastAPI (альтернативная реализация)

```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class ProcessTextRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Текст для обработки")
    num_questions: int = Field(1, ge=1, le=20, description="Количество вопросов")
    model_type: str = Field("openrouter", regex="^(openrouter|ollama-mistral)$")
    
    @validator('text')
    def text_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Текст не может быть пустым')
        return v.strip()

@app.post('/api/process-text')
async def process_text(request: ProcessTextRequest):
    # Данные уже валидированы автоматически!
    text_content = {
        "text": request.text,
        "images": [],
        "total_pages": 0
    }
    questions = _generate_quiz_from_content(text_content, request.num_questions, request.model_type)
    return {"success": True, "questions": questions}
```

**Преимущества:**
- Автоматическая валидация
- Автоматическая документация
- Type safety
- Меньше кода

---

### 2. Обработка файлов

#### Flask (текущая реализация)

```python
@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    # Ручная проверка наличия файла
    if 'file' not in request.files:
        return jsonify({"error": "Файл не найден в запросе"}), 400
    
    file = request.files['file']
    
    # Ручная валидация
    if file.filename == '':
        return jsonify({"error": "Файл не выбран"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Разрешены только PDF файлы"}), 400
    
    # Ручная обработка
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
```

#### FastAPI (альтернативная реализация)

```python
from fastapi import UploadFile, File, Form
from fastapi.exceptions import HTTPException

@app.post('/api/upload-pdf')
async def upload_pdf(
    file: UploadFile = File(..., description="PDF файл для обработки"),
    num_questions: int = Form(1, ge=1, le=20),
    model_type: str = Form("openrouter")
):
    # Валидация расширения
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Разрешены только PDF файлы")
    
    # Асинхронная обработка
    contents = await file.read()
    # Сохранение файла...
```

**Преимущества FastAPI:**
- Встроенная поддержка UploadFile
- Асинхронная обработка файлов
- Лучшая производительность для I/O операций

---

### 3. Обработка ошибок

#### Flask (текущая реализация)

```python
@app.route('/api/upload-pdf', methods=['POST'])
def upload_pdf():
    try:
        # ... код обработки ...
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Ошибка при обработке запроса: {str(e)}"}), 500
```

**Проблемы:**
- Дублирование обработки ошибок в каждом эндпоинте
- Нет централизованной обработки
- Нет стандартизированных форматов ошибок

#### FastAPI (альтернативная реализация)

```python
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# Централизованная обработка ошибок
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": str(exc)}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"error": "Ошибка валидации", "details": exc.errors()}
    )

@app.post('/api/upload-pdf')
async def upload_pdf(...):
    # Ошибки обрабатываются автоматически
    if not file:
        raise HTTPException(status_code=400, detail="Файл не найден")
```

**Преимущества:**
- Централизованная обработка
- Стандартизированные форматы
- Автоматическая обработка валидационных ошибок

---

### 4. Документация API

#### Flask

**Текущая ситуация:**
- Нет автоматической документации
- Нужно писать документацию вручную
- Нет интерактивного тестирования

**Решение (с расширениями):**
```python
from flasgger import Swagger

app.config['SWAGGER'] = {
    'title': 'Quiz API',
    'version': '1.0'
}
swagger = Swagger(app)
```

#### FastAPI

**Автоматическая документация:**
- `/docs` - Swagger UI (интерактивная документация)
- `/redoc` - ReDoc (альтернативная документация)
- `/openapi.json` - OpenAPI схема

```python
@app.post(
    '/api/process-text',
    response_model=ProcessTextResponse,
    summary="Обработка текста",
    description="Генерирует вопросы теста из текста",
    tags=["Text Processing"]
)
async def process_text(request: ProcessTextRequest):
    ...
```

**Преимущества:**
- Автоматическая генерация
- Всегда актуальная
- Интерактивное тестирование
- Экспорт в Postman/Insomnia

---

### 5. Производительность

#### Flask

- **Синхронный:** Один запрос = один поток
- **Асинхронность:** Требует расширений (Flask-AsyncIO, Quart)
- **Производительность:** Хорошая для синхронных операций

```python
# Синхронный код
@app.route('/api/process-text', methods=['POST'])
def process_text():
    # Блокирующие операции
    questions = _generate_quiz_from_content(...)
    return jsonify({"questions": questions})
```

#### FastAPI

- **Асинхронный:** Нативная поддержка async/await
- **Производительность:** Выше для I/O операций
- **Concurrency:** Лучше обрабатывает множество одновременных запросов

```python
# Асинхронный код
@app.post('/api/process-text')
async def process_text(request: ProcessTextRequest):
    # Неблокирующие операции
    questions = await _generate_quiz_from_content_async(...)
    return {"questions": questions}
```

**Бенчмарки (примерные):**
- Flask: ~10,000 запросов/сек (синхронно)
- FastAPI: ~20,000+ запросов/сек (асинхронно)

---

### 6. Type Hints и IDE поддержка

#### Flask

```python
# Нет type hints для request/response
@app.route('/api/process-text', methods=['POST'])
def process_text():
    data = request.get_json()  # Тип неизвестен IDE
    text = data.get('text')     # IDE не знает структуру
    return jsonify({...})        # Нет проверки типов
```

**Проблемы:**
- Нет автодополнения
- Нет проверки типов
- Больше ошибок в runtime

#### FastAPI

```python
# Полная поддержка type hints
@app.post('/api/process-text', response_model=ProcessTextResponse)
async def process_text(request: ProcessTextRequest) -> ProcessTextResponse:
    # IDE знает все типы!
    text: str = request.text  # Автодополнение работает
    return ProcessTextResponse(...)  # Проверка типов
```

**Преимущества:**
- Автодополнение в IDE
- Проверка типов (mypy)
- Меньше ошибок
- Лучшая читаемость

---

## Миграция с Flask на FastAPI

### Пример миграции эндпоинта `/api/health`

**Flask:**
```python
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})
```

**FastAPI:**
```python
class HealthResponse(BaseModel):
    status: str

@app.get('/api/health', response_model=HealthResponse)
async def health_check():
    return {"status": "ok"}
```

### Пример миграции `/api/process-text`

**Flask (текущий код):**
```python
@app.route('/api/process-text', methods=['POST'])
def process_text():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Текст не найден"}), 400
        text = data.get('text', '').strip()
        if not text:
            return jsonify({"error": "Текст не может быть пустым"}), 400
        num_questions = int(data.get('num_questions', 0))
        model_type = data.get('model_type', 'openrouter')
        # ... обработка ...
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Ошибка: {str(e)}"}), 500
```

**FastAPI (мигрированный код):**
```python
class ProcessTextRequest(BaseModel):
    text: str = Field(..., min_length=1)
    num_questions: int = Field(1, ge=1, le=20)
    model_type: Literal["openrouter", "ollama-mistral"] = "openrouter"

class ProcessTextResponse(BaseModel):
    success: bool
    questions: List[Dict]
    total_questions: int

@app.post('/api/process-text', response_model=ProcessTextResponse)
async def process_text(request: ProcessTextRequest):
    text_content = {
        "text": request.text,
        "images": [],
        "total_pages": 0
    }
    questions = await _generate_quiz_from_content_async(
        text_content, 
        request.num_questions, 
        request.model_type
    )
    return ProcessTextResponse(
        success=True,
        questions=questions,
        total_questions=len(questions)
    )
```

---

## Когда использовать Flask?

✅ **Используйте Flask, если:**
- Простой проект без сложной валидации
- Команда уже знает Flask
- Нужна максимальная гибкость
- Проект небольшой и не требует документации
- Синхронные операции достаточны

**Примеры:**
- Простые REST API
- Микросервисы с простой логикой
- Прототипирование

---

## Когда использовать FastAPI?

✅ **Используйте FastAPI, если:**
- Нужна автоматическая документация API
- Важна производительность (много I/O операций)
- Нужна строгая валидация данных
- Команда использует type hints
- Нужна асинхронная обработка
- API будет использоваться внешними клиентами

**Примеры:**
- Современные REST API
- Микросервисы с высокой нагрузкой
- API для мобильных приложений
- Интеграции с внешними сервисами

---

## Выводы для проекта Quiz

### Текущее состояние (Flask):
- ✅ Работает стабильно
- ✅ Простой и понятный код
- ❌ Много ручной валидации
- ❌ Нет автоматической документации
- ❌ Синхронная обработка (может быть узким местом)

### Потенциальные улучшения с FastAPI:
- ✅ Автоматическая валидация (меньше кода)
- ✅ Автоматическая документация API
- ✅ Асинхронная обработка PDF (лучше производительность)
- ✅ Type safety (меньше ошибок)
- ✅ Лучшая поддержка IDE

### Рекомендация:
Для проекта Quiz **FastAPI был бы лучшим выбором**, так как:
1. Обработка PDF - I/O операция (выигрыш от async)
2. Генерация вопросов через API - может быть долгой (async помогает)
3. Валидация параметров - много повторяющегося кода (Pydantic упростит)
4. Документация API - полезна для фронтенд разработчиков

Однако текущая реализация на Flask **полностью рабочая** и не требует срочной миграции, если нет проблем с производительностью.

