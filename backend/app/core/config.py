"""
Módulo de Configuración.

Este módulo define y carga las configuraciones necesarias para la aplicación,
utilizando Pydantic para la validación y gestión de variables de entorno.
Incluye configuraciones para la base de datos, la aplicación en general,
seguridad y la API.
"""
# Carga de variables de entorno y configuraciones
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Clase de Configuración.

    Define todas las variables de configuración de la aplicación.
    Estas variables se cargan desde un archivo .env o desde el entorno.

    Atributos:
        DATABASE_URL (str): URL de conexión a la base de datos.
        APP_NAME (str): Nombre de la aplicación.
        DEBUG (bool): Indicador de modo debug.
        SECRET_KEY (str): Clave secreta para la firma de tokens.
        ACCESS_TOKEN_EXPIRE_MINUTES (int): Tiempo de expiración para los tokens de acceso.
        API_V1_STR (str): Prefijo para la versión 1 de la API.
        PROJECT_NAME (str): Nombre del proyecto.
    """
    # Configuración de la base de datos
    DATABASE_URL: str
    
    # Configuración de la aplicación
    APP_NAME: str = "Synkro"
    DEBUG: bool = True
    
    # Configuración de seguridad
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Configuración de la API
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Synkro API"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instancia global de configuración
settings = Settings()