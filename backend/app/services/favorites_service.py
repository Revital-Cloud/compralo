from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.favorites_schema import FavoritesCreate

def get_favorites(db:Session, id_usuario: Decimal):
    """
    Obtiene todos los favoritos de un usuario específico.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario del cual obtener los favoritos.
    
    Returns:
        Lista de favoritos del usuario especificado.
    """
    
    try:
        # Consulta directa a la tabla de favoritos, similar a como se hace en product_service
        query = text("""
        SELECT 
            id_usuario,
            id_categoria_producto,
            id_linea_producto,
            id_sublinea_producto,
            id_producto,
            fecha_agregado
        FROM tab_favoritos 
        WHERE id_usuario = :id_usuario
        """) 
        result = db.execute(query, {'id_usuario': id_usuario})
        # .mappings() convierte cada fila en un objeto tipo dict (RowMapping)
        # FastAPI puede usar esto para poblar el modelo Pydantic Favorites
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener favoritos: {str(e)}")
    
def create_favorite(db:Session, favorite:FavoritesCreate):
    """
    Crea un nuevo favorito en la base de datos.
    
    Utiliza la función de base de datos 'fun_insert_favorito' para insertar
    un nuevo favorito, identificado por 'id_favorito'. Los datos para la
    inserción se toman del esquema 'FavoritesCreate' (solo campos proporcionados).
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        favorite (FavoritesCreate): Un objeto Pydantic 'FavoritesCreate' con los datos a insertar.
    """
    try:
        params = favorite.model_dump()
        query = text("""
        SELECT fun_insert_favorito(
            :id_usuario,
            :id_categoria_producto,
            :id_linea_producto,
            :id_sublinea_producto,
            :id_producto
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear favorito: {str(e)}")

def delete_favorite(db:Session, id_usuario: Decimal, id_categoria_producto: Decimal, id_linea_producto: Decimal, id_sublinea_producto: Decimal, id_producto: Decimal):
    """
    Elimina un favorito existente en la base de datos.
    
    Utiliza la función de base de datos 'fun_delete_favorito' para eliminar
    un favorito existente, identificado por 'id_usuario', 'id_categoria_producto',
    'id_linea_producto', 'id_sublinea_producto' y 'id_producto'.
    """
    try:
        query = text("""
        SELECT fun_delete_favorito(
            :id_usuario,
            :id_categoria_producto,
            :id_linea_producto,
            :id_sublinea_producto,
            :id_producto
        )
        """)
        result = db.execute(query, {'id_usuario': id_usuario, 'id_categoria_producto': id_categoria_producto, 'id_linea_producto': id_linea_producto, 'id_sublinea_producto': id_sublinea_producto, 'id_producto': id_producto})
        fetched_result = result.fetchone()
        db.commit()
        if fetched_result and isinstance(fetched_result[0], str):
            return {"message": fetched_result[0]}
        else:
            return {"message": "Favorito eliminado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar favorito: {str(e)}")