"""
Módulo de enrutador para la gestión de usuarios.

Define las rutas y endpoints relacionados con la gestión de usuarios,
incluyendo la creación, actualización y visualización de usuarios.
"""
from fastapi import APIRouter, Depends,HTTPException, status,Body, BackgroundTasks
from sqlalchemy.orm import Session
from decimal import Decimal
from core.database import get_db
from core.dependencies import get_current_user
from schemas.user_schema import User, UserCreate, UserUpdate, ResponseMessage
from schemas.auth_schema import UserInToken
from services import user_service
from core.jwt_utils import get_password_hash, create_verification_token
from services.email_service import send_welcome_email, send_verification_email

router = APIRouter(tags=["Usuarios"])

async def send_user_registration_emails(user_email: str, user_name: str, user_id: int):
    """
    Función para enviar emails de registro en background.
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
        user_id (int): ID del usuario
    """
    try:
        # 1. Email de bienvenida
        welcome_sent = await send_welcome_email(
            user_email=user_email,
            user_name=user_name
        )
        
        # 2. Email de verificación con token
        verification_token = create_verification_token(
            user_id=user_id,
            email=user_email,
            expires_hours=24
        )
        
        verification_sent = await send_verification_email(
            user_email=user_email,
            user_name=user_name,
            verification_token=verification_token
        )
        
        # Log del estado de envío
        if welcome_sent:
            print(f"✅ Email de bienvenida enviado a {user_email}")
        else:
            print(f"❌ Error enviando email de bienvenida a {user_email}")
            
        if verification_sent:
            print(f"✅ Email de verificación enviado a {user_email}")
        else:
            print(f"❌ Error enviando email de verificación a {user_email}")
            
    except Exception as email_error:
        print(f"⚠️ Error enviando emails al usuario {user_email}: {str(email_error)}")

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
    background_tasks: BackgroundTasks,
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
        
        # El FOREIGN KEY constraint en tab_usuarios se encarga de validar que el rol existe
        
        # Hashear la contraseña antes de crear el usuario
        hashed_password = get_password_hash(user.password_usuario)
        
        user_data = UserCreate(
            id_usuario=user.id_usuario,
            nom_usuario=user.nom_usuario,
            ape_usuario=user.ape_usuario,
            email_usuario=user.email_usuario,
            password_usuario=hashed_password,  # Usar la contraseña hasheada
            des_direccion=user.des_direccion,
            ind_genero=user.ind_genero,
            cel_usuario=user.cel_usuario,
            fec_nacimiento=user.fec_nacimiento,
            ind_activo=user.ind_activo
        )
        
        # Crear el usuario
        result = user_service.create_users(db, user_data)
        
        # Verificar si la función SQL retornó un error
        if result and isinstance(result, str) and "Error:" in result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result
            )
        
        # Envío automático de emails en background (no bloquea la respuesta)
        background_tasks.add_task(
            send_user_registration_emails,
            user_email=user.email_usuario,
            user_name=user.nom_usuario,
            user_id=int(user.id_usuario)
        )
        
        return ResponseMessage(message="Usuario creado exitosamente. Revisa tu email para verificar tu cuenta.")
            
    except HTTPException:
        raise  # Re-lanzar HTTPExceptions específicas
    except Exception as e:
        error_msg = str(e)
        # Capturar errores de FOREIGN KEY constraint específicos
        if "foreign key constraint" in error_msg.lower() or "violates foreign key" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El rol especificado no existe en el sistema"
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    
@router.put("/users/{id_usuario}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_user(
    id_usuario: Decimal,
    user: UserUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):     
    """
    Actualiza un usuario existente en la base de datos.
    
    - Usuario normal: Solo puede editar su propio perfil
    - Admin (id_rol = 1): Puede editar cualquier perfil

    Args:
        id_usuario (Decimal): ID del usuario a actualizar.
        user (UserUpdate): Datos del usuario a actualizar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.
        current_user (UserInToken): Usuario autenticado actual.
    """
    try:
        # Validación de seguridad: Usuario solo puede editar su propio perfil
        # Excepción: Admin puede editar cualquier perfil
        # Convertir ambos a Decimal para comparación correcta
        current_user_id = Decimal(str(current_user.id_usuario))
        target_user_id = Decimal(str(id_usuario))
        
        if current_user.id_rol != 1 and current_user_id != target_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permisos para editar este perfil. Tu ID: {current_user_id}, Target ID: {target_user_id}"
            )
        
        # Verificar que el usuario a actualizar existe
        existing_user = user_service.get_user(db, id_usuario)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Validación adicional: Solo admin puede cambiar ind_activo
        if user.ind_activo is not None and current_user.id_rol != 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los administradores pueden activar/desactivar usuarios"
            )
            
        # Si hay contraseña nueva, hashearla
        if user.password_usuario:
            user.password_usuario = get_password_hash(user.password_usuario)
            
        # Actualizar el usuario usando el ID del usuario actual como usr_update
        result = user_service.update_user(
            db=db,
            id_usuario=id_usuario,
            user=user,
            usr_update=str(current_user.id_usuario)
        )
        
        if result and isinstance(result, str) and "Error:" in result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result
            )
            
        return ResponseMessage(message="Usuario actualizado exitosamente")
    except HTTPException:
        raise  # Re-lanzar HTTPExceptions específicas
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