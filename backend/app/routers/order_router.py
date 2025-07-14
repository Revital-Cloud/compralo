"""
Módulo de enrutador para la gestión de órdenes.
Define las rutas y endpoints relacionados con la gestión de órdenes,
incluyendo la creación y visualización de órdenes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import json
import httpx
import uuid
from decimal import Decimal

from core.database import get_db
from core.dependencies import get_current_user
from schemas.user_schema import User
from schemas.order_schema import Order as OrderResponse # Renombramos en la importación
from schemas.payment_schema import PayOrderPayload
from services.wompi_service import wompi_service

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
    responses={404: {"description": "Not found"}},
)

@router.get(
    "/",
    response_model=List[OrderResponse],
    summary="Obtener el historial de órdenes del usuario"
)
def get_user_orders(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Asumiendo que tienes una función `fun_obtener_ordenes_usuario`
    # Si no, esta parte necesitará una query directa
    query = text("SELECT * FROM fun_obtener_ordenes_usuario(:id_usuario, :limite)")
    params = {"id_usuario": current_user.id_usuario, "limite": limit}
    
    result = db.execute(query, params).fetchall()
    return result

@router.post(
    "/{order_id}/pay",
    summary="Pagar una orden existente con una tarjeta guardada",
    description="Inicia una transacción en Wompi para una orden pendiente."
)
async def pay_order(
    order_id: int,
    payload: PayOrderPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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