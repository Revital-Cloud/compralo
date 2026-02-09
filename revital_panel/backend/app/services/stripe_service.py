"""
Módulo de Servicios de Stripe.

Este módulo contiene la lógica de negocio para gestionar pagos con Stripe,
incluyendo creación de Checkout Sessions y manejo de webhooks.
"""
import stripe
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import logging

from core.config import settings
from services import facturacion_service

# Configurar logging
logger = logging.getLogger(__name__)

# Inicializar Stripe con la clave secreta
stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(
    db: Session,
    id_factura: Decimal,
    success_url: str,
    cancel_url: str
) -> Dict[str, Any]:
    """
    Crea una sesión de Checkout en Stripe para una factura.
    
    Args:
        db: Sesión de base de datos
        id_factura: ID de la factura a pagar
        success_url: URL a la que redirigir después de pago exitoso
        cancel_url: URL a la que redirigir si se cancela el pago
        
    Returns:
        Dict con checkout_url o error
        
    Raises:
        Exception: Si hay error al crear la sesión
    """
    try:
        # Obtener factura
        factura = facturacion_service.get_factura(db, id_factura)
        if not factura:
            return {"error": "Invoice not found"}
        
        # Validar que la factura esté pendiente
        if factura.get("estado_pago") != "pendiente":
            return {"error": f"Invoice is not pending. Current status: {factura.get('estado_pago')}"}
        
        # Convertir monto a centavos (Stripe usa enteros)
        total_decimal = Decimal(str(factura.get("total", 0)))
        amount_cents = int(float(total_decimal) * 100)
        
        # Obtener moneda
        currency = factura.get("moneda", "USD").lower()
        
        # Crear Checkout Session en Stripe
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": currency,
                    "product_data": {
                        "name": f"Factura {factura.get('num_factura')}",
                        "description": f"Pago de factura {factura.get('num_factura')}",
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "id_factura": str(id_factura),
                "id_suscripcion": str(factura.get("id_suscripcion", "")),
                "num_factura": factura.get("num_factura", ""),
                "identificacion_fiscal_cliente": factura.get("identificacion_fiscal_cliente", ""),
            },
            client_reference_id=str(id_factura),
        )
        
        logger.info(f"Checkout session created for invoice {id_factura}: {checkout_session.id}")
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {str(e)}")
        return {"error": f"Stripe error: {str(e)}"}
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        return {"error": f"Error creating checkout session: {str(e)}"}


def verify_webhook_signature(payload: bytes, signature: str) -> Optional[Dict[str, Any]]:
    """
    Verifica la firma del webhook de Stripe.
    
    Args:
        payload: Cuerpo raw del request (bytes)
        signature: Header 'Stripe-Signature' del request
        
    Returns:
        Evento de Stripe si la firma es válida, None si no lo es
    """
    try:
        if not settings.STRIPE_WEBHOOK_SECRET:
            logger.warning("STRIPE_WEBHOOK_SECRET not configured, skipping signature verification")
            return None
        
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            settings.STRIPE_WEBHOOK_SECRET
        )
        return event
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        return None
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        return None


