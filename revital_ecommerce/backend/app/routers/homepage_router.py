"""
Router público para datos de homepage.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.homepage_schema import HomepageStatsResponse
from services.homepage_service import get_homepage_stats

router = APIRouter(tags=["Homepage"])


@router.get("/homepage/stats", response_model=HomepageStatsResponse, status_code=status.HTTP_200_OK)
async def get_homepage_stats_endpoint(db: Session = Depends(get_db)):
    """
    Obtiene métricas públicas de la homepage para el hero.
    """
    try:
        return get_homepage_stats(db)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
