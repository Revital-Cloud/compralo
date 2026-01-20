"""
Router de Deployments.

Define los endpoints CRUD para la gestion de deployments de instancias.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin_synkro
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.deployment_schema import DeploymentCreate, DeploymentUpdate, DeploymentPublic
from services import deployment_service, instancia_service

router = APIRouter(prefix="/api/deployments", tags=["Deployments"])


@router.get("", response_model=List[DeploymentPublic])
def get_deployments(
    id_instancia: Decimal = None,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene los deployments.
    
    Admins de Synkro ven todos los deployments.
    Clientes solo ven deployments de sus instancias.
    """
    if current_user.user_type == "cliente":
        # Para clientes, siempre filtrar por sus propias instancias.
        if id_instancia:
            instancia = instancia_service.get_instancia(db, id_instancia)
            if not instancia or instancia.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permisos para ver estos deployments"
                )
        else:
            # Si no se especifica instancia, obtener el ID de su primera instancia (si existe)
            instancias = instancia_service.get_instancias(db, current_user.identificacion_fiscal)
            if not instancias:
                return []
            id_instancia = instancias[0].get("id_instancia")
    
    deployments = deployment_service.get_deployments(db, id_instancia)
    return [DeploymentPublic(**dict(d)) for d in deployments]


@router.get("/{id_deployment}", response_model=DeploymentPublic)
def get_deployment(
    id_deployment: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene un deployment especifico por su ID.
    """
    deployment = deployment_service.get_deployment(db, id_deployment)
    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment no encontrado"
        )
    
    # Verificar permisos para clientes
    if current_user.user_type == "cliente":
        instancia = instancia_service.get_instancia(db, deployment.get("id_instancia"))
        if not instancia or instancia.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver este deployment"
            )
    
    return DeploymentPublic(**dict(deployment))


@router.post("", response_model=ResponseMessage)
def create_deployment(
    deployment: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Crea un nuevo deployment.
    
    Solo accesible para admins de Synkro.
    """
    # Verificar que la instancia existe
    instancia = instancia_service.get_instancia(db, deployment.id_instancia)
    if not instancia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instancia no encontrada"
        )
    
    # Agregar quien inicio el deployment
    deployment.iniciado_por = current_user.email
    
    result = deployment_service.create_deployment(db, deployment, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Deployment iniciado correctamente con ID: {result.get('id_deployment')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear deployment") if result else "Error al crear deployment"
        )


@router.put("/{id_deployment}", response_model=ResponseMessage)
def update_deployment(
    id_deployment: Decimal,
    deployment: DeploymentUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Actualiza un deployment existente.
    
    Solo accesible para admins de Synkro.
    """
    existing = deployment_service.get_deployment(db, id_deployment)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment no encontrado"
        )
    
    result = deployment_service.update_deployment(db, id_deployment, deployment, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Deployment actualizado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al actualizar deployment") if result else "Error al actualizar deployment"
        )


@router.delete("/{id_deployment}", response_model=ResponseMessage)
def delete_deployment(
    id_deployment: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Elimina un deployment (soft delete).
    
    Solo accesible para admins de Synkro.
    """
    existing = deployment_service.get_deployment(db, id_deployment)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment no encontrado"
        )
    
    result = deployment_service.delete_deployment(db, id_deployment)
    
    if result and result.get("success"):
        return ResponseMessage(message="Deployment eliminado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al eliminar deployment") if result else "Error al eliminar deployment"
        )
