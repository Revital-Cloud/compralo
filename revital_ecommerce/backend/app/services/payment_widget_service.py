"""
Servicio para la gestión de pagos con Wompi Checkout Widget.

Este módulo maneja la creación de pagos con el widget embebido de Wompi,
incluyendo generación de referencias únicas, firmas de integridad, y polling
de estados de transacciones.

Guía rápida de responsabilidades (relación con endpoints):

1) Endpoints de `payment_widget_router.py`
   - `/payments/create-checkout`
   - `/payments/confirm-checkout`
   - `/payments/create`
   - `/payments/attach-transaction`
   - `/payments/poll`
   - `/payments/status`
   - `/payments/reattempt`
   Todos consumen funciones de este archivo para mantener reglas de negocio
   fuera del router (router = orquestación HTTP; service = lógica).

2) Funciones clave y para qué se usan
   - `generate_*reference*`: construyen referencias únicas/idempotentes.
   - `generate_integrity_signature`: firma SHA256 requerida por Wompi widget.
   - `create_payment` / `get_payment_by_reference` / `attach_transaction_id`:
     persistencia de pagos en `tab_pagos`.
   - `poll_transaction_status` / `fetch_transaction_by_id`:
     consulta estado real en Wompi.
   - `update_payment_status`:
     sincroniza estado local y, si aplica, actualiza estado de la orden.
   - `create_order_from_checkout_reference`:
     crea orden solo con pago APPROVED (flujo checkout).
"""
import hashlib
import uuid
import asyncio
import httpx
import logging
import json
from typing import Dict, Any, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status
from core.tenant import StoreWompiConfig, get_wompi_base_url
from core.exceptions import get_safe_message, MSG_SERVICE_UNAVAILABLE
from core.circuit_breaker import CircuitOpenError, run_with_circuit_breaker
from services import order_service
from services.out_of_stock_notification_service import notify_after_order_paid_stock_change

logger = logging.getLogger(__name__)

# Mapeo de métodos de pago de Wompi a nombres legibles en español
WOMPI_PAYMENT_METHOD_MAP = {
    "CARD": "Tarjeta de crédito/débito",
    "PSE": "PSE",
    "NEQUI": "Nequi",
    "BANCOLOMBIA_TRANSFER": "Corresponsal Bancario",
    "DAVIPLATA": "Daviplata",
    "BANCOLOMBIA_COLLECT": "Recaudo Bancolombia",
    "EFECTY": "Efecty",
    "CASH": "Efectivo",
    "BANCOLOMBIA_QR": "QR Bancolombia",
    "SURAPAY": "Sura Pay",
    "BANCO_DE_BOGOTA": "Banco de Bogotá",
    "BANCO_DE_OCCIDENTE": "Banco de Occidente",
    "BANCO_POPULAR": "Banco Popular",
    "BANCO_AV_VILLAS": "Banco AV Villas",
    "BANCO_AGRARIO": "Banco Agrario",
    "BANCO_CAJA_SOCIAL": "Banco Caja Social",
    "BANCO_COLPATRIA": "Banco Colpatria",
    "BANCO_COOPERATIVO_COOPCENTRAL": "Banco Cooperativo Coopcentral",
    "BANCO_FALABELLA": "Banco Falabella",
    "BANCO_GNB_SUDAMERIS": "Banco GNB Sudameris",
    "BANCO_PICHINCHA": "Banco Pichincha",
    "BANCO_SANTANDER": "Banco Santander",
    "BANCO_SERFINANZA": "Banco Serfinanza",
    "BANCO_TEQUENDAMA": "Banco Tequendama",
    "BANCO_UNION": "Banco Unión",
    "BANCO_W": "Banco W",
    "BANCOOMEVA": "Bancoomeva",
    "BANCOOMEVA_S.A.": "Bancoomeva S.A.",
    "BANCO_SANTANDER_DE_NEGOCIOS": "Banco Santander de Negocios",
    "BANCO_SANTANDER_DE_NEGOCIOS_COLOMBIA": "Banco Santander de Negocios Colombia",
    "BANCO_SANTANDER_DE_NEGOCIOS_COLOMBIA_S.A.": "Banco Santander de Negocios Colombia S.A.",
    "BANCO_SANTANDER_DE_NEGOCIOS_COLOMBIA_S.A._ESP": "Banco Santander de Negocios Colombia S.A. ESP",
    "BANCO_SANTANDER_DE_NEGOCIOS_COLOMBIA_S.A._ESP_": "Banco Santander de Negocios Colombia S.A. ESP",
}

def get_payment_method_name(wompi_type: str) -> str:
    """
    Convierte el tipo de método de pago de Wompi a un nombre legible.
    
    Args:
        wompi_type: Tipo de método de pago de Wompi (ej: "NEQUI", "CARD", "PSE")
        
    Returns:
        str: Nombre legible del método de pago en español
    """
    if not wompi_type:
        return "Wompi"
    
    # Normalizar a mayúsculas para el mapeo.
    wompi_type_upper = wompi_type.upper()
    
    # Retorna nombre mapeado o valor original si no existe correspondencia.
    return WOMPI_PAYMENT_METHOD_MAP.get(wompi_type_upper, f"Wompi - {wompi_type}")


