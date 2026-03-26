"""
Router para la gestión de pagos y métodos de pago con Wompi.

Mapa de este router:
- Métodos de pago del usuario (guardar/listar/eliminar/default)
- Webhook de Wompi para sincronizar estado real de pagos

Relación con services:
- `payment_service.py`: lifecycle de métodos de pago del usuario.
- `payment_widget_service.py`: lifecycle de pagos transaccionales.
"""
import asyncio
from decimal import Decimal
import json
import hmac
import hashlib
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import text

from core.database import get_db
from core.dependencies import get_current_user
from core.tenant import get_store_from_request
from schemas.user_schema import User
from schemas.payment_schema import CreatePaymentMethodPayload, PaymentMethodResponse
from services.payment_service import add_payment_method, list_payment_methods, delete_payment_method, set_default_payment_method
from services.payment_widget_service import (
    get_payment_by_reference,
    update_payment_status,
    create_order_from_checkout_reference,
    create_payment,
)
from core.config import settings
from services import order_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/payment",
    tags=["Payment Methods"],
    responses={404: {"description": "No encontrado"}},
)

@router.post(
    "/add-method",
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
    """
    Registra una tarjeta/token como método de pago del usuario.

    Endpoint -> Service -> Tablas:
    - Endpoint: `POST /payment/add-method`
    - Service: `add_payment_method`
    - Tablas: `tab_metodos_pago_usuario` (vía función SQL)
    """
    try:
        # El servicio devuelve un diccionario plano compatible con el schema.
        result = await add_payment_method(db, current_user, payload.card_token, payload.brand)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Error al agregar el método de pago")
            )
            
        # Se retorna directo porque ya coincide con `PaymentMethodResponse`.
        return PaymentMethodResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en create_payment_method: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar el método de pago"
        )

@router.get("/list-methods", response_model=List[PaymentMethodResponse], summary="Listar los métodos de pago guardados")
async def get_payment_methods(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Lista métodos de pago guardados del usuario autenticado.

    Endpoint -> Service -> Tablas:
    - Endpoint: `GET /payment/list-methods`
    - Service: `list_payment_methods`
    - Tablas: `tab_metodos_pago_usuario`
    """
    methods = list_payment_methods(db, current_user)
    return [PaymentMethodResponse(**m.dict()) for m in methods]

@router.delete("/delete-method/{payment_method_id}", summary="Eliminar un método de pago")
async def remove_payment_method(payment_method_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Elimina un método de pago del usuario.

    Endpoint -> Service -> Tablas:
    - Endpoint: `DELETE /payment/delete-method/{payment_method_id}`
    - Service: `delete_payment_method`
    - Tablas: `tab_metodos_pago_usuario` (vía función SQL)
    """
    result = delete_payment_method(db, current_user, payment_method_id)
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("message"))
    return {"message": result.get("message")}

