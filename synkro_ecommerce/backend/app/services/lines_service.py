from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.lines_schema import LineCreate, LineUpdate

#Muestra todas las líneas
def get_lines(db: Session):
    try:
        query = text("""
        SELECT 
            l.id_categoria,
            l.id_linea,
            l.nom_linea,
            c.nom_categoria,
            l.ind_activo,
            l.usr_insert,
            l.fec_insert,
            l.usr_update,
            l.fec_update
        FROM tab_lineas l
        LEFT JOIN tab_categorias c ON c.id_categoria = l.id_categoria
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener líneas: {str(e)}")
    
#crear una línea
def create_line(db: Session, line: LineCreate, usr_insert: Decimal):
    try:
        params = line.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_insert_linea(
            :id_categoria,
            :nom_linea,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear la línea: {str(e)}")
    
    
#Actualizar una línea
def update_line(db: Session, id_categoria: Decimal, id_linea: Decimal, line: LineUpdate, usr_update: Decimal):
    """
    Actualiza una línea existente en la base de datos.
    Utiliza la función de base de datos fun_update_linea para actualizar
    una línea existente, identificado por id_linea. Los datos para la
    actualización se toman del esquema LineUpdate (solo campos proporcionados).
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_categoria (Decimal): El ID de la categoría asociada.
        id_linea (Decimal): El ID de la línea a actualizar.
        line (LineUpdate): Un objeto Pydantic `LineUpdate` con los datos a actualizar.
    """
    try:
        params = line.model_dump(exclude_unset=True)  # Excluir campos no proporcionados
        params['id_categoria'] = id_categoria
        params['id_linea'] = id_linea  # Añadir el ID de la línea a actualizar
        params['usr_update'] = usr_update
        query = text("""
        SELECT fun_update_linea(
            :id_categoria,
            :id_linea,
            :nom_linea,
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
        raise Exception(f"Error al actualizar la línea: {str(e)}")
    
#Activar o desactivar una línea
def deactivate_activate_line(db: Session, id_categoria: Decimal, id_linea: Decimal, usr_update: Decimal, activar: bool):
    """
    Activa o desactiva una línea y todos sus elementos relacionados (cascada).
    
    Args:
        db: Sesión de base de datos
        id_categoria: ID de la categoría
        id_linea: ID de la línea
        usr_update: Usuario que realiza la operación
        activar: True para activar, False para desactivar
    
    Returns:
        Mensaje de confirmación con detalles de elementos afectados
    """
    try:
        query = text("""
        SELECT fun_deactivate_activate_linea(:id_categoria, :id_linea, :usr_update, :activar)
        """)
        result = db.execute(query, {
            "id_categoria": id_categoria, 
            "id_linea": id_linea, 
            "usr_update": usr_update,
            "activar": activar
        })
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al cambiar estado de la línea: {str(e)}")

#Desactivar una línea (mantener compatibilidad)
def deactivate_line(db: Session, id_categoria: Decimal, id_linea: Decimal, usr_update: Decimal):
    """
    Desactiva una línea (wrapper para mantener compatibilidad).
    """
    return deactivate_activate_line(db, id_categoria, id_linea, usr_update, False)

def get_lines_by_category(db: Session, id_categoria: Decimal):
    """
    Obtiene todas las líneas de una categoría específica.
    """
    try:
        query = text("""
        SELECT 
            l.id_categoria,
            l.id_linea,
            l.nom_linea,
            c.nom_categoria,
            l.ind_activo,
            l.usr_insert,
            l.fec_insert,
            l.usr_update,
            l.fec_update
        FROM tab_lineas l
        LEFT JOIN tab_categorias c ON c.id_categoria = l.id_categoria
        WHERE l.id_categoria = :id_categoria AND l.ind_activo = true
        """)
        result = db.execute(query, {"id_categoria": id_categoria})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener líneas por categoría: {str(e)}")

def get_line(db: Session, id_linea: Decimal):
    """
    Obtiene una línea específica por su ID.
    """
    try:
        query = text("""
        SELECT 
            l.id_categoria,
            l.id_linea,
            l.nom_linea,
            c.nom_categoria,
            l.ind_activo,
            l.usr_insert,
            l.fec_insert,
            l.usr_update,
            l.fec_update
        FROM tab_lineas l
        LEFT JOIN tab_categorias c ON c.id_categoria = l.id_categoria
        WHERE l.id_linea = :id_linea AND l.ind_activo = true
        """)
        result = db.execute(query, {"id_linea": id_linea})
        line = result.mappings().first()
        return line
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener la línea: {str(e)}")