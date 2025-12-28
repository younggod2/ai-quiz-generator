#!/usr/bin/env python3
"""
Скрипт для синхронизации расширений из Cursor в Qoder.
Удаляет все расширения, которых нет в списке Cursor.
"""

import json
import os
import shutil

# Пути
cursor_ext_file = "/Users/denischekalin/Library/Application Support/Cursor/User/extensions.txt"
qoder_ext_dir = "/Users/denischekalin/.qoder/extensions"
qoder_ext_json = f"{qoder_ext_dir}/extensions.json"

# Читаем список расширений из Cursor
print("📖 Чтение списка расширений из Cursor...")
with open(cursor_ext_file, 'r') as f:
    cursor_extensions = {line.strip() for line in f if line.strip()}

print(f"✓ Найдено расширений в Cursor: {len(cursor_extensions)}")

# Читаем текущие расширения в Qoder
print("\n📖 Чтение списка расширений из Qoder...")
with open(qoder_ext_json, 'r', encoding='utf-8') as f:
    qoder_extensions = json.load(f)

print(f"✓ Найдено расширений в Qoder: {len(qoder_extensions)}")

# Находим расширения для удаления
to_remove = []
to_keep = []

for ext in qoder_extensions:
    ext_id = ext['identifier']['id']
    if ext_id in cursor_extensions:
        to_keep.append(ext)
    else:
        to_remove.append(ext)

print(f"\n📋 Расширения для удаления: {len(to_remove)}")
for ext in to_remove:
    ext_id = ext['identifier']['id']
    rel_location = ext.get('relativeLocation', '')
    print(f"   ❌ {ext_id} ({rel_location})")

# Удаляем папки расширений
print(f"\n🗑️  Удаление папок расширений...")
for ext in to_remove:
    rel_location = ext.get('relativeLocation', '')
    if rel_location:
        ext_path = os.path.join(qoder_ext_dir, rel_location)
        if os.path.exists(ext_path):
            print(f"   Удаление: {rel_location}")
            shutil.rmtree(ext_path)

# Сохраняем обновлённый список
print(f"\n💾 Сохранение обновлённого списка расширений...")
with open(qoder_ext_json, 'w', encoding='utf-8') as f:
    json.dump(to_keep, f, indent=2, ensure_ascii=False)

print(f"\n✅ Готово!")
print(f"   ✓ Удалено расширений: {len(to_remove)}")
print(f"   ✓ Осталось расширений: {len(to_keep)}")
print(f"\n💡 Перезапустите Qoder, чтобы изменения вступили в силу.")

