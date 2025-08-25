"""
Módulo de enrutador para la gestión de sublineas.

Define las rutas y endpoints relacionados con la gestión de sublineas,
incluyendo la creación, actualización y visualización de sublineas.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.subline_schema import SublineCreate, SublineUpdate, Subline, ResponseMessage
from services import subline_service

router = APIRouter(tags=["Sublineas"])

@router.get("/sublines", response_model=list[Subline])
async def get_sublines(db:Session = Depends(get_db)):
    """
    Obtiene todas las sublineas registradas en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list[Subline]: Lista de sublineas registradas.
    """
    sublines = subline_service.get_sublines(db)
    if sublines is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron sublineas")
    return sublines

# Ruta para obtener sublíneas por línea
@router.get("/sublines/line/{id_linea}", response_model=list[Subline])
async def get_sublines_by_line(id_linea: Decimal, db: Session = Depends(get_db)):
    """
    Obtiene todas las sublíneas de una línea específica.

    Args:
        id_linea (Decimal): ID de la línea.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        list[Subline]: Lista de sublíneas de la línea especificada.
    """
    sublines = subline_service.get_sublines_by_line(db, id_linea)
    if not sublines:
        return []  # Retornar lista vacía en lugar de error
    return sublines

# Ruta para obtener una sublínea específica
@router.get("/sublines/{id_sublinea}", response_model=Subline)
async def get_subline(id_sublinea: Decimal, db: Session = Depends(get_db)):
    """
    Obtiene una sublínea específica por su ID.

    Args:
        id_sublinea (Decimal): ID de la sublínea a obtener.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Returns:
        Subline: Detalles de la sublínea solicitada.
    """
    subline = subline_service.get_subline(db, id_sublinea)
    if not subline:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sublínea no encontrada")
    return subline

#ruta para crear una nueva sublinea con JSON body
@router.post("/sublines", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_subline(
    db:Session = Depends(get_db),
    subline_data: SublineCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una nueva sublinea en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        nom_sublinea (str): Nombre de la sublinea a crear.
        ind_activo (bool): Indica si la sublinea está activa.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        subline_service.create_subline(db, subline_data, current_user.id_usuario)
        return ResponseMessage(message="Sublinea creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/sublines/{id_categoria}-{id_linea}-{id_sublinea}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_subline(
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,
    subline_data: SublineUpdate = Body(...),
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Actualiza una sublinea existente en la base de datos.

    Args:
        id_categoria (Decimal): El ID de la categoría asociada.
        id_linea (Decimal): El ID de la linea asociada.
        id_sublinea (Decimal): El ID de la sublinea a actualizar.
        db (Session): La sesión de base de datos SQLAlchemy.
        nom_sublinea (str): El nombre de la sublinea.
        ind_activo (bool): Indica si la sublinea está activa.
    """
    try:
        subline_service.update_subline(db, id_categoria, id_linea, id_sublinea, subline_data, current_user.id_usuario)
        return ResponseMessage(message="Sublinea actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/sublines/{id_categoria}-{id_linea}-{id_sublinea}/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_subline(
    id_categoria:Decimal, 
    id_linea:Decimal, 
    id_sublinea:Decimal, 
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)):
    """
    Desactiva una sublinea existente en la base de datos.

    Args:
        id_categoria (Decimal): El ID de la categoría asociada.
        id_linea (Decimal): El ID de la linea asociada.
        id_sublinea (Decimal): El ID de la sublinea a eliminar.
        db (Session): La sesión de base de datos SQLAlchemy. 

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        subline_service.deactivate_subline(db, id_categoria, id_linea, id_sublinea, current_user.id_usuario)
        return ResponseMessage(message="Sublinea desactivada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
