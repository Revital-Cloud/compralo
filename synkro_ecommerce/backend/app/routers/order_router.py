"""
Módulo de enrutador para la gestión de órdenes.
Define las rutas y endpoints relacionados con la gestión de órdenes,
incluyendo la creación y visualización de órdenes.
"""
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
import asyncio
import json
import logging
import httpx
import uuid
from decimal import Decimal

logger = logging.getLogger(__name__)

from core.database import get_db
from core.dependencies import get_current_user, require_admin
from schemas.auth_schema import UserInToken
from schemas.order_schema import Order, OrderCreate, ResponseMessage, CreateOrderResponse, OrderStats 
from schemas.payment_schema import PayOrderPayload
from services.wompi_service import wompi_service
from services import order_service
from services import cart_product_service

router = APIRouter(
    tags=["Orders"],
    responses={404: {"description": "Not found"}},
)

@router.get("/wompi/financial-institutions")
async def get_wompi_financial_institutions(
    current_user: UserInToken = Depends(get_current_user)
):
    """Obtiene la lista de instituciones financieras para PSE"""
    try:
        institutions = await wompi_service.get_financial_institutions()
        return institutions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener instituciones financieras: {str(e)}")

@router.post("/wompi/create-transaction")
async def create_wompi_transaction(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una transacción en Wompi desde el checkout.
    
    Body esperado:
    - amount: float (monto total)
    - payment_method_type: str ("PSE", "CARD", etc.)
    - payment_method_data: dict (datos específicos del método de pago)
    - customer_data: dict (datos del cliente para PSE)
    - redirect_url: str (URL de redirección después del pago)
    """
    try:
        amount = float(payload.get("amount", 0))
        payment_method_type = payload.get("payment_method_type", "CARD")
        payment_method_data = payload.get("payment_method_data")
        customer_data = payload.get("customer_data")
        redirect_url = payload.get("redirect_url")
        
        if amount <= 0:
            raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")
        
        amount_in_cents = int(amount * 100)
        
        # Construir redirect_url si no se proporciona
        if not redirect_url:
            from core.config import settings
            redirect_url = f"{settings.FRONTEND_URL}/checkout/payment-result"
        
        transaction_response = await wompi_service.create_transaction(
            amount_in_cents=amount_in_cents,
            customer_email=current_user.email_usuario,
            payment_method_type=payment_method_type,
            payment_method_data=payment_method_data,
            customer_data=customer_data,
            redirect_url=redirect_url
        )
        
        return transaction_response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear transacción: {str(e)}")

@router.get("/wompi/transaction/{transaction_id}")
async def get_wompi_transaction(
    transaction_id: str,
    current_user: UserInToken = Depends(get_current_user)
):
    """Obtiene el estado de una transacción de Wompi"""
    try:
        transaction = await wompi_service.get_transaction(transaction_id)
        return transaction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener transacción: {str(e)}")

@router.get("/orders", response_model=List[Order])
async def get_orders(
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las órdenes del usuario autenticado.
    """
    orders = order_service.get_orders_by_user(db, current_user.id_usuario)
    if orders is None:
        return []
    return orders

@router.get(
    "/",
    response_model=List[Order],
    summary="Obtener el historial de órdenes del usuario"
)
def get_user_orders(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    # Asumiendo que tienes una función `fun_obtener_ordenes_usuario`
    # Si no, esta parte necesitará una query directa
    query = text("SELECT * FROM fun_obtener_ordenes_usuario(:id_usuario, :limite)")
    params = {"id_usuario": current_user.id_usuario, "limite": limit}
    
    result = db.execute(query, params).fetchall()
    return result

@router.get("/orders/{order_id}", response_model=Order)
async def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene el detalle de una orden si pertenece al usuario autenticado.
    """
    order = order_service.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    if order.get("id_usuario") != current_user.id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para ver esta orden")
    return order


@router.get("/orders/{order_id}/detail")
async def get_order_detail_with_items(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Devuelve la orden con sus `items` (snapshot) y descuentos aplicados.
    Siempre devuelve el snapshot de items aunque un producto haya sido desactivado.
    """
    order = order_service.get_order_with_items(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    if order.get("id_usuario") != current_user.id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para ver esta orden")
    return order


@router.post("/order", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_order(
    db:Session = Depends(get_db),
    order_data: OrderCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una nueva orden en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        order_data (OrderCreate): Un objeto Pydantic `OrderCreate` con los datos a insertar.
        current_user (UserInToken): El usuario autenticado.

    Returns:
        Dict[str, Any]: La respuesta completa de la función SQL con toda la información de la orden tal como la devuelve fun_crear_orden_desde_carrito.
        
    """
    try:
        result = order_service.create_order(db, order_data, current_user.id_usuario)
        
        # Si la función SQL devolvió un diccionario completo, devolverlo tal como está
        if result and isinstance(result, dict):
            return result
        
        # Si no hay resultado o es None, devolver respuesta de error
        return {
            "success": False,
            "message": "No se pudo crear la orden",
            "error": "La función SQL no devolvió una respuesta válida"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))




@router.post(
    "/{order_id}/pay",
    summary="Pagar una orden existente con una tarjeta guardada",
    description="Inicia una transacción en Wompi para una orden pendiente."
)
async def pay_order(
    order_id: int,
    payload: PayOrderPayload,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Paga una orden existente con una tarjeta guardada.

    Args:
        order_id (int): El identificador de la orden a pagar.
    """
    query = text("""
        SELECT o.val_total_pedido, o.ind_estado, mpu.provider_source_id
        FROM tab_ordenes o
        JOIN tab_metodos_pago_usuario mpu ON o.id_usuario = mpu.id_usuario
        WHERE o.id_orden = :order_id AND mpu.id_metodo_pago = :payment_method_id AND o.id_usuario = :user_id
    """)
    result = db.execute(query, {"order_id": order_id, "payment_method_id": payload.payment_method_id, "user_id": current_user.id_usuario}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="La orden o el método de pago no se encontraron, o no pertenecen al usuario.")

    if result.ind_estado != 1:
        raise HTTPException(status_code=400, detail=f"La orden no está pendiente de pago (estado actual: {result.ind_estado}).")

    try:
        reference = f"order-{order_id}-{uuid.uuid4()}"
        transaction_response = await wompi_service.create_transaction(
            amount_in_cents=int(result.val_total_pedido * 100),
            customer_email=current_user.email_usuario,
            payment_source_id=result.provider_source_id,
            reference=reference
        )
        
        # Marcar el método de pago usado en la orden (para visualización)
        try:
            order_service.update_order_payment_info(db, Decimal(order_id), metodo_pago="tarjeta")
        except Exception:
            pass
        
        transaction_data = transaction_response.get("data", {})
        status_tx = transaction_data.get("status")
        transaction_id = transaction_data.get("id")

        # Si quedó en pendiente, hacemos un intento de polling rápido (2s)
        if status_tx == "PENDING" and transaction_id:
            await asyncio.sleep(2)
            try:
                detail = await wompi_service.get_transaction(str(transaction_id))
                status_tx = (detail.get("data") or {}).get("status") or status_tx
            except Exception:
                # Si falla la consulta, mantenemos el estado original
                pass

        # Si está aprobado/declinado, actualizamos estado de la orden para feedback inmediato
        estado_map = {"APPROVED": 2, "DECLINED": 4, "VOIDED": 4, "ERROR": 4}
        if status_tx in estado_map:
            try:
                order_service.update_order_payment_info(db, Decimal(order_id), ind_estado=estado_map[status_tx])
            except Exception:
                pass

        return {"status": status_tx, "transaction_id": transaction_id, "message": transaction_data.get("status_message")}

    except httpx.HTTPStatusError as e:
        error_details = e.response.json().get("error", {})
        raise HTTPException(status_code=e.response.status_code, detail=f"Error de Wompi: {error_details.get('reason') or error_details.get('messages')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post(
    "/cart/{cart_id}/pay",
    summary="Pagar directamente el carrito y crear orden solo si el pago es aprobado",
    description=(
        "Calcula el total del carrito e inicia una transacción en Wompi. "
        "Solo crea la orden cuando Wompi devuelve APPROVED. Si queda PENDING o DECLINED, no se crea ninguna orden."
    )
)
async def pay_cart_and_create_order(
    cart_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Flujo seguro: no genera orden pendiente. Solo crea la orden si el pago es aprobado por Wompi.

    Body esperado:
      - payment_method_id: int (método de pago guardado del usuario)
      - id_direccion: int (dirección de envío seleccionada)
      - codigo_descuento?: str | null
      - des_observaciones?: str | null
      - id_canje?: int | null
    """
    try:
        payment_method_id = int(payload.get("payment_method_id"))
        id_direccion = int(payload.get("id_direccion"))
    except Exception:
        raise HTTPException(status_code=400, detail="Parámetros inválidos")

    # 1) Validar método de pago pertenece al usuario y obtener provider_source_id
    query_pm = text(
        """
        SELECT mpu.provider_source_id
        FROM tab_metodos_pago_usuario mpu
        WHERE mpu.id_metodo_pago = :pm_id AND mpu.id_usuario = :user_id
        """
    )
    pm_row = db.execute(query_pm, {"pm_id": payment_method_id, "user_id": current_user.id_usuario}).fetchone()
    if not pm_row or not pm_row.provider_source_id:
        raise HTTPException(status_code=404, detail="Método de pago no encontrado o inválido")

    # 2) Calcular total del carrito para este usuario (sin crear orden)
    try:
        cart_total_payload = {
            "id_usuario": current_user.id_usuario,
            "session_id": None,
            "id_canje_aplicar": payload.get("id_canje")
        }
        cart_total = cart_product_service.calculate_total_cart(db, type("Obj", (), {"model_dump": lambda self: cart_total_payload})())
        amount = int((cart_total.get("total_final") or 0) * 100)
    except Exception:
        amount = 0

    if amount <= 0:
        raise HTTPException(status_code=400, detail="El carrito está vacío o el total es inválido")

    # 3) Crear transacción en Wompi con referencia al carrito (no a una orden)
    try:
        reference = f"cart-{cart_id}-{uuid.uuid4()}"
        transaction_response = await wompi_service.create_transaction(
            amount_in_cents=amount,
            customer_email=current_user.email_usuario,
            payment_source_id=pm_row.provider_source_id,
            reference=reference
        )

        tx_data = transaction_response.get("data", {})
        status_tx = tx_data.get("status")
        transaction_id = tx_data.get("id")

        # Polling corto para intentar resolver PENDING rápidos
        if status_tx == "PENDING" and transaction_id:
            await asyncio.sleep(2)
            try:
                detail = await wompi_service.get_transaction(str(transaction_id))
                status_tx = (detail.get("data") or {}).get("status") or status_tx
            except Exception:
                pass

        # 4) Solo crear la orden cuando esté aprobado
        if status_tx == "APPROVED":
            try:
                result = order_service.create_order(
                    db,
                    type(
                        "CreateOrderObj",
                        (),
                        {"model_dump": lambda self: {
                            "id_carrito": cart_id,
                            "id_direccion": id_direccion,
                            "codigo_descuento": payload.get("codigo_descuento"),
                            "des_observaciones": payload.get("des_observaciones"),
                            "id_canje": payload.get("id_canje"),
                        }}
                    )(),
                    current_user.id_usuario,
                )
                order_id = int(result.get("id_orden")) if isinstance(result, dict) else None
                if order_id:
                    # Marcar como procesada por si la función la deja pendiente
                    try:
                        order_service.update_order_payment_info(db, Decimal(order_id), metodo_pago="tarjeta", ind_estado=2)
                    except Exception:
                        pass
                    # Enviar email de confirmación (gracias por tu compra + resumen)
                    try:
                        from services.email_service import send_order_confirmation_for_order_id
                        asyncio.create_task(send_order_confirmation_for_order_id(order_id))
                    except Exception as e:
                        logger.warning("No se pudo programar email de confirmación: %s", e)
                    return {"status": "APPROVED", "order_id": order_id, "transaction_id": transaction_id}
            except Exception as e:
                # Si fallara la creación de la orden después de aprobado, devolvemos error controlado
                raise HTTPException(status_code=500, detail=f"Pago aprobado pero falló la creación de la orden: {str(e)}")

        # 5) Para PENDING o DECLINED/ERROR: no crear orden
        if status_tx in ("PENDING", "DECLINED", "VOIDED", "ERROR"):
            return {"status": status_tx, "order_id": None, "transaction_id": transaction_id}

        # Estado desconocido
        return {"status": status_tx or "UNKNOWN", "order_id": None, "transaction_id": transaction_id}

    except httpx.HTTPStatusError as e:
        error_details = e.response.json().get("error", {})
        raise HTTPException(status_code=e.response.status_code, detail=f"Error de Wompi: {error_details.get('reason') or error_details.get('messages')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# Endpoints Admin
@router.get("/admin/orders/all", status_code=status.HTTP_200_OK)
async def get_all_orders_admin(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtiene todas las órdenes para el panel de administración (solo admin).
    """
    try:
        orders = order_service.get_all_orders_admin(db, limit, offset)
        print(f"📊 [DEBUG] Órdenes obtenidas: {orders}")
        return orders
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/admin/stats", response_model=OrderStats, status_code=status.HTTP_200_OK)
async def get_order_stats_admin(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtiene estadísticas de órdenes para el panel de administración (solo admin).
    """
    try:
        stats = order_service.get_order_stats_admin(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

def _get_order_detail_admin_impl(
    id_orden: int,
    db: Session,
):
    order_detail = order_service.get_order_detail_admin(db, id_orden)
    if not order_detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    return order_detail


@router.get("/admin/{id_orden}", status_code=status.HTTP_200_OK)
@router.get("/admin/orders/{id_orden}", status_code=status.HTTP_200_OK)
async def get_order_detail_admin(
    id_orden: int,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Obtiene el detalle completo de una orden para el panel de administración (solo admin).
    Acepta tanto /admin/{id} como /admin/orders/{id} por compatibilidad.
    """
    try:
        return _get_order_detail_admin_impl(id_orden, db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/admin/{id_orden}/status", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
@router.put("/admin/orders/{id_orden}/status", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_order_status_admin(
    id_orden: int,
    new_status: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin())
):
    """
    Actualiza el estado de una orden (solo admin).
    """
    try:
        order_service.update_order_status_admin(db, id_orden, new_status, current_user.id_usuario)
        return ResponseMessage(message="Estado de orden actualizado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))