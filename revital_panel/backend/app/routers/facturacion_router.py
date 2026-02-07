"""
Router de Facturacion.

Define los endpoints CRUD para la gestion de facturas.
"""
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
import logging

from core.database import get_db
from core.dependencies import get_current_user, require_admin_revital
from core.config import settings
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.facturacion_schema import (
    FacturaCabeceraCreate,
    FacturaCabeceraUpdate,
    FacturaPublic,
    FacturaConDetalle,
    FacturaDetalleCreate,
    StripeCheckoutSessionResponse
)
from services import facturacion_service
from services import stripe_service
from services.pdf_service import generate_invoice_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/billing", tags=["Billing"])


@router.get("", response_model=List[FacturaPublic])
def get_facturas(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las facturas.
    
    Admins de Revital ven todas las facturas.
    Clientes solo ven sus propias facturas.
    """
    if current_user.user_type == "admin_revital":
        facturas = facturacion_service.get_facturas(db)
    else:
        facturas = facturacion_service.get_facturas(db, current_user.identificacion_fiscal)
    
    return [FacturaPublic(**dict(f)) for f in facturas]


@router.get("/pending", response_model=List[dict])
def get_facturas_pendientes(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las facturas pendientes de pago.
    
    Admins de Revital ven todas.
    Clientes solo ven sus propias facturas pendientes.
    """
    if current_user.user_type == "admin_revital":
        facturas = facturacion_service.get_facturas_pendientes(db)
    else:
        facturas = facturacion_service.get_facturas_pendientes(db, current_user.identificacion_fiscal)
    
    return [dict(f) for f in facturas]


@router.get("/{id_factura}", response_model=FacturaConDetalle)
def get_factura(
    id_factura: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene una factura especifica con sus detalles.
    
    Clientes solo pueden ver sus propias facturas.
    """
    factura = facturacion_service.get_factura(db, id_factura)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    # Verificar permisos
    if current_user.user_type == "cliente" and factura.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta factura"
        )
    
    # Obtener detalles
    detalles = facturacion_service.get_factura_detalles(db, id_factura)
    
    factura_dict = dict(factura)
    factura_dict["detalles"] = [dict(d) for d in detalles]

    return FacturaConDetalle(**factura_dict)


@router.get("/{id_factura}/pdf")
def get_factura_pdf(
    id_factura: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Genera y devuelve el PDF de una factura.

    Clientes solo pueden descargar sus propias facturas.
    """
    factura = facturacion_service.get_factura(db, id_factura)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )

    if current_user.user_type == "cliente" and factura.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para descargar esta factura"
        )

    detalles = facturacion_service.get_factura_detalles(db, id_factura)
    factura_dict = dict(factura)
    detalles_list = [dict(d) for d in detalles]

    try:
        pdf_bytes = generate_invoice_pdf(factura_dict, detalles_list)
    except Exception as e:
        logger.exception("Error generating invoice PDF: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al generar PDF"
        ) from e

    num_factura = factura.get("num_factura") or id_factura
    filename = f"factura-{num_factura}.pdf".replace(" ", "-")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.post("", response_model=ResponseMessage)
