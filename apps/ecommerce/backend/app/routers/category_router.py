"""
En este archivo se definen las rutas para manejar las operaciones CRUD de categorias, vinculandolas con verbos http (get, post, put, patch, delete).
"""

from decimal import Decimal
from fastapi import APIRouter, Body, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken

# Importar los esquemas de categoria
from schemas.category_schema import CategoryCreate, CategoryUpdate, Category, ResponseMessage
from services import category_service

router = APIRouter(tags=["Categorías"])


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
@router.get("/categories/{id_categoria}", response_model=Category)
async def get_category(id_categoria: Decimal, db: Session = Depends(get_db)):
    """
    Obtiene una categoría específica por su ID.

    Args:
        id_categoria (Decimal): ID de la categoría a obtener.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        Category: Detalles de la categoría solicitada.
    """
    try:
        category = category_service.get_category(db, id_categoria)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
        return category
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Ruta para crear una nueva categoría
@router.post("/categories", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_category(
    db: Session = Depends(get_db),
    category_data: CategoryCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una nueva categoría en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_categoria (str): Nombre de la categoría a crear.
        ind_activo (bool): Indica si la categoría está activa.

    Returns:
        ResponseMessage: Mensaje de confirmación de creación exitosa.
    """
    try:
        category_service.create_category(db, category_data, current_user.id_usuario)
        return ResponseMessage(message="Categoría creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Ruta para actualizar una categoría existente
@router.put("/categories/{id_categoria}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_category(
    id_categoria: Decimal,
    category_data: CategoryUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Actualiza una categoría existente en la base de datos.

    Args:
        id_categoria (Decimal): ID de la categoría a actualizar.
        category_data (CategoryUpdate): Datos actualizados de la categoría.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación de actualización exitosa.
    """
    try:
        category_service.update_category(
            db, 
            id_categoria, 
            category_data,
            current_user.id_usuario
            )
        return ResponseMessage(message="Categoría actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
# Ruta para eliminar una categoría existente   
@router.put(
    "/categories/{id_categoria}/deactivate",
    response_model=ResponseMessage, 
    status_code=status.HTTP_200_OK
    )
async def deactivate_category(
    id_categoria: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
    ):
    """
    Desactiva una categoría existente de la base de datos.

    Args:
        id_categoria (Decimal): ID de la categoría a desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación de eliminación exitosa.
    """
    try:
        
        category_service.deactivate_category(db, id_categoria, current_user.id_usuario)
        return ResponseMessage(message="Categoría desactivada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))