# Mapeo de métodos de pago de Wompi a valores permitidos en tab_ordenes.metodo_pago
# El CHECK constraint solo permite: 'tarjeta', 'efectivo_red_pagos', 'transferencia'
WOMPI_TO_DB_METHOD_MAP = {
    "CARD": "tarjeta",
    "PSE": "transferencia",
    "NEQUI": "transferencia",
    "DAVIPLATA": "transferencia",
    "BANCOLOMBIA_TRANSFER": "transferencia",
    "BANCOLOMBIA_COLLECT": "efectivo_red_pagos",
    "EFECTY": "efectivo_red_pagos",
    "CASH": "efectivo_red_pagos",
    "BANCOLOMBIA_QR": "transferencia",
    "SURAPAY": "transferencia",
    # Todos los bancos se mapean a transferencia
    "BANCO_DE_BOGOTA": "transferencia",
    "BANCO_DE_OCCIDENTE": "transferencia",
    "BANCO_POPULAR": "transferencia",
    "BANCO_AV_VILLAS": "transferencia",
    "BANCO_AGRARIO": "transferencia",
    "BANCO_CAJA_SOCIAL": "transferencia",
    "BANCO_COLPATRIA": "transferencia",
    "BANCO_COOPERATIVO_COOPCENTRAL": "transferencia",
    "BANCO_FALABELLA": "transferencia",
    "BANCO_GNB_SUDAMERIS": "transferencia",
    "BANCO_PICHINCHA": "transferencia",
    "BANCO_SANTANDER": "transferencia",
    "BANCO_SERFINANZA": "transferencia",
    "BANCO_TEQUENDAMA": "transferencia",
    "BANCO_UNION": "transferencia",
    "BANCO_W": "transferencia",
    "BANCOOMEVA": "transferencia",
    "BANCOOMEVA_S.A.": "transferencia",
    "BANCO_SANTANDER_DE_NEGOCIOS": "transferencia",
    "BANCO_SANTANDER_DE_NEGOCIOS_COLOMBIA": "transferencia",
    "BANCO_SANTANDER_DE_NEGOCIOS_COLOMBIA_S.A.": "transferencia",
    "BANCO_SANTANDER_DE_NEGOCIOS_COLOMBIA_S.A._ESP": "transferencia",
    "BANCO_SANTANDER_DE_NEGOCIOS_COLOMBIA_S.A._ESP_": "transferencia",
}

def get_payment_method_for_db(wompi_type: str) -> str:
    """
    Convierte el tipo de método de pago de Wompi a un valor permitido en tab_ordenes.metodo_pago.
    
    El CHECK constraint solo permite: 'tarjeta', 'efectivo_red_pagos', 'transferencia'
    
    Args:
        wompi_type: Tipo de método de pago de Wompi (ej: "NEQUI", "CARD", "PSE")
        
    Returns:
        str: Valor permitido en la base de datos ('tarjeta', 'efectivo_red_pagos', o 'transferencia')
    """
    if not wompi_type:
        return "transferencia"  # Valor por defecto
    
    return WOMPI_TO_DB_METHOD_MAP.get(wompi_type.upper(), "transferencia")


def generate_payment_reference(order_id: int, idempotency_key: Optional[str] = None) -> str:
    """
    Genera una referencia única para el pago.
    
    Formato: revital_{order_id}_{random10}
    donde random10 son los primeros 10 caracteres de un UUID hex.
    
    Args:
        order_id: ID de la orden
        
    Returns:
        str: Referencia única del pago

    Notas de diseño:
    - Si llega `idempotency_key`, la referencia se vuelve determinística para
      evitar pagos duplicados ante reintentos del cliente.
    - Si no llega, se usa UUID parcial para garantizar unicidad.
    """
    if idempotency_key is not None:
        normalized = idempotency_key.strip()
        if normalized:
            # Idempotencia: la misma clave genera la misma referencia.
            hash_part = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:10]
            return f"revital_{order_id}_{hash_part}"

    random_part = uuid.uuid4().hex[:10]
    return f"revital_{order_id}_{random_part}"


# Referencia de checkout sin tabla intermedia:
# codifica cart_id, id_direccion e id_canje dentro de la referencia.
# Formato: revital_cart_{cart_id}_{id_direccion}_{id_canje}_{nonce}
# (id_canje=0 cuando no hay canje).
# La orden se crea únicamente al confirmar pago APPROVED.


def generate_checkout_reference_from_cart(
    cart_id: int,
    id_direccion: int,
    id_canje: Optional[int] = None,
    codigo_descuento: Optional[str] = None,
) -> str:
    """
    Genera referencia única para checkout a partir del carrito.

    Estructura:
    - Prefijo fijo: `revital_cart_`
    - Identificadores embebidos: `cart_id`, `id_direccion`, `id_canje`
    - Nonce aleatorio para evitar colisiones
    - Sufijo opcional con `codigo_descuento` separado por `.`

    ¿Por qué embebida?
    - Permite reconstruir contexto del checkout sin tabla temporal adicional.
    - Facilita confirmación por webhook o fallback de confirmación manual.
    """
    canje_val = id_canje if id_canje is not None else 0
    nonce = uuid.uuid4().hex[:8]
    ref = f"revital_cart_{cart_id}_{id_direccion}_{canje_val}_{nonce}"
    if codigo_descuento and str(codigo_descuento).strip():
        ref = f"{ref}.{str(codigo_descuento).strip()}"
    return ref


def parse_checkout_reference(reference: str) -> Optional[tuple[int, int, Optional[int], Optional[str]]]:
    """
    Parsea referencia `revital_cart_*` y devuelve:
    `(cart_id, id_direccion, id_canje, codigo_descuento)`.

    Comportamiento:
    - Si el formato no cumple exactamente, retorna `None`.
    - Si `id_canje` es `0`, retorna `None` (no se aplicó canje).
    - `codigo_descuento` puede venir embebido al final del nonce.
    id_canje es None si en la referencia es 0. codigo_descuento es opcional (parte tras el último punto en el último segmento).
    """
    if not reference or not reference.startswith("revital_cart_"):
        return None
    parts = reference.split("_")
    if len(parts) != 6:
        return None
    try:
        cart_id = int(parts[2])
        id_direccion = int(parts[3])
        canje_val = int(parts[4])
        id_canje = None if canje_val == 0 else canje_val
        last = parts[5]
        codigo_descuento = None
        if "." in last:
            _, codigo_descuento = last.split(".", 1)
            if not codigo_descuento or not codigo_descuento.strip():
                codigo_descuento = None
        return (cart_id, id_direccion, id_canje, codigo_descuento)
    except (ValueError, IndexError):
        return None


