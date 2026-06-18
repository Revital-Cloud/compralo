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
import logging
import re
import unicodedata
from typing import Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

from core.config import settings
from services.dashboard_service import get_dashboard_data
from services.groq_service import (
    chat_completion,
    chat_with_tools,
    LIGHT_MODEL,
    HEAVY_MODEL,
)
from services import admin_ai_actions
from services.admin_ai_tools import ADMIN_AI_TOOLS
from services.admin_ai_memory import (
    save_conversation,
    get_recent_conversations,
    build_history_messages,
    get_pending_action,
    mark_pending_action_resolved,
)
from services.admin_ai_instructions import (
    FALLBACK_REPLY,
    SUMMARY_SYSTEM_PROMPT,
    SYSTEM_PROMPT_ADMIN_AI,
)

logger = logging.getLogger(__name__)

PRODUCT_DESCRIPTION_SYSTEM_PROMPT = """
Eres un experto en copywriting e-commerce, SEO on-page y conversión.
Tu misión: redactar descripciones de producto listas para vender.

Reglas obligatorias:
1) Escribe en español natural, claro y profesional.
2) Extensión entre 120 y 180 palabras.
3) No uses viñetas, títulos ni prefijos como "Descripción:".
4) Evita frases genéricas, relleno y clichés vacíos.
5) Usa lenguaje comercial orientado a beneficios concretos para el cliente.
6) Incluye de forma natural palabras clave relevantes (nombre, categoría, marca y atributos), sin keyword stuffing.
7) Adapta el texto al tipo de categoría; no reutilices plantillas genéricas.
8) Enfatiza valor, diferenciadores y utilidad real, no solo especificaciones.
9) No inventes certificaciones o garantías que no estén en los datos de entrada.
10) Devuelve solo el texto final de la descripción.
11) PROHIBIDO mencionar precio, descuentos, stock, unidades disponibles, tallas, colores, medidas o atributos técnicos.
12) El texto debe sonar aspiracional y persuasivo, como mensaje de venta para atraer clientes.
""".strip()


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


def _normalize_for_intent(text: str) -> str:
    """Normaliza para matching: quita tildes y pasa a minúsculas."""
    nfkd = unicodedata.normalize("NFD", text)
    without_accents = "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")
    return without_accents.casefold()


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
    elif action_id == "create_category":
        nom = params.get("name") or ""
        parent_id = params.get("parent_id")
        if parent_id is None:
            desc = f'Crear la categoría raíz "{nom}".'
        else:
            desc = f'Crear la categoría "{nom}" como hija de la categoría con ID {parent_id}.'
    elif action_id == "create_discount":
        nom = params.get("nom_descuento") or ""
        tipo_calculo = params.get("tipo_calculo")
        if tipo_calculo:
            val = params.get("val_porce_descuento")
            desc = f'Crear el descuento "{nom}" con {val}% de descuento.'
        else:
            val = params.get("val_monto_descuento")
            try:
                val_fmt = f"${int(float(val or 0)):,}".replace(",", ".")
            except Exception:
                val_fmt = f"${val}"
            desc = f'Crear el descuento "{nom}" con {val_fmt} de descuento.'
    elif action_id == "toggle_product_status":
        pid = params.get("product_id")
        nom = (params.get("product_name") or "").strip()
        activar = params.get("activar")
        if nom:
            desc = f'{"Activar" if activar else "Desactivar"} el producto "{nom}".'
        else:
            desc = f'{"Activar" if activar else "Desactivar"} el producto con ID {pid}.'
    elif action_id == "update_order_status":
        oid = params.get("order_id")
        est = params.get("new_status")
        estado_map = {1: "Pendiente", 2: "Completada", 3: "Cancelada"}
        desc = f'Actualizar la orden #{oid} a estado «{estado_map.get(est, est)}».'
    elif action_id == "toggle_discount_status":
        did = params.get("discount_id")
        activar = params.get("activar")
        desc = f'{"Activar" if activar else "Desactivar"} el descuento con ID {did}.'
    else:
        desc = "Ejecutar una acción administrativa con los datos que indicaste."

    return (
        "Estos serían los cambios que voy a aplicar:\n"
        f"- {desc}\n\n"
        "¿Confirmas que deseas continuar?"
    )


