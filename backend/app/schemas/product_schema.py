"""
Módulo de Esquemas de Producto.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los productos.
Incluye esquemas para la creación, actualización y visualización de productos,
así como un esquema para mensajes de respuesta genéricos.
"""
# Esquemas Pydantic (validación de datos, request/response)
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any # Usaremos Dict o Any para JSONB
from decimal import Decimal # Para campos DECIMAL si se requiere precisión
from datetime import datetime

class ProductBase(BaseModel):
    """
    Esquema Base para Productos.

    Contiene los campos comunes para la creación y visualización de productos.
    Utilizado como base para otros esquemas de productos más específicos.

    Atributos:
        nom_producto (str): Nombre del producto.
        spcf_producto (Dict[str, Any]): Especificaciones del producto en formato JSON.
        img_producto (Optional[str]): URL o ruta de la imagen del producto.
        val_precio (Decimal): Precio de venta del producto.
        id_proveedor (Decimal): Identificador del proveedor.
        id_marca (Decimal): Identificador de la marca.
        id_sublinea (Decimal): Identificador de la sublínea.
        id_linea (Decimal): Identificador de la línea.
        id_categoria (Decimal): Identificador de la categoría.
        num_stock (int): Cantidad de unidades disponibles en inventario.
    """
    # id_producto: Optional[Decimal] = Field(None, description="Identificador único para el producto.") # Generalmente no se incluye en Create, se genera por la DB. Puede estar en el modelo de respuesta.
    nom_producto: str = Field(..., description="Nombre del producto.")
    spcf_producto: Dict[str, Any] = Field(..., description="Especificaciones del producto en formato JSON.")
    img_producto: Optional[str] = Field(None, description="URL o ruta de la imagen del producto.")
    val_precio: Decimal = Field(..., gt=0, description="Precio de venta del producto.") # Usamos float, gt=0 para la validación CHECK (val_precio >= 0)
    id_proveedor: Decimal # Asumiendo que los IDs decimales pueden ser representados como int en la API si no son muy grandes
    id_marca: Decimal
    id_sublinea: Decimal
    id_linea: Decimal
    id_categoria: Decimal
    num_stock: int = Field(0, ge=0, description="Cantidad de unidades disponibles en inventario.")

    # Campos de auditoría (generalmente no se envían en Create/Update desde el cliente)
    # usr_insert: Optional[str] = None
    # fec_insert: Optional[datetime] = None
    # usr_update: Optional[str] = None
    # fec_update: Optional[datetime] = None
    
    class Config:
        from_attributes = True # Cambiado de orm_mode a from_attributes para Pydantic V2
        # orm_mode = True # Obsoleto en Pydantic V2


class ProductCreate(ProductBase):
    """
    Esquema para la Creación de Productos.

    Hereda de `ProductBase` y se utiliza para validar los datos
    al crear un nuevo producto. Puede incluir campos adicionales o
    modificar el comportamiento de los campos heredados si es necesario
    para la operación de creación.
    """
    # Aquí puedes añadir campos específicos para la creación si son diferentes de ProductBase
    # o si algunos campos de ProductBase no deben ser proporcionados al crear.
    # Por ejemplo, usr_insert y fec_insert podrían ser gestionados por el backend.
    pass

class ProductUpdate(BaseModel):
    """
    Esquema para la Actualización de Productos.

    Define los campos que pueden ser actualizados para un producto existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.

    Atributos:
        nom_producto (Optional[str]): Nuevo nombre del producto.
        spcf_producto (Optional[Dict[str, Any]]): Nuevas especificaciones del producto.
        img_producto (Optional[str]): Nueva URL o ruta de la imagen del producto.
        val_precio (Optional[Decimal]): Nuevo precio de venta del producto.
        id_proveedor (Optional[Decimal]): Nuevo identificador del proveedor.
        id_marca (Optional[Decimal]): Nuevo identificador de la marca.
        id_sublinea (Optional[Decimal]): Nuevo identificador de la sublínea.
        id_linea (Optional[Decimal]): Nuevo identificador de la línea.
        id_categoria (Optional[Decimal]): Nuevo identificador de la categoría.
        num_stock (Optional[int]): Nueva cantidad de unidades en inventario.
    """
    # Para las actualizaciones, a menudo todos los campos son opcionales
    nom_producto: Optional[str] = None
    spcf_producto: Optional[Dict[str, Any]] = None
    img_producto: Optional[str] = None
    val_precio: Optional[Decimal] = Field(None, gt=0)
    id_proveedor: Optional[Decimal] = None
    id_marca: Optional[Decimal] = None
    id_sublinea: Optional[Decimal] = None
    id_linea: Optional[Decimal] = None
    id_categoria: Optional[Decimal] = None
    num_stock: Optional[int] = Field(None, ge=0)
    # usr_update será gestionado por el backend

class Product(ProductBase): # Este será el modelo de respuesta principal
    """
    Esquema para la Visualización de Productos.

    Hereda de `ProductBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de productos.
    Incluye el `id_producto` y los campos de auditoría.

    Atributos:
        id_producto (Decimal): Identificador único del producto.
        usr_insert (str): Usuario que insertó el registro.
        fec_insert (datetime): Fecha y hora de inserción del registro.
        usr_update (Optional[str]): Usuario que realizó la última actualización.
        fec_update (Optional[datetime]): Fecha y hora de la última actualización.
    """
    id_producto: Decimal # El ID principal del producto, generalmente se incluye en la respuesta
    
    # Incluir campos de auditoría en la respuesta si se desea
    usr_insert: str
    fec_insert: datetime
    usr_update: Optional[str] = None
    fec_update: Optional[datetime] = None

# Esquema para mensajes de respuesta genéricos
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.

    Atributos:
        message (str): El mensaje a ser enviado en la respuesta.
    """
    message: str
