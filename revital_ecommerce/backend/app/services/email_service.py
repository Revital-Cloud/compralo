"""
Módulo de Servicio de Email.

Este módulo contiene funciones para el envío de emails utilizando Resend.
Proporciona funciones especializadas para diferentes tipos de emails:
autenticación, pedidos, marketing y notificaciones administrativas.

Enfoque funcional: funciones puras, sin estado compartido, fácil testing.
"""
import resend
import logging
from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import datetime, date

from sqlalchemy import text
from sqlalchemy.orm import Session

from core.config import settings
from core.database import SessionLocal
from schemas.email_schema import EmailSend, EmailResponse
from services.email_templates import email_templates
from services.discount_service import get_birthday_discount

logger = logging.getLogger(__name__)

def _configure_resend():
    """
    Configura el cliente de Resend con la API key.
    Función auxiliar para inicializar Resend en cada envío.
    """
    resend.api_key = settings.RESEND_API_KEY

def _get_from_field() -> str:
    """
    Retorna el campo 'from' formateado para los emails.
    
    Returns:
        str: Campo from en formato "Nombre <email@dominio.com>"
    """
    return f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>"

async def send_basic_email(email_data: EmailSend) -> EmailResponse:
    """
    Envía un email básico usando Resend.
    
    Args:
        email_data (EmailSend): Datos del email a enviar
        
    Returns:
        EmailResponse: Respuesta con el resultado del envío
    """
    try:
        # Configurar Resend
        _configure_resend()
        
        # Preparar contenido del email
        html_content = email_data.html_content
        
        # Si se especifica un template, renderizarlo
        if email_data.template_name:
            html_content = email_templates.render_template(
                email_data.template_name,
                **email_data.template_data
            )
        
        # Enviar email con Resend
        response = resend.Emails.send({
            "from": _get_from_field(),
            "to": email_data.to,
            "subject": email_data.subject,
            "html": html_content,
            "text": email_data.text_content
        })
        
        logger.info(f"Email enviado exitosamente a {email_data.to}")
        
        return EmailResponse(
            success=True,
            message="Email enviado exitosamente",
            email_id=response.get('id')
        )
        
    except Exception as e:
        logger.error(f"Error al enviar email a {email_data.to}: {str(e)}")
        return EmailResponse(
            success=False,
            message=f"Error al enviar email: {str(e)}"
        )

# ==================== FUNCIONES DE AUTENTICACIÓN ====================

