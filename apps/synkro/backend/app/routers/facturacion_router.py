"""
Router de Facturacion.

Define los endpoints CRUD para la gestion de facturas.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user, require_admin_synkro
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.facturacion_schema import (
    FacturaCabeceraCreate, 
    FacturaCabeceraUpdate, 
    FacturaPublic,
    FacturaConDetalle,
    FacturaDetalleCreate
)
from services import facturacion_service

router = APIRouter(prefix="/api/facturacion", tags=["Facturacion"])


@router.get("", response_model=List[FacturaPublic])
def get_facturas(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las facturas.
    
    Admins de Synkro ven todas las facturas.
    Clientes solo ven sus propias facturas.
    """
    if current_user.user_type == "admin_synkro":
        facturas = facturacion_service.get_facturas(db)
    else:
        facturas = facturacion_service.get_facturas(db, current_user.identificacion_fiscal)
    
    return [FacturaPublic(**dict(f)) for f in facturas]


@router.get("/pendientes", response_model=List[dict])
def get_facturas_pendientes(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las facturas pendientes de pago.
    
    Admins de Synkro ven todas.
    Clientes solo ven sus propias facturas pendientes.
    """
    if current_user.user_type == "admin_synkro":
        facturas = facturacion_service.get_facturas_pendientes(db)
    else:
        facturas = facturacion_service.get_facturas_pendientes(db, current_user.identificacion_fiscal)
    
    return [dict(f) for f in facturas]


@router.get("/{id_factura}", response_model=FacturaConDetalle)
def get_factura(
    id_factura: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene una factura especifica con sus detalles.
    
    Clientes solo pueden ver sus propias facturas.
    """
    factura = facturacion_service.get_factura(db, id_factura)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    # Verificar permisos
    if current_user.user_type == "cliente" and factura.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta factura"
        )
    
    # Obtener detalles
    detalles = facturacion_service.get_factura_detalles(db, id_factura)
    
    factura_dict = dict(factura)
    factura_dict["detalles"] = [dict(d) for d in detalles]
    
    return FacturaConDetalle(**factura_dict)


@router.post("", response_model=ResponseMessage)
def create_factura(
    factura: FacturaCabeceraCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Crea una nueva factura.
    
    Solo accesible para admins de Synkro.
    """
    result = facturacion_service.create_factura(db, factura, current_user.email)
    
    if result and result.get("success"):
        # Si hay detalles, agregarlos
        if factura.detalles:
            for detalle in factura.detalles:
                facturacion_service.create_factura_detalle(
                    db, 
                    result.get("id_factura"), 
                    detalle, 
                    current_user.email
                )
        
        return ResponseMessage(
            message=f"Factura creada correctamente: {result.get('num_factura')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear factura") if result else "Error al crear factura"
        )


@router.post("/{id_factura}/detalles", response_model=ResponseMessage)
def add_factura_detalle(
    id_factura: Decimal,
    detalle: FacturaDetalleCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Agrega una linea de detalle a una factura.
    
    Solo accesible para admins de Synkro.
    """
    factura = facturacion_service.get_factura(db, id_factura)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    result = facturacion_service.create_factura_detalle(db, id_factura, detalle, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Detalle agregado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al agregar detalle") if result else "Error al agregar detalle"
        )


@router.put("/{id_factura}", response_model=ResponseMessage)
def update_factura(
    id_factura: Decimal,
    factura: FacturaCabeceraUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Actualiza una factura existente.
    
    Solo accesible para admins de Synkro.
    """
    existing = facturacion_service.get_factura(db, id_factura)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    result = facturacion_service.update_factura(db, id_factura, factura, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Factura actualizada correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al actualizar factura") if result else "Error al actualizar factura"
        )


@router.delete("/{id_factura}", response_model=ResponseMessage)
def delete_factura(
    id_factura: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Elimina una factura (soft delete).
    
    Solo accesible para admins de Synkro.
    """
    existing = facturacion_service.get_factura(db, id_factura)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    result = facturacion_service.delete_factura(db, id_factura)
    
    if result and result.get("success"):
        return ResponseMessage(message="Factura eliminada correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al eliminar factura") if result else "Error al eliminar factura"
        )
