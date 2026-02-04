"""
Router para la gestión de pagos con Wompi Checkout Widget.

Endpoints para crear pagos, attach transaction_id, polling de estados,
y reintentos de pagos fallidos.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from starlette.requests import Request
from fastapi import Request as FastAPIRequest
from sqlalchemy.orm import Session
from sqlalchemy import text
from decimal import Decimal
from typing import Optional
import logging

from core.database import get_db
from core.dependencies import get_current_user
from core.tenant import get_store_from_request
from schemas.auth_schema import UserInToken
from schemas.payment_schema import (
    PaymentCreateRequest,
    PaymentCreateResponse,
    CheckoutCreateRequest,
    ConfirmCheckoutRequest,
    AttachTransactionRequest,
    PollPaymentResponse,
    ReattemptPaymentRequest
)
from schemas.cart_product_schemas import CalculateTotalCart
from services.payment_widget_service import (
    generate_payment_reference,
    generate_integrity_signature,
    create_payment,
    generate_checkout_reference_from_cart,
    get_payment_by_reference,
    attach_transaction_id,
    poll_transaction_status,
    update_payment_status,
    get_last_payment_for_order,
    fetch_transaction_by_id,
    create_order_from_checkout_reference,
)
from services import order_service
from services import cart_product_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/payments",
    tags=["Payment Widget"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/test-signature",
    summary="Probar generación de firma de integridad",
    description="Endpoint de prueba para verificar que la firma se genera correctamente"
)
async def test_signature(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Genera una firma de prueba para verificar la configuración.
    Compara manualmente esta firma con la que genera Wompi.
    """
    from core.tenant import get_store_from_request
    
    wompi_config = get_store_from_request(request, db)
    
    # Valores de prueba fijos para comparar
    test_reference = "test_ref_123"
    test_amount = 5000000  # 50,000 COP
    test_currency = "COP"
    
    signature = generate_integrity_signature(
        reference=test_reference,
        amount_in_cents=test_amount,
        currency=test_currency,
        integrity_secret=wompi_config.wompi_integrity_secret
    )
    
    return {
        "message": "Usa estos valores para probar en el sandbox de Wompi",
        "public_key": wompi_config.wompi_public_key,
        "public_key_prefix": wompi_config.wompi_public_key[:20] + "...",
        "integrity_secret_prefix": wompi_config.wompi_integrity_secret[:25] + "...",
        "environment": wompi_config.wompi_environment,
        "test_values": {
            "reference": test_reference,
            "amount_in_cents": test_amount,
            "currency": test_currency,
            "signature_formula": f"SHA256({test_reference}{test_amount}{test_currency}[INTEGRITY_SECRET])",
            "generated_signature": signature
        },
        "instructions": [
            "1. Ve a https://comercios.wompi.co/",
            "2. En Desarrolladores → Llaves, copia tu integrity secret",
            "3. En una herramienta SHA256 online, calcula: SHA256(test_ref_1235000000COP + tu_integrity_secret)",
            "4. El resultado debe coincidir con 'generated_signature'",
            "5. Si no coincide, verifica que usas las credenciales del mismo comercio"
        ]
    }


