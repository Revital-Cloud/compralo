"""
Router de Instancias.

Define los endpoints CRUD para la gestion de instancias de e-commerce.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin_synkro
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.instancia_schema import InstanciaCreate, InstanciaUpdate, InstanciaPublic
from services import instancia_service

router = APIRouter(prefix="/api/instances", tags=["Instances"])


@router.get("", response_model=List[InstanciaPublic])
def get_instancias(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las instancias.
    
    Admins de Synkro ven todas las instancias.
    Clientes solo ven sus propias instancias.
    """
    if current_user.user_type == "admin_synkro":
        instancias = instancia_service.get_instancias(db)
    else:
        instancias = instancia_service.get_instancias(db, current_user.identificacion_fiscal)
    
    return [InstanciaPublic(**dict(i)) for i in instancias]


@router.get("/{id_instancia}", response_model=InstanciaPublic)
def get_instancia(
    id_instancia: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene una instancia especifica por su ID.
    
    Clientes solo pueden ver sus propias instancias.
    """
    instancia = instancia_service.get_instancia(db, id_instancia)
    if not instancia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )
    
    # Verificar permisos
    if current_user.user_type == "cliente" and instancia.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this instance"
        )
    
    return InstanciaPublic(**dict(instancia))


@router.post("", response_model=ResponseMessage)
def create_instancia(
    instancia: InstanciaCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Crea una nueva instancia.
    
    Solo accesible para admins de Synkro.
    """
    result = instancia_service.create_instancia(db, instancia, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Instance created successfully with ID: {result.get('id_instancia')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error creating instance") if result else "Error creating instance"
        )


@router.put("/{id_instancia}", response_model=ResponseMessage)
def update_instancia(
    id_instancia: Decimal,
    instancia: InstanciaUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Actualiza una instancia existente.
    
    Solo accesible para admins de Synkro.
    """
    existing = instancia_service.get_instancia(db, id_instancia)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )
    
    result = instancia_service.update_instancia(db, id_instancia, instancia, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Instance updated successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error updating instance") if result else "Error updating instance"
        )


@router.delete("/{id_instancia}", response_model=ResponseMessage)
def delete_instancia(
    id_instancia: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Elimina una instancia (soft delete).
    
    Solo accesible para admins de Synkro.
    """
    existing = instancia_service.get_instancia(db, id_instancia)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )
    
    result = instancia_service.delete_instancia(db, id_instancia)
    
    if result and result.get("success"):
        return ResponseMessage(message="Instance deleted successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error deleting instance") if result else "Error deleting instance"
        )
