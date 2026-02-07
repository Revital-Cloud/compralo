"""
Módulo de Base de Datos.

Este módulo se encarga de configurar la conexión a la base de datos
utilizando SQLAlchemy. Define el motor de la base de datos, la sesión
local y una función para obtener una sesión de base de datos.
"""
# Configuración de SQLAlchemy (motor, sesión, base)
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from core.config import settings

#Equivalente al PDO
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Generador de Sesión de Base de Datos.

    Proporciona una sesión de base de datos para ser utilizada en las dependencias
    de FastAPI. Asegura que la sesión se cierre correctamente después de su uso.

    Yields:
        Session: Una instancia de la sesión de SQLAlchemy.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