@router.post(
    "/create-checkout",
    response_model=PaymentCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear sesión de checkout (sin orden)",
    description="Crea una sesión de checkout y retorna la config de Wompi. La orden se crea solo cuando el pago es APPROVED."
)
async def create_checkout_session_endpoint(
    payload: CheckoutCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """Crea sesión de checkout: no se crea orden hasta que el pago sea aprobado."""
    try:
        cart_id = payload.cart_id
        id_direccion = payload.id_direccion
        id_canje = payload.id_canje
        cart_row = db.execute(
            text("SELECT id_carrito, id_usuario, session_id FROM tab_carritos WHERE id_carrito = :cart_id"),
            {"cart_id": cart_id}
        ).fetchone()
        if not cart_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carrito no encontrado")
        cart_user_id = cart_row.id_usuario
        if cart_user_id is None or int(cart_user_id) != int(current_user.id_usuario):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="El carrito no pertenece al usuario")
        calc = CalculateTotalCart(
            id_usuario=Decimal(int(cart_user_id)),
            session_id=cart_row.session_id,
            id_canje_aplicar=Decimal(id_canje) if id_canje is not None else None
        )
        totals = cart_product_service.calculate_total_cart(db, calc)
        if not totals or not totals.get("success"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo calcular el total del carrito")
        total_final = float(totals.get("total_final", 0))
        if total_final <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El carrito está vacío o el total es inválido")
        amount_in_cents = int(total_final * 100)
        currency = "COP"
        # Referencia codificada: id_canje en la referencia para que la orden se cree con descuento por puntos
        reference = generate_checkout_reference_from_cart(cart_id, id_direccion, id_canje)
        logger.info(f"create-checkout: cart_id={cart_id}, id_direccion={id_direccion}, id_canje={id_canje} -> reference={reference}, amount={amount_in_cents}")
        wompi_config = get_store_from_request(request, db)
        if not wompi_config.wompi_public_key or not wompi_config.wompi_integrity_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de configuración: credenciales Wompi no configuradas"
            )
        integrity_signature = generate_integrity_signature(
            reference=reference,
            amount_in_cents=amount_in_cents,
            currency=currency,
            integrity_secret=wompi_config.wompi_integrity_secret
        )
        logger.info(f"✅ Checkout (sin orden): reference={reference}, amount={amount_in_cents}")
        return PaymentCreateResponse(
            reference=reference,
            amount_in_cents=amount_in_cents,
            currency=currency,
            public_key=wompi_config.wompi_public_key,
            integrity_signature=integrity_signature
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear checkout session: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/order-by-reference",
    status_code=status.HTTP_200_OK,
    summary="Obtener order_id por reference (para polling tras pago)",
)
async def get_order_by_reference(
    reference: str = Query(..., description="Reference del pago/checkout"),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """Tras el pago, el frontend hace polling hasta que el webhook o confirm-checkout cree la orden e inserte en tab_pagos."""
    row = db.execute(
        text("SELECT id_orden FROM tab_pagos WHERE reference = :ref AND usr_insert = :uid"),
        {"ref": reference, "uid": current_user.id_usuario}
    ).fetchone()
    if row and row.id_orden is not None:
        return {"order_id": int(row.id_orden)}
    return {"order_id": None}


@router.post(
    "/confirm-checkout",
    status_code=status.HTTP_200_OK,
    summary="Confirmar checkout tras pago (respaldo si el webhook no llegó)",
    description="Verifica la transacción en Wompi y crea la orden si está APPROVED. Así el carrito se vacía aunque el webhook no se ejecute.",
)
async def confirm_checkout(
    payload: ConfirmCheckoutRequest,
    request: FastAPIRequest,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Respaldo cuando el webhook no llega: el frontend llama con reference + transaction_id.
    El backend consulta Wompi, si la transacción está APPROVED crea la orden y el pago.
    """
    reference = payload.reference.strip()
    transaction_id = payload.transaction_id.strip()
    if not reference.startswith("synkro_cart_"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Referencia no es de checkout")
    # Si ya existe pago con esta referencia, devolver order_id
    existing = get_payment_by_reference(db, reference)
    if existing and existing.get("id_orden") is not None:
        return {"order_id": int(existing["id_orden"])}
    wompi_config = get_store_from_request(request, db)
    tx = await fetch_transaction_by_id(transaction_id, wompi_config)
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se pudo obtener la transacción de Wompi",
        )
    tx_reference = (tx.get("reference") or "").strip()
    if tx_reference != reference:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La referencia de la transacción no coincide",
        )
    if tx.get("status") != "APPROVED":
        return {"order_id": None, "message": "La transacción no está aprobada"}
    id_usuario = int(current_user.id_usuario)
    order_id = create_order_from_checkout_reference(db, reference, tx, id_usuario)
    if order_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo crear la orden (carrito no encontrado o no pertenece al usuario)",
        )
    try:
        from services.email_service import send_order_confirmation_for_order_id
        import asyncio
        asyncio.create_task(send_order_confirmation_for_order_id(order_id))
    except Exception as e:
        logger.warning(f"No se pudo programar email de confirmación: {e}")
    return {"order_id": order_id}


@router.post(
    "/create",
    response_model=PaymentCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear pago con widget de Wompi",
    description="Crea un registro de pago y genera la configuración necesaria para abrir el widget de Wompi"
)
async def create_payment_widget(
    payload: PaymentCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea un pago para una orden y retorna la configuración del widget.
    
    - Valida que la orden existe y está pagable
    - Genera reference única
    - Genera firma integrity en backend
    - Crea registro Payment con status CREATED
    - Retorna configuración para abrir widget
    """
    try:
        order_id = payload.order_id
        
        # Validar orden existe y está pagable (incluir totales para fallback de descuento)
        query = text("""
            SELECT 
                id_orden,
                val_total_productos,
                val_total_descuentos,
                val_total_pedido,
                ind_estado
            FROM tab_ordenes
            WHERE id_orden = :order_id
        """)
        
        result = db.execute(query, {"order_id": order_id})
        order = result.fetchone()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Orden {order_id} no encontrada"
            )
        
        # Validar que la orden está pagable (no pagada ni cancelada)
        # ind_estado: 1=pendiente, 2=procesada/aprobada, 4=cancelada
        if order.ind_estado == 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La orden ya está pagada"
            )
        
        if order.ind_estado == 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La orden está cancelada"
            )
        
        # Obtener credenciales del tenant
        wompi_config = get_store_from_request(request, db)
        
        # Validar que las credenciales estén configuradas
        if not wompi_config.wompi_public_key:
            logger.error("❌ WOMPI_PUBLIC_KEY no está configurada en las variables de entorno")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de configuración: WOMPI_PUBLIC_KEY no está configurada"
            )
        
        if not wompi_config.wompi_integrity_secret:
            logger.error("❌ WOMPI_INTEGRITY_SECRET no está configurada en las variables de entorno")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de configuración: WOMPI_INTEGRITY_SECRET no está configurada"
            )
        
        logger.info(f"🔍 Credenciales Wompi obtenidas: public_key={wompi_config.wompi_public_key[:20]}..., environment={wompi_config.wompi_environment}")
        
        # Calcular amount_in_cents: usar el de la orden; si la orden no tiene descuento guardado
        # pero el frontend envía un monto menor (con descuento), usarlo para que Wompi muestre el total correcto
        order_total_cents = int(float(order.val_total_pedido) * 100)
        order_subtotal_cents = int(float(order.val_total_productos or 0) * 100)
        order_discount = float(order.val_total_descuentos or 0)
        
        amount_in_cents = order_total_cents
        if (
            payload.amount_in_cents is not None
            and order_discount == 0
            and payload.amount_in_cents < order_total_cents
            and payload.amount_in_cents >= 1000
            and payload.amount_in_cents <= order_subtotal_cents
        ):
            amount_in_cents = payload.amount_in_cents
            logger.info(f"🔧 Usando monto del frontend (descuento no guardado en orden): {amount_in_cents} centavos")
        currency = "COP"
        
        # Generar reference única
        reference = generate_payment_reference(order_id)
        
        # Generar firma integrity en backend
        integrity_signature = generate_integrity_signature(
            reference=reference,
            amount_in_cents=amount_in_cents,
            currency=currency,
            integrity_secret=wompi_config.wompi_integrity_secret
        )
        
        # Crear registro Payment con status CREATED
        create_payment(
            db=db,
            order_id=order_id,
            reference=reference,
            amount_in_cents=amount_in_cents,
            currency=currency,
            status="CREATED",
            usr_insert=current_user.id_usuario
        )
        
        logger.info(f"✅ Payment creado para orden {order_id}: reference={reference}, amount={amount_in_cents}, public_key={wompi_config.wompi_public_key[:20]}...")
        
        return PaymentCreateResponse(
            reference=reference,
            amount_in_cents=amount_in_cents,
            currency=currency,
            public_key=wompi_config.wompi_public_key,
            integrity_signature=integrity_signature
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear el pago: {str(e)}"
        )


