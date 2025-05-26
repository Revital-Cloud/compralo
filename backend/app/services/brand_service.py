from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.schemas.brand_schema import BrandCreate, BrandUpdate


def get_brands(db:Session):
    """
    Obtiene todas las marcas registradas en la base de datos.
    """
    try:
        query = text("""
        SELECT 
            id_marca,
            nom_marca
        FROM tab_marcas
        """)
        result = db.execute(query)
        return result.mappings().all()  
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener marcas: {str(e)}")
    
def create_brand(db:Session, brand:BrandCreate):
    """
    Crea una nueva marca en la base de datos.

    Utiliza la función de base de datos `fun_insert_marca` para insertar
    una nueva marca, identificado por `id_marca`. Los datos para la
    inserción se toman del esquema `BrandCreate` (solo campos proporcionados).
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        brand (BrandCreate): Un objeto Pydantic `BrandCreate` con los datos a insertar.
    """
    try:
        # Convierte el objeto Pydantic BrandCreate en un diccionario Python
        # Ejemplo: BrandCreate(nom_marca="Nike") -> {'nom_marca': 'Nike'}
        params = brand.model_dump()
        
        # Define la consulta SQL que ejecuta una función almacenada en PostgreSQL
        # :nom_marca es un parámetro nombrado que será reemplazado por el valor del diccionario params
        query = text("""
        SELECT fun_insert_marca(:nom_marca)
        """)
        
        # Ejecuta la consulta SQL pasando los parámetros de forma segura
        # Esto previene inyección SQL al usar parámetros nombrados
        result = db.execute(query, params)
        
        # Obtiene la primera fila del resultado (usualmente el ID de la marca creada)
        # fetchone() devuelve una tupla con el resultado de la función almacenada
        fetched_result = result.fetchone()
        
        # Confirma la transacción y hace permanentes los cambios en la base de datos
        # Sin commit(), los cambios se perderían al cerrar la conexión
        db.commit()
        
        # Retorna el primer elemento del resultado si existe, sino None
        # Típicamente devuelve el ID de la nueva marca o un mensaje de confirmación
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        # Si ocurre cualquier error, deshace todos los cambios no confirmados
        db.rollback()
        
        # Relanza la excepción con contexto adicional para debugging
        raise Exception(f"Error al crear marca: {e}")
    
def update_brand(db:Session, id_marca:Decimal, brand:BrandUpdate):
    """
    Actualiza una marca existente en la base de datos.
    
    Utiliza la función de base de datos `fun_update_marca` para actualizar
    una marca existente, identificado por `id_marca`. Los datos para la
    actualización se toman del esquema `BrandUpdate` (solo campos proporcionados).
    """
    try:
        update_params = brand.model_dump(exclude_unset=True)
        update_params['id_marca'] = id_marca

        query = text("""
        SELECT fun_update_marca(
            :id_marca,
            :nom_marca
        )
        """)
        result = db.execute(query, update_params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar marca: {str(e)}")
    
def delete_brand(db:Session, id_marca:Decimal):
    """
    Elimina una marca existente de la base de datos.
    
    Utiliza la función de base de datos `fun_delete_marca` para eliminar
    una marca existente, identificado por `id_marca`.
    """
    try:
        params = {'id_marca': id_marca}
        query = text("""
        SELECT fun_delete_marca(:id_marca)
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        if fetched_result and isinstance(fetched_result[0], str):
            return {"message": fetched_result[0]}
        else:
            return {"message": "Marca eliminada correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar marca: {str(e)}")
    
    
