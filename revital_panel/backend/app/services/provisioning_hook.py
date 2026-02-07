"""
Hook de notificación para provisioning externo.

Si PROVISIONING_WEBHOOK_URL está definida, tras crear una instancia se envía
un POST a esa URL con el payload de la instancia. El provisionador (servicio
externo en otro servidor) crea la BD y despliega synkro_ecommerce y luego
actualiza la instancia en el panel. El panel no ejecuta provisioning en su servidor.
"""
import logging
import threading
from typing import Any

from schemas.instancia_schema import InstanciaCreate

logger = logging.getLogger(__name__)


def _post_webhook_sync(url: str, payload: dict[str, Any]) -> None:
    """Envía POST al webhook; no debe bloquear la respuesta al usuario."""
    try:
        import httpx
        with httpx.Client(timeout=30.0) as client:
            r = client.post(url, json=payload)
            r.raise_for_status()
    except Exception as e:
        logger.warning("Provisioning webhook failed: %s", e, exc_info=True)


def notify_provisioner(webhook_url: str, create_result: dict, instancia: InstanciaCreate) -> None:
    """
    Notifica al provisionador externo en segundo plano.

    Payload enviado: id_instancia, slug_instancia, db_nombre, nom_instancia,
    region_deployment, y el resto de campos de la instancia creada.
    """
    id_instancia = create_result.get("id_instancia")
    if id_instancia is None:
        return
    payload = {
        "id_instancia": float(id_instancia) if hasattr(id_instancia, "__float__") else id_instancia,
        "slug_instancia": instancia.slug_instancia,
        "db_nombre": instancia.db_nombre,
        "nom_instancia": instancia.nom_instancia,
        "identificacion_fiscal_cliente": instancia.identificacion_fiscal_cliente,
        "region_deployment": instancia.region_deployment or "us-east-1",
        "version_instancia": instancia.version_instancia or "1.0.0",
        "subdominio": instancia.subdominio,
        "dominio_personalizado": instancia.dominio_personalizado,
        "estado_instancia": instancia.estado_instancia or "creando",
    }
    if instancia.config_json:
        payload["config_json"] = instancia.config_json
    thread = threading.Thread(target=_post_webhook_sync, args=(webhook_url, payload), daemon=True)
    thread.start()
