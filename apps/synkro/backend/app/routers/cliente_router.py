"""
Router de Clientes.

Define los endpoints CRUD para la gestión de clientes
(empresas que contratan el servicio SaaS).
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import (
    get_current_user,
    require_admin_synkro,
    require_cliente
)
from core.jwt_utils import get_password_hash
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.cliente_schema import (
    ClienteCreate,
    ClienteUpdate,
    ClientePublic
)
from services import cliente_service

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])


@router.get("/me", response_model=ClientePublic)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_cliente)
):
    """
    Obtiene el perfil del cliente actual autenticado.
    
    Solo accesible para clientes.
    
    Returns:
        ClientePublic: Información del cliente actual
    """
    cliente = cliente_service.get_cliente(db, current_user.identificacion_fiscal)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    return ClientePublic(**dict(cliente))


@router.put("/me", response_model=ResponseMessage)
def update_my_profile(
    cliente_data: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_cliente)
):
    """
    Actualiza el perfil del cliente actual autenticado.
    
    Solo accesible para clientes.
    El cliente no puede cambiar su estado_cliente ni notas_internas.
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    # El cliente no puede cambiar ciertos campos
    cliente_data.estado_cliente = None
    cliente_data.notas_internas = None
    
    # Si se proporciona contraseña, hashearla
    if cliente_data.password_cliente:
        cliente_data.password_cliente = get_password_hash(cliente_data.password_cliente)
    
    result = cliente_service.update_cliente(
        db, 
        current_user.identificacion_fiscal, 
        cliente_data, 
        current_user.email
    )
    
    if result and result.get("success"):
        return ResponseMessage(message="Perfil actualizado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al actualizar perfil") if result else "Error al actualizar perfil"
        )


@router.get("/me/suscripcion")
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_cliente)
):
    """
    Obtiene la suscripción activa del cliente actual.
    
    Solo accesible para clientes.
    
    Returns:
        dict: Información de la suscripción activa
    """
    suscripcion = cliente_service.get_suscripcion_activa(db, current_user.identificacion_fiscal)
    if not suscripcion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes una suscripción activa"
        )
    return dict(suscripcion)


@router.get("/me/plan")
def get_my_plan(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_cliente)
):
    """
    Obtiene el plan activo del cliente actual.
    
    Solo accesible para clientes.
    
    Returns:
        dict: Información del plan activo
    """
    plan = cliente_service.get_plan_activo(db, current_user.identificacion_fiscal)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes un plan activo"
        )
    return dict(plan)


# --- Endpoints para Admins de Synkro ---

@router.get("", response_model=List[ClientePublic])
def get_clientes(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Obtiene todos los clientes registrados.
    
    Solo accesible para admins de Synkro.
    
    Returns:
        List[ClientePublic]: Lista de clientes
    """
    clientes = cliente_service.get_clientes(db)
    return [ClientePublic(**dict(c)) for c in clientes]


@router.get("/{identificacion_fiscal}", response_model=ClientePublic)
def get_cliente(
    identificacion_fiscal: str,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene un cliente específico por su identificación fiscal.
    
    Admins de Synkro pueden ver cualquier cliente.
    Clientes solo pueden ver su propio perfil.
    
    - **identificacion_fiscal**: Identificación fiscal del cliente
    
    Returns:
        ClientePublic: Información del cliente
    """
    # Verificar permisos
    if current_user.user_type == "cliente" and current_user.identificacion_fiscal != identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este cliente"
        )
    
    cliente = cliente_service.get_cliente(db, identificacion_fiscal)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    return ClientePublic(**dict(cliente))


@router.post("", response_model=ResponseMessage)
def create_cliente(
    cliente: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Crea un nuevo cliente.
    
    Solo accesible para admins de Synkro.
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    # Si se proporciona contraseña, hashearla
    if cliente.password_cliente:
        cliente.password_cliente = get_password_hash(cliente.password_cliente)
    
    result = cliente_service.create_cliente(db, cliente, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Cliente creado correctamente: {result.get('identificacion_fiscal')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear cliente") if result else "Error al crear cliente"
        )


@router.put("/{identificacion_fiscal}", response_model=ResponseMessage)
def update_cliente(
    identificacion_fiscal: str,
    cliente_data: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Actualiza un cliente existente.
    
    Solo accesible para admins de Synkro.
    
    - **identificacion_fiscal**: Identificación fiscal del cliente a actualizar
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    # Verificar que el cliente existe
    existing = cliente_service.get_cliente(db, identificacion_fiscal)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    # Si se proporciona contraseña, hashearla
    if cliente_data.password_cliente:
        cliente_data.password_cliente = get_password_hash(cliente_data.password_cliente)
    
    result = cliente_service.update_cliente(
        db, 
        identificacion_fiscal, 
        cliente_data, 
        current_user.email
    )
    
    if result and result.get("success"):
        return ResponseMessage(message="Cliente actualizado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al actualizar cliente") if result else "Error al actualizar cliente"
        )


@router.delete("/{identificacion_fiscal}", response_model=ResponseMessage)
def delete_cliente(
    identificacion_fiscal: str,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Elimina un cliente (soft delete).
    
    Solo accesible para admins de Synkro.
    
    - **identificacion_fiscal**: Identificación fiscal del cliente a eliminar
    
    Returns:
        ResponseMessage: Mensaje de confirmación
    """
    # Verificar que el cliente existe
    existing = cliente_service.get_cliente(db, identificacion_fiscal)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    result = cliente_service.delete_cliente(db, identificacion_fiscal)
    
    if result and result.get("success"):
        return ResponseMessage(message="Cliente eliminado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al eliminar cliente") if result else "Error al eliminar cliente"
        )