def _maybe_handle_pending_action_confirmation(
    message: str, db: Session, user_id: str | int
) -> Optional[str | dict[str, any]]:
    """
    Si hay una acción pendiente, interpreta el mensaje como confirmación/cancelación.
    Devuelve la respuesta al usuario (string o dict con metadata) o None si no había acción pendiente.
    """
    pending = get_pending_action(db, user_id)
    if not pending:
        return None

    # Normalización más tolerante:
    # - quita tildes
    # - ignora puntuación
    # - interpreta frases naturales ("sí claro continúa", "ok dale", etc.)
    normalized = _normalize_for_intent(message or "")
    msg_tokens = set(re.findall(r"[a-z0-9]+", normalized))

    confirm_tokens = {
        "si", "s", "ok", "vale", "confirmar", "confirmo",
        "claro", "continua", "continuar", "prosigue", "procede",
        "dale", "hazlo", "hagalo", "haganlo", "adelante",
    }
    cancel_tokens = {
        "no", "cancelar", "cancelo", "deten", "detente",
        "parar", "pare", "mejor", "nunca",
    }

    has_confirm = bool(msg_tokens & confirm_tokens)
    has_cancel = bool(msg_tokens & cancel_tokens)

    # Si hay señales mixtas ("sí, pero no..."), pedimos aclaración explícita.
    if has_confirm and has_cancel:
        return (
            "Veo señales mixtas en tu respuesta. "
            "Responde solo «sí» para ejecutar o «no» para cancelar."
        )

    if has_confirm:
        result_data = admin_ai_actions.execute_action_with_metadata(
            db, pending["action"], pending["params"], str(user_id)
        )
        result = result_data["message"]
        # El registro con status "executed" marca la acción como resuelta para
        # get_pending_action (estado derivado del historial, no en memoria).
        save_conversation(
            db, user_id, message, result,
            tool_calls=[{"name": pending["action"], "params": pending["params"], "status": "executed"}]
        )
        # Devolver dict con metadata para invalidar queries en el frontend
        return {"message": result, "affected_entities": result_data["affected_entities"]}

    if has_cancel:
        cancel_msg = "He cancelado la acción pendiente, no se ejecutará nada."
        # El registro con status "cancelled" resuelve la acción pendiente.
        save_conversation(
            db, user_id, message, cancel_msg,
            tool_calls=[{"name": pending["action"], "params": pending["params"], "status": "cancelled"}]
        )
        return cancel_msg

    # Si detectamos que el usuario escribió una instrucción nueva,
    # descartamos la acción pendiente y dejamos continuar el flujo normal.
    new_intent_tokens = {
        "crear", "crea", "actualizar", "actualiza", "dame", "mostrar", "muestrame",
        "listar", "lista", "obtener", "quiero", "busca", "buscar",
    }
    if msg_tokens & new_intent_tokens:
        # Persistimos un marcador de cancelación para que la acción deje de
        # considerarse pendiente, y dejamos continuar el flujo normal.
        mark_pending_action_resolved(db, user_id, pending)
        return None

    # Respuesta ambigua: mantenemos la acción pendiente y pedimos confirmación explícita.
    return (
        "Tengo una acción pendiente sin confirmar. Responde «sí» para ejecutarla "
        "o «no» para cancelarla, o escribe una nueva instrucción si quieres hacer otra cosa."
    )


def _select_model_for_admin_ai(message: str) -> str:
    """
    Selecciona el modelo de Groq a usar para el chat admin.

    Patrón:
    - Por defecto, usar el modelo ligero para casi todo.
    - Usar el modelo pesado solo cuando el mensaje pide explícitamente un
      análisis/profundidad inusual.

    Nota: el router limita el mensaje a 1000 caracteres, por eso no se usa la
    longitud como criterio (sería inalcanzable).
    """
    msg_lower = message.strip().lower()

    # Palabras clave de "análisis profundo".
    deep_keywords = (
        "analiza en detalle",
        "explica en detalle",
        "informe completo",
        "análisis completo",
        "analisis completo",
        "haz un análisis",
        "haz un analisis",
    )
    if any(kw in msg_lower for kw in deep_keywords):
        return HEAVY_MODEL

    # Resto de casos: modelo ligero.
    return LIGHT_MODEL


