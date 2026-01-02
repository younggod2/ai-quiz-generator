import openai
import json
import os
import re
import httpx
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()


def normalize_questions(questions: List[Dict]) -> List[Dict]:
    """Нормализует и валидирует вопросы из ответа модели."""
    normalized_questions = []
    
    for idx, q in enumerate(questions):
        normalized_q = {
            "id": q.get("id", idx + 1),
            "question": q.get("question", ""),
            "type": q.get("type", "multiple_choice"),
            "correct_answer": q.get("correct_answer")
        }
        
        if normalized_q["type"] == "multiple_choice":
            normalized_q["options"] = q.get("options", [])
            # Убеждаемся, что correct_answer - это индекс
            if isinstance(normalized_q["correct_answer"], str):
                # Если это буква (A, B, C, D), конвертируем в индекс
                answer_map = {"A": 0, "B": 1, "C": 2, "D": 3, "a": 0, "b": 1, "c": 2, "d": 3}
                normalized_q["correct_answer"] = answer_map.get(normalized_q["correct_answer"], 0)
        
        normalized_questions.append(normalized_q)
    
    return normalized_questions


def extract_json_from_response(response_text: str) -> str:
    """Извлекает JSON из ответа, убирая markdown блоки кода."""
    response_text = response_text.strip()
    
    # Убираем markdown код блоки если есть
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    if response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    
    return response_text.strip()


class ModelClient(ABC):
    """Абстрактный базовый класс для клиентов моделей."""
    
    @abstractmethod
    def generate_quiz_questions(self, pdf_content: Dict[str, Any], num_questions: int) -> List[Dict]:
        """Генерирует вопросы для теста на основе содержимого PDF."""
        pass


class OpenRouterClient(ModelClient):
    """Клиент для работы с OpenRouter API."""
    
    def __init__(self):
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY не установлен в переменных окружения")
        
        base_url = "https://openrouter.ai/api/v1"
        self.client = openai.OpenAI(
            base_url=base_url,
            api_key=api_key
        )
    
    def generate_quiz_questions(self, pdf_content: Dict[str, Any], num_questions: int) -> List[Dict]:
        """Генерирует вопросы для теста на основе содержимого PDF через OpenRouter API."""
        
        # Компактный промпт для экономии токенов
        system_prompt = """Создай вопросы теста на основе контента. Тип: multiple_choice (4 варианта). На русском. Только JSON.

Формат: {"questions": [{"id": 1, "question": "Текст вопроса?", "type": "multiple_choice", "options": ["Полный текст варианта A", "Полный текст варианта B", "Полный текст варианта C", "Полный текст варианта D"], "correct_answer": 0}]}

correct_answer - это индекс правильного ответа (0, 1, 2 или 3), где 0 = первый вариант, 1 = второй вариант и т.д."""
        
        # Формируем сообщения для API
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Создай {num_questions} вопросов для теста на основе следующего контента:\n\n"}
        ]
        
        # Добавляем текст из PDF (уменьшено для экономии токенов)
        if pdf_content.get("text"):
            messages[1]["content"] += f"ТЕКСТ:\n{pdf_content['text'][:4000]}\n\n"
        
        # Добавляем изображения (уменьшено для экономии токенов)
        images_to_send = pdf_content.get("images", [])[:2]
        
        if images_to_send:
            messages[1]["content"] += "ИЗОБРАЖЕНИЯ ИЗ ДОКУМЕНТА:\n"
            for img_data in images_to_send:
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/{img_data['format']};base64,{img_data['base64']}"
                            }
                        }
                    ]
                })
        
        messages[1]["content"] += f"\nСоздай {num_questions} вопросов. Только JSON."
        
        try:
            # Вычисляем max_tokens на основе количества вопросов
            calculated_max_tokens = min(num_questions * 200, 1500)
            
            # Используем gpt-4o-mini для экономии, если нет изображений, иначе gpt-4o
            model = "openai/gpt-4o-mini" if not images_to_send else "openai/gpt-4o"
            
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=calculated_max_tokens,
                temperature=0.7
            )
            
            # Извлекаем JSON из ответа
            response_text = response.choices[0].message.content.strip()
            response_text = extract_json_from_response(response_text)
            
            # Парсим JSON
            result = json.loads(response_text)
            
            # Валидируем и нормализуем формат
            questions = result.get("questions", [])
            return normalize_questions(questions)
            
        except json.JSONDecodeError as e:
            raise Exception(f"Ошибка парсинга JSON ответа от API: {str(e)}")
        except Exception as e:
            error_msg = str(e)
            # Обрабатываем ошибку недостатка кредитов
            if "402" in error_msg or "credits" in error_msg.lower() or "max_tokens" in error_msg.lower():
                raise Exception(
                    "Недостаточно кредитов в OpenRouter для выполнения запроса. "
                    "Пожалуйста, попробуйте уменьшить количество вопросов или пополните баланс на https://openrouter.ai/settings/credits"
                )
            raise Exception(f"Ошибка при вызове OpenRouter API: {error_msg}")


