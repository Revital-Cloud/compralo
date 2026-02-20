"""
Módulo de Esquemas de Descuentos.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los descuentos.
Incluye esquemas para la creación, actualización y visualización de descuentos,
así como un esquema para mensajes de respuesta genéricos.
"""
from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from decimal import Decimal

class DiscountBase(BaseModel):
    """
    Esquema Base para Descuentos.
    
    Contiene los campos comunes para la creación y visualización de descuentos.
    Utilizado como base para otros esquemas de descuentos más específicos.
    Atributos:
        nom_descuento (str): Nombre descriptivo del descuento.
        des_descuento (str): Descripción detallada del descuento.
        tipo_calculo (bool): Indica si el descuento es porcentaje o monto fijo.
        val_porce_descuento (Decimal): Valor del descuento en porcentaje.
        val_monto_descuento (Decimal): Valor del descuento en monto fijo.
        aplica_a (str): Tipo de aplicación del descuento.
        id_producto_aplica (Decimal): ID del producto al que aplica (tab_descuentos.product_id_aplica).
        id_categoria_aplica (Decimal): ID de la categoría a la que aplica (tab_descuentos.category_id_aplica).
        id_marca_aplica (Decimal): Identificador de la marca.
        fec_inicio (date): Fecha de inicio de validez del descuento.
        fec_fin (date): Fecha de fin de validez del descuento.
        max_usos_total (int): Límite total de usos del descuento.
        costo_punto_canje (int): Costo en puntos para canjear este descuento.
        codigo_descuento (str): Código único para cupones.
        max_usos_por_usuario (int): Límite de usos por usuario.
        dias_semana_aplica (str): Días de la semana en que se aplica el descuento.
        horas_inicio (int): Hora de inicio de validez del descuento.
        horas_fin (int): Hora de fin de validez del descuento.
        usr_insert (Decimal): Usuario que insertó el descuento.
    """
    nom_descuento: str = Field(..., description="Nombre descriptivo del descuento.")
    des_descuento: str = Field(..., description="Descripción detallada del descuento.")
    tipo_calculo: bool = Field(..., description="Indica si el descuento es porcentaje o monto fijo.")
    val_porce_descuento: Optional[Decimal] = Field(None, description="Valor del descuento en porcentaje.")
    val_monto_descuento: Optional[Decimal] = Field(None, description="Valor del descuento en monto fijo.")
    aplica_a: Optional[str] = Field(None, description="Tipo de aplicación del descuento.")
    id_producto_aplica: Optional[Decimal] = Field(None, description="ID del producto al que aplica.")
    id_categoria_aplica: Optional[Decimal] = Field(None, description="ID de la categoría a la que aplica.")
    id_marca_aplica: Optional[Decimal] = Field(None, description="Identificador de la marca.")
    min_valor_pedido: Optional[Decimal] = Field(None, description="Monto mínimo de pedido para aplicar el descuento.")
    ind_es_para_cumpleanos: Optional[bool] = Field(None, description="Indica si el descuento es para cumpleaños.")
    fec_inicio: Optional[date] = Field(None, description="Fecha de inicio de validez del descuento.")
    fec_fin: Optional[date] = Field(None, description="Fecha de fin de validez del descuento.")
    ind_activo: Optional[bool] = Field(None, description="Indica si el descuento está activo.")
    max_usos_total: Optional[int] = Field(None, description="Límite total de usos del descuento.")
    usos_actuales_total: Optional[int] = Field(None, description="Número de veces que el descuento ha sido usado.")
    costo_puntos_canje: Optional[int] = Field(None, description="Costo en puntos para canjear este descuento.")
    ind_canjeable_puntos: Optional[bool] = Field(None, description="Indica si el descuento se puede canjear por puntos.")
    codigo_descuento: Optional[str] = Field(None, description="Código único para cupones.")
    max_usos_por_usuario: Optional[int] = Field(None, description="Límite de usos por usuario.")
    dias_semana_aplica: Optional[str] = Field(None, description="Días de la semana en que se aplica el descuento.")
    horas_inicio: Optional[int] = Field(None, description="Hora de inicio de validez del descuento.")
    horas_fin: Optional[int] = Field(None, description="Hora de fin de validez del descuento.")
    solo_primera_compra: Optional[bool] = Field(None, description="Indica si el descuento es solo para la primera compra.")
    monto_minimo_producto: Optional[Decimal] = Field(None, description="Monto mínimo de producto para aplicar el descuento.")
    cantidad_minima_producto: Optional[int] = Field(None, description="Cantidad mínima de producto para aplicar el descuento.")
    requiere_codigo: Optional[bool] = Field(None, description="Indica si el descuento requiere un código.")
    id_usuario_destino: Optional[Decimal] = Field(None, description="Si no es NULL, solo este usuario puede usar el código (cupón personal).")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el descuento.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del descuento.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el descuento.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del descuento.")
    
    class Config:
        from_attributes = True


