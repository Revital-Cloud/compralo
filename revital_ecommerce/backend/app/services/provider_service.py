from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.provider_schema import ProviderCreate, ProviderUpdate

"""
Servicios de proveedores.

Responsabilidades:
- listar/obtener proveedor,
- crear/actualizar proveedor,
- activar/desactivar estado operativo.
"""

def get_providers(db:Session):
    """
    Obtiene todos los proveedores registrados en la base de datos.

    Se consume desde:
    - `provider_router.get_providers`
    """
    try:
        query = text("""
        SELECT 
            id_proveedor,
            nom_proveedor,
            email,
            tel_proveedor,
            ind_activo,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_proveedores
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener proveedores: {str(e)}")
    
#trae un solo proveedor    
def get_provider(db: Session, id_proveedor: Decimal):  
    """Obtiene un proveedor por ID."""
    try:
        query = text("""
        SELECT
            id_proveedor,
            nom_proveedor,
            email,
            tel_proveedor,
            ind_activo,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
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

    Implementación:
    - delega en `fun_insert_proveedores`.
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

    Implementación:
    - delega en `fun_update_proveedores`.
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
    
def deactivate_activate_provider(db:Session, id_proveedor:Decimal, usr_update: Decimal, activar: bool):
    """
    Activa o desactiva un proveedor existente de la base de datos.
    
    Args:
        db: Sesión de base de datos
        id_proveedor: ID del proveedor
        usr_update: Usuario que realiza la operación
        activar: True para activar, False para desactivar
    
    Returns:
        Mensaje de confirmación

    Implementación:
    - delega en `fun_deactivate_activate_proveedores`.
    """
    try:
        query = text("""    
        SELECT fun_deactivate_activate_proveedores(:id_proveedor, :usr_update, :activar)
        """)
        result = db.execute(query, {
            'id_proveedor': id_proveedor, 
            'usr_update': usr_update,
            'activar': activar
        })
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al cambiar estado de proveedor: {str(e)}")

def deactivate_provider(db:Session, id_proveedor:Decimal, usr_update: Decimal):
    """
    Desactiva un proveedor (wrapper para mantener compatibilidad).
    """
    return deactivate_activate_provider(db, id_proveedor, usr_update, False)
