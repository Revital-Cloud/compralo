"""
Mapa del módulo de dashboard (router).

Este router expone el endpoint que alimenta el dashboard administrativo con
KPIs, series de ventas, top productos y órdenes recientes.

Flujo:
1) Valida sesión y rol admin.
2) Normaliza `time_range` permitido.
3) Delega la composición del payload a `dashboard_service`.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import require_admin, UserInToken
from services.dashboard_service import get_dashboard_data

router = APIRouter(tags=["Dashboard"])


@router.get("/admin/dashboard", status_code=status.HTTP_200_OK)
async def get_dashboard(
    time_range: str = 'monthly',
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Endpoint -> Service -> Tablas:
    - Endpoint: `GET /admin/dashboard?time_range=daily|weekly|monthly`
    - Service: `dashboard_service.get_dashboard_data`
    - Tablas principales:
      - `tab_ordenes`, `tab_orden_productos`
      - `tab_products` y tablas de variantes
      - `tab_usuarios` (nombre cliente en recientes)

    Reglas:
    - Si `time_range` llega con valor inválido, se fuerza a `monthly`.
    - Solo accesible por administradores.
    """
    try:
        # Validar time_range
        if time_range not in ['daily', 'weekly', 'monthly']:
            time_range = 'monthly'
        
        data = get_dashboard_data(db, time_range)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener datos del dashboard: {str(e)}"
        )

