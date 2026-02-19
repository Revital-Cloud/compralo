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
from typing import Iterator, Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

from services.dashboard_service import get_dashboard_data
from services.groq_service import chat_completion, chat_completion_stream, chat_with_tools
from services import admin_ai_actions
from services import admin_ai_state
from services.admin_ai_tools import ADMIN_AI_TOOLS
from services.admin_ai_instructions import (
    INTENT_PENDING_ORDERS,
    INTENT_TOP_PRODUCTS,
    INTENT_SALES_SUMMARY,
    INTENT_ALERTS,
    INTENT_RECENT_ORDERS,
    INTENT_GENERAL,
    FALLBACK_REPLY,
    CHAT_SYSTEM_PROMPT,
    SUMMARY_SYSTEM_PROMPT,
    SYSTEM_PROMPT_ADMIN_AI,
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
    """
    Detecta la intención del usuario SOLO para consultas de lectura
    (órdenes, productos, resúmenes, alertas).

    Las acciones de escritura (crear marca, proveedor, actualizar barra)
    se resuelven exclusivamente vía tool calling, no por keywords.
    """
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
    Parsea la acción del mensaje y pide confirmación. NUNCA ejecuta en el primer mensaje.
    Las acciones solo se ejecutan tras confirmación explícita vía handle_confirmation_or_new_intent.
    """
    # Mantener compatibilidad temporal si se llama directamente: redirigimos al
    # nuevo flujo basado en tool calling.
    return chat_with_admin_ai(message, db, user_id)


def handle_confirmation_or_new_intent(
    message: str, db: Session, user_id: str | int
) -> str | None:
    """
    Si hay acción pendiente, interpreta confirmación/cancelación y ejecuta o cancela.
    Las acciones NUNCA se ejecutan sin confirmación explícita.
    Devuelve None si no hay acción pendiente (el flujo normal debe continuar).
    """
    # Mantener compatibilidad temporal con el router actual: reutilizamos la
    # lógica nueva de confirmación dentro de chat_with_admin_ai.
    reply = _maybe_handle_pending_action_confirmation(message, db, user_id)
    return reply


def reply_for_intent(message: str, intent: str, db: Session) -> str:
    """Genera la respuesta de texto para un mensaje e intención dados (solo lectura)."""
    data = fetch_intent_data(db, intent)
    user_content = f"El usuario pregunta: {message}\n\nDatos disponibles:\n{json.dumps(data, ensure_ascii=False)}\n\nResponde usando solo estos datos."
    return chat_completion(user_content=user_content, system_content=CHAT_SYSTEM_PROMPT, temperature=0.3)


def _build_action_confirmation_message(action_id: str, params: dict) -> str:
    """Devuelve un texto amigable describiendo la acción que se va a ejecutar."""
    desc: str
    if action_id == "update_top_info_bar":
        des_mensaje = params.get("des_mensaje") or ""
        desc = f'Actualizar la barra informativa con el mensaje: "{des_mensaje}".'
    elif action_id == "create_brand":
        nom = params.get("nom_marca") or ""
        desc = f'Crear la marca "{nom}".'
    elif action_id == "create_provider":
        nom = params.get("nom_proveedor") or ""
        email = params.get("email") or ""
        desc = f'Crear el proveedor "{nom}" con email "{email}".'
    else:
        desc = "Ejecutar una acción administrativa con los datos que indicaste."

    return (
        "Estos serían los cambios que voy a aplicar:\n"
        f"- {desc}\n\n"
        "¿Confirmas que deseas continuar?"
    )


def _maybe_handle_pending_action_confirmation(
    message: str, db: Session, user_id: str | int
) -> Optional[str]:
    """
    Si hay una acción pendiente, interpreta el mensaje como confirmación/cancelación.
    Devuelve la respuesta al usuario o None si no había acción pendiente.
    """
    pending = admin_ai_state.get_pending_action(user_id)
    if not pending:
        return None

    msg_norm = message.strip().lower()
    CONFIRM = {"sí", "si", "ok", "vale", "confirmar", "confirmo"}
    CANCEL = {"no", "cancelar", "cancelo"}

    def _matches_any(text: str, words: set[str]) -> bool:
        if text in words:
            return True
        for w in words:
            if text.startswith(f"{w} ") or text.endswith(f" {w}") or f" {w} " in text:
                return True
        return False

    if _matches_any(msg_norm, CONFIRM):
        result = admin_ai_actions.execute_action(
            db, pending["action"], pending["params"], str(user_id)
        )
        admin_ai_state.clear_pending_action(user_id)
        return result

    if _matches_any(msg_norm, CANCEL):
        admin_ai_state.clear_pending_action(user_id)
        return "He cancelado la acción pendiente, no se ejecutará nada."

    # Respuesta ambigua: mantenemos la acción pendiente y pedimos confirmación explícita.
    return (
        "Tengo una acción pendiente sin confirmar. Responde «sí» para ejecutarla "
        "o «no» para cancelarla, o escribe una nueva instrucción si quieres hacer otra cosa."
    )


def chat_with_admin_ai(
    message: str, db: Session, user_id: str | int
) -> str:
    """
    Punto de entrada de alto nivel para el chat admin.

    - Si hay acción pendiente, interpreta confirmación/cancelación.
    - En caso contrario, llama al LLM con tools; si hay tool_calls, pide confirmación.
    - Si no hay tool_calls, devuelve texto normal del modelo.
    """
    # 1) Intentar resolver una acción pendiente primero.
    maybe = _maybe_handle_pending_action_confirmation(message, db, user_id)
    if maybe is not None:
        return maybe

    # 2) Preparar mensajes para el LLM con tools.
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_ADMIN_AI.strip()},
        {"role": "user", "content": message.strip()},
    ]

    try:
        response = chat_with_tools(messages=messages, tools=ADMIN_AI_TOOLS)
    except ValueError:
        # IA no disponible -> mensaje claro al usuario.
        return "La IA no está configurada actualmente. Pídele al administrador que configure GROQ_API_KEY."

    except RuntimeError as e:
        return f"Ocurrió un error al usar la IA: {str(e)}"

    # Estructura tipo OpenAI Chat Completions.
    choices = response.get("choices") or []
    if not choices:
        return FALLBACK_REPLY

    first = choices[0]
    message_obj = (first.get("message") or {}) if isinstance(first, dict) else {}
    tool_calls = message_obj.get("tool_calls") or []

    # Si no hay tool_calls, devolvemos la respuesta de texto normal.
    content = message_obj.get("content")
    if not tool_calls:
        if isinstance(content, str) and content.strip():
            return content
        return FALLBACK_REPLY

    # 3) Hay al menos un tool_call: extraemos la primera llamada válida.
    tool_call = tool_calls[0]
    function = tool_call.get("function") or {}
    name = function.get("name")
    raw_args = function.get("arguments") or "{}"

    try:
        params = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
        if not isinstance(params, dict):
            params = {}
    except json.JSONDecodeError:
        params = {}

    if not name or not params:
        return (
            "He intentado preparar una acción, pero no pude extraer parámetros válidos. "
            "Dime de nuevo qué quieres hacer, por ejemplo: 'crea la marca Nike' o "
            "'actualiza la barra con: Envíos gratis hoy'."
        )

    # Guardas extra para evitar alucinaciones: solo aceptamos ciertas tools si
    # los parámetros clave aparecen explícitamente en el mensaje original.
    if name == "create_brand":
        nom = str(params.get("nom_marca") or "").strip()
        if not nom or nom.lower() not in message.lower():
            # No hay nombre explícito en el mensaje del usuario: tratamos esto
            # como una pregunta conversacional, no como ejecución de acción.
            return (
                "Puedo ayudarte a crear una marca, pero necesito que me digas el nombre "
                "exacto. Por ejemplo: \"crea la marca Nike\"."
            )

    # Guardar acción pendiente por usuario.
    admin_ai_state.set_pending_action(user_id, name, params)
    return _build_action_confirmation_message(name, params)


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
