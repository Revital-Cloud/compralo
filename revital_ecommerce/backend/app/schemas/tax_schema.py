"""
Schemas para el cálculo de IVA (Colombia).

Convención: los precios manejados en el sistema YA INCLUYEN IVA (precio al
público con IVA incluido). El IVA se DESCOMPONE del precio bruto; el total que
paga el cliente no cambia.
"""
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

TipoIVA = Literal["GRAVADO", "EXENTO", "EXCLUIDO"]


class TaxRate(BaseModel):
    """Tarifa de IVA del catálogo (tab_tarifas_iva)."""

    id_tarifa_iva: int
    cod_tarifa: str = Field(..., description="Código: IVA_19, IVA_5, EXENTO, EXCLUIDO.")
    des_tarifa: str
    val_porcentaje: Decimal = Field(..., description="Tarifa decimal, p.ej. 0.1900.")
    tipo_iva: TipoIVA
    cod_dian: str = Field("01", description="Código de impuesto DIAN (01=IVA).")


class TaxLineInput(BaseModel):
    """Una línea de la orden/carrito para calcular IVA."""

    descripcion: str
    cantidad: int = Field(..., gt=0)
    # Precio unitario BRUTO (IVA incluido), en pesos enteros.
    precio_unitario: Decimal = Field(..., ge=0)
    id_tarifa_iva: Optional[int] = Field(
        None, description="Si es None se usa la tarifa general (19%)."
    )


class TaxLineResult(BaseModel):
    """Resultado del desglose de IVA de una línea (todo en pesos enteros)."""

    descripcion: str
    cantidad: int
    tipo_iva: TipoIVA
    val_porcentaje: Decimal
    precio_unitario_bruto: Decimal
    total_bruto: Decimal = Field(..., description="cantidad * precio (IVA incluido).")
    base_gravable: Decimal = Field(..., description="Base sin IVA.")
    val_iva: Decimal = Field(..., description="IVA contenido en el total bruto.")


class TaxBreakdown(BaseModel):
    """Desglose fiscal completo de una orden."""

    base_gravable: Decimal = Field(..., description="Suma de bases gravadas (19%/5%).")
    val_total_iva: Decimal = Field(..., description="IVA total descompuesto.")
    val_total_exento: Decimal = Field(0, description="Base de productos exentos (0%).")
    val_total_excluido: Decimal = Field(0, description="Total de productos excluidos.")
    total_bruto: Decimal = Field(..., description="Total con IVA incluido (lo que paga el cliente).")
    lineas: List[TaxLineResult] = Field(default_factory=list)
