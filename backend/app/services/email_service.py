"""
Módulo de Servicio de Email.

Este módulo contiene la lógica principal para el envío de emails
utilizando Resend. Proporciona métodos para diferentes tipos de emails:
autenticación, pedidos, marketing y notificaciones administrativas.

El servicio encapsula toda la funcionalidad de Resend y proporciona
una interfaz simple para el resto de la aplicación.
"""
import resend
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from core.config import settings
from schemas.email_schema import (
    EmailSend, EmailResponse, WelcomeEmailData, VerificationEmailData,
    PasswordResetEmailData, PasswordChangedEmailData, OrderConfirmationEmailData,
    OrderStatusEmailData, NewsletterEmailData, AbandonedCartEmailData,
    ProductRecommendationEmailData, NewOrderNotificationData,
    LowStockNotificationData, NewUserNotificationData, TestEmailData
)
from services.email_templates import email_templates

logger = logging.getLogger(__name__)

class EmailService:
    """
    Servicio principal para el envío de emails con Resend.
    
    Encapsula toda la funcionalidad de Resend y proporciona métodos
    específicos para cada tipo de email del ecommerce.
    """
    
    def __init__(self):
        """
        Inicializa el servicio de email.
        
        Configura el cliente de Resend con la API key desde settings.
        """
        try:
            # Inicializar cliente de Resend
            resend.api_key = settings.RESEND_KEY
            
            # Configurar valores por defecto
            self.from_email = settings.RESEND_FROM_EMAIL
            self.from_name = settings.RESEND_FROM_NAME
            
            # Debug logging para verificar configuración
            logger.info(f"EmailService inicializado correctamente")
            logger.info(f"RESEND_FROM_EMAIL: '{self.from_email}'")
            logger.info(f"RESEND_FROM_NAME: '{self.from_name}'")
            logger.info(f"Formato final: '{self.from_name} <{self.from_email}>'")
            
        except Exception as e:
            logger.error(f"Error al inicializar EmailService: {str(e)}")
            raise
    
    async def send_email(self, email_data: EmailSend) -> EmailResponse:
        """
        Envía un email básico.
        
        Args:
            email_data (EmailSend): Datos del email a enviar
            
        Returns:
            EmailResponse: Respuesta con el resultado del envío
        """
        try:
            # Preparar contenido del email
            html_content = email_data.html_content
            
            # Si se especifica un template, renderizarlo
            if email_data.template_name:
                html_content = email_templates.render_template(
                    email_data.template_name,
                    **email_data.template_data
                )
            
            # Preparar el campo from
            from_field = f"{self.from_name} <{self.from_email}>"
            
            # Debug logging
            logger.info(f"Enviando email desde: '{from_field}'")
            logger.info(f"Hacia: '{email_data.to}'")
            
            # Enviar email con Resend
            response = resend.Emails.send({
                "from": from_field,
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
    
    # ==================== MÉTODOS DE AUTENTICACIÓN ====================
    
    async def send_welcome_email(self, user_email: str, user_name: str, verify_url: Optional[str] = None) -> bool:
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
            
            response = await self.send_email(email_data)
            return response.success
            
        except Exception as e:
            logger.error(f"Error al enviar email de bienvenida: {str(e)}")
            return False
    
    async def send_verification_email(self, user_email: str, user_name: str, verification_token: str) -> bool:
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
            
            response = await self.send_email(email_data)
            return response.success
            
        except Exception as e:
            logger.error(f"Error al enviar email de verificación: {str(e)}")
            return False
    
    async def send_password_reset_email(self, user_email: str, user_name: str, reset_token: str) -> bool:
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
            
            response = await self.send_email(email_data)
            return response.success
            
        except Exception as e:
            logger.error(f"Error al enviar email de reset: {str(e)}")
            return False
    
    async def send_password_changed_email(self, user_email: str, user_name: str, ip_address: Optional[str] = None) -> bool:
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
            
            response = await self.send_email(email_data)
            return response.success
            
        except Exception as e:
            logger.error(f"Error al enviar confirmación de cambio: {str(e)}")
            return False
    
    # ==================== MÉTODOS DE PEDIDOS ====================
    
    async def send_order_confirmation_email(self, order_data: Dict[str, Any]) -> bool:
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
            
            response = await self.send_email(email_data)
            return response.success
            
        except Exception as e:
            logger.error(f"Error al enviar confirmación de pedido: {str(e)}")
            return False
    
    async def send_order_status_email(self, status_data: Dict[str, Any]) -> bool:
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
            
            response = await self.send_email(email_data)
            return response.success
            
        except Exception as e:
            logger.error(f"Error al enviar estado de pedido: {str(e)}")
            return False
    
    # ==================== MÉTODOS DE MARKETING ====================
    
    async def send_newsletter_email(self, newsletter_data: Dict[str, Any]) -> bool:
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
            
            response = await self.send_email(email_data)
            return response.success
            
        except Exception as e:
            logger.error(f"Error al enviar newsletter: {str(e)}")
            return False
    
    async def send_abandoned_cart_email(self, cart_data: Dict[str, Any]) -> bool:
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
            
            response = await self.send_email(email_data)
            return response.success
            
        except Exception as e:
            logger.error(f"Error al enviar carrito abandonado: {str(e)}")
            return False
    
    async def send_product_recommendations_email(self, recommendations_data: Dict[str, Any]) -> bool:
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
            
            response = await self.send_email(email_data)
            return response.success
            
        except Exception as e:
            logger.error(f"Error al enviar recomendaciones: {str(e)}")
            return False
    
    # ==================== MÉTODOS ADMINISTRATIVOS ====================
    
    async def send_new_order_notification(self, order_data: Dict[str, Any], admin_emails: List[str]) -> bool:
        """
        Envía notificación de nuevo pedido a administradores.
        
        Args:
            order_data (Dict[str, Any]): Datos del pedido
            admin_emails (List[str]): Lista de emails de administradores
            
        Returns:
            bool: True si se envió exitosamente
        """
        try:
            html_content = email_templates.get_new_order_notification_template(order_data)
            
            # Enviar a todos los administradores
            success_count = 0
            for admin_email in admin_emails:
                email_data = EmailSend(
                    to=admin_email,
                    subject=f"Nuevo pedido #{order_data['order_id']} recibido",
                    html_content=html_content
                )
                
                response = await self.send_email(email_data)
                if response.success:
                    success_count += 1
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error al enviar notificación de pedido: {str(e)}")
            return False
    
    async def send_low_stock_notification(self, stock_data: Dict[str, Any], admin_emails: List[str]) -> bool:
        """
        Envía notificación de stock bajo a administradores.
        
        Args:
            stock_data (Dict[str, Any]): Datos del stock
            admin_emails (List[str]): Lista de emails de administradores
            
        Returns:
            bool: True si se envió exitosamente
        """
        try:
            html_content = email_templates.get_low_stock_notification_template(stock_data)
            
            # Enviar a todos los administradores
            success_count = 0
            for admin_email in admin_emails:
                email_data = EmailSend(
                    to=admin_email,
                    subject=f"Stock bajo: {stock_data['product_name']}",
                    html_content=html_content
                )
                
                response = await self.send_email(email_data)
                if response.success:
                    success_count += 1
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error al enviar notificación de stock: {str(e)}")
            return False
    
    async def send_new_user_notification(self, user_data: Dict[str, Any], admin_emails: List[str]) -> bool:
        """
        Envía notificación de nuevo usuario a administradores.
        
        Args:
            user_data (Dict[str, Any]): Datos del usuario
            admin_emails (List[str]): Lista de emails de administradores
            
        Returns:
            bool: True si se envió exitosamente
        """
        try:
            html_content = email_templates.get_new_user_notification_template(user_data)
            
            # Enviar a todos los administradores
            success_count = 0
            for admin_email in admin_emails:
                email_data = EmailSend(
                    to=admin_email,
                    subject=f"Nuevo usuario registrado: {user_data['user_name']}",
                    html_content=html_content
                )
                
                response = await self.send_email(email_data)
                if response.success:
                    success_count += 1
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error al enviar notificación de usuario: {str(e)}")
            return False
    
    # ==================== MÉTODOS DE TESTING ====================
    
    async def send_test_email(self, test_data: TestEmailData) -> EmailResponse:
        """
        Envía email de prueba.
        
        Args:
            test_data (TestEmailData): Datos del email de prueba
            
        Returns:
            EmailResponse: Respuesta del envío
        """
        try:
            if test_data.template_test:
                html_content = email_templates.get_test_template(test_data.message)
            else:
                html_content = f"""
                <html>
                    <body>
                        <h2>Email de Prueba - {settings.APP_NAME}</h2>
                        <p>{test_data.message}</p>
                        <p><small>Enviado el: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</small></p>
                    </body>
                </html>
                """
            
            email_data = EmailSend(
                to=test_data.to,
                subject=test_data.subject,
                html_content=html_content
            )
            
            return await self.send_email(email_data)
            
        except Exception as e:
            logger.error(f"Error al enviar email de prueba: {str(e)}")
            return EmailResponse(
                success=False,
                message=f"Error al enviar email de prueba: {str(e)}"
            )
    
    # ==================== MÉTODOS DE UTILIDAD ====================
    
    def validate_email_config(self) -> bool:
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

# Instancia global del servicio de email
email_service = EmailService()
