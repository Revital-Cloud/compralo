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
async def create_line(
    db: Session = Depends(get_db),
    nom_linea: str = Form(...),
    id_categoria: Decimal = Form(...)
):
    """
    Crea una nueva línea en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_linea (str): Nombre de la línea a crear.
        id_categoria (Decimal): ID de la categoría a la que pertenece la línea.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        new_line = LineCreate(nom_linea=nom_linea, id_categoria=id_categoria)
        lines_service.create_line(db, new_line)
        return ResponseMessage(message="Línea creada con éxito")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al crear la línea: {str(e)}")
    """
    new_line = LineCreate(nom_linea=nom_linea, id_categoria=id_categoria)
    created_line = lines_service.create_line(db, new_line)
    if not created_line:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al crear la línea")
    return ResponseMessage(message="Línea creada con éxito")
    """



# Ruta para actualizar una línea existente
@router.put("/lines/{id_linea}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_line(
    id_linea: Decimal, 
    nom_linea: str = Form(...),
    id_categoria: Decimal = Form(...),
    db: Session = Depends(get_db)
    ):
    """
    Actualiza una línea existente en la base de datos.

    Args:
        id_linea (Decimal): ID de la línea a actualizar.
        line (LineUpdate): Datos actualizados de la línea.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        line = LineUpdate(nom_linea=nom_linea, id_categoria=id_categoria)
        lines_service.update_line(db, id_linea, line)
        return ResponseMessage(message="Línea actualizada con éxito")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    

# Ruta para eliminar una línea existente
@router.delete("/lines/{id_linea}", 
               response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_line(
    id_linea: Decimal, 
    db: Session = Depends(get_db)
    ):
    """
    Elimina una línea existente en la base de datos.

    Args:
        id_linea (Decimal): ID de la línea a eliminar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try: 
        lines_service.delete_line(db, id_linea)# Verifica si la línea existe
        return ResponseMessage(message="Línea eliminada con éxito")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error al eliminar la línea: {str(e)}")  
    