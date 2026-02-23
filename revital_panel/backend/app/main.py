"""
Archivo Principal de la Aplicacion FastAPI - Revital SaaS.

Este modulo inicializa la aplicacion FastAPI, define rutas basicas,
configura middlewares y registra todos los routers del sistema.
"""
import sys
from pathlib import Path

# Asegurar que el directorio app esté en el path para imports (middlewares, core, routers)
_app_dir = Path(__file__).resolve().parent
if str(_app_dir) not in sys.path:
    sys.path.insert(0, str(_app_dir))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from slowapi.errors import RateLimitExceeded

from middlewares.security_middleware import SecurityMiddleware
from core.config import settings, is_production
from core.rate_limiter import limiter

# Importar routers
from routers.auth_router import router as auth_router
from routers.usuario_revital_router import router as usuario_revital_router
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

# Configurar logging: en producción solo WARNING y superior (no se muestran INFO/DEBUG)
logging.basicConfig(level=logging.WARNING if is_production() else logging.INFO)
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
    title="Revital SaaS API",
    description="""
API para la plataforma Revital SaaS - Panel de Control de Instancias E-commerce.

## Autenticacion

El sistema usa JWT con dos tipos de usuarios:
- **Admins de Revital**: Superadmins, soporte, ventas - acceso completo
- **Clientes**: Empresas que contratan el servicio - acceso limitado a su plan

## Endpoints principales

- `/api/auth`: Authentication
- `/api/admin/users`: Revital admin users management
- `/api/clients`: Clients management
- `/api/plans`: Subscription plans
- `/api/instances`: E-commerce instances
- `/api/subscriptions`: Client subscriptions
- `/api/billing`: Invoices and payments
- `/api/deployments`: Instance deployments
- `/api/domains`: Associated domains
- `/api/resource-usage`: Resource usage tracking
- `/api/plan-history`: Plan change history
- `/api/admin/metrics`: Admin dashboard metrics
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
    expose_headers=["*"],
)

# Middleware para Private Network Access (PNA): permite que paginas cargadas
# desde IP publica (ej. http://46.224.101.179:3001) llamen a la API en
# localhost (red privada). Sin esto, Chrome y otros navegadores bloquean
# la peticion por politica de seguridad.
PNA_HEADER = "Access-Control-Allow-Private-Network"
PNA_REQUEST_HEADER = "Access-Control-Request-Private-Network"


@app.middleware("http")
async def add_private_network_access_header(request, call_next):
    response = await call_next(request)
    if request.headers.get(PNA_REQUEST_HEADER, "").lower() == "true":
        response.headers[PNA_HEADER] = "true"
    return response

# Agregar middleware de seguridad
app.add_middleware(SecurityMiddleware)

# ============================================================
# REGISTRO DE ROUTERS
# ============================================================

# Autenticacion
app.include_router(auth_router)

# Gestion de Admins de Revital (solo accesible para admins)
app.include_router(usuario_revital_router)

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
        "message": "Bienvenido a la API de Revital SaaS",
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
    return {"status": "healthy", "service": "revital-saas-api"}
