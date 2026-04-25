"""
Servicio para métricas públicas de la homepage.
"""
from sqlalchemy import text
from sqlalchemy.orm import Session


def get_homepage_stats(db: Session) -> dict[str, int]:
    """
    Retorna conteos reales para tarjetas del hero.
    """
    query = text(
        """
        SELECT
            (SELECT COUNT(*)
             FROM tab_usuarios
             WHERE ind_activo = TRUE) AS total_clients,
            (SELECT COUNT(*)
             FROM tab_products
             WHERE is_active = TRUE) AS total_products
        """
    )

    row = db.execute(query).mappings().first()
    if row is None:
        return {"total_clients": 0, "total_products": 0}

    return {
        "total_clients": int(row.get("total_clients") or 0),
        "total_products": int(row.get("total_products") or 0),
    }
