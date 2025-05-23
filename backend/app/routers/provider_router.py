"""
Módulo de enrutador para la gestión de proveedores.

Define las rutas y endpoints relacionados con la gestión de proveedores,
incluyendo la creación, actualización y visualización de proveedores.
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from schemas.provider_schema import ProviderCreate, ProviderUpdate, Provider,ResponseMessage
from services import provider_service

router = APIRouter()

@router.get("/providers", response_model=list[Provider])
async def get_providers(db:Session = Depends(get_db)):
    """
    Obtiene todos los proveedores registrados en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        list[Provider]: Lista de proveedores registrados.
    """
    providers = provider_service.get_providers(db)
    if providers is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron proveedores")
    return providers
    
@router.post("/providers", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_provider(
    db:Session = Depends(get_db),
    nom_proveedor:str = Form(...),
    email:str = Form(...),
    tel_proveedor:Decimal = Form(...)
):
    """
    Crea un nuevo proveedor en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_proveedor (str): Nombre del proveedor.
        email (str): Correo electrónico del proveedor.
        tel_proveedor (str): Teléfono del proveedor.
    """
    try:
        provider_data = ProviderCreate(nom_proveedor=nom_proveedor, email=email, tel_proveedor=tel_proveedor)
        provider_service.create_provider(db, provider_data)
        return ResponseMessage(message="Proveedor creado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/providers/{id_proveedor}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_provider(
    id_proveedor:Decimal,
    db:Session = Depends(get_db),
    nom_proveedor:str = Form(...),
    email:str = Form(...),
    tel_proveedor:Decimal = Form(...)
):
    """
    Actualiza un proveedor existente en la base de datos.

    Args:
        id_proveedor (Decimal): ID del proveedor a actualizar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_proveedor (str): Nombre del proveedor.
        email (str): Correo electrónico del proveedor.
        tel_proveedor (str): Teléfono del proveedor.
    """
    try:
        provider_data = ProviderUpdate(nom_proveedor=nom_proveedor, email=email, tel_proveedor=tel_proveedor)
        provider_service.update_provider(db, id_proveedor, provider_data)
        return ResponseMessage(message="Proveedor actualizado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.delete("/providers/{id_proveedor}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_provider(id_proveedor:Decimal, db:Session = Depends(get_db)):
    """
    Elimina un proveedor existente de la base de datos.

    Args:
        id_proveedor (Decimal): ID del proveedor a eliminar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
    """
    try:
        provider_service.delete_provider(db, id_proveedor)
        return ResponseMessage(message="Proveedor eliminado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
