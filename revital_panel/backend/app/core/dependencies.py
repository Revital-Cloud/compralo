"""
Dependencias de FastAPI.

Define las dependencias reutilizables para la aplicaci?n,
especialmente para la autenticaci?n y autorizaci?n de admins de Revital y clientes.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List

from core.database import get_db
from schemas.auth_schema import UserInToken
from services import auth_service

# Configuraci?n del esquema de seguridad Bearer
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserInToken:
    """
    Dependencia para obtener el usuario actual autenticado.
    Funciona para admins de Revital y clientes.
    
    Args:
        credentials: Credenciales del token Bearer
        db: Sesi?n de la base de datos
        
    Returns:
        UserInToken: Informaci?n del usuario autenticado
        
    Raises:
        HTTPException: Si el token es inv?lido o el usuario no existe
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
        db: Sesi?n de la base de datos
        
    Returns:
        Optional[UserInToken]: Informaci?n del usuario autenticado o None
    """
    if not credentials:
        return None
    
    try:
        return auth_service.get_current_user(db, credentials.credentials)
    except HTTPException:
        return None


def require_admin_revital(
    current_user: UserInToken = Depends(get_current_user)
) -> UserInToken:
    """
    Dependencia para verificar que el usuario sea un admin de Revital.
    
    Args:
        current_user: Usuario autenticado
        
    Returns:
        UserInToken: Usuario autenticado si es admin de Revital
        
    Raises:
        HTTPException: Si el usuario no es admin de Revital
    """
    if current_user.user_type != "admin_revital":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores de Revital pueden realizar esta acci?n"
        )
    return current_user


def require_admin_revital_role(required_roles: List[str]):
    """
    Dependencia para verificar que el admin de Revital tenga un rol espec?fico.
    
    Args:
        required_roles (List[str]): Lista de roles permitidos ('admin_revital', 'soporte', 'ventas')
        
    Returns:
        function: Funci?n de dependencia que verifica el rol
    """
    def role_checker(current_user: UserInToken = Depends(require_admin_revital)) -> UserInToken:
        if current_user.rol not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de los siguientes roles: {', '.join(required_roles)}"
            )
        return current_user
    
    return role_checker


def require_cliente(
    current_user: UserInToken = Depends(get_current_user)
) -> UserInToken:
    """
    Dependencia para verificar que el usuario sea un cliente.
    
    Args:
        current_user: Usuario autenticado
        
    Returns:
        UserInToken: Usuario autenticado si es cliente
        
    Raises:
        HTTPException: Si el usuario no es cliente
    """
    if current_user.user_type != "cliente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta acci?n es solo para clientes"
        )
    return current_user


def require_admin_revital_or_owner(identificacion_fiscal: str):
    """
    Dependencia para verificar que el usuario sea admin de Revital o el cliente due?o del recurso.
    
    Args:
        identificacion_fiscal (str): Identificaci?n fiscal del cliente due?o del recurso
        
    Returns:
        function: Funci?n de dependencia que verifica el acceso
    """
    def access_checker(current_user: UserInToken = Depends(get_current_user)) -> UserInToken:
        # Si es admin de Revital, tiene acceso
        if current_user.user_type == "admin_revital":
            return current_user
        
        # Si es cliente, verificar que sea el due?o
        if current_user.user_type == "cliente" and current_user.identificacion_fiscal == identificacion_fiscal:
            return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a este recurso"
        )
    
    return access_checker


def require_any_authenticated(
    current_user: UserInToken = Depends(get_current_user)
) -> UserInToken:
    """
    Dependencia para verificar que el usuario est? autenticado (admin o cliente).
    
    Args:
        current_user: Usuario autenticado
        
    Returns:
        UserInToken: Usuario autenticado
    """
    return current_user
