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
import re
import time
import unicodedata
from typing import Any, Iterator, Optional

from sqlalchemy.orm import Session
from sqlalchemy import text

from services.dashboard_service import get_dashboard_data
from services.groq_service import (
    chat_completion,
    chat_completion_stream,
    chat_with_tools,
    LIGHT_MODEL,
    HEAVY_MODEL,
)
from services import admin_ai_actions
from services import admin_ai_state
from services.admin_ai_tools import ADMIN_AI_TOOLS
from services.admin_ai_memory import (
    save_conversation,
    get_recent_conversations,
    build_conversation_context,
)
from services.admin_ai_instructions import (
    INTENT_PENDING_ORDERS,
    INTENT_TOP_PRODUCTS,
    INTENT_SALES_SUMMARY,
    INTENT_ALERTS,
    INTENT_RECENT_ORDERS,
    INTENT_GENERAL,
    INTENT_TOP_CATEGORIES,
    INTENT_TOP_STOCK,
    FALLBACK_REPLY,
    CHAT_SYSTEM_PROMPT,
    SUMMARY_SYSTEM_PROMPT,
    SYSTEM_PROMPT_ADMIN_AI,
)

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


def detect_intent(message: str) -> str | None:
    """
    Detecta la intención del usuario SOLO para consultas de lectura
    (órdenes, productos, resúmenes, alertas).

    Las acciones de escritura (crear marca, proveedor, actualizar barra)
    se resuelven exclusivamente vía tool calling, no por keywords.
    """
    msg_lower = message.strip().lower()
    msg_norm = _normalize_for_intent(message.strip())

    # Caso singular: "el producto más vendido"
    # Debe responder 1 resultado, no el top 5.
    if re.search(
        r"\b(producto)\b.*\b(mas|m[aá]s)\b.*\bvendid[oa]s?\b",
        msg_norm,
        flags=re.IGNORECASE,
    ):
        return "top_product"

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


def _extract_requested_top_limit(message: str, default_limit: int = 5, max_limit: int = 20) -> int:
    """
    Extrae límites tipo "top 3", "los 10 más vendidos", etc.
    Si no detecta un número válido, usa default_limit.
    """
    normalized = _normalize_for_intent(message or "")
    patterns = [
        r"\btop\s+(\d{1,2})\b",
        r"\blos\s+(\d{1,2})\s+mas\b",
        r"\b(\d{1,2})\s+productos?\s+mas\b",
    ]
    for pat in patterns:
        m = re.search(pat, normalized, flags=re.IGNORECASE)
        if m:
            try:
                val = int(m.group(1))
                if val <= 0:
                    return default_limit
                return min(val, max_limit)
            except Exception:
                return default_limit
    return default_limit


def fetch_intent_data(db: Session, intent: str, top_limit: int = 5) -> dict:
    """Obtiene datos según la intención detectada."""
    if intent == "top_product":
        data = get_dashboard_data(db, "monthly")
        best = data.get("bestSellers", [])[:1]
        return {"bestSellers": [{"name": b.get("name"), "sales": b.get("sales"), "revenue": b.get("revenue")} for b in best]}

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
        safe_limit = max(1, min(int(top_limit or 5), 20))
        best = data.get("bestSellers", [])[:safe_limit]
        return {"bestSellers": [{"name": b.get("name"), "sales": b.get("sales"), "revenue": b.get("revenue")} for b in best]}

    if intent == "sales_summary":
        data = get_dashboard_data(db, "monthly")
        kpis = data.get("kpis", {})
        return {
            "kpis": {
                "totalOrders": kpis.get("totalOrders", {}).get("formatted", "0"),
                "unitsSold": kpis.get("unitsSold", {}).get("formatted", "0"),
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
                "unitsSold": kpis.get("unitsSold", {}).get("formatted", "0"),
                "shippedOrders": kpis.get("shippedOrders", {}).get("formatted", "0"),
                "totalRevenue": kpis.get("totalRevenue", {}).get("formatted", "$0"),
            },
            "bestSellers": [{"name": b.get("name"), "sales": b.get("sales")} for b in best],
            "recentOrdersCount": len(recent),
            "recentOrders": [{"id": o.get("id"), "date": o.get("date"), "amount": o.get("amount"), "customer": o.get("customer")} for o in recent],
            "alerts": alerts,
        }

    return {}


