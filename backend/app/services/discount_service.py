from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.discount_schema import DiscountCreate, DiscountUpdate

def get_discounts(db:Session):
    """
    Obtiene todos los descuentos registrados en la base de datos.

    """
    try:
        query = text("""
        SELECT
            id_descuento,
            nom_descuento,
            des_descuento,
            tipo_calculo,
            val_porce_descuento,
            val_monto_descuento,
            aplica_a,
            id_categoria,
            id_linea,
            id_sublinea,
            id_producto_aplica,
            id_categoria_aplica,
            id_marca_aplica,
            id_linea_aplica,
            id_sublinea_aplica,
            min_valor_pedido,
            ind_es_para_cumpleanos,
            fec_inicio,
            fec_fin,
            ind_activo,
            max_usos_total,
            usos_actuales_total,
            costo_puntos_canje,
            ind_canjeable_puntos,
            codigo_descuento,
            max_usos_por_usuario,
            dias_semana_aplica,
            horas_inicio,
            horas_fin,
            solo_primera_compra,
            monto_minimo_producto,
            cantidad_minima_producto,
            requiere_codigo,
            usr_insert,
            usr_update,
            fec_insert,
            fec_update
        FROM tab_descuentos
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuentos: {str(e)}")
    
def get_discount_exchangeable(db:Session, id_usuario:Decimal, limit:int = 20):
    """
    Obtiene todos descuentos canjeables en la base de datos.
    """
    try:
        query = text("""
        SELECT * FROM fun_listar_descuentos_canjeables(
            :id_usuario,
            :limit
        )
        """)
        result = db.execute(query, {'id_usuario': id_usuario, 'limit': limit})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener descuentos canjeables: {str(e)}")

def create_discount(db:Session, discount:DiscountCreate, usr_insert:Decimal):
    """
    Crea un nuevo descuento en la base de datos.
    
    Utiliza la función de base de datos `fun_insert_descuento` para insertar
    un nuevo descuento, identificado por `id_descuento`. Los datos para la
    inserción se toman del esquema `DiscountCreate` (solo campos proporcionados).
    """
    try:
        params = discount.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_insert_descuento(
            :nom_descuento,
            :des_descuento,
            :tipo_calculo,
            :val_porce_descuento,
            :val_monto_descuento,
            :aplica_a,
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :id_producto_aplica,
            :id_categoria_aplica,
            :id_marca_aplica,
            :id_linea_aplica,
            :id_sublinea_aplica,     
            :fec_inicio,
            :fec_fin,
            :max_usos_total,
            :costo_puntos_canje,
            :codigo_descuento,
            :max_usos_por_usuario,
            :dias_semana_aplica,
            :horas_inicio,
            :horas_fin,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear descuento: {str(e)}")
    
def update_discount(db:Session, id_descuento:Decimal, discount:DiscountUpdate, usr_update:Decimal):
    """
    Actualiza un descuento existente en la base de datos.
    
    Utiliza la función de base de datos `fun_update_descuento` para actualizar
    un descuento existente, identificado por `id_descuento`. Los datos para la
    actualización se toman del esquema `DiscountUpdate` (solo campos proporcionados).
    """
    try:
        params = discount.model_dump(exclude_unset=True)
        params["id_descuento"] = id_descuento
        params["usr_update"] = usr_update
        query = text("""
        SELECT fun_update_descuento(
            :id_descuento,
            :nom_descuento,
            :des_descuento,
            :tipo_calculo,
            :val_porce_descuento,
            :val_monto_descuento,
            :aplica_a,
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :id_producto_aplica,
            :id_categoria_aplica,
            :id_marca_aplica,
            :id_linea_aplica,
            :id_sublinea_aplica,
            :min_valor_pedido,
            :ind_es_para_cumpleanos,
            :fec_inicio,
            :fec_fin,
            :max_usos_total,
            :costo_puntos_canje,
            :ind_canjeable_puntos,
            :codigo_descuento,
            :max_usos_por_usuario,
            :dias_semana_aplica,
            :horas_inicio,
            :horas_fin,
            :solo_primera_compra,
            :monto_minimo_producto,
            :cantidad_minima_producto,
            :requiere_codigo,
            :usr_update
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar descuento: {str(e)}")
    
def deactivate_activate_discount(db:Session, id_descuento:Decimal, activar:bool, usr_update:Decimal):
    """
    Desactiva o activa un descuento existente en la base de datos.
    
    Utiliza la función de base de datos `fun_activar_desactivar_descuento` para
    desactivar o activar un descuento existente, identificado por `id_descuento`.
    """
    try:
        query = text("""
        SELECT fun_activar_desactivar_descuento(
            :id_descuento,
            :activar,
            :usr_update
        )
        """)
        result = db.execute(query, {'id_descuento': id_descuento, 'activar': activar, 'usr_update': usr_update})
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar o activar descuento: {str(e)}")
