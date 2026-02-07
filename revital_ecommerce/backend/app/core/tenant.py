"""
Módulo de Multi-tenant para Wompi.

Proporciona funciones para obtener credenciales de Wompi por tenant/store.
Actualmente retorna credenciales globales de settings, pero está estructurado
para extensión futura a multi-tenant real.
"""
from fastapi import Request
from sqlalchemy.orm import Session
from typing import Optional
from dataclasses import dataclass
from core.config import settings
import logging

logger = logging.getLogger(__name__)


@dataclass
class StoreWompiConfig:
    """
    Configuración de Wompi para un store/tenant específico.
    """
    wompi_public_key: str
    wompi_integrity_secret: str
    wompi_events_secret: str
    wompi_environment: str  # "sandbox" | "production"
    wompi_private_key: Optional[str] = None  # Opcional, para consultas directas


def get_store_from_request(request: Request, db: Session) -> StoreWompiConfig:
    """
    Obtiene las credenciales de Wompi para el tenant/store desde la request.
    
    Estrategias de identificación de tenant (en orden de prioridad):
    1. Header `x-store-id`: ID del store/tenant
    2. Subdominio: Extraer de Host header
    3. API Key: Si se implementa en el futuro
    4. Fallback: Credenciales globales de settings
    
    Args:
        request: Request de FastAPI
        db: Sesión de base de datos
        
    Returns:
        StoreWompiConfig: Configuración de Wompi para el tenant
        
    TODO: Implementar lógica real de multi-tenant cuando se requiera:
        - Crear tabla tab_stores con credenciales Wompi por store
        - Consultar credenciales desde DB según tenant identificado
        - Cachear credenciales para performance
    """
    # Estrategia 1: Header x-store-id
    store_id = request.headers.get("x-store-id")
    if store_id:
        logger.info(f"Identificado tenant por header x-store-id: {store_id}")
        # TODO: Consultar credenciales desde DB
        # store = db.query(Store).filter(Store.id == store_id).first()
        # if store:
        #     return StoreWompiConfig(
        #         wompi_public_key=store.wompi_public_key,
        #         wompi_integrity_secret=store.wompi_integrity_secret,
        #         wompi_events_secret=store.wompi_events_secret,
        #         wompi_environment=store.wompi_environment,
        #         wompi_private_key=store.wompi_private_key
        #     )
    
    # Estrategia 2: Subdominio
    host = request.headers.get("host", "")
    if host and "." in host:
        subdomain = host.split(".")[0]
        if subdomain and subdomain not in ["www", "api", "admin"]:
            logger.info(f"Identificado tenant por subdominio: {subdomain}")
            # TODO: Consultar credenciales desde DB por subdominio
            # store = db.query(Store).filter(Store.subdomain == subdomain).first()
            # if store:
            #     return StoreWompiConfig(...)
    
    # Fallback: Credenciales globales de settings
    logger.debug("Usando credenciales globales de settings (fallback)")
    return StoreWompiConfig(
        wompi_public_key=settings.WOMPI_PUBLIC_KEY,
        wompi_integrity_secret=settings.WOMPI_INTEGRITY_SECRET,
        wompi_events_secret=settings.WOMPI_EVENTS_SECRET,
        wompi_environment=settings.WOMPI_ENVIRONMENT,
        wompi_private_key=getattr(settings, "WOMPI_PRIVATE_KEY", None)
    )


def get_wompi_base_url(environment: str) -> str:
    """
    Obtiene la URL base de la API de Wompi según el entorno.
    
    Args:
        environment: "sandbox" o "production"
        
    Returns:
        str: URL base de la API de Wompi
    """
    if environment.lower() == "production":
        return "https://production.wompi.co/v1"
    else:
        return "https://sandbox.wompi.co/v1"

