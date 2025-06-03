"""
Módulo de enrutador para la gestión de marcas.

Define las rutas y endpoints relacionados con la gestión de marcas,
incluyendo la creación, actualización y visualización de marcas.
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from schemas.brand_schema import BrandCreate, BrandUpdate, Brand, ResponseMessage
from services import brand_service

router = APIRouter()

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
    nom_marca:str = Form(...),
):
    """
    Crea una nueva marca en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_marca (str): Nombre de la marca.
    """
    try:
        brand_data = BrandCreate(nom_marca=nom_marca)
        brand_service.create_brand(db, brand_data)
        return ResponseMessage(message="Marca creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) 
    
@router.put("/brands/{id_marca}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_brand(
    id_marca:Decimal,
    db:Session = Depends(get_db),
    nom_marca:str = Form(...),
):
    """
    Actualiza una marca existente en la base de datos.

    Args:
        id_marca (Decimal): ID de la marca a actualizar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_marca (str): Nombre de la marca.
    """
    try:
        brand_data = BrandUpdate(nom_marca=nom_marca)
        brand_service.update_brand(db, id_marca, brand_data)
        return ResponseMessage(message="Marca actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.delete("/brands/{id_marca}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_brand(id_marca:Decimal, db:Session = Depends(get_db)):
    """
    Elimina una marca existente de la base de datos.

    Args:
        id_marca (Decimal): ID de la marca a eliminar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
    """
    try:
        brand_service.delete_brand(db, id_marca)
        return ResponseMessage(message="Marca eliminada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
