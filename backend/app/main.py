"""
Archivo Principal de la Aplicación FastAPI.

Este módulo inicializa la aplicación FastAPI, define rutas básicas
y registra los routers de la aplicación, como el router de productos.
También puede incluir configuraciones globales de la aplicación y middlewares.
"""
from fastapi import FastAPI, Request

from core.config import settings
from routers.product_router import router as product_router
from routers.users_router import router as users_router

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

@app.middleware("http")
async def print_raw_body(request: Request, call_next):
    body = await request.body()
    print("CUERPO CRUDO:", body)
    response = await call_next(request)
    return response

# Incluye el router de productos con un prefijo de API.
# Esto organiza todas las rutas relacionadas con productos bajo /api.
app.include_router(product_router, prefix=settings.API_STR)

app.include_router(users_router, prefix=settings.API_STR)