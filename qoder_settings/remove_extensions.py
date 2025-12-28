#!/usr/bin/env python3
import json
import os
import shutil

extensions_file = "/Users/denischekalin/.qoder/extensions/extensions.json"
extensions_dir = "/Users/denischekalin/.qoder/extensions"

# Расширения для удаления
extensions_to_remove = ['phind.phind', 'twxs.cmake']

try:
    # Читаем файл extensions.json
    with open(extensions_file, 'r', encoding='utf-8') as f:
        extensions = json.load(f)
    
    print(f"📋 Найдено расширений: {len(extensions)}")
    
    # Фильтруем расширения
    filtered = []
    removed = []
    
    for ext in extensions:
        ext_id = ext['identifier']['id']
        if ext_id in extensions_to_remove:
            removed.append(ext_id)
            # Удаляем папку расширения
            rel_location = ext.get('relativeLocation', '')
            if rel_location:
                ext_path = os.path.join(extensions_dir, rel_location)
                if os.path.exists(ext_path):
                    print(f"🗑️  Удаление папки: {rel_location}")
                    shutil.rmtree(ext_path)
        else:
            filtered.append(ext)
    
    # Сохраняем обновлённый список
    with open(extensions_file, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Удалено расширений: {len(removed)}")
    for ext_id in removed:
        print(f"   - {ext_id}")
    print(f"\n✅ Осталось расширений: {len(filtered)}")
    print("\n💡 Перезапустите Qoder, чтобы изменения вступили в силу.")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    exit(1)

