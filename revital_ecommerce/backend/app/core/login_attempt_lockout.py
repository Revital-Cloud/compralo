"""
In-memory lockout store for failed login attempts.

Goal:
- Allow the first N failed logins per email.
- Once the threshold is reached, block further attempts for a fixed cooldown (lockout).

This is intentionally in-memory (similar to `core.otp_store`) to avoid DB migrations.
Note: in multi-worker deployments, each worker will have its own lockout state.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from threading import Lock
from typing import Optional


MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


@dataclass
class LoginAttemptEntry:
    failures: int
    locked_until: Optional[datetime]


_lock = Lock()
_store: dict[str, LoginAttemptEntry] = {}


def _norm_email(email: str) -> str:
    return email.strip().lower()


def get_remaining_lockout_seconds(email: str) -> int:
    """
    Returns remaining cooldown time in seconds.
    If not locked, returns 0.
    """
    key = _norm_email(email)
    now = datetime.utcnow()
    with _lock:
        entry = _store.get(key)
        if not entry or not entry.locked_until:
            return 0
        if now >= entry.locked_until:
            # Expired -> reset.
            _store.pop(key, None)
            return 0
        remaining = entry.locked_until - now
        return max(1, int(remaining.total_seconds() + 0.999999))


def record_failed_login(email: str) -> None:
    """
    Increments failures; when threshold is reached, sets a fixed lockout.

    The attempt that *reaches* the threshold is allowed; the lock applies from the next request.
    """
    key = _norm_email(email)
    now = datetime.utcnow()
    with _lock:
        entry = _store.get(key)
        if entry and entry.locked_until and now < entry.locked_until:
            # Already locked: do not extend.
            return

        # If lock expired or entry missing: reset failures.
        if not entry or (entry.locked_until and now >= entry.locked_until):
            entry = LoginAttemptEntry(failures=0, locked_until=None)

        entry.failures += 1
        if entry.failures >= MAX_FAILED_ATTEMPTS:
            entry = LoginAttemptEntry(
                failures=0,
                locked_until=now + timedelta(minutes=LOCKOUT_MINUTES),
            )
        _store[key] = entry


def clear_failed_logins(email: str) -> None:
    """Clears the lockout/failure counter for the email on successful login."""
    key = _norm_email(email)
    with _lock:
        _store.pop(key, None)

