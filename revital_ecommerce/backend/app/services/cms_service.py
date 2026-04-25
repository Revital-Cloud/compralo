"""
Módulo de Servicios de CMS Content

Este módulo contiene la lógica de negocio para gestionar el CMS Content.
Se encarga de interactuar con la base de datos para realizar operaciones
CRUD (Crear, Leer, Actualizar, Eliminar) sobre el CMS Content,
utilizando funciones de base de datos (procedimientos almacenados o funciones SQL).

Las funciones aquí definidas son llamadas por los routers de la API
y utilizan los esquemas Pydantic para la validación y transformación de datos.

Responsabilidades:
- listar contenido CMS,
- obtener detalle de contenido,
- crear/actualizar/desactivar contenido con funciones SQL.
"""
import json
from sqlalchemy.orm import Session
from sqlalchemy import text
from decimal import Decimal

from schemas.cms_schema import CmsCreate,CmsUpdate

def get_contents(db:Session):
    """
    Obtiene todos los CMS Content registrados en la base de datos.

    Ejecuta una consulta SQL para seleccionar todos los CMS Content y devuelve
    los resultados como una lista de diccionarios (RowMappings).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list: Una lista de diccionarios, donde cada diccionario representa un CMS Content.

    Se consume desde:
    - `cms_router.get_cms_contents`
    """
    try:
        query = text("""
        SELECT
            id_cms_content,
            nom_cms_content,
            des_cms_content,
            num_version,
            ind_publicado,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_cms_content
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener CMS Content: {str(e)}")

def get_content(db:Session,id_cms_content:int):
    """
    Obtiene un CMS Content específico de la base de datos.

    Ejecuta una consulta SQL para seleccionar un CMS Content por su ID y devuelve
    el resultado como un diccionario (RowMapping).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_cms_content (int): El ID del CMS Content a obtener.

    Returns:
        dict: Un diccionario que representa el CMS Content encontrado.

    Se consume desde:
    - `cms_router.get_cms_content`
    """
    try:
        query = text("""
        SELECT
            id_cms_content,
            nom_cms_content,
            des_cms_content,
            num_version,
            ind_publicado,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_cms_content
        WHERE id_cms_content = :id_cms_content
        """)
        result = db.execute(query,{"id_cms_content":id_cms_content})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener CMS Content: {str(e)}")

def create_cms_content(db:Session,cms_content:CmsCreate, usr_insert: Decimal):
    """
    Crea un nuevo CMS Content en la base de datos.

    Utiliza la función de base de datos `fun_insert_cms_content` para insertar
    un nuevo CMS Content. Los datos del CMS Content se toman del esquema `CmsCreate`.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        cms_content (CmsCreate): Un objeto Pydantic `CmsCreate` con los datos del CMS Content.

    Returns:
        dict or None: Un diccionario que representa el CMS Content creado (generalmente el JSON
        devuelto por la función SQL) o None si la creación falla o la función
        SQL no devuelve el resultado esperado.

    Implementación:
    - delega en función SQL `fun_insert_content`.
    """
    try:
        params = cms_content.model_dump()
        params["usr_insert"] = usr_insert
        if 'des_cms_content' in params and isinstance(params['des_cms_content'], dict):
            params['des_cms_content'] = json.dumps(params['des_cms_content'])
            
        query = text("""
        SELECT fun_insert_content(
            :nom_cms_content,
            :des_cms_content,
            :num_version,
            :usr_insert
        )
        """)
        result = db.execute(query,params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear CMS Content: {str(e)}")
    
def update_cms_content(db:Session,id_cms_content:int,cms_content:CmsUpdate, usr_update: Decimal):
    """
    Actualiza un CMS Content existente en la base de datos.
    Utiliza la función de base de datos `fun_update_content` para actualizar
    un CMS Content existente. Los datos del CMS Content se toman del esquema `CmsUpdate`.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_cms_content (int): El ID del CMS Content a actualizar.
        cms_content (CmsUpdate): Un objeto Pydantic `CmsUpdate` con los datos del CMS Content.

    Returns:
        dict or None: Un diccionario que representa el CMS Content actualizado (generalmente el JSON
        devuelto por la función SQL) o None si la actualización falla o la función
        SQL no devuelve el resultado esperado.

    Implementación:
    - delega en función SQL `fun_update_content`.
    """
    try:
        update_params = cms_content.model_dump(exclude_unset=True)
        update_params["id_cms_content"] = id_cms_content
        update_params["usr_update"] = usr_update
        
        # Convertir des_cms_content de dict a JSON string si es necesario
        if 'des_cms_content' in update_params and isinstance(update_params['des_cms_content'], dict):
            update_params['des_cms_content'] = json.dumps(update_params['des_cms_content'])
            
        query = text("""
        SELECT fun_update_content(
            :id_cms_content,
            :nom_cms_content,
            :des_cms_content,
            :num_version,
            :ind_publicado,
            :usr_update
        )
        """)
        result = db.execute(query,update_params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar CMS Content: {str(e)}")
    
def delete_cms_content(db:Session,id_cms_content:int, usr_update: Decimal):
    """
    Elimina un CMS Content de la base de datos.
    Utiliza la función de base de datos `fun_delete_content` para eliminar
    un CMS Content existente.

    Nota:
    - el endpoint usa verbo `PUT .../deactivate` por compatibilidad semántica del proyecto.
    """
    try:
        query = text("""
        SELECT fun_delete_content(:id_cms_content, :usr_update)
        """)
        result = db.execute(query,{"id_cms_content":id_cms_content, "usr_update": usr_update})
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar CMS Content: {str(e)}")