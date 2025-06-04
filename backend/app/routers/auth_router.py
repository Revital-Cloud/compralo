"""
Router de autenticación.

Define los endpoints relacionados con la autenticación de usuarios,
incluyendo login, refresh de tokens, cambio de contraseña y obtención
de información del usuario actual.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import (
    LoginRequest, 
    TokenResponse, 
    RefreshTokenRequest, 
    UserInToken, 
    ChangePasswordRequest
)
from schemas.user_schema import ResponseMessage
from services import auth_service

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

@router.get("/me", response_model=UserInToken)
async def get_current_user_info(
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Endpoint para obtener información del usuario actual.
    
    Args:
        current_user (UserInToken): Usuario autenticado (inyectado por dependencia)
        
    Returns:
        UserInToken: Información del usuario actual
    """
    return current_user

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