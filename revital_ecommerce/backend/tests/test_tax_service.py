"""
Tests del cálculo de IVA (services.tax_service).

Modelo: precios CON IVA INCLUIDO -> el total bruto nunca cambia; el IVA se
descompone. Montos en pesos enteros.
"""
from decimal import Decimal

import pytest

from schemas.tax_schema import TaxLineInput, TaxRate
from services.tax_service import (
    DEFAULT_TAX_RATE_ID,
    compute_breakdown,
    decompose_iva,
)


def _rates():
    """Catálogo de tarifas de prueba (espejo del seed de la migración)."""
    return {
        1: TaxRate(id_tarifa_iva=1, cod_tarifa="IVA_19", des_tarifa="IVA 19%",
                   val_porcentaje=Decimal("0.19"), tipo_iva="GRAVADO"),
        2: TaxRate(id_tarifa_iva=2, cod_tarifa="IVA_5", des_tarifa="IVA 5%",
                   val_porcentaje=Decimal("0.05"), tipo_iva="GRAVADO"),
        3: TaxRate(id_tarifa_iva=3, cod_tarifa="EXENTO", des_tarifa="Exento",
                   val_porcentaje=Decimal("0"), tipo_iva="EXENTO"),
        4: TaxRate(id_tarifa_iva=4, cod_tarifa="EXCLUIDO", des_tarifa="Excluido",
                   val_porcentaje=Decimal("0"), tipo_iva="EXCLUIDO"),
    }


# --- decompose_iva ---------------------------------------------------------
def test_decompose_iva_19():
    # $119.000 con IVA incluido al 19% -> base $100.000, IVA $19.000
    base, iva = decompose_iva(Decimal("119000"), Decimal("0.19"))
    assert base == Decimal("100000")
    assert iva == Decimal("19000")


def test_decompose_iva_5():
    base, iva = decompose_iva(Decimal("105000"), Decimal("0.05"))
    assert base == Decimal("100000")
    assert iva == Decimal("5000")


def test_decompose_iva_cero():
    base, iva = decompose_iva(Decimal("50000"), Decimal("0"))
    assert base == Decimal("50000")
    assert iva == Decimal("0")


def test_decompose_iva_suma_cuadra():
    # base + iva siempre == total bruto (no se pierde ni se crea un peso)
    base, iva = decompose_iva(Decimal("99999"), Decimal("0.19"))
    assert base + iva == Decimal("99999")


# --- compute_breakdown -----------------------------------------------------
def test_breakdown_una_linea_gravada():
    lines = [TaxLineInput(descripcion="Camisa", cantidad=2,
                          precio_unitario=Decimal("119000"), id_tarifa_iva=1)]
    b = compute_breakdown(lines, _rates())
    assert b.total_bruto == Decimal("238000")
    assert b.base_gravable == Decimal("200000")
    assert b.val_total_iva == Decimal("38000")
    # El total no cambió: base + iva == bruto
    assert b.base_gravable + b.val_total_iva == b.total_bruto


def test_breakdown_sin_tarifa_usa_default_19():
    lines = [TaxLineInput(descripcion="X", cantidad=1,
                          precio_unitario=Decimal("119000"), id_tarifa_iva=None)]
    b = compute_breakdown(lines, _rates())
    assert b.lineas[0].tipo_iva == "GRAVADO"
    assert b.val_total_iva == Decimal("19000")


def test_breakdown_excluido_no_genera_iva():
    lines = [TaxLineInput(descripcion="Libro", cantidad=1,
                          precio_unitario=Decimal("50000"), id_tarifa_iva=4)]
    b = compute_breakdown(lines, _rates())
    assert b.val_total_iva == Decimal("0")
    assert b.val_total_excluido == Decimal("50000")
    assert b.base_gravable == Decimal("0")


def test_breakdown_exento_separado_de_gravado():
    lines = [TaxLineInput(descripcion="Leche", cantidad=1,
                          precio_unitario=Decimal("40000"), id_tarifa_iva=3)]
    b = compute_breakdown(lines, _rates())
    assert b.val_total_iva == Decimal("0")
    assert b.val_total_exento == Decimal("40000")
    assert b.val_total_excluido == Decimal("0")


def test_breakdown_mixto():
    lines = [
        TaxLineInput(descripcion="Gravado19", cantidad=1, precio_unitario=Decimal("119000"), id_tarifa_iva=1),
        TaxLineInput(descripcion="Gravado5", cantidad=1, precio_unitario=Decimal("105000"), id_tarifa_iva=2),
        TaxLineInput(descripcion="Exento", cantidad=1, precio_unitario=Decimal("30000"), id_tarifa_iva=3),
        TaxLineInput(descripcion="Excluido", cantidad=1, precio_unitario=Decimal("20000"), id_tarifa_iva=4),
    ]
    b = compute_breakdown(lines, _rates())
    assert b.base_gravable == Decimal("200000")        # 100k + 100k
    assert b.val_total_iva == Decimal("24000")         # 19k + 5k
    assert b.val_total_exento == Decimal("30000")
    assert b.val_total_excluido == Decimal("20000")
    assert b.total_bruto == Decimal("274000")          # 119+105+30+20


def test_breakdown_falla_sin_tarifa_default():
    lines = [TaxLineInput(descripcion="X", cantidad=1, precio_unitario=Decimal("1000"))]
    rates_sin_default = {k: v for k, v in _rates().items() if k != DEFAULT_TAX_RATE_ID}
    with pytest.raises(ValueError):
        compute_breakdown(lines, rates_sin_default)
