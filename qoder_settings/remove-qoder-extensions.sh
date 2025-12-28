#!/bin/bash
# Скрипт для удаления расширений CMAKE и Phind из Qoder

QODER_EXT_DIR="$HOME/.qoder/extensions"
EXTENSIONS_JSON="$QODER_EXT_DIR/extensions.json"

echo "=== Удаление расширений CMAKE и Phind из Qoder ==="
echo ""

# Проверяем наличие файла
if [ ! -f "$EXTENSIONS_JSON" ]; then
    echo "❌ Файл extensions.json не найден: $EXTENSIONS_JSON"
    exit 1
fi

# Удаляем папки расширений
echo "🗑️  Удаление папок расширений..."
rm -rf "$QODER_EXT_DIR/phind.phind-0.25.4"
rm -rf "$QODER_EXT_DIR/twxs.cmake-0.0.17"

echo "✓ Папки расширений удалены"
echo ""

# Удаляем записи из extensions.json
echo "📝 Обновление extensions.json..."

# Используем Python для удаления записей из JSON
python3 << 'PYTHON_SCRIPT'
import json
import sys

extensions_file = "/Users/denischekalin/.qoder/extensions/extensions.json"

try:
    with open(extensions_file, 'r', encoding='utf-8') as f:
        extensions = json.load(f)
    
    # Фильтруем расширения, удаляя phind и cmake
    filtered = [
        ext for ext in extensions 
        if ext['identifier']['id'] not in ['phind.phind', 'twxs.cmake']
    ]
    
    removed_count = len(extensions) - len(filtered)
    
    with open(extensions_file, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Удалено {removed_count} расширений из extensions.json")
    print(f"✓ Осталось {len(filtered)} расширений")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Готово! Расширения CMAKE и Phind удалены из Qoder."
    echo ""
    echo "💡 Теперь:"
    echo "   1. Перезапустите Qoder"
    echo "   2. Проверьте список расширений - CMAKE и Phind должны исчезнуть"
    echo "   3. При следующем импорте настроек из Cursor будут использоваться только расширения из Cursor"
else
    echo ""
    echo "❌ Произошла ошибка при обновлении extensions.json"
    exit 1
fi

