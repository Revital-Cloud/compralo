from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.subline_schema import SublineCreate, SublineUpdate

def get_sublines(db:Session):
    """
    Obtiene todas las sublineas registradas en la base de datos.

    """
    
    try:
        query = text("""
        SELECT
            id_categoria,
            id_linea,
            id_sublinea,
            nom_sublinea
        FROM tab_sublineas
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener sublineas: {str(e)}")
    
def create_subline(db:Session, subline:SublineCreate):
    """
    Crea una nueva sublinea en la base de datos.

    Utiliza la función de base de datos `fun_insert_sublinea` para insertar
    una nueva sublinea, identificado por `id_sublinea`. Los datos para la
    inserción se toman del esquema `SublineCreate` (solo campos proporcionados).
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        subline (SublineCreate): Un objeto Pydantic `SublineCreate` con los datos a insertar.
    """
    try:
        params = subline.model_dump()
        query = text("""
        SELECT fun_insert_sublinea(
            :id_categoria,
            :id_linea,
            :nom_sublinea
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear proveedor: {str(e)}")
    
def update_subline(db:Session, id_sublinea:Decimal, id_categoria:Decimal, id_linea:Decimal, subline:SublineUpdate):
    """
    Actualiza una sublinea existente en la base de datos.

    Utiliza la función de base de datos `fun_update_sublinea` para actualizar
    una sublinea existente, identificado por `id_sublinea`. Los datos para la
    actualización se toman del esquema `SublineUpdate` (solo campos proporcionados).
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_categoria (Decimal): El ID de la categoría asociada.
        id_linea (Decimal): El ID de la linea asociada.
        id_sublinea (Decimal): El ID de la sublinea a actualizar.
        subline (SublineUpdate): Un objeto Pydantic `SublineUpdate` con los datos a actualizar.
    """
    try:
        update_params = subline.model_dump(exclude_unset=True)
        update_params['id_categoria'] = id_categoria
        update_params['id_linea'] = id_linea
        update_params['id_sublinea'] = id_sublinea
        
        query = text("""
        SELECT fun_update_sublinea(
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :nom_sublinea
        )
        """)
        result = db.execute(query, update_params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar sublinea: {str(e)}")
    
def delete_subline(db:Session, id_sublinea:Decimal, id_categoria:Decimal, id_linea:Decimal):
    """
    Elimina una sublinea existente en la base de datos.

    Utiliza la función de base de datos `fun_delete_sublinea` para eliminar
    una sublinea existente, identificado por `id_sublinea`.
    """
    try:
        query = text("""
        SELECT fun_delete_sublinea(
            :id_categoria,
            :id_linea,
            :id_sublinea
        )
        """)
        result = db.execute(query, {'id_categoria': id_categoria, 'id_linea': id_linea, 'id_sublinea': id_sublinea})
        fetched_result = result.fetchone()
        db.commit()
        if fetched_result and isinstance(fetched_result[0], str):
            return {"message": fetched_result[0]}
        else:
            return {"message": "Sublinea eliminada correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar sublinea: {str(e)}")
        
        
