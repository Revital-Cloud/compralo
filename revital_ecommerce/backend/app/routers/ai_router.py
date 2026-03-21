"""
Router para endpoints de IA en el panel admin.
Solo capa HTTP: validación de entrada, llamada a servicios, mapeo a respuestas.
Requiere rol admin.
"""
import json
from typing import Iterator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import time

from core.database import get_db
from core.dependencies import require_admin, UserInToken
from core.exceptions import get_safe_message, MSG_SERVICE_UNAVAILABLE, MSG_BAD_GATEWAY
from services.groq_service import is_groq_available, DEFAULT_MODEL
from services.admin_ai_service import (
    detect_intent,
    reply_for_intent,
    reply_for_action,
    handle_confirmation_or_new_intent,
    stream_reply_sse,
    generate_dashboard_summary,
    FALLBACK_REPLY,
    chat_with_admin_ai,
)

router = APIRouter(tags=["AI Admin"])


@router.get("/admin/ai/health", status_code=status.HTTP_200_OK)
async def get_ai_health(
    current_user: UserInToken = Depends(require_admin()),
):
    """Indica si la IA está disponible y el modelo en uso. Solo administradores."""
    return {"enabled": is_groq_available(), "model": DEFAULT_MODEL if is_groq_available() else None}


@router.get("/admin/ai/summary", status_code=status.HTTP_200_OK)
async def get_ai_summary(
    time_range: str = "monthly",
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Genera un resumen en lenguaje natural del dashboard. Solo administradores."""
    if not is_groq_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La IA no está configurada. Añade GROQ_API_KEY al entorno.",
        )
    try:
        summary_text = generate_dashboard_summary(db, time_range)
        return {"summary": summary_text}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=get_safe_message(e) or MSG_SERVICE_UNAVAILABLE) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=get_safe_message(e) or MSG_BAD_GATEWAY) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_safe_message(e),
        ) from e


@router.post("/admin/ai/chat", status_code=status.HTTP_200_OK)
async def post_ai_chat(
    body: dict,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Chat con el asistente de IA (respuesta completa). Solo administradores."""
    if not is_groq_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La IA no está configurada. Añade GROQ_API_KEY al entorno.",
        )
    raw = body.get("message")
    if not isinstance(raw, str):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="message debe ser un string")
    message = raw.strip()
    if len(message) > 1000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El mensaje no puede superar 1000 caracteres")

    try:
        reply = chat_with_admin_ai(message, db, current_user.id_usuario)
        # Si reply es un dict con metadata, devolverlo completo
        if isinstance(reply, dict):
            return reply
        # Si es un string, devolverlo en formato antiguo para compatibilidad
        return {"reply": reply}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=get_safe_message(e) or MSG_SERVICE_UNAVAILABLE) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=get_safe_message(e) or MSG_BAD_GATEWAY) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_safe_message(e),
        ) from e


@router.post("/admin/ai/chat/stream", status_code=status.HTTP_200_OK)
async def post_ai_chat_stream(
    body: dict,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Chat con streaming (SSE). Solo administradores."""
    if not is_groq_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La IA no está configurada. Añade GROQ_API_KEY al entorno.",
        )
    raw = body.get("message")
    if not isinstance(raw, str):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="message debe ser un string")
    message = raw.strip()
    if len(message) > 1000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El mensaje no puede superar 1000 caracteres")

    def iter_chunks(text: str, chunk_size: int = 24) -> Iterator[str]:
        text = text or ""
        if not text:
            return
        for i in range(0, len(text), chunk_size):
            yield text[i : i + chunk_size]

    # Para "siempre streaming", hacemos:
    # - Intent de lectura: streaming real con chunks desde el LLM.
    # - Acciones/herramientas: hacemos chunking del texto final para mantener el mismo UX.
    intent = detect_intent(message)
    if intent:
        def stream_gen():
            yield from stream_reply_sse(message, intent, db, current_user.id_usuario)
            yield b"data: [DONE]\n\n"

        return StreamingResponse(
            stream_gen(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    try:
        reply = chat_with_admin_ai(message, db, current_user.id_usuario)
    except ValueError as e:
        def error_gen():
            text = get_safe_message(e) or MSG_SERVICE_UNAVAILABLE
            for chunk in iter_chunks(text):
                yield f"data: {json.dumps({'text': chunk})}\n\n".encode("utf-8")
                # Pequeño respiro para que el front renderice por chunks con claridad.
                time.sleep(0.01)
            yield b"data: [DONE]\n\n"

        return StreamingResponse(
            error_gen(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except RuntimeError as e:
        def error_gen():
            text = get_safe_message(e) or MSG_BAD_GATEWAY
            for chunk in iter_chunks(text):
                yield f"data: {json.dumps({'text': chunk})}\n\n".encode("utf-8")
                time.sleep(0.01)
            yield b"data: [DONE]\n\n"

        return StreamingResponse(
            error_gen(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    def reply_chunked_gen():
        # Si reply es un dict con metadata, incluirla en el stream.
        if isinstance(reply, dict):
            text_content = reply.get("message", "") or ""
            affected_entities = reply.get("affected_entities", []) or []

            for chunk in iter_chunks(text_content):
                yield f"data: {json.dumps({'text': chunk})}\n\n".encode("utf-8")
                time.sleep(0.01)

            if affected_entities:
                yield f"data: {json.dumps({'metadata': {'affected_entities': affected_entities}})}\n\n".encode("utf-8")
        else:
            text_content = str(reply or "")
            for chunk in iter_chunks(text_content):
                yield f"data: {json.dumps({'text': chunk})}\n\n".encode("utf-8")
                time.sleep(0.01)

        yield b"data: [DONE]\n\n"

    return StreamingResponse(
        reply_chunked_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
