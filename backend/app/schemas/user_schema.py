"""
Módulo de Esquemas de Usuarios.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los usuarios.
Incluye esquemas para la creación, actualización y visualización de usuarios,
así como un esquema para mensajes de respuesta genéricos.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime

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
        des_direccion (str): Dirección del usuario.
        id_rol (Decimal): Identificador del rol del usuario.
        ind_genero (bool): Género del usuario.
        cel_usuario (str): Número de celular del usuario.
        fec_nacimiento (str): Fecha de nacimiento del usuario.
    """
    id_usuario: Decimal = Field(..., description="Identificador único para el usuario.")
    nom_usuario: str = Field(..., description="Nombre del usuario.")
    ape_usuario: str = Field(..., description="Apellido del usuario.")
    email_usuario: str = Field(..., description="Email del usuario.")
    password_usuario: str = Field(..., description="Contraseña del usuario.")
    des_direccion: Optional[str] = Field(None, description="Dirección del usuario.")
    id_rol: Optional[Decimal] = Field(None, description="Identificador del rol del usuario.")
    ind_genero: bool = Field(..., description="Género del usuario.")
    cel_usuario: str = Field(..., description="Número de celular del usuario.")
    fec_nacimiento: Optional[str] = Field(None, description="Fecha de nacimiento del usuario.")
    ind_activo: Optional[bool] = Field(None, description="Indica si el usuario está activo.")
    
    class Config:
        from_attributes = True
        
class UserCreate(UserBase):
    """
    Esquema para la Creación de Usuarios.

    Hereda de `UserBase` y se utiliza para validar los datos
    al crear un nuevo usuario. Puede incluir campos adicionales o
    modificar el comportamiento de los campos heredados si es necesario
    para la operación de creación.
    """
    pass

class UserUpdate(BaseModel):
    """
    Esquema para la Actualización de Usuarios.

    Define los campos que pueden ser actualizados para un usuario existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    nom_usuario: Optional[str] = Field(None, description="Nombre del usuario.")
    ape_usuario: Optional[str] = Field(None, description="Apellido del usuario.")
    email_usuario: Optional[str] = Field(None, description="Email del usuario.")
    password_usuario: Optional[str] = Field(None, description="Contraseña del usuario.")
    des_direccion: Optional[str] = Field(None, description="Dirección del usuario.")
    ind_genero: Optional[bool] = Field(None, description="Género del usuario.")
    cel_usuario: Optional[str] = Field(None, description="Número de celular del usuario.")
    fec_nacimiento: Optional[str] = Field(None, description="Fecha de nacimiento del usuario.")
    ind_activo: Optional[bool] = Field(None, description="Indica si el usuario está activo.")
    
class User(UserBase):
    """
    Esquema para la Visualización de Usuarios.

    Hereda de `UserBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de usuarios.
    Incluye el `id_usuario` y los campos de auditoría.
    """
    id_usuario: Decimal
    fec_nacimiento: Optional[datetime] = Field(None, description="Fecha de nacimiento del usuario.")
    
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str

