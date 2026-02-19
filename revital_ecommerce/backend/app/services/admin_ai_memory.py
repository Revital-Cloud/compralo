"""
Sistema de memoria persistente para el asistente AI admin.

Permite:
- Guardar historial de conversaciones
- Recuperar contexto de conversaciones anteriores
- Aprendizaje incremental basado en interacciones pasadas
- Contexto automático para preguntas de resumen
"""
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import text


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
    except Exception as e:
        db.rollback()
        # No lanzar excepción para no interrumpir el flujo principal
        # Solo loggear el error
        print(f"Error al guardar conversación: {str(e)}")


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
    except Exception as e:
        print(f"Error al obtener conversaciones recientes: {str(e)}")
        return []


def build_conversation_context(
    conversations: List[Dict[str, Any]],
    max_tokens: int = 2000,
) -> str:
    """
    Construye un contexto de texto a partir de conversaciones anteriores.
    Útil para proporcionar contexto al LLM.
    
    Args:
        conversations: Lista de conversaciones
        max_tokens: Longitud máxima aproximada del contexto (caracteres)
        
    Returns:
        String con el contexto formateado
    """
    if not conversations:
        return ""
    
    context_parts = []
    total_length = 0
    
    # Invertir para mostrar las más recientes primero
    for conv in reversed(conversations):
        message = conv.get("message", "")
        reply = conv.get("reply", "")
        
        # Formato: "Usuario: ... | Asistente: ..."
        conv_text = f"Usuario: {message}\nAsistente: {reply}\n"
        
        if total_length + len(conv_text) > max_tokens:
            break
        
        context_parts.append(conv_text)
        total_length += len(conv_text)
    
    if not context_parts:
        return ""
    
    return "\n--- Conversaciones anteriores ---\n" + "\n".join(context_parts) + "\n--- Fin del contexto ---\n"


def get_user_preferences_from_history(
    db: Session,
    user_id: str | int | Decimal,
) -> Dict[str, Any]:
    """
    Extrae preferencias del usuario basándose en el historial de conversaciones.
    Por ejemplo: qué tipo de información pregunta más, qué herramientas usa más, etc.
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        
    Returns:
        Diccionario con preferencias extraídas
    """
    try:
        user_decimal = Decimal(str(user_id))
        query = text("""
            SELECT 
                message,
                reply,
                tool_calls,
                context_data
            FROM tab_ai_conversations
            WHERE id_usuario = :id_usuario
            ORDER BY fec_conversation DESC
            LIMIT 50
        """)
        
        result = db.execute(query, {"id_usuario": user_decimal})
        
        # Analizar patrones
        tool_usage = {}
        intent_patterns = {
            "resumen": 0,
            "ventas": 0,
            "productos": 0,
            "ordenes": 0,
            "crear": 0,
        }
        
        for row in result.mappings().all():
            message = (row.get("message") or "").lower()
            tool_calls_raw = row.get("tool_calls")
            
            # Contar herramientas usadas
            if tool_calls_raw:
                try:
                    # Manejar tool_calls: puede ser string JSON o ya parseado
                    if isinstance(tool_calls_raw, str):
                        tools = json.loads(tool_calls_raw)
                    else:
                        tools = tool_calls_raw
                    
                    if isinstance(tools, list):
                        for tool in tools:
                            tool_name = tool.get("name") if isinstance(tool, dict) else str(tool)
                            tool_usage[tool_name] = tool_usage.get(tool_name, 0) + 1
                except Exception:
                    pass
            
            # Detectar patrones de intención
            if any(word in message for word in ["resumen", "resumir", "resume"]):
                intent_patterns["resumen"] += 1
            if any(word in message for word in ["ventas", "venta", "revenue"]):
                intent_patterns["ventas"] += 1
            if any(word in message for word in ["producto", "productos"]):
                intent_patterns["productos"] += 1
            if any(word in message for word in ["orden", "ordenes", "pedido"]):
                intent_patterns["ordenes"] += 1
            if any(word in message for word in ["crear", "crea", "nuevo"]):
                intent_patterns["crear"] += 1
        
        return {
            "tool_usage": tool_usage,
            "intent_patterns": intent_patterns,
            "most_used_tool": max(tool_usage.items(), key=lambda x: x[1])[0] if tool_usage else None,
            "most_common_intent": max(intent_patterns.items(), key=lambda x: x[1])[0] if intent_patterns else None,
        }
    except Exception as e:
        print(f"Error al extraer preferencias: {str(e)}")
        return {}
