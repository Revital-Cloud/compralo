"""
Servicio de IA del panel admin: detección de intenciones, datos por intent y respuestas con Groq.
Toda la lógica de negocio del chat admin vive aquí; el router solo expone HTTP.

Seguridad:
- SQL: solo consultas con text() y parámetros; el mensaje del usuario NUNCA se concatena en SQL.
- Prompt injection: el mensaje va al LLM; la respuesta es solo texto. No se ejecutan acciones
  desde la salida del modelo. Si en el futuro se añaden "acciones" (crear marca, etc.), deben
  validarse y ejecutarse en backend con los mismos controles que el resto de la API.
- Acceso: solo administradores (require_admin en el router).
"""
import json
from typing import Iterator

from sqlalchemy.orm import Session
from sqlalchemy import text

from services.dashboard_service import get_dashboard_data
from services.groq_service import chat_completion, chat_completion_stream
from services import admin_ai_actions
from services.admin_ai_instructions import (
    INTENT_PENDING_ORDERS,
    INTENT_TOP_PRODUCTS,
    INTENT_SALES_SUMMARY,
    INTENT_ALERTS,
    INTENT_RECENT_ORDERS,
    INTENT_GENERAL,
    INTENT_ACTION,
    FALLBACK_REPLY,
    CHAT_SYSTEM_PROMPT,
    SUMMARY_SYSTEM_PROMPT,
)


def get_alerts(db: Session) -> list[str]:
    """Obtiene alertas precalculadas (órdenes pendientes, stock bajo/sin stock)."""
    alerts = []
    try:
        pending_q = text("SELECT COUNT(*) as cnt FROM tab_ordenes WHERE ind_estado = 1")
        pending_row = db.execute(pending_q).mappings().first()
        pending = int(pending_row.get("cnt", 0) or 0)
        if pending > 0:
            alerts.append(f"{pending} órdenes pendientes de envío")

        stock_q = text("""
            WITH product_stock AS (
                SELECT p.id,
                    COALESCE(SUM(c.stock), 0)::BIGINT AS stock_total
                FROM tab_products p
                LEFT JOIN tab_product_variant_groups g ON g.product_id = p.id
                LEFT JOIN tab_product_variant_combinations c ON c.group_id = g.id AND c.is_active = TRUE
                WHERE p.is_active = TRUE
                GROUP BY p.id
            )
            SELECT
                COUNT(*) FILTER (WHERE stock_total > 0 AND stock_total <= 10) AS stock_bajo,
                COUNT(*) FILTER (WHERE stock_total = 0) AS sin_stock
            FROM product_stock
        """)
        stock_row = db.execute(stock_q).mappings().first()
        stock_bajo = int(stock_row.get("stock_bajo", 0) or 0)
        sin_stock = int(stock_row.get("sin_stock", 0) or 0)
        if stock_bajo > 0:
            alerts.append(f"{stock_bajo} productos con stock bajo (<=10)")
        if sin_stock > 0:
            alerts.append(f"{sin_stock} productos sin stock")
    except Exception:
        pass
    return alerts


def detect_intent(message: str) -> str | None:
    """Detecta la intención del usuario por keywords."""
    msg_lower = message.strip().lower()
    if any(kw in msg_lower for kw in INTENT_PENDING_ORDERS):
        return "pending_orders"
    if any(kw in msg_lower for kw in INTENT_RECENT_ORDERS):
        return "recent_orders"
    if any(kw in msg_lower for kw in INTENT_TOP_PRODUCTS):
        return "top_products"
    if any(kw in msg_lower for kw in INTENT_SALES_SUMMARY):
        return "sales_summary"
    if any(kw in msg_lower for kw in INTENT_ALERTS):
        return "alerts"
    if any(kw in msg_lower for kw in INTENT_GENERAL):
        return "general"
    if any(kw in msg_lower for kw in INTENT_ACTION):
        return "action"
    return None


