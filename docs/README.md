# Документация проекта Quiz Generator

## О документации

**Статус перевода:** Документация в процессе перевода на русский язык. В текущий момент большая часть документов представлена на английском языке с сохранением оригинальной структуры и форматирования.

## Структура документации

### Основные документы
- [system-overview.md](system-overview.md) - Обзор системы
- [technology-stack.md](technology-stack.md) - Технологический стек
- [getting-started.md](getting-started.md) - Начало работы
- [configuration-management.md](configuration-management.md) - Управление конфигурацией
- [testing-strategy.md](testing-strategy.md) - Стратегия тестирования
- [deployment-workflow.md](deployment-workflow.md) - Процесс развертывания
- [contributing-guide.md](contributing-guide.md) - Руководство по внесению вклада
- [troubleshooting-guide.md](troubleshooting-guide.md) - Устранение неполадок

### API документация
- [api-reference/](api-reference/) - Справочник API
  - [api-reference.md](api-reference/api-reference.md) - Общая информация об API
  - [health-check-endpoint.md](api-reference/health-check-endpoint.md) - Эндпоинт проверки здоровья
  - [pdf-upload-endpoint.md](api-reference/pdf-upload-endpoint.md) - Эндпоинт загрузки PDF
  - [text-processing-endpoint.md](api-reference/text-processing-endpoint.md) - Эндпоинт обработки текста

### Архитектура Backend
- [backend-architecture/](backend-architecture/) - Архитектура бэкенда
  - [backend-architecture.md](backend-architecture/backend-architecture.md) - Обзор архитектуры
  - [api-endpoints.md](backend-architecture/api-endpoints.md) - API endpoints
  - [error-handling-strategy.md](backend-architecture/error-handling-strategy.md) - Стратегия обработки ошибок
  - [model-processing/](backend-architecture/model-processing/) - Обработка моделей
    - [model-client-implementation.md](backend-architecture/model-processing/model-client-implementation.md)
    - [model-processing.md](backend-architecture/model-processing/model-processing.md)
    - [pdf-processing-module.md](backend-architecture/model-processing/pdf-processing-module.md)

### Архитектура Frontend
- [frontend-architecture/](frontend-architecture/) - Архитектура фронтенда
  - [frontend-architecture.md](frontend-architecture/frontend-architecture.md) - Обзор архитектуры
  - [component-hierarchy.md](frontend-architecture/component-hierarchy.md) - Иерархия компонентов
  - [state-management.md](frontend-architecture/state-management.md) - Управление состоянием
  - [api-integration.md](frontend-architecture/api-integration.md) - Интеграция с API
  - [ui-components/](frontend-architecture/ui-components/) - UI компоненты
    - [ui-components.md](frontend-architecture/ui-components/ui-components.md)
    - [pdfuploader-component.md](frontend-architecture/ui-components/pdfuploader-component.md)
    - [quizcard-component.md](frontend-architecture/ui-components/quizcard-component.md)
    - [quizcontainer-component.md](frontend-architecture/ui-components/quizcontainer-component.md)

### Pipeline обработки данных
- [data-processing-pipeline/](data-processing-pipeline/) - Pipeline обработки данных
  - [data-processing-pipeline.md](data-processing-pipeline/data-processing-pipeline.md) - Обзор pipeline
  - [pdf-processing.md](data-processing-pipeline/pdf-processing.md) - Обработка PDF
  - [ai-model-abstraction-layer.md](data-processing-pipeline/ai-model-abstraction-layer.md) - Слой абстракции AI моделей
  - [quiz-generation-pipeline.md](data-processing-pipeline/quiz-generation-pipeline.md) - Pipeline генерации квизов

## Для контрибьюторов

Если вы хотите помочь с переводом документации на русский язык:

1. Выберите документ для перевода
2. Создайте ветку для перевода: `git checkout -b docs/translate-<название-документа>`
3. Переведите содержимое, сохраняя:
   - Markdown форматирование
   - Блоки кода (без изменений)
   - Технические термины (используйте общепринятые русские эквиваленты)
   - Ссылки на файлы проекта
4. Создайте Pull Request с описанием выполненного перевода

## Примечания

- Все примеры кода остаются на английском языке
- Технические идентификаторы (имена переменных, функций, классов) не переводятся
- Пути к файлам и команды оболочки сохраняются в оригинальном виде
- Диаграммы Mermaid могут быть переведены при необходимости

## История изменений

- **2025-01-02**: Первоначальный перенос документации из `.qoder/repowiki/en/content/` в `docs/`
