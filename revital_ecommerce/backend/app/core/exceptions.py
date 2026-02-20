"""
Safe API error handling – never expose SQL, stack traces, or internal details to the client.

Per API security best practices:
- Sanitize error messages; do not leak sensitive information.
- Do not expose stack traces or database/SQL details in production.
- Return generic user-facing messages for server and database errors.
"""
import logging

logger = logging.getLogger(__name__)

# User-facing messages (no internal/technical details)
MSG_GENERIC_ERROR = "Ha ocurrido un error. Inténtelo de nuevo más tarde."
MSG_SERVICE_UNAVAILABLE = "El servicio no está disponible. Inténtelo más tarde."
MSG_BAD_GATEWAY = "Error temporal del servicio. Inténtelo más tarde."
MSG_DATABASE_ERROR = "Error al procesar la solicitud. Inténtelo de nuevo."
MSG_CONSTRAINT_VIOLATION = "Los datos enviados no son válidos o ya existen."
MSG_NOT_FOUND = "Recurso no encontrado."
MSG_VALIDATION_ERROR = "Datos inválidos. Verifique e intente de nuevo."


def is_database_or_sql_error(exc: BaseException) -> bool:
    """True if the exception is from DB/SQL (SQLAlchemy, psycopg, etc.)."""
    if exc is None:
        return False
    try:
        from sqlalchemy.exc import SQLAlchemyError

        if isinstance(exc, SQLAlchemyError):
            return True
    except ImportError:
        pass
    name = type(exc).__module__ + "." + type(exc).__name__
    return (
        "sqlalchemy" in name
        or "psycopg" in name
        or "db" in name.lower()
        or "sql" in name.lower()
        or "database" in name.lower()
    )


def get_safe_message(
    exc: BaseException | None,
    *,
    default: str = MSG_GENERIC_ERROR,
) -> str:
    """
    Return a safe user-facing message for any exception.
    Never returns raw exception message, SQL, or internal details.
    """
    if exc is None:
        return default
    if is_database_or_sql_error(exc):
        return MSG_DATABASE_ERROR
    return default
