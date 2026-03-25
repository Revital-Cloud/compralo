"""
Notificaciones a administradores por stock bajo (1–10) o sin stock (0) en variantes.

Alineado con el listado admin: stock bajo = suma por producto entre 1 y 10; aquí se aplica por variante.
Solo email (Resend). Destinatarios: usuarios con id_rol = 1 (Admin) activos.
"""
import logging
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from services.email_service import (
    LOW_STOCK_VARIANT_THRESHOLD,
    send_low_stock_variant_notification_sync,
    send_out_of_stock_notification_sync,
)

# Mismo umbral que el listado de productos admin (stock bajo = 1..MAX por variante)
LOW_STOCK_MAX = LOW_STOCK_VARIANT_THRESHOLD

logger = logging.getLogger(__name__)

ADMIN_ROLE_ID = Decimal("1")


def get_admin_emails(db: Session) -> List[str]:
    """Emails de administradores activos."""
    try:
        rows = db.execute(
            text(
                """
                SELECT DISTINCT TRIM(email_usuario) AS em
                FROM tab_usuarios
                WHERE id_rol = :rid
                  AND COALESCE(ind_activo, TRUE) = TRUE
                  AND email_usuario IS NOT NULL
                  AND TRIM(email_usuario) <> ''
                """
            ),
            {"rid": ADMIN_ROLE_ID},
        ).fetchall()
        out: List[str] = []
        for r in rows:
            if r and r[0]:
                out.append(str(r[0]).strip())
        return out
    except Exception as e:
        logger.error("get_admin_emails: %s", e)
        return []


def notify_variant_out_of_stock(
    db: Session,
    *,
    product_id: int,
    product_name: str,
    variant_id: int,
    sku: Optional[str],
    order_id: Optional[int],
    source_label: str,
) -> None:
    """Envía email a admins; errores solo se registran."""
    try:
        admins = get_admin_emails(db)
        if not admins:
            logger.info("Sin stock: no hay emails de admin configurados, se omite envío.")
            return
        send_out_of_stock_notification_sync(
            product_name=product_name,
            product_id=product_id,
            variant_id=variant_id,
            sku=sku,
            order_id=order_id,
            source_label=source_label,
            admin_emails=admins,
        )
    except Exception as e:
        logger.warning("notify_variant_out_of_stock falló (no bloquea operación): %s", e)


def notify_variant_low_stock(
    db: Session,
    *,
    product_id: int,
    product_name: str,
    variant_id: int,
    sku: Optional[str],
    current_stock: int,
    order_id: Optional[int],
    source_label: str,
) -> None:
    """Stock bajo (1..umbral): aviso al pasar de ‘sano’ (>umbral) a ese rango (evita spam si ya estaba bajo)."""
    try:
        admins = get_admin_emails(db)
        if not admins:
            logger.info("Stock bajo: no hay emails de admin configurados, se omite envío.")
            return
        send_low_stock_variant_notification_sync(
            product_id=product_id,
            product_name=product_name,
            variant_id=variant_id,
            sku=sku,
            current_stock=current_stock,
            order_id=order_id,
            source_label=source_label,
            admin_emails=admins,
        )
    except Exception as e:
        logger.warning("notify_variant_low_stock falló (no bloquea operación): %s", e)


def notify_after_order_paid_stock_change(db: Session, id_orden: Decimal) -> None:
    """
    Tras marcar orden pagada y descontar stock:
    - sin stock (0): correo
    - stock bajo (1..10) si antes había >10: correo (primera entrada al rango)
    """
    try:
        tmax = LOW_STOCK_MAX
        rows = db.execute(
            text(
                """
                SELECT
                    p.id AS product_id,
                    p.name AS product_name,
                    c.id AS variant_id,
                    COALESCE(NULLIF(TRIM(c.sku), ''), '') AS sku,
                    c.stock AS new_stock,
                    op.cant_producto AS qty_sold
                FROM tab_orden_productos op
                JOIN tab_product_variant_combinations c ON c.id = op.variant_id
                JOIN tab_product_variant_groups g ON g.id = c.group_id
                JOIN tab_products p ON p.id = g.product_id
                WHERE op.id_orden = :oid
                """
            ),
            {"oid": id_orden},
        ).mappings().all()
        oid_int = int(id_orden)
        for row in rows:
            new_stock = int(row["new_stock"] or 0)
            qty = int(row["qty_sold"] or 0)
            old_stock = new_stock + qty
            pid = int(row["product_id"])
            pname = str(row["product_name"] or "")
            vid = int(row["variant_id"])
            sku = (row["sku"] or None) or None

            if new_stock == 0:
                notify_variant_out_of_stock(
                    db,
                    product_id=pid,
                    product_name=pname,
                    variant_id=vid,
                    sku=sku,
                    order_id=oid_int,
                    source_label="Venta (orden pagada)",
                )
            elif (
                1 <= new_stock <= tmax
                and old_stock > tmax
            ):
                notify_variant_low_stock(
                    db,
                    product_id=pid,
                    product_name=pname,
                    variant_id=vid,
                    sku=sku,
                    current_stock=new_stock,
                    order_id=oid_int,
                    source_label="Venta (orden pagada)",
                )
    except Exception as e:
        logger.warning("notify_after_order_paid_stock_change: %s", e)