async def send_welcome_email(user_email: str, user_name: str, verify_url: Optional[str] = None, first_purchase_discount: Optional[Dict[str, Any]] = None) -> bool:
    """
    Envía email de bienvenida a un nuevo usuario.
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
        verify_url (Optional[str]): URL para verificar email
        first_purchase_discount (Optional[Dict]): Descuento de primera compra disponible
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_welcome_template(
            user_name=user_name,
            verify_url=verify_url,
            first_purchase_discount=first_purchase_discount
        )
        
        email_data = EmailSend(
            to=user_email,
            subject=f"¡Bienvenido a {settings.APP_NAME}!",
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar email de bienvenida: {str(e)}")
        return False

async def send_birthday_email(user_email: str, user_name: str, birthday_discount: Optional[Dict[str, Any]] = None) -> bool:
    """
    Envía email de cumpleaños con descuento especial.
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
        birthday_discount (Optional[Dict]): Descuento de cumpleaños disponible
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_birthday_template(
            user_name=user_name,
            birthday_discount=birthday_discount
        )
        
        email_data = EmailSend(
            to=user_email,
            subject=f"¡Feliz Cumpleaños {user_name}! 🎉 - Descuento Especial",
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar email de cumpleaños: {str(e)}")
        return False

async def send_verification_email(user_email: str, user_name: str, verification_token: str) -> bool:
    """
    Envía email de verificación de cuenta.
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
        verification_token (str): Token de verificación
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_verification_template(
            user_name=user_name,
            verification_token=verification_token
        )
        
        email_data = EmailSend(
            to=user_email,
            subject="Verifica tu cuenta",
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar email de verificación: {str(e)}")
        return False


async def send_verification_otp_email(
    user_email: str,
    user_name: str,
    otp_code: str,
    verify_url: str,
    expires_in_minutes: int = 15,
) -> bool:
    """
    Envía email de verificación con código OTP de 6 dígitos y enlace a la página.

    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
        otp_code (str): Código de 6 dígitos
        verify_url (str): URL de la página para verificar (ej. frontend /verify-email?email=...)
        expires_in_minutes (int): Minutos de validez del código

    Returns:
        bool: True si se envió correctamente
    """
    try:
        html_content = email_templates.get_verification_otp_template(
            user_name=user_name,
            otp_code=otp_code,
            verify_url=verify_url,
            expires_in_minutes=expires_in_minutes,
        )
        email_data = EmailSend(
            to=user_email,
            subject=f"Verifica tu cuenta – {settings.APP_NAME}",
            html_content=html_content,
        )
        response = await send_basic_email(email_data)
        return response.success
    except Exception as e:
        logger.error(f"Error al enviar email OTP a {user_email}: {str(e)}")
        return False


async def send_password_reset_email(user_email: str, user_name: str, reset_token: str) -> bool:
    """
    Envía email para reset de contraseña.
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
        reset_token (str): Token de reset
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_password_reset_template(
            user_name=user_name,
            reset_token=reset_token
        )
        
        email_data = EmailSend(
            to=user_email,
            subject="Recuperar contraseña",
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar email de reset: {str(e)}")
        return False

async def send_password_changed_email(user_email: str, user_name: str, ip_address: Optional[str] = None) -> bool:
    """
    Envía confirmación de cambio de contraseña.
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
        ip_address (Optional[str]): IP desde donde se hizo el cambio
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_password_changed_template(
            user_name=user_name,
            change_date=datetime.now(),
            ip_address=ip_address
        )
        
        email_data = EmailSend(
            to=user_email,
            subject="Contraseña cambiada exitosamente",
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar confirmación de cambio: {str(e)}")
        return False

# ==================== FUNCIONES DE PEDIDOS ====================

async def send_order_confirmation_email(order_data: Dict[str, Any]) -> bool:
    """
    Envía confirmación de pedido al cliente.
    
    Args:
        order_data (Dict[str, Any]): Datos del pedido
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_order_confirmation_template(order_data)
        
        email_data = EmailSend(
            to=order_data['user_email'],
            subject=f"Confirmación de pedido #{order_data['order_id']}",
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar confirmación de pedido: {str(e)}")
        return False


async def send_order_confirmation_for_order_id(order_id: int) -> None:
    """
    Obtiene los datos de la orden, construye el payload para el template
    y envía el email de confirmación al usuario. Se usa cuando el pago es APPROVED
    (webhook o pay_cart_and_create_order). Crea su propia sesión de BD para
    poder ejecutarse en background sin depender de la sesión del request.
    """
    from services import order_service

    db = SessionLocal()
    try:
        order_raw = order_service.get_order_with_items(db, Decimal(order_id))
        if not order_raw:
            logger.warning(f"Orden {order_id} no encontrada para email de confirmación")
            return
        id_usuario = order_raw.get("id_usuario")
        if id_usuario is None:
            logger.warning(f"Orden {order_id} sin id_usuario para email")
            return
        user_row = db.execute(
            text("SELECT email_usuario FROM tab_usuarios WHERE id_usuario = :id_usuario"),
            {"id_usuario": id_usuario},
        ).fetchone()
        if not user_row:
            logger.warning(f"Usuario {id_usuario} no encontrado para email de orden {order_id}")
            return
        user_email = getattr(user_row, "email_usuario", None) or (user_row[0] if user_row else None)
        if not user_email:
            logger.warning(f"Usuario {id_usuario} sin email para orden {order_id}")
            return

        fec = order_raw.get("fec_pedido")
        created_at = fec.strftime("%d/%m/%Y %H:%M") if fec and hasattr(fec, "strftime") else str(fec or "")

        def _fmt_money(v: Any) -> str:
            if v is None:
                return "0"
            try:
                return f"{int(float(v)):,}".replace(",", ".")
            except (TypeError, ValueError):
                return str(v)

        subtotal_fmt = _fmt_money(order_raw.get("val_total_productos"))
        discount_total_fmt = _fmt_money(order_raw.get("val_total_descuentos"))
        total_fmt = _fmt_money(order_raw.get("val_total_pedido"))

        items = []
        for it in order_raw.get("items") or []:
            name = it.get("product_name") or it.get("nom_producto") or "Producto"
            qty = it.get("quantity") or it.get("cant_producto") or 0
            image_url = it.get("imagen_url") or it.get("product_image") or None
            price_val = it.get("total_price") or it.get("subtotal") or it.get("unit_price") or 0
            try:
                price_val = float(price_val) if price_val is not None else 0
            except (TypeError, ValueError):
                price_val = 0
            price_fmt = f"{int(price_val):,}".replace(",", ".")
            unit_val = it.get("unit_price")
            try:
                unit_val = float(unit_val) if unit_val is not None else 0
            except (TypeError, ValueError):
                unit_val = 0
            unit_fmt = f"{int(unit_val):,}".replace(",", ".")
            opciones = it.get("opciones_elegidas") or {}
            if not isinstance(opciones, dict):
                opciones = {}
            options_str = ", ".join(f"{k}: {v}" for k, v in opciones.items() if v)
            items.append({
                "product_name": name,
                "quantity": qty,
                "unit_price": unit_fmt,
                "price": price_fmt,
                "options": options_str,
                "image_url": image_url,
            })

        # Descuentos aplicados (detalle + tipo)
        discounts_applied: list[dict[str, Any]] = []
        raw_discounts = order_raw.get("detalle_descuentos_aplicados")
        if raw_discounts:
            try:
                if isinstance(raw_discounts, str):
                    import json
                    raw_discounts = json.loads(raw_discounts)
                if isinstance(raw_discounts, dict):
                    raw_discounts = [raw_discounts]
                if isinstance(raw_discounts, list):
                    for d in raw_discounts:
                        if not isinstance(d, dict):
                            continue
                        discounts_applied.append(
                            {
                                "nombre": d.get("nombre"),
                                "codigo": d.get("codigo"),
                                "tipo_descuento": d.get("tipo_descuento") or d.get("tipo"),
                                "descuento_aplicado": d.get("descuento_aplicado") or d.get("monto") or d.get("valor") or 0,
                                "descuento_aplicado_fmt": _fmt_money(d.get("descuento_aplicado") or d.get("monto") or d.get("valor") or 0),
                            }
                        )
            except Exception:
                discounts_applied = []

        # Puntos ganados por esta orden
        points_row = db.execute(
            text(
                """
                SELECT COALESCE(SUM(cantidad_puntos), 0) AS puntos
                FROM tab_movimientos_puntos
                WHERE id_orden_origen = :id_orden AND tipo_movimiento = 1
                """
            ),
            {"id_orden": order_id},
        ).fetchone()
        points_earned = 0
        try:
            points_earned = int(getattr(points_row, "puntos", 0) or (points_row[0] if points_row else 0))
        except Exception:
            points_earned = 0

        # Dirección de envío: intentar obtener la dirección usada en el checkout (desde reference en tab_pagos)
        shipping_address_str = "A confirmar"
        try:
            pay_row = db.execute(
                text("SELECT reference FROM tab_pagos WHERE id_orden = :oid ORDER BY id_pago DESC LIMIT 1"),
                {"oid": order_id},
            ).fetchone()
            reference = getattr(pay_row, "reference", None) if pay_row else None
            if reference and isinstance(reference, str) and reference.startswith("revital_cart_"):
                from services.payment_widget_service import parse_checkout_reference

                parsed = parse_checkout_reference(reference)
                if parsed:
                    _cart_id, id_direccion, _id_canje, _codigo_desc = parsed
                    addr_row = db.execute(
                        text(
                            """
                            SELECT nombre_direccion, calle_direccion, complemento, barrio, ciudad, departamento, codigo_postal, referencias
                            FROM tab_direcciones_usuario
                            WHERE id_direccion = :id_direccion
                            LIMIT 1
                            """
                        ),
                        {"id_direccion": id_direccion},
                    ).fetchone()
                    if addr_row:
                        parts = []
                        calle = getattr(addr_row, "calle_direccion", None)
                        complemento = getattr(addr_row, "complemento", None)
                        barrio = getattr(addr_row, "barrio", None)
                        ciudad = getattr(addr_row, "ciudad", None)
                        depto = getattr(addr_row, "departamento", None)
                        cp = getattr(addr_row, "codigo_postal", None)
                        if calle:
                            parts.append(str(calle))
                        if complemento:
                            parts.append(str(complemento))
                        if barrio:
                            parts.append(str(barrio))
                        loc = ", ".join([p for p in [ciudad, depto] if p])
                        if loc:
                            parts.append(loc)
                        if cp:
                            parts.append(str(cp))
                        refs = getattr(addr_row, "referencias", None)
                        if refs:
                            parts.append(f"Ref: {refs}")
                        shipping_address_str = " · ".join(parts) if parts else "A confirmar"
        except Exception:
            shipping_address_str = "A confirmar"

        order_dict = {
            "id": order_id,
            "created_at": created_at,
            "subtotal": subtotal_fmt,
            "discount_total": discount_total_fmt,
            "total": total_fmt,
            "items": items,
            "discounts_applied": discounts_applied,
            "points_earned": points_earned,
            "shipping_address": shipping_address_str,
            "shipping_method": "A confirmar",
            "estimated_delivery": "3-7 días hábiles",
        }
        order_data = {
            "user_email": user_email,
            "order_id": order_id,
            "order": order_dict,
            "frontend_url": settings.FRONTEND_URL,
            "support_email": getattr(settings, "SUPPORT_EMAIL", settings.RESEND_FROM_EMAIL),
        }
        await send_order_confirmation_email(order_data)
        logger.info(f"Email de confirmación de orden #{order_id} enviado a {user_email}")
    except Exception as e:
        logger.error(f"Error enviando email de confirmación de orden {order_id}: {e}", exc_info=True)
    finally:
        db.close()


async def send_order_status_email(status_data: Dict[str, Any]) -> bool:
    """
    Envía notificación de cambio de estado de pedido.
    
    Args:
        status_data (Dict[str, Any]): Datos del cambio de estado
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_order_status_template(status_data)
        
        email_data = EmailSend(
            to=status_data['user_email'],
            subject=f"Actualización de pedido #{status_data['order_id']}",
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar estado de pedido: {str(e)}")
        return False

# ==================== FUNCIONES DE MARKETING ====================

async def send_newsletter_email(newsletter_data: Dict[str, Any]) -> bool:
    """
    Envía newsletter a suscriptor.
    
    Args:
        newsletter_data (Dict[str, Any]): Datos del newsletter
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_newsletter_template(newsletter_data)
        
        email_data = EmailSend(
            to=newsletter_data['user_email'],
            subject=newsletter_data['subject'],
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar newsletter: {str(e)}")
        return False

async def send_abandoned_cart_email(cart_data: Dict[str, Any]) -> bool:
    """
    Envía recordatorio de carrito abandonado.
    
    Args:
        cart_data (Dict[str, Any]): Datos del carrito
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_abandoned_cart_template(cart_data)
        
        email_data = EmailSend(
            to=cart_data['user_email'],
            subject="¡No olvides tu carrito!",
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar carrito abandonado: {str(e)}")
        return False

async def send_product_recommendations_email(recommendations_data: Dict[str, Any]) -> bool:
    """
    Envía recomendaciones de productos.
    
    Args:
        recommendations_data (Dict[str, Any]): Datos de las recomendaciones
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_product_recommendations_template(recommendations_data)
        
        email_data = EmailSend(
            to=recommendations_data['user_email'],
            subject="Productos que te pueden interesar",
            html_content=html_content
        )
        
        response = await send_basic_email(email_data)
        return response.success
        
    except Exception as e:
        logger.error(f"Error al enviar recomendaciones: {str(e)}")
        return False


async def send_coupon_to_user(
    user_email: str,
    user_name: str,
    codigo: str,
    nom_descuento: str,
    tipo_calculo: bool,
    val_porce_descuento: Optional[Any] = None,
    val_monto_descuento: Optional[Any] = None,
    fec_inicio: Optional[date] = None,
    fec_fin: Optional[date] = None,
    min_valor_pedido: Optional[Any] = None,
) -> bool:
    """
    Envía al usuario un email con su código de cupón personal.
    """
    try:
        fec_inicio_str = fec_inicio.strftime("%d/%m/%Y") if fec_inicio else None
        fec_fin_str = fec_fin.strftime("%d/%m/%Y") if fec_fin else None
        min_val = float(min_valor_pedido) if min_valor_pedido is not None else None
        html_content = email_templates.get_coupon_to_user_template(
            user_name=user_name,
            codigo=codigo,
            nom_descuento=nom_descuento,
            tipo_calculo=tipo_calculo,
            val_porce_descuento=val_porce_descuento,
            val_monto_descuento=val_monto_descuento,
            fec_inicio_str=fec_inicio_str,
            fec_fin_str=fec_fin_str,
            min_valor_pedido=min_val,
        )
        email_data = EmailSend(
            to=user_email,
            subject=f"Tu código de descuento: {codigo}",
            html_content=html_content,
        )
        response = await send_basic_email(email_data)
        return response.success
    except Exception as e:
        logger.error(f"Error al enviar cupón a usuario: {str(e)}")
        return False


# ==================== FUNCIONES ADMINISTRATIVAS ====================

async def send_new_order_notification(order_data: Dict[str, Any], admin_emails: List[str]) -> bool:
    """
    Envía notificación de nuevo pedido a administradores.
    
    Args:
        order_data (Dict[str, Any]): Datos del pedido
        admin_emails (List[str]): Lista de emails de administradores
        
    Returns:
        bool: True si se envió exitosamente a al menos un admin
    """
    try:
        html_content = email_templates.get_new_order_notification_template(order_data)
        
        success_count = 0
        for admin_email in admin_emails:
            email_data = EmailSend(
                to=admin_email,
                subject=f"Nuevo pedido #{order_data['order_id']} recibido",
                html_content=html_content
            )
            
            response = await send_basic_email(email_data)
            if response.success:
                success_count += 1
        
        return success_count > 0
        
    except Exception as e:
        logger.error(f"Error al enviar notificación de pedido: {str(e)}")
        return False

async def send_low_stock_notification(stock_data: Dict[str, Any], admin_emails: List[str]) -> bool:
    """
    Envía notificación de stock bajo a administradores.
    
    Args:
        stock_data (Dict[str, Any]): Datos del stock
        admin_emails (List[str]): Lista de emails de administradores
        
    Returns:
        bool: True si se envió exitosamente a al menos un admin
    """
    try:
        html_content = email_templates.get_low_stock_notification_template(stock_data)
        
        success_count = 0
        for admin_email in admin_emails:
            email_data = EmailSend(
                to=admin_email,
                subject=f"Stock bajo: {stock_data['product_name']}",
                html_content=html_content
            )
            
            response = await send_basic_email(email_data)
            if response.success:
                success_count += 1
        
        return success_count > 0
        
    except Exception as e:
        logger.error(f"Error al enviar notificación de stock: {str(e)}")
        return False


def send_out_of_stock_notification_sync(
    *,
    product_name: str,
    product_id: int,
    variant_id: int,
    sku: Optional[str],
    order_id: Optional[int],
    source_label: str,
    admin_emails: List[str],
) -> bool:
    """
    Envía email de variante sin stock a administradores (vía Resend, síncrono).
    Usado desde servicios no async tras actualizar inventario.
    """
    if not admin_emails:
        return False
    try:
        _configure_resend()
        product_ctx = {"id": product_id, "name": product_name}
        combo_ctx = {"id": variant_id, "sku": sku or ""}
        html_content = email_templates.get_out_of_stock_notification_template(
            product=product_ctx,
            combo=combo_ctx,
            order_id=order_id,
            source_label=source_label,
        )
        subject = f"Sin stock: {product_name}"
        ok_any = False
        for to_addr in admin_emails:
            try:
                resend.Emails.send(
                    {
                        "from": _get_from_field(),
                        "to": to_addr,
                        "subject": subject,
                        "html": html_content,
                    }
                )
                ok_any = True
            except Exception as ex:
                logger.warning("No se pudo enviar sin-stock a %s: %s", to_addr, ex)
        return ok_any
    except Exception as e:
        logger.error("Error al enviar notificación sin stock: %s", e)
        return False


# Mismo umbral que el listado admin (product_service): stock bajo = 1..10 por producto agregado; aquí por variante.
LOW_STOCK_VARIANT_THRESHOLD = 10


def send_low_stock_variant_notification_sync(
    *,
    product_id: int,
    product_name: str,
    variant_id: int,
    sku: Optional[str],
    current_stock: int,
    order_id: Optional[int],
    source_label: str,
    admin_emails: List[str],
) -> bool:
    """
    Stock bajo por variante (1..LOW_STOCK_VARIANT_THRESHOLD), mismo criterio operativo que el panel.
    """
    if not admin_emails:
        return False
    try:
        _configure_resend()
        tmax = LOW_STOCK_VARIANT_THRESHOLD
        product_ctx: Dict[str, Any] = {
            "id": product_id,
            "name": product_name,
            "stock": current_stock,
            "min_stock": tmax,
            "recommended_stock": max(tmax * 2, 20),
            "variant_id": variant_id,
            "sku": (sku or "").strip(),
            "order_id": order_id,
            "source_label": source_label,
        }
        html_content = email_templates.get_low_stock_notification_template({"product": product_ctx})
        subject = f"Stock bajo: {product_name}"
        ok_any = False
        for to_addr in admin_emails:
            try:
                resend.Emails.send(
                    {
                        "from": _get_from_field(),
                        "to": to_addr,
                        "subject": subject,
                        "html": html_content,
                    }
                )
                ok_any = True
            except Exception as ex:
                logger.warning("No se pudo enviar stock bajo a %s: %s", to_addr, ex)
        return ok_any
    except Exception as e:
        logger.error("Error al enviar notificación stock bajo: %s", e)
        return False


async def send_new_user_notification(user_data: Dict[str, Any], admin_emails: List[str]) -> bool:
    """
    Envía notificación de nuevo usuario a administradores.
    
    Args:
        user_data (Dict[str, Any]): Datos del usuario
        admin_emails (List[str]): Lista de emails de administradores
        
    Returns:
        bool: True si se envió exitosamente a al menos un admin
    """
    try:
        html_content = email_templates.get_new_user_notification_template(user_data)
        
        success_count = 0
        for admin_email in admin_emails:
            email_data = EmailSend(
                to=admin_email,
                subject=f"Nuevo usuario registrado: {user_data['user_name']}",
                html_content=html_content
            )
            
            response = await send_basic_email(email_data)
            if response.success:
                success_count += 1
        
        return success_count > 0
        
    except Exception as e:
        logger.error(f"Error al enviar notificación de usuario: {str(e)}")
        return False

# ==================== FUNCIONES DE MARKETING ====================

async def process_birthday_emails(db: Session = None) -> Dict[str, Any]:
    """
    Procesa usuarios con cumpleaños hoy y envía emails con descuentos de cumpleaños.
    
    Args:
        db (Session): Sesión de base de datos (opcional, crea una nueva si no se proporciona)
        
    Returns:
        dict: Resultado del procesamiento con estadísticas
    """
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        # Obtener descuento de cumpleaños activo
        birthday_discount = get_birthday_discount(db)
        
        if not birthday_discount:
            logger.info("No hay descuento de cumpleaños activo configurado")
            return {
                "success": True,
                "message": "No hay descuento de cumpleaños activo",
                "emails_sent": 0,
                "users_found": 0
            }
        
        # Buscar usuarios con cumpleaños hoy
        today = date.today()
        query = text("""
        SELECT 
            id_usuario,
            nom_usuario,
            email_usuario,
            fec_nacimiento
        FROM tab_usuarios
        WHERE fec_nacimiento IS NOT NULL
            AND EXTRACT(MONTH FROM fec_nacimiento) = :month
            AND EXTRACT(DAY FROM fec_nacimiento) = :day
            AND ind_activo = TRUE
            AND email_usuario IS NOT NULL
            AND email_usuario != ''
        """)
        
        result = db.execute(query, {
            'month': today.month,
            'day': today.day
        })
        users = result.mappings().all()
        
        if not users:
            logger.info(f"No se encontraron usuarios con cumpleaños el {today}")
            return {
                "success": True,
                "message": f"No hay usuarios con cumpleaños el {today}",
                "emails_sent": 0,
                "users_found": 0
            }
        
        # Enviar emails a cada usuario
        emails_sent = 0
        errors = []
        
        for user in users:
            try:
                success = await send_birthday_email(
                    user_email=user['email_usuario'],
                    user_name=user['nom_usuario'],
                    birthday_discount=birthday_discount
                )
                if success:
                    emails_sent += 1
                    logger.info(f"Email de cumpleaños enviado a {user['email_usuario']}")
                else:
                    errors.append(f"Error al enviar a {user['email_usuario']}")
            except Exception as e:
                error_msg = f"Error al enviar email a {user['email_usuario']}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        return {
            "success": True,
            "message": f"Procesados {len(users)} usuarios con cumpleaños",
            "emails_sent": emails_sent,
            "users_found": len(users),
            "errors": errors if errors else None
        }
        
    except Exception as e:
        logger.error(f"Error al procesar emails de cumpleaños: {str(e)}")
        return {
            "success": False,
            "message": f"Error al procesar emails de cumpleaños: {str(e)}",
            "emails_sent": 0,
            "users_found": 0
        }
    finally:
        if should_close:
            db.close()

# ==================== FUNCIONES DE UTILIDAD ====================

def validate_email_config() -> bool:
    """
    Valida que la configuración de email esté correcta.
    
    Returns:
        bool: True si la configuración es válida
    """
    try:
        required_settings = [
            settings.RESEND_KEY,
            settings.RESEND_FROM_EMAIL,
            settings.RESEND_FROM_NAME
        ]
        
        return all(setting for setting in required_settings)
        
    except Exception as e:
        logger.error(f"Error al validar configuración: {str(e)}")
        return False

def get_email_config_status() -> Dict[str, Any]:
    """
    Retorna el estado de la configuración de email para debugging.
    
    Returns:
        Dict[str, Any]: Estado de la configuración
    """
    try:
        return {
            "resend_key_configured": bool(settings.RESEND_KEY),
            "from_email": settings.RESEND_FROM_EMAIL,
            "from_name": settings.RESEND_FROM_NAME,
            "frontend_url": settings.FRONTEND_URL,
            "verify_email_url": settings.VERIFY_EMAIL_URL,
            "reset_password_url": settings.RESET_PASSWORD_URL
        }
    except Exception as e:
        logger.error(f"Error al obtener configuración: {str(e)}")
        return {"error": str(e)}
