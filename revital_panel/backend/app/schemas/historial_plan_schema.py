"""
Modulo de Esquemas de Historial de Planes.

Define los modelos Pydantic utilizados para la validacion de datos
en las solicitudes y respuestas de la API relacionadas con el historial
de cambios de plan en suscripciones.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from decimal import Decimal
from datetime import datetime


class HistorialPlanBase(BaseModel):
    """Esquema Base para Historial de Planes."""
    id_suscripcion: Decimal = Field(..., description="ID de la suscripcion")
    id_plan_anterior: Optional[Decimal] = Field(None, description="ID del plan anterior (NULL si es primera suscripcion)")
    id_plan_nuevo: Decimal = Field(..., description="ID del plan nuevo")
    precio_anterior: Optional[Decimal] = Field(None, gt=0, description="Precio del plan anterior")
    precio_nuevo: Decimal = Field(..., gt=0, description="Precio del plan nuevo")
    tipo_cambio: Literal["upgrade", "downgrade", "inicial", "renovacion"] = Field(
        ..., 
        description="Tipo de cambio"
    )
    fecha_efectiva: datetime = Field(..., description="Fecha desde cuando aplica el cambio")
    motivo_cambio: Optional[str] = Field(None, description="Razon del cambio")
    usuario_email: Optional[str] = Field(None, description="Email del usuario que realizo el cambio")
    
    class Config:
        from_attributes = True


class HistorialPlanCreate(HistorialPlanBase):
    """Esquema para la Creacion de Historial de Planes."""
    pass


class HistorialPlan(HistorialPlanBase):
    """Esquema para la Visualizacion de Historial de Planes."""
    id_historial: Decimal = Field(..., description="ID unico del registro")
    fecha_cambio: datetime = Field(..., description="Fecha del cambio")
    diferencia_precio: Decimal = Field(..., description="Diferencia de precio")
    porcentaje_cambio: Optional[Decimal] = Field(None, description="Porcentaje de cambio")
    usr_insert: Optional[str] = Field(None, description="Usuario que creo el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creacion")


class HistorialPlanPublic(BaseModel):
    """Esquema publico para informacion del historial de planes."""
    id_historial: Decimal = Field(..., description="ID unico del registro")
    id_suscripcion: Decimal = Field(..., description="ID de la suscripcion")
    id_plan_anterior: Optional[Decimal] = Field(None, description="ID del plan anterior")
    id_plan_nuevo: Decimal = Field(..., description="ID del plan nuevo")
    precio_anterior: Optional[Decimal] = Field(None, description="Precio del plan anterior")
    precio_nuevo: Decimal = Field(..., description="Precio del plan nuevo")
    tipo_cambio: str = Field(..., description="Tipo de cambio")
    fecha_cambio: datetime = Field(..., description="Fecha del cambio")
    fecha_efectiva: datetime = Field(..., description="Fecha efectiva")
    diferencia_precio: Decimal = Field(..., description="Diferencia de precio")
    porcentaje_cambio: Optional[Decimal] = Field(None, description="Porcentaje de cambio")
    motivo_cambio: Optional[str] = Field(None, description="Motivo del cambio")
    usuario_email: Optional[str] = Field(None, description="Usuario que realizo el cambio")
    
    class Config:
        from_attributes = True
