"""
Módulo de enrutador para la gestión de direcciones.

Define las rutas y endpoints relacionados con la gestión de direcciones,
incluyendo la creación, actualización y visualización de direcciones.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.address_schema import Address, AddressCreate, AddressUpdate, ResponseMessage
from services import address_service

router = APIRouter(tags=["Direcciones"])



@router.get("/addresses", response_model=list[Address])
async def get_my_addresses(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las direcciones del usuario autenticado.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): El usuario autenticado.

    Returns:
        list[Address]: Lista de direcciones del usuario.
    """
    addresses = address_service.get_user_addresses(db, current_user.id_usuario)
    if not addresses:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No tienes direcciones registradas")
    return addresses

#ruta para crear una nueva dirección con JSON body
@router.post("/address", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_address(
    db:Session = Depends(get_db),
    address_data: AddressCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una nueva dirección en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        address_data (AddressCreate): Los datos de la dirección a crear.
        current_user (UserInToken): El usuario autenticado.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        address_service.create_address(db, address_data, current_user.id_usuario)
        return ResponseMessage(message="Dirección creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/address/{id_direccion}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_address(
    id_direccion: Decimal,
    address_data: AddressUpdate = Body(...),
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Actualiza una dirección existente en la base de datos.

    Args:
        id_direccion (Decimal): El ID de la dirección a actualizar.
        address_data (AddressUpdate): Los datos de la dirección a actualizar.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): El usuario autenticado.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        address_service.update_address(db, id_direccion, address_data, current_user.id_usuario)
        return ResponseMessage(message="Dirección actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/address/{id_direccion}-{id_usuario}/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_address(
    id_direccion: Decimal,
    id_usuario: Decimal,
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Desactiva una dirección existente en la base de datos.

    Args:
        id_direccion (Decimal): El ID de la dirección a desactivar.
        id_usuario (Decimal): El ID del usuario que desactiva la dirección.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): El usuario autenticado.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        address_service.deactivate_address(db, id_direccion, id_usuario, current_user.id_usuario)
        return ResponseMessage(message="Dirección desactivada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/address/{id_direccion}-{id_usuario}/deactivate-main", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_main_address(
    id_direccion: Decimal,
    id_usuario: Decimal,
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Desactiva la dirección principal de un usuario.

    Args:
        id_direccion (Decimal): El ID de la dirección a desactivar.
        id_usuario (Decimal): El ID del usuario que desactiva la dirección principal.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): El usuario autenticado.

    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        address_service.deactivate_main_address(db, id_direccion, id_usuario, current_user.id_usuario)
        return ResponseMessage(message="Dirección principal desactivada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))