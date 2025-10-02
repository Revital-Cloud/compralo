# Esquemas Pydantic (validación de datos, request/response)
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any # Usaremos Dict o Any para JSONB
from decimal import Decimal # Para campos DECIMAL si se requiere precisión
from datetime import datetime

# Esquema Base para Líneas
class LineBase(BaseModel):
    """
    Esquema Base para Líneas.

    Contiene los campos comunes para la creación y visualización de líneas.
    Utilizado como base para otros esquemas de líneas más específicos.

    Atributos:
        id_categoria (Decimal): Identificador de la categoría a la que pertenece la línea.
        id_linea (Decimal): Identificador único para la línea.
        nom_linea (str): Nombre de la línea.
        ind_activo (Optional[bool]): Indica si la línea está activa.
        usr_insert (Optional[Decimal]): Usuario que insertó el registro.
        fec_insert (Optional[datetime]): Fecha de inserción del registro.
        usr_update (Optional[Decimal]): Usuario que actualizó el registro.
        fec_update (Optional[datetime]): Fecha de actualización del registro.
    """
    id_categoria: Decimal = Field(..., description="Identificador de la categoría a la que pertenece la línea.")
    nom_linea: str = Field(..., description="Nombre de la línea.")
    ind_activo: Optional[bool] = Field(None, description="Indica si la línea está activa.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del registro.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del registro.")
    
    class Config:
        from_attributes = True
        
        
# esquema para Mostar las lineas   
class Line(LineBase):
    """
    Esquema para Mostrar Líneas.

    Hereda de `LineBase` y se utiliza para validar los datos
    al mostrar una línea específica. Incluye todos los campos de `LineBase`.
    """
    id_linea: Decimal
    # Campos enriquecidos para mostrar en el frontend
    nom_categoria: Optional[str] = None
        
# Esquema para la Creación de Líneas
class LineCreate(LineBase):
    """
    Esquema para la Creación de Líneas.

    Hereda de `LineBase` y se utiliza para validar los datos
    al crear una nueva línea.
    """
    pass
# Esquema para la Actualización de Líneas
class LineUpdate(BaseModel):
    """
    Esquema para la Actualización de Líneas.
    Define los campos que pueden ser actualizados para una línea existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    id_categoria: Optional[Decimal] = Field(None, description="Identificador de la categoría a la que pertenece la línea.")
    nom_linea: Optional[str] = Field(None, description="Nombre de la línea.")
    ind_activo: Optional[bool] = Field(None, description="Indica si la línea está activa.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
# Mensajitos para las respuesta api en lineas
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.

    Atributos:
        message (str): El mensaje a ser enviado en la respuesta.
    """
    message: str
