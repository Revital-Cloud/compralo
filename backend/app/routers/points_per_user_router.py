"""
Ruta para la gestión de puntos por usuario.
"""
# Definición de rutas (endpoints) de la API para puntos por usuario
from fastapi import APIRouter, Depends, Body, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from core.database import get_db
from core.dependencies import require_admin, get_current_user, get_current_user_optional
from schemas.points_per_user_schema import PointsPerUser, PointsPerUserCreate, PointsPerUserUpdate, ResponseMessage, PointsPerUserBase
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