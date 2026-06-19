"""
MockProvider: simula un proveedor de facturación SIN red ni credenciales.

Permite correr y probar el flujo completo (orden -> IVA -> factura -> CUFE ->
estado ACCEPTED) hoy mismo, sin signup ni NIT. El CUFE es determinístico a partir
de la referencia, para que las pruebas sean reproducibles.
"""
import hashlib

from schemas.billing_schema import FacturaInput, FacturaResult
from services.billing.base import BillingProvider


class MockProvider(BillingProvider):
    name = "mock"

    async def emitir_factura(self, factura: FacturaInput) -> FacturaResult:
        # CUFE simulado: SHA-384 (mismo algoritmo que la DIAN) sobre la referencia,
        # solo para que tenga el formato/longitud realista. NO tiene validez fiscal.
        digest = hashlib.sha384(factura.referencia.encode("utf-8")).hexdigest()
        numero = f"MOCK{factura.referencia}"
        return FacturaResult(
            estado="ACCEPTED",
            cufe=digest,
            numero=numero,
            qr_url=f"https://mock.local/qr/{digest[:24]}",
            pdf_url=f"https://mock.local/pdf/{numero}.pdf",
            xml=f"<Invoice><ID>{numero}</ID><UUID>{digest}</UUID></Invoice>",
            proveedor=self.name,
            ambiente="mock",
            referencia_externa=factura.referencia,
            raw={"mock": True, "referencia": factura.referencia},
        )
