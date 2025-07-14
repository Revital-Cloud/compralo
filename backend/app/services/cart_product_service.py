from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from schemas.cart_product_schemas import CalculateTotalCart, CartProductCreate, CartProductDelete, GetCartDetail, MigrateCartAnonymous, GetCartUser

def get_cart(db:Session):
    """
    Obtiene todos los carritos.
    """
    try:
        query = text("""
        SELECT 
            id_carrito,
            id_usuario,
            session_id,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_carritos
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener carritos: {str(e)}")

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

    
def create_cart_product(db: Session, cart_product: CartProductCreate, usr_insert: Optional[Decimal]):
    """
    Crea un nuevo producto en el carrito.
    Utiliza la función de base de datos `fun_agregar_producto_carrito` para insertar
    un nuevo producto en el carrito.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        cart_product (CartProductCreate): Un objeto Pydantic `CartProductCreate` con los datos a insertar.
        Debe contener id_usuario (para usuarios autenticados) O session_id (para usuarios anónimos).
        usr_insert (Optional[Decimal]): El usuario que insertó el registro.
    
    Raises:
        Exception: Si no se proporciona ni id_usuario ni session_id en cart_product.
    """
    try:      
        params = cart_product.model_dump()
        params["usr_insert"] = usr_insert
        
        query = text("""
        SELECT fun_agregar_producto_carrito(
            :id_usuario,
            :session_id,
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
    
def delete_cart_product(db: Session, id_usuario: Optional[Decimal], session_id: Optional[Decimal], id_categoria_producto: Decimal, id_linea_producto: Decimal, id_sublinea_producto: Decimal, id_producto: Decimal, cantidad: Decimal, usr_update: Decimal):
    """
    Elimina un producto en el carrito.
    Utiliza la función de base de datos `fun_eliminar_producto_carrito` para eliminar
    un producto en el carrito.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Optional[Decimal]): ID del usuario (para usuarios autenticados).
        session_id (Optional[Decimal]): ID de la sesión (para usuarios anónimos).
        id_categoria_producto (Decimal): ID de la categoría del producto.
        id_linea_producto (Decimal): ID de la línea del producto.
        id_sublinea_producto (Decimal): ID de la sublínea del producto.
        id_producto (Decimal): ID del producto.
        cantidad (Decimal): Cantidad del producto.
        usr_update (Decimal): El usuario que actualizó el registro.
    
    Raises:
        Exception: Si no se proporciona ni id_usuario ni session_id.
    """
    try:
        query = text("""
        SELECT fun_eliminar_producto_carrito(
            :id_usuario,
            :session_id,
            :id_categoria_producto,
            :id_linea_producto,
            :id_sublinea_producto,
            :id_producto,
            :cantidad,
            :usr_update
        )
        """)
        result = db.execute(query, {
            'id_usuario': id_usuario,
            'session_id': session_id,
            'id_categoria_producto': id_categoria_producto,
            'id_linea_producto': id_linea_producto,
            'id_sublinea_producto': id_sublinea_producto,
            'id_producto': id_producto,
            'cantidad': cantidad,
            'usr_update': usr_update
        })
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar producto en el carrito: {str(e)}")
    
def migrate_cart_anonymous(db: Session, migrate_cart_anonymous: MigrateCartAnonymous, usr_insert: Decimal):
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
        params = migrate_cart_anonymous.model_dump()
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
    
def get_cart_user(db:Session, get_cart_user:GetCartUser):
    """
    Obtiene o crea el carrito de un usuario registrado o anónimo.
    
    Args:
        db (Session): Sesión de base de datos.
        get_car_user (GetCarUser): Datos del usuario (id_usuario o session_id).
    
    Returns:
        int: ID del carrito obtenido o creado.
    """
    try:
        params = get_cart_user.model_dump()
        query = text("""
        SELECT fun_obtener_carrito_usuario(
            :id_usuario,
            :session_id
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        id_carrito = fetched_result[0] if fetched_result else None
        
        if id_carrito is None:
            raise Exception("No se pudo obtener o crear el carrito")
        
        db.commit()
        return int(id_carrito)
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener carrito de usuario: {str(e)}")
    
def get_cart_detail(db:Session, get_cart_detail:GetCartDetail):
    """
    Obtiene a detalle el carrito de un usuario.
    Args:
        db (Session): Sesión de base de datos.
        get_cart_detail (GetCartDetail): Datos del usuario (id_usuario o session_id).
    Returns:
        list[CartProduct]: Lista de productos en el carrito.
    """
    try:
        params = get_cart_detail.model_dump()
        query = text("""
        SELECT fun_obtener_carrito_detalle(:id_usuario, :session_id)
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener detalle del carrito: {str(e)}")
    
def calculate_total_cart(db:Session, calculate_total_cart:CalculateTotalCart):
    """
    Calcula el total del carrito de un usuario.
    Soporta tanto usuarios registrados (id_usuario) como anónimos (session_id).
    """
    try:
        params = calculate_total_cart.model_dump()
        query = text("""
        SELECT fun_calcular_total_carrito(:id_usuario, :session_id, :id_canje_aplicar)
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al calcular total del carrito: {str(e)}")
    
