"""
Archivo Principal de la Aplicación FastAPI.

Este módulo inicializa la aplicación FastAPI, define rutas básicas
y registra los routers de la aplicación, como el router de productos.
También puede incluir configuraciones globales de la aplicación y middlewares.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from routers.cms_router import router as cms_router
from routers.provider_router import router as provider_router
from core.config import settings
from routers.product_router import router as product_router
from routers.user_router import router as user_router
from routers.subline_router import router as subline_router
from routers.brand_router import router as brand_router
from routers.category_router import router as category_router
from routers.lines_routers import router as lines_routers

from routers.auth_router import router as auth_router
from middlewares.auth_middleware import product_middleware
from middlewares.role_middleware import admin_only_middleware

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Synkro Ecommerce API",
    description="API para la plataforma de ecommerce Synkro",
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

# Agregar middlewares de autenticación y autorización
app.middleware("http")(admin_only_middleware)
app.middleware("http")(product_middleware)

@app.get("/")
def read_root():
    """
    Endpoint Raíz.

    Devuelve un mensaje de bienvenida para la API.
    Es útil para verificar que la API está funcionando.

    Returns:
        dict: Un mensaje de bienvenida.
    """
    return {"message": "Bienvenido a la API de Synkro Ecommerce Platform"}

# Incluye el router de autenticación con un prefijo de API.
app.include_router(auth_router, prefix=settings.API_STR)
# Incluye el router de productos con un prefijo de API.
app.include_router(product_router, prefix=settings.API_STR)
# Incluye el router de proveedores con un prefijo de API.
app.include_router(provider_router, prefix=settings.API_STR)
# Incluye el router de usuarios con un prefijo de API.
app.include_router(user_router, prefix=settings.API_STR)
# Incluye el router de marcas con un prefijo de API.
app.include_router(brand_router, prefix=settings.API_STR)
# Incluye el router de sublineas con un prefijo de API.
app.include_router(subline_router, prefix=settings.API_STR)

app.include_router(category_router, prefix=settings.API_STR)

app.include_router(lines_routers, prefix=settings.API_STR)

app.include_router(cms_router, prefix=settings.API_STR)