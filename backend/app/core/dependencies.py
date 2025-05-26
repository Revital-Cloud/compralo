"""
Dependencias de FastAPI.

Define las dependencias reutilizables para la aplicación,
especialmente para la autenticación y autorización.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from core.database import get_db
from schemas.auth_schema import UserInToken
from services import auth_service

# Configuración del esquema de seguridad Bearer
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserInToken:
    """
    Dependencia para obtener el usuario actual autenticado.
    
    Args:
        credentials: Credenciales del token Bearer
        db: Sesión de la base de datos
        
    Returns:
        UserInToken: Información del usuario autenticado
        
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    return auth_service.get_current_user(db, credentials.credentials)

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[UserInToken]:
    """
    Dependencia para obtener el usuario actual de forma opcional.
    No lanza error si no hay token.
    
    Args:
        credentials: Credenciales del token Bearer (opcional)
        db: Sesión de la base de datos
        
    Returns:
        Optional[UserInToken]: Información del usuario autenticado o None
    """
    if not credentials:
        return None
    
    try:
        return auth_service.get_current_user(db, credentials.credentials)
    except HTTPException:
        return None

def require_role(required_role: int):
    """
    Dependencia para verificar que el usuario tenga un rol específico.
    
    Args:
        required_role (int): ID del rol requerido
        
    Returns:
        function: Función de dependencia que verifica el rol
    """
    def role_checker(current_user: UserInToken = Depends(get_current_user)) -> UserInToken:
        if current_user.id_rol != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción"
            )
        return current_user
    
    return role_checker

def require_admin():
    """
    Dependencia para verificar que el usuario sea administrador.
    Asume que el rol de administrador tiene ID = 1.
    
    Returns:
        UserInToken: Usuario autenticado con rol de administrador
    """
    return require_role(1)

def require_user_or_admin(user_id: int):
    """
    Dependencia para verificar que el usuario sea el propietario del recurso o administrador.
    
    Args:
        user_id (int): ID del usuario propietario del recurso
        
    Returns:
        function: Función de dependencia que verifica el acceso
    """
    def access_checker(current_user: UserInToken = Depends(get_current_user)) -> UserInToken:
        if current_user.id_usuario != user_id and current_user.id_rol != 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a este recurso"
            )
        return current_user
    
    return access_checker 