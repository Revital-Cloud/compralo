"""
invoice_service: orquesta la emisión de la factura electrónica de una orden.

Flujo:
  1. Idempotencia: si la orden ya tiene una factura no-rechazada, la devuelve.
  2. Carga orden + ítems (con su clasificación de IVA) + datos del cliente.
  3. Descompone el IVA con tax_service (precios CON IVA incluido).
  4. Inserta tab_facturas (PENDING) + tab_factura_lineas (snapshot inmutable).
  5. Llama al BillingProvider activo (mock/factus) -> CUFE.
  6. Actualiza la factura con el resultado (estado, CUFE, PDF, XML).

No toca el flujo de creación de la orden (fun_crear_orden_desde_carrito); se
ejecuta DESPUÉS del pago aprobado.
"""
import json
import logging
import secrets
from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.orm import Session

from schemas.billing_schema import FacturaCliente, FacturaInput, FacturaLinea
from schemas.tax_schema import TaxLineInput
from services.billing import get_billing_provider
from services.tax_service import DEFAULT_TAX_RATE_ID, compute_breakdown, decompose_iva, get_tax_rates

logger = logging.getLogger(__name__)

# Adquiriente genérico cuando el comprador no entrega documento (B2C típico).
CONSUMIDOR_FINAL_ID = "222222222222"
CONSUMIDOR_FINAL_TIPO_DOC = "13"  # Cédula de ciudadanía (catálogo DIAN)


def _next_id(db: Session, table: str, pk: str) -> int:
    row = db.execute(text(f"SELECT COALESCE(MAX({pk}), 0) + 1 AS n FROM {table}")).first()
    return int(row[0])


def _factura_aceptada(db: Session, id_orden: int):
    """Devuelve la factura ACEPTADA de la orden, si existe (idempotencia)."""
    return db.execute(
        text(
            """
            SELECT id_factura, estado_dian, cufe, prefijo, consecutivo, pdf_url
            FROM tab_facturas
            WHERE id_orden = :id AND estado_dian = 'ACCEPTED'
            ORDER BY id_factura DESC LIMIT 1
            """
        ),
        {"id": id_orden},
    ).mappings().first()


def _limpiar_intentos_previos(db: Session, id_orden: int) -> None:
    """Borra intentos no aceptados (PENDING/SENT/REJECTED) para permitir reintento limpio."""
    db.execute(
        text(
            """
            DELETE FROM tab_factura_lineas WHERE id_factura IN (
                SELECT id_factura FROM tab_facturas
                WHERE id_orden = :id AND estado_dian <> 'ACCEPTED'
            )
            """
        ),
        {"id": id_orden},
    )
    db.execute(
        text("DELETE FROM tab_facturas WHERE id_orden = :id AND estado_dian <> 'ACCEPTED'"),
        {"id": id_orden},
    )
    db.commit()


def _cargar_orden(db: Session, id_orden: int):
    """Cabecera de la orden + datos del cliente."""
    return db.execute(
        text(
            """
            SELECT o.id_orden, o.id_usuario, o.val_total_productos, o.val_total_descuentos,
                   o.val_costo_envio, o.val_total_pedido,
                   u.nom_usuario, u.ape_usuario, u.email_usuario, u.cel_usuario
            FROM tab_ordenes o
            JOIN tab_usuarios u ON u.id_usuario = o.id_usuario
            WHERE o.id_orden = :id
            """
        ),
        {"id": id_orden},
    ).mappings().first()


def _cargar_items(db: Session, id_orden: int):
    """Ítems de la orden con SKU y clasificación de IVA del producto."""
    return db.execute(
        text(
            """
            SELECT pv.sku AS sku,
                   COALESCE(p.name, 'Producto') AS nombre,
                   op.cant_producto AS cantidad,
                   op.precio_unitario_orden AS precio_unitario,
                   p.id_tarifa_iva AS id_tarifa_iva
            FROM tab_orden_productos op
            LEFT JOIN tab_product_variant_combinations pv ON pv.id = op.variant_id
            LEFT JOIN tab_product_variant_groups g ON g.id = pv.group_id
            LEFT JOIN tab_products p ON p.id = g.product_id
            WHERE op.id_orden = :id
            ORDER BY op.id_orden_producto ASC
            """
        ),
        {"id": id_orden},
    ).mappings().all()


