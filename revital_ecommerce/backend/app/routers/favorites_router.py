"""
Módulo de enrutador para la gestión de favoritos.

Define las rutas y endpoints relacionados con la gestión de favoritos,
incluyendo la creación, visualización y eliminación de favoritos.

Mapa del módulo:
- Listado de favoritos por usuario.
- Alta y baja de favoritos por producto.

Relación con capas:
- Router: seguridad de ownership y validación HTTP.
- Service: `favorites_service` para persistencia/consultas.
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from core.exceptions import get_safe_message
from schemas.auth_schema import UserInToken
from schemas.favorites_schema import FavoritesCreate, FavoritesBase, ResponseMessage, FavoritesPostBody, FavoriteDetails
from services import favorites_service

router = APIRouter(tags=["Favoritos"])

@router.get("/favorites/{id_usuario}", response_model=list[FavoriteDetails])
async def get_favorites(id_usuario: Decimal, 
    db: Session = Depends(get_db)):
    """
    Obtiene todos los favoritos de un usuario específico.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario para obtener sus favoritos.
        
    Returns:
        list[Favorites]: Lista de favoritos del usuario.

    Endpoint -> Service:
    - Endpoint: `GET /favorites/{id_usuario}`
    - Service: `favorites_service.get_favorites`
    """
    try:
        favorites = favorites_service.get_favorites(db, id_usuario)
        if not favorites:
            return []
        return favorites
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=get_safe_message(e))

@router.post("/favorites", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_favorite(
    db:Session = Depends(get_db),
    favorite_data: FavoritesPostBody = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea un nuevo favorito en la base de datos.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario que tiene el favorito.
        id_categoria_producto (Decimal): El ID de la categoría del producto.
        id_linea_producto (Decimal): El ID de la linea del producto.
        id_sublinea_producto (Decimal): El ID de la sublinea del producto.
        id_producto (Decimal): El ID del producto.

    Endpoint -> Service:
    - Endpoint: `POST /favorites`
    - Service: `favorites_service.create_favorite`
    """
    try:
        favorite_to_create = FavoritesCreate(
            id_usuario=current_user.id_usuario,
            usr_insert=current_user.id_usuario,
            **favorite_data.model_dump()
        )
            
        favorites_service.create_favorite(db, favorite_to_create, current_user.id_usuario)
        return ResponseMessage(message="Favorito creado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))

@router.delete("/favorites/{id_usuario}-{id_producto}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_favorite(
    id_usuario: Decimal,
    id_producto: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Elimina un favorito existente (tab_favoritos: id_usuario, product_id).

    Endpoint -> Service:
    - Endpoint: `DELETE /favorites/{id_usuario}-{id_producto}`
    - Service: `favorites_service.delete_favorite`

    Seguridad:
    - valida que el `id_usuario` de ruta coincida con usuario autenticado.
    """
    try:
        if id_usuario != current_user.id_usuario:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para eliminar favoritos de otro usuario."
            )
        favorites_service.delete_favorite(db, id_usuario, id_producto)
        return ResponseMessage(message="Favorito eliminado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))