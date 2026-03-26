"""
Módulo de Servicios de Usuario.

Este módulo contiene la lógica de negocio para gestionar los usuarios.
Se encarga de interactuar con la base de datos para realizar operaciones
CRUD (Crear, Leer, Actualizar, Eliminar) sobre los usuarios, utilizando
funciones de base de datos (procedimientos almacenados o funciones SQL).

Las funciones aquí definidas son llamadas por los routers de la API
y utilizan los esquemas Pydantic para la validación y transformación de datos.

Responsabilidades:
- CRUD de usuarios,
- búsqueda por email/id para autenticación y perfil,
- actualización de contraseña/estado,
- soft-delete y reactivación de cuentas.
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.user_schema import UserCreate, UserUpdate

def get_users(db: Session):
    """
    Obtiene todos los usuarios registrados en la base de datos.

    Ejecuta una consulta SQL para seleccionar todos los usuarios y devuelve
    los resultados como una lista de diccionarios (RowMappings).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list: Una lista de diccionarios, donde cada diccionario representa un usuario.
              FastAPI utilizará el `response_model` del endpoint para convertir esto
              en una lista de objetos `User`.

    Se consume desde:
    - `user_router.get_users`
    """
    try:
        query = text("""
        SELECT
            id_usuario,
            nom_usuario,
            ape_usuario,
            email_usuario,
            password_usuario,
            id_rol,
            ind_genero,
            cel_usuario,
            fec_nacimiento,
            ind_activo,
            avatar_seed,
            avatar_colors,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_usuarios
        """)
        result = db.execute(query)
        
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener usuarios: {str(e)}")

def get_user(db: Session, id_usuario: Decimal):
    """
    Obtiene un usuario específico de la base de datos.

    Ejecuta una consulta SQL para seleccionar un usuario por su ID y devuelve
    el resultado como un diccionario (RowMapping).

    Uso:
    - perfil actual,
    - validaciones de autorización,
    - soporte de autenticación.
    """
    try:
        query = text("""SELECT id_usuario,
            nom_usuario,
            ape_usuario,
            email_usuario,
            password_usuario,
            id_rol,
            ind_genero,
            cel_usuario,
            fec_nacimiento,
            ind_activo,
            avatar_seed,
            avatar_colors,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
            FROM tab_usuarios WHERE id_usuario = :id_usuario""")
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el usuario: {str(e)}")
    
def create_users(db: Session, user: UserCreate):
    """
    Crea un nuevo usuario en la base de datos llamando a una función SQL.

    Utiliza la función de base de datos `fun_insert_usuarios` para insertar
    un nuevo usuario. Los datos del usuario se toman del esquema `UserCreate`.
    El `id_rol` se asigna con un valor por defecto en la base de datos.
    El campo `usr_insert` se establece automáticamente con el `id_usuario` del nuevo usuario.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        user (UserCreate): Un objeto Pydantic `UserCreate` con los datos del usuario.

    Returns:
        dict or None: Un diccionario que representa el usuario creado (generalmente el JSON
        devuelto por la función SQL) o None si la creación falla o la función
        SQL no devuelve el resultado esperado.

    Implementación:
    - delega en `fun_insert_usuarios`.
    """
    try:
        params = user.model_dump()
        params["usr_insert"] = Decimal(user.id_usuario)
        # Fecha de nacimiento es opcional: enviar NULL si viene vacía o vacía string
        if not params.get("fec_nacimiento"):
            params["fec_nacimiento"] = None

        # El id_rol ya no se pasa como parámetro, se asume que la función
        # de base de datos le asigna un valor por defecto.
        query = text("""
            SELECT fun_insert_usuarios(
            :id_usuario,
            :nom_usuario,
            :ape_usuario,
            :email_usuario,
            :password_usuario,
            :ind_genero,
            :cel_usuario,
            :fec_nacimiento,
            :usr_insert)
            """)
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        # Re-lanzar el error original para que el router pueda manejarlo específicamente
        raise Exception(error_msg)
    
def update_user(db: Session, id_usuario: Decimal, user: UserUpdate, current_user_id: Decimal):
    """
    Actualiza un usuario existente en la base de datos llamando a una función SQL.

    Utiliza la función de base de datos `fun_update_usuarios` para actualizar
    un usuario existente, identificado por `id_usuario`. Los datos para la
    actualización se toman del esquema `UserUpdate` (solo campos proporcionados).
    El campo `usr_update` se establece con el ID del usuario que realiza la operación.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario a actualizar.
        user (UserUpdate): Un objeto Pydantic `UserUpdate` con los datos a actualizar.
        current_user_id (Decimal): El ID del usuario que realiza la actualización.

    Returns:
        dict or None: Un diccionario que representa el usuario actualizado (generalmente el JSON
                      devuelto por la función SQL) o None si la actualización falla o la función
                      SQL no devuelve el resultado esperado.

    Implementación:
    - delega en `fun_update_usuarios`,
    - complementa actualización de `avatar_seed/avatar_colors` por SQL directo.
    """
    
    try:
        # Obtener el usuario actual para usar sus valores en campos no actualizados
        existing_user = get_user(db, id_usuario)
        if not existing_user:
            raise Exception("Usuario no encontrado")
        
        # Preparar parámetros de actualización, usando valores existentes si no se proporcionan
        update_params = {
            "id_usuario": id_usuario,
            "nom_usuario": user.nom_usuario if user.nom_usuario is not None else existing_user['nom_usuario'],
            "ape_usuario": user.ape_usuario if user.ape_usuario is not None else existing_user['ape_usuario'],
            "email_usuario": user.email_usuario if user.email_usuario is not None else existing_user['email_usuario'],
            "password_usuario": user.password_usuario if user.password_usuario is not None else existing_user['password_usuario'],
            "ind_genero": user.ind_genero if user.ind_genero is not None else existing_user['ind_genero'],
            "cel_usuario": user.cel_usuario if user.cel_usuario is not None else existing_user['cel_usuario'],
            "fec_nacimiento": user.fec_nacimiento if user.fec_nacimiento is not None else existing_user['fec_nacimiento'],
            "usr_update": str(current_user_id)
        }
        
        # Fecha de nacimiento opcional: cadena vacía → NULL
        if update_params["fec_nacimiento"] == "":
            update_params["fec_nacimiento"] = None
        # Convertir fec_nacimiento a formato adecuado si es necesario
        if update_params["fec_nacimiento"] and isinstance(update_params["fec_nacimiento"], str):
            # Ya está en formato string, mantenerlo
            pass
        elif update_params["fec_nacimiento"]:
            # Si es datetime, convertir a string
            from datetime import datetime
            if isinstance(update_params["fec_nacimiento"], datetime):
                update_params["fec_nacimiento"] = update_params["fec_nacimiento"].strftime('%Y-%m-%d')
        
        query = text("""SELECT fun_update_usuarios(
            :id_usuario, :nom_usuario, :ape_usuario, :email_usuario, :password_usuario,
            :ind_genero, :cel_usuario, :fec_nacimiento, :usr_update
            )""")
        
        result = db.execute(query, update_params)
        fetched_result = result.fetchone()
        # Actualizar avatar_seed y avatar_colors si vienen en el payload (no están en fun_update_usuarios)
        if user.avatar_seed is not None or user.avatar_colors is not None:
            updates = []
            params = {"id_usuario": id_usuario}
            if user.avatar_seed is not None:
                updates.append("avatar_seed = :avatar_seed")
                params["avatar_seed"] = user.avatar_seed
            if user.avatar_colors is not None:
                updates.append("avatar_colors = :avatar_colors")
                params["avatar_colors"] = user.avatar_colors
            if updates:
                db.execute(
                    text(f"UPDATE tab_usuarios SET {', '.join(updates)} WHERE id_usuario = :id_usuario"),
                    params,
                )
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar el usuario: {e}")
    
def delete_user(db: Session, id_usuario:Decimal):
    """
    Elimina un usuario de la base de datos llamando a una función SQL.

    Utiliza la función de base de datos `fun_delete_usuarios` para eliminar
    un usuario, identificado por `id_usuario`.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario a eliminar.

    Returns:
        dict: Un diccionario con un mensaje indicando el resultado de la operación.
              El mensaje puede provenir directamente de la función SQL o ser un
              mensaje genérico si la función no proporciona uno específico.

    Implementación:
    - delega en `fun_delete_usuarios`.
    """
    
    try:
        query = text("""SELECT fun_delete_usuarios(:id_usuario)""")
        result = db.execute(query, {"id_usuario": id_usuario})
        fetched_result = result.fetchone()
        db.commit()
        
        if fetched_result and isinstance(fetched_result[0], str):
            return {"message": fetched_result[0]}
        else:
            return {"message": "Usuario eliminado correctamente"}
    except Exception as e:
        db.rollback()
        return {"message": f"Error al eliminar el usuario: {str(e)}"}

def get_user_by_email(db: Session, email: str):
    """
    Obtiene un usuario por su email con los campos mínimos necesarios para autenticación.
    Incluye deleted_at para detectar cuentas soft-deleted en registro/reactivación.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        email (str): Email del usuario a buscar.

    Returns:
        dict or None: Un diccionario que representa el usuario o None si no se encuentra.

    Uso principal:
    - autenticación, registro y flujos de reactivación.
    """
    try:
        query = text("""
        SELECT 
            id_usuario,
            nom_usuario,
            ape_usuario,
            email_usuario,
            password_usuario,
            id_rol,
            ind_activo,
            deleted_at
        FROM tab_usuarios 
        WHERE email_usuario = :email
        """)
        result = db.execute(query, {"email": email})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener usuario por email: {str(e)}")

def get_user_by_email_auth_only(db: Session, email: str):
    """
    Obtiene solo email y password para autenticación rápida.
    Optimizada para validación de credenciales únicamente.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        email (str): Email del usuario a buscar.

    Returns:
        dict or None: Diccionario con email y password o None si no se encuentra.
    """
    try:
        query = text("""
        SELECT 
            email_usuario,
            password_usuario
        FROM tab_usuarios 
        WHERE email_usuario = :email
        """)
        result = db.execute(query, {"email": email})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener credenciales: {str(e)}")

def update_password(db: Session, id_usuario: Decimal, hashed_password: str, usr_operacion: Decimal = None):
    """
    Actualiza solo la contraseña de un usuario.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario.
        hashed_password (str): Contraseña hasheada.
        usr_operacion (Decimal, optional): ID del usuario que realiza la operación. 
                                         Si no se proporciona, se usa el mismo id_usuario.

    Returns:
        bool: True si la actualización fue exitosa.

    Implementación:
    - delega en `fun_update_password_usuario`.
    """
    try:
        # Si no se proporciona usr_operacion, usar el mismo id_usuario
        if usr_operacion is None:
            usr_operacion = id_usuario
        
        query = text("""
        SELECT fun_update_password_usuario(:id_usuario, CAST(:password AS VARCHAR), :usr_operacion)
        """)
        result = db.execute(query, {
            "password": hashed_password, 
            "id_usuario": int(id_usuario),
            "usr_operacion": int(usr_operacion)
        })
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar contraseña: {str(e)}")

# Alias para compatibilidad con diferentes nomenclaturas
def update_user_status(db: Session, id_usuario: Decimal, ind_activo: bool):
    """
    Actualiza solo el estado activo/inactivo de un usuario.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario a actualizar.
        ind_activo (bool): Nuevo valor de ind_activo.

    Returns:
        dict or None: El usuario actualizado o None si no existe.

    Nota:
    - actualiza estado por SQL directo (sin función almacenada intermedia).
    """
    try:
        existing = get_user(db, id_usuario)
        if not existing:
            raise Exception("Usuario no encontrado")
        query = text("""
            UPDATE tab_usuarios
            SET ind_activo = :ind_activo
            WHERE id_usuario = :id_usuario
        """)
        db.execute(query, {"id_usuario": id_usuario, "ind_activo": ind_activo})
        db.commit()
        return get_user(db, id_usuario)
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar estado del usuario: {e}")


def get_user_by_id(db: Session, id_usuario: Decimal):
    """
    Obtiene un usuario específico de la base de datos por su ID.
    """
    try:
        query = text("""
            SELECT 
                id_usuario, nom_usuario, ape_usuario, email_usuario, 
                password_usuario, id_rol, ind_genero, cel_usuario, 
                fec_nacimiento, ind_activo, deleted_at,
                usr_insert, fec_insert, usr_update, fec_update
            FROM tab_usuarios 
            WHERE id_usuario = :id_usuario
        """)
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el usuario por ID: {str(e)}")


def soft_delete_user(db: Session, id_usuario: Decimal, current_user_id: Decimal):
    """
    Desactiva la cuenta del usuario (soft delete) usando la función de BD
    fun_soft_delete_usuario. No borra datos relacionados (órdenes, puntos, etc.),
    solo marca la cuenta como eliminada.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario a desactivar.
        current_user_id (Decimal): ID del usuario que realiza la operación (usr_update).

    Returns:
        str: Mensaje devuelto por la función de base de datos.

    Implementación:
    - delega en `fun_soft_delete_usuario`.
    """
    try:
        existing = get_user(db, id_usuario)
        if not existing:
            raise Exception("Usuario no encontrado")

        query = text("SELECT fun_soft_delete_usuario(:id_usuario, :usr_update)")
        result = db.execute(
            query,
            {
                "id_usuario": int(id_usuario),
                "usr_update": int(current_user_id),
            },
        )
        message = result.scalar_one_or_none()
        db.commit()
        return message
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al desactivar la cuenta: {e}")


def reactivate_user(db: Session, id_usuario: Decimal):
    """
    Reactiva una cuenta soft-deleted usando la función de BD fun_reactivate_usuario.
    Mantiene todos los datos del usuario (historial, órdenes, puntos, etc.).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario a reactivar.

    Returns:
        str: Mensaje devuelto por la función de base de datos.

    Implementación:
    - delega en `fun_reactivate_usuario`.
    """
    try:
        existing = get_user(db, id_usuario)
        if not existing:
            raise Exception("Usuario no encontrado")

        # p_usr_update es opcional en la función; aquí no lo enviamos para que mantenga usr_update actual.
        query = text("SELECT fun_reactivate_usuario(:id_usuario)")
        result = db.execute(
            query,
            {
                "id_usuario": int(id_usuario),
            },
        )
        message = result.scalar_one_or_none()
        db.commit()
        return message
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al reactivar la cuenta: {e}")


def reactivate_user_by_email(db: Session, email: str):
    """
    Reactiva un usuario por email (para flujo de registro con cuenta eliminada).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        email (str): Email del usuario a reactivar.

    Returns:
        dict or None: El usuario reactivado o None si no se encuentra.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    reactivate_user(db, Decimal(str(user["id_usuario"])))
    return get_user(db, Decimal(str(user["id_usuario"])))
        