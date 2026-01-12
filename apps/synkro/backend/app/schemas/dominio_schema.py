"""
Modulo de Esquemas de Dominios.

Define los modelos Pydantic utilizados para la validacion de datos
en las solicitudes y respuestas de la API relacionadas con los dominios
asociados a instancias.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from decimal import Decimal
from datetime import datetime


class DominioBase(BaseModel):
    """Esquema Base para Dominios."""
    id_instancia: Decimal = Field(..., description="ID de la instancia")
    nom_dominio: str = Field(..., description="Nombre del dominio")
    tipo_dominio: Optional[Literal["subdominio", "personalizado", "wildcard"]] = Field(
        "subdominio", 
        description="Tipo de dominio"
    )
    ssl_habilitado: Optional[bool] = Field(False, description="Si SSL esta habilitado")
    
    class Config:
        from_attributes = True


class DominioCreate(DominioBase):
    """Esquema para la Creacion de Dominios."""
    estado_dominio: Optional[Literal["pendiente", "activo", "error", "desactivado"]] = Field(
        "pendiente", 
        description="Estado del dominio"
    )


class DominioUpdate(BaseModel):
    """Esquema para la Actualizacion de Dominios."""
    nom_dominio: Optional[str] = Field(None, description="Nombre del dominio")
    tipo_dominio: Optional[Literal["subdominio", "personalizado", "wildcard"]] = Field(
        None, 
        description="Tipo de dominio"
    )
    estado_dominio: Optional[Literal["pendiente", "activo", "error", "desactivado"]] = Field(
        None, 
        description="Estado del dominio"
    )
    ssl_habilitado: Optional[bool] = Field(None, description="Si SSL esta habilitado")
    fecha_ssl_emision: Optional[datetime] = Field(None, description="Fecha de emision del SSL")
    fecha_ssl_vencimiento: Optional[datetime] = Field(None, description="Fecha de vencimiento del SSL")


class Dominio(DominioBase):
    """Esquema para la Visualizacion de Dominios."""
    id_dominio: Decimal = Field(..., description="ID unico del dominio")
    estado_dominio: str = Field(..., description="Estado del dominio")
    fecha_ssl_emision: Optional[datetime] = Field(None, description="Fecha de emision del SSL")
    fecha_ssl_vencimiento: Optional[datetime] = Field(None, description="Fecha de vencimiento del SSL")
    usr_insert: Optional[str] = Field(None, description="Usuario que creo el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creacion")
    usr_update: Optional[str] = Field(None, description="Usuario que actualizo el registro")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualizacion")


class DominioPublic(BaseModel):
    """Esquema publico para informacion del dominio."""
    id_dominio: Decimal = Field(..., description="ID unico del dominio")
    id_instancia: Decimal = Field(..., description="ID de la instancia")
    nom_dominio: str = Field(..., description="Nombre del dominio")
    tipo_dominio: str = Field(..., description="Tipo de dominio")
    estado_dominio: str = Field(..., description="Estado del dominio")
    ssl_habilitado: bool = Field(..., description="Si SSL esta habilitado")
    fecha_ssl_emision: Optional[datetime] = Field(None, description="Fecha de emision del SSL")
    fecha_ssl_vencimiento: Optional[datetime] = Field(None, description="Fecha de vencimiento del SSL")
    
    class Config:
        from_attributes = True
