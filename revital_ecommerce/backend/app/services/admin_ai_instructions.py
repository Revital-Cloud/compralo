"""
Instrucciones, prompts y keywords para el asistente de IA del panel admin.

Centraliza todo el texto que define comportamiento e intenciones:
keywords por intent, mensaje de fallback, prompts del LLM para chat, resumen y extracción de acciones.
"""

# ---------------------------------------------------------------------------
# Keywords por intención (detección por substring en mensaje en minúsculas)
# ---------------------------------------------------------------------------

INTENT_PENDING_ORDERS = (
    "ordenes pendientes", "órdenes pendientes", "pedidos pendientes", "pending orders",
)
INTENT_TOP_PRODUCTS = (
    "productos más vendidos", "productos mas vendidos",
    "producto más vendido", "producto mas vendido",
    "mas vendidos", "más vendidos", "mas vendido", "más vendido",
    "top productos", "best sellers", "mejor vendido", "más vendido",
)
INTENT_SALES_SUMMARY = (
    "resumen de ventas", "resumen ventas", "ventas", "sales summary", "dashboard",
)
INTENT_ALERTS = ("alertas", "stock", "alerta", "alert")
INTENT_RECENT_ORDERS = (
    "órdenes recientes", "ordenes recientes", "pedidos recientes",
    "últimas órdenes", "ultimas ordenes", "últimos pedidos", "ultimos pedidos",
    "last orders", "recientes",
)
INTENT_GENERAL = (
    "cómo va", "como va", "qué tal", "que tal", "resumen general",
    "estado de la tienda", "dame un resumen", "cómo estamos", "como estamos",
    "overview", "panorama", "visión general", "vision general",
)
INTENT_ACTION = (
    "crea marca", "crear marca", "nueva marca", "agregar marca",
    "crea una marca", "crear una marca", "crea la marca", "crear la marca",
    "marca que se llame", "marca llamada",
    "crea proveedor", "crear proveedor", "nuevo proveedor", "agregar proveedor",
    "crea un proveedor", "crear un proveedor", "crea el proveedor", "crear el proveedor",
)

# ---------------------------------------------------------------------------
# Mensajes al usuario
# ---------------------------------------------------------------------------

FALLBACK_REPLY = (
    "Puedo ayudarte con: órdenes pendientes, órdenes recientes, productos más vendidos, "
    "resumen de ventas, resumen general, alertas de stock; también puedo crear marcas o proveedores. "
    "¿Qué te gustaría saber o hacer?"
)

# ---------------------------------------------------------------------------
# Prompts del LLM (system / instrucciones)
# ---------------------------------------------------------------------------

CHAT_SYSTEM_PROMPT = (
    "Eres un asistente del panel de administración de una tienda. "
    "Solo respondes con los datos que te proporcionamos. No inventes números. "
    "Responde en español de forma clara y concisa."
)

SUMMARY_SYSTEM_PROMPT = (
    "Eres un asistente que resume datos de ecommerce en 2-4 frases en español, "
    "sin inventar datos. Usa únicamente la información del JSON que te proporciono. "
    "Sé conciso y directo."
)

ACTION_EXTRACTION_SYSTEM = """Eres un extractor de intenciones. Solo respondes con un JSON válido, sin otro texto.
Acciones permitidas y sus parámetros:
- create_brand: {"action": "create_brand", "params": {"nom_marca": "nombre de la marca"}}
- create_provider: {"action": "create_provider", "params": {"nom_proveedor": "nombre", "email": "email@ejemplo.com", "tel_proveedor": "número o string"}}

Si el usuario pide crear una marca, extrae el nombre y devuelve {"action": "create_brand", "params": {"nom_marca": "..."}}.
Si pide crear un proveedor, extrae nombre, email y teléfono y devuelve {"action": "create_provider", "params": {...}}.
Si no pide ninguna acción permitida, devuelve {}.
Responde ÚNICAMENTE con el JSON, sin markdown ni explicación."""