# Iteraciones máximas del loop de tools (encadenado de lecturas antes de
# forzar una respuesta de texto). Configurable por entorno.
MAX_TOOL_ITERATIONS = max(1, settings.GROQ_MAX_TOOL_ITERATIONS)

# Tools de SOLO LECTURA: se ejecutan sin confirmación. Cualquier otra tool es
# de escritura y requiere confirmación explícita del usuario.
READ_ONLY_TOOLS = frozenset({
    "get_store_summary", "list_categories", "list_products", "get_product",
    "list_orders", "get_order", "check_low_stock", "list_users", "get_user",
    "list_discounts", "get_top_stock_products", "get_top_categories_by_revenue",
    "get_conversion_metrics", "get_geographic_sales", "get_hourly_traffic",
    "get_customer_demographics",
})


def _parse_tool_call(tool_call: dict) -> tuple[Optional[str], dict, Optional[str]]:
    """Extrae (nombre, params, id) de un tool_call estilo OpenAI/Groq."""
    function = tool_call.get("function") or {}
    name = function.get("name")
    raw_args = function.get("arguments") or "{}"
    try:
        params = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
        if not isinstance(params, dict):
            params = {}
    except json.JSONDecodeError:
        params = {}
    return name, params, tool_call.get("id")


def _accumulate_usage(acc: dict, response: dict) -> None:
    """Suma el consumo de tokens de una respuesta de Groq al acumulador del turno."""
    usage = response.get("usage") if isinstance(response, dict) else None
    if not isinstance(usage, dict):
        return
    for key in ("prompt_tokens", "completion_tokens", "total_tokens"):
        try:
            acc[key] = acc.get(key, 0) + int(usage.get(key) or 0)
        except Exception:
            continue


def _guard_write_action(name: str, params: dict, message: str) -> Optional[str]:
    """
    Guardas anti-alucinación para acciones de escritura: solo se preparan si los
    datos clave aparecen explícitamente en el mensaje del usuario. Devuelve un
    mensaje para el usuario si la acción NO debe prepararse, o None si es válida.
    """
    if name == "create_brand":
        nom = str(params.get("nom_marca") or "").strip()
        if not nom or nom.lower() not in message.lower():
            return (
                "Puedo ayudarte a crear una marca, pero necesito que me digas el nombre "
                "exacto. Por ejemplo: \"crea la marca Nike\"."
            )
    elif name == "create_provider":
        nom = str(params.get("nom_proveedor") or "").strip()
        email = str(params.get("email") or "").strip()
        if not nom:
            return (
                "Puedo ayudarte a crear un proveedor, pero necesito el nombre. "
                "Por ejemplo: \"crea el proveedor Formula Racing SAS\"."
            )
        if not email or "@" not in email:
            return (
                f"Perfecto, para crear el proveedor «{nom}» me falta el email. "
                "Compárteme un correo válido y lo preparo para confirmar."
            )
    return None


