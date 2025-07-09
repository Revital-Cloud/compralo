import mercadopago
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status
from typing import Dict, Any, List
from decimal import Decimal

from core.config import settings
from schemas.payment_schema import (
    PaymentPreferenceRequest, PaymentPreferenceResponse, MetodoPagoUsuario
)
from schemas.auth_schema import UserInToken
from .user_service import get_user_by_id

# --- SDK Initialization ---
sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)


# --- MercadoPago API Wrapper Functions ---

def _handle_mp_response(response, success_status=200):
    if response["status"] == success_status:
        return response["response"]
    
    error_message = response.get("response", {}).get("message", "Error desconocido de MercadoPago")
    if "cause" in response.get("response", {}):
        causes = response["response"]["cause"]
        if isinstance(causes, list) and causes:
            error_message = causes[0].get("description", error_message)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Error en MercadoPago: {error_message}"
    )

def mp_create_preference(preference_data: Dict[str, Any]) -> Dict[str, Any]:
    preference_response = sdk.preference().create(preference_data)
    return _handle_mp_response(preference_response, success_status=201)

def mp_get_payment_info(payment_id: str) -> Dict[str, Any]:
    payment_info = sdk.payment().get(payment_id)
    return _handle_mp_response(payment_info)

def mp_search_customer(email: str) -> List[Dict[str, Any]]:
    customers_response = sdk.customer().search(filters={"email": email})
    customers = _handle_mp_response(customers_response)
    return customers.get("results", [])

def mp_create_customer(user_data: Dict[str, Any]) -> Dict[str, Any]:
    customer_response = sdk.customer().create(user_data)
    return _handle_mp_response(customer_response, success_status=201)

def mp_create_card(customer_id: str, card_token: str) -> Dict[str, Any]:
    card_response = sdk.card().create(customer_id, {"token": card_token})
    return _handle_mp_response(card_response, success_status=201)

def mp_delete_card(customer_id: str, card_id: str) -> Dict[str, Any]:
    response = sdk.card().delete(customer_id, card_id)
    return _handle_mp_response(response)

def mp_update_customer_default_card(customer_id: str, card_id: str) -> Dict[str, Any]:
    response = sdk.customer().update(customer_id, {"default_card": card_id})
    return _handle_mp_response(response)


# --- Business Logic Functions ---

def create_payment_preference(
    db: Session,
    preference_request: PaymentPreferenceRequest,
    id_orden: int,
    id_usuario: int
) -> PaymentPreferenceResponse:
    
    items_list = [item.model_dump() for item in preference_request.items]
    total_amount = sum(item['quantity'] * item['unit_price'] for item in items_list)
    
    for item in items_list:
        item['unit_price'] = float(item['unit_price'])

    payer_data = preference_request.payer.model_dump()
    back_urls_data = preference_request.back_urls.model_dump()

    preference_payload = {
        "items": items_list,
        "payer": payer_data,
        "back_urls": back_urls_data,
        "notification_url": preference_request.notification_url,
        "external_reference": str(id_orden),
        "metadata": {"id_orden": id_orden, "id_usuario": id_usuario}
    }

    mp_preference = mp_create_preference(preference_payload)
    
    params_crear_pago = {
        "p_id_orden": id_orden,
        "p_provider_name": "mercadopago",
        "p_provider_preference_id": mp_preference["id"],
        "p_amount": total_amount,
        "p_status": "pending",
        "p_usr_operacion": id_usuario
    }
    query_crear = text("""
        SELECT fun_crear_pago(
            :p_id_orden, :p_provider_name, :p_provider_preference_id, 
            :p_amount, :p_status, :p_usr_operacion
        )
    """)
    result = db.execute(query_crear, params_crear_pago).fetchone()
    db.commit()

    if not result or not result[0]['success']:
            raise HTTPException(status_code=400, detail=result[0]['message'] if result else "Error al registrar el intento de pago.")

    return PaymentPreferenceResponse(id=mp_preference["id"], init_point=mp_preference["init_point"])

async def handle_webhook(db: Session, notification: Dict[str, Any]):
    if notification.get("type") != "payment":
        return {"status": "notification not related to payment"}
    
    payment_id = notification.get("data", {}).get("id")
    if not payment_id: 
        return {"status": "no payment id in notification"}

    try:
        payment_info = mp_get_payment_info(payment_id)
        if not payment_info: return {"status": f"payment info for {payment_id} not found"}

        id_orden = payment_info.get("metadata", {}).get("id_orden")
        id_usuario = payment_info.get("metadata", {}).get("id_usuario")

        if not id_orden or not id_usuario:
                return {"status": "error, metadata missing in payment info"}

        fee_details = payment_info.get('fee_details', [])
        fee_amount = sum(Decimal(fee['amount']) for fee in fee_details if fee.get('type') == 'mercadopago_fee')

        params_actualizar = {
            "p_provider_payment_id": payment_info['id'],
            "p_status": payment_info['status'],
            "p_status_detail": payment_info['status_detail'],
            "p_payment_method_id": payment_info['payment_method_id'],
            "p_payment_type_id": payment_info['payment_type_id'],
            "p_fee_amount": fee_amount,
            "p_net_received_amount": Decimal(payment_info['transaction_details']['net_received_amount']),
            "p_provider_date_approved": payment_info.get('date_approved'),
            "p_raw_response": payment_info,
            "p_usr_operacion": id_usuario
        }
        query_actualizar = text("""
            SELECT fun_actualizar_pago(
                :p_provider_payment_id, :p_status, :p_status_detail, :p_payment_method_id,
                :p_payment_type_id, :p_fee_amount, :p_net_received_amount, 
                :p_provider_date_approved, :p_raw_response, :p_usr_operacion
            )
        """)
        db.execute(query_actualizar, params_actualizar)
        
        if payment_info['status'] == 'approved':
            params_marcar = {
                "p_id_orden": id_orden,
                "p_metodo_pago": "mercadopago",
                "p_referencia_pago": payment_info['id'],
                "p_monto_pagado": Decimal(payment_info['transaction_amount']),
                "p_observaciones": f"Pago via MP. Detalle: {payment_info['status_detail']}",
                "p_usr_operacion": id_usuario
            }
            query_marcar = text("""
                SELECT FROM fun_marcar_orden_pagada(
                    :p_id_orden, :p_metodo_pago, :p_referencia_pago, :p_monto_pagado,
                    :p_observaciones, :p_usr_operacion
                )
            """)
            db.execute(query_marcar, params_marcar)

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Error handling webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error processing webhook")

    return {"status": "webhook processed successfully"}
    