def create_factura(
    factura: FacturaCabeceraCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Crea una nueva factura.
    
    Solo accesible para admins de Revital.
    """
    result = facturacion_service.create_factura(db, factura, current_user.email)
    
    if result and result.get("success"):
        # Si hay detalles, agregarlos
        if factura.detalles:
            for detalle in factura.detalles:
                facturacion_service.create_factura_detalle(
                    db, 
                    result.get("id_factura"), 
                    detalle, 
                    current_user.email
                )
        
        return ResponseMessage(
            message=f"Factura creada correctamente: {result.get('num_factura')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear factura") if result else "Error al crear factura"
        )


@router.post("/{id_factura}/details", response_model=ResponseMessage)
def add_factura_detalle(
    id_factura: Decimal,
    detalle: FacturaDetalleCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Agrega una linea de detalle a una factura.
    
    Solo accesible para admins de Revital.
    """
    factura = facturacion_service.get_factura(db, id_factura)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    result = facturacion_service.create_factura_detalle(db, id_factura, detalle, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Detalle agregado correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al agregar detalle") if result else "Error al agregar detalle"
        )


@router.put("/{id_factura}", response_model=ResponseMessage)
def update_factura(
    id_factura: Decimal,
    factura: FacturaCabeceraUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Actualiza una factura existente.
    
    Solo accesible para admins de Revital.
    """
    existing = facturacion_service.get_factura(db, id_factura)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    result = facturacion_service.update_factura(db, id_factura, factura, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Factura actualizada correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al actualizar factura") if result else "Error al actualizar factura"
        )


@router.delete("/{id_factura}", response_model=ResponseMessage)
def delete_factura(
    id_factura: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Elimina una factura (soft delete).
    
    Solo accesible para admins de Revital.
    """
    existing = facturacion_service.get_factura(db, id_factura)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    result = facturacion_service.delete_factura(db, id_factura)
    
    if result and result.get("success"):
        return ResponseMessage(message="Factura eliminada correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al eliminar factura") if result else "Error al eliminar factura"
        )


@router.post("/{id_factura}/create-checkout-session", response_model=StripeCheckoutSessionResponse)
def create_checkout_session(
    id_factura: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una sesión de Stripe Checkout para pagar una factura pendiente.
    
    Requiere autenticación. Los clientes solo pueden pagar sus propias facturas.
    Los admins pueden pagar cualquier factura.
    """
    # Verificar que la factura existe
    factura = facturacion_service.get_factura(db, id_factura)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    # Verificar permisos: cliente solo puede pagar sus propias facturas
    if current_user.user_type == "cliente":
        if factura.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para pagar esta factura"
            )
    
    # Verificar que la factura está pendiente
    if factura.get("estado_pago") != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoice is not pending. Current status: {factura.get('estado_pago')}"
        )
    
    # Construir URLs de éxito y cancelación
    locale_prefix = ""  # Se puede obtener del request si es necesario
    success_url = f"{settings.FRONTEND_URL}{locale_prefix}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{settings.FRONTEND_URL}{locale_prefix}/billing/{id_factura}"
    
    # Crear checkout session
    result = stripe_service.create_checkout_session(
        db=db,
        id_factura=id_factura,
        success_url=success_url,
        cancel_url=cancel_url
    )
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return StripeCheckoutSessionResponse(
        checkout_url=result["checkout_url"],
        session_id=result.get("session_id")
    )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Endpoint para recibir webhooks de Stripe.
    
    Este endpoint NO requiere autenticación, solo verificación de firma de Stripe.
    Maneja los eventos:
    - checkout.session.completed
    - payment_intent.succeeded
    - payment_intent.payment_failed
    """
    try:
        # Obtener el raw body y la firma
        payload = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not signature:
            logger.warning("Webhook request without Stripe-Signature header")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe-Signature header"
            )
        
        # Verificar firma y obtener evento
        event = stripe_service.verify_webhook_signature(payload, signature)
        
        if not event:
            logger.warning("Invalid webhook signature")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
        
        # Manejar diferentes tipos de eventos
        event_type = event.get("type")
        logger.info(f"Received Stripe webhook event: {event_type}")
        
        if event_type == "checkout.session.completed":
            result = stripe_service.handle_checkout_completed(db, event)
            if "error" in result:
                logger.error(f"Error handling checkout.completed: {result['error']}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=result["error"]
                )
            return {"status": "success", "message": result.get("message", "Invoice updated")}
        
        elif event_type == "payment_intent.succeeded":
            result = stripe_service.handle_payment_intent_succeeded(db, event)
            if "error" in result:
                logger.error(f"Error handling payment_intent.succeeded: {result['error']}")
                # No lanzar excepción aquí, solo loggear, ya que checkout.session.completed es el evento principal
                return {"status": "warning", "message": result.get("error")}
            return {"status": "success", "message": result.get("message", "Invoice updated")}
        
        elif event_type == "payment_intent.payment_failed":
            result = stripe_service.handle_payment_intent_failed(db, event)
            if "error" in result:
                logger.error(f"Error handling payment_intent.payment_failed: {result['error']}")
                return {"status": "warning", "message": result.get("error")}
            return {"status": "success", "message": result.get("message", "Invoice marked as failed")}
        
        else:
            logger.info(f"Unhandled event type: {event_type}")
            return {"status": "ignored", "message": f"Event type {event_type} not handled"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook: {str(e)}"
        )
