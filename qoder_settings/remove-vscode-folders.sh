#!/bin/bash
# Скрипт для удаления папок VS Code и VSCodium из Application Support

APP_SUPPORT="$HOME/Library/Application Support"
CODE_DIR="$APP_SUPPORT/Code"
VSCODIUM_DIR="$APP_SUPPORT/VSCodium"

echo "Проверка наличия папок VS Code и VSCodium..."

if [ -d "$CODE_DIR" ]; then
    echo "✓ Найдена папка: Code (VS Code)"
    read -p "Удалить папку Code? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$CODE_DIR"
        echo "✓ Папка Code удалена"
    else
        echo "✗ Папка Code не удалена"
    fi
else
    echo "✗ Папка Code не найдена"
fi

if [ -d "$VSCODIUM_DIR" ]; then
    echo "✓ Найдена папка: VSCodium"
    read -p "Удалить папку VSCodium? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$VSCODIUM_DIR"
        echo "✓ Папка VSCodium удалена"
    else
        echo "✗ Папка VSCodium не удалена"
    fi
else
    echo "✗ Папка VSCodium не найдена"
fi

echo ""
echo "Готово! Теперь при импорте настроек в Windsurf/Coder"
echo "будут использоваться файлы из папки Cursor."

