"""
Rate Limiter Configuration.

Provides the rate limiter instance for use across routers.
Uses slowapi with IP-based rate limiting.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create limiter instance with IP-based key function
limiter = Limiter(key_func=get_remote_address)
