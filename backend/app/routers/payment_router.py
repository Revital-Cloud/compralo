from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, Path
from sqlalchemy.orm import Session
from typing import Any, Dict, List

from core.dependencies import get_db, get_current_user
from schemas.auth_schema import UserInToken
from schemas.payment_schema import (
    PaymentPreferenceRequest, PaymentPreferenceResponse, MetodoPagoUsuario, 
    CardTokenRequest
)
from services.payment_service import PaymentService

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

@router.post(
    "/preference",
    response_model=PaymentPreferenceResponse,
    summary="Crear una Preferencia de Pago en MercadoPago"
)
def create_payment_preference(
    id_orden: int = Body(..., embed=True, description="ID de la orden para la cual se crea la preferencia"),
    preference_request: PaymentPreferenceRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una preferencia de pago en MercadoPago para una orden existente.

    - **id_orden**: El ID de la orden generada previamente en el sistema.
    - **preference_request**: Los detalles del pago, incluyendo items y URLs de redirección.

    El endpoint asocia la preferencia con la orden y el usuario actual.
    """
    payment_service = PaymentService(db)
    try:
        response = payment_service.create_payment_preference(
            preference_request=preference_request,
            id_orden=id_orden,
            id_usuario=current_user.id_usuario
        )
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocurrió un error inesperado al crear la preferencia de pago: {str(e)}"
        )

@router.post(
    "/webhook/mercadopago",
    status_code=status.HTTP_200_OK,
    summary="Recibir notificaciones de webhook de MercadoPago"
)
async def handle_mercadopago_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Endpoint para recibir y procesar notificaciones de MercadoPago.

    Este endpoint es llamado por MercadoPago para informar sobre eventos,
    principalmente actualizaciones en el estado de los pagos.

    **No requiere autenticación.**
    """
    notification = await request.json()
    payment_service = PaymentService(db)
    # The actual processing is async and handled by the service
    await payment_service.handle_webhook(notification)
    return {"status": "notification received"}


# --- User Payment Methods Routes ---

@router.post(
    "/cards",
    summary="Agregar un nuevo método de pago (tarjeta)",
    status_code=status.HTTP_201_CREATED
)
def add_card(
    card_token_request: CardTokenRequest,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Agrega una nueva tarjeta a la cuenta del usuario.
    
    El frontend debe primero obtener un `token` de un solo uso de la SDK de MercadoPago
    y enviarlo en esta petición.
    """
    payment_service = PaymentService(db)
    return payment_service.add_payment_method(current_user, card_token_request.token)

@router.get(
    "/cards",
    response_model=List[MetodoPagoUsuario],
    summary="Listar los métodos de pago guardados del usuario"
)
def list_cards(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Devuelve una lista de todos los métodos de pago (tarjetas) guardados por el usuario.
    """
    payment_service = PaymentService(db)
    return payment_service.list_payment_methods(current_user.id_usuario)

@router.delete(
    "/cards/{id_metodo_pago}",
    summary="Eliminar un método de pago guardado",
    status_code=status.HTTP_200_OK
)
def delete_card(
    id_metodo_pago: int = Path(..., title="ID del método de pago a eliminar"),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Elimina permanentemente una tarjeta de la cuenta del usuario.
    """
    payment_service = PaymentService(db)
    return payment_service.delete_payment_method(current_user, id_metodo_pago)

@router.put(
    "/cards/{id_metodo_pago}/default",
    summary="Establecer un método de pago como predeterminado",
    status_code=status.HTTP_200_OK
)
def set_default_card(
    id_metodo_pago: int = Path(..., title="ID del método de pago a establecer como predeterminado"),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Marca una tarjeta como el método de pago por defecto para futuras compras.
    """
    payment_service = PaymentService(db)
    return payment_service.set_default_payment_method(current_user, id_metodo_pago) 