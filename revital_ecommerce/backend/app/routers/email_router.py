"""
Router de Email.

Este módulo define los endpoints de la API para el manejo de emails.
Incluye endpoints para testing, envío de emails específicos y
administración del sistema de emails.

Endpoints disponibles:
- POST /test: Enviar email de prueba
- POST /send: Enviar email personalizado
- POST /welcome: Enviar email de bienvenida
- POST /verify: Enviar email de verificación
- POST /password-reset: Enviar email de reset de contraseña
- GET /config: Obtener configuración del servicio
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import logging

from schemas.email_schema import (
    EmailSend, EmailResponse, WelcomeEmailData,
    VerificationEmailData, PasswordResetEmailData, ResponseMessage
)
from services.email_service import (
    send_welcome_email as send_welcome_email_func,
    send_verification_email as send_verification_email_func,
    send_password_reset_email as send_password_reset_email_func,
    validate_email_config,
    get_email_config_status,
    process_birthday_emails
)
from core.database import get_db
from core.dependencies import get_current_user

logger = logging.getLogger(__name__)

# Crear router con prefijo y tags
router = APIRouter(
    prefix="/emails",
    tags=["emails"],
    responses={
        404: {"description": "No encontrado"},
        500: {"description": "Error interno del servidor"}
    }
)

# ==================== ENDPOINTS DE AUTENTICACIÓN ====================

@router.post("/welcome", response_model=ResponseMessage)
async def send_welcome_email(
    welcome_data: WelcomeEmailData
):
    """
    Envía email de bienvenida a un nuevo usuario.
    
    Este endpoint es utilizado internamente por el sistema de autenticación
    cuando se registra un nuevo usuario.
    
    Args:
        welcome_data (WelcomeEmailData): Datos para el email de bienvenida
        
    Returns:
        ResponseMessage: Resultado del envío
        
    Raises:
        HTTPException: Si hay error en el envío
    """
    try:
        logger.info(f"Enviando email de bienvenida a {welcome_data.user_email}")
        
        success = await send_welcome_email_func(
            user_email=welcome_data.user_email,
            user_name=welcome_data.user_name,
            verify_url=welcome_data.verify_url
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al enviar email de bienvenida"
            )
        
        return ResponseMessage(
            message="Email de bienvenida enviado exitosamente",
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error en send_welcome_email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar email de bienvenida: {str(e)}"
        )

@router.post("/verify", response_model=ResponseMessage)
async def send_verification_email(
    verification_data: VerificationEmailData
):
    """
    Envía email de verificación de cuenta.
    
    Args:
        verification_data (VerificationEmailData): Datos para el email de verificación
        
    Returns:
        ResponseMessage: Resultado del envío
        
    Raises:
        HTTPException: Si hay error en el envío
    """
    try:
        logger.info(f"Enviando email de verificación a {verification_data.user_email}")
        
        success = await send_verification_email_func(
            user_email=verification_data.user_email,
            user_name=verification_data.user_name,
            verification_token=verification_data.verification_token
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al enviar email de verificación"
            )
        
        return ResponseMessage(
            message="Email de verificación enviado exitosamente",
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error en send_verification_email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar email de verificación: {str(e)}"
        )

@router.post("/password-reset", response_model=ResponseMessage)
async def send_password_reset_email(
    reset_data: PasswordResetEmailData
):
    """
    Envía email para reset de contraseña.
    
    Args:
        reset_data (PasswordResetEmailData): Datos para el email de reset
        
    Returns:
        ResponseMessage: Resultado del envío
        
    Raises:
        HTTPException: Si hay error en el envío
    """
    try:
        logger.info(f"Enviando email de reset de contraseña a {reset_data.user_email}")
        
        success = await send_password_reset_email_func(
            user_email=reset_data.user_email,
            user_name=reset_data.user_name,
            reset_token=reset_data.reset_token
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al enviar email de reset de contraseña"
            )
        
        return ResponseMessage(
            message="Email de reset de contraseña enviado exitosamente",
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error en send_password_reset_email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar email de reset: {str(e)}"
        )

# ==================== ENDPOINTS ADMINISTRATIVOS ====================

@router.get("/config")
async def get_email_config(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene la configuración del servicio de email.
    
    Solo accesible para usuarios autenticados.
    
    Args:
        current_user (dict): Usuario autenticado
        
    Returns:
        dict: Configuración del servicio (sin datos sensibles)
    """
    try:
        # Verificar que sea admin (simplificado para testing)
        if current_user.get('id_rol') != 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se requieren permisos de administrador"
            )
        
        config_status = get_email_config_status()
        config_valid = validate_email_config()
        
        return {
            "service": "Resend",
            "from_email": config_status.get("from_email"),
            "from_name": config_status.get("from_name"),
            "config_valid": config_valid,
            "templates_available": [
                "auth/welcome.html",
                "auth/verify_email.html", 
                "auth/reset_password.html",
                "auth/password_changed.html",
                "test_email.html"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error en get_email_config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener configuración: {str(e)}"
        )

@router.post("/validate-config", response_model=ResponseMessage)
async def validate_email_config(
    current_user: dict = Depends(get_current_user)
):
    """
    Valida la configuración del servicio de email.
    
    Solo accesible para administradores.
    
    Args:
        current_user (dict): Usuario autenticado
        
    Returns:
        ResponseMessage: Resultado de la validación
    """
    try:
        # Verificar que sea admin (simplificado para testing)
        if current_user.get('id_rol') != 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se requieren permisos de administrador"
            )
        
        is_valid = validate_email_config()
        
        if is_valid:
            return ResponseMessage(
                message="Configuración de email válida",
                success=True,
                data={"config_valid": True}
            )
        else:
            return ResponseMessage(
                message="Configuración de email inválida. Verificar variables de entorno.",
                success=False,
                data={"config_valid": False}
            )
        
    except Exception as e:
        logger.error(f"Error en validate_email_config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al validar configuración: {str(e)}"
        )

