"""
Módulo de enrutador para la gestión de marcas.

Define las rutas y endpoints relacionados con la gestión de marcas,
incluyendo la creación, actualización y visualización de marcas.

Mapa del módulo:
- CRUD operativo de marcas.
- Activación/desactivación (incluye endpoint legacy de compatibilidad).

Relación con capas:
- Router: validación HTTP y orquestación.
- Service: `brand_service` (funciones SQL de marca).
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.brand_schema import BrandCreate, BrandUpdate, Brand, ResponseMessage, ToggleRequest
from schemas.auth_schema import UserInToken
from services import brand_service

router = APIRouter(tags=["Marcas"])

@router.get("/brands", response_model=list[Brand])
async def get_brands(db:Session = Depends(get_db)):
    """
    Obtiene todas las marcas registradas en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        list[Brand]: Lista de marcas registradas.

    Endpoint -> Service:
    - Endpoint: `GET /brands`
    - Service: `brand_service.get_brands`
    """
    try:
        brands = brand_service.get_brands(db)
        if brands is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron marcas")
        return brands
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
@router.post("/brands", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_brand(
    db:Session = Depends(get_db),
    brand_data:BrandCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una nueva marca en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        brand_data (BrandCreate): Datos de la marca a crear.
        current_user (UserInToken): Usuario autenticado que realiza la creación.

    Endpoint -> Service:
    - Endpoint: `POST /brands`
    - Service: `brand_service.create_brand`
    """
    try:
        service_response = brand_service.create_brand(db, brand_data, current_user.id_usuario)
        if not service_response:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al crear la marca en la base de datos.")
        
        if "Error" in str(service_response):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(service_response))

        return ResponseMessage(message="Marca creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) 
    
@router.put("/brands/{id_marca}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_brand(
    id_marca:Decimal,
    brand_data:BrandUpdate = Body(...),
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Actualiza una marca existente en la base de datos.

    Args:
        id_marca (Decimal): ID de la marca a actualizar.
        brand_data (BrandUpdate): Datos de la marca a actualizar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado que realiza la actualización.

    Endpoint -> Service:
    - Endpoint: `PUT /brands/{id_marca}`
    - Service: `brand_service.update_brand`
    """
    try:
        service_response = brand_service.update_brand(db, id_marca, brand_data, current_user.id_usuario)
        if not service_response:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al actualizar la marca en la base de datos.")
        
        if "Error" in str(service_response):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(service_response))

        return ResponseMessage(message="Marca actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/brands/{id_marca}/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
# Ruta para activar/desactivar una marca existente
@router.put("/brands/{id_marca}/toggle", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def toggle_brand(
    id_marca:Decimal,
    toggle_data: ToggleRequest = Body(...),
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    activar = toggle_data.activar
    """
    Activa o desactiva una marca existente de la base de datos.

    Args:
        id_marca (Decimal): ID de la marca a activar/desactivar.
        activar (bool): True para activar, False para desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación.

    Endpoint -> Service:
    - Endpoint: `PUT /brands/{id_marca}/toggle`
    - Service: `brand_service.deactivate_activate_brand`
    """
    try:
        result = brand_service.deactivate_activate_brand(db, id_marca, current_user.id_usuario, activar)
        message = result.get("message") if isinstance(result, dict) else (result if result else f"Marca {'activada' if activar else 'desactivada'} exitosamente")
        return ResponseMessage(message=message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Ruta para desactivar una marca existente (mantener compatibilidad)
@router.put("/brands/{id_marca}/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_brand(
    id_marca:Decimal, 
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Desactiva una marca existente de la base de datos.
    Mantiene compatibilidad con endpoints existentes.

    Args:
        id_marca (Decimal): ID de la marca a desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Endpoint -> Service:
    - Endpoint: `PUT /brands/{id_marca}/deactivate`
    - Service: `brand_service.deactivate_brand`
    """
    try:
        result = brand_service.deactivate_brand(db, id_marca, current_user.id_usuario)
        message = result.get("message") if isinstance(result, dict) else (result if result else "Marca desactivada exitosamente")
        return ResponseMessage(message=message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
