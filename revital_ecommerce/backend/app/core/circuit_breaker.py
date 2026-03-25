from __future__ import annotations

import threading
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Awaitable, Callable, Optional
from urllib.parse import urlparse

from fastapi import HTTPException

from core.exceptions import MSG_SERVICE_UNAVAILABLE


class CircuitOpenError(Exception):
    pass


@dataclass
class CircuitState:
    failures: int = 0
    opened_until: Optional[datetime] = None


_lock = threading.Lock()
_states: dict[str, CircuitState] = {}


def _host_key(key: str) -> str:
    # Permite pasar URLs o keys ya normalizados.
    if key.startswith("http://") or key.startswith("https://"):
        parsed = urlparse(key)
        return parsed.netloc or key
    return key


async def run_with_circuit_breaker(
    *,
    key: str,
    call: Callable[[], Awaitable[Any]],
    max_failures: int = 5,
    reset_timeout_seconds: int = 60,
    failure_predicate: Optional[Callable[[Any], bool]] = None,
) -> Any:
    """
    Ejecuta una llamada con un circuito (fail-fast) para integraciones externas.

    - Si el circuito está abierto, lanza `CircuitOpenError`.
    - Si la llamada falla (predicado true o excepción), aumenta contador.
    - Si una llamada es exitosa, resetea el contador.
    """
    circuit_key = _host_key(key)
    now = datetime.utcnow()

    with _lock:
        state = _states.get(circuit_key) or CircuitState()
        if state.opened_until and now < state.opened_until:
            raise CircuitOpenError(f"Circuito abierto para {circuit_key}")

    try:
        result = await call()
    except Exception:
        with _lock:
            state = _states.get(circuit_key) or CircuitState()
            state.failures += 1
            if state.failures >= max_failures:
                state.opened_until = now + timedelta(seconds=reset_timeout_seconds)
            _states[circuit_key] = state
        raise

    is_failure = failure_predicate(result) if failure_predicate else False
    if is_failure:
        with _lock:
            state = _states.get(circuit_key) or CircuitState()
            state.failures += 1
            if state.failures >= max_failures:
                state.opened_until = now + timedelta(seconds=reset_timeout_seconds)
            _states[circuit_key] = state
        raise HTTPException(status_code=503, detail=MSG_SERVICE_UNAVAILABLE)

    # Exito -> reset
    with _lock:
        _states[circuit_key] = CircuitState(failures=0, opened_until=None)

    return result

