"""
Módulo de Configuración.

Este módulo define y carga las configuraciones necesarias para la aplicación,
utilizando Pydantic para la validación y gestión de variables de entorno.
Incluye configuraciones para la base de datos, la aplicación en general,
seguridad, la API y el servicio de emails con Resend.

Entornos: se cargan variables desde .env y luego desde .env.development o
.env.production según la variable ENVIRONMENT (por defecto: development).
"""
import os
from typing import Optional

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolver qué archivo de entorno usar (development | production)
_ENV = os.getenv("ENVIRONMENT", "development").strip().lower()
if _ENV not in ("development", "production"):
    _ENV = "development"
_ENV_FILES: tuple[str, ...] = (".env", f".env.{_ENV}")


class Settings(BaseSettings):
    """
    Clase de configuración central del backend.

    Define todas las variables de configuración de la aplicación y su tipado.
    Las variables se cargan desde archivos `.env` y/o entorno del sistema.
    Aunque la plataforma es SaaS, este backend pertenece a una instancia
    aislada de e-commerce.

    Atributos:
        DATABASE_URL (str): URL de conexión a la base de datos.
        APP_NAME (str): Nombre de la aplicación cliente.
        COMPANY_NAME (str): Nombre de la empresa cliente.
        COMPANY_TAGLINE (str): Eslogan de la empresa.
        COMPANY_ADDRESS (str): Dirección de la empresa.
        SUPPORT_EMAIL (str): Email de soporte de la empresa.
        SECRET_KEY (str): Clave secreta para la firma de tokens.
        ACCESS_TOKEN_EXPIRE_MINUTES (int): Tiempo de expiración para los tokens de acceso.
        API_V1_STR (str): Prefijo para la versión 1 de la API.
        PROJECT_NAME (str): Nombre del proyecto.
        RESEND_KEY (str): Clave API de Resend para envío de emails.
        RESEND_FROM_EMAIL (str): Email remitente por defecto.
        RESEND_FROM_NAME (str): Nombre del remitente por defecto.
        FRONTEND_URL (str): URL del frontend para links en emails.
        VERIFY_EMAIL_URL (str): URL para verificación de email.
        RESET_PASSWORD_URL (str): URL para reset de contraseña.
        WOMPI_PUBLIC_KEY (str): Clave pública de Wompi para integración.
        WOMPI_PRIVATE_KEY (str): Clave privada de Wompi para integración.
        WOMPI_EVENTS_SECRET (str): Clave de eventos de Wompi para integración.
        WOMPI_INTEGRITY_SECRET (str): Clave de integridad de Wompi para integración.
        WOMPI_ENVIRONMENT (str): Entorno de Wompi para integración.
        GROQ_API_KEY (str): Clave API de Groq para funcionalidades de IA.
        OLLAMA_BASE_URL (str): URL base de Ollama para embeddings.
        OLLAMA_EMBED_MODEL (str): Modelo de Ollama para embeddings.
        AI_SEARCH_MIN_BEST_SCORE (float): Puntuación mínima para resultados de búsqueda IA.
        AI_SEARCH_DEFAULT_MIN_SCORE (float): Puntuación mínima por defecto para búsqueda IA.
        AI_SEARCH_DEFAULT_MIN_SCORE_RATIO (float): Ratio de puntuación mínima por defecto para búsqueda IA.
        AI_SEARCH_DEFAULT_MAX_SCORE_DROP (float): Puntuación máxima por defecto para búsqueda IA.
        TURNSTILE_SECRET_KEY (str): Clave secreta de Turnstile para CAPTCHA.
        TURNSTILE_ENABLED (bool): Indica si el CAPTCHA está habilitado.
        
        CRON_JOB_TOKEN (str): Token de cron job para carrito abandonado.
        ABANDONED_CART_INACTIVITY_HOURS (int): Tiempo de inactividad para carrito abandonado.
        ABANDONED_CART_SEND_COOLDOWN_HOURS (int): Tiempo de cooldown para envío de carrito abandonado.
        ABANDONED_CART_BATCH_LIMIT (int): Límite de carritos abandonados por batch.
    """

    model_config = SettingsConfigDict(env_file=_ENV_FILES, case_sensitive=True, extra="ignore")

    # Configuración de la base de datos
    DATABASE_URL: str
    
    # Configuración SaaS de la empresa cliente
    COMPANY_NAME: str
    APP_NAME: str
    COMPANY_TAGLINE: str
    COMPANY_ADDRESS: str
    SUPPORT_EMAIL: str
    
    # Configuración de seguridad
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int 
    ALGORITHM: str
    REFRESH_TOKEN_EXPIRE_DAYS: int 
    
    # Configuración de Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    
    # Configuración de emails con Resend
    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str
    RESEND_FROM_NAME: str
    
    # URLs del frontend para links en emails
    FRONTEND_URL: str
    VERIFY_EMAIL_URL: str
    RESET_PASSWORD_URL: str
    
    # Configuración de la API
    API_STR: str = "/api"
    PROJECT_NAME: str = "Compralo API"
    
    # Configuración de Wompi
    WOMPI_PUBLIC_KEY: str
    WOMPI_PRIVATE_KEY: str
    WOMPI_EVENTS_SECRET: str
    WOMPI_INTEGRITY_SECRET: str
    WOMPI_ENVIRONMENT: str = "sandbox"

    # Groq: clave API para funcionalidades de IA (resumen/chat admin).
    # Es opcional; si falta, las rutas /admin/ai devuelven 503.
    GROQ_API_KEY: Optional[str] = None

    # AI Product Search (Ollama embeddings)
    # Son opcionales porque el backend tiene fallback a búsqueda clásica.
    OLLAMA_BASE_URL: Optional[str] = None
    OLLAMA_EMBED_MODEL: Optional[str] = None
    AI_SEARCH_MIN_BEST_SCORE: float = 0.45
    AI_SEARCH_DEFAULT_MIN_SCORE: Optional[float] = None
    AI_SEARCH_DEFAULT_MIN_SCORE_RATIO: Optional[float] = None
    AI_SEARCH_DEFAULT_MAX_SCORE_DROP: Optional[float] = None

    # Cloudflare Turnstile (CAPTCHA) - verificación del lado servidor.
    # Si no está configurado, el backend no valida el captcha y se considera deshabilitado.
    TURNSTILE_SECRET_KEY: Optional[str] = None
    TURNSTILE_ENABLED: bool = True

    # Jobs de carrito abandonado (cron externo)
    CRON_JOB_TOKEN: Optional[str] = None
    ABANDONED_CART_INACTIVITY_HOURS: int = 2
    ABANDONED_CART_SEND_COOLDOWN_HOURS: int = 24
    ABANDONED_CART_BATCH_LIMIT: int = 1000

    # Envia Shipping (sandbox por defecto; en producción usar https://api.envia.com y token prod)
    ENVIA_API_BASE: str = Field(
        default="https://api-test.envia.com",
        validation_alias=AliasChoices("ENVIA_API_BASE", "ENVIA_BASE_URL"),
    )
    ENVIA_QUERIES_BASE: str = Field(
        default="https://queries-test.envia.com",
        validation_alias=AliasChoices("ENVIA_QUERIES_BASE", "ENVIA_QUERIES_URL"),
    )
    ENVIA_TOKEN: Optional[str] = None
    ENVIA_ORIGIN_NAME: str = ""
    ENVIA_ORIGIN_COMPANY: str = ""
    ENVIA_ORIGIN_EMAIL: str = ""
    ENVIA_ORIGIN_PHONE: str = ""
    ENVIA_ORIGIN_STREET: str = ""
    ENVIA_ORIGIN_NUMBER: str = "S/N"
    ENVIA_ORIGIN_DISTRICT: str = ""
    ENVIA_ORIGIN_CITY: str = ""
    ENVIA_ORIGIN_STATE: str = ""
    ENVIA_ORIGIN_POSTAL: str = ""

    # Generación de guías CO: Envia exige printFormat + printSize en settings (ver API /ship/generate/)
    ENVIA_PRINT_FORMAT: str = "PDF"
    ENVIA_PRINT_SIZE: str = "STOCK_4X6"
    # Si Servientrega rechaza el tamaño por defecto, probar p. ej. PAPER_7X4.75 (documentación Envia por carrier).
    ENVIA_PRINT_SIZE_SERVIENTREGA: Optional[str] = None
    # Lista CSV opcional de tamaños extra solo para reintentos Servientrega (1300 / error carrier), ej: PAPER_4X6,ZPL
    ENVIA_SERVIENTREGA_FALLBACK_PRINT_SIZES: Optional[str] = None

class Config:
        env_file = _ENV_FILES
        case_sensitive = True
# Instancia global de configuración (carga .env y .env.development/.env.production)
settings = Settings()

# Expone el entorno actual para su uso en app (middlewares, logging, etc.).
def is_production() -> bool:
    return _ENV == "production"