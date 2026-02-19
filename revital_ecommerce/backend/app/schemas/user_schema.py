"""
Módulo de Esquemas de Usuarios.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los usuarios.
Incluye esquemas para la creación, actualización y visualización de usuarios,
así como un esquema para mensajes de respuesta genéricos.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
import re

# Caracteres permitidos en nombre/apellido: letras (incl. acentuadas), espacios, guión, apóstrofe.
# Evita guardar cadenas que parezcan SQL o que faciliten XSS (sin < > " ` etc.).
NAME_PATTERN = re.compile(r"^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-'.]+$")
NAME_MAX_LENGTH = 150


def _validate_name(value: Optional[str], field_name: str) -> Optional[str]:
    if value is None or value == "":
        return value
    value = value.strip()
    if len(value) > NAME_MAX_LENGTH:
        raise ValueError(f"{field_name} no puede superar {NAME_MAX_LENGTH} caracteres")
    if not NAME_PATTERN.match(value):
        raise ValueError(
            f"{field_name} solo puede contener letras, espacios, guión o apóstrofe"
        )
    return value


class UserBase(BaseModel):
    """
    Esquema Base para Usuarios.

    Contiene los campos comunes para la creación y visualización de usuarios.
    Utilizado como base para otros esquemas de usuarios más específicos.

    Atributos:
        id_usuario (Decimal): Identificador único para el usuario.
        nom_usuario (str): Nombre del usuario.
        ape_usuario (str): Apellido del usuario.
        email_usuario (str): Email del usuario.
        password_usuario (str): Contraseña del usuario.
        id_rol (Decimal): Identificador del rol del usuario.
        ind_genero (bool): Género del usuario.
        cel_usuario (str): Número de celular del usuario.
        fec_nacimiento (str): Fecha de nacimiento del usuario.
    """
    id_usuario: Decimal = Field(..., description="Identificador único para el usuario.")
    nom_usuario: str = Field(..., min_length=1, max_length=NAME_MAX_LENGTH, description="Nombre del usuario.")
    ape_usuario: str = Field(..., min_length=1, max_length=NAME_MAX_LENGTH, description="Apellido del usuario.")
    email_usuario: str = Field(..., description="Email del usuario.")
    password_usuario: str = Field(..., description="Contraseña del usuario.")
    id_rol: Optional[Decimal] = Field(None, description="Identificador del rol del usuario.")
    ind_genero: bool = Field(..., description="Género del usuario.")
    cel_usuario: str = Field(..., description="Número de celular del usuario.")
    fec_nacimiento: Optional[str] = Field(None, description="Fecha de nacimiento del usuario.")
    ind_activo: Optional[bool] = Field(None, description="Indica si el usuario está activo.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    
    class Config:
        from_attributes = True
        
class UserCreate(UserBase):
    """
    Esquema para la Creación de Usuarios.

    Hereda de `UserBase` y se utiliza para validar los datos
    al crear un nuevo usuario. Nombre y apellido se validan para
    permitir solo caracteres seguros (letras, espacios, guión, apóstrofe).
    Las consultas a BD usan parámetros, por lo que no hay riesgo de SQL injection.
    """

    @field_validator("nom_usuario", "ape_usuario", mode="before")
    @classmethod
    def validate_name_fields(cls, v: Optional[str], info) -> Optional[str]:
        if v is None:
            return v
        name = "Nombre" if info.field_name == "nom_usuario" else "Apellido"
        return _validate_name(v, name)

class UserUpdate(BaseModel):
    """
    Esquema para la Actualización de Usuarios.

    Define los campos que pueden ser actualizados para un usuario existente.
    Todos los campos son opcionales. Nombre y apellido aceptan solo caracteres seguros.
    """
    nom_usuario: Optional[str] = Field(None, max_length=NAME_MAX_LENGTH, description="Nombre del usuario.")
    ape_usuario: Optional[str] = Field(None, max_length=NAME_MAX_LENGTH, description="Apellido del usuario.")
    email_usuario: Optional[str] = Field(None, description="Email del usuario.")
    password_usuario: Optional[str] = Field(None, description="Contraseña del usuario.")
    ind_genero: Optional[bool] = Field(None, description="Género del usuario.")
    cel_usuario: Optional[str] = Field(None, description="Número de celular del usuario.")
    fec_nacimiento: Optional[str] = Field(None, description="Fecha de nacimiento del usuario.")
    ind_activo: Optional[bool] = Field(None, description="Indica si el usuario está activo.")
    avatar_seed: Optional[str] = Field(None, description="Seed personalizado para el avatar Facehash.")
    avatar_colors: Optional[str] = Field(None, description="Colores hex separados por coma para Facehash.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")

    @field_validator("nom_usuario", "ape_usuario", mode="before")
    @classmethod
    def validate_name_fields(cls, v: Optional[str], info) -> Optional[str]:
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return v
        name = "Nombre" if info.field_name == "nom_usuario" else "Apellido"
        return _validate_name(v, name)

class User(UserBase):
    """
    Esquema para la Visualización de Usuarios.

    Hereda de `UserBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de usuarios.
    Incluye el `id_usuario` y los campos de auditoría.
    """
    id_usuario: Decimal
    fec_nacimiento: Optional[datetime] = Field(None, description="Fecha de nacimiento del usuario.")

class UserPublic(BaseModel):
    """
    Esquema público para información del usuario actual.
    
    Solo incluye información segura y necesaria para el frontend.
    NO incluye contraseñas, información personal sensible o datos de auditoría.
    """
    id_usuario: Decimal = Field(..., description="Identificador único para el usuario.")
    nom_usuario: str = Field(..., description="Nombre del usuario.")
    ape_usuario: str = Field(..., description="Apellido del usuario.")
    email_usuario: str = Field(..., description="Email del usuario.")
    id_rol: Optional[Decimal] = Field(None, description="Identificador del rol del usuario.")
    cel_usuario: Optional[str] = Field(None, description="Número de celular del usuario.")
    fec_nacimiento: Optional[str] = Field(None, description="Fecha de nacimiento del usuario.")
    des_direccion: Optional[str] = Field(None, description="Dirección del usuario.")
    avatar_seed: Optional[str] = Field(None, description="Seed personalizado para el avatar Facehash.")
    avatar_colors: Optional[str] = Field(None, description="Colores hex separados por coma para Facehash.")
    
    class Config:
        from_attributes = True
    
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str

