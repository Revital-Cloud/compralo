"""
Tests del loop de agente de chat_with_admin_ai con Groq y DB mockeados.

Verifican el comportamiento del pipeline reescrito:
- lecturas: se ejecutan y sus resultados vuelven al modelo hasta dar texto final;
- escrituras: interrumpen el loop y piden confirmación (sin ejecutar);
- guardas anti-alucinación de create_brand/create_provider;
- respuesta de texto directa sin tools.
"""
import json

import pytest

from services import admin_ai_service


def _resp_text(text, usage=None):
    return {
        "choices": [{"message": {"role": "assistant", "content": text}}],
        "usage": usage or {},
    }


def _resp_tools(calls, usage=None):
    tool_calls = [
        {
            "id": f"c{i}",
            "type": "function",
            "function": {"name": name, "arguments": json.dumps(args)},
        }
        for i, (name, args) in enumerate(calls)
    ]
    return {
        "choices": [{"message": {"role": "assistant", "content": None, "tool_calls": tool_calls}}],
        "usage": usage or {},
    }


@pytest.fixture
def harness(monkeypatch):
    """Mockea Groq y la capa de DB; captura llamadas a tools y guardados."""
    state = {"responses": [], "executed": [], "saved": []}

    def fake_chat_with_tools(messages, tools, model, temperature=0.0, tool_choice="auto", max_tokens=None):
        assert state["responses"], "No quedan respuestas mock para chat_with_tools"
        return state["responses"].pop(0)

    def fake_execute_action(db, name, params, user_id):
        state["executed"].append((name, params))
        return f"[DATA:{name}]"

    def fake_save_conversation(db, user_id, message, reply, context_data=None, tool_calls=None):
        state["saved"].append({"reply": reply, "tool_calls": tool_calls, "context_data": context_data})

    monkeypatch.setattr(admin_ai_service, "chat_with_tools", fake_chat_with_tools)
    monkeypatch.setattr(admin_ai_service, "get_pending_action", lambda db, user_id: None)
    monkeypatch.setattr(admin_ai_service, "get_recent_conversations", lambda *a, **k: [])
    monkeypatch.setattr(admin_ai_service, "save_conversation", fake_save_conversation)
    monkeypatch.setattr(admin_ai_service.admin_ai_actions, "execute_action", fake_execute_action)
    return state


def test_single_read_then_final_text(harness):
    harness["responses"] = [
        _resp_tools([("get_store_summary", {})]),
        _resp_text("Tienes 10 órdenes este mes."),
    ]
    result = admin_ai_service.chat_with_admin_ai("dame un resumen", db=None, user_id=1)
    assert result == "Tienes 10 órdenes este mes."
    assert harness["executed"] == [("get_store_summary", {})]


def test_read_tool_chaining(harness):
    harness["responses"] = [
        _resp_tools([("list_categories", {})]),
        _resp_tools([("get_top_categories_by_revenue", {"limit": 10})]),
        _resp_text("La categoría que más vende es Bebidas."),
    ]
    result = admin_ai_service.chat_with_admin_ai("qué categoría vende más", db=None, user_id=1)
    assert result == "La categoría que más vende es Bebidas."
    assert [n for n, _ in harness["executed"]] == ["list_categories", "get_top_categories_by_revenue"]


def test_write_tool_asks_confirmation_without_executing(harness):
    harness["responses"] = [_resp_tools([("create_brand", {"nom_marca": "Nike"})])]
    result = admin_ai_service.chat_with_admin_ai("crea la marca Nike", db=None, user_id=1)
    assert isinstance(result, str)
    assert "¿Confirmas que deseas continuar?" in result
    # No se ejecuta ninguna acción de escritura sin confirmación.
    assert harness["executed"] == []
    # Se persiste la acción pendiente.
    assert harness["saved"][-1]["tool_calls"] == [
        {"name": "create_brand", "params": {"nom_marca": "Nike"}, "status": "pending"}
    ]


def test_write_guard_blocks_when_name_not_in_message(harness):
    # El modelo alucina un nombre que no está en el mensaje -> se bloquea.
    harness["responses"] = [_resp_tools([("create_brand", {"nom_marca": "Nike"})])]
    result = admin_ai_service.chat_with_admin_ai("crea una marca nueva", db=None, user_id=1)
    assert "nombre" in result.lower()
    assert harness["executed"] == []
    # No se deja ninguna acción pendiente.
    assert all(
        (s["tool_calls"] is None) or (s["tool_calls"][0].get("status") != "pending")
        for s in harness["saved"]
    )


def test_direct_text_answer_without_tools(harness):
    harness["responses"] = [_resp_text("Soy tu asistente del panel.")]
    result = admin_ai_service.chat_with_admin_ai("quién eres", db=None, user_id=1)
    assert result == "Soy tu asistente del panel."
    assert harness["executed"] == []


def test_usage_is_persisted_in_context(harness):
    harness["responses"] = [
        _resp_tools([("get_store_summary", {})], usage={"prompt_tokens": 100, "completion_tokens": 20, "total_tokens": 120}),
        _resp_text("Resumen listo.", usage={"prompt_tokens": 50, "completion_tokens": 10, "total_tokens": 60}),
    ]
    admin_ai_service.chat_with_admin_ai("resumen", db=None, user_id=1)
    ctx = harness["saved"][-1]["context_data"]
    assert ctx["usage"] == {"prompt_tokens": 150, "completion_tokens": 30, "total_tokens": 180}
    assert "model" in ctx
