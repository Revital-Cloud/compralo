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
            tel_proveedor
        FROM tab_proveedores
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener proveedores: {str(e)}")
    
def create_provider(db:Session, provider:ProviderCreate):
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
        query = text("""
        SELECT fun_insert_proveedores(
            :nom_proveedor,
            :email,
            :tel_proveedor
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear proveedor: {str(e)}")

def update_provider(db:Session, id_proveedor:Decimal, provider:ProviderUpdate):
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
        update_params = provider.model_dump(exclude_unset=True)
        update_params['id_proveedor'] = id_proveedor

        query = text("""
        SELECT fun_update_proveedores(
            :id_proveedor,
            :nom_proveedor,
            :email,
            :tel_proveedor
        )
        """)
        result = db.execute(query, update_params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar proveedor: {str(e)}")
    
def delete_provider(db:Session, id_proveedor:Decimal):
    """
    Elimina un proveedor existente de la base de datos.

    Utiliza la función de base de datos `fun_delete_proveedores` para eliminar
    un proveedor existente, identificado por `id_proveedor`.
    
    """
    try:
        query = text("""    
        SELECT fun_delete_proveedores(:id_proveedor)
        """)
        result = db.execute(query, {'id_proveedor': id_proveedor})
        fetched_result = result.fetchone()
        db.commit()
        if fetched_result and isinstance(fetched_result[0], str):
            return {"message": fetched_result[0]}
        else:
            return {"message": "Proveedor eliminado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar proveedor: {str(e)}")