@router.post(
    "/attach-transaction",
    status_code=status.HTTP_200_OK,
    summary="Asociar transaction_id a un payment",
    description="Asocia el transaction_id retornado por el widget de Wompi a un payment"
)
async def attach_transaction(
    payload: AttachTransactionRequest,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Asocia un transaction_id de Wompi a un payment.
    
    - Busca payment por reference
    - Guarda wompi_transaction_id
    - Cambia status a PENDING si estaba CREATED
    """
    logger.info(f"🔍 ========== ATTACH TRANSACTION RECIBIDO ==========")
    logger.info(f"🔍 reference recibido: {payload.reference}")
    logger.info(f"🔍 transaction_id recibido: {payload.transaction_id}")
    logger.info(f"🔍 Tipo de reference: {type(payload.reference)}")
    logger.info(f"🔍 Tipo de transaction_id: {type(payload.transaction_id)}")
    logger.info(f"🔍 Payload completo: {payload.model_dump()}")
    
    try:
        reference = payload.reference
        transaction_id = payload.transaction_id
        
        # Validación estricta de reference
        if not reference or not isinstance(reference, str) or len(reference.strip()) == 0:
            logger.error(f"❌ reference inválido: {reference} (tipo: {type(reference)})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="reference es requerido y debe ser un string no vacío"
            )
        
        reference = reference.strip()
        
        # Validación estricta de transaction_id
        if not transaction_id:
            logger.error(f"❌ transaction_id es requerido pero no se proporcionó (reference: {reference})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="transaction_id es requerido"
            )
        
        if not isinstance(transaction_id, str):
            logger.error(f"❌ transaction_id debe ser string, recibido: {type(transaction_id)} (valor: {transaction_id})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="transaction_id debe ser un string"
            )
        
        transaction_id = transaction_id.strip()
        
        if len(transaction_id) == 0:
            logger.error(f"❌ transaction_id está vacío después de trim (reference: {reference})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="transaction_id no puede estar vacío"
            )
        
        # Verificar que el payment existe antes de attachar
        payment = get_payment_by_reference(db, reference)
        if not payment:
            logger.error(f"❌ Payment no encontrado para reference: {reference}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment con reference {reference} no encontrado"
            )
        
        logger.info(f"✅ Payment encontrado: id_pago={payment.get('id_pago')}, id_orden={payment.get('id_orden')}, status_actual={payment.get('status')}")
        
        # Verificar que no tenga transaction_id ya asignado (idempotencia)
        existing_transaction_id = payment.get("provider_transaction_id")
        if existing_transaction_id:
            if existing_transaction_id == transaction_id:
                logger.info(f"ℹ️ Transaction ID ya está attachado (idempotencia): {transaction_id}")
                return {"status": "ok", "message": "Transaction ID ya estaba asociado", "transaction_id": transaction_id}
            else:
                logger.warning(f"⚠️ Payment ya tiene transaction_id diferente: {existing_transaction_id} vs {transaction_id}")
                # Continuar y actualizar (puede ser un reintento)
        
        # Attach transaction_id
        logger.info(f"🔍 Llamando a attach_transaction_id para reference={reference}, transaction_id={transaction_id}")
        attach_transaction_id(
            db=db,
            reference=reference,
            transaction_id=transaction_id
        )
        
        # Verificar que se guardó correctamente
        payment_after = get_payment_by_reference(db, reference)
        if payment_after and payment_after.get("provider_transaction_id") == transaction_id:
            logger.info(f"✅ Transaction ID attachado y verificado: reference={reference}, transaction_id={transaction_id}")
        else:
            logger.error(f"❌ ERROR CRÍTICO: Transaction ID no se guardó correctamente. Esperado: {transaction_id}, Obtenido: {payment_after.get('provider_transaction_id') if payment_after else 'N/A'}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al guardar transaction_id en la base de datos"
            )
        
        return {"status": "ok", "message": "Transaction ID asociado correctamente", "transaction_id": transaction_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al attachar transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al asociar transaction_id: {str(e)}"
        )


@router.get(
    "/poll",
    response_model=PollPaymentResponse,
    summary="Polling de estado de pago",
    description="Hace long-polling del estado de una transacción en Wompi"
)
async def poll_payment(
    request: Request,
    reference: str = Query(..., description="Referencia única del pago"),
    db: Session = Depends(get_db),
    current_user: Optional[UserInToken] = Depends(get_current_user)
):
    """
    Hace long-polling del estado de una transacción.
    
    - Busca payment por reference
    - Valida tiene wompi_transaction_id
    - Hace polling contra endpoint público de Wompi
    - Actualiza payment y marca orden pagada si APPROVED
    """
    logger.info(f"🔍 POLLING INICIADO: reference={reference}")
    try:
        # Buscar payment por reference
        payment = get_payment_by_reference(db, reference)
        logger.info(f"🔍 Payment encontrado: {payment is not None}")
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment con reference {reference} no encontrado"
            )
        
        # Validar tiene wompi_transaction_id
        transaction_id = payment.get("provider_transaction_id")
        if not transaction_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="transaction_id no ha sido attachado aún. Abre el widget primero."
            )
        
        # Obtener credenciales del tenant
        wompi_config = get_store_from_request(request, db)
        
        # Hacer polling
        poll_result = await poll_transaction_status(
            transaction_id=transaction_id,
            wompi_config=wompi_config,
            max_duration=30,
            interval=2
        )
        
        status_result = poll_result["status"]
        transaction_data = poll_result.get("data", {})
        
        # Si es estado final, actualizar payment
        logger.info(f"🔍 Polling resultado: status={status_result}, reference={reference}, es_estado_final={status_result in ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR']}")
        if status_result in ["APPROVED", "DECLINED", "VOIDED", "ERROR"]:
            should_mark_paid = (status_result == "APPROVED")
            logger.info(f"✅ Llamando a update_payment_status con mark_order_paid={should_mark_paid}")
            logger.info(f"🔍 Payment data antes de update: {payment}")
            try:
                update_payment_status(
                    db=db,
                    reference=reference,
                    status=status_result,
                    transaction_data=transaction_data,
                    mark_order_paid=should_mark_paid
                )
                logger.info(f"✅ update_payment_status completado exitosamente para reference={reference}")
            except Exception as e:
                logger.error(f"❌ Error en update_payment_status: {str(e)}")
                import traceback
                logger.error(f"Traceback completo: {traceback.format_exc()}")
                # No hacer raise aquí para que el endpoint retorne el status aunque falle la actualización
                # El webhook puede actualizar después
                logger.warning(f"⚠️ Continuando aunque update_payment_status falló. El webhook puede actualizar después.")
        
        # Preparar mensaje
        message = None
        if status_result == "PENDING":
            message = "Te avisaremos cuando se confirme"
        
        return PollPaymentResponse(
            status=status_result,
            transaction_id=transaction_id,
            reference=reference,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en polling: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al hacer polling: {str(e)}"
        )


@router.get(
    "/status",
    response_model=PollPaymentResponse,
    summary="Verificar estado de pago",
    description="Verifica el estado actual de un payment por reference (sin requerir transaction_id)"
)
async def get_payment_status(
    request: Request,
    reference: str = Query(..., description="Referencia única del pago"),
    db: Session = Depends(get_db),
    current_user: Optional[UserInToken] = Depends(get_current_user)
):
    """
    Verifica el estado actual de un payment por reference.
    
    Útil cuando el callback del widget no se ejecuta y necesitamos
    verificar el estado del pago directamente desde la base de datos.
    """
    logger.info(f"🔍 GET STATUS: reference={reference}")
    try:
        # Buscar payment por reference
        payment = get_payment_by_reference(db, reference)
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment con reference {reference} no encontrado"
            )
        
        status_result = payment.get("status", "CREATED")
        transaction_id = payment.get("provider_transaction_id")
        
        # Si el payment tiene transaction_id pero el estado es CREATED o PENDING,
        # intentar obtener el estado actual desde Wompi
        if transaction_id and status_result in ["CREATED", "PENDING"]:
            try:
                wompi_config = get_store_from_request(request, db)
                
                # Hacer una consulta rápida a Wompi para obtener el estado actual
                import httpx
                base_url = "https://sandbox.wompi.co" if wompi_config.wompi_environment == "sandbox" else "https://production.wompi.co"
                url = f"{base_url}/v1/transactions/{transaction_id}"
                
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, timeout=5.0)
                    if response.status_code == 200:
                        tx_data = response.json()
                        if tx_data.get("data"):
                            status_result = tx_data["data"].get("status", status_result)
                            logger.info(f"✅ Estado actualizado desde Wompi: {status_result}")
                            
                            # Si es estado final, actualizar payment
                            if status_result in ["APPROVED", "DECLINED", "VOIDED", "ERROR"]:
                                update_payment_status(
                                    db=db,
                                    reference=reference,
                                    status=status_result,
                                    transaction_data=tx_data.get("data", {}),
                                    mark_order_paid=(status_result == "APPROVED")
                                )
            except Exception as e:
                logger.warning(f"⚠️ No se pudo obtener estado desde Wompi: {str(e)}")
                # Continuar con el estado de la BD
        
        message = None
        if status_result == "PENDING":
            message = "Te avisaremos cuando se confirme"
        
        return PollPaymentResponse(
            status=status_result,
            transaction_id=transaction_id,
            reference=reference,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al verificar estado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar estado: {str(e)}"
        )


@router.post(
    "/reattempt",
    response_model=PaymentCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Reintentar pago fallido",
    description="Crea un nuevo pago para una orden cuyo último pago falló"
)
async def reattempt_payment(
    payload: ReattemptPaymentRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Permite reintentar un pago fallido.
    
    - Valida último payment está en DECLINED/ERROR/VOIDED
    - Crea nuevo payment con nueva reference única
    - Setea parent_payment_id
    - Retorna mismo payload que /payments/create
    """
    try:
        order_id = payload.order_id
        
        # Obtener último payment de la orden
        last_payment = get_last_payment_for_order(db, order_id)
        
        if not last_payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No se encontró ningún pago previo para la orden {order_id}"
            )
        
        # Validar que el último payment está en estado que permite reintento
        last_status = last_payment.get("status")
        if last_status not in ["DECLINED", "ERROR", "VOIDED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El último pago está en estado {last_status}. Solo se pueden reintentar pagos DECLINED, ERROR o VOIDED"
            )
        
        # Validar orden existe y está pagable
        query = text("""
            SELECT 
                id_orden,
                val_total_pedido,
                ind_estado
            FROM tab_ordenes
            WHERE id_orden = :order_id
        """)
        
        result = db.execute(query, {"order_id": order_id})
        order = result.fetchone()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Orden {order_id} no encontrada"
            )
        
        if order.ind_estado == 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La orden ya está pagada"
            )
        
        # Obtener credenciales del tenant
        wompi_config = get_store_from_request(request, db)
        
        # Calcular amount_in_cents
        amount_in_cents = int(float(order.val_total_pedido) * 100)
        currency = "COP"
        
        # Generar nueva reference única
        reference = generate_payment_reference(order_id)
        
        # Generar firma integrity
        integrity_signature = generate_integrity_signature(
            reference=reference,
            amount_in_cents=amount_in_cents,
            currency=currency,
            integrity_secret=wompi_config.wompi_integrity_secret
        )
        
        # Crear nuevo payment con parent_payment_id
        parent_payment_id = last_payment.get("id_pago")
        create_payment(
            db=db,
            order_id=order_id,
            reference=reference,
            amount_in_cents=amount_in_cents,
            currency=currency,
            status="CREATED",
            usr_insert=current_user.id_usuario,
            parent_payment_id=parent_payment_id
        )
        
        logger.info(f"Reintento de pago creado: order_id={order_id}, reference={reference}, parent_payment_id={parent_payment_id}")
        
        return PaymentCreateResponse(
            reference=reference,
            amount_in_cents=amount_in_cents,
            currency=currency,
            public_key=wompi_config.wompi_public_key,
            integrity_signature=integrity_signature
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear reintento: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear reintento de pago: {str(e)}"
        )

