from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.lines_schema import LineCreate, LineUpdate

#Muestra todas las líneas
def get_lines(db: Session):
    try:
        query = text("""
        SELECT 
            id_categoria,
            id_linea,
            nom_linea,
            ind_activo
        FROM tab_lineas
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener líneas: {str(e)}")
    
#crear una línea
def create_line(db: Session, line: LineCreate):
    try:
        params = line.model_dump()
        query = text("""
        SELECT fun_insert_linea(
            :id_categoria,
            :nom_linea,
            :ind_activo
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
def update_line(db: Session, id_categoria: Decimal, id_linea: Decimal, line: LineUpdate):
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
        query = text("""
        SELECT fun_update_linea(
            :id_categoria,
            :id_linea,
            :nom_linea,
            :ind_activo
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar la línea: {str(e)}")
    
#Eliminar una línea
def deactivate_line(db: Session, id_categoria: Decimal, id_linea: Decimal):
    """
    Elimina una línea existente en la base de datos.
    Utiliza la función de base de datos fun_deactivate_linea para desactivar
    una línea existente, identificado por id_linea.
    
    """
    try:
        query = text("""
        SELECT fun_deactivate_linea(:id_categoria, :id_linea)
        """)
        result = db.execute(query,{"id_categoria": id_categoria, "id_linea": id_linea})
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar la línea: {str(e)}")