async def fetch_transaction_by_id(
    transaction_id: str,
    wompi_config: StoreWompiConfig,
) -> Optional[Dict[str, Any]]:
    """
    Obtiene una transacción de Wompi por ID (una sola petición GET).
    Útil para confirmar checkout cuando el webhook no llegó.

    Flujo:
    - Construye URL según ambiente (sandbox/producción).
    - Ejecuta request con circuit breaker.
    - Retorna `None` en 404 o errores no recuperables de Wompi.
    - Lanza 503 cuando el circuito está abierto (degradación controlada).
    """
    base_url = get_wompi_base_url(wompi_config.wompi_environment)
    url = f"{base_url}/transactions/{transaction_id}"
    headers = {"Content-Type": "application/json"}

    async def _do_request():
        async with httpx.AsyncClient(timeout=10.0) as client:
            return await client.get(url, headers=headers)

    try:
        response = await run_with_circuit_breaker(
            key=url,
            call=_do_request,
            failure_predicate=lambda r: r is not None and (r.status_code >= 500 or r.status_code == 429),
        )
    except CircuitOpenError:
        logger.warning("Circuit breaker abierto: no se consulta Wompi (fetch_transaction_by_id).")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=MSG_SERVICE_UNAVAILABLE)
    except HTTPException:
        # Propaga el 503 lanzado por el circuito (o fallas controladas).
        raise
    except Exception as e:
        logger.warning(f"No se pudo obtener transacción de Wompi: {transaction_id} - {e}")
        return None

    if response.status_code == 404:
        return None
    if response.status_code >= 400:
        logger.warning(f"Wompi devolvió HTTP {response.status_code} al consultar transacción: {transaction_id}")
        return None

    data = response.json()
    return data.get("data") or data


