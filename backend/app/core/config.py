# Carga de variables de entorno y configuraciones
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
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