def format_intent_reply(intent: str, data: dict) -> str:
    """
    Formatea respuestas de solo lectura usando únicamente los datos ya calculados.
    Evita que un LLM "reescriba" o invente contenido cuando el endpoint de streaming
    detecta intenciones por keywords.
    """
    if not isinstance(data, dict) or not data:
        return "No sé con certeza con la información disponible."

    # Nota: los valores de KPIs vienen como strings ya formateadas por fetch_intent_data.
    if intent == "top_product":
        best = data.get("bestSellers") or []
        if not best:
            return "No hay productos con ventas suficientes para identificar el más vendido."
        top = best[0]
        name = top.get("name") or "N/A"
        sales = top.get("sales") if top.get("sales") is not None else 0
        return f"El producto más vendido es «{name}» con {sales} ventas."

    if intent == "pending_orders":
        pending = int(data.get("pending_orders", 0) or 0)
        return (
            f"Tienes {pending} órdenes pendientes de envío."
            if pending > 0
            else "No tienes órdenes pendientes de envío."
        )

    if intent == "recent_orders":
        orders = data.get("recentOrders") or []
        if not orders:
            return "No hay órdenes recientes."
        # Mostramos hasta 3 para mantener la respuesta corta.
        lines: list[str] = []
        for o in orders[:3]:
            oid = o.get("id")
            date = (o.get("date") or "")[:10] if o.get("date") else ""
            amount = o.get("amount")
            status = o.get("status") or ""
            customer = o.get("customer") or "Cliente"
            lines.append(
                f"- Orden #{oid} ({customer}) | ${amount} {('(' + status + ')') if status else ''}{(' ' + date) if date else ''}".strip()
            )
        return "Órdenes recientes:\n" + "\n".join(lines)

    if intent == "top_products":
        best = data.get("bestSellers") or []
        if not best:
            return "No hay productos con ventas suficientes para mostrar el ranking."
        lines = []
        for b in best[:5]:
            name = b.get("name") or "N/A"
            sales = b.get("sales") if b.get("sales") is not None else 0
            lines.append(f"- {name}: {sales} ventas")
        return "Productos más vendidos:\n" + "\n".join(lines)

    if intent == "sales_summary":
        kpis = data.get("kpis") or {}
        total_orders = kpis.get("totalOrders", "0")
        shipped_orders = kpis.get("shippedOrders", "0")
        total_revenue = kpis.get("totalRevenue", "$0")
        units = kpis.get("unitsSold", "0")
        return (
            f"Resumen de ventas: {total_orders} órdenes totales, {shipped_orders} completadas, "
            f"{units} unidades vendidas, ingresos {total_revenue}."
        )

    if intent == "alerts":
        alerts = data.get("alerts") or []
        if not alerts:
            return "No hay alertas de stock en este momento."
        return "Alertas de stock:\n" + "\n".join([f"- {a}" for a in alerts])

    if intent == "general":
        kpis = data.get("kpis") or {}
        total_orders = kpis.get("totalOrders", "0")
        shipped_orders = kpis.get("shippedOrders", "0")
        total_revenue = kpis.get("totalRevenue", "$0")
        units = kpis.get("unitsSold", "0")
        best = data.get("bestSellers") or []
        recent = data.get("recentOrders") or []
        recent_count = data.get("recentOrdersCount", len(recent) or 0) or 0
        alerts = data.get("alerts") or []

        parts: list[str] = []
        parts.append(
            f"La tienda tiene {total_orders} órdenes totales, {shipped_orders} completadas, "
            f"{units} unidades vendidas e ingresos {total_revenue}."
        )
        if best:
            top = ", ".join([f"{b.get('name') or 'N/A'} ({b.get('sales') or 0} ventas)" for b in best[:2]])
            parts.append(f"Productos más vendidos: {top}.")
        if recent and recent_count:
            # Solo 1-2 para mantenerlo corto.
            o0 = recent[0]
            oid = o0.get("id")
            customer = o0.get("customer") or "Cliente"
            amount = o0.get("amount") or 0
            date = (o0.get("date") or "")[:10] if o0.get("date") else ""
            parts.append(f"Última orden: #{oid} ({customer}) por ${amount}{(' el ' + date) if date else ''}.")
        if alerts:
            parts.append("Alertas de stock: " + ", ".join(alerts[:2]) + ("" if len(alerts) <= 2 else "…"))

        return "\n".join(parts)

    # Si no conocemos el intent, fallamos "cerrado".
    return "No sé con certeza con la información disponible."


def _normalize_for_intent(text: str) -> str:
    """Normaliza para matching: quita tildes y pasa a minúsculas."""
    nfkd = unicodedata.normalize("NFD", text)
    without_accents = "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")
    return without_accents.casefold()


