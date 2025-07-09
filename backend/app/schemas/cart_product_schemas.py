""""
Módulo de Servicios para la Gestión de Productos en el Carrito.

Define las operaciones lógicas para gestionar productos en el carrito,
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
class CarProductBase(BaseModel):
    """
    Esquema Base para la Gestión de Productos en el Carrito.
    Contiene los campos comunes para la gestión de productos en el carrito.
    Atributos:
        id_carrito (Decimal): Identificador del carrito.
        id_categoria_producto (Decimal): Identificador de la categoría del producto.
        id_linea_producto (Decimal): Identificador de la línea del producto.
        id_sublinea_producto (Decimal): Identificador de la sublínea del producto.
        id_producto (Decimal): Identificador del producto.
        cantidad (Decimal): Cantidad del producto en el carrito.
        precio_unitario_carrito (Decimal): Precio unitario del producto en el carrito.
        usr_insert (Decimal): Usuario que insertó el registro.
    """
    id_carrito: Decimal = Field(..., description="Identificador del carrito.")
    id_categoria_producto: Decimal = Field(..., description="Identificador de la categoría del producto.")
    id_linea_producto: Decimal = Field(..., description="Identificador de la línea del producto.")
    id_sublinea_producto: Decimal = Field(..., description="Identificador de la sublínea del producto.")
    id_producto: Decimal = Field(..., description="Identificador del producto.")
    cantidad: Decimal = Field(..., description="Cantidad del producto en el carrito.")
    precio_unitario_carrito: Decimal = Field(..., description="Precio unitario del producto en el carrito.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    
    class Config:
        from_attributes = True
        
class CarProduct(CarProductBase):
    """
    Esquema para la Visualización de Productos en el Carrito.
    Hereda de `CarProductBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de productos en el carrito.
    Incluye el `id_carrito_producto` y los campos de auditoría.
    """
    id_carrito_producto: Decimal
    
class CarProductCreate(CarProductBase):
    """
    Esquema para la Creación de Productos en el Carrito.
    Hereda de `CarProductBase` y se utiliza para validar los datos
    al crear un nuevo producto en el carrito.
    """


class CarProductDelete(CarProductBase):
    """
    Esquema para la Eliminación de Productos en el Carrito.
    Hereda de `CarProductBase` y se utiliza para validar los datos
    al eliminar un producto en el carrito.
    """
    usr_update: Decimal = Field(..., description="Usuario que actualizó el registro.")
    pass

class MigrateCarAnonymous(BaseModel):
    """
    Esquema para la Migración de Carrito Anónimo a Usuario.
    
    Migra un carrito anónimo (donde id_usuario = NULL) al usuario autenticado.
    El usuario de destino se obtiene del token de autenticación.
    """
    id_carrito: Decimal = Field(..., description="ID del carrito a migrar (debe ser un carrito anónimo donde id_usuario IS NULL)")


class GetCarUser(BaseModel):
    """
    Esquema para la Obtención de Productos en el Carrito.
    """
    id_usuario: Decimal = Field(..., description="ID del usuario a obtener.")
    session_id: Optional[str] = Field(None, description="ID de la sesión a obtener.")

class CalculateTotalCar(BaseModel):
    """
    Esquema para el Cálculo del Total del Carrito.
    """
    id_usuario: Decimal = Field(..., description="ID del usuario a obtener.")
    id_canje_aplicar: Optional[Decimal] = Field(None, description="ID del canje a aplicar.")

class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.
    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str
    
    