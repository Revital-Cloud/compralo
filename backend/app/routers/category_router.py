"""
En este archivo se definen las rutas para manejar las operaciones CRUD de categorias, vinculandolas con verbos http (get, post, put, patch, delete).
"""

from decimal import Decimal
from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db

# Importar los esquemas de categoria
from schemas.category_schema import CategoryCreate, CategoryUpdate, Category, ResponseMessage
from services import category_service

router = APIRouter()


# Ruta para obtener todas las categorías
@router.get("/categories", response_model=list[Category])
async def get_categories(db: Session = Depends(get_db)):
    """
    Obtiene todas las categorías registradas en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        list[Category]: Lista de categorías registradas.
    """
    categories = category_service.get_categories(db)
    if not categories:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron categorías")
    return categories


# Ruta para obtener una categoría específica por ID
@router.get("/categories/{id_categoria}",response_model=Category)
async def get_category(id_categoria: Decimal, db: Session = Depends(get_db)):
    """
    Obtiene una categoría específica por su ID.

    Args:
        id_categoria (Decimal): ID de la categoría a obtener.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        Category: Detalles de la categoría solicitada.
    """
    category = category_service.get_category(db, id_categoria)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    return category


#ruta para crear una nueva categoría
@router.post("/categories", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_category(
    db: Session = Depends(get_db),
    nom_categoria: str = Form(...)
):
    """
    Crea una nueva categoría en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_categoria (str): Nombre de la categoría a crear.

    Returns:
        ResponseMessage: Mensaje de confirmación de creación exitosa.
    """
    try:
        category_data = CategoryCreate(nom_categoria=nom_categoria)
        category_service.create_category(db, category_data)
        return ResponseMessage(message="Categoría creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Ruta para actualizar una categoría existente
@router.put("/categories/{id_categoria}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_category(
    id_categoria: Decimal,
    db: Session = Depends(get_db),
    nom_categoria: str = Form(...)
):
    """
    Actualiza una categoría existente en la base de datos.

    Args:
        id_categoria (Decimal): ID de la categoría a actualizar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_categoria (str): Nuevo nombre de la categoría.

    Returns:
        ResponseMessage: Mensaje de confirmación de actualización exitosa.
    """
    try:
        category_data = CategoryUpdate(nom_categoria=nom_categoria)
        category_service.update_category(db, id_categoria, category_data)
        return ResponseMessage(message="Categoría actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
# Ruta para eliminar una categoría existente   
@router.delete("/categories/{id_categoria}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_category(id_categoria: Decimal, db: Session = Depends(get_db)):
    """
    Elimina una categoría existente de la base de datos.

    Args:
        id_categoria (Decimal): ID de la categoría a eliminar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación de eliminación exitosa.
    """
    try:
        category_service.delete_category(db, id_categoria)
        return ResponseMessage(message="Categoría eliminada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))