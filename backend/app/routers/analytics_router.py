"""
Router para analytics avanzados.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import require_admin, UserInToken
from services.analytics_service import get_analytics_data

router = APIRouter(tags=["Analytics"])


@router.get("/admin/analytics", status_code=status.HTTP_200_OK)
async def get_analytics(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtiene todos los datos de analytics avanzados.
    
    Args:
        db (Session): Sesión de base de datos
        current_user (UserInToken): Usuario autenticado (debe ser admin)
        
    Returns:
        dict: Datos completos de analytics
    """
    try:
        data = get_analytics_data(db)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener datos de analytics: {str(e)}"
        )

