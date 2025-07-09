from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.car_product_schemas import CalculateTotalCar, CarProductCreate, CarProductDelete, MigrateCarAnonymous, GetCarUser

def get_cart_products(db:Session):
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

def get_cart_detail(db:Session, id_usuario:Decimal):
    """
    Obtiene a detalle el carrito de un usuario.
    """
    try:
        query = text("""
        SELECT fun_obtener_carrito_detalle(:id_usuario)
        """)
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener detalle del carrito: {str(e)}")
    
def create_cart_product(db:Session, car_product:CarProductCreate, usr_insert:Decimal):
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
    
def delete_cart_product(db:Session, car_product:CarProductDelete, usr_update:Decimal):
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
        params = car_product.model_dump()
        params["usr_update"] = usr_update
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
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar producto en el carrito: {str(e)}")
    
def migrate_cart_anonymous(db: Session, migrate_car_anonymous: MigrateCarAnonymous, usr_insert: Decimal):
    """
    Migra productos de un carrito anónimo a un usuario registrado.
    
    Utiliza la función de base de datos `fun_migrar_carrito_anonimo_a_usuario` para migrar
    productos de un carrito anónimo (id_usuario = NULL) al carrito de un usuario registrado.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_carrito (Decimal): El id_carrito de un carrito anónimo (donde id_usuario IS NULL).
        id_usuario (Decimal): El identificador del usuario registrado de destino.
        usr_insert (Decimal): El usuario que realizó la operación.
        

    """
    try:
        params = migrate_car_anonymous.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_migrar_carrito_anonimo_a_usuario(
            :id_carrito,
            :id_usuario,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al migrar carrito anónimo a usuario: {str(e)}")
    
def get_cart_user(db:Session, get_car_user:GetCarUser):
    """
    Obtiene el carrito de un usuario.
    """
    try:
        params = get_car_user.model_dump()
        query = text("""
        SELECT fun_obtener_carrito_usuario(
            :id_usuario,
            :session_id
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener carrito de usuario: {str(e)}")
    
def calculate_total_cart(db:Session, calculate_total_car:CalculateTotalCar):
    """
    Calcula el total del carrito de un usuario.
    """
    try:
        params = calculate_total_car.model_dump()
        query = text("""
        SELECT fun_calcular_total_carrito(:id_usuario, :id_canje_aplicar)
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al calcular total del carrito: {str(e)}")
    
