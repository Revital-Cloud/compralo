from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional

class PuntosConfigBase(BaseModel):
    """
    Schema base para la configuración de puntos.
    """
    pesos_por_punto: float = Field(..., gt=0, description="Valor en pesos para ganar un punto. Ej: 1000 pesos = 1 punto")
    ind_activo: Optional[bool] = Field(None, description="Indica si la configuración está activa")
    descripcion: Optional[str] = Field(None, description="Descripción de la configuración", max_length=255)
    fec_inicio_vigencia: Optional[date] = Field(None, description="Fecha de inicio de la vigencia de la configuración")
    fec_fin_vigencia: Optional[date] = Field(None, description="Fecha de fin de la vigencia. Nulo si no tiene fin.")
    usr_insert: Decimal = Field(None, description="ID del usuario que insertó la configuración")
    @field_validator('fec_fin_vigencia')
    def check_fechas_vigencia(cls, v, values):
        """Valida que la fecha de fin no sea anterior a la fecha de inicio."""
        if v is not None and 'fec_inicio_vigencia' in values.data and v < values.data['fec_inicio_vigencia']:
            raise ValueError('La fecha de fin de vigencia no puede ser anterior a la fecha de inicio.')
        return v

class PuntosConfigUpdate(BaseModel):
    """
    Schema para actualizar la configuración de puntos activa.
    """
    pesos_por_punto: float = Field(..., gt=0, description="Nuevo valor en pesos para ganar un punto.")
    descripcion: Optional[str] = Field(None, description="Nueva descripción opcional para la configuración.", max_length=255)

class PuntosConfigCreate(PuntosConfigBase):
    """
    Schema para crear una nueva configuración de puntos.
    """
    pass

class PuntosConfig(PuntosConfigBase):
    """
    Schema para representar los datos de una configuración de puntos desde la base de datos.
    """
    id_config_puntos: int
    usr_insert: int
    fec_insert: datetime
    usr_update: Optional[int] = None
    fec_update: Optional[datetime] = None

    class Config:
        from_attributes = True 
        
class ResponseMessage(BaseModel):
    """
    Schema para mensajes de respuesta.
    """
    message: str