# ==================== ENDPOINTS DE MARKETING ====================

@router.post("/birthday/process", response_model=ResponseMessage)
async def process_birthday_emails_endpoint(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Procesa usuarios con cumpleaños hoy y envía emails con descuentos.
    
    Este endpoint debe ser llamado diariamente (por ejemplo, mediante un cron job)
    para verificar usuarios con cumpleaños y enviarles emails automáticamente.
    
    Solo accesible para administradores.
    
    Args:
        db (Session): Sesión de base de datos
        current_user (dict): Usuario autenticado
        
    Returns:
        ResponseMessage: Resultado del procesamiento
    """
    try:
        # Verificar que sea admin
        if current_user.get('id_rol') != 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se requieren permisos de administrador"
            )
        
        logger.info("Iniciando procesamiento de emails de cumpleaños")
        result = await process_birthday_emails(db)
        
        return ResponseMessage(
            message=result.get("message", "Procesamiento completado"),
            success=result.get("success", False),
            data={
                "emails_sent": result.get("emails_sent", 0),
                "users_found": result.get("users_found", 0),
                "errors": result.get("errors")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en process_birthday_emails: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar emails de cumpleaños: {str(e)}"
        )

# ==================== ENDPOINTS DE ESTADÍSTICAS ====================

@router.get("/stats")
async def get_email_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene estadísticas del servicio de email.
    
    Solo accesible para administradores.
    Nota: Esta funcionalidad requiere implementación adicional
    para tracking de emails enviados.
    
    Args:
        current_user (dict): Usuario autenticado
        
    Returns:
        dict: Estadísticas básicas del servicio
    """
    try:
        # Verificar que sea admin (simplificado para testing)
        if current_user.get('id_rol') != 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se requieren permisos de administrador"
            )
        
        # Por ahora retornamos estadísticas básicas
        # En el futuro se puede implementar tracking completo
        return {
            "service_status": "active",
            "provider": "Resend",
            "config_valid": validate_email_config(),
            "note": "Estadísticas detalladas disponibles en versión futura"
        }
        
    except Exception as e:
        logger.error(f"Error en get_email_stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )
