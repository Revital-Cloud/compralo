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
            nom_sublinea,
            ind_activo,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_sublineas
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener sublineas: {str(e)}")
    
def create_subline(db:Session, subline:SublineCreate, usr_insert: Decimal):
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
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_insert_sublinea(
            :id_categoria,
            :id_linea,
            :nom_sublinea,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear sublinea: {str(e)}")
    
def update_subline(db:Session,  id_categoria:Decimal, id_linea:Decimal, id_sublinea:Decimal, subline:SublineUpdate, usr_update: Decimal):
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
        usr_update (Decimal): Identificador del usuario que actualizó el registro.
    """
    try:
        params = subline.model_dump(exclude_unset=True)
        params['id_categoria'] = id_categoria
        params['id_linea'] = id_linea
        params['id_sublinea'] = id_sublinea
        params['usr_update'] = usr_update
        
        query = text("""
        SELECT fun_update_sublinea(
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :nom_sublinea,
            :ind_activo,
            :usr_update
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar sublinea: {str(e)}")
    
def deactivate_subline(db: Session, id_categoria: Decimal, id_linea: Decimal, id_sublinea: Decimal, usr_update: Decimal):
    """
    Desactiva una sublinea existente en la base de datos.
    Utiliza la función de base de datos `fun_delete_sublinea` para desactivar
    una sublinea existente, identificado por `id_sublinea`.
    """
    try:
        query = text("""
        SELECT fun_deactivate_sublinea(
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :usr_update
        )
        """)
        result = db.execute(query, {'id_categoria': id_categoria, 'id_linea': id_linea, 'id_sublinea': id_sublinea, 'usr_update': usr_update})
        fetched_result = result.fetchone()
        db.commit()
        return  fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar sublinea: {str(e)}")

def get_sublines_by_line(db: Session, id_linea: Decimal):
    """
    Obtiene todas las sublíneas de una línea específica.
    """
    try:
        query = text("""
        SELECT
            id_categoria,
            id_linea,
            id_sublinea,
            nom_sublinea,
            ind_activo,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_sublineas
        WHERE id_linea = :id_linea AND ind_activo = true
        """)
        result = db.execute(query, {"id_linea": id_linea})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener sublíneas por línea: {str(e)}")

def get_subline(db: Session, id_sublinea: Decimal):
    """
    Obtiene una sublínea específica por su ID.
    """
    try:
        query = text("""
        SELECT
            id_categoria,
            id_linea,
            id_sublinea,
            nom_sublinea,
            ind_activo,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_sublineas
        WHERE id_sublinea = :id_sublinea AND ind_activo = true
        """)
        result = db.execute(query, {"id_sublinea": id_sublinea})
        subline = result.mappings().first()
        return subline
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener la sublínea: {str(e)}")
        
        
