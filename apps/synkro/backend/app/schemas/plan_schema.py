"""
Modulo de Esquemas de Planes.

Define los modelos Pydantic utilizados para la validacion de datos
en las solicitudes y respuestas de la API relacionadas con los planes
de suscripcion del SaaS.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from decimal import Decimal
from datetime import datetime


class PlanBase(BaseModel):
    """Esquema Base para Planes."""
    nom_plan: str = Field(..., description="Nombre del plan")
    desc_plan: Optional[str] = Field(None, description="Descripcion del plan")
    precio_mensual: Decimal = Field(..., gt=0, description="Precio mensual del plan")
    precio_anual: Optional[Decimal] = Field(None, gt=0, description="Precio anual del plan")
    moneda: Optional[Literal["USD", "COP", "EUR", "MXN", "BRL", "ARS", "CLP", "PEN", "UYU", "DOP", "CRC", "GTQ", "PAB", "VES", "GBP", "CAD", "OTRA"]] = Field(
        "USD", 
        description="Moneda del plan"
    )
    max_productos: Optional[int] = Field(None, ge=0, description="Maximo de productos (NULL = ilimitado)")
    max_usuarios: Optional[int] = Field(None, ge=0, description="Maximo de usuarios (NULL = ilimitado)")
    max_almacenamiento_gb: Optional[int] = Field(None, ge=0, description="Maximo de almacenamiento en GB (NULL = ilimitado)")
    features_json: Optional[Dict[str, Any]] = Field(None, description="Caracteristicas del plan en formato JSON")
    estado_plan: Optional[Literal["activo", "inactivo", "deprecado"]] = Field(
        "activo", 
        description="Estado del plan"
    )
    
    class Config:
        from_attributes = True


class PlanCreate(PlanBase):
    """Esquema para la Creacion de Planes."""
    pass


class PlanUpdate(BaseModel):
    """Esquema para la Actualizacion de Planes."""
    nom_plan: Optional[str] = Field(None, description="Nombre del plan")
    desc_plan: Optional[str] = Field(None, description="Descripcion del plan")
    precio_mensual: Optional[Decimal] = Field(None, gt=0, description="Precio mensual del plan")
    precio_anual: Optional[Decimal] = Field(None, gt=0, description="Precio anual del plan")
    moneda: Optional[Literal["USD", "COP", "EUR", "MXN", "BRL", "ARS", "CLP", "PEN", "UYU", "DOP", "CRC", "GTQ", "PAB", "VES", "GBP", "CAD", "OTRA"]] = Field(
        None, 
        description="Moneda del plan"
    )
    max_productos: Optional[int] = Field(None, ge=0, description="Maximo de productos")
    max_usuarios: Optional[int] = Field(None, ge=0, description="Maximo de usuarios")
    max_almacenamiento_gb: Optional[int] = Field(None, ge=0, description="Maximo de almacenamiento en GB")
    features_json: Optional[Dict[str, Any]] = Field(None, description="Caracteristicas del plan")
    estado_plan: Optional[Literal["activo", "inactivo", "deprecado"]] = Field(None, description="Estado del plan")


class Plan(PlanBase):
    """Esquema para la Visualizacion de Planes."""
    id_plan: Decimal = Field(..., description="ID unico del plan")
    usr_insert: Optional[str] = Field(None, description="Usuario que creo el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creacion")
    usr_update: Optional[str] = Field(None, description="Usuario que actualizo el registro")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualizacion")


class PlanPublic(BaseModel):
    """Esquema publico para informacion del plan."""
    id_plan: Decimal = Field(..., description="ID unico del plan")
    nom_plan: str = Field(..., description="Nombre del plan")
    desc_plan: Optional[str] = Field(None, description="Descripcion del plan")
    precio_mensual: Decimal = Field(..., description="Precio mensual del plan")
    precio_anual: Optional[Decimal] = Field(None, description="Precio anual del plan")
    moneda: str = Field(..., description="Moneda del plan")
    max_productos: Optional[int] = Field(None, description="Maximo de productos")
    max_usuarios: Optional[int] = Field(None, description="Maximo de usuarios")
    max_almacenamiento_gb: Optional[int] = Field(None, description="Maximo de almacenamiento en GB")
    features_json: Optional[Dict[str, Any]] = Field(None, description="Caracteristicas del plan")
    estado_plan: str = Field(..., description="Estado del plan")
    
    class Config:
        from_attributes = True
