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
from datetime import datetime

from sqlalchemy import text

from core.config import settings
from core.database import SessionLocal
from schemas.email_schema import EmailSend, EmailResponse
from services.email_templates import email_templates

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

async def send_welcome_email(user_email: str, user_name: str, verify_url: Optional[str] = None) -> bool:
    """
    Envía email de bienvenida a un nuevo usuario.
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
        verify_url (Optional[str]): URL para verificar email
        
    Returns:
        bool: True si se envió exitosamente
    """
    try:
        html_content = email_templates.get_welcome_template(
            user_name=user_name,
            verify_url=verify_url
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

        val_total = order_raw.get("val_total_pedido")
        if val_total is not None:
            try:
                total_fmt = f"{int(float(val_total)):,}".replace(",", ".")
            except (TypeError, ValueError):
                total_fmt = str(val_total)
        else:
            total_fmt = "0"

        items = []
        for it in order_raw.get("items") or []:
            name = it.get("product_name") or it.get("nom_producto") or "Producto"
            qty = it.get("quantity") or it.get("cant_producto") or 0
            price_val = it.get("total_price") or it.get("subtotal") or it.get("unit_price") or 0
            try:
                price_val = float(price_val) if price_val is not None else 0
            except (TypeError, ValueError):
                price_val = 0
            price_fmt = f"{int(price_val):,}".replace(",", ".")
            items.append({"product_name": name, "quantity": qty, "price": price_fmt})

        order_dict = {
            "id": order_id,
            "created_at": created_at,
            "total": total_fmt,
            "items": items,
            "shipping_address": "A confirmar",
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
