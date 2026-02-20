"""
Router de Métricas Admin.

Expone endpoints agregados para el dashboard de administración de Synkro.
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import require_admin_revital
from schemas.auth_schema import UserInToken
from schemas.admin_metrics_schema import (
    AdminOverviewMetrics,
    RevenueTimeseriesResponse,
    ClientsTimeseriesResponse,
    InstancesByPlanResponse,
)
from services import admin_metrics_service

router = APIRouter(prefix="/api/admin/metrics", tags=["Admin Metrics"])


@router.get("/overview", response_model=AdminOverviewMetrics)
def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital),
):
    """
    Devuelve un resumen general de métricas para el dashboard admin.
    """
    data = admin_metrics_service.get_overview_metrics(db)
    return AdminOverviewMetrics(**data)


@router.get("/revenue-timeseries", response_model=RevenueTimeseriesResponse)
def get_revenue_timeseries(
    from_date: date = Query(
        default=None,
        description="Fecha inicial del rango (por defecto, hace 30 días)",
    ),
    to_date: date = Query(
        default=None,
        description="Fecha final del rango (por defecto, hoy)",
    ),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital),
):
    """
    Devuelve la serie temporal de ingresos diarios en el rango indicado.
    """
    today = date.today()
    if to_date is None:
        to_date = today
    if from_date is None:
        from_date = to_date - timedelta(days=30)
    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="from_date cannot be greater than to_date",
        )

    puntos = admin_metrics_service.get_revenue_timeseries(db, from_date, to_date)
    return RevenueTimeseriesResponse(from_date=from_date, to_date=to_date, puntos=puntos)


@router.get("/clients-timeseries", response_model=ClientsTimeseriesResponse)
def get_clients_timeseries(
    from_date: date = Query(
        default=None,
        description="Fecha inicial del rango (por defecto, hace 6 meses)",
    ),
    to_date: date = Query(
        default=None,
        description="Fecha final del rango (por defecto, hoy)",
    ),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital),
):
    """
    Devuelve la serie temporal mensual de registros / trials / activos.
    """
    today = date.today()
    if to_date is None:
        to_date = today
    if from_date is None:
        from_date = (to_date.replace(day=1) - timedelta(days=5 * 30)).replace(day=1)
    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="from_date cannot be greater than to_date",
        )

    puntos = admin_metrics_service.get_clients_timeseries(db, from_date, to_date)
    return ClientsTimeseriesResponse(from_date=from_date, to_date=to_date, puntos=puntos)


@router.get("/instances-by-plan", response_model=InstancesByPlanResponse)
def get_instances_by_plan(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital),
):
    """
    Devuelve la distribución de instancias por plan y estado.
    """
    items = admin_metrics_service.get_instances_by_plan(db)
    return InstancesByPlanResponse(items=items)

