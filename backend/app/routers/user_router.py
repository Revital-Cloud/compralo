"""
Módulo de enrutador para la gestión de usuarios.

Define las rutas y endpoints relacionados con la gestión de usuarios,
incluyendo la creación, actualización y visualización de usuarios.
"""
from fastapi import APIRouter, Depends, Form, HTTPException, status,Body
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional


from core.database import get_db
from schemas.user_schema import User, UserCreate, UserUpdate, ResponseMessage
from schemas.auth_schema import UserInToken
from services import user_service
from core.jwt_utils import get_password_hash

router = APIRouter()

@router.get("/users", response_model=list[User])
async def get_users(db: Session = Depends(get_db)):
    """
    Obtiene todos los usuarios registrados en la base de datos.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    """
    users = user_service.get_users(db)
    return users

@router.get("/users/{id_usuario}", response_model=User)
async def get_user(id_usuario: Decimal, db: Session = Depends(get_db)):
    
    user = user_service.get_user(db, id_usuario)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.post("/users", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_users(
    db: Session = Depends(get_db),
    id_usuario: Decimal = Form(...),
    nom_usuario: str = Form(...),
    ape_usuario: str = Form(...),
    email_usuario: str = Form(...),
    password_usuario: str = Form(...),
    des_direccion: Optional[str] = Form(None),
    id_rol: Decimal = Form(...),
    ind_genero: bool = Form(...),
    cel_usuario: str = Form(...),
    fec_nacimiento: Optional[str] = Form(None)
):
    """
    Crea un nuevo usuario en la base de datos.
    La contraseña se hashea automáticamente antes de guardarla.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        id_usuario (Decimal): Identificador único para el usuario.
        nom_usuario (str): Nombre del usuario.
        ape_usuario (str): Apellido del usuario.
        email_usuario (str): Email del usuario.
        password_usuario (str): Contraseña del usuario (se hasheará automáticamente).
        des_direccion (str): Dirección del usuario.
        id_rol (Decimal): Identificador del rol del usuario.
        ind_genero (bool): Género del usuario.
        cel_usuario (str): Número de celular del usuario.
        fec_nacimiento (str): Fecha de nacimiento del usuario.
    """
    try:
        # Verificar si el email ya existe
        existing_user = user_service.get_user_by_email(db, email_usuario)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="El email ya está registrado"
            )
        
        # Hashear la contraseña antes de crear el usuario
        hashed_password = get_password_hash(password_usuario)
        
        user_data = UserCreate(
            id_usuario=id_usuario,
            nom_usuario=nom_usuario,
            ape_usuario=ape_usuario,
            email_usuario=email_usuario,
            password_usuario=hashed_password,  # Usar la contraseña hasheada
            des_direccion=des_direccion,
            id_rol=id_rol,
            ind_genero=ind_genero,
            cel_usuario=cel_usuario,
            fec_nacimiento=fec_nacimiento
        )
        user_service.create_users(db, user_data)
        return ResponseMessage(message="Usuario creado exitosamente")
    except HTTPException:
        raise  # Re-lanzar HTTPExceptions específicas
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/users/{id_usuario}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_user(
    id_usuario: Decimal,
    nom_usuario: str = Form(...),
    ape_usuario: str = Form(...),
    email_usuario: str = Form(...),
    password_usuario: str = Form(...),
    des_direccion: Optional[str] = Form(None),
    id_rol: Decimal = Form(...),
    ind_genero: bool = Form(...),
    cel_usuario: str = Form(...),
    fec_nacimiento: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):     
    """
    Actualiza un usuario existente en la base de datos.

    Args:
        id_usuario (Decimal): ID del usuario a actualizar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        nom_usuario (str): Nombre del usuario.
        ape_usuario (str): Apellido del usuario.
        email_usuario (str): Email del usuario.
        password_usuario (str): Contraseña del usuario.
        des_direccion (str): Dirección del usuario.
        id_rol (Decimal): Identificador del rol del usuario.
        ind_genero (bool): Género del usuario.
        cel_usuario (str): Número de celular del usuario.
        fec_nacimiento (str): Fecha de nacimiento del usuario.
    """
    try:
        # Hashear la contraseña si se proporciona
        hashed_password = get_password_hash(password_usuario) if password_usuario else None
        
        user_data = UserUpdate(
            id_usuario=id_usuario,
            nom_usuario=nom_usuario,
            ape_usuario=ape_usuario,
            email_usuario=email_usuario,
            password_usuario=hashed_password,  # Usar la contraseña hasheada
            des_direccion=des_direccion,
            id_rol=id_rol,
            ind_genero=ind_genero,
            cel_usuario=cel_usuario,
            fec_nacimiento=fec_nacimiento
        )
        user_service.update_user(db, id_usuario, user_data)
        return ResponseMessage(message="Usuario actualizado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.delete("/users/{id_usuario}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_user(id_usuario: Decimal, db: Session = Depends(get_db)):
    """
    Elimina un usuario existente de la base de datos.

    Args:
        id_usuario (Decimal): ID del usuario a eliminar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
    """
    try:
        user_service.delete_user(db,id_usuario)
        return ResponseMessage(message="Usuario eliminado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))