def _build_factura_input(db: Session, orden, items) -> tuple[FacturaInput, list]:
    """Construye el FacturaInput (con IVA descompuesto) y las filas para tab_factura_lineas.

    Refleja lo REALMENTE pagado:
    - Descuentos (automáticos, código y canje de puntos): val_total_descuentos los
      engloba (CHECK de la orden). Se reparten proporcionalmente sobre el precio de
      cada producto, así el IVA se calcula sobre la base ya descontada.
    - Envío: se agrega como línea para que el total de la factura = val_total_pedido.
    """
    rates = get_tax_rates(db)

    val_prod = Decimal(str(orden["val_total_productos"] or 0))
    val_desc = Decimal(str(orden["val_total_descuentos"] or 0))
    val_envio = Decimal(str(orden["val_costo_envio"] or 0))
    # Factor de descuento proporcional aplicado al precio de cada producto.
    ratio = ((val_prod - val_desc) / val_prod) if val_prod > 0 else Decimal(1)

    tax_lines = [
        TaxLineInput(
            descripcion=it["nombre"],
            cantidad=int(it["cantidad"]),
            # precio unitario NETO (con IVA incluido) tras aplicar el descuento.
            precio_unitario=Decimal(str(it["precio_unitario"])) * ratio,
            id_tarifa_iva=int(it["id_tarifa_iva"]) if it["id_tarifa_iva"] is not None else None,
        )
        for it in items
    ]
    breakdown = compute_breakdown(tax_lines, rates)

    lineas = []
    for it, res in zip(items, breakdown.lineas):
        lineas.append(
            FacturaLinea(
                code_reference=it["sku"] or it["nombre"][:40],
                descripcion=it["nombre"],
                cantidad=res.cantidad,
                precio_unitario=res.precio_unitario_bruto,
                tipo_iva=res.tipo_iva,
                porcentaje_iva=res.val_porcentaje,
                base_gravable=res.base_gravable,
                val_iva=res.val_iva,
                total_linea=res.total_bruto,
            )
        )

    val_base = breakdown.base_gravable
    val_iva = breakdown.val_total_iva
    val_excl = breakdown.val_total_excluido
    val_total = breakdown.total_bruto

    # Envío como línea gravada (Art. 447 ET: el transporte accesorio a una venta
    # gravada hace parte de la base. Confirmar tratamiento con el contador).
    if val_envio > 0:
        ship_rate = rates[DEFAULT_TAX_RATE_ID]  # 19% general
        ship_base, ship_iva = decompose_iva(val_envio, ship_rate.val_porcentaje)
        lineas.append(
            FacturaLinea(
                code_reference="ENVIO",
                descripcion="Costo de envío",
                cantidad=1,
                precio_unitario=val_envio,
                tipo_iva="GRAVADO",
                porcentaje_iva=ship_rate.val_porcentaje,
                base_gravable=ship_base,
                val_iva=ship_iva,
                total_linea=val_envio,
            )
        )
        val_base += ship_base
        val_iva += ship_iva
        val_total += val_envio

    nombre = f"{orden['nom_usuario']} {orden['ape_usuario']}".strip()
    # En este sistema id_usuario ES la cédula del cliente. Si por algún motivo
    # falta, se factura a "consumidor final" (B2C sin documento).
    cedula = str(int(orden["id_usuario"])) if orden.get("id_usuario") is not None else None
    cliente = FacturaCliente(
        identificacion=cedula or CONSUMIDOR_FINAL_ID,
        tipo_documento=CONSUMIDOR_FINAL_TIPO_DOC,  # 13 = Cédula de ciudadanía
        nombre=nombre or "Consumidor final",
        email=orden["email_usuario"],
        telefono=orden["cel_usuario"],
    )

    # reference_code ÚNICO: el sandbox de Factus es compartido, un id corto (p.ej.
    # "84") colisiona con documentos de otros y Factus devolvería el ajeno.
    referencia = f"REVITAL-{int(orden['id_orden'])}-{secrets.token_hex(4)}"
    factura = FacturaInput(
        referencia=referencia,
        cliente=cliente,
        lineas=lineas,
        val_base_gravable=val_base,
        val_total_iva=val_iva,
        val_total_excluido=val_excl,
        val_total_descuento=val_desc,
        val_total=val_total,
        observacion=f"Orden {int(orden['id_orden'])}",
    )
    return factura, lineas


def _insert_factura_pending(db: Session, orden, factura: FacturaInput, lineas, usr_insert: int) -> int:
    provider = get_billing_provider()
    id_factura = _next_id(db, "tab_facturas", "id_factura")
    db.execute(
        text(
            """
            INSERT INTO tab_facturas
                (id_factura, id_orden, val_base_gravable, val_total_iva, val_total_excluido,
                 val_total_descuento, val_total, estado_dian, proveedor, ambiente,
                 referencia_externa, usr_insert, fec_insert)
            VALUES
                (:id, :id_orden, :base, :iva, :excl, :desc, :total, 'PENDING',
                 :prov, :amb, :ref, :usr, NOW())
            """
        ),
        {
            "id": id_factura,
            "id_orden": int(orden["id_orden"]),
            "base": int(factura.val_base_gravable),
            "iva": int(factura.val_total_iva),
            "excl": int(factura.val_total_excluido),
            "desc": int(factura.val_total_descuento),
            "total": int(factura.val_total),
            "prov": provider.name,
            "amb": "sandbox",
            "ref": factura.referencia,
            "usr": usr_insert,
        },
    )
    for ln in lineas:
        db.execute(
            text(
                """
                INSERT INTO tab_factura_lineas
                    (id_factura_linea, id_factura, descripcion, cantidad, precio_unitario,
                     tipo_iva, porcentaje_iva, base_gravable, val_iva, total_linea, usr_insert)
                VALUES
                    (:id, :id_factura, :desc, :cant, :precio, :tipo, :pct, :base, :iva, :total, :usr)
                """
            ),
            {
                "id": _next_id(db, "tab_factura_lineas", "id_factura_linea"),
                "id_factura": id_factura,
                "desc": ln.descripcion,
                "cant": ln.cantidad,
                "precio": int(ln.precio_unitario),
                "tipo": ln.tipo_iva,
                "pct": float(ln.porcentaje_iva),
                "base": int(ln.base_gravable),
                "iva": int(ln.val_iva),
                "total": int(ln.total_linea),
                "usr": usr_insert,
            },
        )
    db.commit()
    return id_factura


