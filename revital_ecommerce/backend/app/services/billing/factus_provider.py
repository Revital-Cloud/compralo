"""
FactusProvider: proveedor real de facturación electrónica (Factus, API v2).

Flujo:
  1. OAuth2 password-grant -> access_token (~1h) en POST /oauth/token
  2. POST /v2/bills/validate con el payload de la factura -> DIAN valida -> CUFE

El mapeo FacturaInput -> payload Factus vive en `_map_payload` y está aislado
a propósito: los códigos exactos (tipo de documento, unidad de medida, tributo,
municipio) deben confirmarse contra el sandbox de Factus de tu cuenta. La clase
es totalmente testeable inyectando un httpx transport (ver tests).
"""
import logging
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

import httpx

from core.config import settings
from schemas.billing_schema import FacturaInput, FacturaResult
from services.billing.base import BillingProvider

logger = logging.getLogger(__name__)

# Códigos de catálogo Factus v2 (verificados contra el sandbox real).
_DEFAULT_UNIT_MEASURE_CODE = "94"      # unidad
_DEFAULT_LEGAL_ORG_CODE = "2"          # 1=Persona jurídica, 2=Persona natural
_DEFAULT_TRIBUTE_CODE = "ZZ"           # ZZ=No aplica (cliente B2C)
_DEFAULT_MUNICIPALITY = "11001"        # Bogotá D.C.
_DEFAULT_STANDARD_CODE = "001"
_DEFAULT_PAYMENT_FORM = "1"            # 1=Contado
_DEFAULT_PAYMENT_METHOD = "10"         # 10=Efectivo
_IVA_TAX_CODE = "01"                   # 01=IVA (catálogo DIAN)


class FactusProvider(BillingProvider):
    name = "factus"

    def __init__(self, transport: Optional[httpx.AsyncBaseTransport] = None):
        self.base_url = settings.FACTUS_BASE_URL.rstrip("/")
        self.ambiente = "sandbox" if "sandbox" in self.base_url else "production"
        # transport inyectable para tests (httpx.MockTransport).
        self._transport = transport

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self.base_url, transport=self._transport, timeout=30.0
        )

    async def _get_token(self, client: httpx.AsyncClient) -> str:
        """OAuth2 password-grant. Devuelve el access_token."""
        resp = await client.post(
            "/oauth/token",
            data={
                "grant_type": "password",
                "client_id": settings.FACTUS_CLIENT_ID,
                "client_secret": settings.FACTUS_CLIENT_SECRET,
                "username": settings.FACTUS_USERNAME,
                "password": settings.FACTUS_PASSWORD,
            },
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    def _map_payload(self, factura: FacturaInput) -> dict:
        """Convierte FacturaInput al JSON que espera POST /v2/bills/validate (Factus v2)."""
        cli = factura.cliente
        items = []
        # IVA incluido: la base se descompone del precio bruto CON 2 decimales
        # (centavos), para que el total que recalcula Factus (base + base*tarifa)
        # cuadre EXACTO con lo cobrado al cliente. Enviar la base como entero
        # producía descuadres de centavos (Factus rechaza si payment != total).
        amount_total = Decimal("0")
        _CENT = Decimal("0.01")
        for ln in factura.lineas:
            cantidad = ln.cantidad or 1
            gross_unit = Decimal(ln.precio_unitario)  # IVA incluido (pesos enteros)
            excluido = ln.tipo_iva == "EXCLUIDO"
            rate = ln.porcentaje_iva
            if excluido or rate == 0:
                price_unit = gross_unit
            else:
                # base unitaria con centavos -> base*(1+tarifa) ≈ bruto
                price_unit = (gross_unit / (Decimal(1) + rate)).quantize(_CENT, rounding=ROUND_HALF_UP)

            line_base = price_unit * cantidad
            line_tax = Decimal("0") if (excluido or rate == 0) else (
                line_base * rate
            ).quantize(_CENT, rounding=ROUND_HALF_UP)
            amount_total += line_base + line_tax
            items.append(
                {
                    "code_reference": ln.code_reference,
                    "name": ln.descripcion,
                    "quantity": ln.cantidad,
                    "discount_rate": 0,
                    "price": float(price_unit),
                    "unit_measure_code": _DEFAULT_UNIT_MEASURE_CODE,
                    "standard_code": _DEFAULT_STANDARD_CODE,
                    "is_excluded": 1 if excluido else 0,
                    "taxes": [
                        {"code": _IVA_TAX_CODE, "rate": f"{(rate * 100):.2f}"}
                    ],
                }
            )

        range_id = factura.numbering_range_id or settings.FACTUS_NUMBERING_RANGE_ID
        return {
            "numbering_range_id": int(range_id) if range_id else None,
            "reference_code": factura.referencia,
            "observation": factura.observacion or "",
            # En producción (empresa con correo configurado) Factus envía PDF+XML
            # al cliente automáticamente. En el sandbox compartido viene desactivado.
            "send_email": True,
            "payment_details": [
                {
                    "payment_form": _DEFAULT_PAYMENT_FORM,
                    "payment_method_code": _DEFAULT_PAYMENT_METHOD,
                    "amount": float(amount_total),
                }
            ],
            "customer": {
                "identification": cli.identificacion,
                "identification_document_code": cli.tipo_documento,
                "names": cli.nombre,
                "email": cli.email or "",
                "phone": cli.telefono or "",
                "address": cli.direccion or "",
                "legal_organization_code": _DEFAULT_LEGAL_ORG_CODE,
                "tribute_code": _DEFAULT_TRIBUTE_CODE,
                "municipality_code": cli.cod_municipio or _DEFAULT_MUNICIPALITY,
            },
            "items": items,
        }

    def _parse_response(self, payload: dict) -> FacturaResult:
        """Normaliza la respuesta de Factus v2 a FacturaResult.

        Estructura real (verificada): data.{number, cufe, links:{qr, public_url}}.
        """
        data = payload.get("data", payload) or {}
        links = data.get("links") or {}
        cufe = data.get("cufe")
        return FacturaResult(
            estado="ACCEPTED" if cufe else "SENT",
            cufe=cufe,
            numero=data.get("number"),
            qr_url=links.get("qr"),
            pdf_url=links.get("public_url"),
            xml=data.get("xml_base_64_encoded") or data.get("xml"),
            proveedor=self.name,
            ambiente=self.ambiente,
            referencia_externa=data.get("reference_code"),
            raw=payload,
        )

    async def emitir_factura(self, factura: FacturaInput) -> FacturaResult:
        try:
            async with self._client() as client:
                token = await self._get_token(client)
                resp = await client.post(
                    "/v2/bills/validate",
                    json=self._map_payload(factura),
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/json",
                    },
                )
                resp.raise_for_status()
                result = self._parse_response(resp.json())
                result.referencia_externa = result.referencia_externa or factura.referencia
                return result
        except httpx.HTTPStatusError as e:
            body = e.response.text[:1000]
            logger.error("Factus rechazó la factura %s: %s", factura.referencia, body)
            return FacturaResult(
                estado="REJECTED",
                proveedor=self.name,
                ambiente=self.ambiente,
                referencia_externa=factura.referencia,
                error=f"HTTP {e.response.status_code}: {body}",
            )
        except Exception as e:  # red, timeout, parsing
            logger.exception("Error emitiendo factura %s con Factus", factura.referencia)
            return FacturaResult(
                estado="PENDING",
                proveedor=self.name,
                ambiente=self.ambiente,
                referencia_externa=factura.referencia,
                error=str(e),
            )
