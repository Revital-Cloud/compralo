from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.address_schema import AddressCreate, AddressUpdate

    
def get_user_addresses(db: Session, id_usuario: Decimal):
    """
    Obtiene las direcciones activas de un usuario específico.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario para filtrar las direcciones.
    
    Returns:
        Lista de direcciones del usuario.
    """
    try:
        query = text("""
        SELECT
            id_direccion,
            id_usuario,
            nombre_direccion,
            calle_direccion,
            ciudad,
            departamento,
            codigo_postal,
            barrio,
            referencias,
            complemento,
            ind_principal,
            ind_activa,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_direcciones_usuario
        WHERE id_usuario = :id_usuario 
        ORDER BY ind_principal DESC, fec_insert DESC
        """)
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener direcciones del usuario: {str(e)}")
    
def create_address(db:Session, address:AddressCreate, usr_insert:Decimal):
    """
    Crea una nueva dirección en la base de datos.

    Utiliza la función de base de datos `fun_insert_direcciones` para insertar
    una nueva dirección, identificado por `id_direccion`. Los datos para la
    inserción se toman del esquema `AddressCreate` (solo campos proporcionados).
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        address (AddressCreate): Un objeto Pydantic `AddressCreate` con los datos a insertar.
        usr_insert (Decimal): Identificador del usuario que insertó la dirección.
    """
    try:
        params = address.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_insert_direcciones(
            :id_usuario,
            :nombre_direccion,
            :calle_direccion,
            :ciudad,
            :departamento,
            :codigo_postal,
            :barrio,
            :referencias,
            :complemento,
            :ind_principal,
            :ind_activa,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        # Verificar si la función SQL retornó un error
        if fetched_result and isinstance(fetched_result[0], str) and "Error:" in fetched_result[0]:
            raise Exception(fetched_result[0])
            
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear dirección: {str(e)}")
    
def update_address(db:Session, id_direccion:Decimal, address:AddressUpdate, usr_update:Decimal):
    """
    Actualiza una dirección existente en la base de datos.

    Utiliza la función de base de datos `fun_update_direcciones` para actualizar
    una dirección existente, identificado por `id_direccion`. Los datos para la
    actualización se toman del esquema `AddressUpdate` (solo campos proporcionados).
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_direccion (Decimal): El ID de la dirección a actualizar.
        id_usuario (Decimal): El ID del usuario que actualizó la dirección.
        nombre_direccion (str): El nombre descriptivo de la dirección.
        calle_direccion (str): La dirección completa de la calle.
        ciudad (str): La ciudad de la dirección.
        departamento (str): El departamento/estado de la dirección.
        codigo_postal (str): El código postal de la dirección.
        barrio (str): El barrio/sector de la dirección.
        referencias (str): Las referencias para el domiciliario.
        complemento (str): El complemento de la dirección.
        ind_principal (bool): Indica si la dirección es principal.
        ind_activa (bool): Indica si la dirección está activa.
        usr_update (Decimal): Identificador del usuario que actualizó la dirección.
    """
    try:
        # Construir parámetros con todas las llaves esperadas por la función SQL.
        base_params = {
            "id_direccion": id_direccion,
            "id_usuario": None,
            "nombre_direccion": None,
            "calle_direccion": None,
            "ciudad": None,
            "departamento": None,
            "codigo_postal": None,
            "barrio": None,
            "referencias": None,
            "complemento": None,
            "ind_principal": None,
            "ind_activa": None,
            "usr_update": usr_update,
        }
        # Sobrescribir con valores reales enviados
        params = {**base_params, **address.model_dump(exclude_unset=True)}
        # Si no se envía id_usuario en la actualización, usar el usuario autenticado
        if params.get("id_usuario") is None:
            params["id_usuario"] = usr_update
        query = text("""
        SELECT fun_update_direcciones(
            :id_direccion,
            :id_usuario,
            :nombre_direccion,
            :calle_direccion,
            :ciudad,
            :departamento,
            :codigo_postal,
            :barrio,
            :referencias,
            :complemento,
            :ind_principal,
            :ind_activa,
            :usr_update
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar dirección: {str(e)}")
    
def deactivate_address(db:Session, id_direccion:Decimal, id_usuario:Decimal, usr_update:Decimal):
    """
    Desactiva una dirección existente en la base de datos.

    Utiliza la función de base de datos `fun_deactivate_direcciones` para desactivar
    una dirección existente, identificado por `id_direccion`.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_direccion (Decimal): El ID de la dirección a desactivar.
        id_usuario (Decimal): El ID del usuario propietario de la dirección.
        usr_update (Decimal): Identificador del usuario que desactivó la dirección.
    """
    try:
        query = text("""
        SELECT fun_deactivate_direcciones(
            :id_direccion,
            :id_usuario,
            :usr_update
        )
        """)
        result = db.execute(query, {
            'id_direccion': id_direccion, 
            'id_usuario': id_usuario,
            'usr_update': usr_update
        })
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar dirección: {str(e)}")

def deactivate_main_address(db:Session, id_direccion:Decimal, id_usuario:Decimal, usr_update:Decimal):
    """
    Desactiva o activa la dirección principal de un usuario.
    """
    try:
        query = text("""
        SELECT fun_deactivate_direccion_principal(
            :id_direccion,
            :id_usuario,
            :usr_update
        )
        """)
        result = db.execute(query, {'id_direccion': id_direccion, 'id_usuario': id_usuario, 'usr_update': usr_update})
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar la dirección principal: {str(e)}")