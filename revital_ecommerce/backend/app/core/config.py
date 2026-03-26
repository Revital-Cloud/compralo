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
from pydantic_settings import BaseSettings
from typing import Optional

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
        
    """
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

    # Cloudflare Turnstile (CAPTCHA) - verificación del lado servidor.
    # Si no está configurado, el backend no valida el captcha y se considera deshabilitado.
    TURNSTILE_SECRET_KEY: Optional[str] = None
    TURNSTILE_ENABLED: bool = True

    class Config:
        env_file = _ENV_FILES
        case_sensitive = True

# Instancia global de configuración (carga .env y .env.development/.env.production)
settings = Settings()

# Expone el entorno actual para su uso en app (middlewares, logging, etc.).
def is_production() -> bool:
    return _ENV == "production"