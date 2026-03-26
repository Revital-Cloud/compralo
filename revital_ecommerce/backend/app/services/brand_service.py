from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.brand_schema import BrandCreate, BrandUpdate

"""
Servicios de marcas.

Responsabilidades:
- listar marcas,
- crear/actualizar registros de marca,
- activar/desactivar con función SQL dedicada.
"""


def get_brands(db:Session):
    """
    Obtiene todas las marcas registradas en la base de datos.

    Se consume desde:
    - `brand_router.get_brands`
    """
    try:
        query = text("""
        SELECT 
            id_marca,
            nom_marca,
            ind_activo,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_marcas
        """)
        result = db.execute(query)
        return result.mappings().all()  
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener marcas: {str(e)}")
    
def create_brand(db:Session, brand:BrandCreate, usr_insert: str):
    """
    Crea una nueva marca en la base de datos.

    Utiliza la función de base de datos `fun_insert_marca` para insertar
    una nueva marca, identificado por `id_marca`. Los datos para la
    inserción se toman del esquema `BrandCreate` (solo campos proporcionados).
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        brand (BrandCreate): Un objeto Pydantic `BrandCreate` con los datos a insertar.
        usr_insert (str): ID del usuario que está creando el registro.

    Implementación:
    - delega en `fun_insert_marca`.
    """
    try:
        # Convierte el objeto Pydantic BrandCreate en un diccionario Python
        params = brand.model_dump()
        params["usr_insert"] = usr_insert
        
        # Define la consulta SQL que ejecuta una función almacenada en PostgreSQL
        query = text("""
        SELECT fun_insert_marca(
            :nom_marca,
            :usr_insert
        )
        """)
        
        # Ejecuta la consulta SQL pasando los parámetros de forma segura
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear marca: {e}")
    
def update_brand(db:Session, id_marca:Decimal, brand:BrandUpdate, usr_update: str):
    """
    Actualiza una marca existente en la base de datos.
    
    Utiliza la función de base de datos `fun_update_marca` para actualizar
    una marca existente, identificado por `id_marca`. Los datos para la
    actualización se toman del esquema `BrandUpdate` (solo campos proporcionados).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_marca (Decimal): ID de la marca a actualizar.
        brand (BrandUpdate): Un objeto Pydantic `BrandUpdate` con los datos a actualizar.
        usr_update (str): ID del usuario que está actualizando el registro.

    Implementación:
    - delega en `fun_update_marca`.
    """
    try:
        update_params = brand.model_dump(exclude_unset=True)
        update_params['id_marca'] = id_marca
        update_params['usr_update'] = usr_update

        query = text("""
        SELECT fun_update_marca(
            :id_marca,
            :nom_marca,
            :ind_activo,
            :usr_update
        )
        """)
        result = db.execute(query, update_params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar marca: {str(e)}")
    
def deactivate_activate_brand(db:Session, id_marca:Decimal, usr_update: Decimal, activar: bool):
    """
    Activa o desactiva una marca existente de la base de datos.
    
    Args:
        db: Sesión de base de datos
        id_marca: ID de la marca
        usr_update: Usuario que realiza la operación
        activar: True para activar, False para desactivar
    
    Returns:
        Mensaje de confirmación

    Implementación:
    - delega en `fun_deactivate_activate_marca`.
    """
    try:
        params = {'id_marca': id_marca, 'usr_update': usr_update, 'activar': activar}
        query = text("""
        SELECT fun_deactivate_activate_marca(:id_marca, :usr_update, :activar)
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        if fetched_result and isinstance(fetched_result[0], str):
            return {"message": fetched_result[0]}
        else:
            action = "activada" if activar else "desactivada"
            return {"message": f"Marca {action} correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al cambiar estado de marca: {str(e)}")

def deactivate_brand(db:Session, id_marca:Decimal, usr_update: Decimal):
    """
    Desactiva una marca (wrapper para mantener compatibilidad).
    """
    return deactivate_activate_brand(db, id_marca, usr_update, False)
    
    
