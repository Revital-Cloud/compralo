"""
Router de Suscripciones.

Define los endpoints CRUD para la gestion de suscripciones.
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.config import settings
from core.dependencies import get_current_user, require_admin_synkro
from schemas.auth_schema import UserInToken, ResponseMessage
from schemas.suscripcion_schema import SuscripcionCreate, SuscripcionUpdate, SuscripcionPublic, CrearPrimeraSuscripcionResponse
from schemas.facturacion_schema import FacturaCabeceraCreate, FacturaDetalleCreate
from services import suscripcion_service
from services import facturacion_service
from services import stripe_service

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[SuscripcionPublic])
def get_suscripciones(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las suscripciones.
    
    Admins de Synkro ven todas las suscripciones.
    Clientes solo ven sus propias suscripciones.
    """
    if current_user.user_type == "admin_synkro":
        suscripciones = suscripcion_service.get_suscripciones(db)
    else:
        suscripciones = suscripcion_service.get_suscripciones(db, current_user.identificacion_fiscal)
    
    return [SuscripcionPublic(**dict(s)) for s in suscripciones]


@router.get("/active", response_model=List[dict])
def get_suscripciones_activas(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las suscripciones activas con informacion del plan.
    
    Admins de Synkro ven todas.
    Clientes solo ven sus propias suscripciones activas.
    """
    if current_user.user_type == "admin_synkro":
        suscripciones = suscripcion_service.get_suscripciones_activas(db)
    else:
        suscripciones = suscripcion_service.get_suscripciones_activas(db, current_user.identificacion_fiscal)
    
    return [dict(s) for s in suscripciones]


@router.get("/{id_suscripcion}", response_model=SuscripcionPublic)
def get_suscripcion(
    id_suscripcion: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene una suscripcion especifica por su ID.
    
    Clientes solo pueden ver sus propias suscripciones.
    """
    suscripcion = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not suscripcion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Verificar permisos
    if current_user.user_type == "cliente" and suscripcion.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this subscription"
        )
    
    return SuscripcionPublic(**dict(suscripcion))


@router.post("", response_model=ResponseMessage)
def create_suscripcion(
    suscripcion: SuscripcionCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Crea una nueva suscripcion.
    
    Solo accesible para admins de Synkro.
    """
    result = suscripcion_service.create_suscripcion(db, suscripcion, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Subscription created successfully with ID: {result.get('id_suscripcion')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error creating subscription") if result else "Error creating subscription"
        )


@router.put("/{id_suscripcion}", response_model=ResponseMessage)
def update_suscripcion(
    id_suscripcion: Decimal,
    suscripcion: SuscripcionUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Actualiza una suscripcion existente.
    
    Solo accesible para admins de Synkro.
    """
    existing = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    result = suscripcion_service.update_suscripcion(db, id_suscripcion, suscripcion, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Subscription updated successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error updating subscription") if result else "Error updating subscription"
        )


@router.delete("/{id_suscripcion}", response_model=ResponseMessage)
def delete_suscripcion(
    id_suscripcion: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_synkro)
):
    """
    Elimina una suscripcion (soft delete).
    
    Solo accesible para admins de Synkro.
    """
    existing = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    result = suscripcion_service.delete_suscripcion(db, id_suscripcion)
    
    if result and result.get("success"):
        return ResponseMessage(message="Subscription deleted successfully", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error deleting subscription") if result else "Error deleting subscription"
        )


