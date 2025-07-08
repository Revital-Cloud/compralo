from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.car_product_schemas import CarProductCreate

def get_car_products(db:Session):
    """
    Obtiene todos los productos en el carrito.
    """
    try:
        query = text("""
        SELECT
            id_carrito_producto,
            id_carrito,
            id_categoria_producto,
            id_linea_producto,
            id_sublinea_producto,
            id_producto,
            cantidad,
            precio_unitario_carrito,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_carrito_productos
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos en el carrito: {str(e)}")
    
def create_car_product(db:Session, car_product:CarProductCreate, usr_insert:Decimal):
    """
    Crea un nuevo producto en el carrito.
    Utiliza la función de base de datos `fun_agregar_producto_carrito` para insertar
    un nuevo producto en el carrito, identificado por `id_carrito_producto`.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        car_product (CarProductCreate): Un objeto Pydantic `CarProductCreate` con los datos a insertar.
        usr_insert (Decimal): El usuario que insertó el registro.
    """
    try:
        params = car_product.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_agregar_producto_carrito(
            :id_usuario,
            :id_categoria_producto,
            :id_linea_producto,
            :id_sublinea_producto,
            :id_producto,
            :cantidad,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear producto en el carrito: {str(e)}")
    
def delete_car_product(db:Session, id_carrito_producto:Decimal, usr_update:Decimal):
    """
    Elimina un producto en el carrito.
    Utiliza la función de base de datos `fun_eliminar_producto_carrito` para eliminar
    un producto en el carrito, identificado por `id_carrito_producto`.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_carrito_producto (Decimal): El identificador del producto en el carrito.
        usr_update (Decimal): El usuario que actualizó el registro.
    """
    try:
        query = text("""
        SELECT fun_eliminar_producto_carrito(
            :id_usuario,
            :id_categoria_producto,
            :id_linea_producto,
            :id_sublinea_producto,
            :id_producto,
            :cantidad,
            :usr_update
        )
        """)
        result = db.execute(query, {'id_carrito_producto': id_carrito_producto, 'usr_update': usr_update})
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar producto en el carrito: {str(e)}")
    
