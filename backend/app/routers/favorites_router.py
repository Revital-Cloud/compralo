"""
Módulo de enrutador para la gestión de favoritos.

Define las rutas y endpoints relacionados con la gestión de favoritos,
incluyendo la creación, visualización y eliminación de favoritos.
"""
from decimal import Decimal
from datetime import datetime, date
from fastapi import APIRouter, Depends, Body, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from schemas.favorites_schema import FavoritesCreate, Favorites, ResponseMessage
from services import favorites_service

router = APIRouter(tags=["Favoritos"])

@router.get("/favorites/{id_usuario}", response_model=list[Favorites])
async def get_favorites(id_usuario: Decimal, 
    db: Session = Depends(get_db)):
    """
    Obtiene todos los favoritos de un usuario específico.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario para obtener sus favoritos.
        
    Returns:
        list[Favorites]: Lista de favoritos del usuario.
    """
    try:
        favorites = favorites_service.get_favorites(db, id_usuario)
        if not favorites:
            return []
        return favorites
    except Exception as e:
        print(f"Error en get_favorites: {str(e)}")  # Para debugging
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error interno del servidor: {str(e)}")

@router.post("/favorites", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_favorite(
    db:Session = Depends(get_db),
    favorite_data: FavoritesCreate = Body(...)
    # id_usuario:Decimal = Form(...),
    # id_categoria_producto:Decimal = Form(...),
    # id_linea_producto:Decimal = Form(...),
    # id_sublinea_producto:Decimal = Form(...),
    # id_producto:Decimal = Form(...)
):
    """
    Crea un nuevo favorito en la base de datos.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario que tiene el favorito.
        id_categoria_producto (Decimal): El ID de la categoría del producto.
        id_linea_producto (Decimal): El ID de la linea del producto.
        id_sublinea_producto (Decimal): El ID de la sublinea del producto.
        id_producto (Decimal): El ID del producto.
    """
    try:
        favorite_data = FavoritesCreate(
            id_usuario=favorite_data.id_usuario,
            id_categoria_producto=favorite_data.id_categoria_producto,
            id_linea_producto=favorite_data.id_linea_producto,
            id_sublinea_producto=favorite_data.id_sublinea_producto,
            id_producto=favorite_data.id_producto,
            fecha_agregado=date.today()
        )
        favorites_service.create_favorite(db, favorite_data)
        return ResponseMessage(message="Favorito creado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/favorites/{id_usuario}-{id_categoria_producto}-{id_linea_producto}-{id_sublinea_producto}-{id_producto}/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_favorite(
    id_usuario:Decimal,
    id_categoria_producto:Decimal,
    id_linea_producto:Decimal,
    id_sublinea_producto:Decimal,
    id_producto:Decimal,
    db:Session = Depends(get_db)):
    """
    Elimina un favorito existente en la base de datos.
    
    Args:
        id_usuario (Decimal): El ID del usuario que tiene el favorito.
        id_categoria_producto (Decimal): El ID de la categoría del producto.
        id_linea_producto (Decimal): El ID de la linea del producto.
        id_sublinea_producto (Decimal): El ID de la sublinea del producto.
        id_producto (Decimal): El ID del producto.
        db (Session): La sesión de base de datos SQLAlchemy.
    """
    try:
        favorites_service.delete_favorite(db, id_usuario, id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto)
        return ResponseMessage(message="Favorito eliminado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))