def _update_factura_result(db: Session, id_factura: int, result) -> None:
    prefijo, consecutivo = "", None
    if result.numero:
        # Separa prefijo alfabético del consecutivo numérico (p.ej. SETP990000001).
        digits = "".join(c for c in result.numero if c.isdigit())
        prefijo = "".join(c for c in result.numero if not c.isdigit())
        consecutivo = int(digits) if digits else None

    db.execute(
        text(
            """
            UPDATE tab_facturas
            SET estado_dian = :estado, cufe = :cufe, qr_url = :qr, pdf_url = :pdf,
                xml_factura = :xml, prefijo = :prefijo, consecutivo = :consecutivo,
                respuesta_proveedor = CAST(:raw AS JSONB), error_mensaje = :error,
                fec_update = NOW()
            WHERE id_factura = :id
            """
        ),
        {
            "estado": result.estado,
            "cufe": result.cufe,
            "qr": result.qr_url,
            "pdf": result.pdf_url,
            "xml": result.xml,
            "prefijo": prefijo,
            "consecutivo": consecutivo,
            "raw": json.dumps(result.raw) if result.raw else None,
            "error": result.error,
            "id": id_factura,
        },
    )
    db.commit()


async def emitir_factura_para_orden(db: Session, id_orden: int, usr_insert: int = 0) -> dict:
    """
    Emite (o devuelve) la factura electrónica de una orden. Idempotente por orden.
    Devuelve un dict con id_factura, estado_dian, cufe, numero, pdf_url.
    """
    id_orden = int(id_orden)

    aceptada = _factura_aceptada(db, id_orden)
    if aceptada:
        logger.info("Factura ya ACEPTADA para orden %s (idempotente)", id_orden)
        return dict(aceptada)

    orden = _cargar_orden(db, id_orden)
    if not orden:
        raise ValueError(f"Orden {id_orden} no encontrada")
    items = _cargar_items(db, id_orden)
    if not items:
        raise ValueError(f"Orden {id_orden} sin ítems; no se puede facturar")

    # Limpia intentos previos no aceptados para reintentar sin violar el índice único.
    _limpiar_intentos_previos(db, id_orden)
    factura, lineas = _build_factura_input(db, orden, items)
    id_factura = _insert_factura_pending(db, orden, factura, lineas, usr_insert)

    # Asigna el rango de numeración del proveedor (Factus) si está configurado.
    from core.config import settings
    if settings.FACTUS_NUMBERING_RANGE_ID and not factura.numbering_range_id:
        factura.numbering_range_id = settings.FACTUS_NUMBERING_RANGE_ID

    provider = get_billing_provider()
    result = await provider.emitir_factura(factura)
    _update_factura_result(db, id_factura, result)

    # Correo propio con la factura al cliente (no bloquea; idempotente por orden).
    if result.estado == "ACCEPTED":
        try:
            from services.email_service import schedule_background_task, send_invoice_email
            nombre = f"{orden['nom_usuario']} {orden['ape_usuario']}".strip()
            schedule_background_task(
                send_invoice_email(
                    user_email=orden["email_usuario"],
                    user_name=nombre,
                    order_id=id_orden,
                    numero=result.numero,
                    cufe=result.cufe,
                    pdf_url=result.pdf_url,
                )
            )
        except Exception as e:
            logger.warning("No se pudo programar email de factura orden %s: %s", id_orden, e)

    logger.info(
        "Factura orden=%s -> id_factura=%s estado=%s cufe=%s",
        id_orden, id_factura, result.estado, (result.cufe or "")[:16],
    )
    return {
        "id_factura": id_factura,
        "estado_dian": result.estado,
        "cufe": result.cufe,
        "numero": result.numero,
        "pdf_url": result.pdf_url,
        "error": result.error,
    }


async def emitir_factura_safe(db: Session, id_orden: int, usr_insert: int = 0) -> dict | None:
    """
    Versión tolerante a fallos para usar en hooks post-pago: NUNCA relanza.
    Si la facturación falla, lo registra y devuelve None (la orden/pago no se ven
    afectados). Reintentar luego es seguro gracias a la idempotencia por orden.
    """
    try:
        return await emitir_factura_para_orden(db, id_orden, usr_insert)
    except Exception as e:
        logger.exception("emitir_factura_safe: falló la facturación de la orden %s: %s", id_orden, e)
        try:
            db.rollback()
        except Exception:
            pass
        return None