def _extract_last_order_id(recent_convs: list[dict[str, any]]) -> int | None:
    """
    Extrae el ID de la última orden del historial reciente.
    Esperado por nuestro propio formatter:
    "Última orden: #29 (...)".
    """
    # Recorremos desde lo más reciente.
    for conv in reversed(recent_convs):
        # Preferimos contexto estructurado (si existe).
        ctx = conv.get("context_data") or {}
        if isinstance(ctx, dict):
            raw = ctx.get("last_order_id")
            if raw is not None:
                try:
                    return int(raw)
                except Exception:
                    pass

        blob = f"{conv.get('reply') or ''}\n{conv.get('message') or ''}"
        n = _normalize_for_intent(blob)
        m = re.search(r"ultima\s*orden\s*:\s*#\s*(\d+)", n, flags=re.IGNORECASE)
        if m:
            try:
                return int(m.group(1))
            except Exception:
                return None
    return None


def _extract_last_top_product_name(recent_convs: list[dict[str, any]]) -> str | None:
    """
    Extrae el nombre del último "producto más vendido" del historial.
    Busca primero en contexto estructurado y luego por regex sobre replies.
    """
    for conv in reversed(recent_convs):
        ctx = conv.get("context_data") or {}
        if isinstance(ctx, dict):
            raw_name = ctx.get("last_top_product_name")
            if isinstance(raw_name, str) and raw_name.strip():
                return raw_name.strip()

        blob = f"{conv.get('reply') or ''}\n{conv.get('message') or ''}"
        # Patrón esperado: El producto más vendido es «Nombre» con N ventas.
        m = re.search(r"producto m[aá]s vendido es [«\"]([^»\"]+)[»\"]", blob, flags=re.IGNORECASE)
        if m and m.group(1).strip():
            return m.group(1).strip()
    return None


def _extract_last_top_products(recent_convs: list[dict[str, any]]) -> list[str]:
    """
    Extrae la última lista de productos top guardada en contexto.
    """
    for conv in reversed(recent_convs):
        ctx = conv.get("context_data") or {}
        if not isinstance(ctx, dict):
            continue
        raw = ctx.get("last_top_products")
        if isinstance(raw, list):
            names = [str(x).strip() for x in raw if isinstance(x, str) and str(x).strip()]
            if names:
                return names
    return []


def _extract_requested_rank_position(message: str) -> int | None:
    """
    Detecta ordinales como 1er/2do/3er, primero/segundo/tercero o #3.
    Retorna posición 1-based.
    """
    normalized = _normalize_for_intent(message or "")

    # Formatos numéricos: 3er, 3ro, 3o, #3, numero 3
    numeric_patterns = [
        r"\b(\d{1,2})(?:er|ro|do|to|o)\b",
        r"#\s*(\d{1,2})\b",
        r"\bnumero\s+(\d{1,2})\b",
        r"\btop\s+(\d{1,2})\b",
    ]
    for pat in numeric_patterns:
        m = re.search(pat, normalized, flags=re.IGNORECASE)
        if m:
            try:
                val = int(m.group(1))
                if val > 0:
                    return val
            except Exception:
                pass

    # Formatos en texto
    text_ordinals = {
        "primer": 1,
        "primero": 1,
        "segunda": 2,
        "segundo": 2,
        "tercer": 3,
        "tercero": 3,
        "cuarto": 4,
        "quinto": 5,
    }
    for token, pos in text_ordinals.items():
        if re.search(rf"\b{token}\b", normalized, flags=re.IGNORECASE):
            return pos

    return None


def _is_likely_product_followup(message: str, has_context_product: bool) -> bool:
    """
    Detección flexible (híbrida) para follow-ups sobre "ese producto".
    No depende de una frase exacta; usa señales semánticas simples.
    """
    if not has_context_product:
        return False

    normalized = _normalize_for_intent(message or "")
    tokens = set(re.findall(r"[a-z0-9]+", normalized))
    if not tokens:
        return False

    # Señales de intención de ampliar información.
    intent_tokens = {
        "info", "informacion", "detalle", "detalles", "explicame",
        "explica", "cuentame", "hablame", "sobre", "mas", "amplia",
    }
    # Señales de referencia al objeto previo.
    reference_tokens = {"producto", "este", "ese", "el", "lo"}

    has_intent = bool(tokens & intent_tokens)
    has_reference = bool(tokens & reference_tokens)

    # Frases cortas y típicas de seguimiento, incluso sin "producto" explícito.
    short_followup_patterns = (
        r"^dame\s+mas\s+info",
        r"^dame\s+mas\s+informacion",
        r"^mas\s+info",
        r"^mas\s+informacion",
        r"^cuentame\s+mas",
        r"^explicame\s+mas",
        r"^hablame\s+de",
    )
    has_short_followup_pattern = any(
        re.search(pat, normalized, flags=re.IGNORECASE) for pat in short_followup_patterns
    )

    return (has_intent and has_reference) or has_short_followup_pattern


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
    top_limit = _extract_requested_top_limit(message) if intent == "top_products" else 5
    data = fetch_intent_data(db, intent, top_limit=top_limit)
    user_content = f"El usuario pregunta: {message}\n\nDatos disponibles:\n{json.dumps(data, ensure_ascii=False)}\n\nResponde usando solo estos datos."
    # Temperatura baja para reducir completions inventadas.
    return chat_completion(user_content=user_content, system_content=CHAT_SYSTEM_PROMPT, temperature=0.0)


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
            desc = f'Crear el descuento "{nom}" con ${val} de descuento.'
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


