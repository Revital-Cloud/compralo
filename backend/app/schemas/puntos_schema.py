from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional

class PuntosConfigBase(BaseModel):
    """
    Schema base para la configuración de puntos.
    """
    pesos_por_punto: float = Field(..., gt=0, description="Valor en pesos para ganar un punto. Ej: 1000 pesos = 1 punto")
    ind_activo: bool = Field(True, description="Indica si la configuración está activa")
    descripcion: str = Field("Configuración de puntos por pesos gastados", description="Descripción de la configuración", max_length=255)
    fec_inicio_vigencia: date = Field(..., description="Fecha de inicio de la vigencia de la configuración")
    fec_fin_vigencia: Optional[date] = Field(None, description="Fecha de fin de la vigencia. Nulo si no tiene fin.")

    @field_validator('fec_fin_vigencia')
    def check_fechas_vigencia(cls, v, values):
        """Valida que la fecha de fin no sea anterior a la fecha de inicio."""
        if v is not None and 'fec_inicio_vigencia' in values.data and v < values.data['fec_inicio_vigencia']:
            raise ValueError('La fecha de fin de vigencia no puede ser anterior a la fecha de inicio.')
        return v

class PuntosConfigActivaUpdate(BaseModel):
    """
    Schema para actualizar la configuración de puntos activa.
    """
    nuevo_pesos_por_punto: float = Field(..., gt=0, description="Nuevo valor en pesos para ganar un punto.")
    descripcion: Optional[str] = Field(None, description="Nueva descripción opcional para la configuración.", max_length=255)

class TipoMovimientoDescripcion(BaseModel):
    """
    Schema para la descripción de un tipo de movimiento de puntos.
    """
    codigo: int
    descripcion: str

class PuntosConfigCreate(PuntosConfigBase):
    """
    Schema para crear una nueva configuración de puntos.
    El campo usr_insert se añadirá en la capa de servicio.
    """
    pass

class PuntosConfigUpdate(BaseModel):
    """
    Schema para actualizar una configuración de puntos.
    Todos los campos son opcionales.
    """
    pesos_por_punto: Optional[float] = Field(None, gt=0)
    ind_activo: Optional[bool] = None
    descripcion: Optional[str] = Field(None, max_length=255)
    fec_inicio_vigencia: Optional[date] = None
    fec_fin_vigencia: Optional[date] = None

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
        orm_mode = True 