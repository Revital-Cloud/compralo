"""
Utilidades para manejo de JWT.

Este módulo contiene funciones para crear, verificar y decodificar tokens JWT,
así como para el hash y verificación de contraseñas usando pwdlib con Argon2.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from pwdlib import PasswordHash
from fastapi import HTTPException, status

from core.config import settings

# Configuración moderna para el hash de contraseñas usando Argon2
# Argon2 es más seguro que bcrypt y es el algoritmo recomendado actualmente
# PasswordHash.recommended() usa Argon2 con configuración optimizada
pwd_hasher = PasswordHash.recommended()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token de acceso JWT.
    
    Args:
        data (dict): Datos a incluir en el token
        expires_delta (Optional[timedelta]): Tiempo de expiración personalizado
        
    Returns:
        str: Token JWT codificado
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """
    Crea un token de refresco JWT.
    
    Args:
        data (dict): Datos a incluir en el token
        
    Returns:
        str: Token JWT de refresco codificado
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> dict:
    """
    Verifica y decodifica un token JWT.
    
    Args:
        token (str): Token JWT a verificar
        token_type (str): Tipo de token esperado ("access" o "refresh")
        
    Returns:
        dict: Payload del token decodificado
        
    Raises:
        HTTPException: Si el token es inválido o ha expirado
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        
        # Verificar que el tipo de token sea correcto
        if payload.get("type") != token_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tipo de token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_password_hash(password: str) -> str:
    """
    Genera un hash de la contraseña usando Argon2.
    
    Args:
        password (str): Contraseña en texto plano
        
    Returns:
        str: Hash de la contraseña usando Argon2
    """
    return pwd_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña coincide con su hash usando Argon2.
    
    Args:
        plain_password (str): Contraseña en texto plano
        hashed_password (str): Hash de la contraseña (Argon2)
        
    Returns:
        bool: True si la contraseña es correcta, False en caso contrario
    """
    return pwd_hasher.verify(plain_password, hashed_password)

def create_verification_token(user_id: int, email: str, expires_hours: int = 24) -> str:
    """
    Crea un token específico para verificación de email.
    
    Args:
        user_id (int): ID del usuario
        email (str): Email del usuario
        expires_hours (int): Horas hasta que expire el token
        
    Returns:
        str: Token de verificación JWT
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    to_encode = {
        "sub": str(user_id),
        "email": email,
        "type": "email_verification",
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_password_reset_token(user_id: int, email: str, expires_hours: int = 1) -> str:
    """
    Crea un token específico para reset de contraseña.
    
    Args:
        user_id (int): ID del usuario
        email (str): Email del usuario
        expires_hours (int): Horas hasta que expire el token
        
    Returns:
        str: Token de reset JWT
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    to_encode = {
        "sub": str(user_id),
        "email": email,
        "type": "password_reset",
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_verification_token(token: str) -> dict:
    """
    Verifica un token de verificación de email.
    
    Args:
        token (str): Token de verificación a verificar
        
    Returns:
        dict: Payload del token decodificado
        
    Raises:
        HTTPException: Si el token es inválido, ha expirado o no es del tipo correcto
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        
        # Verificar que sea token de verificación
        if payload.get("type") != "email_verification":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de verificación inválido",
            )
        
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de verificación inválido o expirado",
        )

def verify_password_reset_token(token: str) -> dict:
    """
    Verifica un token de reset de contraseña.
    
    Args:
        token (str): Token de reset a verificar
        
    Returns:
        dict: Payload del token decodificado
        
    Raises:
        HTTPException: Si el token es inválido, ha expirado o no es del tipo correcto
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        
        # Verificar que sea token de reset
        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de reset inválido",
            )
        
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de reset inválido o expirado",
        ) 