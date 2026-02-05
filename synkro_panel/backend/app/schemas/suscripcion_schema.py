"""
Modulo de Esquemas de Suscripciones.

Define los modelos Pydantic utilizados para la validacion de datos
en las solicitudes y respuestas de la API relacionadas con las suscripciones
de clientes a planes.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from decimal import Decimal
from datetime import datetime


class SuscripcionBase(BaseModel):
    """Esquema Base para Suscripciones."""
    identificacion_fiscal_cliente: str = Field(..., description="Identificacion fiscal del cliente")
    id_plan: Decimal = Field(..., description="ID del plan de suscripcion")
    id_instancia: Optional[Decimal] = Field(None, description="ID de la instancia asociada")
    tipo_facturacion: Optional[Literal["mensual", "anual", "trimestral"]] = Field(
        "mensual", 
        description="Tipo de facturacion"
    )
    precio_actual: Decimal = Field(..., gt=0, description="Precio actual de la suscripcion")
    metodo_pago: Optional[Literal["tarjeta", "transferencia", "paypal", "stripe", "wompi", "pse", "efectivo", "crypto", "otro"]] = Field(
        None, 
        description="Metodo de pago"
    )
    
    class Config:
        from_attributes = True


class SuscripcionCreate(SuscripcionBase):
    """Esquema para la Creacion de Suscripciones."""
    fecha_inicio: Optional[datetime] = Field(None, description="Fecha de inicio (por defecto: ahora)")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de fin (NULL para indefinida)")
    fecha_proximo_pago: Optional[datetime] = Field(None, description="Fecha del proximo pago")
    estado_suscripcion: Optional[Literal["activa", "cancelada", "suspendida", "expirada", "trial"]] = Field(
        "activa", 
        description="Estado de la suscripcion"
    )


class SuscripcionUpdate(BaseModel):
    """Esquema para la Actualizacion de Suscripciones."""
    id_plan: Optional[Decimal] = Field(None, description="ID del plan")
    id_instancia: Optional[Decimal] = Field(None, description="ID de la instancia")
    tipo_facturacion: Optional[Literal["mensual", "anual", "trimestral"]] = Field(None, description="Tipo de facturacion")
    precio_actual: Optional[Decimal] = Field(None, gt=0, description="Precio actual")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de fin")
    fecha_proximo_pago: Optional[datetime] = Field(None, description="Fecha del proximo pago")
    estado_suscripcion: Optional[Literal["activa", "cancelada", "suspendida", "expirada", "trial"]] = Field(
        None, 
        description="Estado de la suscripcion"
    )
    metodo_pago: Optional[Literal["tarjeta", "transferencia", "paypal", "stripe", "wompi", "pse", "efectivo", "crypto", "otro"]] = Field(
        None, 
        description="Metodo de pago"
    )
    fecha_cancelacion: Optional[datetime] = Field(None, description="Fecha de cancelacion")
    motivo_cancelacion: Optional[str] = Field(None, description="Motivo de cancelacion")


class Suscripcion(SuscripcionBase):
    """Esquema para la Visualizacion de Suscripciones."""
    id_suscripcion: Decimal = Field(..., description="ID unico de la suscripcion")
    fecha_inicio: datetime = Field(..., description="Fecha de inicio")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de fin")
    fecha_proximo_pago: Optional[datetime] = Field(None, description="Fecha del proximo pago")
    estado_suscripcion: str = Field(..., description="Estado de la suscripcion")
    fecha_cancelacion: Optional[datetime] = Field(None, description="Fecha de cancelacion")
    motivo_cancelacion: Optional[str] = Field(None, description="Motivo de cancelacion")
    usr_insert: Optional[str] = Field(None, description="Usuario que creo el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creacion")
    usr_update: Optional[str] = Field(None, description="Usuario que actualizo el registro")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualizacion")


class CrearPrimeraSuscripcionResponse(BaseModel):
    """Respuesta al crear la primera suscripción; puede incluir URL de Stripe Checkout."""
    message: str = Field(..., description="Mensaje de resultado")
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    checkout_url: Optional[str] = Field(None, description="URL de Stripe Checkout para pagar (si aplica)")


class SuscripcionPublic(BaseModel):
    """Esquema publico para informacion de la suscripcion."""
    id_suscripcion: Decimal = Field(..., description="ID unico de la suscripcion")
    identificacion_fiscal_cliente: str = Field(..., description="Identificacion fiscal del cliente")
    id_plan: Decimal = Field(..., description="ID del plan")
    id_instancia: Optional[Decimal] = Field(None, description="ID de la instancia")
    tipo_facturacion: str = Field(..., description="Tipo de facturacion")
    precio_actual: Decimal = Field(..., description="Precio actual")
    fecha_inicio: datetime = Field(..., description="Fecha de inicio")
    fecha_fin: Optional[datetime] = Field(None, description="Fecha de fin")
    fecha_proximo_pago: Optional[datetime] = Field(None, description="Fecha del proximo pago")
    estado_suscripcion: str = Field(..., description="Estado de la suscripcion")
    metodo_pago: Optional[str] = Field(None, description="Metodo de pago")
    
    class Config:
        from_attributes = True
