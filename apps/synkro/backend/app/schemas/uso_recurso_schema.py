"""
Modulo de Esquemas de Uso de Recursos.

Define los modelos Pydantic utilizados para la validacion de datos
en las solicitudes y respuestas de la API relacionadas con el tracking
de uso de recursos por instancia.
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime


class UsoRecursoBase(BaseModel):
    """Esquema Base para Uso de Recursos."""
    id_instancia: Decimal = Field(..., description="ID de la instancia")
    id_suscripcion: Decimal = Field(..., description="ID de la suscripcion")
    productos_actuales: int = Field(0, ge=0, description="Cantidad de productos actuales")
    usuarios_actuales: int = Field(0, ge=0, description="Cantidad de usuarios actuales")
    almacenamiento_actual_gb: Decimal = Field(0, ge=0, description="Almacenamiento actual en GB")
    max_productos: Optional[int] = Field(None, description="Limite de productos del plan (NULL = ilimitado)")
    max_usuarios: Optional[int] = Field(None, description="Limite de usuarios del plan (NULL = ilimitado)")
    max_almacenamiento_gb: Optional[int] = Field(None, description="Limite de almacenamiento del plan (NULL = ilimitado)")
    
    class Config:
        from_attributes = True


class UsoRecursoCreate(UsoRecursoBase):
    """Esquema para la Creacion de Uso de Recursos."""
    pass


class UsoRecurso(UsoRecursoBase):
    """Esquema para la Visualizacion de Uso de Recursos."""
    id_uso_recurso: Decimal = Field(..., description="ID unico del registro")
    fecha_medicion: datetime = Field(..., description="Fecha de la medicion")
    porcentaje_uso_productos: Optional[Decimal] = Field(None, description="Porcentaje de uso de productos")
    porcentaje_uso_usuarios: Optional[Decimal] = Field(None, description="Porcentaje de uso de usuarios")
    porcentaje_uso_almacenamiento: Optional[Decimal] = Field(None, description="Porcentaje de uso de almacenamiento")
    ind_alerta_productos: bool = Field(False, description="Si hay alerta de productos (>80%)")
    ind_alerta_usuarios: bool = Field(False, description="Si hay alerta de usuarios (>80%)")
    ind_alerta_almacenamiento: bool = Field(False, description="Si hay alerta de almacenamiento (>80%)")
    usr_insert: Optional[str] = Field(None, description="Usuario que creo el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creacion")


class UsoRecursoPublic(BaseModel):
    """Esquema publico para informacion de uso de recursos."""
    id_uso_recurso: Decimal = Field(..., description="ID unico del registro")
    id_instancia: Decimal = Field(..., description="ID de la instancia")
    id_suscripcion: Decimal = Field(..., description="ID de la suscripcion")
    fecha_medicion: datetime = Field(..., description="Fecha de la medicion")
    productos_actuales: int = Field(..., description="Cantidad de productos actuales")
    usuarios_actuales: int = Field(..., description="Cantidad de usuarios actuales")
    almacenamiento_actual_gb: Decimal = Field(..., description="Almacenamiento actual en GB")
    max_productos: Optional[int] = Field(None, description="Limite de productos")
    max_usuarios: Optional[int] = Field(None, description="Limite de usuarios")
    max_almacenamiento_gb: Optional[int] = Field(None, description="Limite de almacenamiento")
    porcentaje_uso_productos: Optional[Decimal] = Field(None, description="Porcentaje de uso de productos")
    porcentaje_uso_usuarios: Optional[Decimal] = Field(None, description="Porcentaje de uso de usuarios")
    porcentaje_uso_almacenamiento: Optional[Decimal] = Field(None, description="Porcentaje de uso de almacenamiento")
    ind_alerta_productos: bool = Field(..., description="Alerta de productos")
    ind_alerta_usuarios: bool = Field(..., description="Alerta de usuarios")
    ind_alerta_almacenamiento: bool = Field(..., description="Alerta de almacenamiento")
    
    class Config:
        from_attributes = True
