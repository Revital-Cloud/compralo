"""
Router de Usuarios Revital (Admins).

Define los endpoints CRUD para la gestión de usuarios administradores
de la plataforma Revital (admins, soporte, ventas).
Solo accesible para admins de Revital.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import require_admin_revital, require_admin_revital_role
from core.jwt_utils import get_password_hash
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.usuario_revital_schema import (
    UsuarioRevitalCreate,
    UsuarioRevitalUpdate,
    UsuarioRevitalPublic
)
from services import usuario_revital_service

router = APIRouter(prefix="/api/admin/usuarios", tags=["Usuarios Revital (Admin)"])


@router.get("", response_model=List[UsuarioRevitalPublic])
def get_usuarios(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Obtiene todos los usuarios administradores de Revital.
    
    Solo accesible para admins de Revital.
    
    Returns:
        List[UsuarioRevitalPublic]: Lista de usuarios admin
    """
    usuarios = usuario_revital_service.get_usuarios(db)
    return [UsuarioRevitalPublic(**dict(u)) for u in usuarios]


@router.get("/{id_usuario}", response_model=UsuarioRevitalPublic)
def get_usuario(
    id_usuario: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Obtiene un usuario admin específico por su ID.
    
    Solo accesible para admins de Revital.
    
    - **id_usuario**: ID del usuario a consultar
    
    Returns:
        UsuarioRevitalPublic: Información del usuario admin
    """
    usuario = usuario_revital_service.get_usuario(db, id_usuario)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return UsuarioRevitalPublic(**dict(usuario))


@router.post("", response_model=ResponseMessage)
def create_usuario(
    usuario: UsuarioRevitalCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital_role(["admin_revital"]))
):
    """
    Crea un nuevo usuario administrador de Revital.
    
    Solo accesible para admins de Revital con rol 'admin_revital'.
    
    - **nom_usuario**: Nombre del usuario
    - **ape_usuario**: Apellido del usuario
    - **email_usuario**: Email del usuario (único)
    - **password_usuario**: Contraseña (mínimo 8 caracteres)
    - **rol_revital**: Rol del usuario (admin_revital, soporte, ventas)
    - **ind_activo**: Si el usuario puede acceder (default: true)
    
    Returns:
        ResponseMessage: Mensaje de confirmación con el ID del nuevo usuario
    """
    # Hash de la contraseña
    hashed_password = get_password_hash(usuario.password_usuario)
    usuario_data = usuario.model_copy()
    usuario_data.password_usuario = hashed_password
    
    result = usuario_revital_service.create_usuario(
        db, 
        usuario_data, 
        current_user.email
    )
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Usuario creado correctamente con ID: {result.get('id_usuario')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear usuario") if result else "Error al crear usuario"
        )


@router.put("/{id_usuario}", response_model=ResponseMessage)
def update_usuario(
    id_usuario: Decimal,
    usuario: UsuarioRevitalUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital_role(["admin_revital"]))
):
    """
    Actualiza un usuario administrador de Revital.
    
    Solo accesible para admins de Revital con rol 'admin_revital'.
    
    - **id_usuario**: ID del usuario a actualizar
    - Campos opcionales a actualizar
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    # Verificar que el usuario existe
    existing = usuario_revital_service.get_usuario(db, id_usuario)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Si se proporciona contraseña, hashearla
    if usuario.password_usuario:
        usuario.password_usuario = get_password_hash(usuario.password_usuario)
    
    result = usuario_revital_service.update_usuario(
        db, 
        id_usuario, 
        usuario, 
        current_user.email
    )
    
    if result and result.get("success"):
        return ResponseMessage(message="Usuario actualizado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al actualizar usuario") if result else "Error al actualizar usuario"
        )


@router.delete("/{id_usuario}", response_model=ResponseMessage)
def delete_usuario(
    id_usuario: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital_role(["admin_revital"]))
):
    """
    Elimina un usuario administrador de Revital (soft delete).
    
    Solo accesible para admins de Revital con rol 'admin_revital'.
    No se puede eliminar al último admin activo.
    
    - **id_usuario**: ID del usuario a eliminar
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    # No permitir que el usuario se elimine a sí mismo
    if str(id_usuario) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminarte a ti mismo"
        )
    
    # Verificar que el usuario existe
    existing = usuario_revital_service.get_usuario(db, id_usuario)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    result = usuario_revital_service.delete_usuario(db, id_usuario)
    
    if result and result.get("success"):
        return ResponseMessage(message="Usuario eliminado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al eliminar usuario") if result else "Error al eliminar usuario"
        )
