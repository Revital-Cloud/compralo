"""
Archivo Principal de la Aplicación FastAPI.

Este módulo inicializa la aplicación FastAPI, define rutas básicas
y configura middlewares esenciales.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from middlewares.security_middleware import SecurityMiddleware
from core.config import settings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Synkro API",
    description="API para la plataforma Synkro",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agregar middleware de seguridad
app.add_middleware(SecurityMiddleware)

# Nota: El middleware de autenticación se puede agregar cuando se implementen
# los servicios de autenticación necesarios
# from middlewares.auth_middleware import AuthMiddleware
# app.add_middleware(
#     AuthMiddleware,
#     protected_paths=[
#         "/api/auth/me", 
#         "/api/auth/change-password", 
#         "/api/auth/logout",
#     ],
#     admin_only_paths=[
#         "/api/admin",
#     ]
# )

@app.get("/")
def read_root():
    """
    Endpoint Raíz.

    Devuelve un mensaje de bienvenida para la API.
    Es útil para verificar que la API está funcionando.

    Returns:
        dict: Un mensaje de bienvenida.
    """
    return {"message": "Bienvenido a la API de Synkro"}

@app.get("/health")
def health_check():
    """
    Endpoint de health check.

    Returns:
        dict: Estado de la API.
    """
    return {"status": "healthy", "service": "synkro-api"}

