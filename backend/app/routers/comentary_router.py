"""
Módulo de enrutador para la gestión de comentarios.

Define las rutas y endpoints relacionados con la gestión de comentarios,
incluyendo la creación, actualización y visualización de comentarios.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.comentary_schema import ComentaryCreate, Comentary, ResponseMessage
from services import comentary_service

router = APIRouter(tags=["Comentarios"])

@router.get("/comentaries", response_model=list[Comentary])
async def get_comentaries(db:Session = Depends(get_db)):
    """
    Obtiene todos los comentarios registrados en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list[Comentary]: Lista de comentarios registrados.
    """
    comentarios = comentary_service.get_comentaries(db)
    if comentarios is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron comentarios")
    return comentarios

#ruta para crear un nuevo comentario con JSON body
@router.post("/comentaries", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_comentary(
    db:Session = Depends(get_db),
    comentary_data: ComentaryCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea un nuevo comentario en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        comentary_data (ComentaryCreate): Datos del comentario a crear.
        current_user (UserInToken): Información del usuario autenticado.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        comentary_service.create_comentary(db, comentary_data, current_user.id_usuario)
        return ResponseMessage(message="Comentario creado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/comentaries/{id_categoria}-{id_linea}-{id_sublinea}-{id_producto}-{id_comentario}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_comentary(
    id_categoria:Decimal,
    id_linea:Decimal,
    id_sublinea:Decimal,
    id_producto:Decimal,
    id_comentario:Decimal,
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Desactiva un comentario existente en la base de datos.
    
    Args:
        id_categoria (Decimal): El ID de la categoría asociada.
        id_linea (Decimal): El ID de la linea asociada.
        id_sublinea (Decimal): El ID de la sublinea asociada.
        id_producto (Decimal): El ID del producto asociado.
        id_comentario (Decimal): El ID del comentario a desactivar.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): Información del usuario autenticado.
        
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        comentary_service.deactivate_comentary(db, id_categoria, id_linea, id_sublinea, id_producto, current_user.id_usuario, id_comentario, current_user.id_usuario)
        return ResponseMessage(message="Comentario desactivado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    