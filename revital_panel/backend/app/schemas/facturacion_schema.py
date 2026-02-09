"""
Modulo de Esquemas de Facturacion.

Define los modelos Pydantic utilizados para la validacion de datos
en las solicitudes y respuestas de la API relacionadas con las facturas
de suscripciones.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from decimal import Decimal
from datetime import datetime


# --- Esquemas de Detalle de Factura ---

class FacturaDetalleBase(BaseModel):
    """Esquema Base para Detalle de Factura."""
    num_linea: int = Field(..., gt=0, description="Numero de linea en la factura")
    concepto: str = Field(..., description="Descripcion del concepto")
    cantidad: Optional[Decimal] = Field(1, gt=0, description="Cantidad")
    precio_unitario: Decimal = Field(..., gt=0, description="Precio por unidad")
    descuento_linea: Optional[Decimal] = Field(0, ge=0, description="Descuento aplicado")
    impuesto_linea: Optional[Decimal] = Field(0, ge=0, description="Impuestos de esta linea")
    id_plan: Optional[Decimal] = Field(None, description="Plan asociado (si aplica)")
    id_instancia: Optional[Decimal] = Field(None, description="Instancia asociada (si aplica)")
    metadata_json: Optional[Dict[str, Any]] = Field(None, description="Informacion adicional")
    
    class Config:
        from_attributes = True


class FacturaDetalleCreate(FacturaDetalleBase):
    """Esquema para la Creacion de Detalle de Factura."""
    pass


class FacturaDetalleUpdate(BaseModel):
    """Esquema para la Actualizacion de Detalle de Factura."""
    concepto: Optional[str] = Field(None, description="Descripcion del concepto")
    cantidad: Optional[Decimal] = Field(None, gt=0, description="Cantidad")
    precio_unitario: Optional[Decimal] = Field(None, gt=0, description="Precio por unidad")
    descuento_linea: Optional[Decimal] = Field(None, ge=0, description="Descuento aplicado")
    impuesto_linea: Optional[Decimal] = Field(None, ge=0, description="Impuestos")


class FacturaDetalle(FacturaDetalleBase):
    """Esquema para la Visualizacion de Detalle de Factura."""
    id_detalle: Decimal = Field(..., description="ID unico del detalle")
    id_factura: Decimal = Field(..., description="ID de la factura")
    subtotal_linea: Decimal = Field(..., description="Subtotal de la linea")
    total_linea: Decimal = Field(..., description="Total de la linea")
    usr_insert: Optional[str] = Field(None, description="Usuario que creo el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creacion")


# --- Esquemas de Cabecera de Factura ---

class FacturaCabeceraBase(BaseModel):
    """Esquema Base para Cabecera de Factura."""
    id_suscripcion: Decimal = Field(..., description="ID de la suscripcion")
    identificacion_fiscal_cliente: str = Field(..., description="Identificacion fiscal del cliente")
    moneda: Optional[Literal["USD", "COP", "EUR", "MXN", "BRL", "ARS", "CLP", "PEN", "UYU", "DOP", "CRC", "GTQ", "PAB", "VES", "GBP", "CAD", "OTRA"]] = Field(
        "USD", 
        description="Moneda de la factura"
    )
    metodo_pago: Optional[Literal["tarjeta", "transferencia", "paypal", "stripe", "wompi", "pse", "efectivo", "crypto", "otro"]] = Field(
        None, 
        description="Metodo de pago"
    )
    fecha_vencimiento: Optional[datetime] = Field(None, description="Fecha de vencimiento")
    periodo_facturado_desde: Optional[datetime] = Field(None, description="Inicio del periodo facturado")
    periodo_facturado_hasta: Optional[datetime] = Field(None, description="Fin del periodo facturado")
    notas: Optional[str] = Field(None, description="Notas adicionales")
    
    class Config:
        from_attributes = True


class FacturaCabeceraCreate(FacturaCabeceraBase):
    """Esquema para la Creacion de Cabecera de Factura."""
    detalles: Optional[List[FacturaDetalleCreate]] = Field(None, description="Lineas de la factura")


class FacturaCabeceraUpdate(BaseModel):
    """Esquema para la Actualizacion de Cabecera de Factura."""
    estado_pago: Optional[Literal["pendiente", "pagado", "fallido", "reembolsado", "cancelado"]] = Field(
        None, 
        description="Estado del pago"
    )
    metodo_pago: Optional[Literal["tarjeta", "transferencia", "paypal", "stripe", "wompi", "pse", "efectivo", "crypto", "otro"]] = Field(
        None, 
        description="Metodo de pago"
    )
    fecha_pago: Optional[datetime] = Field(None, description="Fecha del pago")
    referencia_pago: Optional[str] = Field(None, description="Referencia de pago externa")
    notas: Optional[str] = Field(None, description="Notas adicionales")


class FacturaCabecera(FacturaCabeceraBase):
    """Esquema para la Visualizacion de Cabecera de Factura."""
    id_factura: Decimal = Field(..., description="ID unico de la factura")
    num_factura: str = Field(..., description="Numero de factura")
    subtotal: Decimal = Field(..., description="Subtotal de la factura")
    impuestos: Decimal = Field(..., description="Total de impuestos")
    descuentos: Decimal = Field(..., description="Total de descuentos")
    total: Decimal = Field(..., description="Total de la factura")
    estado_pago: str = Field(..., description="Estado del pago")
    fecha_emision: datetime = Field(..., description="Fecha de emision")
    fecha_pago: Optional[datetime] = Field(None, description="Fecha del pago")
    referencia_pago: Optional[str] = Field(None, description="Referencia de pago externa")
    usr_insert: Optional[str] = Field(None, description="Usuario que creo el registro")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de creacion")


class FacturaPublic(BaseModel):
    """Esquema publico para informacion de la factura."""
    id_factura: Decimal = Field(..., description="ID unico de la factura")
    num_factura: str = Field(..., description="Numero de factura")
    id_suscripcion: Decimal = Field(..., description="ID de la suscripcion")
    identificacion_fiscal_cliente: str = Field(..., description="Identificacion fiscal del cliente")
    subtotal: Decimal = Field(..., description="Subtotal")
    impuestos: Decimal = Field(..., description="Impuestos")
    descuentos: Decimal = Field(..., description="Descuentos")
    total: Decimal = Field(..., description="Total")
    moneda: str = Field(..., description="Moneda")
    estado_pago: str = Field(..., description="Estado del pago")
    fecha_emision: datetime = Field(..., description="Fecha de emision")
    fecha_vencimiento: Optional[datetime] = Field(None, description="Fecha de vencimiento")
    fecha_pago: Optional[datetime] = Field(None, description="Fecha del pago")
    periodo_facturado_desde: Optional[datetime] = Field(None, description="Inicio del periodo")
    periodo_facturado_hasta: Optional[datetime] = Field(None, description="Fin del periodo")
    
    class Config:
        from_attributes = True


class FacturaConDetalle(FacturaPublic):
    """Esquema de factura con detalles incluidos."""
    detalles: List[FacturaDetalle] = Field(default_factory=list, description="Lineas de la factura")


# --- Esquemas de Stripe ---

class StripeCheckoutSessionResponse(BaseModel):
    """Esquema de respuesta para creación de Checkout Session."""
    checkout_url: str = Field(..., description="URL de Stripe Checkout para redirigir al usuario")
    session_id: Optional[str] = Field(None, description="ID de la sesión de Stripe")
    
    class Config:
        from_attributes = True
