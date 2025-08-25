from decimal import Decimal
from fastapi import APIRouter, Body, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken

# Importar los esquemas de líneas
from schemas.lines_schema import LineCreate, LineUpdate, Line, ResponseMessage

from services import lines_service

router = APIRouter(tags=["Líneas"])

# Ruta para obtener todas las líneas
@router.get("/lines", response_model=list[Line])
async def get_lines(db: Session = Depends(get_db)):
    """
    Obtiene todas las líneas registradas en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        list[Line]: Lista de líneas registradas.
    """
    lines = lines_service.get_lines(db)
    if not lines:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron líneas")
    return lines

# Ruta para obtener líneas por categoría
@router.get("/lines/category/{id_categoria}", response_model=list[Line])
async def get_lines_by_category(id_categoria: Decimal, db: Session = Depends(get_db)):
    """
    Obtiene todas las líneas de una categoría específica.

    Args:
        id_categoria (Decimal): ID de la categoría.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        list[Line]: Lista de líneas de la categoría especificada.
    """
    lines = lines_service.get_lines_by_category(db, id_categoria)
    if not lines:
        return []  # Retornar lista vacía en lugar de error
    return lines

# Ruta para obtener una línea específica
@router.get("/lines/{id_linea}", response_model=Line)
async def get_line(id_linea: Decimal, db: Session = Depends(get_db)):
    """
    Obtiene una línea específica por su ID.

    Args:
        id_linea (Decimal): ID de la línea a obtener.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        Line: Detalles de la línea solicitada.
    """
    line = lines_service.get_line(db, id_linea)
    if not line:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Línea no encontrada")
    return line


# Ruta para crear una nueva línea
@router.post("/lines", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_line(
    db: Session = Depends(get_db),
    line_data: LineCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una nueva línea en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_linea (str): Nombre de la línea a crear.
        ind_activo (bool): Indica si la línea está activa.
        current_user (UserInToken): Información del usuario actual.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        lines_service.create_line(db, line_data, current_user.id_usuario)
        return ResponseMessage(message="Línea creada con éxito")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al crear la línea: {str(e)}")


# Ruta para actualizar una línea existente
@router.put("/lines/{id_categoria}-{id_linea}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_line(
    id_categoria: Decimal,
    id_linea: Decimal,
    line_data: LineUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Actualiza una línea existente en la base de datos.

    Args:
        id_categoria (Decimal): ID de la categoría a la que pertenece la línea.
        id_linea (Decimal): ID de la línea a actualizar.
        line_data (LineUpdate): Datos actualizados de la línea.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Información del usuario actual.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        lines_service.update_line(db, id_categoria, id_linea, line_data, current_user.id_usuario)
        return ResponseMessage(message="Línea actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al actualizar la línea: {str(e)}")

# Ruta para desactivar una línea existente
@router.put("/lines/{id_categoria}-{id_linea}/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_line(
    id_categoria: Decimal,
    id_linea: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Desactiva una línea existente en la base de datos.

    Args:
        id_categoria (Decimal): ID de la categoría a la que pertenece la línea.
        id_linea (Decimal): ID de la línea a desactivar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        lines_service.deactivate_line(db, id_categoria, id_linea, current_user.id_usuario)
        return ResponseMessage(message="Línea desactivada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
