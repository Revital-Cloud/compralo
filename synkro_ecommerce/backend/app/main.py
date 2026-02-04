"""
Archivo Principal de la Aplicación FastAPI.

Este módulo inicializa la aplicación FastAPI, define rutas básicas
y registra los routers de la aplicación, como el router de productos.
También puede incluir configuraciones globales de la aplicación y middlewares.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from middlewares.auth_middleware import AuthMiddleware
from middlewares.security_middleware import SecurityMiddleware
# from middlewares.role_middleware import SmartAuthMiddleware
from routers.cms_router import router as cms_router
from routers.provider_router import router as provider_router
from core.config import settings
from routers.product_router import router as product_router
from routers.user_router import router as user_router
from routers.subline_router import router as subline_router
from routers.brand_router import router as brand_router
from routers.category_router import router as category_router
from routers.lines_routers import router as lines_routers
from routers.favorites_router import router as favorites_router
from routers.comentary_router import router as comentary_router
from routers.points_router import router as points_router
from routers.discount_router import router as discount_router
from routers.auth_router import router as auth_router
from routers.email_router import router as email_router
from routers.user_discounts_router import router as user_discounts_router
from routers.cart_product_router import router as cart_product_router
from routers.address_router import router as address_router
from routers.points_per_user_router import router as points_per_user_router
from routers.payment_router import router as payment_router
from routers.payment_widget_router import router as payment_widget_router
from routers.exchange_router import router as exchange_router
from routers.order_router import router as order_router
from routers.order_buy_provider_router import router as order_buy_provider_router
from routers.movements_inventory_router import router as movements_inventory_router
from routers.dashboard_router import router as dashboard_router
from routers.analytics_router import router as analytics_router

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Synkro SaaS E-commerce API",
    description="API para la plataforma SaaS de e-commerce con deployment aislado",
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

# Agregar middleware de autenticación
app.add_middleware(
    AuthMiddleware,
    protected_paths=[
        "/api/auth/me", 
        "/api/auth/change-password", 
        "/api/auth/logout",
        "/api/favorites",
        "/api/cart",
        "/api/orders",
        "/api/profile",
        "/api/user-discounts",
        "/api/points-per-user",
        "/api/payment-methods"
    ],
    admin_only_paths=[
        "/api/products",      # GET público, POST/PUT/DELETE admin
        "/api/categories",    # GET público, POST/PUT/DELETE admin
        "/api/brands",        # GET público, POST/PUT/DELETE admin
        "/api/lines",         # GET público, POST/PUT/DELETE admin
        "/api/sublines",      # GET público, POST/PUT/DELETE admin
        "/api/providers",     # GET público, POST/PUT/DELETE admin
        "/api/cms",          # GET público, POST/PUT/DELETE admin
        "/api/users",        # POST público (registro), resto admin-only
        "/api/admin",        # Todo requiere admin
        "/api/email",        # Todo requiere admin
        "/api/points",       # Todo requiere admin
        "/api/discounts"     # Todo requiere admin
    ]
)

# Configurar CORS como capa más externa (debe ir DESPUÉS para que envuelva todas las respuestas)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

app.include_router(favorites_router, prefix=settings.API_STR)

app.include_router(comentary_router, prefix=settings.API_STR)

# Incluye el router de puntos con un prefijo de API.
app.include_router(points_router, prefix=settings.API_STR)

# Incluye el router de descuentos con un prefijo de API.
app.include_router(discount_router, prefix=settings.API_STR)

# Incluye el router de descuentos por usuario con un prefijo de API.
app.include_router(user_discounts_router, prefix=settings.API_STR)

# Incluye el router de carrito de productos con un prefijo de API.
app.include_router(cart_product_router, prefix=settings.API_STR)

# Incluye el router de direcciones con un prefijo de API.
app.include_router(address_router, prefix=settings.API_STR)

# Incluye el router de emails con un prefijo de API.
app.include_router(email_router, prefix=settings.API_STR)

# Incluye el router de puntos por usuario con un prefijo de API.
app.include_router(points_per_user_router, prefix=settings.API_STR)

# Incluye el router de canjes con un prefijo de API.
app.include_router(exchange_router, prefix=settings.API_STR)

# Incluye el router de dashboard ANTES del router de órdenes para evitar conflictos de rutas
# La ruta /admin/dashboard debe evaluarse antes de /admin/{id_orden}
app.include_router(dashboard_router, prefix=settings.API_STR)

# Incluye el router de analytics ANTES del router de órdenes para evitar conflictos de rutas
# La ruta /admin/analytics debe evaluarse antes de /admin/{id_orden}
app.include_router(analytics_router, prefix=settings.API_STR)

# Incluye el router de órdenes con un prefijo de API.
app.include_router(order_router, prefix=settings.API_STR)

# Incluye el router de ordenes de compra a proveedores con un prefijo de API.
app.include_router(order_buy_provider_router, prefix=settings.API_STR)

# Incluye el router de movimientos de inventario con un prefijo de API.
app.include_router(movements_inventory_router, prefix=settings.API_STR)

# Incluye el router de pagos con un prefijo de API.
app.include_router(payment_router, prefix=settings.API_STR, tags=["Payments"])

# Incluye el router de pagos con widget de Wompi.
app.include_router(payment_widget_router, prefix=settings.API_STR)