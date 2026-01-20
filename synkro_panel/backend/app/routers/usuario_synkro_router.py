"""
Router de Usuarios Synkro (Admins).

Define los endpoints CRUD para la gestión de usuarios administradores
de la plataforma Synkro (admins, soporte, ventas).
Solo accesible para admins de Synkro.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import require_admin_synkro, require_admin_synkro_role
from core.jwt_utils import get_password_hash
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.usuario_synkro_schema import (
    UsuarioSynkroCreate,
    UsuarioSynkroUpdate,
    UsuarioSynkroPublic
)
from services import usuario_synkro_service

router = APIRouter(prefix="/api/admin/users", tags=["Synkro Users (Admin)"])


@router.get("", response_model=List[UsuarioSynkroPublic])
def get_usuarios(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Obtiene todos los usuarios administradores de Synkro.
    
    Solo accesible para admins de Synkro.
    
    Returns:
        List[UsuarioSynkroPublic]: Lista de usuarios admin
    """
    usuarios = usuario_synkro_service.get_usuarios(db)
    return [UsuarioSynkroPublic(**dict(u)) for u in usuarios]


@router.get("/{id_usuario}", response_model=UsuarioSynkroPublic)
def get_usuario(
    id_usuario: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Obtiene un usuario admin específico por su ID.
    
    Solo accesible para admins de Synkro.
    
    - **id_usuario**: ID del usuario a consultar
    
    Returns:
        UsuarioSynkroPublic: Información del usuario admin
    """
    usuario = usuario_synkro_service.get_usuario(db, id_usuario)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UsuarioSynkroPublic(**dict(usuario))


@router.post("", response_model=ResponseMessage)
def create_usuario(
    usuario: UsuarioSynkroCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro_role(["admin_synkro"]))
):
    """
    Crea un nuevo usuario administrador de Synkro.
    
    Solo accesible para admins de Synkro con rol 'admin_synkro'.
    
    - **nom_usuario**: Nombre del usuario
    - **ape_usuario**: Apellido del usuario
    - **email_usuario**: Email del usuario (único)
    - **password_usuario**: Contraseña (mínimo 8 caracteres)
    - **rol_synkro**: Rol del usuario (admin_synkro, soporte, ventas)
    - **ind_activo**: Si el usuario puede acceder (default: true)
    
    Returns:
        ResponseMessage: Mensaje de confirmación con el ID del nuevo usuario
    """
    # Hash de la contraseña
    hashed_password = get_password_hash(usuario.password_usuario)
    usuario_data = usuario.model_copy()
    usuario_data.password_usuario = hashed_password
    
    result = usuario_synkro_service.create_usuario(
        db, 
        usuario_data, 
        current_user.email
    )
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"User created successfully with ID: {result.get('id_usuario')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error creating user") if result else "Error creating user"
        )


@router.put("/{id_usuario}", response_model=ResponseMessage)
def update_usuario(
    id_usuario: Decimal,
    usuario: UsuarioSynkroUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro_role(["admin_synkro"]))
):
    """
    Actualiza un usuario administrador de Synkro.
    
    Solo accesible para admins de Synkro con rol 'admin_synkro'.
    
    - **id_usuario**: ID del usuario a actualizar
    - Campos opcionales a actualizar
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    # Verificar que el usuario existe
    existing = usuario_synkro_service.get_usuario(db, id_usuario)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Si se proporciona contraseña, hashearla
    if usuario.password_usuario:
        usuario.password_usuario = get_password_hash(usuario.password_usuario)
    
    result = usuario_synkro_service.update_usuario(
        db, 
        id_usuario, 
        usuario, 
        current_user.email
    )
    
    if result and result.get("success"):
        return ResponseMessage(message="User updated successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error updating user") if result else "Error updating user"
        )


@router.delete("/{id_usuario}", response_model=ResponseMessage)
def delete_usuario(
    id_usuario: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro_role(["admin_synkro"]))
):
    """
    Elimina un usuario administrador de Synkro (soft delete).
    
    Solo accesible para admins de Synkro con rol 'admin_synkro'.
    No se puede eliminar al último admin activo.
    
    - **id_usuario**: ID del usuario a eliminar
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    # No permitir que el usuario se elimine a sí mismo
    if str(id_usuario) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete yourself"
        )
    
    # Verificar que el usuario existe
    existing = usuario_synkro_service.get_usuario(db, id_usuario)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    result = usuario_synkro_service.delete_usuario(db, id_usuario)
    
    if result and result.get("success"):
        return ResponseMessage(message="User deleted successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error deleting user") if result else "Error deleting user"
        )
