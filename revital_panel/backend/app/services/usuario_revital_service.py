"""
Módulo de Servicios de Usuarios Revital (Admins).

Este módulo contiene la lógica de negocio para gestionar los usuarios
administradores de la plataforma Revital (admins, soporte, ventas).
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from schemas.usuario_revital_schema import UsuarioRevitalCreate, UsuarioRevitalUpdate


def get_usuarios(db: Session) -> List[dict]:
    """
    Obtiene todos los usuarios administradores de Revital.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list: Una lista de diccionarios con los usuarios admin.
    """
    try:
        query = text("""
        SELECT
            id_usuario,
            nom_usuario,
            ape_usuario,
            email_usuario,
            rol_revital,
            ind_activo,
            fecha_ultimo_acceso,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_usuarios_revital
        ORDER BY fec_insert DESC
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener usuarios: {str(e)}")


def get_usuario(db: Session, id_usuario: Decimal) -> Optional[dict]:
    """
    Obtiene un usuario admin específico de la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario a buscar.

    Returns:
        dict or None: Un diccionario con el usuario o None si no se encuentra.
    """
    try:
        query = text("""
        SELECT
            id_usuario,
            nom_usuario,
            ape_usuario,
            email_usuario,
            password_usuario,
            rol_revital,
            ind_activo,
            fecha_ultimo_acceso,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_usuarios_revital
        WHERE id_usuario = :id_usuario
        """)
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el usuario: {str(e)}")


def get_usuario_by_email(db: Session, email: str) -> Optional[dict]:
    """
    Obtiene un usuario admin por su email (para autenticación).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        email (str): Email del usuario a buscar.

    Returns:
        dict or None: Un diccionario con el usuario o None si no se encuentra.
    """
    try:
        query = text("""
        SELECT 
            id_usuario,
            nom_usuario,
            ape_usuario,
            email_usuario,
            password_usuario,
            rol_revital,
            ind_activo,
            fecha_ultimo_acceso
        FROM tab_usuarios_revital 
        WHERE email_usuario = :email
        """)
        result = db.execute(query, {"email": email})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener usuario por email: {str(e)}")


def create_usuario(db: Session, usuario: UsuarioRevitalCreate, usr_insert: str) -> dict:
    """
    Crea un nuevo usuario admin llamando a la función SQL.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        usuario (UsuarioRevitalCreate): Datos del usuario a crear.
        usr_insert (str): Email del usuario que crea el registro.

    Returns:
        dict: Resultado de la operación (JSON de la función SQL).
    """
    try:
        query = text("""
            SELECT fun_insert_usuario_revital(
                :nom_usuario,
                :ape_usuario,
                :email_usuario,
                :password_usuario,
                :rol_revital::enum_rol_revital,
                :ind_activo,
                :usr_insert
            )
        """)
        
        params = {
            "nom_usuario": usuario.nom_usuario,
            "ape_usuario": usuario.ape_usuario,
            "email_usuario": usuario.email_usuario,
            "password_usuario": usuario.password_usuario,
            "rol_revital": usuario.rol_revital,
            "ind_activo": usuario.ind_activo if usuario.ind_activo is not None else True,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear usuario: {str(e)}")


def update_usuario(db: Session, id_usuario: Decimal, usuario: UsuarioRevitalUpdate, usr_update: str) -> dict:
    """
    Actualiza un usuario admin existente llamando a la función SQL.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario a actualizar.
        usuario (UsuarioRevitalUpdate): Datos del usuario a actualizar.
        usr_update (str): Email del usuario que actualiza el registro.

    Returns:
        dict: Resultado de la operación (JSON de la función SQL).
    """
    try:
        query = text("""
            SELECT fun_update_usuario_revital(
                :id_usuario,
                :nom_usuario,
                :ape_usuario,
                :email_usuario,
                :password_usuario,
                :rol_revital::enum_rol_revital,
                :ind_activo,
                :usr_update
            )
        """)
        
        params = {
            "id_usuario": id_usuario,
            "nom_usuario": usuario.nom_usuario,
            "ape_usuario": usuario.ape_usuario,
            "email_usuario": usuario.email_usuario,
            "password_usuario": usuario.password_usuario,
            "rol_revital": usuario.rol_revital,
            "ind_activo": usuario.ind_activo,
            "usr_update": usr_update
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar usuario: {str(e)}")


def delete_usuario(db: Session, id_usuario: Decimal) -> dict:
    """
    Elimina un usuario admin (soft delete) llamando a la función SQL.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario a eliminar.

    Returns:
        dict: Resultado de la operación (JSON de la función SQL).
    """
    try:
        query = text("""SELECT fun_delete_usuario_revital(:id_usuario)""")
        result = db.execute(query, {"id_usuario": id_usuario})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else {"message": "Usuario eliminado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar usuario: {str(e)}")


def update_password(db: Session, id_usuario: Decimal, hashed_password: str, usr_update: str) -> dict:
    """
    Actualiza solo la contraseña de un usuario admin.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario.
        hashed_password (str): Contraseña hasheada.
        usr_update (str): Email del usuario que actualiza.

    Returns:
        dict: Resultado de la operación.
    """
    try:
        query = text("""
            SELECT fun_update_password_usuario_revital(:id_usuario, :password, :usr_update)
        """)
        result = db.execute(query, {
            "id_usuario": id_usuario, 
            "password": hashed_password,
            "usr_update": usr_update
        })
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar contraseña: {str(e)}")


def update_ultimo_acceso(db: Session, id_usuario: Decimal) -> None:
    """
    Actualiza la fecha de último acceso del usuario.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario.
    """
    try:
        query = text("""
            UPDATE tab_usuarios_revital
            SET fecha_ultimo_acceso = CURRENT_TIMESTAMP
            WHERE id_usuario = :id_usuario
        """)
        db.execute(query, {"id_usuario": id_usuario})
        db.commit()
    except Exception as e:
        db.rollback()
        # No lanzar excepción para no bloquear el login
        pass
