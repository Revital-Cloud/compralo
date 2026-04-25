from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.favorites_schema import FavoritesCreate
from services.product_service import SQL_IMG_PRINCIPAL_COALESCE_P

"""
Servicios de favoritos.

Responsabilidades:
- listar favoritos por usuario con datos de producto,
- crear favorito con control de duplicados (vía función SQL),
- eliminar favorito.
"""


def get_favorites(db:Session, id_usuario: Decimal):
    """
    Obtiene todos los favoritos de un usuario específico.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario del cual obtener los favoritos.
    
    Returns:
        Lista de favoritos del usuario especificado con detalles del producto.

    Se consume desde:
    - `favorites_router.get_favorites`
    """
    
    try:
        # SQLAlchemy convierte automáticamente JSONB a dict en Python
        # FastAPI luego lo serializa a JSON en la respuesta
        query = text("""
        SELECT
            f.id_usuario,
            f.product_id AS id_producto,
            p.name AS nom_producto,
            """ + SQL_IMG_PRINCIPAL_COALESCE_P + """ AS img_producto,
            (SELECT MIN(c.price) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id AND c.is_active = TRUE) AS val_precio,
            f.fec_insert
        FROM tab_favoritos f
        INNER JOIN tab_products p ON p.id = f.product_id
        WHERE f.id_usuario = :id_usuario
        ORDER BY f.fec_insert DESC
        """) 
        result = db.execute(query, {'id_usuario': id_usuario})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener favoritos: {str(e)}")
    
def create_favorite(db:Session, favorite:FavoritesCreate, usr_insert: Decimal):
    """
    Crea un nuevo favorito en la base de datos usando la función fun_insert_favorito.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        favorite (FavoritesCreate): Un objeto Pydantic 'FavoritesCreate' con los datos a insertar.
        usr_insert (Decimal): ID del usuario que está creando el favorito.

    Implementación:
    - delega en `fun_insert_favorito`.
    - traduce error de duplicado a mensaje amigable.
    """
    try:
        # tab_favoritos usa product_id; la API puede seguir enviando id_producto (y opc. id_categoria, id_linea, id_sublinea)
        query = text("""
        SELECT fun_insert_favorito(:p_id_usuario, :p_product_id, :p_usr_operacion)
        """)
        result = db.execute(query, {
            "p_id_usuario": favorite.id_usuario,
            "p_product_id": favorite.id_producto,
            "p_usr_operacion": usr_insert,
        })
        
        fetched_result = result.fetchone()
        db.commit()
        
        # La función retorna un mensaje, verificar si es exitoso
        message = fetched_result[0] if fetched_result else "Error desconocido"
        
        if "Error:" in message:
            # Si el error es de duplicado, lanzar excepción con mensaje específico
            if "ya está en favoritos" in message:
                raise Exception("El producto ya está en tus favoritos")
            raise Exception(message)
        
        return {"message": message}
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        # Mantener mensaje específico de duplicado
        if "ya está en favoritos" in error_msg or "ya está en tus favoritos" in error_msg:
            raise Exception("El producto ya está en tus favoritos")
        raise Exception(f"Error al crear favorito: {error_msg}")

def delete_favorite(db: Session, id_usuario: Decimal, id_producto: Decimal):
    """
    Elimina un favorito (tab_favoritos: id_usuario, product_id).

    Implementación:
    - delega en `fun_delete_favorito`.
    """
    try:
        query = text("""
        SELECT fun_delete_favorito(:p_id_usuario, :p_product_id)
        """)
        result = db.execute(query, {
            "p_id_usuario": id_usuario,
            "p_product_id": id_producto,
        })
        
        fetched_result = result.fetchone()
        db.commit()
        
        # La función retorna un mensaje, verificar si es exitoso
        message = fetched_result[0] if fetched_result else "Error desconocido"
        
        if "Error:" in message:
            raise Exception(message)
        
        return {"message": message}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar favorito: {str(e)}")