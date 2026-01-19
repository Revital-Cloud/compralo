"""
Schemas para autenticación.

Define los modelos Pydantic para manejar la autenticación unificada
de admins de Synkro y clientes, incluyendo login, tokens y respuestas
de autenticación.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Union, Literal
from decimal import Decimal


class LoginRequest(BaseModel):
    """Schema para solicitud de login unificado (admins y clientes)."""
    email: EmailStr = Field(..., description="Email del usuario (admin o cliente)")
    password: str = Field(..., description="Contraseña en texto plano")


class TokenResponse(BaseModel):
    """Schema para respuesta de tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_type: str = Field(..., description="Tipo de usuario: 'admin_synkro' o 'cliente'")


class TokenData(BaseModel):
    """Schema para datos del token."""
    user_id: Optional[Union[Decimal, str]] = None
    email: Optional[str] = None
    user_type: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """Schema para solicitud de refresh token."""
    refresh_token: str


class UserInToken(BaseModel):
    """
    Schema unificado para información del usuario en el token.
    Funciona para admins de Synkro y clientes.
    """
    user_type: Literal["admin_synkro", "cliente"] = Field(
        ..., 
        description="Tipo de usuario: 'admin_synkro' o 'cliente'"
    )
    id: Union[Decimal, str] = Field(
        ..., 
        description="ID del usuario: id_usuario para admins, identificacion_fiscal para clientes"
    )
    email: str = Field(
        ..., 
        description="Email del usuario: email_usuario para admins, email_contacto_principal para clientes"
    )
    nombre: str = Field(
        ..., 
        description="Nombre del usuario: nom_usuario+ape_usuario para admins, nom_contacto_principal para clientes"
    )
    rol: Optional[str] = Field(
        None, 
        description="Rol del usuario: rol_synkro para admins (admin_synkro/soporte/ventas), None para clientes"
    )
    identificacion_fiscal: Optional[str] = Field(
        None, 
        description="Identificación fiscal: solo para clientes, None para admins"
    )
    ind_activo: bool = Field(
        True, 
        description="Si el usuario está activo"
    )
    
    class Config:
        from_attributes = True
    
    def is_admin_synkro(self) -> bool:
        """Verifica si el usuario es un admin de Synkro."""
        return self.user_type == "admin_synkro"
    
    def is_cliente(self) -> bool:
        """Verifica si el usuario es un cliente."""
        return self.user_type == "cliente"
    
    def has_role(self, role: str) -> bool:
        """Verifica si el usuario tiene un rol específico (solo para admins)."""
        if self.user_type != "admin_synkro":
            return False
        return self.rol == role
    
    def get_usr_identifier(self) -> str:
        """
        Obtiene el identificador para campos usr_insert/usr_update.
        Retorna el email para identificación en auditoría.
        """
        return self.email


class ChangePasswordRequest(BaseModel):
    """Schema para cambio de contraseña."""
    current_password: str = Field(..., description="Contraseña actual")
    new_password: str = Field(..., min_length=8, description="Nueva contraseña (mínimo 8 caracteres)")


class ResetPasswordRequest(BaseModel):
    """Schema para solicitud de reset de contraseña."""
    email: EmailStr = Field(..., description="Email del usuario")


class ResetPasswordConfirm(BaseModel):
    """Schema para confirmación de reset de contraseña."""
    token: str = Field(..., description="Token de reset recibido por email")
    new_password: str = Field(..., min_length=8, description="Nueva contraseña (mínimo 8 caracteres)")


class ResponseMessage(BaseModel):
    """Schema para mensajes de respuesta genéricos."""
    message: str
    success: bool = True


class RegisterRequest(BaseModel):
    """
    Schema for public user registration.
    
    Creates a new client with 'trial' status.
    Required fields are minimal to reduce friction during signup.
    """
    # Company info
    nom_empresa: str = Field(
        ..., 
        min_length=2,
        max_length=200,
        description="Company name"
    )
    identificacion_fiscal: str = Field(
        ..., 
        min_length=5,
        max_length=20,
        description="Tax ID (NIT, EIN, etc.)"
    )
    tipo_identificacion: Optional[Literal["NIT", "EIN", "RFC", "CUIT", "RUT", "NIF", "CIF", "CNPJ", "RUC", "OTRO"]] = Field(
        "NIT",
        description="Type of tax identification"
    )
    pais: Optional[Literal["CO", "US", "MX", "AR", "CL", "PE", "EC", "PA", "UY", "BR", "ES", "OTRO"]] = Field(
        "CO",
        description="Country code"
    )
    ciudad: Optional[str] = Field(
        None,
        max_length=100,
        description="City"
    )
    
    # Contact info
    nom_contacto_principal: str = Field(
        ..., 
        min_length=2,
        max_length=100,
        description="Primary contact name"
    )
    email_contacto_principal: EmailStr = Field(
        ..., 
        description="Primary contact email (used for login)"
    )
    telefono_contacto: Optional[str] = Field(
        None,
        max_length=20,
        description="Contact phone number"
    )
    
    # Account credentials
    password: str = Field(
        ..., 
        min_length=8,
        description="Account password (minimum 8 characters)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "nom_empresa": "Mi Empresa SAS",
                "identificacion_fiscal": "900123456-1",
                "tipo_identificacion": "NIT",
                "pais": "CO",
                "ciudad": "Bogotá",
                "nom_contacto_principal": "Juan Pérez",
                "email_contacto_principal": "juan@miempresa.com",
                "telefono_contacto": "+57 300 123 4567",
                "password": "securePassword123"
            }
        }
