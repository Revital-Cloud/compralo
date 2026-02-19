"""
Router para endpoints de IA en el panel admin.
Solo capa HTTP: validación de entrada, llamada a servicios, mapeo a respuestas.
Requiere rol admin.
"""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import require_admin, UserInToken
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
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado: {str(e)}",
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
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado: {str(e)}",
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

    # Para mantener el comportamiento simple y seguro, no hacemos streaming
    # token a token cuando intervienen tools; generamos la respuesta completa.
    try:
        reply = chat_with_admin_ai(message, db, current_user.id_usuario)
    except ValueError as e:
        def error_gen():
            yield f"data: {json.dumps({'text': str(e)})}\n\n".encode("utf-8")

        return StreamingResponse(
            error_gen(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except RuntimeError as e:
        def error_gen():
            text = f"Ocurrió un error al usar la IA: {str(e)}"
            yield f"data: {json.dumps({'text': text})}\n\n".encode("utf-8")

        return StreamingResponse(
            error_gen(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    def single_event_gen():
        # Si reply es un dict con metadata, incluirla en el stream
        if isinstance(reply, dict):
            text_content = reply.get("message", "")
            affected_entities = reply.get("affected_entities", [])
            # Enviar primero el texto
            yield f"data: {json.dumps({'text': text_content})}\n\n".encode("utf-8")
            # Luego enviar metadata si hay entidades afectadas
            if affected_entities:
                yield f"data: {json.dumps({'metadata': {'affected_entities': affected_entities}})}\n\n".encode("utf-8")
        else:
            # Respuesta normal sin metadata
            yield f"data: {json.dumps({'text': reply})}\n\n".encode("utf-8")

    return StreamingResponse(
        single_event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
