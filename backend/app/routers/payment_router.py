"""
Router para la gestión de pagos y métodos de pago con Wompi.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import json
import hmac
import hashlib

from core.database import get_db
from core.dependencies import get_current_user
from schemas.user_schema import User
from schemas.payment_schema import CreatePaymentMethodPayload, PaymentMethodResponse
from services.payment_service import add_payment_method, list_payment_methods, delete_payment_method, set_default_payment_method
from core.config import settings

router = APIRouter(
    prefix="/payment",
    tags=["Payment Methods"],
    responses={404: {"description": "Not found"}},
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
    try:
        # El servicio ahora devuelve un diccionario plano
        result = await add_payment_method(db, current_user, payload.card_token, payload.brand)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Error al agregar el método de pago")
            )
            
        # Pasamos el resultado directamente, ya que coincide con el schema
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
def get_payment_methods(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_payment_methods(db, current_user.id_usuario)

@router.delete("/delete-method/{payment_method_id}", summary="Eliminar un método de pago guardado")
def remove_payment_method(payment_method_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = delete_payment_method(db, current_user, payment_method_id)
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("message"))
    return {"message": result.get("message")}

@router.put("/set-default-method/{payment_method_id}", summary="Establecer un método de pago como predeterminado")
def update_default_payment_method(payment_method_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = set_default_payment_method(db, current_user, payment_method_id)
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("message"))
    return {"message": result.get("message")}

@router.post("/webhook", include_in_schema=False)
async def handle_wompi_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint para recibir y procesar notificaciones (webhooks) de Wompi.
    """
    request_body = await request.body()
    signature_header = request.headers.get("x-wompi-signature")
    
    if not signature_header:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Firma de webhook faltante.")
        
    # Verificar la firma del webhook
    expected_signature = hmac.new(
        settings.WOMPI_EVENTS_SECRET.encode(),
        request_body,
        hashlib.sha256
    ).hexdigest()
    
    if signature_header != expected_signature:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Firma de webhook inválida.")
    
    try:
        payload = json.loads(request_body)
        # Aquí implementaremos la lógica del webhook cuando sea necesario
        return {"status": "webhook received"}
    except Exception as e:
        print(f"Error procesando webhook de Wompi: {e}")
        raise HTTPException(status_code=500, detail="Error al procesar el webhook.") 