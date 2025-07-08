from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.user_discounts_schema import ValidateDiscountRequest, UserDiscounts

def get_user_discounts(db:Session):
    """
    Obtiene todos los descuentos por usuario registrados en la base de datos.

    """
    try:
        query = text("""
        SELECT
            id_usuario,
            id_descuento,
            veces_usado,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_descuentos_usuarios
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuentos por usuario: {str(e)}")


def validate_discount(db:Session, validate_discount_request:ValidateDiscountRequest, usr_insert: Decimal):
    """
    Valida si un descuento es aplicable a un usuario.

    Utiliza la función de base de datos `fun_validar_descuento_aplicable` para validar
    si un descuento es aplicable a un usuario. Los datos para la validación se toman
    del esquema `ValidateDiscountRequest` (solo campos proporcionados).
    """
    try:
        params = validate_discount_request.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_validar_descuento_aplicable(
            :id_descuento,
            :id_usuario,
            :codigo_descuento,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        return result.fetchone()[0]
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al validar descuento: {str(e)}")
    