def _extract_direct_action_from_message(message: str) -> Optional[tuple[str, dict[str, any]]]:
    """
    Extrae acciones simples de forma determinista (sin depender del LLM).
    Esto evita falsos positivos donde el modelo "simula" una confirmación
    sin emitir tool_call real.
    """
    raw = (message or "").strip()
    if not raw:
        return None

    # Patrones tolerantes:
    # - "crea la marca Puma"
    # - "crear marca \"Nvidia\""
    # - "agrega una marca AMD"
    brand_pattern = re.compile(
        r"^(?:crea(?:r)?|agrega(?:r)?|registra(?:r)?)(?:\s+(?:la|el|una?))?\s+marca\s+(.+)$",
        flags=re.IGNORECASE,
    )
    m_brand = brand_pattern.match(raw)
    if m_brand:
        nom_marca = m_brand.group(1).strip().strip("\"'` ")
        if nom_marca:
            return ("create_brand", {"nom_marca": nom_marca})

    return None


def _maybe_handle_pending_action_confirmation(
    message: str, db: Session, user_id: str | int
) -> Optional[str | dict[str, any]]:
    """
    Si hay una acción pendiente, interpreta el mensaje como confirmación/cancelación.
    Devuelve la respuesta al usuario (string o dict con metadata) o None si no había acción pendiente.
    """
    pending = admin_ai_state.get_pending_action(user_id)
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
        admin_ai_state.clear_pending_action(user_id)
        # Guardar conversación de confirmación y ejecución
        save_conversation(
            db, user_id, message, result,
            tool_calls=[{"name": pending["action"], "params": pending["params"], "status": "executed"}]
        )
        # Devolver dict con metadata para invalidar queries en el frontend
        return {"message": result, "affected_entities": result_data["affected_entities"]}

    if has_cancel:
        admin_ai_state.clear_pending_action(user_id)
        cancel_msg = "He cancelado la acción pendiente, no se ejecutará nada."
        # Guardar conversación de cancelación
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
        admin_ai_state.clear_pending_action(user_id)
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
    - Por defecto, usar el modelo ligero (Scout 17B) para casi todo.
    - Usar el modelo pesado (70B) solo si el mensaje es muy largo o explícitamente
      pide un análisis/profundidad inusual.
    """
    msg = message.strip()
    msg_lower = msg.lower()

    # Heurística simple: mensajes muy largos -> modelo pesado.
    if len(msg) > 1000:
        return HEAVY_MODEL

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


def chat_with_admin_ai(
    message: str, db: Session, user_id: str | int
) -> str | dict[str, any]:
    """
    Punto de entrada de alto nivel para el chat admin con aprendizaje incremental.

    - Si hay acción pendiente, interpreta confirmación/cancelación.
    - Obtiene historial de conversaciones recientes para contexto.
    - Detecta automáticamente preguntas de resumen y proporciona contexto.
    - En caso contrario, llama al LLM con tools; si hay tool_calls, pide confirmación.
    - Si no hay tool_calls, devuelve texto normal del modelo.
    - Guarda la conversación en el historial para aprendizaje futuro.
    """
    # 1) Intentar resolver una acción pendiente primero.
    maybe = _maybe_handle_pending_action_confirmation(message, db, user_id)
    if maybe is not None:
        # Guardar conversación de confirmación
        if isinstance(maybe, dict):
            save_conversation(db, user_id, message, maybe["message"])
            return maybe
        else:
            save_conversation(db, user_id, message, maybe)
            return maybe

    # 1.5) Fallback determinista para acciones simples de escritura.
    # Evita depender del tool-calling para comandos triviales (ej. "crea la marca X").
    direct_action = _extract_direct_action_from_message(message)
    if direct_action is not None:
        action_name, action_params = direct_action
        admin_ai_state.set_pending_action(user_id, action_name, action_params)
        confirmation_msg = _build_action_confirmation_message(action_name, action_params)
        save_conversation(
            db, user_id, message, confirmation_msg,
            tool_calls=[{"name": action_name, "params": action_params, "status": "pending"}]
        )
        return confirmation_msg

    # 2) Obtener historial de conversaciones recientes para contexto
    recent_convs = get_recent_conversations(db, user_id, limit=5, days_back=7)
    conversation_context = build_conversation_context(recent_convs, max_tokens=1500)

    # 3) Detectar preguntas específicas y ejecutar la tool correspondiente directamente
    msg_lower = message.strip().lower()
    is_summary_request = any(
        kw in msg_lower 
        for kw in ["resumen", "resume", "resumir", "dame un resumen", "quiero obtener un resumen",
                   "estado de la tienda", "cómo va", "como va", "qué tal", "que tal", 
                   "cómo estamos", "como estamos", "panorama", "visión general", "vision general", 
                   "overview", "resumen general", "información general"]
    )
    is_top_categories_request = any(kw in msg_lower for kw in INTENT_TOP_CATEGORIES)
    is_top_stock_request = any(kw in msg_lower for kw in INTENT_TOP_STOCK)
    msg_norm = _normalize_for_intent(message.strip())
    is_top_product_request = bool(
        re.search(r"\bproducto\b.*\bmas\b.*\bvendid[oa]s?\b", msg_norm, flags=re.IGNORECASE)
    )

    # Follow-up de producto: "ese producto", "explícame más de ese producto", etc.

    # Helper: follow-up determinista para "esa última orden".
    # Evitamos pedir al modelo un ID; lo sacamos del historial calculado por el backend.
    is_last_order_request = any(
        kw in msg_lower
        for kw in [
            "esa ultima orden",
            "esa última orden",
            "de la ultima orden",
            "de la última orden",
            "ultima orden",
            "última orden",
            "informacion de la ultima orden",
            "información de la ultima orden",
            "dame informacion de la ultima orden",
            "dame información de la ultima orden",
            "informacion de esa ultima orden",
            "información de esa ultima orden",
            "informacion de la ultima orden",
            "información de la ultima orden",
            "dame informacion de esa ultima orden",
            "dame información de esa ultima orden",
        ]
    )
    if is_last_order_request:
        last_order_id = _extract_last_order_id(recent_convs)
        if last_order_id is not None:
            try:
                reply = admin_ai_actions.execute_action(
                    db,
                    "get_order",
                    {"order_id": last_order_id},
                    user_id,
                )
                save_conversation(
                    db,
                    user_id,
                    message,
                    reply,
                    context_data=None,
                    tool_calls=[{
                        "name": "get_order",
                        "params": {"order_id": last_order_id},
                        "status": "executed",
                    }],
                )
                return reply
            except Exception:
                # Si algo falla, caemos al flujo normal para que el sistema pueda recuperarse.
                pass
        # Si no hay ID en contexto, degradamos de forma segura.
        return "No sé con certeza con la información disponible."

    # Follow-up determinista para el último "producto más vendido".
    last_product_name = _extract_last_top_product_name(recent_convs)
    last_top_products = _extract_last_top_products(recent_convs)
    requested_rank_pos = _extract_requested_rank_position(message)
    if requested_rank_pos and last_top_products and 1 <= requested_rank_pos <= len(last_top_products):
        last_product_name = last_top_products[requested_rank_pos - 1]
    is_top_product_followup = _is_likely_product_followup(
        message=message,
        has_context_product=bool(last_product_name),
    )
    if is_top_product_followup and last_product_name:
        try:
            reply = admin_ai_actions.execute_action(
                db,
                "get_product",
                {"product_name": last_product_name},
                user_id,
            )
            save_conversation(
                db,
                user_id,
                message,
                reply,
                context_data={"last_top_product_name": last_product_name},
                tool_calls=[{
                    "name": "get_product",
                    "params": {"product_name": last_product_name},
                    "status": "executed",
                }],
            )
            return reply
        except Exception:
            pass
        return "No sé con certeza con la información disponible."

    # Fallback adicional: si el usuario menciona explícitamente "del producto"
    # y venimos de un top product reciente, intentamos resolver igual.
    if last_product_name and re.search(r"\bproducto\b", msg_norm, flags=re.IGNORECASE):
        if last_product_name:
            try:
                reply = admin_ai_actions.execute_action(
                    db,
                    "get_product",
                    {"product_name": last_product_name},
                    user_id,
                )
                save_conversation(
                    db,
                    user_id,
                    message,
                    reply,
                    context_data={"last_top_product_name": last_product_name},
                    tool_calls=[{
                        "name": "get_product",
                        "params": {"product_name": last_product_name},
                        "status": "executed",
                    }],
                )
                return reply
            except Exception:
                pass
        return "No sé con certeza con la información disponible."

    # Seguimiento (anti-hallucination):
    # Si el usuario hace una pregunta corta tipo "y la categoría?" y hace poco
    # ya se le respondió con "categorías más vendidas por ingresos", interpretamos
    # ese seguimiento como "top categorías" y ejecutamos el path determinista.
    is_short_category_followup = bool(
        re.fullmatch(
            r"(y\s*)?la\s*categor(ía|ia)s?\??",
            msg_lower.strip(),
        )
        or msg_lower.strip() in {"categoria", "categoría", "categorias", "categorías"}
    )
    has_recent_top_categories = any(
        (
            "categor" in ((c.get("reply") or "") + " " + (c.get("message") or "")).lower()
            and "vend" in ((c.get("reply") or "") + " " + (c.get("message") or "")).lower()
        )
        for c in recent_convs
    )
    if has_recent_top_categories and is_short_category_followup:
        is_top_categories_request = True

    # Si piden singular ("el producto más vendido"), devolvemos solo 1 de forma determinista.
    if is_top_product_request and not is_summary_request and not is_top_categories_request and not is_top_stock_request:
        try:
            data = fetch_intent_data(db, "top_product")
            reply = format_intent_reply("top_product", data)
            top_name = None
            top_names: list[str] = []
            best = data.get("bestSellers") if isinstance(data, dict) else None
            if isinstance(best, list) and best:
                candidate = best[0].get("name")
                if isinstance(candidate, str) and candidate.strip():
                    top_name = candidate.strip()
                    top_names = [top_name]
            save_conversation(
                db,
                user_id,
                message,
                reply,
                context_data={
                    "last_top_product_name": top_name,
                    "last_top_products": top_names,
                },
                tool_calls=[{
                    "name": "get_top_product_deterministic",
                    "params": {},
                    "status": "executed",
                }],
            )
            return reply
        except Exception:
            pass

    # Si piden "top N productos más vendidos", resolvemos de forma determinista
    # y guardamos la lista para follow-ups por ordinal (ej. "3er producto").
    if (
        detect_intent(message) == "top_products"
        and not is_summary_request
        and not is_top_categories_request
        and not is_top_stock_request
    ):
        try:
            requested_limit = _extract_requested_top_limit(message, default_limit=5, max_limit=20)
            data = fetch_intent_data(db, "top_products", top_limit=requested_limit)
            reply = format_intent_reply("top_products", data)
            top_names: list[str] = []
            best = data.get("bestSellers") if isinstance(data, dict) else None
            if isinstance(best, list):
                for row in best:
                    candidate = row.get("name") if isinstance(row, dict) else None
                    if isinstance(candidate, str) and candidate.strip():
                        top_names.append(candidate.strip())
            save_conversation(
                db,
                user_id,
                message,
                reply,
                context_data={
                    "last_top_product_name": top_names[0] if top_names else None,
                    "last_top_products": top_names,
                },
                tool_calls=[{
                    "name": "get_top_products_deterministic",
                    "params": {"limit": requested_limit},
                    "status": "executed",
                }],
            )
            return reply
        except Exception:
            pass
    
    # Si es una pregunta de resumen, ejecutar automáticamente get_store_summary
    enhanced_message = message.strip()
    context_data = None
    if is_summary_request:
        # Ejecutar directamente get_store_summary sin esperar al LLM
        try:
            summary_result = admin_ai_actions.execute_action(
                db, "get_store_summary", {"time_range": "monthly"}, user_id
            )
            
            # Obtener datos del dashboard para contexto adicional
            data = get_dashboard_data(db, "monthly")
            alerts = get_alerts(db)
            kpis = data.get("kpis", {})
            best_sellers = data.get("bestSellers", [])[:5]
            recent_orders = data.get("recentOrders", [])[:5]
            
            context_data = {
                "kpis": {
                    "totalOrders": kpis.get("totalOrders", {}).get("formatted", "0"),
                    "unitsSold": kpis.get("unitsSold", {}).get("formatted", "0"),
                    "shippedOrders": kpis.get("shippedOrders", {}).get("formatted", "0"),
                    "totalRevenue": kpis.get("totalRevenue", {}).get("formatted", "$0"),
                },
                "bestSellers": [{"name": b.get("name"), "sales": b.get("sales")} for b in best_sellers],
                "recentOrdersCount": len(recent_orders),
                "alerts": alerts,
            }

            # IMPORTANTE: evitamos un paso extra con LLM para prevenir “invenciones”.
            # El backend ya devuelve un texto determinista con datos calculados.
            save_conversation(
                db,
                user_id,
                message,
                summary_result,
                context_data=context_data,
                tool_calls=[{
                    "name": "get_store_summary",
                    "params": {"time_range": "monthly"},
                    "status": "executed",
                }],
            )
            return summary_result
        except Exception as e:
            # Si falla get_store_summary, continuar con el flujo normal
            print(f"Error al obtener resumen automático: {str(e)}")
            pass

    # 3b) Si es pregunta de categoría más vendida, ejecutar get_top_categories_by_revenue directamente
    if is_top_categories_request and not is_summary_request:
        try:
            categories_result = admin_ai_actions.execute_action(
                db, "get_top_categories_by_revenue", {"limit": 10}, user_id
            )

            # IMPORTANTE: evitamos un paso extra con LLM para prevenir “invenciones”.
            save_conversation(
                db,
                user_id,
                message,
                categories_result,
                tool_calls=[{
                    "name": "get_top_categories_by_revenue",
                    "params": {"limit": 10},
                    "status": "executed",
                }],
            )
            return categories_result
        except Exception as e:
            print(f"Error al obtener top categorías: {str(e)}")
            pass

    # 3c) Si es pregunta de producto con mayor stock, ejecutar get_top_stock_products directamente
    if is_top_stock_request and not is_summary_request and not is_top_categories_request:
        try:
            stock_result = admin_ai_actions.execute_action(
                db, "get_top_stock_products", {"limit": 10}, user_id
            )

            # IMPORTANTE: evitamos un paso extra con LLM para prevenir “invenciones”.
            save_conversation(
                db,
                user_id,
                message,
                stock_result,
                tool_calls=[{
                    "name": "get_top_stock_products",
                    "params": {"limit": 10},
                    "status": "executed",
                }],
            )
            return stock_result
        except Exception as e:
            print(f"Error al obtener top stock: {str(e)}")
            pass

    # 4) Preparar mensajes para el LLM con tools y contexto histórico
    system_prompt = SYSTEM_PROMPT_ADMIN_AI.strip()
    if conversation_context:
        system_prompt += f"\n\n{conversation_context}"
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": enhanced_message},
    ]

    # Seleccionar modelo según el mensaje (router ligero/pesado).
    model_name = _select_model_for_admin_ai(message)

    try:
        # Temperatura baja para minimizar inferencias no respaldadas por datos.
        response = chat_with_tools(
            messages=messages,
            tools=ADMIN_AI_TOOLS,
            model=model_name,
            temperature=0.0,
        )
    except ValueError:
        # IA no disponible -> mensaje claro al usuario.
        error_msg = "La IA no está configurada actualmente. Pídele al administrador que configure GROQ_API_KEY."
        save_conversation(db, user_id, message, error_msg)
        return error_msg

    except RuntimeError:
        # Mensaje no técnico (el detalle se registra en logs).
        error_msg = (
            "Tuve un problema momentáneo al consultar esa información. "
            "¿Puedes intentar de nuevo en unos segundos?"
        )
        save_conversation(db, user_id, message, error_msg)
        return error_msg

    # Estructura tipo OpenAI Chat Completions.
    choices = response.get("choices") or []
    if not choices:
        fallback_reply = FALLBACK_REPLY
        save_conversation(db, user_id, message, fallback_reply)
        return fallback_reply

    first = choices[0]
    message_obj = (first.get("message") or {}) if isinstance(first, dict) else {}
    tool_calls = message_obj.get("tool_calls") or []

    # Si no hay tool_calls, devolvemos la respuesta de texto normal.
    content = message_obj.get("content")
    if not tool_calls:
        if isinstance(content, str) and content.strip():
            # Guard rail: si el modelo devuelve una "confirmación" sin tool_call,
            # no confiamos en ese texto para evitar ejecuciones fantasma.
            if "¿confirmas que deseas continuar?" in content.lower():
                safe_reply = (
                    "No pude preparar una acción válida para ejecutar. "
                    "Intenta de nuevo con una instrucción explícita, por ejemplo: "
                    "\"crea la marca Nike\"."
                )
                save_conversation(
                    db, user_id, message, safe_reply,
                    context_data=context_data,
                    tool_calls=None
                )
                return safe_reply

            # Guardar conversación sin tool calls
            save_conversation(
                db, user_id, message, content, 
                context_data=context_data,
                tool_calls=None
            )
            return content
        fallback_reply = FALLBACK_REPLY
        save_conversation(db, user_id, message, fallback_reply)
        return fallback_reply

    # 5) Hay al menos un tool_call: extraemos la primera llamada válida.
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

    if not name:
        error_reply = (
            "He intentado preparar una acción, pero no pude extraer parámetros válidos. "
            "Dime de nuevo qué quieres hacer. Ejemplos:\n"
            "- Consultas: 'cuál es la categoría más vendida', 'de dónde vienen más ventas', 'resumen de la tienda'\n"
            "- Acciones: 'crea la marca Nike', 'actualiza la barra con: Envíos gratis hoy'"
        )
        save_conversation(db, user_id, message, error_reply)
        return error_reply

    # Guardas extra para evitar alucinaciones: solo aceptamos ciertas tools si
    # los parámetros clave aparecen explícitamente en el mensaje original.
    if name == "create_brand":
        nom = str(params.get("nom_marca") or "").strip()
        if not nom or nom.lower() not in message.lower():
            # No hay nombre explícito en el mensaje del usuario: tratamos esto
            # como una pregunta conversacional, no como ejecución de acción.
            reply = (
                "Puedo ayudarte a crear una marca, pero necesito que me digas el nombre "
                "exacto. Por ejemplo: \"crea la marca Nike\"."
            )
            save_conversation(db, user_id, message, reply)
            return reply

    # Tools de solo lectura: se ejecutan directamente sin confirmación.
    READ_ONLY_TOOLS = (
        "get_store_summary", "list_categories",
        "list_products", "get_product", "list_orders", "get_order",
        "check_low_stock", "list_users", "get_user", "list_discounts",
        "get_top_stock_products",
        "get_top_categories_by_revenue", "get_conversion_metrics",
        "get_geographic_sales", "get_hourly_traffic", "get_customer_demographics",
    )
    if name in READ_ONLY_TOOLS:
        reply = admin_ai_actions.execute_action(db, name, params, user_id)
        # Guardar conversación con tool call ejecutado
        save_conversation(
            db, user_id, message, reply,
            context_data=context_data,
            tool_calls=[{"name": name, "params": params}]
        )
        return reply

    # Guardar acción pendiente por usuario.
    admin_ai_state.set_pending_action(user_id, name, params)
    confirmation_msg = _build_action_confirmation_message(name, params)
    # Guardar conversación de confirmación pendiente
    save_conversation(
        db, user_id, message, confirmation_msg,
        context_data=context_data,
        tool_calls=[{"name": name, "params": params, "status": "pending"}]
    )
    return confirmation_msg


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
        top_limit = _extract_requested_top_limit(message) if intent == "top_products" else 5
        data = fetch_intent_data(db, intent, top_limit=top_limit)
        reply_text = format_intent_reply(intent, data)

        # Persistimos el historial también en streaming para que los follow-ups
        # ("esa última orden", etc.) sean deterministas y no dependan de parsing frágil.
        last_order_id = None
        last_top_product_name = None
        last_top_products: list[str] = []
        recent_orders = data.get("recentOrders") if isinstance(data, dict) else None
        if isinstance(recent_orders, list) and recent_orders:
            raw_id = recent_orders[0].get("id") or recent_orders[0].get("order_id")
            if raw_id is not None:
                try:
                    last_order_id = int(raw_id)
                except Exception:
                    last_order_id = None
        best_sellers = data.get("bestSellers") if isinstance(data, dict) else None
        if intent in {"top_product", "top_products"} and isinstance(best_sellers, list) and best_sellers:
            for row in best_sellers:
                raw_name = row.get("name") if isinstance(row, dict) else None
                if isinstance(raw_name, str) and raw_name.strip():
                    last_top_products.append(raw_name.strip())
            if last_top_products:
                last_top_product_name = last_top_products[0]
        if user_id is not None:
            save_conversation(
                db,
                user_id,
                message,
                reply_text,
                context_data={
                    "intent": intent,
                    "last_order_id": last_order_id,
                    "last_top_product_name": last_top_product_name,
                    "last_top_products": last_top_products,
                },
                tool_calls=None,
            )

        def iter_chunks(text: str, chunk_size: int = 28) -> Iterator[str]:
            text = text or ""
            if not text:
                return
            for i in range(0, len(text), chunk_size):
                yield text[i : i + chunk_size]

        for chunk in iter_chunks(reply_text):
            yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n".encode("utf-8")
            # Pequeño respiro para que el front renderice por chunks con claridad.
            time.sleep(0.01)
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
