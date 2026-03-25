import logging
from typing import Optional

import httpx

from core.config import settings

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
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(TURNSTILE_VERIFY_URL, data=data)
            resp.raise_for_status()
            payload = resp.json()
    except Exception as exc:
        logger.warning("Error verificando Turnstile: %s", exc)
        return False

    success = payload.get("success") is True
    if not success:
        logger.info("Turnstile rechazó token. response=%s", payload)
    return success

