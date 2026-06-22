"""
Schemas de facturación electrónica (entrada/salida de BillingProvider).

Estos modelos son AGNÓSTICOS al proveedor: cada proveedor (Factus, Alegra, Mock)
recibe un FacturaInput y devuelve un FacturaResult. El mapeo a su payload propio
vive dentro de cada provider.
"""
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from schemas.tax_schema import TipoIVA

EstadoDIAN = Literal["PENDING", "SENT", "ACCEPTED", "REJECTED"]


class FacturaCliente(BaseModel):
    """Adquiriente de la factura."""

    identificacion: str = Field(..., description="NIT o cédula.")
    tipo_documento: str = Field("13", description="Código DIAN del tipo de doc (13=Cédula, 31=NIT).")
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    # Código de municipio DIAN (opcional; el proveedor puede tener un default).
    cod_municipio: Optional[str] = None


class FacturaLinea(BaseModel):
    """Línea de la factura, con el IVA ya descompuesto (ver tax_service)."""

    code_reference: str = Field(..., description="SKU / referencia del producto.")
    descripcion: str
    cantidad: int = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0, description="Bruto (IVA incluido), pesos enteros.")
    tipo_iva: TipoIVA
    porcentaje_iva: Decimal = Field(..., description="Decimal, p.ej. 0.1900.")
    base_gravable: Decimal
    val_iva: Decimal
    total_linea: Decimal


class FacturaInput(BaseModel):
    """Todo lo necesario para emitir una factura, independiente del proveedor."""

    referencia: str = Field(..., description="reference_code idempotente (p.ej. orden id).")
    cliente: FacturaCliente
    lineas: List[FacturaLinea]
    val_base_gravable: Decimal
    val_total_iva: Decimal
    val_total_excluido: Decimal = Decimal(0)
    val_total_descuento: Decimal = Decimal(0)
    val_total: Decimal
    observacion: Optional[str] = None
    numbering_range_id: Optional[str] = Field(
        None, description="Rango de numeración del proveedor (resolución). En Factus v2 es un UUID."
    )


class FacturaResult(BaseModel):
    """Resultado de la emisión, normalizado entre proveedores."""

    estado: EstadoDIAN
    cufe: Optional[str] = None
    numero: Optional[str] = Field(None, description="Prefijo+consecutivo, p.ej. 'SETP990000001'.")
    qr_url: Optional[str] = None
    pdf_url: Optional[str] = None
    xml: Optional[str] = None
    proveedor: str = "mock"
    ambiente: str = "sandbox"
    referencia_externa: Optional[str] = None
    raw: Optional[dict] = Field(None, description="Respuesta cruda del proveedor (auditoría).")
    error: Optional[str] = None