class OllamaClient(ModelClient):
    """Клиент для работы с локальной Ollama API."""
    
    def __init__(self, model_name: str = "mistral", base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url
        self.client = httpx.Client(timeout=100.0)  # Увеличенный таймаут для локальной модели
    
    def _check_ollama_available(self) -> bool:
        """Проверяет доступность Ollama сервера."""
        try:
            response = self.client.get(f"{self.base_url}/api/tags", timeout=5.0)
            return response.status_code == 200
        except Exception:
            return False
    
    def generate_quiz_questions(self, pdf_content: Dict[str, Any], num_questions: int) -> List[Dict]:
        """Генерирует вопросы для теста на основе содержимого PDF через Ollama API."""
        
        # Проверяем доступность Ollama
        if not self._check_ollama_available():
            raise Exception(
                f"Ollama сервер недоступен по адресу {self.base_url}. "
                "Убедитесь, что Ollama запущен и модель загружена."
            )
        
        # Формируем промпт для Ollama
        system_prompt = """Создай вопросы теста на основе контента. Тип: multiple_choice (4 варианта). На русском. Только JSON.

Формат: {"questions": [{"id": 1, "question": "Текст вопроса?", "type": "multiple_choice", "options": ["Полный текст варианта A", "Полный текст варианта B", "Полный текст варианта C", "Полный текст варианта D"], "correct_answer": 0}]}

correct_answer - это индекс правильного ответа (0, 1, 2 или 3), где 0 = первый вариант, 1 = второй вариант и т.д."""
        
        # Формируем пользовательский промпт
        user_prompt = f"Создай {num_questions} вопросов для теста на основе следующего контента:\n\n"
        
        # Добавляем текст из PDF
        if pdf_content.get("text"):
            # Для локальной модели можем использовать больше текста
            user_prompt += f"ТЕКСТ:\n{pdf_content['text'][:8000]}\n\n"
        
        user_prompt += f"\nСоздай {num_questions} вопросов. Только JSON."
        
        try:
            # Вызываем Ollama API
            response = self.client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": f"{system_prompt}\n\n{user_prompt}",
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": min(num_questions * 200, 2000)  # Ограничение токенов
                    }
                },
                timeout=100.0
            )
            
            if response.status_code != 200:
                error_text = response.text
                raise Exception(f"Ollama API вернул ошибку: {error_text}")
            
            result = response.json()
            
            # Извлекаем текст ответа
            response_text = result.get("response", "").strip()
            
            if not response_text:
                raise Exception("Ollama вернул пустой ответ")
            
            # Извлекаем JSON из ответа
            response_text = extract_json_from_response(response_text)
            
            # Парсим JSON
            try:
                result_json = json.loads(response_text)
            except json.JSONDecodeError:
                # Пытаемся найти JSON в ответе, если он обернут в текст
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    result_json = json.loads(json_match.group())
                else:
                    raise Exception(f"Не удалось найти JSON в ответе Ollama. Ответ: {response_text[:500]}")
            
            # Валидируем и нормализуем формат
            questions = result_json.get("questions", [])
            if not questions:
                raise Exception("Ollama не вернул вопросы в ответе")
            
            return normalize_questions(questions)
            
        except httpx.TimeoutException:
            raise Exception(
                "Превышено время ожидания ответа от Ollama (лимит: 100 сек, можно увеличить). "
                "Попробуйте уменьшить количество вопросов или проверьте производительность системы."
            )
        except json.JSONDecodeError as e:
            raise Exception(f"Ошибка парсинга JSON ответа от Ollama: {str(e)}")
        except Exception as e:
            error_msg = str(e)
            if "model" in error_msg.lower() and "not found" in error_msg.lower():
                raise Exception(
                    f"Модель {self.model_name} не найдена в Ollama. "
                    f"Установите её командой: ollama pull {self.model_name}"
                )
            raise Exception(f"Ошибка при вызове Ollama API: {error_msg}")


def create_model_client(model_type: str) -> ModelClient:
    """Создает клиент модели на основе типа модели."""
    if model_type == "openrouter":
        return OpenRouterClient()
    elif model_type == "ollama-mistral":
        return OllamaClient(model_name="mistral")
    else:
        raise ValueError(f"Неизвестный тип модели: {model_type}")

