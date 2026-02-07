"""
Router de Historial de Planes.

Define los endpoints para el historial de cambios de plan en suscripciones.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin_revital
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.historial_plan_schema import HistorialPlanCreate, HistorialPlanPublic
from services import historial_plan_service

router = APIRouter(prefix="/api/historial-planes", tags=["Historial de Planes"])


@router.get("", response_model=List[HistorialPlanPublic])
def get_historial_planes(
    id_suscripcion: Decimal = None,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene el historial de cambios de plan.
    
    Admins de Revital ven todo el historial.
    Clientes solo ven su propio historial.
    """
    if current_user.user_type == "cliente":
        historial = historial_plan_service.get_historial_por_cliente(db, current_user.identificacion_fiscal)
    else:
        historial = historial_plan_service.get_historial_planes(db, id_suscripcion)
    
    return [HistorialPlanPublic(**dict(h)) for h in historial]


@router.get("/{id_historial}", response_model=HistorialPlanPublic)
def get_historial_plan(
    id_historial: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene un registro de historial especifico.
    """
    historial = historial_plan_service.get_historial_plan(db, id_historial)
    if not historial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro no encontrado"
        )
    
    # Para clientes, verificar que el historial pertenece a sus suscripciones
    if current_user.user_type == "cliente":
        from services import suscripcion_service
        suscripcion = suscripcion_service.get_suscripcion(db, historial.get("id_suscripcion"))
        if not suscripcion or suscripcion.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver este registro"
            )
    
    return HistorialPlanPublic(**dict(historial))


@router.post("", response_model=ResponseMessage)
def create_historial_plan(
    historial: HistorialPlanCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Crea un nuevo registro de historial de plan.
    
    Solo accesible para admins de Revital.
    """
    from services import suscripcion_service
    suscripcion = suscripcion_service.get_suscripcion(db, historial.id_suscripcion)
    if not suscripcion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripcion no encontrada"
        )
    
    result = historial_plan_service.create_historial_plan(db, historial, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Historial creado correctamente con ID: {result.get('id_historial')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear historial") if result else "Error al crear historial"
        )


@router.delete("/{id_historial}", response_model=ResponseMessage)
def delete_historial_plan(
    id_historial: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Elimina un registro de historial de plan.
    
    Solo accesible para admins de Revital.
    """
    existing = historial_plan_service.get_historial_plan(db, id_historial)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro no encontrado"
        )
    
    result = historial_plan_service.delete_historial_plan(db, id_historial)
    
    if result and result.get("success"):
        return ResponseMessage(message="Historial eliminado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al eliminar historial") if result else "Error al eliminar historial"
        )