def create_order_from_checkout_reference(
    db: Session,
    reference: str,
    tx: Dict[str, Any],
    id_usuario: Optional[int] = None,
) -> Optional[int]:
    """
    Crea la orden solo cuando Wompi confirma que el pago fue exitoso (APPROVED).
    - Si el pago NO fue exitoso: no se crea ninguna orden (return None).
    - Si el pago SÍ fue exitoso: se crea la orden, se registra el pago y se marca la orden
      como Pagada (ind_estado=2); los triggers limpian el carrito, actualizan stock y puntos.
    - id_usuario: si es None (webhook) se obtiene del carrito; si se pasa (confirm-checkout)
      se valida que el carrito pertenezca a ese usuario.
    Retorna order_id o None si falla / pago no aprobado.

    Secuencia resumida:
    1. Parsear referencia checkout.
    2. Validar estado Wompi == APPROVED.
    3. Resolver carrito y ownership de usuario.
    4. Aplicar lock transaccional por referencia (evitar duplicados).
    5. Crear orden en estado pendiente (1).
    6. Actualizar orden a pagada/procesada (2) para disparar triggers.
    7. Registrar pago APPROVED en `tab_pagos`.

    Razón del paso 5 -> 6:
    - Evita carreras donde triggers corren antes de tener items completos.
    """
    parsed = parse_checkout_reference(reference)
    if not parsed:
        logger.warning(f"create_order_from_checkout_reference: referencia no parseada: {reference}")
        return None
    cart_id, id_direccion, id_canje, codigo_descuento = parsed
    logger.info(
        "create_order_from_checkout_reference: reference=%s -> cart_id=%s, id_direccion=%s, id_canje=%s, codigo_descuento=%s",
        reference,
        cart_id,
        id_direccion,
        id_canje,
        codigo_descuento,
    )
    status_tx = tx.get("status")
    # Sin pago exitoso en Wompi no se crea ninguna orden.
    if status_tx != "APPROVED":
        logger.info(f"create_order_from_checkout_reference: no se crea orden (status={status_tx}, no APPROVED)")
        return None

    # Buscar el carrito exacto de la referencia.
    # NO usar fallback a "otro carrito", porque podría mezclar ítems distintos
    # a los que el usuario realmente pagó.
    cart_row = db.execute(
        text("SELECT id_carrito, id_usuario FROM tab_carritos WHERE id_carrito = :cid"),
        {"cid": cart_id},
    ).fetchone()

    if not cart_row or cart_row.id_usuario is None:
        # Logs de diagnóstico para depurar ausencia de carrito en confirm-checkout.
        logger.warning(
            "Carrito %s de la referencia no encontrado o sin usuario. Causa habitual: el carrito fue eliminado antes de confirmar el pago (p. ej. ejecutando delete_usuario_por_email.sql durante el flujo).",
            cart_id,
        )
        # Diagnóstico: estado real de la BD para comparar con create-checkout
        items_count = db.execute(
            text("SELECT COUNT(*) FROM tab_carrito_productos WHERE id_carrito = :cid"),
            {"cid": cart_id},
        ).scalar() or 0
        cart_id_usuario = cart_row.id_usuario if cart_row else None
        cart_session_id = getattr(cart_row, "session_id", None) if cart_row else None
        if id_usuario is not None:
            user_carts_count = db.execute(
                text("SELECT COUNT(*) FROM tab_carritos WHERE id_usuario = :uid"),
                {"uid": id_usuario},
            ).scalar() or 0
            logger.info(
                "[CHECKOUT_DEBUG] confirm-checkout fallido: cart_id=%s, cart_row_exists=%s, cart_id_usuario=%s, cart_session_id=%s, cart_items_count=%s, id_usuario_token=%s, user_total_carts=%s",
                cart_id,
                cart_row is not None,
                cart_id_usuario,
                cart_session_id,
                items_count,
                id_usuario,
                user_carts_count,
            )
        else:
            logger.info(
                "[CHECKOUT_DEBUG] confirm-checkout fallido (webhook): cart_id=%s, cart_row_exists=%s, cart_id_usuario=%s, cart_items_count=%s",
                cart_id,
                cart_row is not None,
                cart_id_usuario,
                items_count,
            )
        return None

    cart_user_id = int(cart_row.id_usuario)
    if id_usuario is not None and cart_user_id != id_usuario:
        logger.warning(
            "Carrito no pertenece al usuario: cart_id=%s, id_usuario_token=%s, id_usuario_carrito=%s",
            cart_id,
            id_usuario,
            cart_user_id,
        )
        return None
    id_usuario = cart_user_id

    # Lock por referencia para evitar órdenes duplicadas
    # (confirm-checkout y webhook pueden correr en paralelo).
    db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:ref)::bigint)"), {"ref": reference})
    existing = get_payment_by_reference(db, reference)
    if existing and existing.get("id_orden") is not None:
        order_id_existing = int(existing["id_orden"])
        # Asegurar que la orden quede pagada; puede haberse creado pendiente
        # si un intento anterior falló parcialmente.
        try:
            row = db.execute(
                text("SELECT ind_estado FROM tab_ordenes WHERE id_orden = :oid"),
                {"oid": order_id_existing},
            ).fetchone()
            if row and getattr(row, "ind_estado", None) != 2:
                pm = tx.get("payment_method", {}) or {}
                pm_type = pm.get("type") if isinstance(pm, dict) else None
                metodo_pago = get_payment_method_for_db(pm_type) if pm_type else "transferencia"
                db.execute(
                    text("UPDATE tab_ordenes SET ind_estado = 2, metodo_pago = :mp, fec_update = NOW() WHERE id_orden = :oid"),
                    {"oid": order_id_existing, "mp": metodo_pago},
                )
                db.commit()
                logger.info(f"Orden {order_id_existing} marcada como pagada (estaba Pendiente, referencia ya existía)")
        except Exception as e:
            logger.warning(f"Al asegurar orden pagada para referencia existente: {e}")
            if db.in_transaction():
                db.rollback()
        return order_id_existing

    try:
        from schemas.order_schema import OrderCreate
        # id_canje entero para que la BD aplique descuento por puntos.
        order_data = OrderCreate(
            id_carrito=cart_id,
            id_direccion=id_direccion,
            codigo_descuento=codigo_descuento,
            des_observaciones=None,
            id_canje=Decimal(int(id_canje)) if id_canje is not None else None,
        )
        pm = tx.get("payment_method", {}) if isinstance(tx.get("payment_method"), dict) else {}
        pm_type = pm.get("type") if pm else None
        metodo_pago = get_payment_method_for_db(pm_type) if pm_type else "transferencia"
        # IMPORTANTE:
        # Si se inserta la orden directamente en estado pagado (2), algunos triggers
        # pueden ejecutarse antes de que existan todas las filas de `tab_orden_productos`.
        # Estrategia segura: crear en pendiente (1) y luego actualizar a 2.
        result = order_service.create_order(
            db, order_data, Decimal(id_usuario), ind_estado=1, metodo_pago=metodo_pago
        )
        if not result or not result.get("success") or not result.get("id_orden"):
            logger.error(f"No se pudo crear la orden desde referencia checkout: {result}")
            return None
        order_id = int(result["id_orden"])

        # Marcar como pagada/procesada (UPDATE) para disparar triggers
        # (stock, puntos y limpieza de carrito).
        try:
            order_service.update_order_payment_info(
                db,
                Decimal(order_id),
                metodo_pago=metodo_pago,
                ind_estado=2,
                commit=True,
            )
        except Exception as up_err:
            logger.error(f"Error al marcar orden {order_id} como pagada/procesada: {up_err}", exc_info=True)
            return None
        amount_in_cents = int(tx.get("amount_in_cents", 0)) or 0
        if amount_in_cents <= 0:
            order_row = db.execute(
                text("SELECT val_total_pedido FROM tab_ordenes WHERE id_orden = :oid"),
                {"oid": order_id}
            ).fetchone()
            if order_row and order_row.val_total_pedido is not None:
                amount_in_cents = int(float(order_row.val_total_pedido) * 100)
        try:
            create_payment(
                db=db,
                order_id=order_id,
                reference=reference,
                amount_in_cents=amount_in_cents,
                currency="COP",
                status="APPROVED",
                usr_insert=Decimal(id_usuario),
            )
        except Exception as pay_err:
            logger.warning(f"create_payment falló para orden {order_id} (orden ya creada como pagada): {pay_err}")
        logger.info(f"Orden {order_id} creada y marcada como pagada/procesada desde referencia checkout: {reference}")
        return order_id
    except Exception as e:
        logger.error(f"Error creando orden desde referencia checkout: {e}", exc_info=True)
        return None


