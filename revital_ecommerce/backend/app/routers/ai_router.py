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
    stream_reply_sse,
    generate_dashboard_summary,
    FALLBACK_REPLY,
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

    intent = detect_intent(message)
    if intent is None:
        return {"reply": FALLBACK_REPLY}

    try:
        if intent == "action":
            reply = reply_for_action(message, db, current_user.id_usuario)
        else:
            reply = reply_for_intent(message, intent, db)
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

    intent = detect_intent(message)
    if intent is None:
        def fallback_gen():
            yield f"data: {json.dumps({'text': FALLBACK_REPLY})}\n\n".encode("utf-8")
        return StreamingResponse(
            fallback_gen(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    return StreamingResponse(
        stream_reply_sse(message, intent, db, user_id=current_user.id_usuario),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
