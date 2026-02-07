# backend/app/schemas/puntos_movimientos_schema.py
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

class PointsMovementBase(BaseModel):
    """
    Schema base para los movimientos de puntos.
    """
    id_usuario: Decimal = Field(..., description="ID del usuario al que pertenece el movimiento.")
    tipo_movimiento: int = Field(..., description="Tipo de movimiento: 1 = acumulación, 2 = canje, 3 = expiración.", ge=1, le=3)
    cantidad_puntos: int = Field(..., description="Cantidad de puntos del movimiento. Positivo para acumulación, negativo para canje/expiración.")
    puntos_disponibles_anterior: int = Field(..., description="Puntos disponibles antes del movimiento.", ge=0)
    puntos_disponibles_actual: int = Field(..., description="Puntos disponibles después del movimiento.", ge=0)
    id_orden_origen: Optional[int] = Field(None, description="ID de la orden que originó la acumulación.")
    id_descuento_canjeado: Optional[int] = Field(None, description="ID del descuento por el que se canjearon los puntos.")
    descripcion: str = Field(..., description="Descripción detallada del movimiento.")

    @model_validator(mode='after')
    def check_movement_logic(self) -> 'PointsMovementBase':
        """
        Valida la lógica de negocio basada en el tipo de movimiento, replicando
        los CONSTRAINTS de la base de datos.
        """
        # CONSTRAINT chk_acumulacion_positiva
        if self.tipo_movimiento == 1 and self.cantidad_puntos <= 0:
            raise ValueError("La acumulación de puntos debe tener una cantidad positiva.")

        # CONSTRAINT chk_canje_negativo
        if self.tipo_movimiento == 2 and self.cantidad_puntos >= 0:
            raise ValueError("El canje de puntos debe tener una cantidad negativa.")
        
        # CONSTRAINT expiracion_negativa (similar a canje)
        if self.tipo_movimiento == 3 and self.cantidad_puntos >= 0:
            raise ValueError("La expiración de puntos debe tener una cantidad negativa.")

        # CONSTRAINT chk_orden_solo_acumulacion
        if self.id_orden_origen is not None and self.tipo_movimiento != 1:
            raise ValueError("Una orden de origen solo puede estar asociada a una acumulación (tipo 1).")
        
        # CONSTRAINT chk_descuento_solo_canje
        if self.id_descuento_canjeado is not None and self.tipo_movimiento != 2:
            raise ValueError("Un descuento canjeado solo puede estar asociado a un canje (tipo 2).")

        # Validar que cantidad_puntos no sea cero
        if self.cantidad_puntos == 0:
            raise ValueError("La cantidad de puntos no puede ser cero.")

        return self

class PointsMovementCreate(PointsMovementBase):
    """
    Schema para registrar un nuevo movimiento de puntos.
    El campo `usr_insert` debe ser proporcionado por el contexto de la aplicación.
    """
    usr_insert: int = Field(..., description="ID del usuario que registra el movimiento.")


class PointsMovementInDB(PointsMovementBase):
    """
    Schema que representa el movimiento de puntos tal como está en la base de datos.
    """
    id_movimiento_puntos: int = Field(..., description="ID único del movimiento.")
    usr_insert: int
    fec_insert: datetime

    class Config:
        from_attributes = True

class PointsMovement(PointsMovementInDB):
    """
    Schema para devolver la información de un movimiento de puntos en la API.
    """
    pass 