class DiscountExchangeableResponse(BaseModel):
    """
    Esquema para la Respuesta de Descuentos Canjeables.
    
    Coincide con los campos que retorna la función fun_listar_descuentos_canjeables.
    fec_inicio y fec_fin son opcionales (NULL para plantillas canjeables sin vigencia).
    """
    id_descuento: Decimal
    nom_descuento: str
    des_descuento: str
    costo_puntos_canje: Optional[int] = None
    tipo_calculo_texto: str
    valor_descuento: str
    aplica_a: str
    fec_inicio: Optional[date] = None
    fec_fin: Optional[date] = None
    puede_canjear: Optional[bool] = None
    puntos_usuario: Optional[int] = None
    
    class Config:
        from_attributes = True


class Discount(DiscountBase):
    """
    Esquema para la Visualización de Descuentos.
    
    Hereda de `DiscountBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de descuentos.
    Incluye el `id_descuento` y los campos de auditoría.
    """
    id_descuento: Decimal
class DiscountCreate(DiscountBase):
    """
    Esquema para la Creación de Descuentos.
    
    Hereda de `DiscountBase` y se utiliza para validar los datos
    al crear un nuevo descuento. Puede incluir campos adicionales o
    modificar el comportamiento de los campos heredados si es necesario
    para la operación de creación.
    """
    pass
class DiscountUpdate(BaseModel):
    """
    Esquema para la Actualización de Descuentos.
    
    Define los campos que pueden ser actualizados para un descuento existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    nom_descuento: Optional[str] = Field(None, description = "Nombre descriptivo del descuento.")
    des_descuento: Optional[str] = Field(None, description = "Descripción detallada del descuento.")
    tipo_calculo: Optional[bool] = Field(None, description = "Indica si el descuento es porcentaje o monto fijo.")
    val_porce_descuento: Optional[Decimal] = Field(None, description = "Valor del descuento en porcentaje.")
    val_monto_descuento: Optional[Decimal] = Field(None, description = "Valor del descuento en monto fijo.")
    aplica_a: Optional[str] = Field(None, description="Tipo de aplicación del descuento.")
    id_producto_aplica: Optional[Decimal] = Field(None, description="ID del producto al que aplica.")
    id_categoria_aplica: Optional[Decimal] = Field(None, description="ID de la categoría a la que aplica.")
    id_marca_aplica: Optional[Decimal] = Field(None, description="Identificador de la marca.")
    min_valor_pedido: Optional[Decimal] = Field(None, description = "Monto mínimo de pedido para aplicar el descuento.")
    ind_es_para_cumpleanos: Optional[bool] = Field(None, description = "Indica si el descuento es para cumpleaños.")
    fec_inicio: Optional[date] = Field(None, description = "Fecha de inicio de validez del descuento.")
    fec_fin: Optional[date] = Field(None, description = "Fecha de fin de validez del descuento.")
    max_usos_total: Optional[int] = Field(None, description = "Límite total de usos del descuento.")
    costo_puntos_canje: Optional[int] = Field(None, description = "Costo en puntos para canjear este descuento.")
    ind_canjeable_puntos: Optional[bool] = Field(None, description = "Indica si el descuento se puede canjear por puntos.")
    codigo_descuento: Optional[str] = Field(None, description = "Código único para cupones.")
    max_usos_por_usuario: Optional[int] = Field(None, description = "Límite de usos por usuario.")
    dias_semana_aplica: Optional[str] = Field(None, description = "Días de la semana en que se aplica el descuento.")
    horas_inicio: Optional[int] = Field(None, description = "Hora de inicio de validez del descuento.")
    horas_fin: Optional[int] = Field(None, description = "Hora de fin de validez del descuento.")
    solo_primera_compra: Optional[bool] = Field(None, description = "Indica si el descuento es solo para la primera compra.")
    monto_minimo_producto: Optional[Decimal] = Field(None, description = "Monto mínimo de producto para aplicar el descuento.")
    cantidad_minima_producto: Optional[int] = Field(None, description = "Cantidad mínima de producto para aplicar el descuento.")
    requiere_codigo: Optional[bool] = Field(None, description = "Indica si el descuento requiere un código.")
    id_usuario_destino: Optional[Decimal] = Field(None, description="Si no es NULL, solo este usuario puede usar el código (cupón personal).")
    usr_update: Optional[Decimal] = Field(None, description = "Usuario que actualizó el descuento.")
    
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.
    
    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str


class CreateDiscountResponse(BaseModel):
    """Respuesta al crear descuento; incluye id_descuento para enviar cupón por correo."""
    message: str
    id_descuento: Optional[Decimal] = None
    