def handle_checkout_completed(db: Session, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Maneja el evento checkout.session.completed de Stripe.
    
    Args:
        db: Sesión de base de datos
        event: Evento de Stripe
        
    Returns:
        Dict con resultado de la operación
    """
    try:
        session = event["data"]["object"]
        
        # Obtener metadata
        metadata = session.get("metadata", {})
        id_factura_str = metadata.get("id_factura") or session.get("client_reference_id")
        
        if not id_factura_str:
            logger.error("No id_factura found in checkout session metadata")
            return {"error": "No invoice ID found in session"}
        
        id_factura = Decimal(id_factura_str)
        
        # Verificar que la factura existe y está pendiente
        factura = facturacion_service.get_factura(db, id_factura)
        if not factura:
            logger.error(f"Invoice {id_factura} not found")
            return {"error": f"Invoice {id_factura} not found"}
        
        # Verificar que no esté ya pagada (idempotencia)
        if factura.get("estado_pago") == "pagado":
            logger.info(f"Invoice {id_factura} already paid, skipping")
            return {"success": True, "message": "Invoice already paid"}
        
        # Obtener payment_intent para referencia
        payment_intent_id = session.get("payment_intent")
        
        # Actualizar factura
        from schemas.facturacion_schema import FacturaCabeceraUpdate
        
        factura_update = FacturaCabeceraUpdate(
            estado_pago="pagado",
            metodo_pago="stripe",
            fecha_pago=datetime.utcnow(),
            referencia_pago=payment_intent_id or session.get("id", ""),
        )
        
        result = facturacion_service.update_factura(
            db,
            id_factura,
            factura_update,
            "stripe_webhook"
        )
        
        if result and result.get("success"):
            logger.info(f"Invoice {id_factura} marked as paid via Stripe")
            return {"success": True, "message": f"Invoice {id_factura} updated successfully"}
        else:
            logger.error(f"Error updating invoice {id_factura}: {result}")
            return {"error": "Error updating invoice"}
            
    except Exception as e:
        logger.error(f"Error handling checkout.completed event: {str(e)}")
        return {"error": f"Error processing event: {str(e)}"}


def handle_payment_intent_succeeded(db: Session, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Maneja el evento payment_intent.succeeded de Stripe.
    
    Este evento se dispara cuando un pago se completa exitosamente.
    Puede ser usado como respaldo del checkout.session.completed.
    
    Args:
        db: Sesión de base de datos
        event: Evento de Stripe
        
    Returns:
        Dict con resultado de la operación
    """
    try:
        payment_intent = event["data"]["object"]
        
        # Buscar metadata o client_reference_id
        metadata = payment_intent.get("metadata", {})
        id_factura_str = metadata.get("id_factura")
        
        # Si no hay metadata, intentar obtener de la sesión de checkout asociada
        if not id_factura_str:
            # El payment_intent puede tener una referencia a la sesión
            # Por ahora, si no hay metadata, no podemos asociarlo directamente
            logger.warning("No id_factura found in payment_intent metadata")
            return {"error": "No invoice ID found in payment intent"}
        
        id_factura = Decimal(id_factura_str)
        
        # Verificar que la factura existe
        factura = facturacion_service.get_factura(db, id_factura)
        if not factura:
            logger.error(f"Invoice {id_factura} not found")
            return {"error": f"Invoice {id_factura} not found"}
        
        # Verificar que no esté ya pagada (idempotencia)
        if factura.get("estado_pago") == "pagado":
            logger.info(f"Invoice {id_factura} already paid, skipping")
            return {"success": True, "message": "Invoice already paid"}
        
        # Actualizar factura
        from schemas.facturacion_schema import FacturaCabeceraUpdate
        
        factura_update = FacturaCabeceraUpdate(
            estado_pago="pagado",
            metodo_pago="stripe",
            fecha_pago=datetime.utcnow(),
            referencia_pago=payment_intent.get("id", ""),
        )
        
        result = facturacion_service.update_factura(
            db,
            id_factura,
            factura_update,
            "stripe_webhook"
        )
        
        if result and result.get("success"):
            logger.info(f"Invoice {id_factura} marked as paid via Stripe payment_intent")
            return {"success": True, "message": f"Invoice {id_factura} updated successfully"}
        else:
            logger.error(f"Error updating invoice {id_factura}: {result}")
            return {"error": "Error updating invoice"}
            
    except Exception as e:
        logger.error(f"Error handling payment_intent.succeeded event: {str(e)}")
        return {"error": f"Error processing event: {str(e)}"}


def handle_payment_intent_failed(db: Session, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Maneja el evento payment_intent.payment_failed de Stripe.
    
    Este evento se dispara cuando un pago falla.
    
    Args:
        db: Sesión de base de datos
        event: Evento de Stripe
        
    Returns:
        Dict con resultado de la operación
    """
    try:
        payment_intent = event["data"]["object"]
        
        # Buscar metadata
        metadata = payment_intent.get("metadata", {})
        id_factura_str = metadata.get("id_factura")
        
        if not id_factura_str:
            logger.warning("No id_factura found in payment_intent metadata for failed payment")
            return {"error": "No invoice ID found"}
        
        id_factura = Decimal(id_factura_str)
        
        # Verificar que la factura existe
        factura = facturacion_service.get_factura(db, id_factura)
        if not factura:
            logger.error(f"Invoice {id_factura} not found")
            return {"error": f"Invoice {id_factura} not found"}
        
        # Solo actualizar si está pendiente (no cambiar si ya está pagada o fallida)
        if factura.get("estado_pago") == "pendiente":
            from schemas.facturacion_schema import FacturaCabeceraUpdate
            
            factura_update = FacturaCabeceraUpdate(
                estado_pago="fallido",
                metodo_pago="stripe",
                referencia_pago=payment_intent.get("id", ""),
            )
            
            result = facturacion_service.update_factura(
                db,
                id_factura,
                factura_update,
                "stripe_webhook"
            )
            
            if result and result.get("success"):
                logger.info(f"Invoice {id_factura} marked as failed via Stripe")
                return {"success": True, "message": f"Invoice {id_factura} marked as failed"}
            else:
                logger.error(f"Error updating invoice {id_factura}: {result}")
                return {"error": "Error updating invoice"}
        else:
            logger.info(f"Invoice {id_factura} is not pending, skipping update")
            return {"success": True, "message": "Invoice status not changed"}
            
    except Exception as e:
        logger.error(f"Error handling payment_intent.payment_failed event: {str(e)}")
        return {"error": f"Error processing event: {str(e)}"}
