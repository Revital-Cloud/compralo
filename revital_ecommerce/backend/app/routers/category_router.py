"""
En este archivo se definen las rutas para manejar las operaciones CRUD de categorias, vinculandolas con verbos http (get, post, put, patch, delete).

Mapa del módulo:
- CRUD de categorías.
- Gestión de atributos por categoría.
- Activación/desactivación con cascada.

Relación con capas:
- Router: validación HTTP y permisos.
- Service: `category_service` con funciones SQL y reglas de integridad.
"""

from decimal import Decimal
from fastapi import APIRouter, Body, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken

# Importar los esquemas de categoria
from schemas.category_schema import (
    CategoryCreate,
    CategoryUpdate,
    Category,
    ResponseMessage,
    CreateCategoryResponse,
    ToggleRequest,
    SetCategoryAttributesRequest,
    CategoryAttributeResponse,
    CategoryAttributeWithValuesResponse,
)
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

    Endpoint -> Service:
    - Endpoint: `GET /categories`
    - Service: `category_service.get_categories`
    """
    categories = category_service.get_categories(db)
    return categories if categories else []


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

    Endpoint -> Service:
    - Endpoint: `GET /categories/{id_categoria}`
    - Service: `category_service.get_category`
    """
    try:
        category = category_service.get_category(db, id_categoria)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
        return category
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Ruta para crear una nueva categoría
@router.post("/categories", response_model=CreateCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    db: Session = Depends(get_db),
    category_data: CategoryCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una nueva categoría en la base de datos. Devuelve id_categoria para poder asignar atributos (PUT /categories/{id}/attributes).

    Endpoint -> Service:
    - Endpoint: `POST /categories`
    - Service: `category_service.create_category`
    """
    try:
        category_id = category_service.create_category(db, category_data, current_user.id_usuario)
        return CreateCategoryResponse(message="Categoría creada exitosamente", id=category_id)
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

    Endpoint -> Service:
    - Endpoint: `PUT /categories/{id_categoria}`
    - Service: `category_service.update_category`
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
    
# Atributos de la categoría
@router.get("/categories/{id_categoria}/attributes", response_model=list[CategoryAttributeResponse])
async def get_category_attributes(id_categoria: Decimal, db: Session = Depends(get_db)):
    """
    Devuelve atributos asociados a una categoría.

    Endpoint -> Service:
    - Endpoint: `GET /categories/{id_categoria}/attributes`
    - Service: `category_service.get_category_attributes`
    """
    try:
        rows = category_service.get_category_attributes(db, id_categoria)
        return [CategoryAttributeResponse(**dict(r)) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/categories/{id_categoria}/attributes-with-values", response_model=list[CategoryAttributeWithValuesResponse])
async def get_category_attributes_with_values(id_categoria: Decimal, db: Session = Depends(get_db)):
    """
    Obtiene atributos de categoría junto con valores predefinidos.

    Endpoint -> Service:
    - Endpoint: `GET /categories/{id_categoria}/attributes-with-values`
    - Service: `category_service.get_category_attributes_with_values`
    """
    try:
        rows = category_service.get_category_attributes_with_values(db, id_categoria)
        return [CategoryAttributeWithValuesResponse(**r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/categories/{id_categoria}/attributes", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def set_category_attributes(
    id_categoria: Decimal,
    body: SetCategoryAttributesRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Reemplaza la configuración de atributos de una categoría.

    Endpoint -> Service:
    - Endpoint: `PUT /categories/{id_categoria}/attributes`
    - Service: `category_service.set_category_attributes`
    """
    try:
        category = category_service.get_category(db, id_categoria)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
        items = [x.model_dump() for x in body.attributes]
        category_service.set_category_attributes(db, id_categoria, items, current_user.id_usuario)
        return ResponseMessage(message="Atributos de la categoría actualizados correctamente")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Ruta para activar/desactivar una categoría existente   
@router.put(
    "/categories/{id_categoria}/toggle",
    response_model=ResponseMessage, 
    status_code=status.HTTP_200_OK
    )
async def toggle_category(
    id_categoria: Decimal,
    toggle_data: ToggleRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
    ):
    """
    Activa o desactiva una categoría existente de la base de datos.
    Aplica cascada a líneas, sublíneas, productos y comentarios relacionados.

    Args:
        id_categoria (Decimal): ID de la categoría a activar/desactivar.
        toggle_data (ToggleRequest): Datos con el campo activar (bool).
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación con detalles de elementos afectados.

    Endpoint -> Service:
    - Endpoint: `PUT /categories/{id_categoria}/toggle`
    - Service: `category_service.deactivate_activate_category`
    """
    try:
        activar = toggle_data.activar
        result = category_service.deactivate_activate_category(db, id_categoria, current_user.id_usuario, activar)
        message = result if result else f"Categoría {'activada' if activar else 'desactivada'} exitosamente"
        return ResponseMessage(message=message)
    except Exception as e:
        import traceback
        error_detail = f"Error al cambiar estado de categoría: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_detail)

# Ruta para desactivar una categoría existente (mantener compatibilidad)
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
    Mantiene compatibilidad con endpoints existentes.

    Args:
        id_categoria (Decimal): ID de la categoría a desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación de desactivación exitosa.

    Endpoint -> Service:
    - Endpoint: `PUT /categories/{id_categoria}/deactivate`
    - Service: `category_service.deactivate_category`
    """
    try:
        result = category_service.deactivate_category(db, id_categoria, current_user.id_usuario)
        message = result if result else "Categoría desactivada exitosamente"
        return ResponseMessage(message=message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))