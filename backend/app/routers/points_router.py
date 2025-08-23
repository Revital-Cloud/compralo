from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from core.dependencies import get_db, require_admin
from schemas.auth_schema import UserInToken
from schemas.points_schema import PuntosConfig, PuntosConfigUpdate, ResponseMessage, PuntosConfigCreate
from services import points_service

router = APIRouter(tags=["Puntos"])


@router.post("/config",response_model=Any,status_code=status.HTTP_200_OK,summary="Crea una nueva configuración de puntos (Admin)")
async def create_points_config(
    db: Session = Depends(get_db),
    config_data: PuntosConfigCreate = Body(...),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Crea una nueva configuración de puntos llamando a la función de base de datos.
    """
    try:
        points_service.create_points_config(db, config_data, current_user.id_usuario)
        return ResponseMessage(message="Configuración de puntos creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/configuracion/{id_config_puntos}",response_model=Any,status_code=status.HTTP_200_OK,summary="Actualiza la configuración de puntos activa (Admin)")
async def update_points_config(
    id_config_puntos: Decimal,
    config_data: PuntosConfigUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Crea una nueva configuración de puntos llamando a la función de base de datos.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        config_data (PuntosConfigCreate): Los datos de la configuración de puntos a crear.
        current_user (UserInToken): El usuario autenticado.
    """
    try:
        points_service.update_active_config(db, id_config_puntos, config_data, current_user.id_usuario)
        return ResponseMessage(message="Configuración de puntos creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.get("/tasa-activa",response_model=list[PuntosConfig],summary="Obtiene la tasa de conversión de puntos activa")
async def get_active_rate(db: Session = Depends(get_db)):
    """
    Obtiene la tasa de conversión de puntos activa llamando a la función de base de datos.
    """
    points = points_service.get_active_rate(db)
    if points is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró la tasa de conversión de puntos activa")
    return points

