"""
Capa de facturación electrónica (abstracción de proveedor).

Uso:
    from services.billing import get_billing_provider
    provider = get_billing_provider()
    result = await provider.emitir_factura(factura)

El proveedor activo se controla con settings.BILLING_PROVIDER ('mock' | 'factus').
Si se pide 'factus' pero faltan credenciales, cae a 'mock' (con advertencia) para
no romper el flujo en entornos sin configurar.
"""
import logging

from core.config import settings
from services.billing.base import BillingProvider
from services.billing.factus_provider import FactusProvider
from services.billing.mock_provider import MockProvider

logger = logging.getLogger(__name__)


def _factus_configurado() -> bool:
    return all(
        [
            settings.FACTUS_CLIENT_ID,
            settings.FACTUS_CLIENT_SECRET,
            settings.FACTUS_USERNAME,
            settings.FACTUS_PASSWORD,
        ]
    )


def get_billing_provider(name: str | None = None) -> BillingProvider:
    """Devuelve el proveedor de facturación activo."""
    provider = (name or settings.BILLING_PROVIDER or "mock").lower()

    if provider == "factus":
        if _factus_configurado():
            return FactusProvider()
        logger.warning(
            "BILLING_PROVIDER=factus pero faltan credenciales FACTUS_*; usando MockProvider."
        )
        return MockProvider()

    return MockProvider()


__all__ = ["BillingProvider", "MockProvider", "FactusProvider", "get_billing_provider"]
