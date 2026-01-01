.PHONY: help install test test-ui test-smoke start clean setup-hooks check

# Цвета для вывода
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
RED=\033[0;31m
NC=\033[0m

help: ## Показать справку по командам
	@echo "$(BLUE)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

check: ## Проверить установку зависимостей
	@echo "$(BLUE)🔍 Проверка установки...$(NC)"
	@test -d node_modules || (echo "$(RED)❌ Корневые зависимости не установлены. Запустите: make install$(NC)" && exit 1)
	@test -d frontend/node_modules || (echo "$(RED)❌ Frontend зависимости не установлены. Запустите: make install$(NC)" && exit 1)
	@test -d backend/venv || (echo "$(RED)❌ Backend виртуальное окружение не создано. Запустите: make install$(NC)" && exit 1)
	@echo "$(GREEN)✅ Все зависимости установлены$(NC)"

install: ## Установить все зависимости (backend + frontend)
	@echo "$(BLUE)📦 Установка всех зависимостей...$(NC)"
	@npm run install:all

start: check ## Запустить приложение (backend + frontend)
	@echo "$(BLUE)🚀 Запуск приложения...$(NC)"
	@npm start

test: ## Запустить E2E тесты
	@echo "$(BLUE)🧪 Запуск E2E тестов...$(NC)"
	@npm run test:e2e

test-ui: ## Запустить E2E тесты в UI режиме
	@echo "$(BLUE)🧪 Запуск E2E тестов в UI режиме...$(NC)"
	@npm run test:e2e:ui

test-smoke: ## Запустить smoke тесты (читает ключи из backend/.env)
	@echo "$(BLUE)🧪 Запуск smoke тестов...$(NC)"
	@if [ -f backend/.env ]; then \
		api_key=$$(grep -E '^OPENROUTER_API_KEY=' backend/.env | cut -d '=' -f2- | tr -d ' '); \
		ollama_enabled=$$(grep -E '^ENABLE_OLLAMA_TESTS=' backend/.env | cut -d '=' -f2- | tr -d ' '); \
		has_api_key=0; \
		has_ollama=0; \
		if [ -n "$$api_key" ]; then \
			echo "$(GREEN)✅ Найден OPENROUTER_API_KEY в backend/.env$(NC)"; \
			has_api_key=1; \
		fi; \
		if [ -n "$$ollama_enabled" ] && [ "$$ollama_enabled" = "true" ]; then \
			echo "$(GREEN)✅ Найден ENABLE_OLLAMA_TESTS в backend/.env$(NC)"; \
			has_ollama=1; \
		fi; \
		if [ $$has_api_key -eq 0 ] && [ $$has_ollama -eq 0 ]; then \
			echo "$(YELLOW)⚠️  В backend/.env не найден OPENROUTER_API_KEY или ENABLE_OLLAMA_TESTS$(NC)"; \
			echo "$(YELLOW)   Добавьте в backend/.env:$(NC)"; \
			echo "$(YELLOW)   OPENROUTER_API_KEY=your_key$(NC)"; \
			echo "$(YELLOW)   или$(NC)"; \
			echo "$(YELLOW)   ENABLE_OLLAMA_TESTS=true$(NC)"; \
			exit 1; \
		fi; \
		if [ $$has_api_key -eq 1 ] && [ $$has_ollama -eq 1 ]; then \
			OPENROUTER_API_KEY=$$api_key ENABLE_OLLAMA_TESTS=true npm run test:e2e:smoke; \
		elif [ $$has_api_key -eq 1 ]; then \
			OPENROUTER_API_KEY=$$api_key npm run test:e2e:smoke; \
		else \
			ENABLE_OLLAMA_TESTS=true npm run test:e2e:smoke; \
		fi; \
	else \
		echo "$(RED)❌ Файл backend/.env не найден$(NC)"; \
		echo "$(YELLOW)   Создайте файл backend/.env с:$(NC)"; \
		echo "$(YELLOW)   OPENROUTER_API_KEY=your_key$(NC)"; \
		echo "$(YELLOW)   или$(NC)"; \
		echo "$(YELLOW)   ENABLE_OLLAMA_TESTS=true$(NC)"; \
		exit 1; \
	fi

generate-test-pdf: ## Сгенерировать тестовый PDF
	@echo "$(BLUE)📄 Генерация тестового PDF...$(NC)"
	@npm run generate-test-pdf

clean: ## Очистить временные файлы и логи
	@echo "$(YELLOW)🧹 Очистка временных файлов...$(NC)"
	@rm -f backend.log frontend.log ollama.log
	@rm -rf frontend/test-results frontend/playwright-report
	@find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true

setup-hooks: ## Установить Git hooks
	@echo "$(BLUE)🔧 Установка Git hooks...$(NC)"
	@chmod +x .git/hooks/pre-commit .git/hooks/pre-push
	@echo "$(GREEN)✅ Git hooks установлены$(NC)"
	@echo "$(YELLOW)💡 pre-commit: быстрая проверка синтаксиса$(NC)"
	@echo "$(YELLOW)💡 pre-push: полный запуск E2E тестов$(NC)"

