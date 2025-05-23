from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime

class UserBase(BaseModel):
    id_usuario: str = Field(..., description="Identificador único para el usuario.")
    nom_usuario: str = Field(..., description="Nombre del usuario.")
    ape_usuario: str = Field(..., description="Apellido del usuario.")
    email_usuario: str = Field(..., description="Email del usuario.")
    password_usuario: str = Field(..., description="Contraseña del usuario.")
    des_direccion: Optional[str] = Field(None, description="Dirección del usuario.")
    id_rol: Decimal = Field(..., description="Identificador del rol del usuario.")
    ind_genero: bool = Field(..., description="Género del usuario.")
    cel_usuario: str = Field(..., description="Número de celular del usuario.")
    fec_nacimiento: Optional[datetime] = Field(None, description="Fecha de nacimiento del usuario.")
    
    class Config:
        from_attributes = True
        
class UserCreate(UserBase):
    
    pass

class UserUpdate(BaseModel):
    
    nom_usuario: Optional[str] = Field(None, description="Nombre del usuario.")
    ape_usuario: Optional[str] = Field(None, description="Apellido del usuario.")
    email_usuario: Optional[str] = Field(None, description="Email del usuario.")
    password_usuario: Optional[str] = Field(None, description="Contraseña del usuario.")
    des_direccion: Optional[str] = Field(None, description="Dirección del usuario.")
    id_rol: Optional[Decimal] = Field(None, description="Identificador del rol del usuario.")
    ind_genero: Optional[bool] = Field(None, description="Género del usuario.")
    cel_usuario: Optional[str] = Field(None, description="Número de celular del usuario.")
    fec_nacimiento: Optional[datetime] = Field(None, description="Fecha de nacimiento del usuario.")
    
class User(UserBase):
    
    id_usuario: Decimal
    
class ResponseMessage(BaseModel):
    message: str

