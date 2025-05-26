"""
Servicio de autenticación.

Contiene la lógica de negocio para la autenticación de usuarios,
incluyendo login, verificación de credenciales y manejo de tokens.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from typing import Optional

from core.jwt_utils import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from schemas.auth_schema import LoginRequest, TokenResponse, UserInToken
from services import user_service

def authenticate_user(db: Session, email: str, password: str) -> Optional[UserInToken]:
    """
    Autentica un usuario verificando sus credenciales.
    
    Args:
        db (Session): Sesión de la base de datos
        email (str): Email del usuario
        password (str): Contraseña en texto plano
        
    Returns:
        Optional[UserInToken]: Información del usuario si las credenciales son válidas, None en caso contrario
    """
    # Buscar usuario por email
    user = user_service.get_user_by_email(db, email)
    if not user:
        return None
    
    # Verificar contraseña
    if not verify_password(password, user.password_usuario):
        return None
    
    # Retornar información del usuario
    return UserInToken(
        id_usuario=user.id_usuario,
        email_usuario=user.email_usuario,
        nom_usuario=user.nom_usuario,
        ape_usuario=user.ape_usuario,
        id_rol=user.id_rol
    )

def login_user(db: Session, login_data: LoginRequest) -> TokenResponse:
    """
    Realiza el login de un usuario y genera tokens.
    
    Args:
        db (Session): Sesión de la base de datos
        login_data (LoginRequest): Datos de login del usuario
        
    Returns:
        TokenResponse: Tokens de acceso y refresco
        
    Raises:
        HTTPException: Si las credenciales son inválidas
    """
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear tokens
    access_token = create_access_token(
        data={"sub": str(user.id_usuario), "email": user.email_usuario}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id_usuario), "email": user.email_usuario}
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    """
    Genera un nuevo token de acceso usando un refresh token.
    
    Args:
        db (Session): Sesión de la base de datos
        refresh_token (str): Token de refresco
        
    Returns:
        TokenResponse: Nuevos tokens de acceso y refresco
        
    Raises:
        HTTPException: Si el refresh token es inválido
    """
    # Verificar refresh token
    payload = verify_token(refresh_token, token_type="refresh")
    user_id = payload.get("sub")
    email = payload.get("email")
    
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar que el usuario aún existe
    user = user_service.get_user(db, Decimal(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear nuevos tokens
    access_token = create_access_token(
        data={"sub": user_id, "email": email}
    )
    new_refresh_token = create_refresh_token(
        data={"sub": user_id, "email": email}
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token
    )

def get_current_user(db: Session, token: str) -> UserInToken:
    """
    Obtiene el usuario actual basado en el token de acceso.
    
    Args:
        db (Session): Sesión de la base de datos
        token (str): Token de acceso
        
    Returns:
        UserInToken: Información del usuario actual
        
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    # Verificar token
    payload = verify_token(token, token_type="access")
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Obtener usuario
    user = user_service.get_user(db, Decimal(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserInToken(
        id_usuario=user.id_usuario,
        email_usuario=user.email_usuario,
        nom_usuario=user.nom_usuario,
        ape_usuario=user.ape_usuario,
        id_rol=user.id_rol
    )

def change_password(db: Session, user_id: Decimal, current_password: str, new_password: str) -> bool:
    """
    Cambia la contraseña de un usuario.
    
    Args:
        db (Session): Sesión de la base de datos
        user_id (Decimal): ID del usuario
        current_password (str): Contraseña actual
        new_password (str): Nueva contraseña
        
    Returns:
        bool: True si el cambio fue exitoso
        
    Raises:
        HTTPException: Si la contraseña actual es incorrecta
    """
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar contraseña actual
    if not verify_password(current_password, user.password_usuario):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    # Actualizar contraseña
    hashed_password = get_password_hash(new_password)
    user_service.update_password(db, user_id, hashed_password)
    
    return True 