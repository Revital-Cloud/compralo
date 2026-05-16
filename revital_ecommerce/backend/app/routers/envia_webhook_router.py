"""Webhook público Envia (actualización de tracking)."""

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from core.database import get_db
from services.shipping_service import apply_envia_tracking_update, parse_envia_webhook_body

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/envia", include_in_schema=False)
async def envia_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        raw: Dict[str, Any] = await request.json()
    except Exception:
        raw = {}
    tn, st = parse_envia_webhook_body(raw)
    if not tn:
        logger.warning("envia_webhook: sin trackingNumber en payload")
        return {"ok": True}
    apply_envia_tracking_update(db, tn, st)
    return {"ok": True}
