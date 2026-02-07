"""
Router de Planes.

Define los endpoints CRUD para la gestion de planes de suscripcion.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin_revital, get_current_user_optional
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.plan_schema import PlanCreate, PlanUpdate, PlanPublic
from services import plan_service

router = APIRouter(prefix="/api/planes", tags=["Planes"])


@router.get("", response_model=List[PlanPublic])
def get_planes(
    solo_activos: bool = True,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user_optional)
):
    """
    Obtiene todos los planes disponibles.
    
    Los planes activos son visibles para todos (autenticados o no).
    Los admins pueden ver todos los planes.
    """
    # Si no esta autenticado o es cliente, solo ver activos
    if not current_user or current_user.user_type == "cliente":
        solo_activos = True
    
    planes = plan_service.get_planes(db, solo_activos=solo_activos)
    return [PlanPublic(**dict(p)) for p in planes]


@router.get("/{id_plan}", response_model=PlanPublic)
def get_plan(
    id_plan: Decimal,
    db: Session = Depends(get_db)
):
    """
    Obtiene un plan especifico por su ID.
    """
    plan = plan_service.get_plan(db, id_plan)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan no encontrado"
        )
    return PlanPublic(**dict(plan))


@router.post("", response_model=ResponseMessage)
def create_plan(
    plan: PlanCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Crea un nuevo plan de suscripcion.
    
    Solo accesible para admins de Revital.
    """
    result = plan_service.create_plan(db, plan, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Plan creado correctamente con ID: {result.get('id_plan')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear plan") if result else "Error al crear plan"
        )


@router.put("/{id_plan}", response_model=ResponseMessage)
def update_plan(
    id_plan: Decimal,
    plan: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Actualiza un plan existente.
    
    Solo accesible para admins de Revital.
    """
    existing = plan_service.get_plan(db, id_plan)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan no encontrado"
        )
    
    result = plan_service.update_plan(db, id_plan, plan, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Plan actualizado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al actualizar plan") if result else "Error al actualizar plan"
        )


@router.delete("/{id_plan}", response_model=ResponseMessage)
def delete_plan(
    id_plan: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Elimina un plan (soft delete).
    
    Solo accesible para admins de Revital.
    """
    existing = plan_service.get_plan(db, id_plan)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan no encontrado"
        )
    
    result = plan_service.delete_plan(db, id_plan)
    
    if result and result.get("success"):
        return ResponseMessage(message="Plan eliminado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al eliminar plan") if result else "Error al eliminar plan"
        )
