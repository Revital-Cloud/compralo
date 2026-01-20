"""
Archivo Principal de la Aplicacion FastAPI - Synkro SaaS.

Este modulo inicializa la aplicacion FastAPI, define rutas basicas,
configura middlewares y registra todos los routers del sistema.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from slowapi.errors import RateLimitExceeded

from middlewares.security_middleware import SecurityMiddleware
from core.config import settings
from core.rate_limiter import limiter

# Importar routers
from routers.auth_router import router as auth_router
from routers.usuario_synkro_router import router as usuario_synkro_router
from routers.cliente_router import router as cliente_router
from routers.plan_router import router as plan_router
from routers.instancia_router import router as instancia_router
from routers.suscripcion_router import router as suscripcion_router
from routers.facturacion_router import router as facturacion_router
from routers.deployment_router import router as deployment_router
from routers.dominio_router import router as dominio_router
from routers.uso_recurso_router import router as uso_recurso_router
from routers.historial_plan_router import router as historial_plan_router
from routers.admin_metrics_router import router as admin_metrics_router

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors.
    Returns a JSON response with a user-friendly message.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please try again later.",
            "retry_after": exc.detail
        }
    )


app = FastAPI(
    title="Synkro SaaS API",
    description="""
API para la plataforma Synkro SaaS - Panel de Control de Instancias E-commerce.

## Autenticacion

El sistema usa JWT con dos tipos de usuarios:
- **Admins de Synkro**: Superadmins, soporte, ventas - acceso completo
- **Clientes**: Empresas que contratan el servicio - acceso limitado a su plan

## Endpoints principales

- `/api/auth`: Autenticacion unificada
- `/api/admin/usuarios`: Gestion de admins de Synkro
- `/api/clientes`: Gestion de clientes
- `/api/planes`: Planes de suscripcion
- `/api/instancias`: Instancias de e-commerce
- `/api/suscripciones`: Suscripciones de clientes
- `/api/facturacion`: Facturas
- `/api/deployments`: Deployments de instancias
- `/api/dominios`: Dominios asociados
- `/api/uso-recursos`: Tracking de recursos
- `/api/historial-planes`: Historial de cambios de plan
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar Rate Limiter en la app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En produccion, especificar dominios especificos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agregar middleware de seguridad
app.add_middleware(SecurityMiddleware)

# ============================================================
# REGISTRO DE ROUTERS
# ============================================================

# Autenticacion
app.include_router(auth_router)

# Gestion de Admins de Synkro (solo accesible para admins)
app.include_router(usuario_synkro_router)

# Gestion de Clientes
app.include_router(cliente_router)

# Planes de suscripcion
app.include_router(plan_router)

# Instancias de e-commerce
app.include_router(instancia_router)

# Suscripciones
app.include_router(suscripcion_router)

# Facturacion
app.include_router(facturacion_router)

# Deployments
app.include_router(deployment_router)

# Dominios
app.include_router(dominio_router)

# Uso de recursos
app.include_router(uso_recurso_router)

# Historial de planes
app.include_router(historial_plan_router)

# Métricas admin (dashboard central de Synkro)
app.include_router(admin_metrics_router)


# ============================================================
# ENDPOINTS BASICOS
# ============================================================

@app.get("/")
def read_root():
    """
    Endpoint Raiz.

    Devuelve un mensaje de bienvenida para la API.
    Es util para verificar que la API esta funcionando.

    Returns:
        dict: Un mensaje de bienvenida.
    """
    return {
        "message": "Bienvenido a la API de Synkro SaaS",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """
    Endpoint de health check.

    Returns:
        dict: Estado de la API.
    """
    return {"status": "healthy", "service": "synkro-saas-api"}
