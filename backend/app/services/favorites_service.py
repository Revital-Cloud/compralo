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
        Lista de favoritos del usuario especificado con detalles del producto.
    """
    
    try:
        # SQLAlchemy convierte automáticamente JSONB a dict en Python
        # FastAPI luego lo serializa a JSON en la respuesta
        query = text("""
        SELECT 
            f.id_usuario,
            f.id_categoria_producto,
            f.id_linea_producto,
            f.id_sublinea_producto,
            f.id_producto,
            p.nom_producto,
            p.img_producto,
            p.val_precio,
            f.fec_insert
        FROM tab_favoritos f
        INNER JOIN tab_productos p ON (
            f.id_categoria_producto = p.id_categoria AND
            f.id_linea_producto = p.id_linea AND
            f.id_sublinea_producto = p.id_sublinea AND
            f.id_producto = p.id_producto
        )
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
    """
    try:
        # Usar la función de base de datos fun_insert_favorito
        query = text("""
        SELECT fun_insert_favorito(
            :id_usuario,
            :id_categoria_producto,
            :id_linea_producto,
            :id_sublinea_producto,
            :id_producto,
            :usr_insert
        )
        """)
        
        result = db.execute(query, {
            'id_usuario': favorite.id_usuario,
            'id_categoria_producto': favorite.id_categoria_producto,
            'id_linea_producto': favorite.id_linea_producto,
            'id_sublinea_producto': favorite.id_sublinea_producto,
            'id_producto': favorite.id_producto,
            'usr_insert': usr_insert
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

def delete_favorite(db:Session, id_usuario: Decimal, id_categoria_producto: Decimal, id_linea_producto: Decimal, id_sublinea_producto: Decimal, id_producto: Decimal):
    """
    Elimina un favorito existente en la base de datos usando la función fun_delete_favorito.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario.
        id_categoria_producto (Decimal): ID de la categoría del producto.
        id_linea_producto (Decimal): ID de la línea del producto.
        id_sublinea_producto (Decimal): ID de la sublínea del producto.
        id_producto (Decimal): ID del producto.
    """
    try:
        # Usar la función de base de datos fun_delete_favorito
        query = text("""
        SELECT fun_delete_favorito(
            :id_usuario,
            :id_categoria_producto,
            :id_linea_producto,
            :id_sublinea_producto,
            :id_producto
        )
        """)
        
        result = db.execute(query, {
            'id_usuario': id_usuario,
            'id_categoria_producto': id_categoria_producto,
            'id_linea_producto': id_linea_producto,
            'id_sublinea_producto': id_sublinea_producto,
            'id_producto': id_producto
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