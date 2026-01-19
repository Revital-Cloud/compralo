"""
Router de Suscripciones.

Define los endpoints CRUD para la gestion de suscripciones.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin_synkro
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.suscripcion_schema import SuscripcionCreate, SuscripcionUpdate, SuscripcionPublic
from services import suscripcion_service

router = APIRouter(prefix="/api/suscripciones", tags=["Suscripciones"])


@router.get("", response_model=List[SuscripcionPublic])
def get_suscripciones(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las suscripciones.
    
    Admins de Synkro ven todas las suscripciones.
    Clientes solo ven sus propias suscripciones.
    """
    if current_user.user_type == "admin_synkro":
        suscripciones = suscripcion_service.get_suscripciones(db)
    else:
        suscripciones = suscripcion_service.get_suscripciones(db, current_user.identificacion_fiscal)
    
    return [SuscripcionPublic(**dict(s)) for s in suscripciones]


@router.get("/activas", response_model=List[dict])
def get_suscripciones_activas(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las suscripciones activas con informacion del plan.
    
    Admins de Synkro ven todas.
    Clientes solo ven sus propias suscripciones activas.
    """
    if current_user.user_type == "admin_synkro":
        suscripciones = suscripcion_service.get_suscripciones_activas(db)
    else:
        suscripciones = suscripcion_service.get_suscripciones_activas(db, current_user.identificacion_fiscal)
    
    return [dict(s) for s in suscripciones]


@router.get("/{id_suscripcion}", response_model=SuscripcionPublic)
def get_suscripcion(
    id_suscripcion: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene una suscripcion especifica por su ID.
    
    Clientes solo pueden ver sus propias suscripciones.
    """
    suscripcion = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not suscripcion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripcion no encontrada"
        )
    
    # Verificar permisos
    if current_user.user_type == "cliente" and suscripcion.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta suscripcion"
        )
    
    return SuscripcionPublic(**dict(suscripcion))


@router.post("", response_model=ResponseMessage)
def create_suscripcion(
    suscripcion: SuscripcionCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Crea una nueva suscripcion.
    
    Solo accesible para admins de Synkro.
    """
    result = suscripcion_service.create_suscripcion(db, suscripcion, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Suscripcion creada correctamente con ID: {result.get('id_suscripcion')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear suscripcion") if result else "Error al crear suscripcion"
        )


@router.put("/{id_suscripcion}", response_model=ResponseMessage)
def update_suscripcion(
    id_suscripcion: Decimal,
    suscripcion: SuscripcionUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Actualiza una suscripcion existente.
    
    Solo accesible para admins de Synkro.
    """
    existing = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripcion no encontrada"
        )
    
    result = suscripcion_service.update_suscripcion(db, id_suscripcion, suscripcion, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Suscripcion actualizada correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al actualizar suscripcion") if result else "Error al actualizar suscripcion"
        )


@router.delete("/{id_suscripcion}", response_model=ResponseMessage)
def delete_suscripcion(
    id_suscripcion: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Elimina una suscripcion (soft delete).
    
    Solo accesible para admins de Synkro.
    """
    existing = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripcion no encontrada"
        )
    
    result = suscripcion_service.delete_suscripcion(db, id_suscripcion)
    
    if result and result.get("success"):
        return ResponseMessage(message="Suscripcion eliminada correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al eliminar suscripcion") if result else "Error al eliminar suscripcion"
        )
