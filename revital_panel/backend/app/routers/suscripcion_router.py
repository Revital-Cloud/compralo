"""
Router de Suscripciones.

Define los endpoints CRUD para la gestion de suscripciones.
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from core.database import get_db
from core.config import settings
from core.dependencies import get_current_user, require_admin_revital
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
    
    Admins de Revital ven todas las suscripciones.
    Clientes solo ven sus propias suscripciones.
    """
    if current_user.user_type == "admin_revital":
        suscripciones = suscripcion_service.get_suscripciones(db)
    else:
        suscripciones = suscripcion_service.get_suscripciones(db, current_user.identificacion_fiscal)
    
    return [SuscripcionPublic(**dict(s)) for s in suscripciones]


@router.get("/activas", response_model=List[dict])
def get_suscripciones_activas(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Obtiene las suscripciones activas con informacion del plan.
    
    Admins de Revital ven todas.
    Clientes solo ven sus propias suscripciones activas.
    """
    if current_user.user_type == "admin_revital":
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
            detail="Suscripcion no encontrada"
        )
    
    # Verificar permisos
    if current_user.user_type == "cliente" and suscripcion.get("identificacion_fiscal_cliente") != current_user.identificacion_fiscal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta suscripcion"
        )
    
    return SuscripcionPublic(**dict(suscripcion))


@router.post("", response_model=ResponseMessage)
def create_suscripcion(
    suscripcion: SuscripcionCreate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Crea una nueva suscripcion.
    
    Solo accesible para admins de Revital.
    """
    result = suscripcion_service.create_suscripcion(db, suscripcion, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(
            message=f"Suscripcion creada correctamente con ID: {result.get('id_suscripcion')}",
            success=True
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al crear suscripcion") if result else "Error al crear suscripcion"
        )


@router.put("/{id_suscripcion}", response_model=ResponseMessage)
def update_suscripcion(
    id_suscripcion: Decimal,
    suscripcion: SuscripcionUpdate,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Actualiza una suscripcion existente.
    
    Solo accesible para admins de Revital.
    """
    existing = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripcion no encontrada"
        )
    
    result = suscripcion_service.update_suscripcion(db, id_suscripcion, suscripcion, current_user.email)
    
    if result and result.get("success"):
        return ResponseMessage(message="Suscripcion actualizada correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al actualizar suscripcion") if result else "Error al actualizar suscripcion"
        )


@router.delete("/{id_suscripcion}", response_model=ResponseMessage)
def delete_suscripcion(
    id_suscripcion: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin_revital)
):
    """
    Elimina una suscripcion (soft delete).
    
    Solo accesible para admins de Revital.
    """
    existing = suscripcion_service.get_suscripcion(db, id_suscripcion)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripcion no encontrada"
        )
    
    result = suscripcion_service.delete_suscripcion(db, id_suscripcion)
    
    if result and result.get("success"):
        return ResponseMessage(message="Suscripcion eliminada correctamente", success=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error deleting subscription") if result else "Error deleting subscription"
        )


@router.post("/{id_suscripcion}/change-plan", response_model=CrearPrimeraSuscripcionResponse)
def cambiar_plan(
    id_suscripcion: Decimal,
    id_plan_nuevo: Decimal,
    motivo_cambio: Optional[str] = Query(None),
    tipo_cambio: Literal["upgrade", "downgrade", "lateral"] = Query("lateral"),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """
    Cambia el plan de una suscripción existente.

    - Los clientes solo pueden cambiar sus propias suscripciones activas.
    - Los admins de Synkro pueden cambiar cualquier suscripción.
    - Si es upgrade, se crea una factura y se devuelve checkout_url para pagar con Stripe.
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if not result or not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Error al cambiar plan de suscripcion") if result else "Error al cambiar plan de suscripcion",
        )

    message = result.get("message", "Plan de suscripcion actualizado correctamente")
    checkout_url = None

    # Decidir si es upgrade: por param o por resultado de la BD (precio_nuevo > precio_anterior)
    precio_anterior = result.get("precio_anterior")
    precio_nuevo = result.get("precio_nuevo")
    tipo_cambio_db = result.get("tipo_cambio")
    try:
        p_ant = float(precio_anterior) if precio_anterior is not None else 0.0
        p_nuevo = float(precio_nuevo) if precio_nuevo is not None else 0.0
    except (TypeError, ValueError):
        p_ant, p_nuevo = 0.0, 0.0
    is_upgrade = (tipo_cambio == "upgrade" or tipo_cambio_db == "upgrade" or p_nuevo > p_ant)

    if is_upgrade:
        try:
            from services import plan_service
            suscripcion_actualizada = suscripcion_service.get_suscripcion(db, id_suscripcion)
            plan = plan_service.get_plan(db, id_plan_nuevo)
            if suscripcion_actualizada and plan:
                plan_name = plan.get("nom_plan") or "Plan"
                precio = suscripcion_actualizada.get("precio_actual")
                fecha_inicio = suscripcion_actualizada.get("fecha_inicio")
                fecha_proximo = suscripcion_actualizada.get("fecha_proximo_pago")
                if isinstance(fecha_inicio, datetime):
                    periodo_desde = fecha_inicio
                else:
                    periodo_desde = datetime.utcnow()
                if isinstance(fecha_proximo, datetime):
                    periodo_hasta = fecha_proximo
                else:
                    periodo_hasta = datetime.utcnow() + timedelta(days=30)
                fecha_vencimiento = periodo_hasta + timedelta(days=30) if isinstance(periodo_hasta, datetime) else datetime.utcnow() + timedelta(days=30)

                try:
                    precio_val = float(precio) if precio is not None else 0.0
                except (TypeError, ValueError):
                    precio_val = 0.0
                precio_decimal = Decimal(str(precio_val)) if precio_val else Decimal("0")

                factura_data = FacturaCabeceraCreate(
                    id_suscripcion=id_suscripcion,
                    identificacion_fiscal_cliente=str(suscripcion_actualizada.get("identificacion_fiscal_cliente", "")),
                    moneda="USD",
                    metodo_pago="stripe",
                    fecha_vencimiento=fecha_vencimiento,
                    periodo_facturado_desde=periodo_desde,
                    periodo_facturado_hasta=periodo_hasta,
                    detalles=[
                        FacturaDetalleCreate(
                            num_linea=1,
                            concepto=f"{plan_name} - cambio de plan (upgrade)",
                            cantidad=Decimal("1"),
                            precio_unitario=precio_decimal,
                            id_plan=id_plan_nuevo,
                        )
                    ],
                )
                invoice_result = facturacion_service.create_factura(db, factura_data, current_user.email)
                if invoice_result and invoice_result.get("success"):
                    id_factura = invoice_result.get("id_factura")
                    if id_factura is not None and factura_data.detalles:
                        for detalle in factura_data.detalles:
                            facturacion_service.create_factura_detalle(db, id_factura, detalle, current_user.email)
                    db.commit()
                    db.expire_all()
                    success_url = f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
                    cancel_url = f"{settings.FRONTEND_URL}/subscription"
                    stripe_result = stripe_service.create_checkout_session(
                        db, Decimal(str(id_factura)), success_url, cancel_url
                    )
                    if stripe_result and "checkout_url" in stripe_result and "error" not in stripe_result:
                        checkout_url = stripe_result["checkout_url"]
                    elif stripe_result and "error" in stripe_result:
                        logger.warning("Stripe checkout error en change-plan: %s", stripe_result.get("error"))
                else:
                    logger.warning("create_factura no success en change-plan: %s", invoice_result)
            else:
                logger.warning("suscripcion_actualizada o plan no encontrado en change-plan")
        except Exception as e:
            logger.exception("Stripe/factura en change-plan: %s", e)

    return CrearPrimeraSuscripcionResponse(
        message=message,
        success=True,
        checkout_url=checkout_url,
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
