"""
Tests unitarios para helpers del asistente admin (loop de agente).

No requieren DB ni acceso a Groq: validan piezas puras del pipeline de chat.
"""

from services.admin_ai_memory import build_history_messages
from services.admin_ai_service import (
    _parse_tool_call,
    _accumulate_usage,
    _guard_write_action,
)
from services.groq_service import usage_to_dict


# --- build_history_messages ---------------------------------------------------

def test_build_history_messages_orders_chronologically():
    # get_recent_conversations devuelve las más nuevas primero.
    convs = [
        {"message": "y la categoria?", "reply": "La categoría top es Bebidas."},
        {"message": "resumen", "reply": "Tienes 10 órdenes."},
    ]
    msgs = build_history_messages(convs, max_chars=10000)
    assert msgs == [
        {"role": "user", "content": "resumen"},
        {"role": "assistant", "content": "Tienes 10 órdenes."},
        {"role": "user", "content": "y la categoria?"},
        {"role": "assistant", "content": "La categoría top es Bebidas."},
    ]


def test_build_history_messages_skips_empty_markers():
    convs = [
        {"message": "", "reply": ""},  # marcador interno
        {"message": "hola", "reply": "Hola, ¿qué necesitas?"},
    ]
    msgs = build_history_messages(convs)
    assert msgs == [
        {"role": "user", "content": "hola"},
        {"role": "assistant", "content": "Hola, ¿qué necesitas?"},
    ]


def test_build_history_messages_empty():
    assert build_history_messages([]) == []


# --- _parse_tool_call ---------------------------------------------------------

def test_parse_tool_call_valid_json_args():
    tc = {
        "id": "call_1",
        "function": {"name": "get_order", "arguments": '{"order_id": 29}'},
    }
    name, params, call_id = _parse_tool_call(tc)
    assert name == "get_order"
    assert params == {"order_id": 29}
    assert call_id == "call_1"


def test_parse_tool_call_bad_json_falls_back_to_empty():
    tc = {"function": {"name": "list_orders", "arguments": "{not json}"}}
    name, params, call_id = _parse_tool_call(tc)
    assert name == "list_orders"
    assert params == {}
    assert call_id is None


# --- _accumulate_usage --------------------------------------------------------

def test_accumulate_usage_sums_across_calls():
    acc = {}
    _accumulate_usage(acc, {"usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}})
    _accumulate_usage(acc, {"usage": {"prompt_tokens": 3, "completion_tokens": 2, "total_tokens": 5}})
    assert acc == {"prompt_tokens": 13, "completion_tokens": 7, "total_tokens": 20}


def test_accumulate_usage_ignores_missing_usage():
    acc = {}
    _accumulate_usage(acc, {"choices": []})
    assert acc == {}


# --- _guard_write_action ------------------------------------------------------

def test_guard_create_brand_requires_name_in_message():
    # El nombre no aparece en el mensaje -> se bloquea con un aviso.
    reply = _guard_write_action("create_brand", {"nom_marca": "Nike"}, "crea una marca")
    assert reply is not None and "nombre" in reply.lower()


def test_guard_create_brand_ok_when_name_present():
    assert _guard_write_action("create_brand", {"nom_marca": "Nike"}, "crea la marca Nike") is None


def test_guard_create_provider_requires_email():
    reply = _guard_write_action(
        "create_provider", {"nom_proveedor": "ACME"}, "crea el proveedor ACME"
    )
    assert reply is not None and "email" in reply.lower()


def test_guard_other_actions_pass_through():
    assert _guard_write_action("update_order_status", {"order_id": 1, "new_status": 2}, "cierra la orden 1") is None


# --- usage_to_dict ------------------------------------------------------------

def test_usage_to_dict_from_dict():
    assert usage_to_dict({"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3}) == {
        "prompt_tokens": 1,
        "completion_tokens": 2,
        "total_tokens": 3,
    }


def test_usage_to_dict_none():
    assert usage_to_dict(None) == {}
