"""
Módulo de Esquemas de Direcciones.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con las direcciones.
Incluye esquemas para la creación, actualización y visualización de direcciones,
así como un esquema para mensajes de respuesta genéricos.
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

class AddressBase(BaseModel):
    """
    Esquema Base para Direcciones.

    Contiene los campos comunes para la creación y visualización de direcciones.
    Utilizado como base para otros esquemas de direcciones más específicos.
    Atributos:
        id_usuario (Decimal): Identificador del usuario.
        nombre_direccion (str): Nombre descriptivo de la dirección.
        calle_direccion (str): Dirección completa de la calle.
        ciudad (str): Ciudad de la dirección.
        departamento (str): Departamento/Estado de la dirección.
        codigo_postal (str): Código postal de la dirección.
        barrio (str): Barrio/Sector de la dirección.
        referencias (str): Referencias para el domiciliario.
        complemento (str): Información adicional.
        ind_principal (bool): Indica si la dirección es principal.
        ind_activa (bool): Indica si la dirección está activa.
        usr_insert (Decimal): Identificador del usuario que insertó la dirección.
        usr_update (Decimal): Identificador del usuario que actualizó la dirección.

    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")
    nombre_direccion: str = Field(..., description="Nombre descriptivo de la dirección.")
    calle_direccion: str = Field(..., description="Dirección completa de la calle.")
    ciudad: str = Field(..., description="Ciudad de la dirección.")
    departamento: str = Field(..., description="Departamento/Estado de la dirección.")
    codigo_postal: str = Field(..., description="Código postal de la dirección.")
    barrio: str = Field(..., description="Barrio/Sector de la dirección.")
    referencias: Optional[str] = Field(None, description="Referencias para el domiciliario.")
    complemento: Optional[str] = Field(None, description="Información adicional.")
    ind_principal: Optional[bool] = Field(None, description="Indica si la dirección es principal.")
    ind_activa: Optional[bool] = Field(None, description="Indica si la dirección está activa.")
    usr_insert: Decimal = Field(..., description="Identificador del usuario que insertó la dirección.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del registro.")
    usr_update: Optional[Decimal] = Field(None, description="Identificador del usuario que actualizó la dirección.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de última actualización del registro.")
    
    class Config:
        from_attributes = True
        
class Address(AddressBase):
    """
    Esquema para la Visualización de Direcciones.

    Hereda de `AddressBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de direcciones.
    Incluye el `id_direccion` y los campos de auditoría.
    """
    id_direccion: Decimal
class AddressCreate(BaseModel):
    """
    Esquema para la Creación de Direcciones.

    Define los campos necesarios para crear una nueva dirección.
    El campo usr_insert se maneja automáticamente en el servicio usando el usuario autenticado.
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")
    nombre_direccion: str = Field(..., description="Nombre descriptivo de la dirección.")
    calle_direccion: str = Field(..., description="Dirección completa de la calle.")
    ciudad: str = Field(..., description="Ciudad de la dirección.")
    departamento: str = Field(..., description="Departamento/Estado de la dirección.")
    codigo_postal: str = Field(..., description="Código postal de la dirección.")
    barrio: str = Field(..., description="Barrio/Sector de la dirección.")
    referencias: Optional[str] = Field(None, description="Referencias para el domiciliario.")
    complemento: Optional[str] = Field(None, description="Información adicional.")
    ind_principal: Optional[bool] = Field(True, description="Indica si la dirección es principal.")
    ind_activa: Optional[bool] = Field(True, description="Indica si la dirección está activa.")
    
    class Config:
        from_attributes = True

class AddressUpdate(BaseModel):
    """
    Esquema para la Actualización de Direcciones.

    Define los campos que pueden ser actualizados para una dirección existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    id_direccion: Optional[Decimal] = Field(None, description="Identificador de la dirección.")
    id_usuario: Optional[Decimal] = Field(None, description="Identificador del usuario.")
    nombre_direccion: Optional[str] = Field(None, description="Nombre descriptivo de la dirección.")
    calle_direccion: Optional[str] = Field(None, description="Dirección completa de la calle.")
    ciudad: Optional[str] = Field(None, description="Ciudad de la dirección.")
    departamento: Optional[str] = Field(None, description="Departamento/Estado de la dirección.")
    codigo_postal: Optional[str] = Field(None, description="Código postal de la dirección.")
    barrio: Optional[str] = Field(None, description="Barrio/Sector de la dirección.")
    referencias: Optional[str] = Field(None, description="Referencias para el domiciliario.")
    complemento: Optional[str] = Field(None, description="Información adicional.")
    ind_principal: Optional[bool] = Field(None, description="Indica si la dirección es principal.")
    ind_activa: Optional[bool] = Field(None, description="Indica si la dirección está activa.")
    usr_update: Optional[Decimal] = Field(None, description="Identificador del usuario que actualizó la dirección.")
    
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str
    
    