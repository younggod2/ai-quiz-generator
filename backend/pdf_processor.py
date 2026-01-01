import pdfplumber
from pdf2image import convert_from_path
import base64
import io
from typing import Dict, List, Any


def extract_text_from_pdf(pdf_path: str, include_page_markers: bool = True) -> str:
    """Извлекает весь текст из PDF документа.
    
    Args:
        pdf_path: Путь к PDF файлу
        include_page_markers: Если True, добавляет явные маркеры страниц в текст
    
    Returns:
        Объединенный текст всех страниц с маркерами страниц (если включено)
    """
    text_content = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text()
                if page_text:
                    if include_page_markers:
                        # Добавляем явный маркер страницы для лучшей структуризации
                        marked_text = f"\n\n{'='*60}\nСТРАНИЦА {page_num}\n{'='*60}\n\n{page_text}"
                        text_content.append(marked_text)
                    else:
                        text_content.append(page_text)
    except Exception as e:
        raise Exception(f"Ошибка при извлечении текста из PDF: {str(e)}")
    
    # Используем один перенос строки между страницами, так как маркер уже добавляет разделение
    separator = "\n\n" if not include_page_markers else "\n"
    return separator.join(text_content)


def extract_images_from_pdf(pdf_path: str) -> List[Dict[str, str]]:
    """Извлекает изображения из PDF и конвертирует их в base64."""
    images_data = []
    
    try:
        # Конвертируем PDF страницы в изображения
        images = convert_from_path(pdf_path, dpi=200)
        
        for idx, image in enumerate(images):
            # Конвертируем PIL Image в base64
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            images_data.append({
                "page": idx + 1,
                "base64": img_base64,
                "format": "png"
            })
    except Exception as e:
        raise Exception(f"Ошибка при извлечении изображений из PDF: {str(e)}")
    
    return images_data


def process_pdf(pdf_path: str, include_page_markers: bool = True) -> Dict[str, Any]:

    text = extract_text_from_pdf(pdf_path, include_page_markers=include_page_markers)
    images = extract_images_from_pdf(pdf_path)
    
    return {
        "text": text,
        "images": images,
        "total_pages": len(images)
    }



