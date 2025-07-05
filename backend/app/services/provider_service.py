from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.provider_schema import ProviderCreate, ProviderUpdate

def get_providers(db:Session):
    """
    Obtiene todos los proveedores registrados en la base de datos.

    """
    try:
        query = text("""
        SELECT 
            id_proveedor,
            nom_proveedor,
            email,
            tel_proveedor,
            ind_activo
        FROM tab_proveedores
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener proveedores: {str(e)}")
    
#trae un solo proveedor    
def get_provider(db: Session, id_proveedor: Decimal):  
    try:
        query = text("""
        SELECT
            id_proveedor,
            nom_proveedor,
            email,
            tel_proveedor,
            ind_activo
        FROM tab_proveedores
        WHERE id_proveedor = :id_proveedor
        """)
        result = db.execute(query, {"id_proveedor": id_proveedor})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el proveedor: {str(e)}")   
    
def create_provider(db:Session, provider:ProviderCreate, usr_insert: Decimal):
    """
    Crea un nuevo proveedor en la base de datos.

    Utiliza la función de base de datos `fun_insert_proveedor` para insertar
    un nuevo proveedor, identificado por `id_proveedor`. Los datos para la
    inserción se toman del esquema `ProviderCreate` (solo campos proporcionados).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        provider (ProviderCreate): Un objeto Pydantic `ProviderCreate` con los datos a insertar.
    """
    try:
        params = provider.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_insert_proveedores(
            :nom_proveedor,
            :email,
            :tel_proveedor,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear proveedor: {str(e)}")

def update_provider(db:Session, id_proveedor:Decimal, provider:ProviderUpdate, usr_update: Decimal):
    """
    Actualiza un proveedor existente en la base de datos.

    Utiliza la función de base de datos `fun_update_proveedores` para actualizar
    un proveedor existente, identificado por `id_proveedor`. Los datos para la
    actualización se toman del esquema `ProviderUpdate` (solo campos proporcionados).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_proveedor (Decimal): El ID del proveedor a actualizar.
        provider (ProviderUpdate): Un objeto Pydantic `ProviderUpdate` con los datos a actualizar.
    """
    try:
        params = provider.model_dump(exclude_unset=True)
        params['id_proveedor'] = id_proveedor
        params['usr_update'] = usr_update

        query = text("""
        SELECT fun_update_proveedores(
            :id_proveedor,
            :nom_proveedor,
            :email,
            :tel_proveedor,
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
        raise Exception(f"Error al actualizar proveedor: {str(e)}")
    
def deactivate_provider(db:Session, id_proveedor:Decimal):
    """
    Desactiva un proveedor existente de la base de datos.

    Utiliza la función de base de datos `fun_deactivate_proveedores` para desactivar
    un proveedor existente, identificado por `id_proveedor`.
    
    """
    try:
        query = text("""    
        SELECT fun_deactivate_proveedores(:id_proveedor)
        """)
        result = db.execute(query, {'id_proveedor': id_proveedor})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar proveedor: {str(e)}")
