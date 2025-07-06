from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import Any

from core.dependencies import get_db, require_admin
from schemas.auth_schema import UserInToken
from schemas.puntos_schema import PuntosConfigActivaUpdate
from services import puntos_service

router = APIRouter(
    prefix="/puntos",
    tags=["Puntos"]
)

@router.put(
    "/configuracion/activa",
    response_model=Any,
    status_code=status.HTTP_200_OK,
    summary="Actualiza la configuración de puntos activa (Admin)"
)
def update_active_points_configuration(
    config_update: PuntosConfigActivaUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Actualiza la configuración de puntos activa llamando a la función 
    `fun_actualizar_config_puntos_empresa` en la base de datos.
    
    - **Sólo accesible por administradores.**
    """
    return puntos_service.update_active_config(
        db=db, 
        config_update=config_update, 
        user_id=current_user.id_usuario
    )

@router.get(
    "/tasa-activa",
    summary="Obtiene la tasa de conversión de puntos activa"
)
def get_active_points_rate(db: Session = Depends(get_db)):
    """
    Obtiene el valor de "pesos por punto" de la configuración activa actualmente,
    llamando a la función `fun_obtener_config_puntos_activa()` en la base de datos.
    
    - **Accesible públicamente.**
    """
    return puntos_service.get_active_rate(db=db) 