def chat_with_admin_ai(
    message: str, db: Session, user_id: str | int
) -> str | dict[str, any]:
    """
    Punto de entrada del chat admin: un único pipeline basado en tool calling.

    1) Si hay una acción pendiente, interpreta confirmación/cancelación.
    2) Pasa el historial reciente como turnos reales para que el modelo resuelva
       referencias ("ese producto", "esa última orden") por sí mismo.
    3) Loop de tools: el modelo encadena herramientas de LECTURA (sus resultados
       se devuelven al modelo) hasta producir una respuesta final de texto.
    4) Las herramientas de ESCRITURA interrumpen el loop y piden confirmación
       explícita (con guardas anti-alucinación).

    Devuelve texto, o un dict {message, affected_entities} cuando una acción de
    escritura ya se ejecutó (para que el frontend invalide sus queries).
    """
    # 1) Resolver una acción pendiente primero (confirmar/cancelar).
    maybe = _maybe_handle_pending_action_confirmation(message, db, user_id)
    if maybe is not None:
        save_conversation(
            db, user_id, message,
            maybe["message"] if isinstance(maybe, dict) else maybe,
        )
        return maybe

    message = message.strip()

    # 2) Historial como turnos reales + mensaje actual.
    recent_convs = get_recent_conversations(db, user_id, limit=6, days_back=7)
    history_messages = build_history_messages(recent_convs, max_chars=4000)
    messages: list[dict[str, any]] = [
        {"role": "system", "content": SYSTEM_PROMPT_ADMIN_AI.strip()},
        *history_messages,
        {"role": "user", "content": message},
    ]

    model_name = _select_model_for_admin_ai(message)
    usage: dict[str, int] = {}
    executed_tools: list[dict[str, any]] = []

    def _save_and_return_text(text: str) -> str:
        save_conversation(
            db, user_id, message, text,
            context_data={"usage": usage, "model": model_name},
            tool_calls=executed_tools or None,
        )
        return text

    for _ in range(MAX_TOOL_ITERATIONS):
        try:
            response = chat_with_tools(
                messages=messages, tools=ADMIN_AI_TOOLS,
                model=model_name, temperature=0.0,
            )
        except ValueError:
            return _save_and_return_text(
                "La IA no está configurada actualmente. Pídele al administrador que configure GROQ_API_KEY."
            )
        except RuntimeError:
            return _save_and_return_text(
                "Tuve un problema momentáneo al consultar esa información. "
                "¿Puedes intentar de nuevo en unos segundos?"
            )

        _accumulate_usage(usage, response)
        choices = response.get("choices") or []
        message_obj = (choices[0].get("message") or {}) if choices and isinstance(choices[0], dict) else {}
        tool_calls = message_obj.get("tool_calls") or []
        content = message_obj.get("content")

        # 3) Sin tool_calls -> respuesta final de texto.
        if not tool_calls:
            if isinstance(content, str) and content.strip():
                # Guard rail: si el modelo "confirma" sin tool_call, no lo ejecutamos.
                if "¿confirmas que deseas continuar?" in content.lower():
                    return _save_and_return_text(
                        "No pude preparar una acción válida para ejecutar. "
                        "Intenta de nuevo con una instrucción explícita, por ejemplo: \"crea la marca Nike\"."
                    )
                return _save_and_return_text(content)
            return _save_and_return_text(FALLBACK_REPLY)

        # Registramos el turno del asistente con sus tool_calls para mantener el hilo.
        messages.append({"role": "assistant", "content": content or "", "tool_calls": tool_calls})

        # 4) ¿Alguna escritura? -> preparar confirmación e interrumpir el loop.
        write_call = next(
            (tc for tc in tool_calls if (_parse_tool_call(tc)[0] or "") not in READ_ONLY_TOOLS),
            None,
        )
        if write_call is not None:
            name, params, _ = _parse_tool_call(write_call)
            if not name:
                return _save_and_return_text(
                    "He intentado preparar una acción, pero no pude extraer parámetros válidos. "
                    "Dime de nuevo qué quieres hacer, por ejemplo: \"crea la marca Nike\"."
                )
            guard_reply = _guard_write_action(name, params, message)
            if guard_reply is not None:
                return _save_and_return_text(guard_reply)
            confirmation_msg = _build_action_confirmation_message(name, params)
            # El status "pending" en el historial es el estado autoritativo que
            # recupera get_pending_action en el siguiente mensaje del usuario.
            save_conversation(
                db, user_id, message, confirmation_msg,
                context_data={"usage": usage, "model": model_name},
                tool_calls=[{"name": name, "params": params, "status": "pending"}],
            )
            return confirmation_msg

        # Solo lecturas: ejecutar todas, devolver resultados al modelo y reiterar.
        for tc in tool_calls:
            name, params, call_id = _parse_tool_call(tc)
            try:
                result = admin_ai_actions.execute_action(db, name, params, user_id)
            except Exception:
                logger.exception("Error ejecutando tool de lectura %s", name)
                result = "No se pudo obtener esa información en este momento."
            executed_tools.append({"name": name, "params": params, "status": "executed"})
            messages.append({
                "role": "tool",
                "tool_call_id": call_id or (name or "tool"),
                "name": name or "tool",
                "content": result,
            })

    # Se agotaron las iteraciones: forzamos una respuesta de texto final sin tools.
    try:
        final = chat_with_tools(
            messages=messages, tools=ADMIN_AI_TOOLS,
            model=model_name, temperature=0.0, tool_choice="none",
        )
        _accumulate_usage(usage, final)
        choices = final.get("choices") or []
        msg_obj = (choices[0].get("message") or {}) if choices and isinstance(choices[0], dict) else {}
        content = msg_obj.get("content")
        if isinstance(content, str) and content.strip():
            return _save_and_return_text(content)
    except Exception:
        logger.exception("Error al forzar respuesta final del loop de tools")

    # Fallback: devolver el último resultado de tool si existe.
    last_tool = next((m for m in reversed(messages) if m.get("role") == "tool"), None)
    if last_tool and isinstance(last_tool.get("content"), str) and last_tool["content"].strip():
        return _save_and_return_text(last_tool["content"])
    return _save_and_return_text(FALLBACK_REPLY)


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
            "unitsSold": kpis.get("unitsSold", {}).get("formatted", "0"),
            "shippedOrders": kpis.get("shippedOrders", {}).get("formatted", "0"),
            "totalRevenue": kpis.get("totalRevenue", {}).get("formatted", "$0"),
        },
        "bestSellers": [{"name": b.get("name"), "sales": b.get("sales")} for b in best_sellers],
        "recentOrdersCount": len(recent_orders),
        "summary": summary,
        "alerts": alerts,
    }
    user_content = f"Resume estos datos del dashboard en 2-4 frases:\n\n{json.dumps(context, ensure_ascii=False)}"
    return chat_completion(user_content=user_content, system_content=SUMMARY_SYSTEM_PROMPT, temperature=0.0)


