#!/bin/bash

# Скрипт для запуска всего проекта одной командой
# Запускает backend (Flask) и frontend (React) одновременно

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
BACKEND_PID=""
FRONTEND_PID=""

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

echo -e "\n${GREEN}✅ Оба сервера запущены!${NC}"
echo -e "${BLUE}📍 Backend: http://localhost:5001${NC}"
echo -e "${BLUE}📍 Frontend: http://localhost:3000${NC}"
echo -e "\n${YELLOW}Для остановки нажмите Ctrl+C${NC}"
echo -e "${YELLOW}Логи backend: backend.log${NC}"
echo -e "${YELLOW}Логи frontend: frontend.log${NC}\n"

# Ожидание завершения процессов
wait $BACKEND_PID $FRONTEND_PID

