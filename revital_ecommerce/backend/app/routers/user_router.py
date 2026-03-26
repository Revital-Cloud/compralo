"""
Módulo de enrutador para la gestión de usuarios.

Define las rutas y endpoints relacionados con la gestión de usuarios,
incluyendo la creación, actualización y visualización de usuarios.

Mapa del módulo:
- registro y actualización de perfil,
- activación/desactivación/soft-delete/reactivación,
- flujos de email asociados (bienvenida, OTP, reactivación).

Relación con capas:
- Router: reglas de autorización y rate-limit.
- Services: `user_service`, `email_service`, `discount_service`.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body, BackgroundTasks, Request
from sqlalchemy.orm import Session
from decimal import Decimal
from urllib.parse import quote
from core.database import get_db
from core.dependencies import get_current_user, get_current_user_optional
from core.exceptions import get_safe_message
from schemas.user_schema import User, UserCreate, UserUpdate, UserPublic, ResponseMessage
from schemas.auth_schema import UserInToken, ReactivateRequest
from services import user_service
from core.jwt_utils import get_password_hash
from core.otp_store import set_otp, get_otp_expires_minutes
from core.config import settings
from services.email_service import send_welcome_email, send_verification_otp_email
from services.discount_service import get_first_purchase_discount
from core.rate_limiter import limiter
from core.database import SessionLocal

router = APIRouter(tags=["Usuarios"])

async def send_user_registration_emails(user_email: str, user_name: str):
    """
    Envía email de bienvenida y email con código OTP para verificar el correo.

    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario

    Nota:
    - función auxiliar para tareas en background durante registro.
    """
    try:
        # Obtener descuento de primera compra si existe
        first_purchase_discount = None
        try:
            db = SessionLocal()
            first_purchase_discount = get_first_purchase_discount(db)
            db.close()
        except Exception as e:
            print(f"⚠️ Error obteniendo descuento de primera compra: {str(e)}")
        
        await send_welcome_email(
            user_email=user_email,
            user_name=user_name,
            first_purchase_discount=first_purchase_discount
        )
        otp_code = set_otp(user_email)
        verify_url = f"{settings.VERIFY_EMAIL_URL}?email={quote(user_email)}"
        expires_min = get_otp_expires_minutes()
        otp_sent = await send_verification_otp_email(
            user_email=user_email,
            user_name=user_name,
            otp_code=otp_code,
            verify_url=verify_url,
            expires_in_minutes=expires_min,
        )
        if not otp_sent:
            print(f"❌ Error enviando email OTP a {user_email}")
        else:
            print(f"✅ Email OTP de verificación enviado a {user_email}")
    except Exception as e:
        print(f"⚠️ Error enviando emails al usuario {user_email}: {str(e)}")

@router.post("/users/me/deactivate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def deactivate_account(
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Desactiva la cuenta del usuario autenticado (soft delete).
    Solo el propio usuario puede desactivar su cuenta.

    Endpoint -> Service:
    - Endpoint: `POST /users/me/deactivate`
    - Service: `user_service.soft_delete_user`
    """
    try:
        user_service.soft_delete_user(
            db,
            Decimal(str(current_user.id_usuario)),
            Decimal(str(current_user.id_usuario)),
        )
        return ResponseMessage(message="Cuenta desactivada correctamente.")
    except Exception as e:
        if "no encontrado" in str(e).lower():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_safe_message(e),
        )


