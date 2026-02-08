"""
Rate Limiter Configuration.

Provides the rate limiter instance for use across routers.
Uses a proxy-aware key function to identify the real client IP.
"""
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
