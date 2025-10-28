from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.comentary_schema import ComentaryCreate

def get_comentaries(db:Session):
    """
    Obtiene todos los comentarios registrados en la base de datos.

    """
    
    try:
        query = text("""
        SELECT
            id_categoria,
            id_linea,
            id_sublinea,
            id_producto,
            id_usuario,
            id_comentario,
            comentario,
            calificacion,
            ind_activo,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_comentarios
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener comentarios: {str(e)}")

def create_comentary(db:Session, comentary:ComentaryCreate, id_usuario:Decimal):
    """
    Crea un nuevo comentario en la base de datos.

    Utiliza la función de base de datos `fun_insert_comentario` para insertar
    un nuevo comentario. El id_usuario se toma del token de autenticación.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        comentary (ComentaryCreate): Un objeto Pydantic `ComentaryCreate` con los datos a insertar.
        id_usuario (Decimal): Identificador del usuario autenticado que crea el comentario.
        usr_insert (Decimal): Identificador del usuario que insertó el registro.
    """
    try:
        params = comentary.model_dump()
        params["id_usuario"] = id_usuario
        params["usr_insert"] = id_usuario
        
        query = text("""
        SELECT fun_insert_comentarios(
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :id_producto,
            :id_usuario,
            :id_orden,
            :comentario,
            :calificacion,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear comentario: {str(e)}")
       
def get_comentaries_by_product(db:Session, id_categoria:Decimal, id_linea:Decimal, id_sublinea:Decimal, id_producto:Decimal):
    """
    Obtiene todos los comentarios activos de un producto específico con información del usuario.
    """
    try:
        query = text("""
            SELECT 
                c.id_comentario,
                c.id_categoria,
                c.id_linea,
                c.id_sublinea,
                c.id_producto,
                c.id_usuario,
                c.comentario,
                c.calificacion,
                c.ind_activo,
                c.fec_insert,
                u.nom_usuario as nombre_usuario,
                u.email_usuario
            FROM tab_comentarios c
            INNER JOIN tab_usuarios u ON c.id_usuario = u.id_usuario
            WHERE c.id_categoria = :id_categoria
              AND c.id_linea = :id_linea
              AND c.id_sublinea = :id_sublinea
              AND c.id_producto = :id_producto
              AND c.ind_activo = TRUE
            ORDER BY c.fec_insert DESC
        """)
        
        result = db.execute(query, {
            "id_categoria": id_categoria,
            "id_linea": id_linea,
            "id_sublinea": id_sublinea,
            "id_producto": id_producto
        })
        
        return result.mappings().all()
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener comentarios del producto: {str(e)}")

def get_reviewed_products_in_order(db: Session, id_orden: int, id_usuario: int) -> list:
    """
    Obtiene la lista de productos que el usuario ya ha reseñado en una orden específica.
    
    Args:
        db (Session): Sesión de base de datos.
        id_orden (int): ID de la orden.
        id_usuario (int): ID del usuario.
        
    Returns:
        list: Lista de strings con formato "id_categoria-id_linea-id_sublinea-id_producto"
    """
    try:
        query = text("""
            SELECT DISTINCT
                CONCAT(c.id_categoria, '-', c.id_linea, '-', c.id_sublinea, '-', c.id_producto) as product_key
            FROM tab_comentarios c
            WHERE c.id_orden = :id_orden
              AND c.id_usuario = :id_usuario
              AND c.ind_activo = TRUE
        """)
        
        result = db.execute(query, {"id_orden": id_orden, "id_usuario": id_usuario})
        return [row[0] for row in result.fetchall()]
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos reseñados: {str(e)}")

def deactivate_comentary(db:Session, id_categoria:Decimal, id_linea:Decimal, id_sublinea:Decimal, id_producto:Decimal, id_usuario:Decimal, id_comentario:Decimal, usr_update:Decimal):
    """
    Desactiva un comentario existente en la base de datos.
    Utiliza la función de base de datos `fun_delete_comentario` para desactivar
    un comentario existente, identificado por `id_comentarios`.
    """
    try:
        query = text("""
        SELECT fun_deactivate_comentarios(
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :id_producto,
            :id_usuario,
            :id_comentario,
            :usr_update
        )
        """)
        result = db.execute(query, {'id_categoria': id_categoria, 'id_linea': id_linea, 'id_sublinea': id_sublinea, 'id_producto': id_producto, 'id_usuario': id_usuario, 'id_comentario': id_comentario, 'usr_update': usr_update})
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar comentario: {str(e)}")
    
    