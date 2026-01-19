"""
Modulo de Esquemas de Deployments.

Define los modelos Pydantic utilizados para la validacion de datos
en las solicitudes y respuestas de la API relacionadas con los deployments
de instancias.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from decimal import Decimal
from datetime import datetime


class DeploymentBase(BaseModel):
    """Esquema Base para Deployments."""
    id_instancia: Decimal = Field(..., description="ID de la instancia")
    version_deploy: str = Field(..., description="Version del deployment")
    tipo_deploy: Optional[Literal["manual", "automatico", "rollback", "hotfix"]] = Field(
        "manual", 
        description="Tipo de deployment"
    )
    ambiente: Optional[Literal["desarrollo", "staging", "produccion"]] = Field(
        "produccion", 
        description="Ambiente de deployment"
    )
    iniciado_por: Optional[str] = Field(None, description="Email del usuario que inicio el deployment")
    
    class Config:
        from_attributes = True


class DeploymentCreate(DeploymentBase):
    """Esquema para la Creacion de Deployments."""
    estado_deploy: Optional[Literal["iniciado", "en_proceso", "completado", "fallido", "cancelado"]] = Field(
        "iniciado", 
        description="Estado del deployment"
    )


class DeploymentUpdate(BaseModel):
    """Esquema para la Actualizacion de Deployments."""
    estado_deploy: Optional[Literal["iniciado", "en_proceso", "completado", "fallido", "cancelado"]] = Field(
        None, 
        description="Estado del deployment"
    )
    logs_deploy: Optional[str] = Field(None, description="Logs del deployment")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de finalizacion")
    duracion_segundos: Optional[int] = Field(None, ge=0, description="Duracion en segundos")


class Deployment(DeploymentBase):
    """Esquema para la Visualizacion de Deployments."""
    id_deployment: Decimal = Field(..., description="ID unico del deployment")
    estado_deploy: str = Field(..., description="Estado del deployment")
    logs_deploy: Optional[str] = Field(None, description="Logs del deployment")
    fecha_inicio: datetime = Field(..., description="Fecha de inicio")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de finalizacion")
    duracion_segundos: Optional[int] = Field(None, description="Duracion en segundos")
    usr_insert: Optional[str] = Field(None, description="Usuario que creo el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creacion")
    usr_update: Optional[str] = Field(None, description="Usuario que actualizo el registro")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualizacion")


class DeploymentPublic(BaseModel):
    """Esquema publico para informacion del deployment."""
    id_deployment: Decimal = Field(..., description="ID unico del deployment")
    id_instancia: Decimal = Field(..., description="ID de la instancia")
    version_deploy: str = Field(..., description="Version del deployment")
    tipo_deploy: str = Field(..., description="Tipo de deployment")
    estado_deploy: str = Field(..., description="Estado del deployment")
    ambiente: str = Field(..., description="Ambiente de deployment")
    fecha_inicio: datetime = Field(..., description="Fecha de inicio")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de finalizacion")
    duracion_segundos: Optional[int] = Field(None, description="Duracion en segundos")
    iniciado_por: Optional[str] = Field(None, description="Usuario que inicio el deployment")
    
    class Config:
        from_attributes = True