def generate_integrity_signature(
    reference: str,
    amount_in_cents: int,
    currency: str,
    integrity_secret: str
) -> str:
    """
    Genera la firma de integridad SHA256 requerida por Wompi.
    
    Formato: sha256(reference + amount_in_cents + currency + integrity_secret)
    
    Args:
        reference: Referencia única del pago
        amount_in_cents: Monto en centavos
        currency: Moneda (ej: "COP")
        integrity_secret: Secreto de integridad de Wompi
        
    Returns:
        str: Firma SHA256 en hexadecimal

    Esta firma la valida Wompi al abrir el widget para garantizar que:
    - referencia, monto y moneda no fueron alterados en cliente.
    - el backend autorizó esos valores con el `integrity_secret`.
    """
    payload = f"{reference}{amount_in_cents}{currency}{integrity_secret}"
    signature = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    
    # Log de diagnóstico para validar fórmula de firma.
    logger.info(f"Firma de integridad generada:")
    logger.info(f"  reference: {reference}")
    logger.info(f"  amount_in_cents: {amount_in_cents}")
    logger.info(f"  currency: {currency}")
    logger.info(f"  integrity_secret (primeros 20 chars): {integrity_secret[:20]}...")
    logger.info(f"  payload (sin secret): {reference}{amount_in_cents}{currency}[SECRET]")
    logger.info(f"  signature: {signature}")
    
    return signature


def create_payment(
    db: Session,
    order_id: int,
    reference: str,
    amount_in_cents: int,
    currency: str,
    status: str,
    usr_insert: Decimal,
    parent_payment_id: Optional[int] = None
) -> int:
    """
    Crea un registro de pago en la base de datos.
    
    Args:
        db: Sesión de base de datos
        order_id: ID de la orden
        reference: Referencia única del pago
        amount_in_cents: Monto en centavos
        currency: Moneda
        status: Estado inicial (CREATED)
        usr_insert: Usuario que crea el pago
        parent_payment_id: ID del pago padre (para reintentos)
        
    Returns:
        int: ID del pago creado
        
    Raises:
        HTTPException: Si hay error al crear el pago

    Estado inicial típico:
    - `status = CREATED`
    - `provider_transaction_id = NULL` (aún no existe transacción en Wompi)
    Luego `attach_transaction_id` y/o webhook completan la trazabilidad.
    """
    try:
        amount = Decimal(amount_in_cents) / 100
        
        query = text("""
            INSERT INTO tab_pagos (
                id_orden,
                reference,
                provider_name,
                provider_transaction_id,
                amount,
                currency_id,
                status,
                status_detail,
                estado_procesamiento,
                parent_payment_id,
                usr_insert,
                fec_insert
            ) VALUES (
                :id_orden,
                :reference,
                'wompi',
                NULL,
                :amount,
                :currency,
                :status,
                'payment_created',
                'pendiente',
                :parent_payment_id,
                :usr_insert,
                NOW()
            ) RETURNING id_pago
        """)
        
        result = db.execute(query, {
            "id_orden": order_id,
            "reference": reference,
            "amount": amount,
            "currency": currency,
            "status": status,
            "parent_payment_id": parent_payment_id,
            "usr_insert": usr_insert
        })
        
        payment_id = result.scalar()
        db.commit()
        
        logger.info(f"Payment creado: id_pago={payment_id}, reference={reference}, order_id={order_id}")
        return payment_id
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error al crear payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_safe_message(e),
        )


