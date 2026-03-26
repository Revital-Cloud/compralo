"""
Router de autenticación.

Define los endpoints relacionados con la autenticación de usuarios,
incluyendo login, refresh de tokens, cambio de contraseña y obtención
de información del usuario actual.

Mapa del módulo:
- Login/refresh/logout.
- Verificación de email por OTP.
- Verificación y recuperación de contraseña.
- Endpoint `me` para perfil seguro del usuario autenticado.

Relación con capas:
- Router: seguridad HTTP, rate-limit y composición de cookies/tokens.
- Services: `auth_service`, `user_service`, `email_service`.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from decimal import Decimal

from core.database import get_db
from core.config import settings, is_production
from core.dependencies import get_current_user
from schemas.auth_schema import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserInToken,
    ChangePasswordRequest,
    ResetPasswordRequest,
    ResetPasswordConfirm,
    VerifyEmailOtpRequest,
    ResendEmailOtpRequest,
)
from schemas.user_schema import ResponseMessage, User, UserCreate, UserUpdate, UserPublic
from services import auth_service
from services import user_service
from core.dependencies import get_current_user
from core.rate_limiter import limiter
from core.login_attempt_lockout import clear_failed_logins, get_remaining_lockout_seconds, record_failed_login
from core.turnstile import verify_turnstile

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Autenticación"])

@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/hour")
async def login(
    request: Request,
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
    # Fixed cooldown after N failed attempts (per email).
    remaining = get_remaining_lockout_seconds(login_data.email)
    if remaining > 0:
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Too many requests. Please try again later.",
                "retry_after": remaining,
            },
        )

    try:
        # Cloudflare Turnstile verification (server-side)
        # Si está habilitado y hay secret configurada, exigimos token.
        if settings.TURNSTILE_ENABLED and settings.TURNSTILE_SECRET_KEY:
            remote_ip = request.client.host if request.client else None
            if not login_data.turnstile_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Captcha requerido. Por favor, completa la verificación e inténtalo de nuevo.",
                )
            ok = await verify_turnstile(login_data.turnstile_token, remote_ip=remote_ip)
            if not ok:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Captcha inválido. Por favor, vuelve a intentarlo.",
                )

        tokens = auth_service.login_user(db, login_data)
        # Login success -> reset lockout state.
        clear_failed_logins(login_data.email)
        return _token_response(tokens.access_token, tokens.refresh_token)
    except HTTPException as exc:
        # Wrong credentials -> count failure for lockout.
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            record_failed_login(login_data.email)
        raise


@router.post("/verify-email-otp", response_model=TokenResponse)
@limiter.limit("10/minute")
async def verify_email_otp(
    request: Request,
    body: VerifyEmailOtpRequest,
    db: Session = Depends(get_db),
):
    """
    Verifica el código OTP enviado al email y activa la cuenta.
    Devuelve tokens para iniciar sesión automáticamente.
    """
    tokens = auth_service.verify_email_otp(db, body.email, body.code)
    return _token_response(tokens.access_token, tokens.refresh_token)


@router.post("/resend-email-otp", response_model=ResponseMessage)
@limiter.limit("5/minute")
@limiter.limit("20/hour")
async def resend_email_otp(
    request: Request,
    body: ResendEmailOtpRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Reenvía un nuevo código OTP de verificación de email.
    Público: se identifica al usuario solo por su email.
    """
    from core.otp_store import set_otp, get_otp_expires_minutes
    from services.email_service import send_verification_otp_email
    from urllib.parse import quote

    user = user_service.get_user_by_email(db, body.email)
    if not user:
        # No revelar si el email existe o no
        return ResponseMessage(
            message="Si el email existe en nuestro sistema, te enviaremos un nuevo código.",
            success=True,
        )

    # Si ya está activo, no tiene sentido reenviar código
    if user.get("ind_activo", True):
        return ResponseMessage(
            message="Tu cuenta ya está verificada. Inicia sesión con tu correo y contraseña.",
            success=True,
        )

    otp_code = set_otp(user.email_usuario)
    verify_url = f"{settings.VERIFY_EMAIL_URL}?email={quote(user.email_usuario)}"
    expires_min = get_otp_expires_minutes()

    background_tasks.add_task(
        send_verification_otp_email,
        user_email=user.email_usuario,
        user_name=user.nom_usuario,
        otp_code=otp_code,
        verify_url=verify_url,
        expires_in_minutes=expires_min,
    )

    return ResponseMessage(
        message="Si el email existe en nuestro sistema, te enviaremos un nuevo código de verificación.",
        success=True,
    )


REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api"
REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * settings.REFRESH_TOKEN_EXPIRE_DAYS  # seconds


