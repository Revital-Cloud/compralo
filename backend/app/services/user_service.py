from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.users_schema import UserCreate, UserUpdate

def get_users(db: Session):
    
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
        