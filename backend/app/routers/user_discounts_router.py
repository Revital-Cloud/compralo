"""
Módulo de enrutador para la gestión de descuentos por usuario.

Define las rutas y endpoints relacionados con la gestión de descuentos por usuario,
incluyendo la visualización, validación y registro de descuentos por usuario.
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.user_discounts_schema import UserDiscounts, ResponseMessage, ValidateDiscountRequest, ValidateDiscountResponse
from services import user_discounts_service

router = APIRouter(tags=["Descuentos por Usuario"])

@router.get("/user-discounts", response_model=list[UserDiscounts])
async def get_user_discounts(db:Session = Depends(get_db)):
    """
    Obtiene todos los descuentos por usuario registrados en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list[UserDiscounts]: Lista de descuentos por usuario registrados.
    """
    user_discounts = user_discounts_service.get_user_discounts(db)
    if user_discounts is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron descuentos por usuario")
    return user_discounts

#ruta para validar un descuento por usuario con JSON body
@router.post("/discounts/validate", response_model=ValidateDiscountResponse)
async def validate_discount(
    payload: ValidateDiscountRequest,
    db: Session = Depends(get_db)
):
    """
    Valida si un descuento es aplicable para un usuario según las reglas configuradas.
    """
    try:
        # Llamada directa a la función SQL
        result = db.execute(
            "SELECT fun_validar_descuento_aplicable(:id_descuento, :id_usuario, :codigo_ingresado, :usr_insert)",
            {
                "id_descuento": payload.id_descuento,
                "id_usuario": payload.id_usuario,
                "codigo_ingresado": payload.codigo_ingresado,
                "usr_insert": payload.usr_insert or payload.id_usuario
            }
        )
        aplicable = result.scalar()
        mensaje = "Descuento aplicable" if aplicable else "El descuento no es aplicable según las restricciones configuradas."
        return ValidateDiscountResponse(aplicable=aplicable, mensaje=mensaje)
    except Exception as e:
        return ValidateDiscountResponse(aplicable=False, mensaje=f"Error al validar descuento: {str(e)}")