@router.post("/users/reactivate-request", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
@limiter.limit("20/hour")
async def reactivate_request(
    request: Request,
    body: ReactivateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Inicia el flujo de reactivación para una cuenta soft-deleted.
    Envía el mismo email de reset de contraseña que forgot-password.
    La cuenta se reactivará definitivamente cuando el usuario
    complete el cambio de contraseña.

    Endpoint:
    - `POST /users/reactivate-request`
    """
    user = user_service.get_user_by_email(db, body.email)
    if not user:
        return ResponseMessage(
            message="Si el email existe en nuestro sistema con una cuenta eliminada, recibirás un correo para reactivarla.",
        )
    if user.get("ind_activo", True):
        return ResponseMessage(
            message="Si el email existe en nuestro sistema con una cuenta eliminada, recibirás un correo para reactivarla.",
        )
    if user.get("deleted_at") is None:
        return ResponseMessage(
            message="Si el email existe en nuestro sistema con una cuenta eliminada, recibirás un correo para reactivarla.",
        )
    # Disparar flujo de reset de contraseña (mismo que forgot-password)
    from core.jwt_utils import create_password_reset_token
    from services.email_service import send_password_reset_email

    reset_token = create_password_reset_token(
        user_id=user["id_usuario"],
        email=user["email_usuario"],
        expires_hours=1,
    )
    background_tasks.add_task(
        send_password_reset_email,
        user_email=user["email_usuario"],
        user_name=user["nom_usuario"],
        reset_token=reset_token,
    )
    return ResponseMessage(
        message="Te hemos enviado un correo para reactivar tu cuenta. Restablece tu contraseña para volver a usarla.",
    )


@router.get("/users", response_model=list[User])
async def get_users(db: Session = Depends(get_db)):
    """
    Obtiene todos los usuarios registrados en la base de datos.

    Endpoint -> Service:
    - Endpoint: `GET /users`
    - Service: `user_service.get_users`
    """
    users = user_service.get_users(db)
    return users


@router.post("/users", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/15minute")
@limiter.limit("20/hour")
async def create_users(
    request: Request,
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

    Endpoint -> Service:
    - Endpoint: `POST /users`
    - Service: `user_service.create_users`
    """
    try:
        # Verificar si el email ya existe
        existing_user = user_service.get_user_by_email(db, user.email_usuario)
        if existing_user:
            # Usuario activo: email ya registrado
            if existing_user.get("ind_activo", True):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El email ya está registrado"
                )
            # Usuario con cuenta eliminada (soft delete): ofrecer reactivación
            if existing_user.get("deleted_at") is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "ACCOUNT_SOFT_DELETED",
                        "message": "Este correo ya tenía una cuenta eliminada. ¿Deseas reactivarla?",
                    },
                )
            # ind_activo=False pero sin deleted_at: pendiente verificación (no debería pasar en registro)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado",
            )
        
        # Hashear la contraseña antes de crear el usuario
        hashed_password = get_password_hash(user.password_usuario)
        user.password_usuario = hashed_password
        
        # El servicio se encarga de asignar el usr_insert
        result = user_service.create_users(db, user)
        
        # Verificar si la función SQL retornó un error
        if result and isinstance(result, str) and "Error:" in result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result
            )
        
        # Usuario recién creado: requiere verificación de email (ind_activo = False)
        user_service.update_user_status(db, Decimal(user.id_usuario), False)
        
        # Envío de emails en background (bienvenida + OTP con código y enlace)
        background_tasks.add_task(
            send_user_registration_emails,
            user_email=user.email_usuario,
            user_name=user.nom_usuario,
        )
        
        return ResponseMessage(message="Usuario creado. Revisa tu correo: te enviamos un código de 6 dígitos y un enlace para verificar tu cuenta.")
            
    except HTTPException:
        raise  # Re-lanzar HTTPExceptions específicas
    except Exception as e:
        error_msg = str(e)
        # Capturar errores de duplicación de clave primaria (cédula duplicada)
        if "uniqueviolation" in error_msg.lower() or "llave duplicada" in error_msg.lower() or "duplicate key" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cédula ingresada ya está registrada en el sistema"
            )
        # Capturar errores de FOREIGN KEY constraint específicos
        elif "foreign key constraint" in error_msg.lower() or "violates foreign key" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error de clave foránea. Verifique los datos de entrada."
            )
        # Función de BD no encontrada: indicar que debe ejecutar el script SQL
        elif "function" in error_msg.lower() and "does not exist" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La función fun_insert_usuarios no existe en la base de datos. Ejecute el script: revital_ecommerce/db/Functions/tab_usuarios/fun_insert_usuarios.sql"
            )
        # Para otros errores, mensaje genérico (nunca exponer SQL ni detalles internos)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=get_safe_message(e),
            )
    
@router.put("/users/me", response_model=UserPublic, status_code=status.HTTP_200_OK)
async def update_current_user(
    user: UserUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Actualiza el perfil del usuario autenticado (avatar, nombre, etc.).
    Devuelve el usuario actualizado para que el frontend actualice la caché.

    Endpoint -> Service:
    - Endpoint: `PUT /users/me`
    - Service: `user_service.update_user`
    """
    try:
        current_user_id = Decimal(str(current_user.id_usuario))
        result = user_service.update_user(
            db=db,
            id_usuario=current_user_id,
            user=user,
            current_user_id=current_user_id,
        )
        if result and isinstance(result, str) and "Error:" in result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result)
        full_user = user_service.get_user(db, current_user_id)
        if full_user is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        fec_nacimiento_str = None
        if full_user.get("fec_nacimiento"):
            if isinstance(full_user["fec_nacimiento"], datetime):
                fec_nacimiento_str = full_user["fec_nacimiento"].strftime("%Y-%m-%d")
            else:
                fec_nacimiento_str = str(full_user["fec_nacimiento"])
        return UserPublic(
            id_usuario=full_user["id_usuario"],
            nom_usuario=full_user["nom_usuario"],
            ape_usuario=full_user["ape_usuario"],
            email_usuario=full_user["email_usuario"],
            id_rol=full_user.get("id_rol"),
            cel_usuario=full_user.get("cel_usuario"),
            fec_nacimiento=fec_nacimiento_str,
            des_direccion=None,
            avatar_seed=full_user.get("avatar_seed"),
            avatar_colors=full_user.get("avatar_colors"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))


@router.put("/users/{id_usuario}/status", response_model=User, status_code=status.HTTP_200_OK)
async def update_user_status(
    id_usuario: Decimal,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Activa o desactiva un usuario (solo administradores).

    - **active** (bool): true para activar, false para desactivar.

    Endpoint -> Service:
    - Endpoint: `PUT /users/{id_usuario}/status`
    - Service: `user_service.update_user_status`
    """
    if current_user.id_rol != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden activar o desactivar usuarios"
        )
    active = body.get("active")
    if active is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El campo 'active' (boolean) es requerido"
        )
    try:
        updated = user_service.update_user_status(db, id_usuario, bool(active))
        return updated
    except Exception as e:
        if "no encontrado" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))


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

    Endpoint -> Service:
    - Endpoint: `PUT /users/{id_usuario}`
    - Service: `user_service.update_user`
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
            current_user_id=current_user_id
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))
    
@router.delete("/users/{id_usuario}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_user(id_usuario: Decimal, db: Session = Depends(get_db)):
    """
    Elimina un usuario existente de la base de datos.

    Args:
        id_usuario (Decimal): ID del usuario a eliminar.
        db (Session): Sesión de la base de datos inyectada por FastAPI.

    Endpoint -> Service:
    - Endpoint: `DELETE /users/{id_usuario}`
    - Service: `user_service.delete_user`
    """
    try:
        user_service.delete_user(db,id_usuario)
        return ResponseMessage(message="Usuario eliminado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=get_safe_message(e))