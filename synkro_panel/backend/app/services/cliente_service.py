"""
Módulo de Servicios de Clientes.

Este módulo contiene la lógica de negocio para gestionar los clientes
(empresas que contratan el servicio SaaS).
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from schemas.cliente_schema import ClienteCreate, ClienteUpdate


def get_clientes(db: Session) -> List[dict]:
    """
    Obtiene todos los clientes registrados en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list: Una lista de diccionarios con los clientes.
    """
    try:
        query = text("""
        SELECT
            identificacion_fiscal,
            tipo_identificacion,
            nom_empresa,
            email_contacto,
            telefono_contacto,
            direccion_empresa,
            ciudad,
            pais,
            nom_contacto_principal,
            email_contacto_principal,
            telefono_contacto_principal,
            estado_cliente,
            ind_activo,
            fecha_activacion,
            fecha_ultimo_acceso,
            notas_internas,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_clientes
        ORDER BY fec_insert DESC
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener clientes: {str(e)}")


def get_cliente(db: Session, identificacion_fiscal: str) -> Optional[dict]:
    """
    Obtiene un cliente específico de la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        identificacion_fiscal (str): Identificación fiscal del cliente a buscar.

    Returns:
        dict or None: Un diccionario con el cliente o None si no se encuentra.
    """
    try:
        query = text("""
        SELECT
            identificacion_fiscal,
            tipo_identificacion,
            nom_empresa,
            email_contacto,
            telefono_contacto,
            direccion_empresa,
            ciudad,
            pais,
            nom_contacto_principal,
            email_contacto_principal,
            telefono_contacto_principal,
            estado_cliente,
            password_cliente,
            ind_activo,
            fecha_activacion,
            fecha_ultimo_acceso,
            notas_internas,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_clientes
        WHERE identificacion_fiscal = :identificacion_fiscal
        """)
        result = db.execute(query, {"identificacion_fiscal": identificacion_fiscal})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el cliente: {str(e)}")


def get_cliente_by_email(db: Session, email: str) -> Optional[dict]:
    """
    Obtiene un cliente por su email de contacto principal (para autenticación).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        email (str): Email del contacto principal del cliente.

    Returns:
        dict or None: Un diccionario con el cliente o None si no se encuentra.
    """
    try:
        query = text("""
        SELECT 
            identificacion_fiscal,
            tipo_identificacion,
            nom_empresa,
            email_contacto,
            nom_contacto_principal,
            email_contacto_principal,
            password_cliente,
            estado_cliente,
            ind_activo,
            fecha_ultimo_acceso
        FROM tab_clientes 
        WHERE email_contacto_principal = :email
        """)
        result = db.execute(query, {"email": email})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener cliente por email: {str(e)}")


