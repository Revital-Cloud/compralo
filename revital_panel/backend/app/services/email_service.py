"""
Servicio de envío de emails.

Centraliza el envío de correos transaccionales usando Resend.
Actualmente se utiliza para el flujo de reset de contraseña.
"""
from typing import Optional

import logging
import resend

from core.config import settings

logger = logging.getLogger(__name__)

# Configurar API key global de Resend
resend.api_key = settings.RESEND_API_KEY


def send_password_reset_email(
    to_email: str,
    reset_url: str,
    user_name: Optional[str] = None,
) -> None:
    """
    Envía un email con el enlace de reset de contraseña.

    Esta función NUNCA lanza excepción hacia afuera: en caso de error
    simplemente registra en logs, para no filtrar información sensible
    ni romper el flujo de seguridad.
    """
    try:
        display_name = user_name or "there"

        subject = f"Reset your {settings.APP_NAME} password"
        html_body = f"""
        <p>Hi {display_name},</p>
        <p>We received a request to reset the password for your {settings.APP_NAME} account.</p>
        <p>If you made this request, please click the button below to set a new password:</p>
        <p>
          <a href="{reset_url}" style="display:inline-block;padding:10px 18px;background-color:#16a34a;color:#ffffff;
          text-decoration:none;border-radius:6px;font-weight:600;font-family:system-ui,sans-serif;">
            Reset password
          </a>
        </p>
        <p>If the button does not work, copy and paste this URL in your browser:</p>
        <p style="word-break:break-all;">{reset_url}</p>
        <p>This link will expire in 1 hour for security reasons. If you did not request a password reset,
        you can safely ignore this email.</p>
        <p>Best regards,<br />{settings.COMPANY_NAME} Team</p>
        """

        from_email = f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>"

        resend.Emails.send(
            {
                "from": from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            }
        )

        logger.info("Password reset email sent to %s", to_email)
    except Exception as exc:  # pragma: no cover - fallo de integración externa
        # No interrumpir el flujo de la API por errores de email
        logger.error("Error sending password reset email to %s: %s", to_email, exc)

