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
            "description": "Crea una nueva marca en el sistema.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nom_marca": {
                        "type": "string",
                        "description": "Nombre de la marca a crear.",
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
            "description": "Crea un nuevo proveedor en el sistema.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nom_proveedor": {
                        "type": "string",
                        "description": "Nombre del proveedor.",
                    },
                    "email": {
                        "type": "string",
                        "description": "Email de contacto del proveedor.",
                    },
                    "tel_proveedor": {
                        "type": "string",
                        "description": "Teléfono del proveedor (opcional).",
                    },
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
]

