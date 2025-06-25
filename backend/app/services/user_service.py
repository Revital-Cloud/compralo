"""
Módulo de Servicios de Usuario.

Este módulo contiene la lógica de negocio para gestionar los usuarios.
Se encarga de interactuar con la base de datos para realizar operaciones
CRUD (Crear, Leer, Actualizar, Eliminar) sobre los usuarios, utilizando
funciones de base de datos (procedimientos almacenados o funciones SQL).

Las funciones aquí definidas son llamadas por los routers de la API
y utilizan los esquemas Pydantic para la validación y transformación de datos.
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
    """
    try:
        query = text("""
        SELECT
            id_usuario,
            nom_usuario,
            ape_usuario,
            email_usuario,
            password_usuario,
            des_direccion,
            id_rol,
            ind_genero,
            cel_usuario,
            fec_nacimiento,
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
    """
    try:
        query = text("""SELECT id_usuario,
            nom_usuario,
            ape_usuario,
            email_usuario,
            password_usuario,
            des_direccion,
            id_rol,
            ind_genero,
            cel_usuario,
            fec_nacimiento,
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

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        user (UserCreate): Un objeto Pydantic `UserCreate` con los datos del usuario.

    Returns:
        dict or None: Un diccionario que representa el usuario creado (generalmente el JSON
        devuelto por la función SQL) o None si la creación falla o la función
        SQL no devuelve el resultado esperado.
    """
    try:
        params = user.model_dump()
        
        query = text("""
            SELECT fun_insert_usuarios(
            :id_usuario,
            :nom_usuario,
            :ape_usuario,
            :email_usuario,
            :password_usuario,
            :des_direccion,
            :id_rol,
            :ind_genero,
            :cel_usuario,
            :fec_nacimiento)
            """)
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear el usuario: {str(e)}")
    
def update_user(db: Session, id_usuario: Decimal, user: UserUpdate):
    """
    Actualiza un usuario existente en la base de datos llamando a una función SQL.

    Utiliza la función de base de datos `fun_update_usuarios` para actualizar
    un usuario existente, identificado por `id_usuario`. Los datos para la
    actualización se toman del esquema `UserUpdate` (solo campos proporcionados).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): El ID del usuario a actualizar.
        user (UserUpdate): Un objeto Pydantic `UserUpdate` con los datos a actualizar.

    Returns:
        dict or None: Un diccionario que representa el usuario actualizado (generalmente el JSON
                      devuelto por la función SQL) o None si la actualización falla o la función
                      SQL no devuelve el resultado esperado.
    """
    
    try:
        update_params = user.model_dump(exclude_unset=True)
        update_params["id_usuario"] = id_usuario
        
        query = text("""SELECT fun_update_usuarios(
            :id_usuario, :nom_usuario, :ape_usuario, :email_usuario, :password_usuario,
            :des_direccion, :id_rol, :ind_genero, :cel_usuario, :fec_nacimiento
            )""")
        
        result = db.execute(query, update_params)
        fetched_result = result.fetchone()
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
    Obtiene un usuario por su email.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        email (str): Email del usuario a buscar.

    Returns:
        dict or None: Un diccionario que representa el usuario o None si no se encuentra.
    """
    try:
        query = text("""
        SELECT 
            id_usuario,
            nom_usuario,
            ape_usuario,
            email_usuario,
            password_usuario,
            des_direccion,
            id_rol,
            ind_genero,
            cel_usuario,
            fec_nacimiento,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_usuarios 
        WHERE email_usuario = :email
        """)
        result = db.execute(query, {"email": email})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener usuario por email: {str(e)}")

def update_password(db: Session, id_usuario: Decimal, hashed_password: str):
    """
    Actualiza solo la contraseña de un usuario.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario.
        hashed_password (str): Contraseña hasheada.

    Returns:
        bool: True si la actualización fue exitosa.
    """
    try:
        query = text("""
        UPDATE tab_usuarios 
        SET password_usuario = :password, 
            fec_update = CURRENT_TIMESTAMP 
        WHERE id_usuario = :id_usuario
        """)
        db.execute(query, {"password": hashed_password, "id_usuario": id_usuario})
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar contraseña: {str(e)}")

# Alias para compatibilidad con diferentes nomenclaturas
def get_user_by_id(db: Session, id_usuario: Decimal):
    """
    Alias para get_user para mantener compatibilidad.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Decimal): ID del usuario.
        
    Returns:
        dict or None: Un diccionario que representa el usuario o None si no se encuentra.
    """
    return get_user(db, id_usuario)
        