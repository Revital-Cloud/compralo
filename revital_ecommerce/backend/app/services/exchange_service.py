from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.exchange_schema import ApplyExchangeOrder, ExchangePointsDiscount

def get_exchanges(db:Session):
    """
    Obtiene todos los canjes de puntos y descuentos.
    """
    try:
        query = text("""
        SELECT 
            id_canje,
            id_usuario,
            id_descuento,
            puntos_utilizados,
            id_orden_aplicado,
            fec_expiracion_canje,
            fec_utilizacion,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_canjes_puntos_descuentos
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener canjes: {str(e)}")


def get_my_available_canjes(db: Session, id_usuario: int):
    """
    Lista los canjes disponibles del usuario (canjeados, no utilizados y no vencidos).
    """
    try:
        query = text("""
        SELECT 
            c.id_canje,
            c.id_descuento,
            d.nom_descuento,
            c.puntos_utilizados,
            c.fec_expiracion_canje
        FROM tab_canjes_puntos_descuentos c
        JOIN tab_descuentos d ON d.id_descuento = c.id_descuento
        WHERE c.id_usuario = :id_usuario
          AND c.ind_utilizado = FALSE
          AND (c.fec_expiracion_canje IS NULL OR c.fec_expiracion_canje >= CURRENT_TIMESTAMP)
        ORDER BY c.fec_expiracion_canje ASC NULLS LAST, c.fec_insert DESC
        """)
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al listar canjes disponibles: {str(e)}")


    
def exchange_points_discount(db:Session, exchange_points_discount:ExchangePointsDiscount, usr_insert:Decimal):
    """
    Realiza un canje de puntos por descuento.
    """
    try:
        params = exchange_points_discount.model_dump()
        # Seguridad: el canje siempre se ejecuta para el usuario autenticado.
        params["id_usuario"] = usr_insert
        params["usr_insert"] = usr_insert

        # Validar límites de uso antes de intentar el canje en la función SQL.
        limits_query = text("""
        SELECT
            d.max_usos_total,
            d.max_usos_por_usuario,
            COALESCE((
                SELECT COUNT(*)
                FROM tab_canjes_puntos_descuentos c
                WHERE c.id_descuento = d.id_descuento
            ), 0) AS total_canjes,
            COALESCE((
                SELECT COUNT(*)
                FROM tab_canjes_puntos_descuentos c
                WHERE c.id_descuento = d.id_descuento
                  AND c.id_usuario = :id_usuario
            ), 0) AS canjes_usuario
        FROM tab_descuentos d
        WHERE d.id_descuento = :id_descuento
        LIMIT 1
        """)
        limits_row = db.execute(
            limits_query,
            {"id_descuento": params["id_descuento"], "id_usuario": params["id_usuario"]},
        ).mappings().first()

        if not limits_row:
            raise Exception("Descuento no encontrado")

        if (
            limits_row.get("max_usos_total") is not None
            and int(limits_row["total_canjes"]) >= int(limits_row["max_usos_total"])
        ):
            raise Exception("Este descuento alcanzó su límite máximo de canjes")

        if (
            limits_row.get("max_usos_por_usuario") is not None
            and int(limits_row["canjes_usuario"]) >= int(limits_row["max_usos_por_usuario"])
        ):
            raise Exception("Ya alcanzaste el límite de canjes para este descuento")

        query = text("""
        SELECT fun_canjear_puntos_descuento(
            :id_usuario, 
            :id_descuento,  
            :usr_insert)
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al realizar canje de puntos por descuento: {str(e)}")
    
def apply_exchange_order(db:Session, apply_exchange_order:ApplyExchangeOrder, usr_update:Decimal):
    """
    Aplica un canje de orden.
    """
    try:
        params = apply_exchange_order.model_dump()
        params["usr_update"] = usr_update
        query = text("""
        SELECT fun_aplicar_canje_orden(
            :id_canje,
            :id_orden,
            :id_usuario,
            :usr_update)
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al aplicar canje de orden: {str(e)}")