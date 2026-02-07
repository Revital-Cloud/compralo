"""
Router de Autenticación.

Define los endpoints de autenticación unificados para admins de Revital y clientes.
Incluye login, refresh token, logout, cambio de contraseña, registro público, etc.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from core.token_blacklist import add_token_to_blacklist, is_token_blacklisted
from core.rate_limiter import limiter
from schemas.auth_schema import (
    LoginRequest, 
    TokenResponse, 
    RefreshTokenRequest,
    UserInToken,
    ChangePasswordRequest,
    ResetPasswordRequest,
    ResetPasswordConfirm,
    ResponseMessage,
    RegisterRequest
)
from services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
@limiter.limit("100/hour")
def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login unificado para admins de Revital y clientes.
    
    Detecta automáticamente el tipo de usuario basándose en el email.
    Primero busca en tab_usuarios_revital, luego en tab_clientes.
    
    - **email**: Email del usuario (admin o cliente)
    - **password**: Contraseña en texto plano
    
    Returns:
        TokenResponse: Tokens de acceso y refresco, incluyendo el tipo de usuario
    """
    return auth_service.login_user(db, login_data)


@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/minute")
@limiter.limit("20/hour")
def register(
    request: Request,
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Public registration endpoint for new clients.
    
    Creates a new client account with 'trial' status.
    The client can login immediately but needs to select a plan
    before creating an e-commerce instance.
    
    Rate limited to prevent abuse:
    - 5 attempts per minute per IP
    - 20 attempts per hour per IP
    
    - **nom_empresa**: Company name
    - **identificacion_fiscal**: Tax ID (NIT, EIN, etc.)
    - **nom_contacto_principal**: Primary contact name
    - **email_contacto_principal**: Email for login
    - **password**: Account password (min 8 characters)
    
    Returns:
        TokenResponse: Access and refresh tokens (auto-login after registration)
    """
    return auth_service.register_user(db, register_data)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresca el token de acceso usando un refresh token válido.
    
    - **refresh_token**: Token de refresco obtenido en el login
    
    Returns:
        TokenResponse: Nuevos tokens de acceso y refresco
    """
    # Verificar si el token está en la blacklist
    if is_token_blacklisted(refresh_data.refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Revoked token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return auth_service.refresh_access_token(db, refresh_data.refresh_token)


@router.get("/me")
def get_current_user_info(
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene la información del usuario actual autenticado.
    
    Returns:
        UserInToken: Información del usuario (admin de Revital o cliente)
    """
    return {
        "user_type": current_user.user_type,
        "id": str(current_user.id),
        "email": current_user.email,
        "nombre": current_user.nombre,
        "rol": current_user.rol,
        "identificacion_fiscal": current_user.identificacion_fiscal,
        "ind_activo": current_user.ind_activo
    }


@router.post("/change-password", response_model=ResponseMessage)
def change_password(
    password_data: ChangePasswordRequest,
    current_user: UserInToken = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cambia la contraseña del usuario actual.
    
    Funciona para admins de Revital y clientes.
    
    - **current_password**: Contraseña actual
    - **new_password**: Nueva contraseña (mínimo 8 caracteres)
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    auth_service.change_password(
        db, 
        current_user, 
        password_data.current_password, 
        password_data.new_password
    )
    return ResponseMessage(message="Password updated successfully", success=True)


@router.post("/logout", response_model=ResponseMessage)
def logout(
    refresh_data: RefreshTokenRequest,
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Cierra la sesión del usuario invalidando el refresh token.
    
    - **refresh_token**: Token de refresco a invalidar
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    # Agregar el refresh token a la blacklist
    add_token_to_blacklist(refresh_data.refresh_token)
    return ResponseMessage(message="Session closed successfully", success=True)


@router.post("/verify-token", response_model=ResponseMessage)
def verify_token(
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Verifica si el token de acceso actual es válido.
    
    Returns:
        ResponseMessage: Confirmación de validez del token
    """
    return ResponseMessage(
        message=f"Valid token for {current_user.user_type}: {current_user.email}", 
        success=True
    )


@router.post("/forgot-password", response_model=ResponseMessage)
@limiter.limit("5/minute")
@limiter.limit("20/hour")
def forgot_password(
    request: Request,
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Solicita un reset de contraseña.
    
    Envía un email con un token para resetear la contraseña.
    
    - **email**: Email del usuario (admin o cliente)
    
    Returns:
        ResponseMessage: Mensaje de confirmación (siempre éxito por seguridad)
    """
    # La lógica interna no revela si el email existe o no
    auth_service.request_password_reset(db, reset_data.email)
    return ResponseMessage(
        message="If the email exists, you will receive instructions to reset your password",
        success=True
    )


@router.post("/reset-password", response_model=ResponseMessage)
@limiter.limit("5/minute")
@limiter.limit("20/hour")
def reset_password(
    request: Request,
    reset_confirm: ResetPasswordConfirm,
    db: Session = Depends(get_db)
):
    """
    Resetea la contraseña usando un token de reset.
    
    - **token**: Token de reset recibido por email
    - **new_password**: Nueva contraseña (mínimo 8 caracteres)
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    auth_service.reset_password(db, reset_confirm.token, reset_confirm.new_password)
    return ResponseMessage(
        message="Password updated successfully",
        success=True,
    )