def generate_product_description(
    *,
    name: str,
    category: str,
    brand: Optional[str] = None,
    attributes: Optional[dict[str, Any]] = None,
    tone: Optional[str] = None,
) -> str:
    """
    Genera una descripción de producto optimizada para SEO y conversión.
    """
    safe_name = (name or "").strip()
    safe_category = (category or "").strip()
    safe_brand = (brand or "").strip()
    safe_tone = (tone or "").strip()

    if not safe_name:
        raise ValueError("El nombre del producto es obligatorio.")
    if not safe_category:
        raise ValueError("La categoría del producto es obligatoria.")

    normalized_attributes: dict[str, Any] = {}
    for key, value in (attributes or {}).items():
        key_str = str(key).strip()
        if not key_str:
            continue
        if value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
            if not value:
                continue
        normalized_attributes[key_str] = value

    user_payload = {
        "product_name": safe_name,
        "category": safe_category,
        "brand": safe_brand or None,
        "tone": safe_tone or "profesional y persuasivo",
        "attributes": normalized_attributes,
    }
    user_content = (
        "Genera una descripción comercial aspiracional del producto con esta información estructurada:\n"
        f"{json.dumps(user_payload, ensure_ascii=False)}\n\n"
        "Recuerda: prioriza beneficios emocionales y valor percibido, con SEO natural y enfoque total en conversión. "
        "No incluyas precio, stock ni especificaciones técnicas."
    )

    description = chat_completion(
        user_content=user_content,
        system_content=PRODUCT_DESCRIPTION_SYSTEM_PROMPT,
        temperature=0.2,
    )
    normalized = " ".join((description or "").split()).strip()
    if not normalized:
        raise RuntimeError("No se pudo generar una descripción válida en este momento.")
    return normalized
