from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from core.config import settings
from services.email_service import send_abandoned_cart_email


@dataclass
class AbandonedCartCandidate:
    cart_id: int
    user_id: int
    user_name: str
    user_email: str
    last_activity: datetime
    cart_total: float


def _format_money(value: Any) -> str:
    try:
        return f"{int(float(value or 0)):,}".replace(",", ".")
    except (TypeError, ValueError):
        return "0"


def _checkout_url() -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/cart"


def _ensure_tracking_table(db: Session) -> None:
    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS tab_abandoned_cart_email_tracking (
                id_tracking BIGSERIAL PRIMARY KEY,
                id_carrito NUMERIC(10) NOT NULL,
                id_usuario NUMERIC(10) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                last_sent_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                last_error TEXT NULL,
                send_count INTEGER NOT NULL DEFAULT 1,
                fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                fec_update TIMESTAMP WITHOUT TIME ZONE NULL
            )
            """
        )
    )
    db.execute(
        text(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS uq_abandoned_cart_email_tracking_cart
            ON tab_abandoned_cart_email_tracking(id_carrito)
            """
        )
    )
    db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS idx_abandoned_cart_email_tracking_last_sent
            ON tab_abandoned_cart_email_tracking(last_sent_at)
            """
        )
    )
    db.commit()


def _get_candidates(
    db: Session,
    inactivity_hours: int,
    cooldown_hours: int,
    batch_limit: int,
) -> List[AbandonedCartCandidate]:
    query = text(
        """
        WITH cart_candidates AS (
            SELECT
                c.id_carrito,
                c.id_usuario,
                u.nom_usuario,
                u.email_usuario,
                COALESCE(c.fec_update, c.fec_insert) AS last_activity,
                SUM(cp.cantidad * cp.precio_unitario_carrito) AS cart_total
            FROM tab_carritos c
            JOIN tab_usuarios u ON u.id_usuario = c.id_usuario
            JOIN tab_carrito_productos cp ON cp.id_carrito = c.id_carrito
            LEFT JOIN tab_abandoned_cart_email_tracking tr ON tr.id_carrito = c.id_carrito
            WHERE c.id_usuario IS NOT NULL
              AND u.email_usuario IS NOT NULL
              AND TRIM(u.email_usuario) <> ''
              AND COALESCE(c.fec_update, c.fec_insert) <= NOW() - (:inactivity_hours * INTERVAL '1 hour')
              AND (
                tr.last_sent_at IS NULL
                OR tr.last_sent_at <= NOW() - (:cooldown_hours * INTERVAL '1 hour')
              )
              AND NOT EXISTS (
                SELECT 1
                FROM tab_pagos p
                WHERE p.reference LIKE ('revital_cart_' || c.id_carrito::text || '_%')
                  AND UPPER(COALESCE(p.status, '')) = 'APPROVED'
                  AND p.fec_insert >= COALESCE(c.fec_update, c.fec_insert)
              )
            GROUP BY
                c.id_carrito,
                c.id_usuario,
                u.nom_usuario,
                u.email_usuario,
                COALESCE(c.fec_update, c.fec_insert)
        )
        SELECT *
        FROM cart_candidates
        ORDER BY last_activity ASC
        LIMIT :batch_limit
        """
    )
    rows = db.execute(
        query,
        {
            "inactivity_hours": inactivity_hours,
            "cooldown_hours": cooldown_hours,
            "batch_limit": batch_limit,
        },
    ).mappings().all()
    return [
        AbandonedCartCandidate(
            cart_id=int(row["id_carrito"]),
            user_id=int(row["id_usuario"]),
            user_name=(row["nom_usuario"] or "Cliente").strip(),
            user_email=row["email_usuario"].strip(),
            last_activity=row["last_activity"],
            cart_total=float(row["cart_total"] or 0),
        )
        for row in rows
    ]


def _get_cart_items_for_email(db: Session, cart_id: int) -> List[Dict[str, Any]]:
    query = text(
        """
        SELECT
            cp.cantidad,
            cp.precio_unitario_carrito,
            p.name AS product_name,
            COALESCE(
                (
                    SELECT pvi.image_url
                    FROM tab_product_variant_images pvi
                    WHERE pvi.variant_group_id = pv.group_id
                    ORDER BY pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
                    LIMIT 1
                ),
                (
                    SELECT pvi2.image_url
                    FROM tab_product_variant_images pvi2
                    JOIN tab_product_variant_groups g2 ON g2.id = pvi2.variant_group_id
                    WHERE g2.product_id = p.id
                    ORDER BY pvi2.is_primary DESC NULLS LAST, pvi2.sort_order NULLS LAST, pvi2.id
                    LIMIT 1
                )
            ) AS image_url
        FROM tab_carrito_productos cp
        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id AND pv.is_active = TRUE
        JOIN tab_product_variant_groups g ON g.id = pv.group_id
        JOIN tab_products p ON p.id = g.product_id AND p.is_active = TRUE
        WHERE cp.id_carrito = :cart_id
        ORDER BY cp.fec_insert DESC
        """
    )
    rows = db.execute(query, {"cart_id": cart_id}).mappings().all()

    items: List[Dict[str, Any]] = []
    for row in rows:
        qty = int(row["cantidad"] or 0)
        unit_price = float(row["precio_unitario_carrito"] or 0)
        subtotal = qty * unit_price
        items.append(
            {
                "product_name": row["product_name"] or "Producto",
                "quantity": qty,
                "unit_price": _format_money(unit_price),
                "price": _format_money(subtotal),
                "image_url": row["image_url"],
            }
        )
    return items


def _register_sent_email(db: Session, candidate: AbandonedCartCandidate) -> None:
    db.execute(
        text(
            """
            INSERT INTO tab_abandoned_cart_email_tracking (
                id_carrito, id_usuario, user_email, last_sent_at, last_error, send_count, fec_insert, fec_update
            ) VALUES (
                :cart_id, :user_id, :user_email, NOW(), NULL, 1, NOW(), NOW()
            )
            ON CONFLICT (id_carrito)
            DO UPDATE SET
                id_usuario = EXCLUDED.id_usuario,
                user_email = EXCLUDED.user_email,
                last_sent_at = NOW(),
                last_error = NULL,
                send_count = tab_abandoned_cart_email_tracking.send_count + 1,
                fec_update = NOW()
            """
        ),
        {
            "cart_id": candidate.cart_id,
            "user_id": candidate.user_id,
            "user_email": candidate.user_email,
        },
    )


def _register_send_error(db: Session, candidate: AbandonedCartCandidate, error_message: str) -> None:
    db.execute(
        text(
            """
            INSERT INTO tab_abandoned_cart_email_tracking (
                id_carrito, id_usuario, user_email, last_sent_at, last_error, send_count, fec_insert, fec_update
            ) VALUES (
                :cart_id, :user_id, :user_email, NOW(), :last_error, 0, NOW(), NOW()
            )
            ON CONFLICT (id_carrito)
            DO UPDATE SET
                id_usuario = EXCLUDED.id_usuario,
                user_email = EXCLUDED.user_email,
                last_error = :last_error,
                fec_update = NOW()
            """
        ),
        {
            "cart_id": candidate.cart_id,
            "user_id": candidate.user_id,
            "user_email": candidate.user_email,
            "last_error": error_message[:1000],
        },
    )


async def process_abandoned_cart_emails(
    db: Session,
    inactivity_hours: int | None = None,
    cooldown_hours: int | None = None,
    batch_limit: int | None = None,
) -> Dict[str, Any]:
    inactivity = inactivity_hours or settings.ABANDONED_CART_INACTIVITY_HOURS
    cooldown = cooldown_hours or settings.ABANDONED_CART_SEND_COOLDOWN_HOURS
    limit = batch_limit or settings.ABANDONED_CART_BATCH_LIMIT

    _ensure_tracking_table(db)
    candidates = _get_candidates(db, inactivity_hours=inactivity, cooldown_hours=cooldown, batch_limit=limit)

    processed = 0
    emails_sent = 0
    skipped = 0
    errors: List[Dict[str, Any]] = []

    for candidate in candidates:
        processed += 1
        items = _get_cart_items_for_email(db, candidate.cart_id)
        if not items:
            skipped += 1
            continue

        cart_payload = {
            "user_email": candidate.user_email,
            "user_name": candidate.user_name,
            "checkout_url": _checkout_url(),
            "cart_last_activity": candidate.last_activity.strftime("%d/%m/%Y %H:%M"),
            "cart": {
                "items": items,
                "total": _format_money(candidate.cart_total),
            },
        }

        try:
            sent = await send_abandoned_cart_email(cart_payload)
            if sent:
                emails_sent += 1
                _register_sent_email(db, candidate)
            else:
                _register_send_error(db, candidate, "No se pudo enviar email con Resend")
                errors.append(
                    {
                        "cart_id": candidate.cart_id,
                        "user_id": candidate.user_id,
                        "email": candidate.user_email,
                        "error": "No se pudo enviar email con Resend",
                    }
                )
        except Exception as exc:
            _register_send_error(db, candidate, str(exc))
            errors.append(
                {
                    "cart_id": candidate.cart_id,
                    "user_id": candidate.user_id,
                    "email": candidate.user_email,
                    "error": str(exc),
                }
            )

    db.commit()
    return {
        "success": True,
        "message": "Procesamiento de carritos abandonados completado",
        "candidates_found": len(candidates),
        "processed": processed,
        "emails_sent": emails_sent,
        "skipped": skipped,
        "errors": errors or None,
    }
