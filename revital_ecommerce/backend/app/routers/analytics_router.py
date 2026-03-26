"""
Mapa del módulo de analytics (router).

Este router expone el endpoint administrativo que consolida métricas avanzadas
para visualización analítica del negocio.

Flujo general:
1) Endpoint valida autenticación + rol admin.
2) Router delega cálculo y agregación a `services.analytics_service`.
3) Service consulta tablas de órdenes, carritos, productos y usuarios.
4) Se retorna un payload unificado para el dashboard de analytics.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import require_admin, UserInToken
from services.analytics_service import get_analytics_data

router = APIRouter(tags=["Analytics"])


@router.get("/admin/analytics", status_code=status.HTTP_200_OK)
async def get_analytics(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Endpoint -> Service -> Tablas:
    - Endpoint: `GET /admin/analytics`
    - Service: `analytics_service.get_analytics_data`
    - Tablas/Fuentes típicas:
      - `tab_ordenes`, `tab_orden_productos`, `tab_carritos`
      - `tab_products`, variantes de producto, `tab_usuarios`, direcciones

    Qué devuelve:
    - Un objeto con bloques listos para UI:
      - métricas de conversión
      - performance por categoría
      - métricas globales de productos
      - datos geográficos
      - tráfico por hora
      - fuentes de tráfico (estimadas)
      - demografía por rangos de edad

    Seguridad:
    - Requiere `require_admin()`. Si el usuario no es admin, FastAPI corta
      la ejecución antes de entrar a la lógica del endpoint.
    """
    try:
        data = get_analytics_data(db)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener datos de analytics: {str(e)}"
        )

