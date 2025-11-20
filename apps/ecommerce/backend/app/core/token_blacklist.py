"""
Sistema de Blacklist de Tokens

Maneja la invalidación de tokens después de su uso para mayor seguridad.
En un entorno de producción, esto debería usar Redis o una base de datos.
"""

from typing import Set
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# En memoria - En producción usar Redis
_token_blacklist: Set[str] = set()
_token_blacklist_cleanup_time = datetime.utcnow()

def add_token_to_blacklist(token: str) -> None:
    """
    Agrega un token a la blacklist.
    
    Args:
        token (str): Token JWT a invalidar
    """
    global _token_blacklist_cleanup_time
    _token_blacklist.add(token)
    
    # Limpiar tokens antiguos cada hora
    if datetime.utcnow() - _token_blacklist_cleanup_time > timedelta(hours=1):
        cleanup_expired_tokens()
        _token_blacklist_cleanup_time = datetime.utcnow()

def is_token_blacklisted(token: str) -> bool:
    """
    Verifica si un token está en la blacklist.
    
    Args:
        token (str): Token JWT a verificar
        
    Returns:
        bool: True si el token está blacklisted
    """
    return token in _token_blacklist

def cleanup_expired_tokens() -> None:
    """
    Limpia tokens expirados de la blacklist.
    En producción, esto se manejaría automáticamente con TTL en Redis.
    """
    global _token_blacklist
    # En una implementación real, aquí verificarías la expiración de cada token
    # Por simplicidad, mantenemos todos los tokens por ahora
    logger.info(f"Token blacklist cleanup completed. Current size: {len(_token_blacklist)}")

def get_blacklist_size() -> int:
    """
    Obtiene el tamaño actual de la blacklist.
    
    Returns:
        int: Número de tokens en la blacklist
    """
    return len(_token_blacklist)
