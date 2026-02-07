"""
Módulo de enrutador para la gestión de descuentos.

Define las rutas y endpoints relacionados con la gestión de descuentos,
incluyendo la creación, actualización, visualización y canje de descuentos.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user, require_admin
from schemas.auth_schema import UserInToken
from schemas.discount_schema import DiscountCreate, DiscountExchangeableResponse, DiscountUpdate, Discount, ResponseMessage
from services import discount_service
from schemas.user_discounts_schema import ValidateDiscountRequest, ValidateDiscountResponse

router = APIRouter(tags=["Descuentos"])

@router.get("/discounts")
async def get_discounts(db:Session = Depends(get_db)):
    """
    Obtiene todos los descuentos registrados en la base de datos.
    """
    try:
        discounts = discount_service.get_discounts(db)
        if not discounts:
            return []
        return discounts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error: {str(e)}")

@router.get("/discounts/by-code/{codigo}", response_model=Discount, summary="Obtiene un descuento por su código")
async def get_discount_by_code(
    codigo: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene un descuento activo por su código de cupón.
    
    Args:
        codigo (str): Código del descuento a buscar
        db (Session): Sesión de base de datos
        
    Returns:
        Discount: Descuento encontrado o error 404 si no existe
    """
    try:
        discount = discount_service.get_discount_by_code(db, codigo)
        if not discount:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Código de descuento no encontrado o no válido")
        return discount
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error: {str(e)}")

@router.post("/discounts/validate-for-cart", summary="Valida código de descuento para el carrito actual")
async def validate_discount_for_cart(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Valida si un código de descuento es aplicable al carrito actual del usuario.
    
    Body esperado:
        codigo (str): Código del descuento a validar
        id_carrito (int, opcional): ID del carrito (se busca si no se proporciona)
    
    Returns:
        dict: Información del descuento y validación
    """
    try:
        codigo = payload.get('codigo', '').strip()
        id_carrito = payload.get('id_carrito')
        
        if not codigo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de descuento es requerido"
            )
        
        result = discount_service.validate_discount_for_cart(
            db, 
            codigo, 
            current_user.id_usuario,
            Decimal(id_carrito) if id_carrito else None
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Código de descuento no encontrado o no válido"
            )
        if not result['es_aplicable']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de descuento no es aplicable a tu carrito actual"
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al validar descuento: {str(e)}"
        )

@router.get("/discounts/active", response_model=list[Discount], summary="Obtiene descuentos activos disponibles para usuarios")
async def get_active_discounts(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los descuentos activos disponibles para usuarios.
    Solo retorna descuentos que están activos, dentro de sus fechas de vigencia
    y con usos disponibles.
    
    Args:
        limit (int): Límite de resultados a retornar (default: 50)
        db (Session): Sesión de base de datos
        
    Returns:
        list[Discount]: Lista de descuentos activos disponibles
    """
    try:
        discounts = discount_service.get_active_discounts(db, limit)
        if not discounts:
            return []
        return discounts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error: {str(e)}")

@router.get("/discounts/exchangeable/{id_usuario}", response_model=list[DiscountExchangeableResponse], summary="Obtiene todos los descuentos canjeables (Cliente)")
async def get_discount_exchangeable(
    id_usuario: Decimal,
    limit: int = 20,
    current_user: UserInToken = Depends(get_current_user),
    db:Session = Depends(get_db)
):
    """
    Obtiene los descuentos canjeables por puntos para el usuario autenticado.
    Solo se permite consultar los descuentos del propio usuario (id_usuario debe coincidir con el token).
    """
    if int(id_usuario) != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes consultar los descuentos canjeables de tu propia cuenta.",
        )
    try:
        discounts = discount_service.get_discount_exchangeable(db, id_usuario, limit)
        if not discounts:
            return []
        return discounts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error: {str(e)}")

@router.post("/discounts", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_discount(
    db:Session = Depends(get_db),
    discount_data: DiscountCreate = Body(...),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Crea un nuevo descuento en la base de datos.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        discount_data (DiscountCreate): Los datos del descuento a crear.
        current_user (UserInToken): El usuario autenticado.
        
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        result = discount_service.create_discount(db, discount_data, current_user.id_usuario)
        return ResponseMessage(message="Descuento creado exitosamente")
    except HTTPException:
        raise
    except Exception as e:
        error_detail = str(e)
        import traceback
        print(f"ERROR en create_discount: {error_detail}")
        print(f"Traceback: {traceback.format_exc()}")
        # Si es un error de validación de Pydantic, lanzar 422
        if "validation" in error_detail.lower() or "Invalid" in error_detail:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_detail
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_detail)

@router.put("/discounts/{id_descuento}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_discount(
    id_descuento: Decimal,
    discount_data: DiscountUpdate = Body(...),
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Actualiza un descuento existente en la base de datos.
    
    Args:
        id_descuento (Decimal): El ID del descuento a actualizar.
        discount_data (DiscountUpdate): Los datos del descuento a actualizar.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): El usuario autenticado.
        
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        discount_service.update_discount(db, id_descuento, discount_data, current_user.id_usuario)
        return ResponseMessage(message="Descuento actualizado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/discounts/{id_descuento}/{activate}/deactivate-activate", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def deactivate_activate_discount(
    id_descuento: Decimal,
    activate: bool,
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Desactiva o activa un descuento existente en la base de datos.
    
    Args:
        id_descuento (Decimal): El ID del descuento a desactivar o activar.
        activate (bool): Indica si se debe activar o desactivar el descuento.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): El usuario autenticado.
        
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        discount_service.deactivate_activate_discount(db, id_descuento, activate, current_user.id_usuario)
        if activate:
            return ResponseMessage(message="Descuento activado exitosamente")
        else:
            return ResponseMessage(message="Descuento desactivado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/discounts/validate", response_model=ValidateDiscountResponse)
async def validate_discount(
    payload: ValidateDiscountRequest,
    db: Session = Depends(get_db)
):
    """
    Valida si un descuento es aplicable para un usuario según las reglas configuradas.
    """
    try:
        # Llamada directa a la función SQL
        result = db.execute(
            "SELECT fun_validar_descuento_aplicable(:id_descuento, :id_usuario, :codigo_ingresado, :usr_insert)",
            {
                "id_descuento": payload.id_descuento,
                "id_usuario": payload.id_usuario,
                "codigo_ingresado": payload.codigo_ingresado,
                "usr_insert": payload.usr_insert or payload.id_usuario
            }
        )
        aplicable = result.scalar()
        mensaje = "Descuento aplicable" if aplicable else "El descuento no es aplicable según las restricciones configuradas."
        return ValidateDiscountResponse(aplicable=aplicable, mensaje=mensaje)
    except Exception as e:
        return ValidateDiscountResponse(aplicable=False, mensaje=f"Error al validar descuento: {str(e)}")

# Endpoints Admin
@router.get("/admin/stats", status_code=status.HTTP_200_OK)
async def get_discount_stats(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtiene estadísticas generales de descuentos (solo admin).
    """
    try:
        stats = discount_service.get_discount_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{id_descuento}/admin/canjes", status_code=status.HTTP_200_OK)
async def get_discount_exchanges(
    id_descuento: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtiene el historial de canjes de un descuento específico (solo admin).
    """
    try:
        exchanges = discount_service.get_discount_exchanges(db, id_descuento)
        return exchanges
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))