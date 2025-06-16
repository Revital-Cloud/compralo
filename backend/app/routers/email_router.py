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
from typing import List, Dict, Any
import logging

from schemas.email_schema import (
    EmailSend, EmailResponse, TestEmailData, WelcomeEmailData,
    VerificationEmailData, PasswordResetEmailData, ResponseMessage
)
from services.email_service import email_service
from core.dependencies import get_current_user
from middlewares.role_middleware import require_role

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

# ==================== ENDPOINTS DE TESTING ====================

@router.post("/test-local", response_model=EmailResponse)
async def send_test_email_local(
    test_data: TestEmailData
):
    """
    Envía un email de prueba SIN AUTENTICACIÓN (solo para testing local).
    
    ⚠️ IMPORTANTE: Este endpoint debe ser removido en producción.
    
    Args:
        test_data (TestEmailData): Datos del email de prueba
        
    Returns:
        EmailResponse: Resultado del envío
        
    Raises:
        HTTPException: Si hay error en el envío
    """
    try:
        logger.info(f"🧪 TESTING LOCAL: Enviando email de prueba a {test_data.to}")
        
        response = await email_service.send_test_email(test_data)
        
        if not response.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=response.message
            )
        
        return response
        
    except Exception as e:
        logger.error(f"Error en send_test_email_local: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar email de prueba: {str(e)}"
        )

@router.post("/test", response_model=EmailResponse)
async def send_test_email(
    test_data: TestEmailData,
    current_user: dict = Depends(get_current_user)
):
    """
    Envía un email de prueba.
    
    Este endpoint permite enviar emails de prueba para verificar
    que el sistema de envío está funcionando correctamente.
    
    Args:
        test_data (TestEmailData): Datos del email de prueba
        current_user (dict): Usuario autenticado (requerido)
        
    Returns:
        EmailResponse: Resultado del envío
        
    Raises:
        HTTPException: Si hay error en el envío
    """
    try:
        logger.info(f"Enviando email de prueba a {test_data.to} por usuario {current_user.get('email')}")
        
        response = await email_service.send_test_email(test_data)
        
        if not response.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=response.message
            )
        
        return response
        
    except Exception as e:
        logger.error(f"Error en send_test_email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar email de prueba: {str(e)}"
        )

@router.post("/send", response_model=EmailResponse)
async def send_custom_email(
    email_data: EmailSend,
    current_user: dict = Depends(get_current_user)
):
    """
    Envía un email personalizado.
    
    Permite enviar emails con contenido personalizado o utilizando templates.
    
    Args:
        email_data (EmailSend): Datos del email a enviar
        current_user (dict): Usuario autenticado (requerido)
        
    Returns:
        EmailResponse: Resultado del envío
        
    Raises:
        HTTPException: Si hay error en el envío
    """
    try:
        logger.info(f"Enviando email personalizado a {email_data.to} por usuario {current_user.get('email')}")
        
        response = await email_service.send_email(email_data)
        
        if not response.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=response.message
            )
        
        return response
        
    except Exception as e:
        logger.error(f"Error en send_custom_email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al enviar email personalizado: {str(e)}"
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
        
        success = await email_service.send_welcome_email(
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
        
        success = await email_service.send_verification_email(
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
        
        success = await email_service.send_password_reset_email(
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
        
        config_valid = email_service.validate_email_config()
        
        return {
            "service": "Resend",
            "from_email": email_service.from_email,
            "from_name": email_service.from_name,
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
        
        is_valid = email_service.validate_email_config()
        
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
            "config_valid": email_service.validate_email_config(),
            "note": "Estadísticas detalladas disponibles en versión futura"
        }
        
    except Exception as e:
        logger.error(f"Error en get_email_stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )
