"""
Ruta para la gestión de puntos por usuario.
"""
# Definición de rutas (endpoints) de la API para puntos por usuario
from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from core.database import get_db
from core.dependencies import  get_current_user, require_admin
from schemas.points_per_user_schema import PointsPerUser, PointsHistoryResponse
from schemas.auth_schema import UserInToken
from services import points_per_user_service

router = APIRouter(tags=["Puntos por usuario"])

# Obtener puntos por usuario
@router.get("/points-per-user", response_model=PointsPerUser)
async def get_points_per_user(db: Session = Depends(get_db),current_user: UserInToken = Depends(get_current_user)):
    """
    Obtener puntos por usuario.
    """
    try:
        points_per_user = points_per_user_service.get_points_per_user(db, current_user.id_usuario)
        if not points_per_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Puntos por usuario no encontrados")
        return points_per_user
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.get("/historial-puntos", response_model=PointsHistoryResponse, status_code=status.HTTP_200_OK)
async def get_history_exchanges(db:Session = Depends(get_db), current_user: UserInToken = Depends(get_current_user)):
    """
    Obtiene el historial de canjes de puntos y descuentos.
    """
    exchanges = points_per_user_service.get_points_per_user_history(db, current_user.id_usuario)
    return exchanges

# Endpoints Admin
@router.get("/admin/all", status_code=status.HTTP_200_OK)
async def get_all_users_with_points(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtiene todos los usuarios con sus puntos (solo admin).
    """
    try:
        users_with_points = points_per_user_service.get_all_users_with_points(db)
        return users_with_points
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/admin/user/{id_usuario}/history", response_model=PointsHistoryResponse, status_code=status.HTTP_200_OK)
async def get_user_points_history_admin(
    id_usuario: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtiene el historial de puntos de un usuario específico (solo admin).
    """
    try:
        history = points_per_user_service.get_points_per_user_history(db, id_usuario)
        return history
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))