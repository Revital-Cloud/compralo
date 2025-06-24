from decimal import Decimal
from fastapi import APIRouter, Body, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db

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


# Ruta para crear una nueva línea
@router.post("/lines", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_line(
    db: Session = Depends(get_db),
    line_data: LineCreate = Body(...)
):
    """
    Crea una nueva línea en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_linea (str): Nombre de la línea a crear.
        ind_activo (bool): Indica si la línea está activa.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        line_data = LineCreate(id_categoria=line_data.id_categoria, nom_linea=line_data.nom_linea, ind_activo=line_data.ind_activo)
        lines_service.create_line(db, line_data)
        return ResponseMessage(message="Línea creada con éxito")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al crear la línea: {str(e)}")


# Ruta para actualizar una línea existente
@router.put("/lines/{id_categoria}-{id_linea}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_line(
    id_categoria: Decimal,
    id_linea: Decimal,
    line_data: LineUpdate = Body(...),
    db: Session = Depends(get_db)
):
    """
    Actualiza una línea existente en la base de datos.

    Args:
        id_categoria (Decimal): ID de la categoría a la que pertenece la línea.
        id_linea (Decimal): ID de la línea a actualizar.
        line_data (LineUpdate): Datos actualizados de la línea.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        line_data = LineUpdate(nom_linea=line_data.nom_linea, ind_activo=line_data.ind_activo)
        lines_service.update_line(db, id_categoria, id_linea, line_data)
        return ResponseMessage(message="Línea actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al actualizar la línea: {str(e)}")

# Ruta para desactivar una línea existente
@router.put("/lines/{id_categoria}-{id_linea}/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_line(
    id_categoria: Decimal,
    id_linea: Decimal,
    db: Session = Depends(get_db)
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
        lines_service.deactivate_line(db, id_categoria, id_linea)
        return ResponseMessage(message="Línea desactivada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
