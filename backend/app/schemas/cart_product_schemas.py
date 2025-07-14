""""
Módulo de Servicios para la Gestión de Productos en el Carrito.

Define las operaciones lógicas para gestionar productos en el carrito,
"""
from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any
from decimal import Decimal


class Cart(BaseModel):
    """
    Esquema para la Gestión de Carritos.
    Contiene los campos comunes para la gestión de carritos.
    """
    id_carrito: int = Field(..., description="Identificador del carrito.")
    id_usuario: Optional[Decimal] = Field(None, description="Identificador del usuario.")
    session_id: Optional[Decimal] = Field(None, description="ID de la sesión para usuarios anónimos.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del registro.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del registro.")

class CartProductBase(BaseModel):
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
    id_carrito: Optional[int] = Field(None, description="Identificador del carrito.")
    id_usuario: Optional[Decimal] = Field(None, description="Identificador del usuario.")
    session_id: Optional[Decimal] = Field(None, description="ID de la sesión para usuarios anónimos.")
    id_categoria_producto: Decimal = Field(..., description="Identificador de la categoría del producto.")
    id_linea_producto: Decimal = Field(..., description="Identificador de la línea del producto.")
    id_sublinea_producto: Decimal = Field(..., description="Identificador de la sublínea del producto.")
    id_producto: Decimal = Field(..., description="Identificador del producto.")
    cantidad: Decimal = Field(..., description="Cantidad del producto en el carrito.")
    precio_unitario_carrito: Optional[Decimal] = Field(None, description="Precio unitario del producto en el carrito.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del registro.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del registro.")
    
    class Config:
        from_attributes = True
        
class CartProduct(CartProductBase):
    """
    Esquema para la Visualización de Productos en el Carrito.
    Hereda de `CarProductBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de productos en el carrito.
    Incluye el `id_carrito_producto` y los campos de auditoría.
    """
    id_carrito_producto: Decimal
    
class CartProductCreate(CartProductBase):
    """
    Esquema para la Creación de Productos en el Carrito.
    Hereda de `CarProductBase` y se utiliza para validar los datos
    al crear un nuevo producto en el carrito.
    """


class CartProductDelete(CartProductBase):
    """
    Esquema para la Eliminación de Productos en el Carrito.
    Hereda de `CarProductBase` y se utiliza para validar los datos
    al eliminar un producto en el carrito.
    """
    usr_update: Decimal = Field(..., description="Usuario que actualizó el registro.")
    pass

class MigrateCartAnonymous(BaseModel):
    """
    Esquema para la Migración de Carrito Anónimo a Usuario.
    
    Migra un carrito anónimo (donde id_usuario = NULL) al usuario autenticado.
    El usuario de destino se obtiene del token de autenticación.
    """
    id_carrito: int = Field(..., description="ID del carrito a migrar (debe ser un carrito anónimo donde id_usuario IS NULL)")


class GetCartUser(BaseModel):
    """
    Esquema para Obtener/Crear Carrito de Usuario.
    
    Obtiene un carrito existente o crea uno nuevo si no existe.
    Maneja tanto usuarios registrados como usuarios anónimos.
    
    Al menos uno de los parámetros debe ser proporcionado:
    - id_usuario: Para usuarios registrados
    - session_id: Para usuarios anónimos
    """
    id_usuario: Optional[Decimal] = Field(None, description="ID del usuario registrado (opcional).")
    session_id: Optional[Decimal] = Field(None, description="ID de la sesión para usuarios anónimos (opcional).")
    
    @model_validator(mode='after')
    def validate_at_least_one_parameter(self):
        """Valida que al menos uno de los parámetros sea proporcionado."""
        if not self.id_usuario and not self.session_id:
            raise ValueError("Debe proporcionar al menos 'id_usuario' o 'session_id'")
        return self 

class GetCartDetail(BaseModel):
    """
    Esquema para Obtener Detalle del Carrito.
    """
    id_usuario: Optional[Decimal] = Field(None, description="ID del usuario registrado (opcional).")
    session_id: Optional[Decimal] = Field(None, description="ID de la sesión para usuarios anónimos (opcional).")


class CartResponse(BaseModel):
    """
    Esquema de respuesta para operaciones de carrito.
    """
    id_carrito: int = Field(..., description="ID del carrito obtenido o creado.")
    message: str = Field(..., description="Mensaje de confirmación.")

class CalculateTotalCart(BaseModel):
    """
    Esquema para el Cálculo del Total del Carrito.
    """
    id_usuario: Optional[Decimal] = Field(None, description="ID del usuario registrado (opcional).")
    session_id: Optional[Decimal] = Field(None, description="ID de la sesión para usuarios anónimos (opcional).")
    id_canje_aplicar: Optional[Decimal] = Field(None, description="ID del canje a aplicar.")
    
    @model_validator(mode='after')
    def validate_at_least_one_parameter(self):
        """Valida que al menos uno de los parámetros sea proporcionado."""
        if not self.id_usuario and not self.session_id:
            raise ValueError("Debe proporcionar al menos 'id_usuario' o 'session_id'")
        return self

class CartTotalResponse(BaseModel):
    """
    Esquema de respuesta para el cálculo del total del carrito.
    Refleja la estructura JSON retornada por fun_calcular_total_carrito.
    """
    # === TOTALES PRINCIPALES ===
    success: bool = Field(..., description="Indica si el cálculo fue exitoso.")
    total_final: Decimal = Field(..., description="Total final a pagar.")
    total_productos: Decimal = Field(..., description="Subtotal de productos sin descuentos.")
    total_descuentos: Decimal = Field(..., description="Total de descuentos aplicados.")
    ahorro_total: Decimal = Field(..., description="Cuánto se ahorra en total.")
    
    # === RESUMEN DE TOTALES ===
    resumen: Dict[str, Any] = Field(..., description="Resumen detallado de totales.")
    
    # === DETALLES DE DESCUENTOS ===
    descuentos_automaticos: Optional[List[Dict[str, Any]]] = Field(default=None, description="Array de descuentos automáticos de empresa.")
    descuento_canjeado: Optional[Dict[str, Any]] = Field(None, description="Descuento canjeado por puntos.")
    total_desc_automaticos: Decimal = Field(..., description="Total de descuentos automáticos.")
    total_desc_canjeado: Decimal = Field(..., description="Total de descuento canjeado.")
    
    # === INFORMACIÓN DEL USUARIO ===
    es_primera_compra: bool = Field(..., description="Indicador para descuentos de bienvenida.")
    puntos_a_ganar: int = Field(..., description="Puntos que ganará con esta compra.")
    id_canje_aplicado: Optional[Decimal] = Field(None, description="ID del canje aplicado (si aplica).")
    
    # === MENSAJES INFORMATIVOS ===
    mensaje: str = Field(..., description="Mensaje informativo sobre los descuentos aplicados.")
    mensaje_puntos: str = Field(..., description="Mensaje sobre los puntos que ganará.")
    mensaje_resumen: str = Field(..., description="Mensaje de resumen del total a pagar.")
    
    class Config:
        from_attributes = True

class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.
    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str
    
    