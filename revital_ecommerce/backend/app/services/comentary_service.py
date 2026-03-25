from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from services.product_service import SQL_IMG_PRINCIPAL_COALESCE_P

from schemas.comentary_schema import ComentaryCreate

def get_comentaries(db:Session):
    """
    Obtiene todos los comentarios registrados en la base de datos.

    """
    
    try:
        query = text("""
        SELECT
            product_id,
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
        payload = comentary.model_dump()
        # tab_comentarios usa product_id; la API sigue enviando id_producto (y opcionalmente id_categoria, id_linea, id_sublinea)
        query = text("""
        SELECT fun_insert_comentarios(
            :wid_producto,
            :id_usuario,
            :id_orden,
            :comentario,
            :calificacion,
            :wusr_operacion
        )
        """)
        result = db.execute(query, {
            "wid_producto": payload["id_producto"],
            "id_usuario": id_usuario,
            "id_orden": payload["id_orden"],
            "comentario": payload["comentario"],
            "calificacion": payload["calificacion"],
            "wusr_operacion": id_usuario,
        })
        fetched_result = result.fetchone()
        msg = fetched_result[0] if fetched_result else None
        if msg and str(msg).strip().lower().startswith("error"):
            db.rollback()
            raise Exception(str(msg))
        db.commit()
        return msg
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear comentario: {str(e)}")
       
def get_comentaries_by_product(db: Session, product_id_or_slug: str):
    """
    Comentarios de un producto. Acepta product_id (numérico) o slug (tab_products.slug).
    """
    try:
        product_id = None
        s = (product_id_or_slug or "").strip()
        if s.isdigit():
            product_id = Decimal(s)
        else:
            row = db.execute(
                text("SELECT id FROM tab_products WHERE slug = :slug AND is_active = TRUE LIMIT 1"),
                {"slug": s}
            ).first()
            if row:
                product_id = row[0]
        if product_id is None:
            return []
        query = text("""
            SELECT
                c.id_comentario,
                c.product_id AS id_producto,
                c.id_usuario,
                c.comentario,
                c.calificacion,
                c.ind_activo,
                c.fec_insert,
                u.nom_usuario AS nombre_usuario,
                u.email_usuario
            FROM tab_comentarios c
            INNER JOIN tab_usuarios u ON c.id_usuario = u.id_usuario
            WHERE c.product_id = :id_producto AND c.ind_activo = TRUE
            ORDER BY c.fec_insert DESC
        """)
        result = db.execute(query, {"id_producto": product_id})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener comentarios del producto: {str(e)}")

def get_testimonials_5_star(db: Session, limit: int = 3):
    """
    Obtiene reseñas con calificación 4 o 5 estrellas para la sección de testimonios.
    Prioriza 5 estrellas y luego las más recientes. Incluye nombre del usuario
    y datos del producto reseñado (nombre, imagen).
    """
    try:
        query = text("""
            SELECT
                c.id_comentario,
                c.comentario,
                c.calificacion,
                c.fec_insert,
                c.product_id AS id_producto,
                u.nom_usuario,
                u.ape_usuario,
                p.name AS nom_producto,
                p.slug AS producto_slug,
                """ + SQL_IMG_PRINCIPAL_COALESCE_P + """ AS img_producto
            FROM tab_comentarios c
            INNER JOIN tab_usuarios u ON c.id_usuario = u.id_usuario
            LEFT JOIN tab_products p ON p.id = c.product_id
            WHERE c.calificacion >= 4 AND c.ind_activo = TRUE
            ORDER BY c.calificacion DESC, c.fec_insert DESC
            LIMIT :limit
        """)
        result = db.execute(query, {"limit": limit})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener testimonios 5 estrellas: {str(e)}")


def get_reviewed_products_in_order(db: Session, id_orden: int, id_usuario: int) -> list:
    """
    Obtiene la lista de productos que el usuario ya ha reseñado en una orden específica.
    Utiliza la función de base de datos fun_get_reviewed_products_in_order.
    
    Args:
        db (Session): Sesión de base de datos.
        id_orden (int): ID de la orden.
        id_usuario (int): ID del usuario.
        
    Returns:
        list: Lista de strings con formato "id_categoria-id_linea-id_sublinea-id_producto"
    """
    try:
        query = text("""
            SELECT product_key
            FROM fun_get_reviewed_products_in_order(:id_orden, :id_usuario)
        """)
        
        result = db.execute(query, {"id_orden": id_orden, "id_usuario": id_usuario})
        rows = result.fetchall()
        # Convertir todos los valores a string para asegurar consistencia
        return [str(row[0]) if row[0] is not None else "" for row in rows]
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos reseñados: {str(e)}")

def deactivate_comentary(db: Session, id_categoria: Decimal, id_linea: Decimal, id_sublinea: Decimal, id_producto: Decimal, id_usuario: Decimal, id_comentario: Decimal, usr_update: Decimal):
    """Desactiva un comentario (fun_deactivate_comentarios usa product_id, id_usuario, id_comentario)."""
    try:
        query = text("""
        SELECT fun_deactivate_comentarios(:wid_producto, :id_usuario, :id_comentario, :wusr_operacion)
        """)
        result = db.execute(query, {
            "wid_producto": id_producto,
            "id_usuario": id_usuario,
            "id_comentario": id_comentario,
            "wusr_operacion": usr_update,
        })
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar comentario: {str(e)}")
    
    