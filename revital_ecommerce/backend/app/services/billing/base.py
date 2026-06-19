"""
Contrato común de proveedores de facturación electrónica.

Toda implementación (MockProvider, FactusProvider, AlegraProvider) cumple esta
interfaz, por lo que el resto del sistema (invoice_service, webhooks) no depende
de ningún proveedor en concreto. Cambiar de proveedor = cambiar la clase, no la
lógica de negocio.
"""
from abc import ABC, abstractmethod

from schemas.billing_schema import FacturaInput, FacturaResult


class BillingProvider(ABC):
    """Proveedor de facturación electrónica (validación previa DIAN)."""

    #: identificador corto del proveedor ('mock', 'factus', 'alegra')
    name: str = "base"

    @abstractmethod
    async def emitir_factura(self, factura: FacturaInput) -> FacturaResult:
        """
        Emite y valida una factura electrónica ante la DIAN (vía proveedor).

        Debe ser idempotente respecto a `factura.referencia`: emitir dos veces la
        misma referencia no debe generar dos folios. El proveedor que no soporte
        idempotencia nativa la delega al invoice_service (UNIQUE por orden).
        """
        raise NotImplementedError