def create_cliente(db: Session, cliente: ClienteCreate, usr_insert: str) -> dict:
    """
    Crea un nuevo cliente llamando a la función SQL.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        cliente (ClienteCreate): Datos del cliente a crear.
        usr_insert (str): Email del usuario que crea el registro.

    Returns:
        dict: Resultado de la operación (JSON de la función SQL).
    """
    try:
        query = text("""
            SELECT fun_insert_cliente(
                :identificacion_fiscal,
                :tipo_identificacion::enum_tipo_identificacion,
                :nom_empresa,
                :email_contacto,
                :telefono_contacto,
                :direccion_empresa,
                :ciudad,
                :pais::enum_pais,
                :nom_contacto_principal,
                :email_contacto_principal,
                :telefono_contacto_principal,
                :estado_cliente::enum_estado_cliente,
                :notas_internas,
                :password_cliente,
                :ind_activo,
                :usr_insert
            )
        """)
        
        params = {
            "identificacion_fiscal": cliente.identificacion_fiscal,
            "tipo_identificacion": cliente.tipo_identificacion or "NIT",
            "nom_empresa": cliente.nom_empresa,
            "email_contacto": cliente.email_contacto,
            "telefono_contacto": cliente.telefono_contacto,
            "direccion_empresa": cliente.direccion_empresa,
            "ciudad": cliente.ciudad,
            "pais": cliente.pais or "CO",
            "nom_contacto_principal": cliente.nom_contacto_principal,
            "email_contacto_principal": cliente.email_contacto_principal,
            "telefono_contacto_principal": cliente.telefono_contacto_principal,
            "estado_cliente": cliente.estado_cliente or "prospecto",
            "notas_internas": cliente.notas_internas,
            "password_cliente": cliente.password_cliente,
            "ind_activo": cliente.ind_activo if cliente.ind_activo is not None else True,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear cliente: {str(e)}")


def update_cliente(db: Session, identificacion_fiscal: str, cliente: ClienteUpdate, usr_update: str) -> dict:
    """
    Actualiza un cliente existente llamando a la función SQL.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        identificacion_fiscal (str): Identificación fiscal del cliente a actualizar.
        cliente (ClienteUpdate): Datos del cliente a actualizar.
        usr_update (str): Email del usuario que actualiza el registro.

    Returns:
        dict: Resultado de la operación (JSON de la función SQL).
    """
    try:
        query = text("""
            SELECT fun_update_cliente(
                :identificacion_fiscal,
                :tipo_identificacion::enum_tipo_identificacion,
                :nom_empresa,
                :email_contacto,
                :telefono_contacto,
                :direccion_empresa,
                :ciudad,
                :pais::enum_pais,
                :nom_contacto_principal,
                :email_contacto_principal,
                :telefono_contacto_principal,
                :estado_cliente::enum_estado_cliente,
                :fecha_ultimo_acceso,
                :notas_internas,
                :password_cliente,
                :ind_activo,
                :usr_update
            )
        """)
        
        params = {
            "identificacion_fiscal": identificacion_fiscal,
            "tipo_identificacion": cliente.tipo_identificacion,
            "nom_empresa": cliente.nom_empresa,
            "email_contacto": cliente.email_contacto,
            "telefono_contacto": cliente.telefono_contacto,
            "direccion_empresa": cliente.direccion_empresa,
            "ciudad": cliente.ciudad,
            "pais": cliente.pais,
            "nom_contacto_principal": cliente.nom_contacto_principal,
            "email_contacto_principal": cliente.email_contacto_principal,
            "telefono_contacto_principal": cliente.telefono_contacto_principal,
            "estado_cliente": cliente.estado_cliente,
            "fecha_ultimo_acceso": None,
            "notas_internas": cliente.notas_internas,
            "password_cliente": cliente.password_cliente,
            "ind_activo": cliente.ind_activo,
            "usr_update": usr_update
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar cliente: {str(e)}")


def delete_cliente(db: Session, identificacion_fiscal: str) -> dict:
    """
    Elimina un cliente (soft delete) llamando a la función SQL.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        identificacion_fiscal (str): Identificación fiscal del cliente a eliminar.

    Returns:
        dict: Resultado de la operación (JSON de la función SQL).
    """
    try:
        query = text("""SELECT fun_delete_cliente(:identificacion_fiscal)""")
        result = db.execute(query, {"identificacion_fiscal": identificacion_fiscal})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else {"message": "Cliente eliminado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar cliente: {str(e)}")


def update_password(db: Session, identificacion_fiscal: str, hashed_password: str, usr_update: str) -> dict:
    """
    Actualiza solo la contraseña de un cliente.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        identificacion_fiscal (str): Identificación fiscal del cliente.
        hashed_password (str): Contraseña hasheada.
        usr_update (str): Email del usuario que actualiza.

    Returns:
        dict: Resultado de la operación.
    """
    try:
        query = text("""
            SELECT fun_update_password_cliente(:identificacion_fiscal, :password, :usr_update)
        """)
        result = db.execute(query, {
            "identificacion_fiscal": identificacion_fiscal, 
            "password": hashed_password,
            "usr_update": usr_update
        })
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar contraseña: {str(e)}")


def update_ultimo_acceso(db: Session, identificacion_fiscal: str) -> None:
    """
    Actualiza la fecha de último acceso del cliente.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        identificacion_fiscal (str): Identificación fiscal del cliente.
    """
    try:
        query = text("""
            UPDATE tab_clientes
            SET fecha_ultimo_acceso = CURRENT_TIMESTAMP
            WHERE identificacion_fiscal = :identificacion_fiscal
        """)
        db.execute(query, {"identificacion_fiscal": identificacion_fiscal})
        db.commit()
    except Exception as e:
        db.rollback()
        # No lanzar excepción para no bloquear el login
        pass


def get_suscripcion_activa(db: Session, identificacion_fiscal: str) -> Optional[dict]:
    """
    Obtiene la suscripción activa del cliente.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        identificacion_fiscal (str): Identificación fiscal del cliente.

    Returns:
        dict or None: Un diccionario con la suscripción activa o None.
    """
    try:
        query = text("""
        SELECT 
            s.id_suscripcion,
            s.id_plan,
            s.id_instancia,
            s.tipo_facturacion,
            s.precio_actual,
            s.fecha_inicio,
            s.fecha_fin,
            s.fecha_proximo_pago,
            s.estado_suscripcion,
            p.nom_plan,
            p.max_productos,
            p.max_usuarios,
            p.max_almacenamiento_gb,
            p.features_json
        FROM tab_suscripciones s
        JOIN tab_planes p ON s.id_plan = p.id_plan
        WHERE s.identificacion_fiscal_cliente = :identificacion_fiscal
        AND s.estado_suscripcion = 'activa'
        ORDER BY s.fecha_inicio DESC
        LIMIT 1
        """)
        result = db.execute(query, {"identificacion_fiscal": identificacion_fiscal})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener suscripción activa: {str(e)}")


def get_plan_activo(db: Session, identificacion_fiscal: str) -> Optional[dict]:
    """
    Obtiene el plan activo del cliente.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        identificacion_fiscal (str): Identificación fiscal del cliente.

    Returns:
        dict or None: Un diccionario con el plan activo o None.
    """
    try:
        query = text("""
        SELECT 
            p.id_plan,
            p.nom_plan,
            p.desc_plan,
            p.precio_mensual,
            p.precio_anual,
            p.moneda,
            p.max_productos,
            p.max_usuarios,
            p.max_almacenamiento_gb,
            p.features_json
        FROM tab_suscripciones s
        JOIN tab_planes p ON s.id_plan = p.id_plan
        WHERE s.identificacion_fiscal_cliente = :identificacion_fiscal
        AND s.estado_suscripcion = 'activa'
        ORDER BY s.fecha_inicio DESC
        LIMIT 1
        """)
        result = db.execute(query, {"identificacion_fiscal": identificacion_fiscal})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener plan activo: {str(e)}")


def check_plan_limits(db: Session, identificacion_fiscal: str, tipo_recurso: str, cantidad_actual: int) -> dict:
    """
    Verifica si el cliente ha excedido los límites de su plan.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        identificacion_fiscal (str): Identificación fiscal del cliente.
        tipo_recurso (str): Tipo de recurso a verificar ('productos', 'usuarios', 'almacenamiento').
        cantidad_actual (int): Cantidad actual del recurso.

    Returns:
        dict: Resultado con 'allowed' (bool), 'limit' (int or None), 'current' (int), 'message' (str).
    """
    try:
        plan = get_plan_activo(db, identificacion_fiscal)
        
        if not plan:
            return {
                "allowed": False,
                "limit": 0,
                "current": cantidad_actual,
                "message": "No tiene una suscripción activa"
            }
        
        limit_map = {
            "productos": plan.get("max_productos"),
            "usuarios": plan.get("max_usuarios"),
            "almacenamiento": plan.get("max_almacenamiento_gb")
        }
        
        limite = limit_map.get(tipo_recurso)
        
        # NULL significa ilimitado
        if limite is None:
            return {
                "allowed": True,
                "limit": None,
                "current": cantidad_actual,
                "message": "Recurso ilimitado en su plan"
            }
        
        if cantidad_actual >= limite:
            return {
                "allowed": False,
                "limit": limite,
                "current": cantidad_actual,
                "message": f"Ha alcanzado el límite de {tipo_recurso} de su plan ({limite})"
            }
        
        return {
            "allowed": True,
            "limit": limite,
            "current": cantidad_actual,
            "message": f"Dentro del límite de {tipo_recurso}"
        }
    except Exception as e:
        raise Exception(f"Error al verificar límites del plan: {str(e)}")
