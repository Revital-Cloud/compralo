from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.lines_schema import LineCreate, LineUpdate

#Muestra todas las líneas
def get_lines(db: Session):
    try:
        query = text("""
        SELECT 
            id_linea,
            nom_linea,
            id_categoria
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
            :nom_linea,
            :id_categoria
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
def update_line(db: Session, id_linea: Decimal, line: LineUpdate):
    try:
        params = line.model_dump(exclude_unset=True)  # Excluir campos no proporcionados
        params['id_linea'] = id_linea  # Añadir el ID de la línea a actualizar
        query = text("""
        SELECT fun_update_linea(
            :id_linea,
            :nom_linea,
            :id_categoria
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
def delete_line(db: Session, id_linea: Decimal):
    try:
        query = text("""
        SELECT fun_delete_linea(:id_linea)
        """)
        result = db.execute(query, {"id_linea": id_linea})
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar la línea: {str(e)}")