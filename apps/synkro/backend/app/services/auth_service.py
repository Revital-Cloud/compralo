"""
Servicio de autenticación unificado.

Contiene la lógica de negocio para la autenticación de usuarios
(admins de Synkro y clientes), incluyendo login, verificación de 
credenciales y manejo de tokens.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from typing import Optional, Union

from core.jwt_utils import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from schemas.auth_schema import LoginRequest, TokenResponse, UserInToken
from services import usuario_synkro_service, cliente_service


def authenticate_user(db: Session, email: str, password: str) -> Optional[UserInToken]:
    """
    Autentica un usuario verificando sus credenciales.
    Busca primero en admins de Synkro, luego en clientes.
    
    Args:
        db (Session): Sesión de la base de datos
        email (str): Email del usuario
        password (str): Contraseña en texto plano
        
    Returns:
        Optional[UserInToken]: Información del usuario si las credenciales son válidas, None en caso contrario
    """
    # 1. Primero buscar en admins de Synkro
    admin = usuario_synkro_service.get_usuario_by_email(db, email)
    if admin:
        # Verificar que el admin está activo
        if not admin.get("ind_activo", False):
            return None
        
        # Verificar contraseña
        if admin.get("password_usuario") and verify_password(password, admin["password_usuario"]):
            # Actualizar último acceso
            usuario_synkro_service.update_ultimo_acceso(db, admin["id_usuario"])
            
            return UserInToken(
                user_type="admin_synkro",
                id=admin["id_usuario"],
                email=admin["email_usuario"],
                nombre=f"{admin['nom_usuario']} {admin['ape_usuario']}",
                rol=admin["rol_synkro"],
                identificacion_fiscal=None,
                ind_activo=admin["ind_activo"]
            )
        return None
    
    # 2. Si no es admin, buscar en clientes
    cliente = cliente_service.get_cliente_by_email(db, email)
    if cliente:
        # Verificar que el cliente está activo
        if not cliente.get("ind_activo", False):
            return None
        
        # Verificar contraseña
        if cliente.get("password_cliente") and verify_password(password, cliente["password_cliente"]):
            # Actualizar último acceso
            cliente_service.update_ultimo_acceso(db, cliente["identificacion_fiscal"])
            
            return UserInToken(
                user_type="cliente",
                id=cliente["identificacion_fiscal"],
                email=cliente["email_contacto_principal"],
                nombre=cliente["nom_contacto_principal"],
                rol=None,
                identificacion_fiscal=cliente["identificacion_fiscal"],
                ind_activo=cliente["ind_activo"]
            )
        return None
    
    return None


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
    
    # Crear tokens con user_type en el payload
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "user_type": user.user_type
    }
    
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_type=user.user_type
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
    user_type = payload.get("user_type")
    
    if not user_id or not email or not user_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar que el usuario aún existe y está activo
    if user_type == "admin_synkro":
        user = usuario_synkro_service.get_usuario(db, Decimal(user_id))
        if not user or not user.get("ind_activo", False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado o inactivo",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:  # cliente
        user = cliente_service.get_cliente(db, user_id)
        if not user or not user.get("ind_activo", False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cliente no encontrado o inactivo",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Crear nuevos tokens
    token_data = {
        "sub": user_id,
        "email": email,
        "user_type": user_type
    }
    
    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data=token_data)
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user_type=user_type
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
    user_type = payload.get("user_type")
    
    if not user_id or not user_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Obtener usuario según el tipo
    if user_type == "admin_synkro":
        user = usuario_synkro_service.get_usuario(db, Decimal(user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return UserInToken(
            user_type="admin_synkro",
            id=user["id_usuario"],
            email=user["email_usuario"],
            nombre=f"{user['nom_usuario']} {user['ape_usuario']}",
            rol=user["rol_synkro"],
            identificacion_fiscal=None,
            ind_activo=user["ind_activo"]
        )
    else:  # cliente
        user = cliente_service.get_cliente(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cliente no encontrado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return UserInToken(
            user_type="cliente",
            id=user["identificacion_fiscal"],
            email=user["email_contacto_principal"],
            nombre=user["nom_contacto_principal"],
            rol=None,
            identificacion_fiscal=user["identificacion_fiscal"],
            ind_activo=user["ind_activo"]
        )


def change_password(db: Session, current_user: UserInToken, current_password: str, new_password: str) -> bool:
    """
    Cambia la contraseña de un usuario.
    
    Args:
        db (Session): Sesión de la base de datos
        current_user (UserInToken): Usuario actual autenticado
        current_password (str): Contraseña actual
        new_password (str): Nueva contraseña
        
    Returns:
        bool: True si el cambio fue exitoso
        
    Raises:
        HTTPException: Si la contraseña actual es incorrecta
    """
    # Obtener usuario con contraseña actual
    if current_user.user_type == "admin_synkro":
        user = usuario_synkro_service.get_usuario(db, Decimal(str(current_user.id)))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Verificar contraseña actual
        if not verify_password(current_password, user["password_usuario"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contraseña actual incorrecta"
            )
        
        # Actualizar contraseña
        hashed_password = get_password_hash(new_password)
        usuario_synkro_service.update_password(db, user["id_usuario"], hashed_password, current_user.email)
    else:  # cliente
        user = cliente_service.get_cliente(db, str(current_user.id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )
        
        # Verificar contraseña actual
        if not user.get("password_cliente") or not verify_password(current_password, user["password_cliente"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contraseña actual incorrecta"
            )
        
        # Actualizar contraseña
        hashed_password = get_password_hash(new_password)
        cliente_service.update_password(db, user["identificacion_fiscal"], hashed_password, current_user.email)
    
    return True
