from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status
from typing import Dict, Any, List, Union
from decimal import Decimal

from core.config import settings
from schemas.payment_schema import MetodoPagoUsuario
from schemas.auth_schema import UserInToken
from .user_service import get_user_by_id
from services.wompi_service import wompi_service

async def add_payment_method(db: Session, user: UserInToken, card_token: str, brand: str) -> Dict[str, Any]:
    """
    Agrega un nuevo método de pago para el usuario usando Wompi como proveedor.
    
    Args:
        db (Session): Sesión de base de datos
        user (UserInToken): Usuario autenticado
        card_token (str): Token de la tarjeta generado por Wompi
        brand (str): Marca de la tarjeta (ej. VISA) obtenida del frontend
        
    Returns:
        Dict[str, Any]: Respuesta con los datos del método de pago agregado
        
    Raises:
        HTTPException: Si hay errores en la validación o en el proceso

    Relación con endpoint:
    - Consumido por `POST /payment/add-method` en `payment_router.py`.

    Flujo completo:
    1. Crear fuente de pago en Wompi usando `card_token`.
    2. Validar campos críticos de respuesta (`id`, `last_four`, expiración).
    3. Persistir método con función SQL `fun_agregar_metodo_pago`.
    4. Confirmar transacción local (`commit`) y retornar payload plano
       listo para serializar como `PaymentMethodResponse`.
    """
    try:
        # Crear fuente de pago en Wompi
        wompi_response = await wompi_service.create_payment_source(
            user_email=user.email_usuario,
            card_token=card_token
        )
        
        # Validar la respuesta de Wompi
        wompi_data = wompi_response.get("data")
        if not wompi_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Wompi no devolvió datos para la fuente de pago"
            )

        # Obtener los datos públicos de la tarjeta
        public_data = wompi_data.get("public_data")
        if not public_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La respuesta de Wompi no contiene los datos de la tarjeta"
            )

        # Validar datos requeridos
        provider_source_id = wompi_data.get("id")
        last_four = public_data.get("last_four")
        if not provider_source_id or not last_four:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faltan datos requeridos de la tarjeta"
            )

        # Extraer y convertir los datos necesarios
        exp_month = int(public_data.get("exp_month", 0))
        exp_year = int(public_data.get("exp_year", 0))
        
        # Llamar función SQL que registra el método de pago del usuario.
        query = text("""
            SELECT fun_agregar_metodo_pago(
                :id_usuario,
                :provider_name,
                :provider_source_id,
                :brand,
                :last_four_digits,
                :expiration_month,
                :expiration_year,
                :card_holder,
                :usr_operacion
            )
        """)
        
        result = db.execute(
            query,
            {
                "id_usuario": user.id_usuario,
                "provider_name": "wompi",
                "provider_source_id": str(provider_source_id),
                "brand": brand,
                "last_four_digits": last_four,
                "expiration_month": exp_month,
                "expiration_year": exp_year,
                "card_holder": public_data.get("card_holder"),
                "usr_operacion": user.id_usuario
            }
        ).fetchone()

        if not result or not result[0]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al procesar la respuesta de la base de datos"
            )

        db_response = result[0]
        
        # Validar la respuesta de la función
        if not db_response.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=db_response.get("message", "Error al agregar método de pago")
            )

        db.commit()
        
        # Combinar mensaje de éxito con detalles del método de pago.
        payment_details = db_response.get("data", {})
        
        # Construir respuesta final plana.
        final_response = {
            "success": True,
            "message": db_response.get("message", "Método de pago agregado con éxito."),
            **payment_details
        }
        
        # Se retorna un único diccionario plano.
        return final_response

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error inesperado al agregar método de pago: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al agregar método de pago"
        )


def list_payment_methods(db: Session, user_or_id: Union[UserInToken, int, Decimal]) -> List[MetodoPagoUsuario]:
    """
    Lista métodos de pago guardados de un usuario.
    Acepta `UserInToken`, `int` o `Decimal` para resolver `id_usuario`.

    Relación con endpoint:
    - Consumido por `GET /payment/list-methods`.

    Decisiones:
    - Ordena por `is_default DESC` para que UI muestre primero la tarjeta
      predeterminada.
    - Devuelve entidades validadas (`MetodoPagoUsuario`) para asegurar
      contrato de tipos entre servicio y router.
    """
    try:
        id_usuario = None
        if isinstance(user_or_id, (int, Decimal)):
            id_usuario = int(user_or_id)
        elif isinstance(user_or_id, UserInToken):
            id_usuario = int(user_or_id.id_usuario)
        else:
            raise ValueError("Parámetro inválido para id de usuario")

        query = text("""
            SELECT 
                id_metodo_pago,
                id_usuario,
                provider_name,
                provider_source_id,
                COALESCE(brand, '') as brand,
                last_four_digits,
                expiration_month,
                expiration_year,
                card_holder,
                is_default,
                usr_insert,
                fec_insert,
                usr_update,
                fec_update
            FROM tab_metodos_pago_usuario
            WHERE id_usuario = :id_usuario
            ORDER BY is_default DESC, id_metodo_pago DESC
        """)
        
        result = db.execute(query, {"id_usuario": id_usuario})
        payment_methods = [dict(row._mapping) for row in result]
        return [MetodoPagoUsuario(**pm) for pm in payment_methods]
        
    except Exception as e:
        print(f"Error al listar métodos de pago: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar métodos de pago: {str(e)}"
        )


def delete_payment_method(db: Session, user: UserInToken, id_metodo_pago: int):
    """
    Elimina un método de pago del usuario autenticado.

    Relación con endpoint:
    - Consumido por `DELETE /payment/delete-method/{payment_method_id}`.

    Nota:
    - Delega reglas de negocio/autorización fina a la función SQL
      `fun_eliminar_metodo_pago`.
    """
    try:
        query = text("SELECT fun_eliminar_metodo_pago(:id_usuario, :id_metodo_pago)")
        result = db.execute(query, {
            "id_usuario": user.id_usuario,
            "id_metodo_pago": id_metodo_pago
        }).fetchone()
        
        if not result or not result[0]:
            raise HTTPException(status_code=404, detail="Método de pago no encontrado.")
        
        db.commit()
        return result[0]
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar método de pago: {str(e)}")


def set_default_payment_method(db: Session, user: UserInToken, id_metodo_pago: int) -> Dict[str, Any]:
    """
    Define un método de pago como predeterminado para el usuario.

    Relación con endpoint:
    - Consumido por `PUT /payment/set-default-method/{payment_method_id}`.

    Comportamiento esperado:
    - Marca solo un método como default por usuario.
    - Mantiene consistencia a través de la función SQL
      `fun_actualizar_metodo_pago_default`.
    """
    try:
        query = text("SELECT fun_actualizar_metodo_pago_default(:id_usuario, :id_metodo_pago, :usr_operacion)")
        result = db.execute(query, {
            "id_usuario": user.id_usuario,
            "id_metodo_pago": id_metodo_pago,
            "usr_operacion": user.id_usuario
        }).fetchone()

        if not result or not result[0]:
            raise HTTPException(status_code=404, detail="Método de pago no encontrado.")

        db.commit()
        return result[0]

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al establecer método de pago por defecto: {str(e)}") 