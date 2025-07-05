"""
Módulo de enrutador para la gestión de proveedores.

Define las rutas y endpoints relacionados con la gestión de proveedores,
incluyendo la creación, actualización y visualización de proveedores.
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, Form, Body, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.provider_schema import ProviderCreate, ProviderUpdate, Provider,ResponseMessage
from services import provider_service

router = APIRouter(tags=["Proveedores"])

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
    
#Ruta para obtener un proveedor específico por ID
@router.get("/providers/{id_proveedor}", response_model=Provider)
async def get_provider(id_proveedor:Decimal, db:Session = Depends(get_db)):
    """
    Obtiene un proveedor específico por su ID.

    Args:
        id_proveedor (Decimal): ID del proveedor a obtener.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        Provider: Detalles del proveedor solicitado.
    """
    provider = provider_service.get_provider(db, id_proveedor)
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")   
    return provider

# Ruta para crear un nuevo proveedor
@router.post("/providers", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_provider(
    db:Session = Depends(get_db),
    provider_data: ProviderCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea un nuevo proveedor en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_proveedor (str): Nombre del proveedor.
        email (str): Correo electrónico del proveedor.
        tel_proveedor (str): Teléfono del proveedor.
        ind_activo (bool): Indica si el proveedor está activo o no.
    """
    try:
        provider_service.create_provider(db, provider_data, current_user.id_usuario)
        return ResponseMessage(message="Proveedor creado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
# Ruta para actualizar un proveedor existente
@router.put("/providers/{id_proveedor}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_provider(
    id_proveedor:Decimal,
    provider_data: ProviderUpdate = Body(...),
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
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
        provider_service.update_provider(db, id_proveedor, provider_data, current_user.id_usuario)
        return ResponseMessage(message="Proveedor actualizado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
# Ruta para eliminar un proveedor existente
@router.put(
    "/providers/{id_proveedor}/deactivate", 
    response_model=ResponseMessage, 
    status_code=status.HTTP_200_OK
    )
async def deactivate_provider(
    id_proveedor:Decimal, 
    db:Session = Depends(get_db)
    ):
    """
    Desactiva un proveedor existente de la base de datos.

    Args:
        id_proveedor (Decimal): ID del proveedor a desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
    """
    try:
        provider_service.deactivate_provider(db, id_proveedor)
        return ResponseMessage(message="Proveedor desactivado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
