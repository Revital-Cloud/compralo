"""
Router de Suscripciones.

Define los endpoints CRUD para la gestion de suscripciones.
"""
from decimal import Decimal
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin_synkro
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.suscripcion_schema import SuscripcionCreate, SuscripcionUpdate, SuscripcionPublic
from services import suscripcion_service

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])


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
            detail="Subscription not found"
        )
    
    # Verificar permisos
    if current_user.user_type == "cliente" and suscripcion.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this subscription"
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
            message=f"Subscription created successfully with ID: {result.get('id_suscripcion')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error creating subscription") if result else "Error creating subscription"
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
            detail="Subscription not found"
        )
    
    result = suscripcion_service.update_suscripcion(db, id_suscripcion, suscripcion, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Subscription updated successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error updating subscription") if result else "Error updating subscription"
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
            detail="Subscription not found"
        )
    
    result = suscripcion_service.delete_suscripcion(db, id_suscripcion)
    
    if result and result.get("success"):
        return ResponseMessage(message="Subscription deleted successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error deleting subscription") if result else "Error deleting subscription"
        )


@router.post("/{id_suscripcion}/cambiar-plan", response_model=ResponseMessage)
def cambiar_plan(
    id_suscripcion: Decimal,
    id_plan_nuevo: Decimal,
    motivo_cambio: Optional[str] = None,
    tipo_cambio: Literal["upgrade", "downgrade", "lateral"] = "lateral",
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Cambia el plan de una suscripción existente.

    - Los clientes solo pueden cambiar sus propias suscripciones activas.
    - Los admins de Synkro pueden cambiar cualquier suscripción.
    - La lógica de validación de límites y prorrateos vive en la base de datos.
    """
    suscripcion = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not suscripcion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )

    # Verificar permisos de acceso
    if current_user.user_type == "cliente" and suscripcion.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this subscription",
        )

    # Solo suscripciones activas pueden cambiar de plan
    if suscripcion.get("estado_suscripcion") != "activa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active subscriptions can change plan",
        )

    try:
        result = suscripcion_service.cambiar_plan_suscripcion(
            db=db,
            id_suscripcion=id_suscripcion,
            id_plan_nuevo=id_plan_nuevo,
            usuario_email=current_user.email,
            motivo_cambio=motivo_cambio,
            tipo_cambio=tipo_cambio,
        )
    except Exception as exc:
        # Normalizar errores de dominio a HTTP 400
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if result and result.get("success"):
        return ResponseMessage(
            message=result.get("message", "Plan de suscripcion actualizado correctamente"),
            success=True,
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=result.get("message", "Error al cambiar plan de suscripcion") if result else "Error al cambiar plan de suscripcion",
    )

