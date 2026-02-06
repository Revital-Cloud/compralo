"""
Router para la barra informativa superior (Top Info Bar).

- GET /top-info-bar/active: público, devuelve la barra activa y vigente o null.
- GET /top-info-bar: admin, devuelve la configuración única.
- PUT /top-info-bar: admin, crea o actualiza la configuración.
"""
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import require_admin
from schemas.auth_schema import UserInToken
from schemas.cms_schema import ResponseMessage
from schemas.top_info_bar_schema import TopInfoBar, TopInfoBarPayload, TopInfoBarPublic
from services import top_info_bar_service

router = APIRouter(tags=["Top Info Bar"])


@router.get("/top-info-bar/active", response_model=TopInfoBarPublic | None)
async def get_active_top_info_bar(db: Session = Depends(get_db)):
    """
    Obtiene la barra informativa activa y vigente para mostrar en la tienda.
    Público, sin autenticación. Retorna null si no hay barra activa o no está en vigencia.
    """
    try:
        bar = top_info_bar_service.get_active_bar(db)
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[TopInfoBar] GET /active - Returning: {bar}")
        return bar
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"[TopInfoBar] GET /active - Error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/top-info-bar", response_model=TopInfoBar)
async def get_top_info_bar_config(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """
    Obtiene la configuración de la barra para el panel admin.
    Requiere rol administrador. 404 si aún no se ha creado la configuración.
    """
    try:
        bar = top_info_bar_service.get_bar(db)
        if bar is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuración de barra no encontrada")
        return bar
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/top-info-bar", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def upsert_top_info_bar(
    data: TopInfoBarPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """
    Crea o actualiza la configuración de la barra informativa.
    Requiere rol administrador.
    """
    try:
        top_info_bar_service.upsert_bar(db, data, current_user.id_usuario)
        return ResponseMessage(message="Configuración de la barra guardada correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
