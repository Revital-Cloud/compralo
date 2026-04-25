import logging
from typing import Optional

import httpx

from core.config import settings
from core.circuit_breaker import CircuitOpenError, run_with_circuit_breaker

logger = logging.getLogger(__name__)

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(token: str, remote_ip: Optional[str] = None) -> bool:
    """
    Verifica un token de Cloudflare Turnstile contra el endpoint siteverify.
    Retorna True solo si Cloudflare responde success=true.
    """
    secret = settings.TURNSTILE_SECRET_KEY
    if not settings.TURNSTILE_ENABLED:
        return True
    if not secret:
        logger.warning("TURNSTILE_ENABLED=true pero TURNSTILE_SECRET_KEY no está configurada.")
        return False
    if not token:
        return False

    data: dict[str, str] = {"secret": secret, "response": token}
    if remote_ip:
        data["remoteip"] = remote_ip

    try:
        async def _do_request():
            async with httpx.AsyncClient(timeout=5.0) as client:
                return await client.post(TURNSTILE_VERIFY_URL, data=data)

        resp = await run_with_circuit_breaker(
            key=TURNSTILE_VERIFY_URL,
            call=_do_request,
            # Solo abrimos circuito por degradacion real del servicio.
            failure_predicate=lambda r: r.status_code >= 500 or r.status_code == 429,
        )
        payload = resp.json()
    except CircuitOpenError:
        logger.warning("Circuit breaker abierto: Turnstile fail-fast.")
        return False
    except Exception as exc:
        logger.warning("Error verificando Turnstile: %s", exc)
        return False

    if resp.status_code >= 400:
        logger.warning(
            "Turnstile siteverify HTTP %s. error-codes=%s response=%s",
            resp.status_code,
            payload.get("error-codes"),
            payload,
        )
        return False

    success = payload.get("success") is True
    if not success:
        logger.info(
            "Turnstile rechazó token. error-codes=%s response=%s",
            payload.get("error-codes"),
            payload,
        )
    return success

