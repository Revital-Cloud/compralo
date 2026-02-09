"""
Módulo de Esquemas de Proveedores.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los proveedores.
Incluye esquemas para la creación, actualización y visualización de proveedores,
así como un esquema para mensajes de respuesta genéricos.
"""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class ProviderBase(BaseModel):
    """
    Esquema Base para Proveedores.

    Contiene los campos comunes para la creación y visualización de proveedores.
    Utilizado como base para otros esquemas de proveedores más específicos.

    Atributos:
        nom_proveedor (str): Nombre del proveedor.
        email (str): Correo electrónico del proveedor.
        tel_proveedor (str): Teléfono del proveedor.
    """
    nom_proveedor: str = Field(..., description="Nombre del proveedor.")
    email: str = Field(..., description="Correo electrónico del proveedor.")
    tel_proveedor: Decimal = Field(..., description="Teléfono del proveedor.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    ind_activo: Optional[bool] = Field(None, description="Indica si el proveedor está activo.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del registro.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del registro.")


    class Config:
        from_attributes = True


class ProviderCreate(ProviderBase):
    """
    Esquema para la Creación de Proveedores.

    Hereda de `ProviderBase` y se utiliza para validar los datos
    al crear un nuevo proveedor. Puede incluir campos adicionales o
    modificar el comportamiento de los campos heredados si es necesario
    para la operación de creación.
    """
    pass

class ProviderUpdate(BaseModel):
    """
    Esquema para la Actualización de Proveedores.

    Define los campos que pueden ser actualizados para un proveedor existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    nom_proveedor: Optional[str] = Field(None, description="Nombre del proveedor.")
    email: Optional[str] = Field(None, description="Correo electrónico del proveedor.")
    tel_proveedor: Optional[Decimal] = Field(None , description="Teléfono del proveedor.")
    ind_activo: Optional[bool] = Field(None, description="Indica si el proveedor está activo.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")

#llama un solo proveedor
class Provider(ProviderBase):
    """
    Esquema para la Visualización de Proveedores.

    Hereda de `ProviderBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de proveedores.
    Incluye el `id_proveedor` y los campos de auditoría.
    """
    id_proveedor: Decimal = Field(..., description="Identificador único para el proveedor.")

# Esquema para toggle (activar/desactivar)
class ToggleRequest(BaseModel):
    """
    Esquema para solicitudes de activar/desactivar proveedores.
    
    Utilizado en endpoints toggle para activar o desactivar proveedores.
    
    Atributos:
        activar (bool): True para activar, False para desactivar.
    """
    activar: bool = Field(..., description="True para activar, False para desactivar.")

class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str
    
    
    
