"""
Router de Autenticación.

Define los endpoints de autenticación unificados para admins de Synkro y clientes.
Incluye login, refresh token, logout, cambio de contraseña, etc.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from core.token_blacklist import add_token_to_blacklist, is_token_blacklisted
from schemas.auth_schema import (
    LoginRequest, 
    TokenResponse, 
    RefreshTokenRequest,
    UserInToken,
    ChangePasswordRequest,
    ResetPasswordRequest,
    ResetPasswordConfirm,
    ResponseMessage
)
from services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login unificado para admins de Synkro y clientes.
    
    Detecta automáticamente el tipo de usuario basándose en el email.
    Primero busca en tab_usuarios_synkro, luego en tab_clientes.
    
    - **email**: Email del usuario (admin o cliente)
    - **password**: Contraseña en texto plano
    
    Returns:
        TokenResponse: Tokens de acceso y refresco, incluyendo el tipo de usuario
    """
    return auth_service.login_user(db, login_data)


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
            detail="Token revocado",
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
        UserInToken: Información del usuario (admin de Synkro o cliente)
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
    
    Funciona para admins de Synkro y clientes.
    
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
    return ResponseMessage(message="Contraseña actualizada correctamente", success=True)


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
    return ResponseMessage(message="Sesión cerrada correctamente", success=True)


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
        message=f"Token válido para {current_user.user_type}: {current_user.email}", 
        success=True
    )


@router.post("/forgot-password", response_model=ResponseMessage)
def forgot_password(
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
    # TODO: Implementar envío de email con token de reset
    # Por ahora retornamos éxito sin hacer nada por seguridad
    return ResponseMessage(
        message="Si el email existe, recibirás instrucciones para resetear tu contraseña",
        success=True
    )


@router.post("/reset-password", response_model=ResponseMessage)
def reset_password(
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
    # TODO: Implementar lógica de reset de contraseña
    # Por ahora retornamos error no implementado
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Funcionalidad de reset de contraseña pendiente de implementar"
    )
