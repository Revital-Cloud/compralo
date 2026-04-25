"""
Rate Limiter Configuration.

Provides the rate limiter instance for use across routers.
Uses a proxy-aware key function to identify the real client IP.
"""
from datetime import datetime, timedelta
from threading import Lock

from fastapi import Request
from slowapi import Limiter


def get_client_ip(request: Request) -> str:
    """
    Obtain the real client IP when behind a reverse proxy.

    Priority:
    1) X-Forwarded-For (first IP in the list)
    2) X-Real-IP
    3) Direct connection IP
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    return request.client.host if request.client else "unknown"


# Create limiter instance with proxy-aware key function
limiter = Limiter(key_func=get_client_ip)


_register_lock = Lock()
_register_store: dict[str, list[datetime]] = {}
_REGISTER_LIMITS = (
    (5, timedelta(minutes=15)),
    (20, timedelta(hours=1)),
)


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _register_key(ip: str, email: str) -> str:
    return f"{ip}|{_normalize_email(email)}"


def get_register_retry_after_seconds(ip: str, email: str) -> int:
    """
    Returns remaining cooldown seconds for register attempts keyed by IP + email.
    If no limit is exceeded, returns 0.
    """
    key = _register_key(ip, email)
    now = datetime.utcnow()

    with _register_lock:
        attempts = _register_store.get(key, [])
        if not attempts:
            return 0

        # Keep only events within the largest window (1 hour).
        max_window = max(window for _, window in _REGISTER_LIMITS)
        attempts = [ts for ts in attempts if now - ts <= max_window]
        if not attempts:
            _register_store.pop(key, None)
            return 0
        _register_store[key] = attempts

        max_retry = 0
        for limit, window in _REGISTER_LIMITS:
            in_window = [ts for ts in attempts if now - ts <= window]
            if len(in_window) >= limit:
                oldest_kept = min(in_window)
                retry_at = oldest_kept + window
                remaining = retry_at - now
                seconds = max(1, int(remaining.total_seconds() + 0.999999))
                max_retry = max(max_retry, seconds)

        return max_retry


def record_register_attempt(ip: str, email: str) -> None:
    """Records a register attempt for an IP + email combination."""
    key = _register_key(ip, email)
    now = datetime.utcnow()

    with _register_lock:
        attempts = _register_store.get(key, [])
        max_window = max(window for _, window in _REGISTER_LIMITS)
        attempts = [ts for ts in attempts if now - ts <= max_window]
        attempts.append(now)
        _register_store[key] = attempts
