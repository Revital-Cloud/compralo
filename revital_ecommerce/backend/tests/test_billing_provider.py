"""
Tests de la capa de facturación (services.billing).

- MockProvider: funciona sin red ni credenciales.
- get_billing_provider: selección/fallback de proveedor.
- FactusProvider: se prueba con httpx.MockTransport (sin tocar la red real),
  demostrando que NO se necesitan credenciales para construir y probar el provider.
"""
from decimal import Decimal

import httpx
import pytest

from schemas.billing_schema import FacturaCliente, FacturaInput, FacturaLinea
from services.billing import get_billing_provider
from services.billing.factus_provider import FactusProvider
from services.billing.mock_provider import MockProvider


def _factura(ref="1001"):
    return FacturaInput(
        referencia=ref,
        cliente=FacturaCliente(identificacion="900123456", tipo_documento="31",
                               nombre="Cliente Test", email="c@test.co"),
        lineas=[
            FacturaLinea(code_reference="SKU-1", descripcion="Camisa", cantidad=2,
                         precio_unitario=Decimal("119000"), tipo_iva="GRAVADO",
                         porcentaje_iva=Decimal("0.19"), base_gravable=Decimal("200000"),
                         val_iva=Decimal("38000"), total_linea=Decimal("238000")),
        ],
        val_base_gravable=Decimal("200000"),
        val_total_iva=Decimal("38000"),
        val_total=Decimal("238000"),
    )


# --- Mock ------------------------------------------------------------------
async def test_mock_emite_aceptada():
    res = await MockProvider().emitir_factura(_factura())
    assert res.estado == "ACCEPTED"
    assert res.cufe and len(res.cufe) == 96  # SHA-384 hex
    assert res.numero == "MOCK1001"
    assert res.proveedor == "mock"


async def test_mock_cufe_determinista():
    a = await MockProvider().emitir_factura(_factura("X"))
    b = await MockProvider().emitir_factura(_factura("X"))
    assert a.cufe == b.cufe  # misma referencia -> mismo CUFE (reproducible)


# --- Factory ---------------------------------------------------------------
def test_factory_default_es_mock():
    assert isinstance(get_billing_provider("mock"), MockProvider)


def test_factory_factus_sin_credenciales_cae_a_mock(monkeypatch):
    # Sin credenciales -> fallback seguro a Mock (no rompe el flujo).
    from core.config import settings
    monkeypatch.setattr(settings, "FACTUS_CLIENT_ID", None)
    assert isinstance(get_billing_provider("factus"), MockProvider)


# --- Factus (HTTP simulado) ------------------------------------------------
def _factus_transport(validate_status=200):
    """MockTransport que simula /oauth/token y /v2/bills/validate."""
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/oauth/token":
            return httpx.Response(200, json={"access_token": "tok-123", "expires_in": 3600})
        if request.url.path == "/v2/bills/validate":
            if validate_status != 200:
                return httpx.Response(validate_status, json={"message": "datos inválidos"})
            # Estructura real de Factus v2: data.{number, cufe, links:{qr, public_url}}
            return httpx.Response(201, json={
                "data": {
                    "reference_code": "1001",
                    "number": "SETP990000001",
                    "cufe": "abc123cufe",
                    "links": {
                        "qr": "https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=abc",
                        "public_url": "https://app-sandbox.factus.com.co/documents/bills/abc",
                    },
                }
            })
        return httpx.Response(404)
    return httpx.MockTransport(handler)


async def test_factus_emite_y_parsea_cufe():
    provider = FactusProvider(transport=_factus_transport())
    res = await provider.emitir_factura(_factura())
    assert res.estado == "ACCEPTED"
    assert res.cufe == "abc123cufe"
    assert res.numero == "SETP990000001"
    assert res.pdf_url == "https://app-sandbox.factus.com.co/documents/bills/abc"
    assert res.proveedor == "factus"
    assert res.referencia_externa == "1001"


async def test_factus_http_error_es_rejected():
    provider = FactusProvider(transport=_factus_transport(validate_status=422))
    res = await provider.emitir_factura(_factura())
    assert res.estado == "REJECTED"
    assert res.error and "422" in res.error


def test_factus_map_payload():
    provider = FactusProvider(transport=_factus_transport())
    payload = provider._map_payload(_factura())
    assert payload["reference_code"] == "1001"
    assert payload["customer"]["identification"] == "900123456"
    assert payload["customer"]["tribute_code"] == "ZZ"
    # payment_details: amount = total con IVA
    assert payload["payment_details"][0]["amount"] == 238000
    item = payload["items"][0]
    assert item["code_reference"] == "SKU-1"
    assert item["quantity"] == 2
    assert item["unit_measure_code"] == "94"
    assert item["standard_code"] == "001"
    assert item["taxes"] == [{"code": "01", "rate": "19.00"}]
    # precio base unitario sin IVA: base_gravable(200000)/cantidad(2) = 100000
    assert item["price"] == 100000
