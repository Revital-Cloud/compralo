"""
Servicio de cálculo de IVA (Colombia).

Modelo: precios CON IVA INCLUIDO. El IVA se descompone del precio bruto, por lo
que el total que paga el cliente nunca cambia. Todos los montos se redondean a
pesos enteros (COP no usa centavos en la práctica de facturación).

Las funciones de cálculo (`decompose_iva`, `compute_breakdown`) son puras y no
requieren base de datos, para poder probarlas de forma aislada. Los helpers que
empiezan con `get_` cargan parámetros fiscales desde la BD.
"""
from __future__ import annotations

import logging
from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, Iterable, List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from schemas.tax_schema import (
    TaxBreakdown,
    TaxLineInput,
    TaxLineResult,
    TaxRate,
)

logger = logging.getLogger(__name__)

# Tarifa por defecto (IVA general 19%) sembrada en la migración add_iva_facturacion.sql
DEFAULT_TAX_RATE_ID = 1
_PESO = Decimal("1")


def _to_peso(value: Decimal) -> Decimal:
    """Redondea a peso entero (ROUND_HALF_UP)."""
    return Decimal(value).quantize(_PESO, rounding=ROUND_HALF_UP)


def decompose_iva(total_bruto: Decimal, rate: Decimal) -> tuple[Decimal, Decimal]:
    """
    Descompone un monto BRUTO (IVA incluido) en (base_gravable, iva).

    base = total_bruto / (1 + rate);  iva = total_bruto - base
    Con rate = 0 (exento/excluido) -> iva = 0 y base = total_bruto.
    """
    total_bruto = Decimal(total_bruto)
    rate = Decimal(rate)
    if rate == 0:
        return _to_peso(total_bruto), Decimal(0)
    base = _to_peso(total_bruto / (Decimal(1) + rate))
    iva = _to_peso(total_bruto) - base
    return base, iva


def compute_line(line: TaxLineInput, rate: TaxRate) -> TaxLineResult:
    """Calcula el desglose de IVA de una sola línea (IVA incluido)."""
    total_bruto = _to_peso(Decimal(line.precio_unitario) * Decimal(line.cantidad))

    if rate.tipo_iva == "EXCLUIDO":
        base = Decimal(0)
        iva = Decimal(0)
    elif rate.tipo_iva == "EXENTO":
        # Exento: base existe pero a 0% -> sin IVA.
        base = total_bruto
        iva = Decimal(0)
    else:  # GRAVADO
        base, iva = decompose_iva(total_bruto, rate.val_porcentaje)

    return TaxLineResult(
        descripcion=line.descripcion,
        cantidad=line.cantidad,
        tipo_iva=rate.tipo_iva,
        val_porcentaje=rate.val_porcentaje,
        precio_unitario_bruto=_to_peso(Decimal(line.precio_unitario)),
        total_bruto=total_bruto,
        base_gravable=base,
        val_iva=iva,
    )


def compute_breakdown(
    lines: Iterable[TaxLineInput],
    rates_by_id: Dict[int, TaxRate],
) -> TaxBreakdown:
    """
    Calcula el desglose fiscal completo de una orden.

    Args:
        lines: líneas (descripción, cantidad, precio bruto, id_tarifa_iva).
        rates_by_id: catálogo de tarifas indexado por id (ver get_tax_rates).

    Una línea sin id_tarifa_iva (o con id desconocido) usa la tarifa general 19%.
    """
    default_rate = rates_by_id.get(DEFAULT_TAX_RATE_ID)
    if default_rate is None:
        raise ValueError(
            "No existe la tarifa de IVA por defecto (id=1). "
            "¿Se aplicó la migración add_iva_facturacion.sql?"
        )

    base_gravable = Decimal(0)
    total_iva = Decimal(0)
    total_exento = Decimal(0)
    total_excluido = Decimal(0)
    total_bruto = Decimal(0)
    resultados: List[TaxLineResult] = []

    for line in lines:
        rate = rates_by_id.get(line.id_tarifa_iva or DEFAULT_TAX_RATE_ID, default_rate)
        res = compute_line(line, rate)
        resultados.append(res)

        total_bruto += res.total_bruto
        if res.tipo_iva == "GRAVADO":
            base_gravable += res.base_gravable
            total_iva += res.val_iva
        elif res.tipo_iva == "EXENTO":
            total_exento += res.base_gravable
        else:  # EXCLUIDO
            total_excluido += res.total_bruto

    return TaxBreakdown(
        base_gravable=base_gravable,
        val_total_iva=total_iva,
        val_total_exento=total_exento,
        val_total_excluido=total_excluido,
        total_bruto=total_bruto,
        lineas=resultados,
    )


# ---------------------------------------------------------------------------
# Helpers de base de datos (parámetros fiscales)
# ---------------------------------------------------------------------------
def get_tax_rates(db: Session) -> Dict[int, TaxRate]:
    """Carga el catálogo de tarifas de IVA activas, indexado por id."""
    rows = db.execute(
        text(
            """
            SELECT id_tarifa_iva, cod_tarifa, des_tarifa, val_porcentaje,
                   tipo_iva, cod_dian
            FROM tab_tarifas_iva
            WHERE is_active = TRUE
            """
        )
    ).mappings().all()
    return {
        int(r["id_tarifa_iva"]): TaxRate(
            id_tarifa_iva=int(r["id_tarifa_iva"]),
            cod_tarifa=r["cod_tarifa"],
            des_tarifa=r["des_tarifa"],
            val_porcentaje=Decimal(str(r["val_porcentaje"])),
            tipo_iva=r["tipo_iva"],
            cod_dian=r["cod_dian"],
        )
        for r in rows
    }


def get_uvt(db: Session, anio: int) -> Optional[Decimal]:
    """Retorna el valor de la UVT para un año, o None si no está cargado."""
    row = db.execute(
        text("SELECT val_uvt FROM tab_uvt WHERE anio = :anio"), {"anio": anio}
    ).fetchone()
    return Decimal(str(row[0])) if row else None


def compute_order_breakdown(db: Session, lines: Iterable[TaxLineInput]) -> TaxBreakdown:
    """Conveniencia: carga tarifas desde la BD y calcula el desglose de la orden."""
    return compute_breakdown(lines, get_tax_rates(db))
