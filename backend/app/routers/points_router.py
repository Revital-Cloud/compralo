from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import Any

from core.dependencies import get_db, require_admin
from schemas.auth_schema import UserInToken
from backend.app.schemas.points_schema import PuntosConfigActivaUpdate, TipoMovimientoDescripcion
from backend.app.services import points_service

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
    return points_service.update_active_config(
        db=db, 
        config_update=config_update, 
        user_id=current_user.id_usuario
    )

@router.get(
    "/tipos-movimiento/{tipo_movimiento_id}",
    response_model=TipoMovimientoDescripcion,
    summary="Obtiene la descripción de un tipo de movimiento de puntos"
)
def get_points_movement_description(
    tipo_movimiento_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene la descripción legible para un código de tipo de movimiento de puntos.
    
    **Códigos de movimiento:**
    - `1`: Acumulación (puntos ganados por compras)
    - `2`: Canje (puntos gastados por descuentos)
    - `3`: Expiración (puntos perdidos por vencimiento)
    
    - **Endpoint público.**
    """
    return points_service.get_movimiento_descripcion(db=db, tipo_movimiento=tipo_movimiento_id)

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
    return points_service.get_active_rate(db=db) 