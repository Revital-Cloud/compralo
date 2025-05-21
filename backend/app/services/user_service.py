
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
        
        params = product.model_dump()
        
        query = text("""
            SELECT fun_insert_usuario(
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
        db.rollback()@
        raise Exception(f"Error al crear el usuario: {str(e)}")