def _get_or_create_mp_customer_id(db: Session, user: UserInToken) -> str:
    db_user = get_user_by_id(db, user.id_usuario)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if hasattr(db_user, 'mp_usuario_id') and db_user.mp_usuario_id:
        return db_user.mp_usuario_id

    customers = mp_search_customer(db_user.email_usuario)
    
    if customers and len(customers) > 0:
        customer_id = customers[0]['id']
    else:
        customer_data = {
            "email": db_user.email_usuario,
            "first_name": db_user.nom_usuario,
            "last_name": db_user.ape_usuario,
        }
        print("--- Intentando crear cliente en MercadoPago con los siguientes datos: ---")
        print(customer_data)
        print("-------------------------------------------------------------------------")
        new_customer = mp_create_customer(customer_data)
        customer_id = new_customer['id']
    
    query = text("SELECT fun_update_mp_usuario_id(:p_id_usuario, :p_mp_usuario_id)")
    params = {
        "p_id_usuario": user.id_usuario,
        "p_mp_usuario_id": customer_id
    }
    db.execute(query, params)
    db.commit()

    return customer_id

def add_payment_method(db: Session, user: UserInToken, card_token: str) -> Dict[str, Any]:
    customer_id = _get_or_create_mp_customer_id(db, user)

    new_card = mp_create_card(customer_id, card_token)

    params = {
        "p_id_usuario": user.id_usuario,
        "p_provider_name": "mercadopago",
        "p_provider_card_id": new_card["id"],
        "p_brand": new_card["payment_method"]["name"],
        "p_last_four_digits": new_card["last_four_digits"],
        "p_expiration_month": new_card["expiration_month"],
        "p_expiration_year": new_card["expiration_year"],
        "p_usr_operacion": user.id_usuario
    }
    
    query = text("""
        SELECT fun_agregar_metodo_pago(
            :p_id_usuario, :p_provider_name, :p_provider_card_id, :p_brand, 
            :p_last_four_digits, :p_expiration_month, :p_expiration_year, :p_usr_operacion
        )
    """)
    result = db.execute(query, params).fetchone()
    db.commit()

    if not result or not result[0]['success']:
        raise HTTPException(status_code=400, detail=result[0]['message'] if result else "Error al guardar el método de pago.")
    
    return result[0]

def list_payment_methods(db: Session, id_usuario: int) -> List[MetodoPagoUsuario]:
    query = text("SELECT fun_listar_metodos_pago(:p_id_usuario)")
    results = db.execute(query, {"p_id_usuario": id_usuario}).fetchall()
    return [MetodoPagoUsuario.model_validate(row, from_attributes=True) for row in results]

def delete_payment_method(db: Session, user: UserInToken, id_metodo_pago: int):
    query_get_card = text("SELECT provider_card_id FROM tab_metodos_pago_usuario WHERE id_metodo_pago = :id AND id_usuario = :uid")
    card_to_delete = db.execute(query_get_card, {"id": id_metodo_pago, "uid": user.id_usuario}).fetchone()
    
    if not card_to_delete:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Método de pago no encontrado para este usuario.")

    provider_card_id = card_to_delete[0]
    customer_id = _get_or_create_mp_customer_id(db, user)
    mp_delete_card(customer_id, provider_card_id)

    query = text("SELECT fun_eliminar_metodo_pago(:p_id_usuario, :p_id_metodo_pago)")
    result = db.execute(query, {"p_id_usuario": user.id_usuario, "p_id_metodo_pago": id_metodo_pago}).fetchone()
    db.commit()

    if not result or not result[0]['success']:
        raise HTTPException(status_code=400, detail=result[0]['message'] if result else "Error al eliminar el método de pago.")
    
    return result[0]

def set_default_payment_method(db: Session, user: UserInToken, id_metodo_pago: int) -> Dict[str, Any]:
    query_get_card = text("SELECT provider_card_id FROM tab_metodos_pago_usuario WHERE id_metodo_pago = :id AND id_usuario = :uid")
    card_to_set = db.execute(query_get_card, {"id": id_metodo_pago, "uid": user.id_usuario}).fetchone()
    
    if not card_to_set:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Método de pago no encontrado.")

    provider_card_id = card_to_set[0]
    customer_id = _get_or_create_mp_customer_id(db, user)
    mp_update_customer_default_card(customer_id, provider_card_id)

    query = text("SELECT fun_actualizar_metodo_pago_default(:p_id_usuario, :p_id_metodo_pago, :p_usr_operacion)")
    params = {
        "p_id_usuario": user.id_usuario,
        "p_id_metodo_pago": id_metodo_pago,
        "p_usr_operacion": user.id_usuario
    }
    result = db.execute(query, params).fetchone()
    db.commit()

    if not result or not result[0]['success']:
        raise HTTPException(status_code=400, detail=result[0]['message'] if result else "Error al actualizar el método de pago.")
        
    return result[0] 