"""
Schemas para autenticación.

Define los modelos Pydantic para manejar la autenticación,
incluyendo login, tokens y respuestas de autenticación.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from decimal import Decimal

class LoginRequest(BaseModel):
    """Schema para solicitud de login."""
    email: EmailStr
    password: str
    # Token emitido por Cloudflare Turnstile (se valida server-side).
    turnstile_token: Optional[str] = None

class TokenResponse(BaseModel):
    """Schema para respuesta de tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """Schema para datos del token."""
    user_id: Optional[Decimal] = None
    email: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    """Schema para solicitud de refresh token (opcional cuando se usa cookie HTTPOnly)."""
    refresh_token: Optional[str] = None

class UserInToken(BaseModel):
    """Schema para información del usuario en el token."""
    id_usuario: Decimal
    email_usuario: str
    nom_usuario: str
    ape_usuario: str
    id_rol: Decimal

class ChangePasswordRequest(BaseModel):
    """Schema para cambio de contraseña."""
    current_password: str
    new_password: str

class ResetPasswordRequest(BaseModel):
    """Schema para solicitud de reset de contraseña."""
    email: EmailStr

class ResetPasswordConfirm(BaseModel):
    """Schema para confirmación de reset de contraseña."""
    token: str
    new_password: str


class VerifyEmailOtpRequest(BaseModel):
    """Schema para verificación de email con código OTP."""
    email: EmailStr
    code: str  # Código de 6 dígitos


class ReactivateRequest(BaseModel):
    """Schema para solicitud de reactivación de cuenta (email soft-deleted)."""
    email: EmailStr


class ResendEmailOtpRequest(BaseModel):
    """Schema para reenviar el código OTP de verificación de email."""
    email: EmailStr