def get_payment_by_reference(db: Session, reference: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene un payment por su reference.
    
    Args:
        db: Sesión de base de datos
        reference: Referencia única del pago
        
    Returns:
        Dict con los datos del pago o `None` si no existe.

    Uso principal en endpoints:
    - validación de idempotencia,
    - polling por referencia,
    - confirmación de checkout,
    - webhook.
    """
    logger.info(f"🔍 [BUSCAR] Buscando payment por reference: {reference}")
    try:
        query = text("""
            SELECT 
                id_pago,
                id_orden,
                reference,
                provider_transaction_id,
                status,
                amount,
                currency_id,
                payment_method_type,
                raw_last_event,
                parent_payment_id
            FROM tab_pagos
            WHERE reference = :reference
        """)
        
        logger.info(f"🔍 [BUSCAR] Ejecutando query para reference: {reference}")
        result = db.execute(query, {"reference": reference})
        row = result.fetchone()
        
        if not row:
            logger.warn(f"⚠️ [BUSCAR] Payment NO encontrado para reference: {reference}")
            return None
        
        payment_dict = dict(row._mapping)
        logger.info(f"✅ [BUSCAR] Payment encontrado: id_pago={payment_dict.get('id_pago')}, id_orden={payment_dict.get('id_orden')}, status={payment_dict.get('status')}, provider_transaction_id={payment_dict.get('provider_transaction_id')}")
        return payment_dict
        
    except Exception as e:
        logger.error(f"❌ [BUSCAR] Error al obtener payment por reference {reference}: {str(e)}")
        import traceback
        logger.error(f"❌ [BUSCAR] Traceback: {traceback.format_exc()}")
        return None


def attach_transaction_id(
    db: Session,
    reference: str,
    transaction_id: str
) -> bool:
    """
    Asocia un transaction_id de Wompi a un payment.
    
    Args:
        db: Sesión de base de datos
        reference: Referencia única del pago
        transaction_id: ID de la transacción en Wompi
        
    Returns:
        bool: True si se actualizó correctamente
        
    Raises:
        HTTPException: Si hay error

    Regla de negocio:
    - Si el pago estaba en `CREATED`, pasa a `PENDING` al asociar transaction_id.
    - Incluye verificación posterior para asegurar persistencia real.
    """
    logger.info(f"🔍 attach_transaction_id: reference={reference}, transaction_id={transaction_id}")
    
    try:
        # Validación adicional de parámetros.
        if not transaction_id or not isinstance(transaction_id, str) or len(transaction_id.strip()) == 0:
            logger.error(f"❌ transaction_id inválido en attach_transaction_id: {transaction_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="transaction_id debe ser un string no vacío"
            )
        
        transaction_id = transaction_id.strip()
        
        if not reference or not isinstance(reference, str) or len(reference.strip()) == 0:
            logger.error(f"❌ reference inválido en attach_transaction_id: {reference}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="reference debe ser un string no vacío"
            )
        
        reference = reference.strip()
        
        logger.info(f"🔍 Ejecutando UPDATE para attach transaction_id: reference={reference}, transaction_id={transaction_id}")
        
        query = text("""
            UPDATE tab_pagos
            SET 
                provider_transaction_id = :transaction_id,
                status = CASE 
                    WHEN status = 'CREATED' THEN 'PENDING'
                    ELSE status
                END,
                fec_update = NOW()
            WHERE reference = :reference
            RETURNING id_pago
        """)
        
        result = db.execute(query, {
            "reference": reference,
            "transaction_id": transaction_id
        })
        
        payment_id = result.scalar()
        rows_affected = result.rowcount
        
        logger.info(f"🔍 UPDATE ejecutado: payment_id={payment_id}, rows_affected={rows_affected}")
        
        if not payment_id:
            logger.error(f"❌ Payment no encontrado para reference: {reference}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment con reference {reference} no encontrado"
            )
        
        if rows_affected == 0:
            logger.error(f"❌ ERROR CRÍTICO: UPDATE no afectó ninguna fila para reference: {reference}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error: No se pudo actualizar el payment con reference {reference}"
            )
        
        logger.info(f"✅ UPDATE exitoso: payment_id={payment_id}, rows_affected={rows_affected}")
        
        db.commit()
        logger.info(f"✅ COMMIT realizado para payment_id={payment_id}")
        
        # Verificación post-commit para asegurar persistencia real.
        verify_query = text("""
            SELECT provider_transaction_id, status 
            FROM tab_pagos 
            WHERE reference = :reference
        """)
        verify_result = db.execute(verify_query, {"reference": reference})
        verify_row = verify_result.fetchone()
        
        if verify_row:
            saved_transaction_id = verify_row.provider_transaction_id
            saved_status = verify_row.status
            logger.info(f"✅ Transaction ID attachado y verificado: reference={reference}, transaction_id={transaction_id}, status={saved_status}")
            
            if saved_transaction_id != transaction_id:
                logger.error(f"❌ ERROR CRÍTICO: Transaction ID no coincide. Esperado: {transaction_id}, Guardado: {saved_transaction_id}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al guardar transaction_id: no coincide con el valor esperado"
                )
        else:
            logger.error(f"❌ ERROR CRÍTICO: No se pudo verificar el payment después del attach")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al verificar transaction_id después del attach"
            )
        
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error al attachar transaction_id: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_safe_message(e),
        )


async def poll_transaction_status(
    transaction_id: str,
    wompi_config: StoreWompiConfig,
    max_duration: int = 30,
    interval: int = 2
) -> Dict[str, Any]:
    """
    Consulta periódicamente el estado de una transacción en Wompi.
    
    Args:
        transaction_id: ID de la transacción en Wompi
        wompi_config: Configuración de Wompi del tenant
        max_duration: Duración máxima del polling en segundos (default: 30)
        interval: Intervalo entre consultas en segundos (default: 2)
        
    Returns:
        Dict con el estado de la transacción
        
    Raises:
        HTTPException: Si hay error al consultar Wompi

    Salidas esperadas:
    - Estado final: `APPROVED`, `DECLINED`, `VOIDED`, `ERROR`
    - Sin resolución en ventana de tiempo: `PENDING`
    - Degradación por disponibilidad: `ERROR`
    """
    base_url = get_wompi_base_url(wompi_config.wompi_environment)
    url = f"{base_url}/transactions/{transaction_id}"

    # Esta consulta a Wompi no requiere autenticación adicional.
    headers = {"Content-Type": "application/json"}

    max_attempts = max_duration // interval

    async with httpx.AsyncClient(timeout=10.0) as client:
        for attempt in range(max_attempts):
            try:
                async def _do_request():
                    return await client.get(url, headers=headers)

                response = await run_with_circuit_breaker(
                    key=url,
                    call=_do_request,
                    failure_predicate=lambda r: r is not None and (r.status_code >= 500 or r.status_code == 429),
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Transacción no encontrada",
                    )
                if response.status_code >= 400:
                    # No abrimos circuit por 4xx (solo por 5xx/429 vía predicado).
                    logger.warning(
                        f"Wompi devolvió HTTP {response.status_code} al consultar transacción (poll): {transaction_id}"
                    )
                    # Trátalo como error final para no dejar pagos colgados.
                    return {"status": "ERROR", "transaction_id": transaction_id, "data": {}}

                data = response.json()

                transaction_data = data.get("data", {})
                current_status = transaction_data.get("status")

                # Log para debugging del método de pago
                if transaction_data:
                    logger.debug(
                        f"Transaction data recibida de Wompi: {json.dumps(transaction_data, indent=2, default=str)}"
                    )
                    if "payment_method" in transaction_data:
                        logger.info(f"Método de pago en respuesta: {transaction_data['payment_method']}")

                # Si llega a estado final, retornar de inmediato.
                if current_status in ["APPROVED", "DECLINED", "VOIDED", "ERROR"]:
                    logger.info(f"Estado final obtenido: transaction_id={transaction_id}, status={current_status}")
                    return {
                        "status": current_status,
                        "transaction_id": transaction_id,
                        "data": transaction_data,
                    }

                # Si sigue PENDING, esperar antes del siguiente intento.
                if attempt < max_attempts - 1:
                    await asyncio.sleep(interval)

            except CircuitOpenError:
                logger.warning("Circuit breaker abierto: poll_transaction_status degradado a ERROR.")
                return {"status": "ERROR", "transaction_id": transaction_id, "data": {}}
            except HTTPException as e:
                if e.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
                    return {"status": "ERROR", "transaction_id": transaction_id, "data": {}}
                raise
            except Exception as e:
                logger.error(f"Error inesperado al consultar transacción: {str(e)}")
                if attempt == max_attempts - 1:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=get_safe_message(e),
                    )
                await asyncio.sleep(interval)

    # Si llega aquí, terminó el tiempo sin estado final.
    logger.info(f"Polling terminado sin estado final: transaction_id={transaction_id}")
    return {"status": "PENDING", "transaction_id": transaction_id, "data": {}}


def update_payment_status(
    db: Session,
    reference: str,
    status: str,
    transaction_data: Optional[Dict[str, Any]] = None,
    mark_order_paid: bool = False
) -> bool:
    """
    Actualiza el estado de un payment y opcionalmente marca la orden como pagada.
    
    Args:
        db: Sesión de base de datos
        reference: Referencia única del pago
        status: Nuevo estado
        transaction_data: Datos completos de la transacción (para raw_last_event)
        mark_order_paid: Si True, marca la orden como pagada cuando status es APPROVED
        
    Returns:
        bool: True si se actualizó correctamente
        
    Raises:
        HTTPException: Si hay error

    Qué actualiza:
    - Tabla `tab_pagos` (status, método, raw event, timestamps de proveedor).
    - Opcionalmente `tab_ordenes` cuando corresponde pago aprobado.

    Integridad transaccional:
    - Agrupa update de pago y orden en un mismo commit para evitar estados
      parciales (por ejemplo, pago aprobado sin orden actualizada).
    """
    try:
        import json
        
        # Obtener pago para resolver `order_id` asociado.
        payment = get_payment_by_reference(db, reference)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment con reference {reference} no encontrado"
            )
        
        order_id = payment.get("id_orden")
        if order_id is None:
            logger.error(f"❌ Payment con reference {reference} no tiene id_orden")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Payment con reference {reference} no tiene id_orden asociado"
            )
        
        # Asegurar que `order_id` sea numérico.
        if isinstance(order_id, Decimal):
            order_id = int(order_id)
        elif not isinstance(order_id, int):
            try:
                order_id = int(order_id)
            except (ValueError, TypeError):
                logger.error(f"❌ order_id inválido: {order_id} (tipo: {type(order_id)})")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"order_id inválido en payment: {order_id}"
                )
        
        logger.info(f"🔍 update_payment_status: reference={reference}, status={status}, order_id={order_id} (tipo: {type(order_id)}), mark_order_paid={mark_order_paid}")
        
        # Verificar que la orden exista antes de actualizarla.
        if mark_order_paid and status == "APPROVED":
            check_order_query = text("SELECT id_orden, ind_estado FROM tab_ordenes WHERE id_orden = :order_id")
            check_order_result = db.execute(check_order_query, {"order_id": order_id})
            check_order_row = check_order_result.fetchone()
            if not check_order_row:
                logger.error(f"❌ ERROR CRÍTICO: La orden {order_id} NO EXISTE en la base de datos")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"La orden {order_id} asociada al payment no existe"
                )
            logger.info(f"✅ Orden {order_id} existe, estado actual: {check_order_row.ind_estado}")
        
        # Preparar campos para actualización en `tab_pagos`.
        update_fields = {
            "reference": reference,
            "status": status,
            "fec_update": "NOW()"
        }
        
        # Extraer método de pago desde `transaction_data`.
        payment_method_type = None
        payment_method_name = None
        
        if transaction_data:
            # Log completo para debugging
            logger.info(f"Transaction data completo: {json.dumps(transaction_data, indent=2, default=str)}")
            
            # Intentar extracción desde distintas estructuras posibles de Wompi.
            pm = None
            if "payment_method" in transaction_data:
                pm = transaction_data["payment_method"]
            elif "payment_method_type" in transaction_data:
                # Algunas respuestas incluyen el tipo directamente.
                payment_method_type = transaction_data["payment_method_type"]
                if payment_method_type:
                    payment_method_name = get_payment_method_name(payment_method_type)
                    logger.info(f"Método de pago extraído de payment_method_type: type={payment_method_type}, name={payment_method_name}")
            
            # Si `payment_method` viene como objeto.
            if pm:
                if isinstance(pm, dict):
                    payment_method_type = pm.get("type") or pm.get("payment_method_type")
                    if payment_method_type:
                        payment_method_name = get_payment_method_name(payment_method_type)
                        logger.info(f"Método de pago extraído: type={payment_method_type}, name={payment_method_name}")
                elif isinstance(pm, str):
                    # Si `payment_method` viene como string directo.
                    payment_method_type = pm
                    payment_method_name = get_payment_method_name(payment_method_type)
                    logger.info(f"Método de pago extraído (string): type={payment_method_type}, name={payment_method_name}")
            
            # Si aún no hay método, intentar inferencia mínima.
            if not payment_method_type:
                # Si existe `payment_source`, se asume tarjeta.
                if "payment_source" in transaction_data:
                    payment_method_type = "CARD"  # Si hay payment_source, es una tarjeta
                    payment_method_name = get_payment_method_name("CARD")
                    logger.info(f"Método de pago inferido de payment_source: CARD")
            
            update_fields["payment_method_type"] = payment_method_type
            update_fields["raw_last_event"] = json.dumps(transaction_data)
            
            # Log final
            if payment_method_type:
                logger.info(f"✅ Método de pago final: type={payment_method_type}, name={payment_method_name}")
            else:
                logger.warning(f"⚠️ No se pudo extraer el método de pago de la transacción")
        
        # Actualizar registro de pago.
        set_clauses = []
        params = {"reference": reference, "status": status}
        
        if transaction_data:
            # Agregar `payment_method_type` solo cuando exista.
            if update_fields.get("payment_method_type") is not None:
                params["payment_method_type"] = update_fields.get("payment_method_type")
                set_clauses.append("payment_method_type = :payment_method_type")
                logger.info(f"🔍 Agregando payment_method_type al UPDATE: {update_fields.get('payment_method_type')}")
            # Guardar evento crudo para auditoría/troubleshooting.
            if update_fields.get("raw_last_event"):
                params["raw_last_event"] = update_fields.get("raw_last_event")
                set_clauses.append("raw_last_event = CAST(:raw_last_event AS jsonb)")
        
        set_clauses.append("status = :status")
        set_clauses.append("fec_update = NOW()")
        
        if status == "APPROVED":
            set_clauses.append("estado_procesamiento = 'procesado'")
            set_clauses.append("provider_date_approved = NOW()")
        elif status in ["DECLINED", "VOIDED", "ERROR"]:
            set_clauses.append("estado_procesamiento = 'error'")
        
        query = text(f"""
            UPDATE tab_pagos
            SET {', '.join(set_clauses)}
            WHERE reference = :reference
        """)
        
        db.execute(query, params)
        
        # Marcar orden pagada si corresponde (idempotente).
        logger.info(f"🔍 Verificando si marcar orden como pagada: mark_order_paid={mark_order_paid}, status={status}")
        if mark_order_paid and status == "APPROVED":
            logger.info(f"✅ Condición cumplida: marcando orden {order_id} como pagada")
            try:
                # Convertir método Wompi a valor permitido por el CHECK de BD.
                metodo_pago_orden = get_payment_method_for_db(payment_method_type) if payment_method_type else "transferencia"
                logger.info(f"🔍 Método de pago a guardar en BD: {metodo_pago_orden} (wompi_type={payment_method_type}, display_name={payment_method_name})")
                
                # No hacer commit aquí; se confirma junto con actualización de pago.
                logger.info(f"🔍 Llamando a update_order_payment_info para orden {order_id} (tipo: {type(order_id)})")
                logger.info(f"🔍 Parámetros: metodo_pago={metodo_pago_orden}, ind_estado=2, commit=False")
                
                # Convertir `order_id` a Decimal para compatibilidad de servicio.
                order_id_decimal = Decimal(str(order_id))
                logger.info(f"🔍 order_id convertido a Decimal: {order_id_decimal} (tipo: {type(order_id_decimal)})")
                
                order_service.update_order_payment_info(
                    db,
                    order_id_decimal,
                    metodo_pago=metodo_pago_orden,
                    ind_estado=2,  # 2 = procesada/aprobada
                    commit=False,  # Commit agrupado al final de la transacción.
                )
                logger.info(f"✅ update_order_payment_info completado para orden {order_id}")
            except Exception as e:
                logger.error(f"❌ Error al marcar orden como pagada: {str(e)}")
                # Se relanza para trazabilidad; evita silencios en flujo crítico.
                import traceback
                logger.error(f"Traceback completo: {traceback.format_exc()}")
                # Re-lanzar para que quede visible en logs/monitoreo.
                raise
        
        # Commit atómico de todos los cambios (pago + orden).
        try:
            db.commit()
            logger.info(f"✅ COMMIT exitoso: reference={reference}, status={status}, order_id={order_id}")
            
            # Verificación post-commit para confirmar consistencia final.
            if mark_order_paid and status == "APPROVED":
                verify_query = text("""
                    SELECT ind_estado, metodo_pago 
                    FROM tab_ordenes 
                    WHERE id_orden = :order_id
                """)
                verify_result = db.execute(verify_query, {"order_id": order_id})
                verify_row = verify_result.fetchone()
                if verify_row:
                    logger.info(f"✅ Verificación post-commit: orden {order_id} - estado={verify_row.ind_estado}, metodo_pago={verify_row.metodo_pago}")
                    if verify_row.ind_estado != 2:
                        logger.error(f"❌ ERROR CRÍTICO: La orden {order_id} NO se actualizó a estado 2. Estado actual: {verify_row.ind_estado}")
                    if not verify_row.metodo_pago:
                        logger.warning(f"⚠️ ADVERTENCIA: La orden {order_id} no tiene método de pago guardado")
                    if verify_row.ind_estado == 2:
                        try:
                            notify_after_order_paid_stock_change(db, Decimal(str(order_id)))
                        except Exception as oos_err:
                            logger.warning(
                                "Notificación sin stock post-pago (commit agrupado) omitida: %s",
                                oos_err,
                            )
                else:
                    logger.error(f"❌ ERROR CRÍTICO: No se encontró la orden {order_id} después del commit")
            
        except Exception as commit_error:
            logger.error(f"❌ Error en COMMIT: {str(commit_error)}")
            db.rollback()
            raise
        
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error al actualizar payment status: {str(e)}")
        from fastapi import status as http_status
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_safe_message(e),
        )


def get_last_payment_for_order(
    db: Session,
    order_id: int
) -> Optional[Dict[str, Any]]:
    """
    Obtiene el último payment de una orden.
    
    Args:
        db: Sesión de base de datos
        order_id: ID de la orden
        
    Returns:
        Dict con los datos del último pago o `None` si no existe.

    Uso típico:
    - endpoint de reintento (`/payments/reattempt`) para validar si el último
      estado permite generar un nuevo intento.
    """
    try:
        query = text("""
            SELECT 
                id_pago,
                id_orden,
                reference,
                provider_transaction_id,
                status,
                amount,
                currency_id,
                payment_method_type,
                parent_payment_id
            FROM tab_pagos
            WHERE id_orden = :order_id
            ORDER BY fec_insert DESC
            LIMIT 1
        """)
        
        result = db.execute(query, {"order_id": order_id})
        row = result.fetchone()
        
        if not row:
            return None
        
        return dict(row._mapping)
        
    except Exception as e:
        logger.error(f"Error al obtener último payment: {str(e)}")
        return None

