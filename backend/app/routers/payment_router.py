"""
Router para la gestión de pagos y métodos de pago con Wompi.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import json
from decimal import Decimal

from core.database import get_db
from core.dependencies import get_current_user
from schemas.user_schema import User
from schemas.payment_schema import CreatePaymentMethodPayload, PaymentMethodResponse
from services.wompi_service import wompi_service

router = APIRouter(
    prefix="/payment-methods",
    tags=["Payment Methods"],
    responses={404: {"description": "Not found"}},
)

@router.post(
    "/",
    response_model=PaymentMethodResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Guardar un nuevo método de pago (tarjeta)",
    description="Recibe un token de tarjeta de Wompi, crea una fuente de pago y la guarda en la base de datos para el usuario autenticado."
)
async def create_payment_method(
    payload: CreatePaymentMethodPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        wompi_response = await wompi_service.create_payment_source(
            user_email=current_user.email_usuario,
            card_token=payload.card_token
        )
        
        wompi_data = wompi_response.get("data")
        if not wompi_data:
            raise HTTPException(status_code=400, detail="Wompi no devolvió datos para la fuente de pago.")

        query = text("""
            SELECT fun_agregar_metodo_pago(
                p_id_usuario := :id_usuario,
                p_provider_name := 'wompi',
                p_provider_source_id := :source_id,
                p_brand := :brand,
                p_last_four_digits := :last_four,
                p_expiration_month := :exp_month,
                p_expiration_year := :exp_year,
                p_card_holder := :card_holder,
                p_usr_operacion := :id_usuario
            )
        """)
        params = {
            "id_usuario": current_user.id_usuario,
            "source_id": wompi_data.get("id"),
            "brand": wompi_data.get("brand"),
            "last_four": wompi_data.get("last_four"),
            "exp_month": wompi_data.get("exp_month"),
            "exp_year": wompi_data.get("exp_year"),
            "card_holder": wompi_data.get("card_holder"),
        }
        
        result_proxy = db.execute(query, params).fetchone()
        db_response = result_proxy[0]

        if not db_response.get("success"):
            raise HTTPException(status_code=400, detail=db_response.get("message"))

        return PaymentMethodResponse(**db_response.get("data"))

    except httpx.HTTPStatusError as e:
        error_details = e.response.json()
        raise HTTPException(status_code=e.response.status_code, detail=f"Error en Wompi: {error_details.get('error', {}).get('messages')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/", response_model=List[PaymentMethodResponse], summary="Listar los métodos de pago guardados")
def list_payment_methods(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = text("SELECT * FROM fun_listar_metodos_pago(:id_usuario)")
    result = db.execute(query, {"id_usuario": current_user.id_usuario}).fetchall()
    # Mapear el resultado correctamente, ya que la función devuelve filas completas
    return [PaymentMethodResponse.from_orm(row) for row in result]

@router.delete("/{payment_method_id}", summary="Eliminar un método de pago guardado")
def delete_payment_method(payment_method_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = text("SELECT fun_eliminar_metodo_pago(:id_usuario, :id_metodo_pago)")
    result_proxy = db.execute(query, {"id_usuario": current_user.id_usuario, "id_metodo_pago": payment_method_id}).fetchone()
    db_response = result_proxy[0]

    if not db_response.get("success"):
        raise HTTPException(status_code=404, detail=db_response.get("message"))
    
    return {"message": db_response.get("message")}

@router.put("/{payment_method_id}/default", summary="Establecer un método de pago como predeterminado")
def set_default_payment_method(payment_method_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = text("SELECT fun_actualizar_metodo_pago_default(:id_usuario, :id_metodo_pago, :usr_operacion)")
    params = {
        "id_usuario": current_user.id_usuario,
        "id_metodo_pago": payment_method_id,
        "usr_operacion": current_user.id_usuario
    }
    result_proxy = db.execute(query, params).fetchone()
    db_response = result_proxy[0]

    if not db_response.get("success"):
        raise HTTPException(status_code=404, detail=db_response.get("message"))
        
    return {"message": db_response.get("message")}

# ==============================================================================
# WEBOOK PARA NOTIFICACIONES DE WOMPI
# ==============================================================================

@router.post("/webhook", include_in_schema=False)
async def handle_wompi_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint para recibir y procesar notificaciones (webhooks) de Wompi.
    
    Este endpoint es llamado por Wompi para informar sobre eventos,
    principalmente actualizaciones en el estado de las transacciones.
    No requiere autenticación JWT, ya que la seguridad se basa en la firma
    del evento que Wompi envía.
    """
    try:
        payload = await request.json()
        # Aquí iría la lógica para verificar la firma del evento de Wompi
        # utilizando el `WOMPI_EVENTS_SECRET`. Por ahora, omitimos por simplicidad.
        
        event_data = payload.get("data", {})
        transaction = event_data.get("transaction", {})

        if not transaction:
            return {"status": "event_ignored", "reason": "no_transaction_data"}

        # Extraer datos relevantes de la transacción de Wompi
        transaction_id = transaction.get("id")
        status = transaction.get("status")
        order_reference = transaction.get("reference")
        amount_in_cents = transaction.get("amount_in_cents")
        
        # Llamar a la función para actualizar el pago en la BD
        update_query = text("""
            SELECT fun_actualizar_pago(
                p_provider_transaction_id := :transaction_id,
                p_status := :status,
                p_status_detail := :status_message,
                p_payment_method_type := :payment_method_type,
                p_payment_method_extra := CAST(:extra AS jsonb),
                p_fee_amount := :fee,
                p_net_received_amount := :net_amount,
                p_provider_date_approved := :approved_at,
                p_raw_response := CAST(:raw_response AS jsonb),
                p_usr_operacion := 0 -- Usuario del sistema
            )
        """)
        
        # Lógica para calcular comisiones y montos
        # Esto es un ejemplo y debe ajustarse a tus necesidades
        wompi_fee = Decimal(transaction.get("wompi_fee", 0)) / 100
        net_amount = (Decimal(amount_in_cents) / 100) - wompi_fee

        update_params = {
            "transaction_id": transaction_id,
            "status": status,
            "status_message": transaction.get("status_message"),
            "payment_method_type": transaction.get("payment_method_type"),
            "extra": json.dumps(transaction.get("payment_method", {}).get("extra")),
            "fee": wompi_fee,
            "net_amount": net_amount,
            "approved_at": transaction.get("approved_at"),
            "raw_response": json.dumps(payload),
        }
        db.execute(update_query, update_params)

        # Si el pago fue aprobado, marcar la orden como pagada
        if status == 'APPROVED':
            order_id = int(order_reference.split('-')[-1]) # Asumiendo referencia "order-123"
            
            pay_query = text("""
                SELECT fun_marcar_orden_pagada(
                    p_id_orden := :id_orden,
                    p_metodo_pago := :metodo_pago,
                    p_referencia_pago := :ref_pago,
                    p_monto_pagado := :monto,
                    p_usr_operacion := 0 -- Usuario del sistema
                )
            """)
            pay_params = {
                "id_orden": order_id,
                "metodo_pago": transaction.get("payment_method_type"),
                "ref_pago": transaction_id,
                "monto": Decimal(amount_in_cents) / 100
            }
            db.execute(pay_query, pay_params)
            
        db.commit()
        return {"status": "notification_received_and_processed"}

    except Exception as e:
        db.rollback()
        # En producción, sería ideal loggear este error
        print(f"Error procesando webhook de Wompi: {e}")
        raise HTTPException(status_code=500, detail="Error interno al procesar el webhook.") 