@router.post("/{id_suscripcion}/change-plan", response_model=ResponseMessage)
def cambiar_plan(
    id_suscripcion: Decimal,
    id_plan_nuevo: Decimal,
    motivo_cambio: Optional[str] = None,
    tipo_cambio: Literal["upgrade", "downgrade", "lateral"] = "lateral",
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Cambia el plan de una suscripción existente.

    - Los clientes solo pueden cambiar sus propias suscripciones activas.
    - Los admins de Synkro pueden cambiar cualquier suscripción.
    - La lógica de validación de límites y prorrateos vive en la base de datos.
    """
    suscripcion = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not suscripcion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )

    # Verificar permisos de acceso
    if current_user.user_type == "cliente" and suscripcion.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this subscription",
        )

    # Solo suscripciones activas pueden cambiar de plan
    if suscripcion.get("estado_suscripcion") != "activa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active subscriptions can change plan",
        )

    try:
        result = suscripcion_service.cambiar_plan_suscripcion(
            db=db,
            id_suscripcion=id_suscripcion,
            id_plan_nuevo=id_plan_nuevo,
            usuario_email=current_user.email,
            motivo_cambio=motivo_cambio,
            tipo_cambio=tipo_cambio,
        )
    except Exception as exc:
        # Normalizar errores de dominio a HTTP 400
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if result and result.get("success"):
        return ResponseMessage(
            message=result.get("message", "Plan de suscripcion actualizado correctamente"),
            success=True,
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=result.get("message", "Error al cambiar plan de suscripcion") if result else "Error al cambiar plan de suscripcion",
    )


@router.post("/create-first", response_model=CrearPrimeraSuscripcionResponse)
def crear_primera_suscripcion(
    suscripcion: SuscripcionCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Permite a los clientes crear su primera suscripción.
    
    Si Stripe está configurado, crea una factura inicial y devuelve checkout_url
    para redirigir al usuario a Stripe Checkout. Si no, devuelve success sin URL.
    """
    # Solo clientes pueden crear sus propias suscripciones
    if current_user.user_type != "cliente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can create their own subscriptions"
        )
    
    if suscripcion.identificacion_fiscal_cliente != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create subscriptions for your own account"
        )
    
    suscripciones_activas = suscripcion_service.get_suscripciones_activas(
        db,
        current_user.identificacion_fiscal
    )
    if suscripciones_activas and len(suscripciones_activas) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription. Use the change plan endpoint instead."
        )
    
    from services import plan_service
    plan = plan_service.get_plan(db, suscripcion.id_plan)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    if plan.get("estado_plan") != "activo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected plan is not active"
        )
    
    result = suscripcion_service.create_suscripcion(db, suscripcion, current_user.email)
    
    if not result or not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error creating subscription") if result else "Error creating subscription"
        )
    
    id_suscripcion = result.get("id_suscripcion")
    message = f"Subscription created successfully with ID: {id_suscripcion}"
    checkout_url = None
    
    # Crear factura inicial y sesión de Stripe Checkout para el primer pago
    try:
        plan_name = plan.get("nom_plan") or "Plan"
        # Fecha de vencimiento: 30 días desde el fin del periodo o desde hoy
        fin_periodo = suscripcion.fecha_proximo_pago or suscripcion.fecha_inicio
        if isinstance(fin_periodo, datetime):
            fecha_vencimiento = fin_periodo + timedelta(days=30)
        else:
            fecha_vencimiento = datetime.utcnow() + timedelta(days=30)
        factura_data = FacturaCabeceraCreate(
            id_suscripcion=id_suscripcion,
            identificacion_fiscal_cliente=suscripcion.identificacion_fiscal_cliente,
            moneda="USD",
            metodo_pago="stripe",
            fecha_vencimiento=fecha_vencimiento,
            periodo_facturado_desde=suscripcion.fecha_inicio,
            periodo_facturado_hasta=suscripcion.fecha_proximo_pago,
            detalles=[
                FacturaDetalleCreate(
                    num_linea=1,
                    concepto=f"{plan_name} - primer periodo",
                    cantidad=Decimal("1"),
                    precio_unitario=suscripcion.precio_actual,
                    id_plan=suscripcion.id_plan,
                )
            ],
        )
        invoice_result = facturacion_service.create_factura(db, factura_data, current_user.email)
        if invoice_result and invoice_result.get("success"):
            id_factura = invoice_result.get("id_factura")
            if factura_data.detalles:
                for detalle in factura_data.detalles:
                    facturacion_service.create_factura_detalle(
                        db, id_factura, detalle, current_user.email
                    )
            # Asegurar que los totales estén actualizados antes de crear la sesión de Stripe
            db.commit()
            # Refrescar la sesión para leer los datos actualizados de la BD (el trigger actualiza el total)
            db.expire_all()
            success_url = f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{settings.FRONTEND_URL}/subscription"
            stripe_result = stripe_service.create_checkout_session(
                db, id_factura, success_url, cancel_url
            )
            if stripe_result and "checkout_url" in stripe_result and "error" not in stripe_result:
                checkout_url = stripe_result["checkout_url"]
    except Exception as e:
        # Suscripción ya creada; el usuario puede pagar desde Billing más tarde
        logger.warning("Stripe/factura no disponible en create-first: %s", e, exc_info=True)
    
    return CrearPrimeraSuscripcionResponse(
        message=message,
        success=True,
        checkout_url=checkout_url,
    )

