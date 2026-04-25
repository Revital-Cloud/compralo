"""
Archivo Principal de la Aplicación FastAPI.

Este módulo inicializa la aplicación FastAPI, define rutas básicas
y registra los routers de la aplicación, como el router de productos.
También puede incluir configuraciones globales de la aplicación y middlewares.
"""
from urllib.parse import urlparse
import uuid
import logging
from contextvars import ContextVar

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from slowapi.errors import RateLimitExceeded

from core.config import is_production
from core.exceptions import (
    MSG_GENERIC_ERROR,
    MSG_DATABASE_ERROR,
    get_safe_message,
)
from sqlalchemy.exc import SQLAlchemyError
from middlewares.auth_middleware import AuthMiddleware
from middlewares.security_middleware import SecurityMiddleware
# from middlewares.role_middleware import SmartAuthMiddleware
from routers.cms_router import router as cms_router
from routers.provider_router import router as provider_router
from core.config import settings
from routers.product_router import router as product_router
from routers.user_router import router as user_router
from routers.brand_router import router as brand_router
from routers.category_router import router as category_router
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
from routers.ai_router import router as ai_router
from routers.attribute_router import router as attribute_router
from routers.top_info_bar_router import router as top_info_bar_router
from core.rate_limiter import limiter

# Configurar logging: en producción solo WARNING y superior (no se muestran INFO/DEBUG)
trace_id_var: ContextVar[str] = ContextVar("trace_id", default="-")

class TraceIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # Inyecta trace_id en todos los logs para correlacionar incidentes.
        record.trace_id = trace_id_var.get()
        return True

class SafeTraceIdFormatter(logging.Formatter):
    """
    Evita fallos cuando algunos LogRecord (p.ej. logs de startup de Uvicorn)
    no traen el atributo `trace_id`.
    """

    def format(self, record: logging.LogRecord) -> str:
        if not hasattr(record, "trace_id"):
            record.trace_id = trace_id_var.get()
        return super().format(record)


_log_format = "%(asctime)s [%(levelname)s] %(name)s [trace_id=%(trace_id)s] %(message)s"
_handler = logging.StreamHandler()
_handler.setFormatter(SafeTraceIdFormatter(_log_format))

root_logger = logging.getLogger()
root_logger.setLevel(logging.WARNING if is_production() else logging.INFO)
if not root_logger.handlers:
    root_logger.addHandler(_handler)
else:
    safe_formatter = SafeTraceIdFormatter(_log_format)
    for h in root_logger.handlers:
        h.setFormatter(safe_formatter)
root_logger.addFilter(TraceIdFilter())
logger = logging.getLogger(__name__)

# En producción no exponemos documentación pública (Swagger / ReDoc) ni el schema OpenAPI.
# Nota: esto depende de que `ENVIRONMENT=production` esté configurado en el entorno.
_docs_url = None if is_production() else "/docs"
_redoc_url = None if is_production() else "/redoc"
_openapi_url = None if is_production() else "/openapi.json"

app = FastAPI(
    title="Compralo API",
    description="API para la plataforma Compralo",
    version="1.0.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    openapi_url=_openapi_url,
)

@app.middleware("http")
async def add_trace_id_middleware(request: Request, call_next):
    # Prioridad: header -> nuevo uuid
    incoming = request.headers.get("x-trace-id") or request.headers.get("x-request-id")
    trace_id = incoming.strip() if incoming else uuid.uuid4().hex
    token = trace_id_var.set(trace_id)
    try:
        response = await call_next(request)
        # Retornamos siempre para debugging/observabilidad.
        response.headers["X-Trace-Id"] = trace_id
        response.headers["X-Request-Id"] = trace_id
        return response
    finally:
        trace_id_var.reset(token)

