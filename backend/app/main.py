"""
Archivo Principal de la Aplicación FastAPI.

Este módulo inicializa la aplicación FastAPI, define rutas básicas
y registra los routers de la aplicación, como el router de productos.
También puede incluir configuraciones globales de la aplicación y middlewares.
"""
from fastapi import FastAPI, Request

from routers.provider_router import router as provider_router
from core.config import settings
from routers.product_router import router as product_router
from routers.user_router import router as user_router
from routers.subline_router import router as subline_router
from routers.brand_router import router as brand_router
from routers.auth_router import router as auth_router
app = FastAPI()

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