"""
Módulo de enrutador para la gestión de órdenes.
Define las rutas y endpoints relacionados con la gestión de órdenes,
incluyendo la creación y visualización de órdenes.
"""
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
import json
import httpx
import uuid
from decimal import Decimal

from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.order_schema import Order, OrderCreate, ResponseMessage, CreateOrderResponse 
from schemas.payment_schema import PayOrderPayload
from services.wompi_service import wompi_service
from services import order_service

router = APIRouter(
    tags=["Orders"],
    responses={404: {"description": "Not found"}},
)

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron órdenes")
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
        
        transaction_data = transaction_response.get("data", {})
        status = transaction_data.get("status")
        transaction_id = transaction_data.get("id")

        # La respuesta inmediata de Wompi es la fuente de verdad.
        # El webhook servirá como un mecanismo de respaldo y para casos de pagos asíncronos (ej. PSE).
        if status in ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR']:
            # El webhook se encargará de actualizar el pago y la orden.
            # Aquí solo devolvemos el resultado inmediato al usuario.
            pass

        # De forma proactiva, podemos intentar actualizar el pago para no depender 100% del webhook
        # y dar una respuesta más completa si es posible.
        # Esto es opcional y depende de la estrategia que se quiera seguir.

        return {"status": status, "transaction_id": transaction_id, "message": transaction_data.get("status_message")}

    except httpx.HTTPStatusError as e:
        error_details = e.response.json().get("error", {})
        raise HTTPException(status_code=e.response.status_code, detail=f"Error de Wompi: {error_details.get('reason') or error_details.get('messages')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")