"""
Esquemas de respuesta para métricas públicas de la homepage.
"""
from pydantic import BaseModel


class HomepageStatsResponse(BaseModel):
    """
    Métricas resumidas para el hero de la home.
    """

    total_clients: int
    total_products: int
