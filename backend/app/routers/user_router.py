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
from core.jwt_utils import get_password_hash, create_verification_token
from services.email_service import send_welcome_email, send_verification_email

router = APIRouter(tags=["Usuarios"])

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
    user: UserCreate = Body(...)
):
    """
    Crea un nuevo usuario en la base de datos.
    La contraseña se hashea automáticamente antes de guardarla.

    Args:
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        user_data (UserCreate): Datos del usuario a crear.
    """
    try:
        # Verificar si el email ya existe
        existing_user = user_service.get_user_by_email(db, user.email_usuario)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="El email ya está registrado"
            )
        
        # Validar que el id_rol sea válido (1 = admin, 2 = user)
        if user.id_rol not in [1, 2]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="id_rol debe ser 1 (Administrador) o 2 (Usuario)"
            )
        
        # Hashear la contraseña antes de crear el usuario
        hashed_password = get_password_hash(user.password_usuario)
        
        user_data = UserCreate(
            id_usuario=user.id_usuario,
            nom_usuario=user.nom_usuario,
            ape_usuario=user.ape_usuario,
            email_usuario=user.email_usuario,
            password_usuario=hashed_password,  # Usar la contraseña hasheada
            des_direccion=user.des_direccion,
            id_rol=user.id_rol,
            ind_genero=user.ind_genero,
            cel_usuario=user.cel_usuario,
            fec_nacimiento=user.fec_nacimiento
        )
        
        # Crear el usuario
        result = user_service.create_users(db, user_data)
        
        # Verificar si la función SQL retornó un error
        if result and isinstance(result, str) and "Error:" in result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result
            )
        
        # Envío automático de emails tras registro exitoso
        try:
            # 1. Email de bienvenida
            welcome_sent = await send_welcome_email(
                user_email=user.email_usuario,
                user_name=user.nom_usuario
            )
            
            # 2. Email de verificación con token
            verification_token = create_verification_token(
                user_id=int(user.id_usuario),
                email=user.email_usuario,
                expires_hours=24
            )
            
            verification_sent = await send_verification_email(
                user_email=user.email_usuario,
                user_name=user.nom_usuario,
                verification_token=verification_token
            )
            
            # Log del estado de envío
            if welcome_sent:
                print(f"✅ Email de bienvenida enviado a {user.email_usuario}")
            else:
                print(f"❌ Error enviando email de bienvenida a {user.email_usuario}")
                
            if verification_sent:
                print(f"✅ Email de verificación enviado a {user.email_usuario}")
            else:
                print(f"❌ Error enviando email de verificación a {user.email_usuario}")
                
        except Exception as email_error:
            # Los emails fallan pero no impiden el registro
            print(f"⚠️ Error enviando emails al usuario {user.email_usuario}: {str(email_error)}")
        
        return ResponseMessage(message="Usuario creado exitosamente. Revisa tu email para verificar tu cuenta.")
            
    except HTTPException:
        raise  # Re-lanzar HTTPExceptions específicas
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/users/{id_usuario}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_user(
    id_usuario: Decimal,
    user: UserUpdate = Body(...),
    db: Session = Depends(get_db)
):     
    """
    Actualiza un usuario existente en la base de datos.

    Args:
        id_usuario (Decimal): ID del usuario a actualizar.
        user (UserUpdate): Datos del usuario a actualizar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
    """
    try:
        # Hashear la contraseña si se proporciona
        hashed_password = get_password_hash(user.password_usuario) if user.password_usuario else None
        
        user_data = UserUpdate(
            nom_usuario=user.nom_usuario,
            ape_usuario=user.ape_usuario,
            email_usuario=user.email_usuario,
            password_usuario=hashed_password,  # Usar la contraseña hasheada
            des_direccion=user.des_direccion,
            id_rol=user.id_rol,
            ind_genero=user.ind_genero,
            cel_usuario=user.cel_usuario,
            fec_nacimiento=user.fec_nacimiento
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