def fetch_intent_data(db: Session, intent: str) -> dict:
    """Obtiene datos según la intención detectada."""
    if intent == "pending_orders":
        q = text("SELECT COUNT(*) as cnt FROM tab_ordenes WHERE ind_estado = 1")
        row = db.execute(q).mappings().first()
        return {"pending_orders": int(row.get("cnt", 0) or 0)}

    if intent == "recent_orders":
        data = get_dashboard_data(db, "monthly")
        recent = data.get("recentOrders", [])[:10]
        return {
            "recentOrders": [
                {"id": o.get("id"), "date": o.get("date"), "amount": o.get("amount"),
                 "status": o.get("status"), "customer": o.get("customer"), "items": o.get("items")}
                for o in recent
            ],
        }

    if intent == "top_products":
        data = get_dashboard_data(db, "monthly")
        best = data.get("bestSellers", [])[:5]
        return {"bestSellers": [{"name": b.get("name"), "sales": b.get("sales"), "revenue": b.get("revenue")} for b in best]}

    if intent == "sales_summary":
        data = get_dashboard_data(db, "monthly")
        kpis = data.get("kpis", {})
        return {
            "kpis": {
                "totalOrders": kpis.get("totalOrders", {}).get("formatted", "0"),
                "activeOrders": kpis.get("activeOrders", {}).get("formatted", "0"),
                "shippedOrders": kpis.get("shippedOrders", {}).get("formatted", "0"),
                "totalRevenue": kpis.get("totalRevenue", {}).get("formatted", "$0"),
            },
        }

    if intent == "alerts":
        return {"alerts": get_alerts(db)}

    if intent == "general":
        data = get_dashboard_data(db, "monthly")
        kpis = data.get("kpis", {})
        best = data.get("bestSellers", [])[:5]
        recent = data.get("recentOrders", [])[:5]
        alerts = get_alerts(db)
        return {
            "kpis": {
                "totalOrders": kpis.get("totalOrders", {}).get("formatted", "0"),
                "activeOrders": kpis.get("activeOrders", {}).get("formatted", "0"),
                "shippedOrders": kpis.get("shippedOrders", {}).get("formatted", "0"),
                "totalRevenue": kpis.get("totalRevenue", {}).get("formatted", "$0"),
            },
            "bestSellers": [{"name": b.get("name"), "sales": b.get("sales")} for b in best],
            "recentOrdersCount": len(recent),
            "recentOrders": [{"id": o.get("id"), "date": o.get("date"), "amount": o.get("amount"), "customer": o.get("customer")} for o in recent],
            "alerts": alerts,
        }

    return {}


def reply_for_action(message: str, db: Session, user_id: str | int) -> str:
    """
    Ejecuta una acción (crear marca, proveedor, etc.) a partir del mensaje.
    Parsea con el LLM, valida y ejecuta en backend. Devuelve mensaje de éxito o error.
    """
    parsed = admin_ai_actions.parse_action_from_message(message)
    if not parsed:
        return "No entendí qué acción quieres hacer. Prueba por ejemplo: «crea la marca Nike» o «crear proveedor Juan, juan@mail.com, 3001234567»."
    return admin_ai_actions.execute_action(db, parsed["action"], parsed["params"], str(user_id))


def reply_for_intent(message: str, intent: str, db: Session) -> str:
    """Genera la respuesta de texto para un mensaje e intención dados (solo lectura)."""
    data = fetch_intent_data(db, intent)
    user_content = f"El usuario pregunta: {message}\n\nDatos disponibles:\n{json.dumps(data, ensure_ascii=False)}\n\nResponde usando solo estos datos."
    return chat_completion(user_content=user_content, system_content=CHAT_SYSTEM_PROMPT, temperature=0.3)


def stream_reply_sse(
    message: str, intent: str, db: Session, user_id: str | int | None = None
) -> Iterator[bytes]:
    """Generador de eventos SSE para chat con streaming."""
    if intent == "action":
        try:
            reply = reply_for_action(message, db, user_id or 0)
            yield f"data: {json.dumps({'text': reply})}\n\n".encode("utf-8")
        except Exception:
            yield f"data: {json.dumps({'error': 'Error al ejecutar la acción'})}\n\n".encode("utf-8")
        return
    try:
        data = fetch_intent_data(db, intent)
        user_content = f"El usuario pregunta: {message}\n\nDatos disponibles:\n{json.dumps(data, ensure_ascii=False)}\n\nResponde usando solo estos datos."
        for chunk in chat_completion_stream(user_content=user_content, system_content=CHAT_SYSTEM_PROMPT, temperature=0.3):
            yield f"data: {json.dumps({'text': chunk})}\n\n".encode("utf-8")
    except Exception:
        yield f"data: {json.dumps({'error': 'Error al generar respuesta'})}\n\n".encode("utf-8")


def generate_dashboard_summary(db: Session, time_range: str = "monthly") -> str:
    """Genera resumen en lenguaje natural del dashboard para el período indicado."""
    if time_range not in ("daily", "weekly", "monthly"):
        time_range = "monthly"
    data = get_dashboard_data(db, time_range)
    alerts = get_alerts(db)
    kpis = data.get("kpis", {})
    best_sellers = data.get("bestSellers", [])[:3]
    recent_orders = data.get("recentOrders", [])
    summary = data.get("summary", {})
    context = {
        "timeRange": time_range,
        "kpis": {
            "totalOrders": kpis.get("totalOrders", {}).get("formatted", "0"),
            "activeOrders": kpis.get("activeOrders", {}).get("formatted", "0"),
            "shippedOrders": kpis.get("shippedOrders", {}).get("formatted", "0"),
            "totalRevenue": kpis.get("totalRevenue", {}).get("formatted", "$0"),
        },
        "bestSellers": [{"name": b.get("name"), "sales": b.get("sales")} for b in best_sellers],
        "recentOrdersCount": len(recent_orders),
        "summary": summary,
        "alerts": alerts,
    }
    user_content = f"Resume estos datos del dashboard en 2-4 frases:\n\n{json.dumps(context, ensure_ascii=False)}"
    return chat_completion(user_content=user_content, system_content=SUMMARY_SYSTEM_PROMPT, temperature=0.3)
