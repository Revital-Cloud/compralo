"""
Almacén en memoria para códigos OTP de verificación de email.

Cada entrada: email -> {"code": str, "expires_at": datetime}
Los códigos expiran en OTP_EXPIRE_MINUTES.
"""
import random
import string
from datetime import datetime, timedelta
from typing import Optional

# Expiración del OTP en minutos
OTP_EXPIRE_MINUTES = 15

_store: dict[str, dict] = {}


def _generate_code(length: int = 6) -> str:
    """Genera un código numérico de 6 dígitos."""
    return "".join(random.choices(string.digits, k=length))


def set_otp(email: str) -> str:
    """
    Genera un OTP para el email y lo guarda.
    Retorna el código de 6 dígitos.
    """
    code = _generate_code(6)
    _store[email.lower().strip()] = {
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES),
    }
    return code


def verify_otp(email: str, code: str) -> bool:
    """
    Verifica que el código coincida y no haya expirado.
    Si es válido, elimina el OTP (uso único).
    """
    key = email.lower().strip()
    if key not in _store:
        return False
    entry = _store[key]
    if datetime.utcnow() > entry["expires_at"]:
        del _store[key]
        return False
    if entry["code"] != code.strip():
        return False
    del _store[key]
    return True


def get_otp_expires_minutes() -> int:
    return OTP_EXPIRE_MINUTES
