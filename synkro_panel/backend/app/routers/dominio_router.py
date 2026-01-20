"""
Router de Dominios.

Define los endpoints CRUD para la gestion de dominios asociados a instancias.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin_synkro
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.dominio_schema import DominioCreate, DominioUpdate, DominioPublic
from services import dominio_service, instancia_service

router = APIRouter(prefix="/api/domains", tags=["Domains"])


@router.get("", response_model=List[DominioPublic])
def get_dominios(
    id_instancia: Decimal = None,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene los dominios.
    
    Admins de Synkro ven todos los dominios.
    Clientes solo ven dominios de sus instancias.
    """
    if current_user.user_type == "cliente":
        if id_instancia:
            instancia = instancia_service.get_instancia(db, id_instancia)
            if not instancia or instancia.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view these domains"
                )
        else:
            # Si no se especifica instancia, tomar la primera instancia del cliente (si existe)
            instancias = instancia_service.get_instancias(db, current_user.identificacion_fiscal)
            if not instancias:
                return []
            id_instancia = instancias[0].get("id_instancia")
    
    dominios = dominio_service.get_dominios(db, id_instancia)
    return [DominioPublic(**dict(d)) for d in dominios]


@router.get("/{id_dominio}", response_model=DominioPublic)
def get_dominio(
    id_dominio: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene un dominio especifico por su ID.
    """
    dominio = dominio_service.get_dominio(db, id_dominio)
    if not dominio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found"
        )
    
    if current_user.user_type == "cliente":
        instancia = instancia_service.get_instancia(db, dominio.get("id_instancia"))
        if not instancia or instancia.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this domain"
            )
    
    return DominioPublic(**dict(dominio))


@router.post("", response_model=ResponseMessage)
def create_dominio(
    dominio: DominioCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Crea un nuevo dominio.
    
    Solo accesible para admins de Synkro.
    """
    instancia = instancia_service.get_instancia(db, dominio.id_instancia)
    if not instancia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )
    
    result = dominio_service.create_dominio(db, dominio, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Domain created successfully with ID: {result.get('id_dominio')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error creating domain") if result else "Error creating domain"
        )


@router.put("/{id_dominio}", response_model=ResponseMessage)
def update_dominio(
    id_dominio: Decimal,
    dominio: DominioUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Actualiza un dominio existente.
    
    Solo accesible para admins de Synkro.
    """
    existing = dominio_service.get_dominio(db, id_dominio)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found"
        )
    
    result = dominio_service.update_dominio(db, id_dominio, dominio, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Domain updated successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error updating domain") if result else "Error updating domain"
        )


@router.delete("/{id_dominio}", response_model=ResponseMessage)
def delete_dominio(
    id_dominio: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Elimina un dominio (soft delete).
    
    Solo accesible para admins de Synkro.
    """
    existing = dominio_service.get_dominio(db, id_dominio)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Domain not found"
        )
    
    result = dominio_service.delete_dominio(db, id_dominio)
    
    if result and result.get("success"):
        return ResponseMessage(message="Domain deleted successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error deleting domain") if result else "Error deleting domain"
        )