@router.put("/set-default-method/{payment_method_id}", summary="Establecer un método de pago como predeterminado")
def update_default_payment_method(payment_method_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Marca un método de pago como predeterminado para el usuario.

    Endpoint -> Service -> Tablas:
    - Endpoint: `PUT /payment/set-default-method/{payment_method_id}`
    - Service: `set_default_payment_method`
    - Tablas: `tab_metodos_pago_usuario` (vía función SQL)
    """
    result = set_default_payment_method(db, current_user, payment_method_id)
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("message"))
    return {"message": result.get("message")}

def _get_nested_value(data: dict, path: str) -> str:
    """
    Obtiene un valor anidado usando notación por puntos.
    
    Ejemplo: _get_nested_value({"data": {"transaction": {"id": "123"}}}, "data.transaction.id")
    retorna "123".
    """
    keys = path.split(".")
    value = data
    for key in keys:
        if isinstance(value, dict):
            value = value.get(key)
        else:
            return ""
        if value is None:
            return ""
    return str(value) if value is not None else ""


def _verify_webhook_signature(
    payload: dict,
    signature_data: dict,
    events_secret: str
) -> bool:
    """
    Verifica la firma del webhook usando `signature.properties` dinámico.
    
    Wompi envía:
    - signature.properties: Array de paths (ej: ["event", "data.transaction.id"])
    - signature.checksum: SHA256 del hash esperado
    - signature.timestamp: Timestamp del evento
    
    Algoritmo:
    1. Concatenar valores según signature.properties en orden
    2. Agregar timestamp
    3. Agregar events_secret
    4. SHA256 del string resultante
    5. Comparar con signature.checksum usando hmac.compare_digest
    """
    try:
        properties = signature_data.get("properties", [])
        checksum = signature_data.get("checksum", "")
        timestamp = signature_data.get("timestamp", "")
        
        if not properties or not checksum:
            logger.warning("Webhook signature incompleto: falta properties o checksum")
            return False
        
        # Concatenar valores según properties en orden
        values_to_hash = []
        for prop_path in properties:
            value = _get_nested_value(payload, prop_path)
            values_to_hash.append(value)
        
        # Agregar timestamp y events_secret
        values_to_hash.append(str(timestamp))
        values_to_hash.append(events_secret)
        
        # Concatenar todo
        string_to_hash = "".join(values_to_hash)
        
        # Calcular SHA256
        expected_checksum = hashlib.sha256(string_to_hash.encode("utf-8")).hexdigest()
        
        # Comparar usando hmac.compare_digest para evitar timing attacks
        return hmac.compare_digest(expected_checksum, checksum)
        
    except Exception as e:
        logger.error(f"Error al verificar firma de webhook: {str(e)}")
        return False


@router.post("/webhook", include_in_schema=False)
async def handle_wompi_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint para recibir y procesar notificaciones (webhooks) de Wompi.
    
    Usa verificación de firma dinámica basada en signature.properties.
    Actualiza el estado del payment y marca la orden como pagada si corresponde.

    Endpoint -> Service -> Tablas:
    - Endpoint: `POST /payment/webhook`
    - Services:
      - `get_payment_by_reference`
      - `create_order_from_checkout_reference` (checkout flow)
      - `update_payment_status`
      - `create_payment` (cuando aplica consolidación)
    - Tablas:
      - `tab_pagos` (estado de pagos)
      - `tab_ordenes` (estado de orden)
      - `tab_orden_productos`/carrito indirectamente en creación de orden checkout

    Reglas clave:
    - Verifica firma (método dinámico o fallback simple).
    - Es idempotente para webhooks duplicados.
    - Puede consolidar pagos por reference o transaction_id.
    """
    request_body = await request.body()
    
    try:
        payload = json.loads(request_body)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload JSON inválido"
        )
    
    # Obtener credenciales del tenant.
    wompi_config = get_store_from_request(request, db)
    
    # Verificar firma con propiedades dinámicas.
    signature_data = payload.get("signature", {})
    
    if not signature_data:
        # Fallback: verificación simple por header (compatibilidad legada).
        signature_header = request.headers.get("x-wompi-signature")
        if signature_header:
            expected_signature = hmac.new(
                wompi_config.wompi_events_secret.encode(),
                request_body,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature_header, expected_signature):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Firma de webhook inválida (método simple)"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Firma de webhook faltante"
            )
    else:
        # Verificación dinámica con `signature.properties`.
        if not _verify_webhook_signature(payload, signature_data, wompi_config.wompi_events_secret):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Firma de webhook inválida (método dinámico)"
            )
    
    try:
        # Extraer datos de la transacción.
        data = payload.get("data", {})
        tx = data.get("transaction", {})
        status_tx = tx.get("status")  # APPROVED, DECLINED, VOIDED, ERROR, PENDING
        reference = tx.get("reference", "")
        transaction_id = tx.get("id", "")
        
        if not reference and not transaction_id:
            logger.warning("Webhook sin reference ni transaction_id")
            return {"status": "ok", "message": "Webhook recibido pero sin datos de transacción"}
        
        # Flujo checkout sin tabla: referencia codificada (`revital_cart_*`).
        # La orden se crea solo cuando el pago llega a APPROVED.
        if reference and reference.startswith("revital_cart_"):
            if status_tx != "APPROVED":
                return {"status": "ok"}
            existing = get_payment_by_reference(db, reference)
            if existing and existing.get("id_orden") is not None:
                logger.info(f"Pago ya procesado para referencia checkout: {reference}")
                return {"status": "ok"}
            order_id = create_order_from_checkout_reference(db, reference, tx, id_usuario=None)
            if order_id:
                try:
                    from services.email_service import send_order_confirmation_for_order_id
                    asyncio.create_task(send_order_confirmation_for_order_id(order_id))
                except Exception as e:
                    logger.warning(f"No se pudo programar email de confirmación: {e}")
                logger.info(f"Orden {order_id} creada tras webhook (referencia checkout): {reference}")
            return {"status": "ok"}
        
        # Buscar pago por `reference` o `transaction_id`.
        payment = None
        if reference:
            payment = get_payment_by_reference(db, reference)
        
        if not payment and transaction_id:
            # Fallback de búsqueda por transaction_id.
            query = text("""
                SELECT 
                    id_pago,
                    id_orden,
                    reference,
                    provider_transaction_id,
                    status
                FROM tab_pagos
                WHERE provider_transaction_id = :transaction_id
                ORDER BY fec_insert DESC
                LIMIT 1
            """)
            result = db.execute(query, {"transaction_id": transaction_id})
            row = result.fetchone()
            if row:
                payment = dict(row._mapping)
        
        if not payment:
            logger.warning(f"Payment no encontrado: reference={reference}, transaction_id={transaction_id}")
            # Compatibilidad: intentar actualizar orden con referencias antiguas `order-*`.
            if reference and reference.startswith("order-"):
                try:
                    order_id = int(reference.split("-")[1])
                    estado_map = {
                        "APPROVED": 2,
                        "DECLINED": 4,
                        "VOIDED": 4,
                        "ERROR": 4,
                        "PENDING": 1,
                    }
                    ind_estado = estado_map.get(status_tx)
                    if ind_estado:
                        # Extraer método de pago de la transacción cuando exista.
                        metodo_pago = "Wompi"
                        if tx and "payment_method" in tx:
                            pm = tx.get("payment_method", {})
                            if isinstance(pm, dict) and pm.get("type"):
                                from services.payment_widget_service import get_payment_method_name
                                metodo_pago = get_payment_method_name(pm.get("type"))
                        
                        order_service.update_order_payment_info(
                            db,
                            Decimal(order_id),
                            metodo_pago=metodo_pago,
                            ind_estado=ind_estado
                        )
                except Exception:
                    pass
            return {"status": "ok", "message": "Webhook procesado pero payment no encontrado"}
        
        # Idempotencia: ignorar duplicados si ya está en estado final.
        current_status = payment.get("status")
        if current_status in ["APPROVED", "DECLINED", "VOIDED", "ERROR"]:
            if current_status == status_tx:
                logger.info(f"Webhook duplicado ignorado: payment ya está en {status_tx}")
                return {"status": "ok", "message": "Webhook duplicado, payment ya actualizado"}
        
        # Actualizar pago con estado y evento crudo.
        update_payment_status(
            db=db,
            reference=payment.get("reference") or reference,
            status=status_tx,
            transaction_data=tx,
            mark_order_paid=(status_tx == "APPROVED")
        )
        
        # Enviar correo de confirmación cuando el pago es APPROVED.
        if status_tx == "APPROVED":
            order_id = payment.get("id_orden")
            if order_id is not None:
                try:
                    _order_id = int(order_id) if not isinstance(order_id, int) else order_id
                    from services.email_service import send_order_confirmation_for_order_id
                    asyncio.create_task(send_order_confirmation_for_order_id(_order_id))
                except Exception as e:
                    logger.warning(f"No se pudo programar email de confirmación: {e}")
        
        logger.info(f"Webhook procesado: reference={reference}, status={status_tx}")
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Error procesando webhook de Wompi: {str(e)}")
        # Responder 200 para evitar reintentos si el error es interno nuestro.
        return {"status": "error", "message": f"Error interno: {str(e)}"} 