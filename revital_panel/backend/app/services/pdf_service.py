"""
Servicio de generación de PDF para facturas.

Genera un PDF de factura a partir de cabecera y detalles usando ReportLab.
"""
from io import BytesIO
from decimal import Decimal
from datetime import datetime
from typing import List, Dict, Any, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


def _format_decimal(value: Any) -> str:
    """Formatea Decimal o número para mostrar."""
    if value is None:
        return "0.00"
    if isinstance(value, Decimal):
        return f"{float(value):,.2f}"
    try:
        return f"{float(value):,.2f}"
    except (TypeError, ValueError):
        return str(value)


def _format_date(value: Any) -> str:
    """Formatea fecha para mostrar."""
    if value is None:
        return "—"
    if isinstance(value, datetime):
        return value.strftime("%d/%m/%Y")
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return dt.strftime("%d/%m/%Y")
        except ValueError:
            return value
    return str(value)


def _format_currency(value: Any, currency: str = "USD") -> str:
    """Formatea monto con símbolo de moneda."""
    symbol = "$" if currency == "USD" else currency + " "
    return symbol + _format_decimal(value)


def generate_invoice_pdf(
    factura: Dict[str, Any],
    detalles: List[Dict[str, Any]],
    company_name: str = "Synkro",
) -> bytes:
    """
    Genera el PDF de una factura.

    Args:
        factura: Diccionario con cabecera (num_factura, fecha_emision, total, moneda, etc.)
        detalles: Lista de diccionarios con líneas (concepto, cantidad, precio_unitario, total_linea)
        company_name: Nombre de la empresa para el encabezado

    Returns:
        bytes del PDF generado.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )
    styles = getSampleStyleSheet()
    story = []

    # Título
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontSize=18,
        spaceAfter=12,
    )
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 6 * mm))

    # Cabecera: número de factura, fechas, cliente
    num_factura = factura.get("num_factura") or "—"
    fecha_emision = _format_date(factura.get("fecha_emision"))
    fecha_vencimiento = _format_date(factura.get("fecha_vencimiento"))
    periodo_desde = _format_date(factura.get("periodo_facturado_desde"))
    periodo_hasta = _format_date(factura.get("periodo_facturado_hasta"))
    moneda = factura.get("moneda") or "USD"

    header_data = [
        ["Invoice number:", str(num_factura), "Company:", company_name],
        ["Issue date:", fecha_emision, "", ""],
        ["Due date:", fecha_vencimiento, "", ""],
        ["Billing period:", f"{periodo_desde} – {periodo_hasta}", "", ""],
    ]
    header_table = Table(header_data, colWidths=[35 * mm, 55 * mm, 35 * mm, 55 * mm])
    header_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 8 * mm))

    # Tabla de líneas
    line_headers = ["#", "Description", "Qty", "Unit price", "Total"]
    line_data = [line_headers]

    for i, det in enumerate(detalles, start=1):
        concepto = (det.get("concepto") or "").strip() or "—"
        cantidad = _format_decimal(det.get("cantidad"))
        precio_unit = _format_currency(det.get("precio_unitario"), moneda)
        total_linea = _format_currency(det.get("total_linea"), moneda)
        line_data.append([str(i), concepto, cantidad, precio_unit, total_linea])

    # Si no hay detalles, una línea de resumen
    if not line_data or len(line_data) == 1:
        subtotal = factura.get("subtotal") or factura.get("total") or 0
        line_data = [
            line_headers,
            ["1", "Subscription payment", "1", _format_currency(subtotal, moneda), _format_currency(subtotal, moneda)],
        ]

    col_widths = [12 * mm, 70 * mm, 22 * mm, 35 * mm, 35 * mm]
    items_table = Table(line_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(items_table)
    story.append(Spacer(1, 8 * mm))

    # Totales
    subtotal = _format_currency(factura.get("subtotal"), moneda)
    descuentos = _format_currency(factura.get("descuentos") or 0, moneda)
    impuestos = _format_currency(factura.get("impuestos") or 0, moneda)
    total = _format_currency(factura.get("total"), moneda)

    totals_data = [
        ["Subtotal", subtotal],
        ["Discounts", descuentos],
        ["Taxes", impuestos],
        ["Total", total],
    ]
    totals_table = Table(totals_data, colWidths=[40 * mm, 45 * mm])
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(totals_table)
    story.append(Spacer(1, 10 * mm))

    # Estado de pago
    estado = (factura.get("estado_pago") or "pendiente").upper()
    story.append(Paragraph(f"<b>Payment status:</b> {estado}", styles["Normal"]))
    if factura.get("fecha_pago"):
        story.append(Paragraph(f"<b>Paid on:</b> {_format_date(factura['fecha_pago'])}", styles["Normal"]))
    if factura.get("metodo_pago"):
        story.append(Paragraph(f"<b>Payment method:</b> {factura['metodo_pago']}", styles["Normal"]))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
