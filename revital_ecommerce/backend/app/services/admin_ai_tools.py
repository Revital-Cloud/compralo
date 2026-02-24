"""
Definición de tools (function calling) para el asistente de IA admin.

Este módulo contiene únicamente el esquema de tools compatible con la API
tipo OpenAI (Groq chat completions con tools).

Las funciones reales que ejecutan los cambios viven en `admin_ai_actions`.
"""
from typing import Any, Dict, List


Tool = Dict[str, Any]


ADMIN_AI_TOOLS: List[Tool] = [
    {
        "type": "function",
        "function": {
            "name": "create_brand",
            "description": "Crea una nueva marca en el sistema. Las marcas se usan para organizar productos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nom_marca": {
                        "type": "string",
                        "description": "Nombre de la marca a crear (requerido).",
                    },
                    "ind_activo": {
                        "type": "boolean",
                        "description": "Si la marca debe estar activa al crearla (opcional, por defecto true).",
                    }
                },
                "required": ["nom_marca"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_provider",
            "description": "Crea un nuevo proveedor en el sistema. Los proveedores se usan para gestionar órdenes de compra y stock.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nom_proveedor": {
                        "type": "string",
                        "description": "Nombre del proveedor (requerido).",
                    },
                    "email": {
                        "type": "string",
                        "description": "Email de contacto del proveedor (requerido).",
                    },
                    "tel_proveedor": {
                        "type": "string",
                        "description": "Teléfono del proveedor. Puede ser solo números o incluir código de país (opcional).",
                    },
                    "ind_activo": {
                        "type": "boolean",
                        "description": "Si el proveedor debe estar activo al crearlo (opcional, por defecto true).",
                    }
                },
                "required": ["nom_proveedor", "email"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_top_info_bar",
            "description": "Actualiza la barra informativa superior de la tienda.",
            "parameters": {
                "type": "object",
                "properties": {
                    "des_mensaje": {
                        "type": "string",
                        "description": "Mensaje a mostrar en la barra informativa.",
                    },
                    "ind_activo": {
                        "type": "boolean",
                        "description": "Si la barra debe estar activa. Por defecto true.",
                    },
                    "ind_visible": {
                        "type": "boolean",
                        "description": "Si la barra debe ser visible. Por defecto true.",
                    },
                    "color_fondo": {
                        "type": "string",
                        "description": "Color de fondo (hex o nombre CSS).",
                    },
                    "color_texto": {
                        "type": "string",
                        "description": "Color del texto (hex o nombre CSS).",
                    },
                    "fec_inicio": {
                        "type": "string",
                        "description": "Fecha de inicio en formato YYYY-MM-DD (opcional).",
                    },
                    "fec_fin": {
                        "type": "string",
                        "description": "Fecha de fin en formato YYYY-MM-DD (opcional).",
                    },
                    "boton_texto": {
                        "type": "string",
                        "description": "Texto del botón de la barra (opcional).",
                    },
                    "boton_url": {
                        "type": "string",
                        "description": "URL del botón de la barra (opcional).",
                    },
                    "boton_color_fondo": {
                        "type": "string",
                        "description": "Color de fondo del botón (hex o nombre CSS).",
                    },
                    "boton_color_texto": {
                        "type": "string",
                        "description": "Color del texto del botón (hex o nombre CSS).",
                    },
                },
                "required": ["des_mensaje"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_categories",
            "description": "Lista las categorías existentes. Útil para consultar categorías raíz, líneas y sublíneas antes de crear nuevas.",
            "parameters": {
                "type": "object",
                "properties": {
                    "parent_id": {
                        "type": "number",
                        "description": "Si se proporciona, lista solo las categorías hijas de este parent_id. Si es null o no se proporciona, lista todas las categorías.",
                    },
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_category",
            "description": "Crea una categoría, línea o sublínea en la jerarquía de categorías. Si parent_id es null o no se proporciona, crea una categoría raíz. Si parent_id es el id de una categoría raíz, crea una línea. Si parent_id es el id de una línea, crea una sublínea.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nombre de la categoría, línea o sublínea a crear (requerido).",
                    },
                    "parent_id": {
                        "type": "number",
                        "description": "ID de la categoría padre. Null o no proporcionar para crear una categoría raíz. Opcional.",
                    },
                    "is_active": {
                        "type": "boolean",
                        "description": "Si la categoría debe estar activa al crearla (opcional, por defecto true).",
                    },
                    "slug": {
                        "type": "string",
                        "description": "Slug único para URLs amigables. Si no se proporciona, se genera automáticamente del nombre (opcional).",
                    },
                },
                "required": ["name"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_discount",
            "description": "Crea un descuento o cupón completo con todas las opciones disponibles. Puede ser porcentaje o monto fijo, aplicar a productos/categorías/marcas, tener límites de uso, horarios, y más.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nom_descuento": {
                        "type": "string",
                        "description": "Nombre descriptivo del descuento (requerido).",
                    },
                    "des_descuento": {
                        "type": "string",
                        "description": "Descripción detallada del descuento (requerido).",
                    },
                    "tipo_calculo": {
                        "type": "boolean",
                        "description": "true = descuento por porcentaje, false = descuento por monto fijo (requerido).",
                    },
                    "val_porce_descuento": {
                        "type": "number",
                        "description": "Valor del descuento en porcentaje (requerido si tipo_calculo es true).",
                    },
                    "val_monto_descuento": {
                        "type": "number",
                        "description": "Valor del descuento en monto fijo (requerido si tipo_calculo es false).",
                    },
                    "codigo_descuento": {
                        "type": "string",
                        "description": "Código único del cupón para que los usuarios lo ingresen (opcional).",
                    },
                    "aplica_a": {
                        "type": "string",
                        "description": "A qué aplica el descuento: 'todos', 'categoria', 'producto', 'marca', 'total_pedido' (opcional, por defecto 'todos').",
                    },
                    "id_categoria_aplica": {
                        "type": "number",
                        "description": "ID de la categoría a la que aplica el descuento (requerido si aplica_a es 'categoria').",
                    },
                    "id_producto_aplica": {
                        "type": "number",
                        "description": "ID del producto al que aplica el descuento (requerido si aplica_a es 'producto').",
                    },
                    "id_marca_aplica": {
                        "type": "number",
                        "description": "ID de la marca a la que aplica el descuento (requerido si aplica_a es 'marca').",
                    },
                    "min_valor_pedido": {
                        "type": "number",
                        "description": "Monto mínimo del pedido para aplicar el descuento (opcional).",
                    },
                    "monto_minimo_producto": {
                        "type": "number",
                        "description": "Monto mínimo de producto individual para aplicar el descuento (opcional).",
                    },
                    "cantidad_minima_producto": {
                        "type": "number",
                        "description": "Cantidad mínima de productos para aplicar el descuento (opcional).",
                    },
                    "fec_inicio": {
                        "type": "string",
                        "description": "Fecha de inicio de validez en formato YYYY-MM-DD (opcional).",
                    },
                    "fec_fin": {
                        "type": "string",
                        "description": "Fecha de fin de validez en formato YYYY-MM-DD (opcional).",
                    },
                    "ind_activo": {
                        "type": "boolean",
                        "description": "Si el descuento está activo (opcional, por defecto true).",
                    },
                    "max_usos_total": {
                        "type": "number",
                        "description": "Límite total de veces que se puede usar el descuento (opcional).",
                    },
                    "max_usos_por_usuario": {
                        "type": "number",
                        "description": "Límite de veces que un mismo usuario puede usar el descuento (opcional).",
                    },
                    "ind_canjeable_puntos": {
                        "type": "boolean",
                        "description": "Si el descuento se puede canjear por puntos de fidelización (opcional, por defecto false).",
                    },
                    "costo_puntos_canje": {
                        "type": "number",
                        "description": "Cantidad de puntos necesarios para canjear este descuento (requerido si ind_canjeable_puntos es true).",
                    },
                    "ind_es_para_cumpleanos": {
                        "type": "boolean",
                        "description": "Si el descuento es especial para cumpleaños (opcional, por defecto false).",
                    },
                    "solo_primera_compra": {
                        "type": "boolean",
                        "description": "Si el descuento solo aplica en la primera compra del usuario (opcional, por defecto false).",
                    },
                    "requiere_codigo": {
                        "type": "boolean",
                        "description": "Si el descuento requiere que el usuario ingrese un código (opcional, por defecto false).",
                    },
                    "dias_semana_aplica": {
                        "type": "string",
                        "description": "Días de la semana en que aplica el descuento. Formato: '1,2,3' para lunes, martes, miércoles (opcional).",
                    },
                    "horas_inicio": {
                        "type": "number",
                        "description": "Hora de inicio de validez (0-23) (opcional).",
                    },
                    "horas_fin": {
                        "type": "number",
                        "description": "Hora de fin de validez (0-23) (opcional).",
                    },
                },
                "required": ["nom_descuento", "des_descuento", "tipo_calculo"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_store_summary",
            "description": "Obtiene un resumen completo de la tienda incluyendo KPIs, productos más vendidos, órdenes recientes y alertas. Úsalo cuando el usuario pida un resumen general, estado de la tienda, o información general sobre el negocio.",
            "parameters": {
                "type": "object",
                "properties": {
                    "time_range": {
                        "type": "string",
                        "description": "Rango de tiempo para el resumen: 'daily', 'weekly', o 'monthly'. Por defecto 'monthly'.",
                        "enum": ["daily", "weekly", "monthly"],
                    },
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_products",
            "description": "Lista productos con filtros opcionales. Útil para buscar productos por nombre, categoría, marca o stock bajo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search": {"type": "string", "description": "Búsqueda por nombre de producto (opcional)."},
                    "limit": {"type": "number", "description": "Límite de resultados (opcional, default 20)."},
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_product",
            "description": "Obtiene el detalle completo de un producto por ID o por nombre (precio, stock, categoría, marca, estado). Indica product_id O product_name.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "number", "description": "ID del producto (opcional si se indica product_name)."},
                    "product_name": {"type": "string", "description": "Nombre del producto para buscarlo (opcional si se indica product_id). Si hay varios coincidentes, se listan para que el usuario elija por ID."},
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "toggle_product_status",
            "description": "Activa o desactiva un producto (y sus variantes). Puedes indicar el producto por ID o por nombre. Útil para ocultar productos temporalmente o reactivarlos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "number", "description": "ID del producto (opcional si se indica product_name)."},
                    "product_name": {"type": "string", "description": "Nombre del producto para buscarlo (opcional si se indica product_id). Si hay varios coincidentes, indica el ID o el nombre completo."},
                    "activar": {"type": "boolean", "description": "true para activar, false para desactivar (requerido)."},
                },
                "required": ["activar"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_orders",
            "description": "Lista órdenes recientes con información del cliente y total. Útil para ver pedidos pendientes o recientes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "number", "description": "Límite de resultados (opcional, default 15)."},
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_order",
            "description": "Obtiene el detalle completo de una orden por su ID (productos, cliente, total, estado, dirección).",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "number", "description": "ID de la orden (requerido)."},
                },
                "required": ["order_id"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_order_status",
            "description": "Actualiza el estado de una orden. Útil para marcar pedidos como completados o cancelados.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "number", "description": "ID de la orden (requerido)."},
                    "new_status": {"type": "number", "description": "Nuevo estado: 1=Pendiente, 2=Completada, 3=Cancelada (requerido)."},
                },
                "required": ["order_id", "new_status"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_low_stock",
            "description": "Lista productos con stock bajo o sin stock. Útil para alertas de inventario.",
            "parameters": {
                "type": "object",
                "properties": {
                    "threshold": {"type": "number", "description": "Umbral de stock bajo (opcional, default 10)."},
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_stock_products",
            "description": "Obtiene los productos con mayor stock total (sumando variantes activas). Úsala cuando el usuario pregunte por el producto con mayor stock, productos con más inventario, o ranking de stock.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "number", "description": "Límite de resultados (opcional, default 10)."},
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_users",
            "description": "Lista usuarios/clientes con sus puntos de fidelización. Útil para buscar clientes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "number", "description": "Límite de resultados (opcional, default 20)."},
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_user",
            "description": "Obtiene el detalle de un usuario por su ID (nombre, email, órdenes, puntos).",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "number", "description": "ID del usuario (requerido)."},
                },
                "required": ["user_id"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_discounts",
            "description": "Lista descuentos existentes (activos e inactivos). Útil para ver cupones antes de crear o modificar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "number", "description": "Límite de resultados (opcional, default 20)."},
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "toggle_discount_status",
            "description": "Activa o desactiva un descuento existente. Útil para pausar o reactivar cupones.",
            "parameters": {
                "type": "object",
                "properties": {
                    "discount_id": {"type": "number", "description": "ID del descuento (requerido)."},
                    "activar": {"type": "boolean", "description": "true para activar, false para desactivar (requerido)."},
                },
                "required": ["discount_id", "activar"],
                "additionalProperties": False,
            },
        },
    },
    # --- Analytics avanzados ---
    {
        "type": "function",
        "function": {
            "name": "get_top_categories_by_revenue",
            "description": "Obtiene las categorías de producto más vendidas por ingresos. Úsala cuando el usuario pregunte por categoría más vendida, categorías con más ventas, ranking de categorías, o qué categoría vende más.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "number", "description": "Número máximo de categorías a devolver (opcional, default 10)."},
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_conversion_metrics",
            "description": "Obtiene métricas de conversión: tasa de conversión, valor promedio de orden, total de órdenes e ingresos totales con comparación vs período anterior.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_geographic_sales",
            "description": "Obtiene ventas por región geográfica (departamento o ciudad). Úsala cuando el usuario pregunte de dónde vienen más ventas, ventas por región, o distribución geográfica.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "number", "description": "Número máximo de regiones (opcional, default 10)."},
                },
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_hourly_traffic",
            "description": "Obtiene el tráfico/órdenes por hora del día. Úsala cuando el usuario pregunte por horarios de más ventas, a qué hora venden más, o distribución por hora.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_customer_demographics",
            "description": "Obtiene demografía de clientes por grupos de edad (0-17, 18-24, 25-34, etc.) con ingresos y porcentaje. Úsala cuando el usuario pregunte por perfil de clientes, edad de compradores, o demografía.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False,
            },
        },
    },
]

