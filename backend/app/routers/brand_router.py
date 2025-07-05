"""
Módulo de enrutador para la gestión de marcas.

Define las rutas y endpoints relacionados con la gestión de marcas,
incluyendo la creación, actualización y visualización de marcas.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.brand_schema import BrandCreate, BrandUpdate, Brand, ResponseMessage
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
    """
    try:
        brand_service.create_brand(db, brand_data, str(current_user.id_usuario))
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
    """
    try:
        brand_service.update_brand(db, id_marca, brand_data, str(current_user.id_usuario))
        return ResponseMessage(message="Marca actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/brands/{id_marca}/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_brand(id_marca:Decimal, db:Session = Depends(get_db)):
    """
    Desactiva una marca existente de la base de datos.

    Args:
        id_marca (Decimal): ID de la marca a desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
    """
    try:
        brand_service.deactivate_brand(db, id_marca)
        return ResponseMessage(message="Marca desactivada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
