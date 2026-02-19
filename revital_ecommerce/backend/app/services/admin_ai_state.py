"""
Estado en memoria para acciones pendientes del asistente IA admin.

Las acciones NUNCA se ejecutan en el primer mensaje. Siempre requieren confirmación explícita.
Este módulo guarda temporalmente la acción y parámetros extraídos hasta que el usuario
confirme ("sí", "ok") o cancele ("no", "cancelar").

IMPORTANTE: State in-memory. Válido para single-instance. No persiste entre reinicios.
"""
from typing import Any

_PENDING_ACTIONS: dict[str, dict[str, Any]] = {}


def set_pending_action(user_id: str | int, action_id: str, params: dict[str, Any]) -> None:
    """Guarda una acción pendiente de confirmación para el usuario."""
    _PENDING_ACTIONS[str(user_id)] = {"action": action_id, "params": params}


def get_pending_action(user_id: str | int) -> dict[str, Any] | None:
    """Obtiene la acción pendiente del usuario, o None si no hay ninguna."""
    return _PENDING_ACTIONS.get(str(user_id))


def clear_pending_action(user_id: str | int) -> None:
    """Elimina la acción pendiente del usuario."""
    _PENDING_ACTIONS.pop(str(user_id), None)
