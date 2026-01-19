"""
Router para el dashboard administrativo.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import require_admin, UserInToken
from services.dashboard_service import get_dashboard_data

router = APIRouter(tags=["Dashboard"])


@router.get("/admin/dashboard", status_code=status.HTTP_200_OK)
async def get_dashboard(
    time_range: str = 'monthly',
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtiene todos los datos del dashboard administrativo.
    
    Args:
        time_range (str): Rango de tiempo ('daily', 'weekly', 'monthly')
        db (Session): Sesión de base de datos
        current_user (UserInToken): Usuario autenticado (debe ser admin)
        
    Returns:
        dict: Datos completos del dashboard
    """
    try:
        # Validar time_range
        if time_range not in ['daily', 'weekly', 'monthly']:
            time_range = 'monthly'
        
        data = get_dashboard_data(db, time_range)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener datos del dashboard: {str(e)}"
        )

