from decimal import Decimal
from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db

# Importar los esquemas de líneas
from schemas.lines_schema import LineCreate, LineUpdate, Line, ResponseMessage

from services import lines_service

router = APIRouter()

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


# Ruta para obtener una línea específica por ID
@router.get("/lines/{id_linea}", response_model=Line)
async def get_line(id_linea: Decimal, db: Session = Depends(get_db)):
    """
    Obtiene una línea específica por su ID.

    Args:
        id_linea (Decimal): ID de la línea a obtener.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        Line: La línea solicitada.
    """
    line = lines_service.get_line(db, id_linea)
    if not line:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Línea no encontrada")
    return line


# Ruta para crear una nueva línea
@router.post("/lines", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_line(line: LineCreate, db: Session = Depends(get_db)):
    """
    Crea una nueva línea en la base de datos.

    Args:
        line (LineCreate): Datos de la línea a crear.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    line_id = lines_service.create_line(db, line)
    if not line_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al crear la línea")
    return ResponseMessage(message="Línea creada con éxito")


# Ruta para actualizar una línea existente
@router.put("/lines/{id_linea}", response_model=ResponseMessage)
async def update_line(id_linea: Decimal, line: LineUpdate, db: Session = Depends(get_db)):
    """
    Actualiza una línea existente en la base de datos.

    Args:
        id_linea (Decimal): ID de la línea a actualizar.
        line (LineUpdate): Datos actualizados de la línea.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    updated_line = lines_service.update_line(db, id_linea, line)
    if not updated_line:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al actualizar la línea")
    return ResponseMessage(message="Línea actualizada con éxito")

# Ruta para eliminar una línea existente
@router.delete("/lines/{id_linea}", response_model=ResponseMessage, status_code=status.HTTP_204_NO_CONTENT)
async def delete_line(id_linea: Decimal, db: Session = Depends(get_db)):
    """
    Elimina una línea existente en la base de datos.

    Args:
        id_linea (Decimal): ID de la línea a eliminar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    deleted_line = lines_service.delete_line(db, id_linea)
    if not deleted_line:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al eliminar la línea")
    return ResponseMessage(message="Línea eliminada con éxito")
