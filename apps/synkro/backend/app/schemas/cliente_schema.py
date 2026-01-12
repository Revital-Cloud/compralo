"""
Módulo de Esquemas de Clientes.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los clientes
(empresas que contratan el servicio SaaS).
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from datetime import datetime


class ClienteBase(BaseModel):
    """
    Esquema Base para Clientes.

    Contiene los campos comunes para la creación y visualización de clientes.
    """
    identificacion_fiscal: str = Field(..., description="Identificación fiscal única (NIT, EIN, etc.)")
    tipo_identificacion: Optional[Literal["NIT", "EIN", "RFC", "CUIT", "RUT", "NIF", "CIF", "CNPJ", "RUC", "OTRO"]] = Field(
        "NIT", 
        description="Tipo de identificación fiscal"
    )
    nom_empresa: str = Field(..., description="Nombre de la empresa")
    email_contacto: EmailStr = Field(..., description="Email de contacto de la empresa")
    telefono_contacto: Optional[str] = Field(None, description="Teléfono de contacto")
    direccion_empresa: Optional[str] = Field(None, description="Dirección de la empresa")
    ciudad: Optional[str] = Field(None, description="Ciudad")
    pais: Optional[Literal["CO", "US", "MX", "AR", "CL", "PE", "EC", "PA", "UY", "BR", "ES", "OTRO"]] = Field(
        "CO", 
        description="País"
    )
    nom_contacto_principal: str = Field(..., description="Nombre del contacto principal")
    email_contacto_principal: EmailStr = Field(..., description="Email del contacto principal (para login)")
    telefono_contacto_principal: Optional[str] = Field(None, description="Teléfono del contacto principal")
    estado_cliente: Optional[Literal["prospecto", "activo", "suspendido", "cancelado", "trial"]] = Field(
        "prospecto", 
        description="Estado del cliente"
    )
    notas_internas: Optional[str] = Field(None, description="Notas internas (solo visible para admins)")
    
    class Config:
        from_attributes = True


class ClienteCreate(ClienteBase):
    """
    Esquema para la Creación de Clientes.

    Incluye la contraseña que será hasheada antes de guardar.
    """
    password_cliente: Optional[str] = Field(
        None, 
        min_length=8, 
        description="Contraseña del cliente (opcional para prospectos, mínimo 8 caracteres)"
    )
    ind_activo: Optional[bool] = Field(True, description="Si el cliente puede acceder al panel")


class ClienteUpdate(BaseModel):
    """
    Esquema para la Actualización de Clientes.

    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    tipo_identificacion: Optional[Literal["NIT", "EIN", "RFC", "CUIT", "RUT", "NIF", "CIF", "CNPJ", "RUC", "OTRO"]] = Field(
        None, 
        description="Tipo de identificación fiscal"
    )
    nom_empresa: Optional[str] = Field(None, description="Nombre de la empresa")
    email_contacto: Optional[EmailStr] = Field(None, description="Email de contacto de la empresa")
    telefono_contacto: Optional[str] = Field(None, description="Teléfono de contacto")
    direccion_empresa: Optional[str] = Field(None, description="Dirección de la empresa")
    ciudad: Optional[str] = Field(None, description="Ciudad")
    pais: Optional[Literal["CO", "US", "MX", "AR", "CL", "PE", "EC", "PA", "UY", "BR", "ES", "OTRO"]] = Field(
        None, 
        description="País"
    )
    nom_contacto_principal: Optional[str] = Field(None, description="Nombre del contacto principal")
    email_contacto_principal: Optional[EmailStr] = Field(None, description="Email del contacto principal")
    telefono_contacto_principal: Optional[str] = Field(None, description="Teléfono del contacto principal")
    estado_cliente: Optional[Literal["prospecto", "activo", "suspendido", "cancelado", "trial"]] = Field(
        None, 
        description="Estado del cliente"
    )
    notas_internas: Optional[str] = Field(None, description="Notas internas")
    password_cliente: Optional[str] = Field(
        None, 
        min_length=8, 
        description="Nueva contraseña (si se quiere cambiar)"
    )
    ind_activo: Optional[bool] = Field(None, description="Si el cliente puede acceder al panel")


class Cliente(ClienteBase):
    """
    Esquema para la Visualización de Clientes (con datos sensibles).

    Incluye campos de auditoría. NO usar para respuestas públicas.
    """
    password_cliente: Optional[str] = Field(None, description="Hash de la contraseña")
    ind_activo: bool = Field(True, description="Si el cliente puede acceder al panel")
    fecha_activacion: Optional[datetime] = Field(None, description="Fecha de activación")
    fecha_ultimo_acceso: Optional[datetime] = Field(None, description="Fecha del último acceso")
    usr_insert: Optional[str] = Field(None, description="Usuario que creó el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creación")
    usr_update: Optional[str] = Field(None, description="Usuario que actualizó el registro")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización")


class ClientePublic(BaseModel):
    """
    Esquema público para información del cliente.
    
    NO incluye contraseñas, notas internas ni información sensible.
    """
    identificacion_fiscal: str = Field(..., description="Identificación fiscal única")
    tipo_identificacion: str = Field(..., description="Tipo de identificación fiscal")
    nom_empresa: str = Field(..., description="Nombre de la empresa")
    email_contacto: str = Field(..., description="Email de contacto de la empresa")
    telefono_contacto: Optional[str] = Field(None, description="Teléfono de contacto")
    direccion_empresa: Optional[str] = Field(None, description="Dirección de la empresa")
    ciudad: Optional[str] = Field(None, description="Ciudad")
    pais: str = Field(..., description="País")
    nom_contacto_principal: str = Field(..., description="Nombre del contacto principal")
    email_contacto_principal: str = Field(..., description="Email del contacto principal")
    telefono_contacto_principal: Optional[str] = Field(None, description="Teléfono del contacto principal")
    estado_cliente: str = Field(..., description="Estado del cliente")
    ind_activo: bool = Field(True, description="Si el cliente puede acceder al panel")
    fecha_activacion: Optional[datetime] = Field(None, description="Fecha de activación")
    fecha_ultimo_acceso: Optional[datetime] = Field(None, description="Fecha del último acceso")
    
    class Config:
        from_attributes = True


class ClienteInDB(Cliente):
    """
    Esquema para el cliente tal como está en la base de datos.
    Usado internamente para verificación de credenciales.
    """
    pass