# Orígenes permitidos para CORS (dev y prod)
ALLOWED_CORS_ORIGINS = [
    # Producción
    "https://compralo.revital.cloud",
    # Frontend local en dev
    "http://localhost:3001",
    # Frontend dev expuesto por IP del servidor
    "http://46.225.94.64:3001",
    # Compatibilidad con puerto 3002 si se usa en algún entorno
    "http://localhost:3002",
    "http://46.225.94.64:3002",
]

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Manejador personalizado cuando se supera el límite de peticiones.

    Este handler centraliza la respuesta HTTP 429 y entrega un mensaje claro
    al cliente, junto con la pista de reintento (`retry_after`) emitida por
    el limitador.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.",
            "retry_after": exc.detail
        }
    )


def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Sanitiza errores 5xx en producción.

    Regla de seguridad: nunca exponer al cliente detalles internos
    (consultas SQL, trazas o mensajes de infraestructura).
    """
    if exc.status_code >= 500 and is_production():
        logger.warning("HTTP 5xx sanitized for client: status=%s", exc.status_code, exc_info=False)
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": MSG_GENERIC_ERROR},
        )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


def sqlalchemy_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Captura errores de SQLAlchemy/base de datos y devuelve un mensaje seguro.

    El detalle real se registra únicamente del lado del servidor para
    diagnóstico, sin filtrarlo al cliente.
    """
    logger.exception("Database/SQL error (not exposed to client): %s", type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={"detail": MSG_DATABASE_ERROR},
    )


def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Captura excepciones no controladas de forma global.

    Nunca expone stack traces ni mensajes internos al cliente; responde con
    texto seguro definido por la capa de excepciones.
    """
    logger.exception("Unhandled exception (not exposed to client): %s", type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={"detail": get_safe_message(exc)},
    )


# Configurar Rate Limiter en la app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# TrustedHost en producción: valida el header Host para evitar URLs con host malicioso (SEC-004)
if is_production():
    _parsed = urlparse(settings.FRONTEND_URL)
    _frontend_host = _parsed.hostname or "localhost"

    # Permitimos tanto el host del frontend como los hosts del backend (api.*) y la IP del servidor.
    _allowed_hosts = list(
        {
            _frontend_host,                  # compralo.revital.cloud
            f"api.{_frontend_host}",        # api.compralo.revital.cloud
            ".revital.cloud",               # cualquier subdominio de revital.cloud
            "localhost",
            "46.225.94.64",
        }
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=_allowed_hosts)

# Compresión de respuestas (mejora Lighthouse uses-text-compression)
app.add_middleware(GZipMiddleware, minimum_size=500)

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
        # Carrito (/api/carrito-*) NO protegido intencionalmente:
        # usuarios anónimos pueden navegar/agregar; login solo al pagar.
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
        "/api/providers",     # GET público, POST/PUT/DELETE admin
        "/api/cms",          # GET público, POST/PUT/DELETE admin
        "/api/users",        # POST público (registro), resto admin-only
        "/api/admin",        # Todo requiere admin
        "/api/email",        # Todo requiere admin
        "/api/points",       # Todo requiere admin
        # /api/discounts no está aquí:
        # validate-for-cart y by-code son públicos para clientes.
        # Admin solo en create/update/send-coupon/stats (validado en router).
        "/api/top-info-bar",  # GET/PUT requieren admin; GET /top-info-bar/active es público (protegido en router)
        "/api/attributes",   # CRUD admin
    ]
)

# Configurar CORS como capa más externa (debe ir AL FINAL para que se ejecute PRIMERO)
# En FastAPI, los middlewares se ejecutan en orden inverso al que se agregan
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@limiter.limit("120/minute")
def read_root(request: Request):
    """
    Endpoint Raíz.

    Devuelve un mensaje de bienvenida para la API.
    Es útil para verificar que la API está funcionando.

    Returns:
        dict: Un mensaje de bienvenida.
    """
    return {"message": "Bienvenido a la API de Compralo"}

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
app.include_router(category_router, prefix=settings.API_STR)
app.include_router(attribute_router, prefix=settings.API_STR)

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

# Incluye el router de IA admin (/admin/ai/health, /admin/ai/summary, /admin/ai/chat)
app.include_router(ai_router, prefix=settings.API_STR)

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

# Barra informativa superior (top info bar) - GET /top-info-bar/active público
app.include_router(top_info_bar_router, prefix=settings.API_STR)