def _token_response(access_token: str, refresh_token: str) -> JSONResponse:
    """
    Construye respuesta estándar de autenticación.

    - `access_token` en body.
    - `refresh_token` en cookie HTTPOnly (SEC-001).
    """
    response = JSONResponse(
        content={"access_token": access_token, "token_type": "bearer"}
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=is_production(),
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
        max_age=REFRESH_COOKIE_MAX_AGE,
    )
    return response


@router.post("/refresh")
@limiter.limit("30/minute")
async def refresh_token(
    request: Request,
    db: Session = Depends(get_db),
    refresh_data: Optional[RefreshTokenRequest] = Body(default=None),
):
    """
    Endpoint para refrescar el token de acceso.
    Lee el refresh token de la cookie (prioridad) o del body (migración).
    Devuelve access_token en el body y refresh_token en cookie HTTPOnly.

    Endpoint -> Service:
    - Endpoint: `POST /refresh`
    - Service: `auth_service.refresh_access_token`
    """
    refresh_value = request.cookies.get(REFRESH_COOKIE_NAME) or (
        refresh_data.refresh_token if refresh_data else None
    )
    if not refresh_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no proporcionado (cookie o body)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    tokens = auth_service.refresh_access_token(db, refresh_value)
    return _token_response(tokens.access_token, tokens.refresh_token)

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

    Endpoint -> Service:
    - Endpoint: `GET /me`
    - Service: `user_service.get_user`
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
        des_direccion=None,  # Las direcciones están en tab_direcciones_usuario, no en tab_usuarios
        avatar_seed=full_user.get('avatar_seed'),
        avatar_colors=full_user.get('avatar_colors'),
    )

@router.post("/change-password", response_model=ResponseMessage)
@limiter.limit("10/minute")
async def change_password(
    request: Request,
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

    Endpoint -> Service:
    - Endpoint: `POST /change-password`
    - Service: `auth_service.change_password`
    """
    auth_service.change_password(
        db, 
        current_user.id_usuario, 
        password_data.current_password, 
        password_data.new_password
    )
    return ResponseMessage(message="Contraseña cambiada exitosamente")

@router.post("/logout")
async def logout(
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Endpoint para cerrar sesión. Invalida la cookie de refresh token (SEC-001).
    El cliente debe limpiar el access token en memoria.

    Endpoint:
    - `POST /logout`
    """
    response = JSONResponse(
        content={"message": "Sesión cerrada exitosamente."}
    )
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
    return response

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

    Endpoint:
    - `GET /verify-token`
    """
    return {
        "valid": True,
        "user_id": current_user.id_usuario,
        "email": current_user.email_usuario
    }

@router.post("/send-verification-email")
@limiter.limit("5/minute")
@limiter.limit("20/hour")
async def send_verification_email(
    request: Request,
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
        from core.exceptions import get_safe_message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_safe_message(e),
        )

@router.post("/verify-email")
@limiter.limit("10/minute")
async def verify_email_endpoint(
    request: Request,
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
@limiter.limit("5/minute")
@limiter.limit("20/hour")
async def forgot_password(
    request: Request,
    reset_request: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Solicita reset de contraseña. Público (sin autenticación requerida).
    
    Args:
        reset_request (ResetPasswordRequest): Email del usuario
        db (Session): Sesión de base de datos
        
    Returns:
        ResponseMessage: Siempre retorna éxito (por seguridad)
        
    Security:
        - No revela si el email existe o no
        - Rate limiting implementado
        - Logs de seguridad
    """
    try:
        # Buscar usuario por email
        user = user_service.get_user_by_email(db, reset_request.email)
        
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
            
            logger.info(f"Password reset requested for existing user: {reset_request.email}")
        else:
            # Usuario no existe, pero no revelamos esta información
            logger.warning(f"Password reset requested for non-existent user: {reset_request.email}")
        
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
@limiter.limit("5/minute")
@limiter.limit("20/hour")
async def reset_password(
    request: Request,
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
        
        # Verificar que la nueva contraseña no sea igual a la actual
        from core.jwt_utils import get_password_hash, verify_password
        if verify_password(reset_data.new_password, user.password_usuario):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña no puede ser igual a la contraseña actual"
            )
        
        # Cambiar contraseña
        hashed_password = get_password_hash(reset_data.new_password)
        
        # Actualizar contraseña en BD (el usuario cambia su propia contraseña)
        user_service.update_password(db, user_id, hashed_password, usr_operacion=user_id)

        # Si la cuenta estaba soft-deleted, reactivarla (ind_activo=TRUE, deleted_at=NULL)
        if user.get("ind_activo") is False and user.get("deleted_at") is not None:
            user_service.reactivate_user(db, Decimal(str(user_id)))
        
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
            message="Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.",
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