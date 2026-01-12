"""
Módulo de Esquemas de Usuarios Synkro (Admins).

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los usuarios
administradores de la plataforma Synkro (admins, soporte, ventas).
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from decimal import Decimal
from datetime import datetime


class UsuarioSynkroBase(BaseModel):
    """
    Esquema Base para Usuarios Synkro.

    Contiene los campos comunes para la creación y visualización de usuarios admin.
    """
    nom_usuario: str = Field(..., description="Nombre del usuario admin")
    ape_usuario: str = Field(..., description="Apellido del usuario admin")
    email_usuario: EmailStr = Field(..., description="Email del usuario (único, para login)")
    rol_synkro: Literal["admin_synkro", "soporte", "ventas"] = Field(
        ..., 
        description="Rol del usuario admin"
    )
    ind_activo: Optional[bool] = Field(True, description="Si el usuario puede acceder al panel")
    
    class Config:
        from_attributes = True


class UsuarioSynkroCreate(UsuarioSynkroBase):
    """
    Esquema para la Creación de Usuarios Synkro.

    Incluye la contraseña que será hasheada antes de guardar.
    """
    password_usuario: str = Field(..., min_length=8, description="Contraseña del usuario (mínimo 8 caracteres)")


class UsuarioSynkroUpdate(BaseModel):
    """
    Esquema para la Actualización de Usuarios Synkro.

    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    nom_usuario: Optional[str] = Field(None, description="Nombre del usuario admin")
    ape_usuario: Optional[str] = Field(None, description="Apellido del usuario admin")
    email_usuario: Optional[EmailStr] = Field(None, description="Email del usuario")
    password_usuario: Optional[str] = Field(None, min_length=8, description="Nueva contraseña (si se quiere cambiar)")
    rol_synkro: Optional[Literal["admin_synkro", "soporte", "ventas"]] = Field(
        None, 
        description="Rol del usuario admin"
    )
    ind_activo: Optional[bool] = Field(None, description="Si el usuario puede acceder al panel")


class UsuarioSynkro(UsuarioSynkroBase):
    """
    Esquema para la Visualización de Usuarios Synkro (con datos sensibles).

    Incluye campos de auditoría. NO usar para respuestas públicas.
    """
    id_usuario: Decimal = Field(..., description="ID único del usuario admin")
    password_usuario: str = Field(..., description="Hash de la contraseña")
    fecha_ultimo_acceso: Optional[datetime] = Field(None, description="Fecha del último acceso")
    usr_insert: Optional[str] = Field(None, description="Usuario que creó el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creación")
    usr_update: Optional[str] = Field(None, description="Usuario que actualizó el registro")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización")


class UsuarioSynkroPublic(BaseModel):
    """
    Esquema público para información del usuario admin.
    
    NO incluye contraseñas ni información sensible.
    """
    id_usuario: Decimal = Field(..., description="ID único del usuario admin")
    nom_usuario: str = Field(..., description="Nombre del usuario admin")
    ape_usuario: str = Field(..., description="Apellido del usuario admin")
    email_usuario: str = Field(..., description="Email del usuario")
    rol_synkro: str = Field(..., description="Rol del usuario admin")
    ind_activo: bool = Field(True, description="Si el usuario puede acceder al panel")
    fecha_ultimo_acceso: Optional[datetime] = Field(None, description="Fecha del último acceso")
    
    class Config:
        from_attributes = True


class UsuarioSynkroInDB(UsuarioSynkro):
    """
    Esquema para el usuario tal como está en la base de datos.
    Usado internamente para verificación de credenciales.
    """
    pass
