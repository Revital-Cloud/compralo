"""
Esquemas de métricas para el dashboard admin.

Estos modelos agrupan información agregada de clientes, instancias,
suscripciones y facturación para alimentar el dashboard de Synkro.
"""
from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class RevenuePoint(BaseModel):
    """Punto de serie temporal de ingresos."""

    fecha: date = Field(..., description="Fecha del periodo (día o inicio de mes)")
    total: float = Field(..., description="Ingresos totales en el periodo")


class ClientsTimeseriesPoint(BaseModel):
    """Punto de serie temporal para el embudo de clientes."""

    periodo: date = Field(..., description="Mes (primer día del mes)")
    registros: int = Field(..., ge=0, description="Nuevos registros de clientes en el periodo")
    trials: int = Field(..., ge=0, description="Clientes en estado trial en el periodo")
    activos: int = Field(..., ge=0, description="Clientes activos en el periodo")


class InstancesByPlanItem(BaseModel):
    """Resumen de instancias por plan y estado."""

    id_plan: int = Field(..., description="ID del plan")
    nom_plan: str = Field(..., description="Nombre del plan")
    total_instancias: int = Field(..., ge=0, description="Total de instancias asociadas al plan")
    activas: int = Field(..., ge=0, description="Instancias activas")
    suspendidas: int = Field(..., ge=0, description="Instancias suspendidas")
    eliminadas: int = Field(..., ge=0, description="Instancias eliminadas")
    error: int = Field(..., ge=0, description="Instancias en estado de error")


class AdminOverviewMetrics(BaseModel):
    """
    Métricas generales para el dashboard admin.

    Pensado para cargarse en un único request rápido
    que alimente las tarjetas principales.
    """

    total_clientes: int = Field(..., ge=0, description="Total de clientes registrados")
    total_instancias: int = Field(..., ge=0, description="Total de instancias de e-commerce")

    instancias_por_estado: Dict[str, int] = Field(
        default_factory=dict,
        description="Distribución de instancias por estado",
    )
    instancias_por_region: Dict[str, int] = Field(
        default_factory=dict,
        description="Distribución de instancias por región de deployment",
    )

    mrr_actual: float = Field(..., ge=0, description="MRR aproximado basado en suscripciones activas")
    ingresos_ultimos_30_dias: float = Field(
        ..., ge=0, description="Ingresos de facturación en los últimos 30 días"
    )
    ingresos_por_plan: Dict[str, float] = Field(
        default_factory=dict,
        description="MRR aproximado por plan (clave = nombre del plan)",
    )

    funnel_ultimos_6_meses: List[ClientsTimeseriesPoint] = Field(
        default_factory=list,
        description="Evolución mensual de registros / trials / activos (6 meses)",
    )


class RevenueTimeseriesResponse(BaseModel):
    """Respuesta para la serie temporal de ingresos."""

    from_date: date = Field(..., description="Fecha inicial del rango")
    to_date: date = Field(..., description="Fecha final del rango")
    puntos: List[RevenuePoint] = Field(default_factory=list, description="Puntos de la serie")


class ClientsTimeseriesResponse(BaseModel):
    """Respuesta para la serie temporal de clientes."""

    from_date: date = Field(..., description="Fecha inicial del rango")
    to_date: date = Field(..., description="Fecha final del rango")
    puntos: List[ClientsTimeseriesPoint] = Field(
        default_factory=list, description="Puntos de la serie por mes"
    )


class InstancesByPlanResponse(BaseModel):
    """Respuesta para la distribución de instancias por plan."""

    items: List[InstancesByPlanItem] = Field(
        default_factory=list,
        description="Lista de planes con métricas de instancias",
    )

