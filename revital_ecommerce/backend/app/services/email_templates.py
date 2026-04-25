"""
Módulo de Templates de Email.

Este módulo se encarga de generar el contenido HTML para los emails
utilizando templates Jinja2. Proporciona métodos para renderizar
diferentes tipos de emails con datos dinámicos.

Incluye templates para:
- Autenticación (bienvenida, verificación, reset de contraseña)
- Pedidos (confirmación, estados, facturación)
- Marketing (newsletter, carrito abandonado, recomendaciones)
- Administrativos (notificaciones para admins)
"""
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape
from typing import Dict, Any, Optional
from datetime import datetime
from decimal import Decimal
import logging

from core.config import settings

logger = logging.getLogger(__name__)

class EmailTemplates:
    """
    Clase para generar templates HTML de emails.
    
    Utiliza Jinja2 para renderizar templates con datos dinámicos.
    Proporciona métodos específicos para cada tipo de email.
    """
    
    def __init__(self):
        """
        Inicializa el generador de templates.
        
        Configura el entorno Jinja2 con el directorio de templates
        y habilita el auto-escape para seguridad.
        """
        try:
            # Configurar el directorio de templates
            template_dir = os.path.join(os.path.dirname(__file__), "..", "templates", "emails")
            
            # Crear el entorno Jinja2
            self.env = Environment(
                loader=FileSystemLoader(template_dir),
                autoescape=select_autoescape(['html', 'xml'])
            )
            
            # Agregar filtros personalizados
            self.env.filters['currency'] = self._format_currency
            self.env.filters['datetime'] = self._format_datetime
            self.env.filters['date'] = self._format_date
            
            logger.info(f"EmailTemplates inicializado con directorio: {template_dir}")
            
        except Exception as e:
            logger.error(f"Error al inicializar EmailTemplates: {str(e)}")
            raise
    
    def _format_currency(self, value: Decimal) -> str:
        """
        Filtro para formatear valores monetarios.
        
        Args:
            value (Decimal): Valor a formatear
            
        Returns:
            str: Valor formateado como moneda
        """
        try:
            return f"${value:,.2f}"
        except:
            return str(value)
    
    def _format_datetime(self, value: datetime) -> str:
        """
        Filtro para formatear fechas y horas.
        
        Args:
            value (datetime): Fecha a formatear
            
        Returns:
            str: Fecha formateada
        """
        try:
            return value.strftime("%d/%m/%Y %H:%M")
        except:
            return str(value)
    
    def _format_date(self, value: datetime) -> str:
        """
        Filtro para formatear solo fechas.
        
        Args:
            value (datetime): Fecha a formatear
            
        Returns:
            str: Fecha formateada
        """
        try:
            return value.strftime("%d/%m/%Y")
        except:
            return str(value)
    
    def render_template(self, template_name: str, **context) -> str:
        """
        Renderiza un template con el contexto proporcionado.
        
        Args:
            template_name (str): Nombre del archivo de template
            **context: Variables para el template
            
        Returns:
            str: HTML renderizado
            
        Raises:
            Exception: Si el template no existe o hay error en el renderizado
        """
        try:
            # Agregar variables globales SaaS al contexto
            context.update({
                'app_name': settings.APP_NAME,
                'company_name': settings.COMPANY_NAME,
                'company_tagline': settings.COMPANY_TAGLINE,
                'company_address': settings.COMPANY_ADDRESS,
                'support_email': settings.SUPPORT_EMAIL,
                'frontend_url': settings.FRONTEND_URL,
                'current_year': datetime.now().year,
            })
            
            template = self.env.get_template(template_name)
            return template.render(**context)
            
        except Exception as e:
            logger.error(f"Error al renderizar template {template_name}: {str(e)}")
            raise
    
    # ==================== TEMPLATES DE AUTENTICACIÓN ====================
    
    def get_welcome_template(self, user_name: str, verify_url: Optional[str] = None, first_purchase_discount: Optional[Dict[str, Any]] = None) -> str:
        """
        Genera el template de email de bienvenida.
        
        Args:
            user_name (str): Nombre del usuario
            verify_url (Optional[str]): URL para verificar email
            first_purchase_discount (Optional[Dict]): Descuento de primera compra disponible
            
        Returns:
            str: HTML del email de bienvenida
        """
        return self.render_template(
            'auth/welcome.html',
            user_name=user_name,
            verify_url=verify_url,
            first_purchase_discount=first_purchase_discount
        )
    
    def get_birthday_template(self, user_name: str, birthday_discount: Optional[Dict[str, Any]] = None) -> str:
        """
        Genera el template de email de cumpleaños.
        
        Args:
            user_name (str): Nombre del usuario
            birthday_discount (Optional[Dict]): Descuento de cumpleaños disponible
            
        Returns:
            str: HTML del email de cumpleaños
        """
        return self.render_template(
            'marketing/birthday.html',
            user_name=user_name,
            birthday_discount=birthday_discount
        )
    
    def get_verification_template(self, user_name: str, verification_token: str, expires_in_hours: int = 24) -> str:
        """
        Genera el template de verificación de email.
        
        Args:
            user_name (str): Nombre del usuario
            verification_token (str): Token de verificación
            expires_in_hours (int): Horas hasta que expire el token
            
        Returns:
            str: HTML del email de verificación
        """
        verify_url = f"{settings.VERIFY_EMAIL_URL}?token={verification_token}"
        
        return self.render_template(
            'auth/verify_email.html',
            user_name=user_name,
            verify_url=verify_url,
            expires_in_hours=expires_in_hours
        )

    def get_verification_otp_template(
        self,
        user_name: str,
        otp_code: str,
        verify_url: str,
        expires_in_minutes: int = 15,
    ) -> str:
        """
        Genera el template de verificación de email por OTP (código de 6 dígitos + enlace).

        Args:
            user_name (str): Nombre del usuario
            otp_code (str): Código OTP de 6 dígitos
            verify_url (str): URL de la página para ingresar el código
            expires_in_minutes (int): Minutos hasta que expire el código

        Returns:
            str: HTML del email
        """
        return self.render_template(
            'auth/verify_email_otp.html',
            user_name=user_name,
            otp_code=otp_code,
            verify_url=verify_url,
            expires_in_minutes=expires_in_minutes,
        )

    def get_password_reset_template(self, user_name: str, reset_token: str, expires_in_hours: int = 1) -> str:
        """
        Genera el template de reset de contraseña.
        
        Args:
            user_name (str): Nombre del usuario
            reset_token (str): Token de reset
            expires_in_hours (int): Horas hasta que expire el token
            
        Returns:
            str: HTML del email de reset
        """
        reset_url = f"{settings.RESET_PASSWORD_URL}?token={reset_token}"
        
        return self.render_template(
            'auth/reset_password.html',
            user_name=user_name,
            reset_url=reset_url,
            expires_in_hours=expires_in_hours
        )
    
    def get_password_changed_template(self, user_name: str, change_date: datetime, ip_address: Optional[str] = None) -> str:
        """
        Genera el template de confirmación de cambio de contraseña.
        
        Args:
            user_name (str): Nombre del usuario
            change_date (datetime): Fecha del cambio
            ip_address (Optional[str]): IP desde donde se hizo el cambio
            
        Returns:
            str: HTML del email de confirmación
        """
        # Formatear fecha en formato: año-mes-dia hora-minuto-segundo (sin microsegundos)
        formatted_date = change_date.strftime('%Y-%m-%d %H:%M:%S')
        
        return self.render_template(
            'auth/password_changed.html',
            user_name=user_name,
            change_date=formatted_date,
            ip_address=ip_address
        )
    
    # ==================== TEMPLATES DE PEDIDOS ====================
    
    def get_order_confirmation_template(self, order_data: Dict[str, Any]) -> str:
        """
        Genera el template de confirmación de pedido.
        
        Args:
            order_data (Dict[str, Any]): Datos del pedido
            
        Returns:
            str: HTML del email de confirmación
        """
        return self.render_template(
            'orders/order_confirmation.html',
            **order_data
        )
    
    def get_order_status_template(self, status_data: Dict[str, Any]) -> str:
        """
        Genera el template de cambio de estado de pedido.
        
        Args:
            status_data (Dict[str, Any]): Datos del cambio de estado
            
        Returns:
            str: HTML del email de estado
        """
        # Mapear estados a mensajes amigables
        status_messages = {
            'confirmed': 'Tu pedido ha sido confirmado',
            'processing': 'Tu pedido está siendo preparado',
            'shipped': 'Tu pedido ha sido enviado',
            'delivered': 'Tu pedido ha sido entregado',
            'cancelled': 'Tu pedido ha sido cancelado'
        }
        
        status_data['status_message'] = status_messages.get(
            status_data.get('new_status', '').lower(),
            f"Tu pedido cambió a: {status_data.get('new_status', '')}"
        )
        
        return self.render_template(
            'orders/order_status.html',
            **status_data
        )
    
    # ==================== TEMPLATES DE MARKETING ====================
    
    def get_newsletter_template(self, newsletter_data: Dict[str, Any]) -> str:
        """
        Genera el template de newsletter.
        
        Args:
            newsletter_data (Dict[str, Any]): Datos del newsletter
            
        Returns:
            str: HTML del newsletter
        """
        return self.render_template(
            'marketing/newsletter.html',
            **newsletter_data
        )
    
    def get_abandoned_cart_template(self, cart_data: Dict[str, Any]) -> str:
        """
        Genera el template de carrito abandonado.
        
        Args:
            cart_data (Dict[str, Any]): Datos del carrito
            
        Returns:
            str: HTML del email de carrito abandonado
        """
        return self.render_template(
            'marketing/abandoned_cart.html',
            **cart_data
        )

    def get_coupon_to_user_template(
        self,
        user_name: str,
        codigo: str,
        nom_descuento: str,
        tipo_calculo: bool,
        val_porce_descuento: Optional[Any] = None,
        val_monto_descuento: Optional[Any] = None,
        fec_inicio_str: Optional[str] = None,
        fec_fin_str: Optional[str] = None,
        min_valor_pedido: Optional[Any] = None,
    ) -> str:
        """
        Genera el template de envío de código de cupón a un usuario.
        """
        return self.render_template(
            'marketing/coupon_to_user.html',
            user_name=user_name,
            codigo=codigo,
            nom_descuento=nom_descuento,
            tipo_calculo=tipo_calculo,
            val_porce_descuento=val_porce_descuento,
            val_monto_descuento=val_monto_descuento,
            fec_inicio_str=fec_inicio_str,
            fec_fin_str=fec_fin_str,
            min_valor_pedido=min_valor_pedido,
        )
    
    def get_product_recommendations_template(self, recommendations_data: Dict[str, Any]) -> str:
        """
        Genera el template de recomendaciones de productos.
        
        Args:
            recommendations_data (Dict[str, Any]): Datos de las recomendaciones
            
        Returns:
            str: HTML del email de recomendaciones
        """
        return self.render_template(
            'marketing/product_recommendations.html',
            **recommendations_data
        )
    
    # ==================== TEMPLATES ADMINISTRATIVOS ====================
    
    def get_new_order_notification_template(self, order_data: Dict[str, Any]) -> str:
        """
        Genera el template de notificación de nuevo pedido para administradores.
        
        Args:
            order_data (Dict[str, Any]): Datos del pedido
            
        Returns:
            str: HTML de la notificación
        """
        return self.render_template(
            'admin/new_order.html',
            **order_data
        )
    
    def get_low_stock_notification_template(self, stock_data: Dict[str, Any]) -> str:
        """
        Genera el template de notificación de stock bajo.
        
        Args:
            stock_data (Dict[str, Any]): Datos del stock
            
        Returns:
            str: HTML de la notificación
        """
        return self.render_template(
            'admin/low_stock.html',
            **stock_data
        )

    def get_out_of_stock_notification_template(
        self,
        *,
        product: Dict[str, Any],
        combo: Dict[str, Any],
        order_id: Optional[int] = None,
        source_label: str = "Venta",
    ) -> str:
        """
        Notificación cuando una combinación (variante) queda en stock 0.
        """
        return self.render_template(
            "admin/out_of_stock.html",
            product=product,
            combo=combo,
            order_id=order_id,
            source_label=source_label,
        )
    
    def get_new_user_notification_template(self, user_data: Dict[str, Any]) -> str:
        """
        Genera el template de notificación de nuevo usuario.
        
        Args:
            user_data (Dict[str, Any]): Datos del usuario
            
        Returns:
            str: HTML de la notificación
        """
        return self.render_template(
            'admin/new_user.html',
            **user_data
        )
    
    # ==================== TEMPLATE DE TESTING ====================
    
    def get_test_template(self, message: str = "Este es un email de prueba") -> str:
        """
        Genera un template simple para testing.
        
        Args:
            message (str): Mensaje de prueba
            
        Returns:
            str: HTML del email de prueba
        """
        return self.render_template(
            'test_email.html',
            message=message,
            test_date=datetime.now()
        )

# Instancia global del generador de templates
email_templates = EmailTemplates() 