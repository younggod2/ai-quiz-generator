import pdfplumber
from pdf2image import convert_from_path
from PIL import Image
import base64
import io
from typing import Dict, List, Tuple


def extract_text_from_pdf(pdf_path: str) -> str:
    """Извлекает весь текст из PDF документа."""
    text_content = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text)
    except Exception as e:
        raise Exception(f"Ошибка при извлечении текста из PDF: {str(e)}")
    
    return "\n\n".join(text_content)


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


def process_pdf(pdf_path: str) -> Dict[str, any]:
    """Обрабатывает PDF и извлекает текст и изображения."""
    text = extract_text_from_pdf(pdf_path)
    images = extract_images_from_pdf(pdf_path)
    
    return {
        "text": text,
        "images": images,
        "total_pages": len(images)
    }



