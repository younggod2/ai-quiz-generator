#!/bin/bash

# Скрипт для запуска всего проекта одной командой
# Запускает Ollama (если необходимо), backend (Flask) и frontend (React) одновременно

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Запуск PDF Quiz Generator...${NC}\n"

# Получаем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Переменные для хранения PID процессов
OLLAMA_PID=""
BACKEND_PID=""
FRONTEND_PID=""
OLLAMA_STARTED_BY_SCRIPT=false

# Функция для очистки при выходе
cleanup() {
    echo -e "\n${YELLOW}🛑 Остановка серверов...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        # Дополнительно убиваем все процессы node в frontend директории
        pkill -f "react-scripts" 2>/dev/null || true
    fi
    if [ "$OLLAMA_STARTED_BY_SCRIPT" = true ] && [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null || true
        # Дополнительно убиваем процессы ollama serve
        pkill -f "ollama serve" 2>/dev/null || true
    fi
    exit
}

# Обработка сигналов для корректного завершения
trap cleanup SIGINT SIGTERM EXIT

# Проверка существования виртуального окружения backend
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}⚠️  Виртуальное окружение backend не найдено.${NC}"
    echo -e "${YELLOW}Создайте его командой: cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt${NC}"
    exit 1
fi

# Проверка установки зависимостей frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Зависимости frontend не установлены.${NC}"
    echo -e "${YELLOW}Устанавливаю зависимости frontend...${NC}"
    cd frontend
    if ! npm install; then
        echo -e "${YELLOW}❌ Ошибка при установке зависимостей frontend${NC}"
        exit 1
    fi
    cd ..
fi

# Проверка и запуск Ollama
echo -e "${GREEN}🤖 Проверка Ollama...${NC}"

# Проверяем, установлен ли Ollama
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}⚠️  Ollama не установлен.${NC}"
    echo -e "${YELLOW}Для использования локальной модели Mistral установите Ollama: https://ollama.ai${NC}"
    echo -e "${YELLOW}Продолжаю запуск без Ollama (будут доступны только облачные модели)...${NC}\n"
else
    # Функция для проверки доступности Ollama сервера
    check_ollama_available() {
        # Метод 1: Проверка через curl (предпочтительный)
        if command -v curl &> /dev/null; then
            if curl -s --connect-timeout 2 http://localhost:11434/api/tags > /dev/null 2>&1; then
                return 0
            fi
        fi
        
        # Метод 2: Проверка порта через netcat (nc)
        if command -v nc &> /dev/null; then
            if nc -z localhost 11434 2>/dev/null; then
                return 0
            fi
        fi
        
        # Метод 3: Проверка порта через встроенные возможности bash (если доступно)
        # Используем timeout для ограничения времени ожидания
        if command -v timeout &> /dev/null; then
            if timeout 1 bash -c "echo > /dev/tcp/localhost/11434" 2>/dev/null; then
                return 0
            fi
        fi
        
        # Метод 4: Проверка процесса (менее надежно, но лучше чем ничего)
        if pgrep -f "ollama serve" > /dev/null 2>&1; then
            return 0
        fi
        
        return 1
    }
    
    # Проверяем, запущен ли Ollama сервер
    OLLAMA_AVAILABLE=false
    if check_ollama_available; then
        OLLAMA_AVAILABLE=true
    fi
    
    if [ "$OLLAMA_AVAILABLE" = false ]; then
        echo -e "${YELLOW}🔄 Ollama сервер не запущен. Запускаю Ollama...${NC}"
        ollama serve > ollama.log 2>&1 &
        OLLAMA_PID=$!
        OLLAMA_STARTED_BY_SCRIPT=true
        
        # Ждем, пока Ollama запустится (до 10 секунд)
        echo -e "${YELLOW}⏳ Ожидание запуска Ollama...${NC}"
        for i in {1..10}; do
            sleep 1
            if check_ollama_available; then
                OLLAMA_AVAILABLE=true
                echo -e "${GREEN}✅ Ollama запущен${NC}"
                break
            fi
        done
        
        if [ "$OLLAMA_AVAILABLE" = false ]; then
            echo -e "${YELLOW}⚠️  Не удалось запустить Ollama. Проверьте логи: ollama.log${NC}"
            echo -e "${YELLOW}Продолжаю запуск без Ollama (будут доступны только облачные модели)...${NC}\n"
        fi
    else
        echo -e "${GREEN}✅ Ollama уже запущен${NC}"
    fi
    
    # Проверяем наличие модели mistral
    if [ "$OLLAMA_AVAILABLE" = true ]; then
        MISTRAL_FOUND=false
        if command -v curl &> /dev/null; then
            if curl -s http://localhost:11434/api/tags 2>/dev/null | grep -q "mistral"; then
                MISTRAL_FOUND=true
            fi
        else
            # Если curl недоступен, пытаемся проверить через команду ollama list
            if ollama list 2>/dev/null | grep -q "mistral"; then
                MISTRAL_FOUND=true
            fi
        fi
        
        if [ "$MISTRAL_FOUND" = true ]; then
            echo -e "${GREEN}✅ Модель mistral найдена${NC}\n"
        else
            echo -e "${YELLOW}⚠️  Модель mistral не найдена.${NC}"
            echo -e "${YELLOW}Загружаю модель mistral (это может занять некоторое время)...${NC}"
            if ollama pull mistral; then
                echo -e "${GREEN}✅ Модель mistral успешно загружена${NC}\n"
            else
                echo -e "${YELLOW}⚠️  Не удалось загрузить модель mistral.${NC}"
                echo -e "${YELLOW}Загрузите её вручную командой: ollama pull mistral${NC}\n"
            fi
        fi
    fi
fi

# Запуск backend
echo -e "${GREEN}📦 Запуск backend сервера (Flask на порту 5001)...${NC}"
cd backend
source venv/bin/activate
python app.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Небольшая задержка перед запуском frontend
sleep 2

# Проверка, что backend запустился
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${YELLOW}❌ Ошибка при запуске backend. Проверьте логи: backend.log${NC}"
    exit 1
fi

# Запуск frontend
echo -e "${GREEN}⚛️  Запуск frontend сервера (React на порту 3000)...${NC}"
cd frontend
BROWSER=none npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Небольшая задержка для запуска frontend
sleep 3

echo -e "\n${GREEN}✅ Все серверы запущены!${NC}"
if [ "$OLLAMA_STARTED_BY_SCRIPT" = true ]; then
    echo -e "${BLUE}📍 Ollama: http://localhost:11434${NC}"
fi
echo -e "${BLUE}📍 Backend: http://localhost:5001${NC}"
echo -e "${BLUE}📍 Frontend: http://localhost:3000${NC}"
echo -e "\n${YELLOW}Для остановки нажмите Ctrl+C${NC}"
if [ "$OLLAMA_STARTED_BY_SCRIPT" = true ]; then
    echo -e "${YELLOW}Логи Ollama: ollama.log${NC}"
fi
echo -e "${YELLOW}Логи backend: backend.log${NC}"
echo -e "${YELLOW}Логи frontend: frontend.log${NC}\n"

# Ожидание завершения процессов
if [ "$OLLAMA_STARTED_BY_SCRIPT" = true ] && [ ! -z "$OLLAMA_PID" ]; then
    wait $OLLAMA_PID $BACKEND_PID $FRONTEND_PID
else
    wait $BACKEND_PID $FRONTEND_PID
fi

