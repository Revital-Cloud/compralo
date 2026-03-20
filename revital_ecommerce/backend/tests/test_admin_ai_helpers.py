"""
Tests unitarios para helpers del asistente admin.

No requieren DB ni acceso a Groq: validan extracción de IDs desde el historial.
"""

from services.admin_ai_service import _extract_last_order_id


def test_extract_last_order_id_basic():
    recent_convs = [
        {
            "message": "como va mi tienda?",
            "reply": "La tienda tiene 27 órdenes...\nÚltima orden: #29 (Camilo Suarez) por $9040000.0 el 2026-03-18.",
        }
    ]
    assert _extract_last_order_id(recent_convs) == 29


def test_extract_last_order_id_without_accents():
    recent_convs = [
        {
            "message": "como va mi tienda?",
            "reply": "Ultima orden: #7 (Cliente) por $10.0 el 2026-01-01.",
        }
    ]
    assert _extract_last_order_id(recent_convs) == 7

