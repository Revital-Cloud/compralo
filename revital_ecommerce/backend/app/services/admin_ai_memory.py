"""
Sistema de memoria persistente para el asistente AI admin.

Permite:
- Guardar historial de conversaciones
- Recuperar contexto de conversaciones anteriores
- Aprendizaje incremental basado en interacciones pasadas
- Contexto automático para preguntas de resumen
"""
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger(__name__)

# Ventana de validez de una acción pendiente de confirmación. Pasado este
# tiempo, un "sí" tardío NO ejecuta la acción (se considera expirada).
PENDING_ACTION_TTL_MINUTES = 60


def save_conversation(
    db: Session,
    user_id: str | int | Decimal,
    message: str,
    reply: str,
    context_data: Optional[Dict[str, Any]] = None,
    tool_calls: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """
    Guarda una conversación en el historial.
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        message: Mensaje del usuario
        reply: Respuesta del asistente
        context_data: Datos de contexto usados (KPIs, resúmenes, etc.)
        tool_calls: Herramientas llamadas durante la conversación
    """
    try:
        user_decimal = Decimal(str(user_id))
        insert_query = text("""
            INSERT INTO tab_ai_conversations 
            (id_usuario, message, reply, context_data, tool_calls, usr_insert, fec_insert)
            VALUES 
            (:id_usuario, :message, :reply, :context_data, :tool_calls, :usr_insert, NOW())
        """)
        
        params = {
            "id_usuario": user_decimal,
            "message": message[:5000],  # Limitar longitud
            "reply": reply[:10000],  # Limitar longitud
            "context_data": json.dumps(context_data) if context_data else None,
            "tool_calls": json.dumps(tool_calls) if tool_calls else None,
            "usr_insert": user_decimal,
        }
        
        db.execute(insert_query, params)
        db.commit()
    except Exception:
        db.rollback()
        # No lanzar excepción para no interrumpir el flujo principal; solo loggear.
        logger.exception("Error al guardar conversación")


def get_recent_conversations(
    db: Session,
    user_id: str | int | Decimal,
    limit: int = 10,
    days_back: int = 7,
) -> List[Dict[str, Any]]:
    """
    Obtiene las conversaciones recientes del usuario.
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        limit: Número máximo de conversaciones a retornar
        days_back: Días hacia atrás para buscar conversaciones
        
    Returns:
        Lista de conversaciones con message, reply, context_data, tool_calls
    """
    try:
        user_decimal = Decimal(str(user_id))
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        query = text("""
            SELECT 
                message,
                reply,
                context_data,
                tool_calls,
                fec_conversation
            FROM tab_ai_conversations
            WHERE id_usuario = :id_usuario
                AND fec_conversation >= :cutoff_date
            ORDER BY fec_conversation DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, {
            "id_usuario": user_decimal,
            "cutoff_date": cutoff_date,
            "limit": limit,
        })
        
        conversations = []
        for row in result.mappings().all():
            # Manejar context_data: puede ser string JSON o ya parseado
            context_data_raw = row.get("context_data")
            if context_data_raw is None:
                context_data = {}
            elif isinstance(context_data_raw, str):
                try:
                    context_data = json.loads(context_data_raw)
                except (json.JSONDecodeError, TypeError):
                    context_data = {}
            else:
                # Ya es un dict/list de Python
                context_data = context_data_raw
            
            # Manejar tool_calls: puede ser string JSON o ya parseado
            tool_calls_raw = row.get("tool_calls")
            if tool_calls_raw is None:
                tool_calls = []
            elif isinstance(tool_calls_raw, str):
                try:
                    tool_calls = json.loads(tool_calls_raw)
                except (json.JSONDecodeError, TypeError):
                    tool_calls = []
            else:
                # Ya es un dict/list de Python
                tool_calls = tool_calls_raw
            
            conv = {
                "message": row.get("message", ""),
                "reply": row.get("reply", ""),
                "context_data": context_data,
                "tool_calls": tool_calls,
                "fec_conversation": row.get("fec_conversation").isoformat() if row.get("fec_conversation") else None,
            }
            conversations.append(conv)
        
        return conversations
    except Exception:
        logger.exception("Error al obtener conversaciones recientes")
        return []


def _iter_tool_calls(raw: Any) -> List[Dict[str, Any]]:
    """Normaliza el campo tool_calls (string JSON o lista) a una lista de dicts."""
    if raw is None:
        return []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return []
    return raw if isinstance(raw, list) else []


def get_pending_action(
    db: Session,
    user_id: str | int | Decimal,
) -> Optional[Dict[str, Any]]:
    """
    Devuelve la acción pendiente de confirmación del usuario, derivada del
    historial persistido en `tab_ai_conversations`, o None si no hay ninguna.

    Reemplaza el antiguo estado en memoria (`admin_ai_state`) para que el flujo
    de confirmación funcione con múltiples workers/instancias y sobreviva a
    reinicios.

    Semántica (recorre el historial reciente de más nuevo a más antiguo); la
    primera fila con un tool_call con `status` decide:
    - "pending"                -> hay una acción pendiente activa.
    - "executed" / "cancelled" -> la última acción ya se resolvió (no hay pendiente).
    Las filas sin tool_calls con estado (respuestas normales/ambiguas) se ignoran.
    """
    try:
        user_decimal = Decimal(str(user_id))
        cutoff = datetime.now() - timedelta(minutes=PENDING_ACTION_TTL_MINUTES)
        query = text("""
            SELECT tool_calls
            FROM tab_ai_conversations
            WHERE id_usuario = :id_usuario
                AND fec_conversation >= :cutoff
            ORDER BY fec_conversation DESC
            LIMIT 20
        """)
        rows = db.execute(query, {"id_usuario": user_decimal, "cutoff": cutoff}).mappings().all()
        for row in rows:
            for tc in _iter_tool_calls(row.get("tool_calls")):
                if not isinstance(tc, dict):
                    continue
                status = tc.get("status")
                if status == "pending":
                    name = tc.get("name")
                    if not name:
                        return None
                    params = tc.get("params")
                    return {"action": name, "params": params if isinstance(params, dict) else {}}
                if status in ("executed", "cancelled"):
                    return None
        return None
    except Exception:
        logger.exception("Error al obtener acción pendiente")
        return None


def mark_pending_action_resolved(
    db: Session,
    user_id: str | int | Decimal,
    pending: Dict[str, Any],
    status: str = "cancelled",
) -> None:
    """
    Marca como resuelta (por defecto, cancelada) una acción pendiente SIN
    ejecutarla, persistiendo un marcador en el historial. Se usa cuando el
    usuario cambia de intención antes de confirmar, para que `get_pending_action`
    deje de considerarla activa.
    """
    action = (pending or {}).get("action")
    if not action:
        return
    params = (pending or {}).get("params") or {}
    save_conversation(
        db,
        user_id,
        "",
        "",
        tool_calls=[{"name": action, "params": params, "status": status}],
    )


def build_history_messages(
    conversations: List[Dict[str, Any]],
    max_chars: int = 4000,
) -> List[Dict[str, str]]:
    """
    Convierte el historial reciente en turnos de chat reales (role user/assistant)
    para pasarlos al LLM. Así el modelo puede resolver referencias por sí mismo
    ("ese producto", "esa última orden") sin lógica de regex en el backend.

    `conversations` viene de `get_recent_conversations` (más nuevas primero). Se
    seleccionan desde la más nueva hasta agotar `max_chars` y luego se devuelven
    en orden cronológico (más antigua primero).
    """
    if not conversations:
        return []

    selected: List[tuple] = []
    total = 0
    for conv in conversations:  # más nuevas primero
        message = conv.get("message") or ""
        reply = conv.get("reply") or ""
        # Saltar marcadores internos (cancelaciones de acciones) sin texto visible.
        if not message and not reply:
            continue
        pair_len = len(message) + len(reply)
        if total + pair_len > max_chars and selected:
            break
        selected.append((message, reply))
        total += pair_len

    messages: List[Dict[str, str]] = []
    for message, reply in reversed(selected):  # a orden cronológico
        if message:
            messages.append({"role": "user", "content": message})
        if reply:
            messages.append({"role": "assistant", "content": reply})
    return messages


def count_recent_messages(
    db: Session,
    user_id: str | int | Decimal,
    seconds: int = 60,
) -> int:
    """
    Cuenta los mensajes reales del usuario en los últimos `seconds` segundos
    (excluye marcadores internos sin texto). Base del rate-limit del chat admin,
    multi-worker-safe al apoyarse en la BD compartida.
    """
    try:
        user_decimal = Decimal(str(user_id))
        cutoff = datetime.now() - timedelta(seconds=seconds)
        query = text("""
            SELECT COUNT(*) AS cnt
            FROM tab_ai_conversations
            WHERE id_usuario = :id_usuario
                AND fec_conversation >= :cutoff
                AND message <> ''
        """)
        row = db.execute(query, {"id_usuario": user_decimal, "cutoff": cutoff}).mappings().first()
        return int((row or {}).get("cnt", 0) or 0)
    except Exception:
        logger.exception("Error al contar mensajes recientes (rate-limit)")
        return 0
