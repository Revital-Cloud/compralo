"""
Servicio para integración con Groq API (LLM).
Usa el SDK oficial groq para chat completions.
"""
import logging
from typing import Iterator, Optional

from groq import Groq

from core.config import settings

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "llama-3.3-70b-versatile"


def is_groq_available() -> bool:
    """Indica si Groq está configurado (API key presente)."""
    return bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())


def chat_completion_stream(
    user_content: str,
    system_content: Optional[str] = None,
    model: str = DEFAULT_MODEL,
    temperature: float = 0.3,
) -> Iterator[str]:
    """
    Llama a Groq con stream=True y devuelve un generador de fragmentos de texto.
    """
    if not is_groq_available():
        raise ValueError("GROQ_API_KEY no está configurada.")

    messages = []
    if system_content:
        messages.append({"role": "system", "content": system_content})
    messages.append({"role": "user", "content": user_content})

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        stream = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        logger.exception("Unexpected error calling Groq (stream)")
        raise RuntimeError(f"Error inesperado al usar Groq: {str(e)}") from e


def chat_completion(
    user_content: str,
    system_content: Optional[str] = None,
    model: str = DEFAULT_MODEL,
    temperature: float = 0.3,
) -> str:
    """
    Llama a Groq Chat Completions y devuelve el texto de la respuesta.

    Args:
        user_content: Contenido del mensaje del usuario.
        system_content: Contenido del mensaje de sistema (instrucciones). Opcional.
        model: Modelo a usar. Por defecto llama-3.3-70b-versatile.
        temperature: Temperatura (0-2). Por defecto 0.3 para respuestas más deterministas.

    Returns:
        str: Contenido de la respuesta del asistente.

    Raises:
        ValueError: Si GROQ_API_KEY no está configurada.
        RuntimeError: Si la API de Groq devuelve error (timeout, rate limit, etc.).
    """
    if not is_groq_available():
        raise ValueError("GROQ_API_KEY no está configurada. Las funciones de IA no están disponibles.")

    messages = []
    if system_content:
        messages.append({"role": "system", "content": system_content})
    messages.append({"role": "user", "content": user_content})

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
        )
        content = response.choices[0].message.content
        return content or ""
    except Exception as e:
        logger.exception("Unexpected error calling Groq")
        raise RuntimeError(f"Error inesperado al usar Groq: {str(e)}") from e
