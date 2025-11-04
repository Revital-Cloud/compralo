"""
Router de autenticación.

Define los endpoints relacionados con la autenticación de usuarios,
incluyendo login, refresh de tokens, cambio de contraseña y obtención
de información del usuario actual.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import (
    LoginRequest, 
    TokenResponse, 
    RefreshTokenRequest, 
    UserInToken, 
    ChangePasswordRequest,
    ResetPasswordRequest,
    ResetPasswordConfirm
)
from schemas.user_schema import ResponseMessage, User, UserCreate, UserUpdate, UserPublic
from services import auth_service
from services import user_service
from core.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Autenticación"])

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint para iniciar sesión.
    
    Args:
        login_data (LoginRequest): Datos de login (email y contraseña)
        db (Session): Sesión de la base de datos
        
    Returns:
        TokenResponse: Tokens de acceso y refresco
        
    Raises:
        HTTPException: Si las credenciales son inválidas
    """
    return auth_service.login_user(db, login_data)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint para refrescar el token de acceso.
    
    Args:
        refresh_data (RefreshTokenRequest): Token de refresco
        db (Session): Sesión de la base de datos
        
    Returns:
        TokenResponse: Nuevos tokens de acceso y refresco
        
    Raises:
        HTTPException: Si el refresh token es inválido
    """
    return auth_service.refresh_access_token(db, refresh_data.refresh_token)

@router.get("/me", response_model=UserPublic)
async def get_current_user_info(
    current_user: UserInToken = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint para obtener información segura del usuario actual.
    
    Solo devuelve información necesaria para el frontend, sin datos sensibles
    como contraseñas, información personal o datos de auditoría.
    
    Args:
        current_user (UserInToken): Usuario autenticado (inyectado por dependencia)
        db (Session): Sesión de la base de datos
        
    Returns:
        UserPublic: Información segura del usuario actual
    """
    # Obtener la información completa del usuario desde la base de datos
    full_user = user_service.get_user(db, current_user.id_usuario)
    if full_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Convertir fec_nacimiento a string si existe (datetime a string)
    fec_nacimiento_str = None
    if full_user.get('fec_nacimiento'):
        if isinstance(full_user['fec_nacimiento'], datetime):
            fec_nacimiento_str = full_user['fec_nacimiento'].strftime('%Y-%m-%d')
        else:
            fec_nacimiento_str = str(full_user['fec_nacimiento'])
    
    # Retornar solo la información segura
    return UserPublic(
        id_usuario=full_user['id_usuario'],
        nom_usuario=full_user['nom_usuario'],
        ape_usuario=full_user['ape_usuario'],
        email_usuario=full_user['email_usuario'],
        id_rol=full_user.get('id_rol'),
        cel_usuario=full_user.get('cel_usuario'),
        fec_nacimiento=fec_nacimiento_str,
        des_direccion=None  # Las direcciones están en tab_direcciones_usuario, no en tab_usuarios
    )

@router.post("/change-password", response_model=ResponseMessage)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: UserInToken = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Endpoint para cambiar la contraseña del usuario actual.
    
    Args:
        password_data (ChangePasswordRequest): Contraseña actual y nueva
        current_user (UserInToken): Usuario autenticado
        db (Session): Sesión de la base de datos
        
    Returns:
        ResponseMessage: Mensaje de confirmación
        
    Raises:
        HTTPException: Si la contraseña actual es incorrecta
    """
    auth_service.change_password(
        db, 
        current_user.id_usuario, 
        password_data.current_password, 
        password_data.new_password
    )
    return ResponseMessage(message="Contraseña cambiada exitosamente")

@router.post("/logout", response_model=ResponseMessage)
async def logout(
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Endpoint para cerrar sesión.
    
    Nota: En una implementación JWT stateless, el logout se maneja en el cliente
    eliminando los tokens. Este endpoint existe para consistencia de API.
    
    Args:
        current_user (UserInToken): Usuario autenticado
        
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    return ResponseMessage(
        message="Sesión cerrada exitosamente. Elimina los tokens del cliente."
    )

@router.get("/verify-token")
async def verify_token(
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Endpoint para verificar si un token es válido.
    
    Args:
        current_user (UserInToken): Usuario autenticado (inyectado por dependencia)
        
    Returns:
        dict: Confirmación de que el token es válido
    """
    return {
        "valid": True,
        "user_id": current_user.id_usuario,
        "email": current_user.email_usuario
    }

