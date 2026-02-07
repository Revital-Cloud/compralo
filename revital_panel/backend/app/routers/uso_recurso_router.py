"""
Router de Uso de Recursos.

Define los endpoints para el tracking de uso de recursos por instancia.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin_revital
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.uso_recurso_schema import UsoRecursoCreate, UsoRecursoPublic
from services import uso_recurso_service, instancia_service

router = APIRouter(prefix="/api/uso-recursos", tags=["Uso de Recursos"])


@router.get("", response_model=List[UsoRecursoPublic])
def get_uso_recursos(
    id_instancia: Decimal = None,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene los registros de uso de recursos.
    
    Admins de Revital ven todos.
    Clientes solo ven de sus instancias.
    """
    if current_user.user_type == "cliente":
        if id_instancia:
            instancia = instancia_service.get_instancia(db, id_instancia)
            if not instancia or instancia.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permisos para ver estos recursos"
                )
        else:
            return []
    
    recursos = uso_recurso_service.get_uso_recursos(db, id_instancia)
    return [UsoRecursoPublic(**dict(r)) for r in recursos]


@router.get("/alertas", response_model=List[dict])
def get_instancias_con_alertas(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Obtiene las instancias que tienen alertas de uso de recursos.
    
    Solo accesible para admins de Revital.
    """
    alertas = uso_recurso_service.get_instancias_con_alertas(db)
    return [dict(a) for a in alertas]


@router.get("/ultimo/{id_instancia}", response_model=UsoRecursoPublic)
def get_ultimo_uso_recurso(
    id_instancia: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene el ultimo registro de uso de recursos de una instancia.
    """
    if current_user.user_type == "cliente":
        instancia = instancia_service.get_instancia(db, id_instancia)
        if not instancia or instancia.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver estos recursos"
            )
    
    recurso = uso_recurso_service.get_ultimo_uso_recurso(db, id_instancia)
    if not recurso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay registros de uso de recursos para esta instancia"
        )
    
    return UsoRecursoPublic(**dict(recurso))


@router.post("", response_model=ResponseMessage)
def create_uso_recurso(
    uso_recurso: UsoRecursoCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Crea un nuevo registro de uso de recursos.
    
    Solo accesible para admins de Revital.
    """
    instancia = instancia_service.get_instancia(db, uso_recurso.id_instancia)
    if not instancia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instancia no encontrada"
        )
    
    result = uso_recurso_service.create_uso_recurso(db, uso_recurso, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Registro de uso creado correctamente con ID: {result.get('id_uso_recurso')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear registro") if result else "Error al crear registro"
        )


@router.delete("/{id_uso_recurso}", response_model=ResponseMessage)
def delete_uso_recurso(
    id_uso_recurso: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Elimina un registro de uso de recursos.
    
    Solo accesible para admins de Revital.
    """
    existing = uso_recurso_service.get_uso_recurso(db, id_uso_recurso)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro no encontrado"
        )
    
    result = uso_recurso_service.delete_uso_recurso(db, id_uso_recurso)
    
    if result and result.get("success"):
        return ResponseMessage(message="Registro eliminado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al eliminar registro") if result else "Error al eliminar registro"
        )
