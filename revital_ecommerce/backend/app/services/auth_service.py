"""
Servicio de autenticación.

Contiene la lógica de negocio para la autenticación de usuarios,
incluyendo login, verificación de credenciales y manejo de tokens.

Responsabilidades:
- autenticar credenciales y generar tokens,
- verificar OTP de email y activar cuenta,
- refrescar sesión con refresh token,
- cambio seguro de contraseña.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from typing import Optional

from core.jwt_utils import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from schemas.auth_schema import LoginRequest, TokenResponse, UserInToken
from services import user_service
from core.otp_store import verify_otp


def authenticate_user(db: Session, email: str, password: str) -> Optional[UserInToken]:
    """
    Autentica un usuario verificando sus credenciales.
    Rechaza a usuarios con email no verificado (ind_activo = False).

    Args:
        db (Session): Sesión de la base de datos
        email (str): Email del usuario
        password (str): Contraseña en texto plano

    Returns:
        Optional[UserInToken]: Información del usuario si las credenciales son válidas, None en caso contrario

    Reglas:
    - rechaza credenciales incorrectas,
    - distingue cuenta inactiva por verificación pendiente vs soft-delete.
    """
    user = user_service.get_user_by_email(db, email)
    if not user:
        return None

    if not verify_password(password, user.password_usuario):
        return None

    # Usuario inactivo: diferenciar cuenta desactivada de pendiente verificación
    if user.get("ind_activo", True) is False:
        # Cuenta desactivada (soft delete): exponer código estructurado para que el frontend
        # pueda iniciar el flujo de reactivación desde el login.
        if user.get("deleted_at") is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ACCOUNT_SOFT_DELETED",
                    "message": "Tu cuenta ha sido desactivada. ¿Deseas reactivarla?",
                },
            )
        # Cuenta pendiente de verificación de email
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verifica tu correo electrónico antes de iniciar sesión. Revisa el código que te enviamos.",
        )

    return UserInToken(
        id_usuario=user.id_usuario,
        email_usuario=user.email_usuario,
        nom_usuario=user.nom_usuario,
        ape_usuario=user.ape_usuario,
        id_rol=user.id_rol,
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

    Se consume desde:
    - `auth_router.login`
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


def verify_email_otp(db: Session, email: str, code: str) -> TokenResponse:
    """
    Verifica el código OTP para el email, activa al usuario y devuelve tokens (auto-login).

    Args:
        db (Session): Sesión de la base de datos
        email (str): Email del usuario
        code (str): Código OTP de 6 dígitos

    Returns:
        TokenResponse: Tokens para iniciar sesión

    Raises:
        HTTPException: Si el código es inválido o expiró

    Efecto:
    - activa cuenta y devuelve tokens (auto-login).
    """
    if not verify_otp(email, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido o expirado. Solicita uno nuevo desde el registro.",
        )
    user = user_service.get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    # Si es cuenta soft-deleted, reactivar (ind_activo=TRUE y deleted_at=NULL)
    if user.get("deleted_at") is not None:
        user_service.reactivate_user(db, user.id_usuario)
    else:
        user_service.update_user_status(db, user.id_usuario, True)
    access_token = create_access_token(
        data={"sub": str(user.id_usuario), "email": user.email_usuario}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id_usuario), "email": user.email_usuario}
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
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

    Se consume desde:
    - `auth_router.refresh_token`
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

    Nota:
    - función de apoyo para validación de token cuando se requiere explícitamente.
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

    Se consume desde:
    - `auth_router.change_password`
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
    
    # Verificar que la nueva contraseña no sea igual a la actual
    if verify_password(new_password, user.password_usuario):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a la contraseña actual"
        )
    
    # Actualizar contraseña
    hashed_password = get_password_hash(new_password)
    user_service.update_password(db, user_id, hashed_password, usr_operacion=user_id)
    
    return True 