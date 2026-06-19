"""
Router de facturación electrónica.

Expone la factura de una orden al cliente (estado, CUFE, PDF/XML) y permite
forzar/reintentar la emisión (admin). La emisión normal ocurre automáticamente
tras el pago aprobado (hook post-pago en shipping_service).
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from schemas.auth_schema import UserInToken
from services import invoice_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Invoices"], responses={404: {"description": "No encontrado"}})


def _factura_dict(db: Session, id_orden: int):
    return db.execute(
        text(
            """
            SELECT id_factura, id_orden, estado_dian, cufe, prefijo, consecutivo,
                   qr_url, pdf_url, proveedor, ambiente,
                   val_base_gravable, val_total_iva, val_total_excluido, val_total,
                   error_mensaje, fec_insert
            FROM tab_facturas
            WHERE id_orden = :id AND estado_dian <> 'REJECTED'
            ORDER BY id_factura DESC LIMIT 1
            """
        ),
        {"id": id_orden},
    ).mappings().first()


@router.get("/orders/{id_orden}/factura", summary="Factura electrónica de una orden")
async def get_factura_orden(
    id_orden: int,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """Devuelve la factura (si existe) de la orden: estado DIAN, CUFE, PDF/XML, desglose IVA."""
    factura = _factura_dict(db, id_orden)
    if not factura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La orden no tiene factura emitida")
    d = dict(factura)
    numero = f"{d.get('prefijo') or ''}{d.get('consecutivo') or ''}".strip() or None
    d["numero"] = numero
    return d


@router.post("/orders/{id_orden}/factura/emitir", summary="Emitir/reintentar factura (admin)")
async def emitir_factura(
    id_orden: int,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin),
):
    """Fuerza la emisión de la factura de una orden (idempotente por orden)."""
    try:
        return await invoice_service.emitir_factura_para_orden(db, id_orden, usr_insert=int(current_user.id_usuario))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
