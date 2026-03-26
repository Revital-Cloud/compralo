"""
Módulo de enrutador para la gestión de proveedores.

Define las rutas y endpoints relacionados con la gestión de proveedores,
incluyendo la creación, actualización y visualización de proveedores.

Mapa del módulo:
- CRUD operativo de proveedores.
- Activación/desactivación (con endpoint legacy).

Relación con capas:
- Router: validación HTTP y mensajes de respuesta.
- Service: `provider_service` (funciones SQL de proveedores).
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, Form, Body, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.provider_schema import ProviderCreate, ProviderUpdate, Provider, ResponseMessage, ToggleRequest
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

    Endpoint -> Service:
    - Endpoint: `GET /providers`
    - Service: `provider_service.get_providers`
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

    Endpoint -> Service:
    - Endpoint: `GET /providers/{id_proveedor}`
    - Service: `provider_service.get_provider`
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

    Endpoint -> Service:
    - Endpoint: `POST /providers`
    - Service: `provider_service.create_provider`
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

    Endpoint -> Service:
    - Endpoint: `PUT /providers/{id_proveedor}`
    - Service: `provider_service.update_provider`
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
# Ruta para activar/desactivar un proveedor existente
@router.put("/providers/{id_proveedor}/toggle", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def toggle_provider(
    id_proveedor:Decimal,
    toggle_data: ToggleRequest = Body(...),
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
    ):
    activar = toggle_data.activar
    """
    Activa o desactiva un proveedor existente de la base de datos.

    Args:
        id_proveedor (Decimal): ID del proveedor a activar/desactivar.
        activar (bool): True para activar, False para desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación.

    Endpoint -> Service:
    - Endpoint: `PUT /providers/{id_proveedor}/toggle`
    - Service: `provider_service.deactivate_activate_provider`
    """
    try:
        result = provider_service.deactivate_activate_provider(db, id_proveedor, current_user.id_usuario, activar)
        message = result if result else f"Proveedor {'activado' if activar else 'desactivado'} exitosamente"
        return ResponseMessage(message=message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Ruta para desactivar un proveedor existente (mantener compatibilidad)
@router.put("/providers/{id_proveedor}/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_provider(
    id_proveedor:Decimal, 
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
    ):
    """
    Desactiva un proveedor existente de la base de datos.
    Mantiene compatibilidad con endpoints existentes.

    Args:
        id_proveedor (Decimal): ID del proveedor a desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Endpoint -> Service:
    - Endpoint: `PUT /providers/{id_proveedor}/deactivate`
    - Service: `provider_service.deactivate_provider`
    """
    try:
        result = provider_service.deactivate_provider(db, id_proveedor, current_user.id_usuario)
        message = result if result else "Proveedor desactivado exitosamente"
        return ResponseMessage(message=message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
