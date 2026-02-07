"""
Módulo de Configuración.

Este módulo define y carga las configuraciones necesarias para la aplicación,
utilizando Pydantic para la validación y gestión de variables de entorno.
Incluye configuraciones para la base de datos, la aplicación en general,
seguridad, la API y el servicio de emails con Resend.
"""
# Carga de variables de entorno y configuraciones
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """
    Clase de Configuración SaaS.

    Define todas las variables de configuración de la aplicación.
    Estas variables se cargan desde un archivo .env o desde el entorno.
    Configuración multi-tenant para SaaS de ecommerce.

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
    
    # Configuración de seguridad
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int 
    ALGORITHM: str
    REFRESH_TOKEN_EXPIRE_DAYS: int 
    
    # Cloudinary configuracion
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


    class Config:
        env_file = ".env"
        case_sensitive = True

# Instancia global de configuración
settings = Settings()

