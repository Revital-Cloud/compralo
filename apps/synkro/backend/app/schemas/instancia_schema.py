"""
Modulo de Esquemas de Instancias.

Define los modelos Pydantic utilizados para la validacion de datos
en las solicitudes y respuestas de la API relacionadas con las instancias
de e-commerce de los clientes.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from decimal import Decimal
from datetime import datetime


class InstanciaBase(BaseModel):
    """Esquema Base para Instancias."""
    identificacion_fiscal_cliente: str = Field(..., description="Identificacion fiscal del cliente")
    nom_instancia: str = Field(..., description="Nombre de la instancia")
    slug_instancia: str = Field(..., pattern=r'^[a-z0-9-]+$', description="Identificador unico para URLs (solo letras minusculas, numeros y guiones)")
    subdominio: Optional[str] = Field(None, description="Subdominio de la instancia (ej: empresa-abc.synkro.com)")
    dominio_personalizado: Optional[str] = Field(None, description="Dominio personalizado (ej: tienda.empresa-abc.com)")
    version_instancia: Optional[str] = Field("1.0.0", pattern=r'^\d+\.\d+\.\d+', description="Version de la instancia (formato semantico X.Y.Z)")
    db_nombre: str = Field(..., description="Nombre de la base de datos PostgreSQL")
    db_host: Optional[str] = Field(None, description="Host de la base de datos")
    db_puerto: Optional[int] = Field(5432, description="Puerto de la base de datos")
    db_usuario: Optional[str] = Field(None, description="Usuario de la base de datos")
    backend_url: Optional[str] = Field(None, description="URL del backend de la instancia")
    frontend_url: Optional[str] = Field(None, description="URL del frontend de la instancia")
    region_deployment: Optional[Literal["us-east-1", "us-west-2", "sa-east-1", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1", "custom"]] = Field(
        "us-east-1", 
        description="Region de deployment"
    )
    config_json: Optional[Dict[str, Any]] = Field(None, description="Configuracion adicional en formato JSON")
    
    class Config:
        from_attributes = True


class InstanciaCreate(InstanciaBase):
    """Esquema para la Creacion de Instancias."""
    estado_instancia: Optional[Literal["creando", "activa", "suspendida", "eliminada", "error"]] = Field(
        "creando", 
        description="Estado de la instancia"
    )


class InstanciaUpdate(BaseModel):
    """Esquema para la Actualizacion de Instancias."""
    nom_instancia: Optional[str] = Field(None, description="Nombre de la instancia")
    subdominio: Optional[str] = Field(None, description="Subdominio de la instancia")
    dominio_personalizado: Optional[str] = Field(None, description="Dominio personalizado")
    estado_instancia: Optional[Literal["creando", "activa", "suspendida", "eliminada", "error"]] = Field(
        None, 
        description="Estado de la instancia"
    )
    version_instancia: Optional[str] = Field(None, pattern=r'^\d+\.\d+\.\d+', description="Version de la instancia")
    db_host: Optional[str] = Field(None, description="Host de la base de datos")
    db_puerto: Optional[int] = Field(None, description="Puerto de la base de datos")
    db_usuario: Optional[str] = Field(None, description="Usuario de la base de datos")
    backend_url: Optional[str] = Field(None, description="URL del backend")
    frontend_url: Optional[str] = Field(None, description="URL del frontend")
    region_deployment: Optional[Literal["us-east-1", "us-west-2", "sa-east-1", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1", "custom"]] = Field(
        None, 
        description="Region de deployment"
    )
    config_json: Optional[Dict[str, Any]] = Field(None, description="Configuracion adicional")


class Instancia(InstanciaBase):
    """Esquema para la Visualizacion de Instancias."""
    id_instancia: Decimal = Field(..., description="ID unico de la instancia")
    estado_instancia: str = Field(..., description="Estado de la instancia")
    fecha_activacion: Optional[datetime] = Field(None, description="Fecha de activacion")
    fecha_ultimo_deploy: Optional[datetime] = Field(None, description="Fecha del ultimo deployment")
    usr_insert: Optional[str] = Field(None, description="Usuario que creo el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creacion")
    usr_update: Optional[str] = Field(None, description="Usuario que actualizo el registro")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualizacion")


class InstanciaPublic(BaseModel):
    """Esquema publico para informacion de la instancia."""
    id_instancia: Decimal = Field(..., description="ID unico de la instancia")
    identificacion_fiscal_cliente: str = Field(..., description="Identificacion fiscal del cliente")
    nom_instancia: str = Field(..., description="Nombre de la instancia")
    slug_instancia: str = Field(..., description="Identificador unico para URLs")
    subdominio: Optional[str] = Field(None, description="Subdominio de la instancia")
    dominio_personalizado: Optional[str] = Field(None, description="Dominio personalizado")
    estado_instancia: str = Field(..., description="Estado de la instancia")
    version_instancia: str = Field(..., description="Version de la instancia")
    backend_url: Optional[str] = Field(None, description="URL del backend")
    frontend_url: Optional[str] = Field(None, description="URL del frontend")
    region_deployment: Optional[str] = Field(None, description="Region de deployment")
    fecha_activacion: Optional[datetime] = Field(None, description="Fecha de activacion")
    fecha_ultimo_deploy: Optional[datetime] = Field(None, description="Fecha del ultimo deployment")
    
    class Config:
        from_attributes = True