@router.post("/send-verification-email")
async def send_verification_email(
    user_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Envía email de verificación con token seguro.
    
    Args:
        user_id (int): ID del usuario a verificar
        db (Session): Sesión de base de datos
        current_user (UserInToken): Usuario autenticado
        
    Returns:
        dict: Confirmación del envío
    """
    try:
        # Solo permite enviar verificación a su propia cuenta o si es admin
        if current_user.id_usuario != user_id and current_user.id_rol != 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para enviar verificación a este usuario"
            )
        
        # Obtener usuario de la BD
        user = user_service.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Crear token específico de verificación (no access token)
        from core.jwt_utils import create_verification_token
        verification_token = create_verification_token(
            user_id=user.id_usuario,
            email=user.email_usuario,
            expires_hours=24
        )
        
        # Importar y usar la función de email
        from services.email_service import send_verification_email
        background_tasks.add_task(
            send_verification_email,
            user_email=user.email_usuario,
            user_name=user.nom_usuario,
            verification_token=verification_token
        )
        
        return {
            "message": "Email de verificación enviado exitosamente",
            "success": True,
            "email": user.email_usuario
        }
        
    except Exception as e:
        logger.error(f"Error en send_verification_email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )

@router.post("/verify-email")
async def verify_email_endpoint(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verifica el email del usuario usando el token de verificación.
    
    Args:
        token (str): Token de verificación recibido en el email
        db (Session): Sesión de base de datos
        
    Returns:
        dict: Resultado de la verificación
    """
    try:
        # Verificar token específico de verificación
        from core.jwt_utils import verify_verification_token
        payload = verify_verification_token(token)
        
        user_id = int(payload.get("sub"))
        email = payload.get("email")
        
        # Obtener usuario de la BD
        user = user_service.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Verificar que el email coincida
        if user.email_usuario != email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El token no corresponde a este usuario"
            )
        
        # Marcar email como verificado
        # Nota: Necesitarás agregar un campo 'email_verified' a tu modelo User
        # Por ahora solo retornamos éxito
        
        return {
            "message": "Email verificado exitosamente",
            "success": True,
            "user_id": user_id,
            "email": email,
            "verified_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en verify_email_endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/forgot-password", response_model=ResponseMessage)
async def forgot_password(
    request: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Solicita reset de contraseña. Público (sin autenticación requerida).
    
    Args:
        request (ResetPasswordRequest): Email del usuario
        db (Session): Sesión de base de datos
        
    Returns:
        ResponseMessage: Siempre retorna éxito (por seguridad)
        
    Security:
        - No revela si el email existe o no
        - Rate limiting recomendado
        - Logs de seguridad
    """
    try:
        # Buscar usuario por email
        user = user_service.get_user_by_email(db, request.email)
        
        if user:
            # Crear token de reset específico
            from core.jwt_utils import create_password_reset_token
            reset_token = create_password_reset_token(
                user_id=user.id_usuario,
                email=user.email_usuario,
                expires_hours=1  # Token expira en 1 hora
            )
            
            # Enviar email de reset
            from services.email_service import send_password_reset_email
            background_tasks.add_task(
                send_password_reset_email,
                user_email=user.email_usuario,
                user_name=user.nom_usuario,
                reset_token=reset_token
            )
            
            logger.info(f"Password reset requested for existing user: {request.email}")
        else:
            # Usuario no existe, pero no revelamos esta información
            logger.warning(f"Password reset requested for non-existent user: {request.email}")
        
        # SIEMPRE retornamos éxito (no revelamos si el email existe)
        return ResponseMessage(
            message="Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña",
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error en forgot_password: {str(e)}")
        # En caso de error, también retornamos mensaje genérico
        return ResponseMessage(
            message="Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña",
            success=True
        )

@router.post("/reset-password", response_model=ResponseMessage)
async def reset_password(
    reset_data: ResetPasswordConfirm,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Confirma el reset de contraseña usando el token del email.
    
    Args:
        reset_data (ResetPasswordConfirm): Token y nueva contraseña
        db (Session): Sesión de base de datos
        
    Returns:
        ResponseMessage: Resultado del reset
        
    Security:
        - Verifica token JWT específico de reset
        - Token se usa una sola vez (blacklist)
        - Hash seguro de la nueva contraseña
        - Email de confirmación
    """
    try:
        # Verificar si el token ya fue usado
        from core.token_blacklist import is_token_blacklisted, add_token_to_blacklist
        
        if is_token_blacklisted(reset_data.token):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este enlace de restablecimiento ya fue utilizado. Solicita uno nuevo."
            )
        
        # Verificar token de reset
        from core.jwt_utils import verify_password_reset_token
        payload = verify_password_reset_token(reset_data.token)
        
        user_id = int(payload.get("sub"))
        email = payload.get("email")
        
        # Obtener usuario
        user = user_service.get_user_by_id(db, user_id)
        if not user or user.email_usuario != email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de reset inválido o expirado"
            )
        
        # Cambiar contraseña
        from core.jwt_utils import get_password_hash
        hashed_password = get_password_hash(reset_data.new_password)
        
        # Actualizar contraseña en BD
        user_service.update_password(db, user_id, hashed_password)
        
        # Agregar token a blacklist para evitar reutilización
        add_token_to_blacklist(reset_data.token)
        
        # Enviar email de confirmación
        from services.email_service import send_password_changed_email
        background_tasks.add_task(
            send_password_changed_email,
            user_email=user.email_usuario,
            user_name=user.nom_usuario,
            ip_address=None
        )
        
        logger.info(f"Password successfully reset for user: {email}")
        
        return ResponseMessage(
            message="Contraseña restablecida exitosamente. Puedes iniciar sesión con tu nueva contraseña.",
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en reset_password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        ) 