"""
Tests del parseErrorManager de Groq tools.

Objetivo: cuando Groq devuelve 400 por validación de schema (ej. number recibido como string),
debemos poder reparar localmente el tool_call a partir de failed_generation.
"""
import json


def test_parse_error_manager_repairs_number_string_to_number():
    from services.admin_ai_tools import ADMIN_AI_TOOLS
    from services.groq_service import _parse_error_manager_repair_tool_call

    exc = Exception(
        "Error code: 400 - {'error': {'message': 'tool call validation failed: parameters for tool list_users did not match schema: errors: [`/limit`: expected number, but got string]', 'type': 'invalid_request_error', 'code': 'tool_use_failed', 'failed_generation': '<function=list_users>{\"limit\": \"100\"}</function>'}}"
    )

    repaired = _parse_error_manager_repair_tool_call(exc, ADMIN_AI_TOOLS)
    assert repaired is not None

    tool_calls = repaired["choices"][0]["message"]["tool_calls"]
    assert tool_calls and tool_calls[0]["function"]["name"] == "list_users"
    args = json.loads(tool_calls[0]["function"]["arguments"])
    assert isinstance(args.get("limit"), int)
    assert args["limit"] == 100
