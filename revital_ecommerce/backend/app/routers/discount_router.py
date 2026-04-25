"""
Mapa del módulo de descuentos (router).

Responsabilidades:
- Exponer endpoints públicos y administrativos para cupones/descuentos.
- Validar acceso (usuario autenticado o admin) según el caso.
- Delegar reglas de negocio en `services.discount_service`.

Subflujos cubiertos:
1) Catálogo de descuentos (general, activos, por código, por usuario).
2) Validación de aplicabilidad en carrito.
3) CRUD y activación/desactivación (admin).
4) Envío de cupón por email.
5) Métricas e historial de canjes (admin).
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user, require_admin
from schemas.auth_schema import UserInToken
from schemas.discount_schema import DiscountCreate, DiscountExchangeableResponse, DiscountUpdate, Discount, ResponseMessage, CreateDiscountResponse
from services import discount_service
from schemas.user_discounts_schema import ValidateDiscountRequest, ValidateDiscountResponse
from core.rate_limiter import limiter

router = APIRouter(tags=["Descuentos"])


class SendCouponBody(BaseModel):
    id_usuario: int

@router.get("/discounts")
async def get_discounts(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """
    Endpoint admin para listar todos los descuentos sin filtrar.

    Endpoint -> Service -> Tabla:
    - `GET /discounts`
    - `discount_service.get_discounts`
    - `tab_descuentos`
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
    Busca un cupón activo y vigente por código.

    Endpoint -> Service -> Regla:
    - `GET /discounts/by-code/{codigo}`
    - `discount_service.get_discount_by_code`
    - Valida activo + ventana de vigencia; retorna 404 si no aplica.
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
@limiter.limit("30/minute")
async def validate_discount_for_cart(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Valida cupón contra el carrito actual del usuario autenticado.

    Endpoint -> Service -> Salida:
    - `POST /discounts/validate-for-cart`
    - `discount_service.validate_discount_for_cart`
    - Retorna descuento, aplicabilidad, monto estimado y motivo de rechazo.

    Seguridad:
    - Requiere usuario autenticado.
    - Incluye rate limiting para reducir abuso de validación.
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
            detail = result.get('motivo_rechazo') or "El código de descuento no es aplicable a tu carrito actual"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=detail
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
    Retorna descuentos "simples" activos para página pública.

    Excluye selectores especiales:
    - cumpleaños, primera compra, canje por puntos, requiere código.
    """
    try:
        discounts = discount_service.get_active_discounts(db, limit)
        if not discounts:
            return []
        return discounts
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error: {str(e)}")

@router.get("/discounts/my-available", response_model=list[Discount], summary="Obtiene descuentos disponibles para el usuario autenticado")
async def get_my_available_discounts(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Lista descuentos disponibles para el usuario autenticado.

    Incluye:
    - generales activos
    - cumpleaños (si aplica hoy)
    - primera compra (si aún no tiene órdenes)
    """
    try:
        discounts = discount_service.get_user_available_discounts(
            db, 
            Decimal(current_user.id_usuario), 
            limit
        )
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
    Obtiene descuentos canjeables por puntos del usuario.

    Regla de ownership:
    - `id_usuario` del path debe coincidir con el usuario del token.
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

@router.post("/discounts", response_model=CreateDiscountResponse, status_code=status.HTTP_201_CREATED)
async def create_discount(
    db:Session = Depends(get_db),
    discount_data: DiscountCreate = Body(...),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Crea un descuento nuevo (solo admin).

    Endpoint -> Service -> Función SQL:
    - `POST /discounts`
    - `discount_service.create_discount`
    - `fun_insert_descuento(...)`

    Retorna `id_descuento` para encadenar acciones como envío de cupón.
    """
    try:
        id_descuento = discount_service.create_discount(db, discount_data, current_user.id_usuario)
        return CreateDiscountResponse(message="Descuento creado exitosamente", id_descuento=id_descuento)
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
    Actualiza un descuento existente.

    Endpoint -> Service -> Función SQL:
    - `PUT /discounts/{id_descuento}`
    - `discount_service.update_discount`
    - `fun_update_descuento(...)`
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
    Activa o desactiva un descuento.

    Endpoint -> Service -> Función SQL:
    - `PUT /discounts/{id_descuento}/{activate}/deactivate-activate`
    - `discount_service.deactivate_activate_discount`
    - `fun_activar_desactivar_descuento(...)`
    """
    try:
        discount_service.deactivate_activate_discount(db, id_descuento, activate, current_user.id_usuario)
        if activate:
            return ResponseMessage(message="Descuento activado exitosamente")
        else:
            return ResponseMessage(message="Descuento desactivado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/discounts/{id_descuento}/send-coupon", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def send_coupon_to_user(
    id_descuento: Decimal,
    payload: SendCouponBody = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """
    Envía por correo el cupón a un usuario (solo admin).

    Flujo:
    - Valida descuento/código y usuario destino.
    - Delega envío a servicio de email.
    - Respeta restricción de cupón personal cuando existe `id_usuario_destino`.
    """
    try:
        await discount_service.send_coupon_email_to_user(db, id_descuento, Decimal(payload.id_usuario))
        return ResponseMessage(message="Código enviado por correo correctamente")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/discounts/validate", response_model=ValidateDiscountResponse)
@limiter.limit("30/minute")
async def validate_discount(
    request: Request,
    payload: ValidateDiscountRequest,
    db: Session = Depends(get_db)
):
    """
    Valida aplicabilidad de descuento vía función SQL central.

    Nota:
    - Este endpoint usa llamada directa a BD (sin servicio intermedio) para
      reutilizar la regla canónica `fun_validar_descuento_aplicable`.
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
    Devuelve estadísticas globales de descuentos (solo admin).
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
    Devuelve historial de canjes de un descuento (solo admin).
    """
    try:
        exchanges = discount_service.get_discount_exchanges(db, id_descuento)
        return exchanges
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))