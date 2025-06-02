from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.category_schema import CategoryCreate, CategoryUpdate

"""
En este archivo se crean las funciones utilizando "query by example" para interactuar con la base de datos en un CRUD básico:
 
# `get_categories`: Obtiene todos los proveedores registrados en la base de datos. (trae lo importante, no lo de auditoría)
# `get_category`: Obtiene un proveedor específico por su ID.
# `create_category`: Crea una nueva categoría en la base de datos llamando a la función fun_insert_categoria().
# `update_category`: Actualiza una categoría existente en la base de datos llamando a la función fun_update_categoria().
# `delete_category`: Elimina una categoría existente en la base de datos llamando a la función fun_delete_categoria().
"""


#Todas las categorías
def get_categories(db: Session):
    try:
        query = text("""
        SELECT 
            id_categoria,
            nom_categoria
        FROM tab_categorias
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener categorías: {str(e)}")

#Una categoría específica
def get_category(db: Session, id_categoria: Decimal):
    try:
        query = text("""
        SELECT 
            id_categoria,
            nom_categoria
        FROM tab_categorias
        WHERE id_categoria = :id_categoria
        """)
        result = db.execute(query, {"id_categoria": id_categoria})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener la categoría: {str(e)}")
    
    
#Crear una categoría
def create_category(db: Session, category: CategoryCreate):
    try:
        params = category.model_dump()
        query = text("""
        SELECT fun_insert_categoria(
            :nom_categoria
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear la categoría: {str(e)}")
    
#Update una categoria
def update_category(db: Session, id_categoria: Decimal, category: CategoryUpdate):
    try:
        params = category.model_dump(exclude_unset=True)  # Excluir campos no proporcionados
        params['id_categoria'] = id_categoria  # Añadir el ID de la categoría a actualizar
        query = text("""
        SELECT fun_update_categoria(
            :id_categoria,
            :nom_categoria
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar la categoría: {str(e)}")

#Elimina una categoria
def delete_category(db: Session, id_categoria: Decimal):
    try:
        query = text("""
        SELECT fun_delete_categoria(:id_categoria)
        """)
        result = db.execute(query, {"id_categoria": id_categoria})
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar la categoría: {str(e)}")
