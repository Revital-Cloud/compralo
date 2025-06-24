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
        ind_activo (bool): Indica si la línea está activa.
    """
    id_categoria: Decimal = Field(..., description="Identificador de la categoría a la que pertenece la línea.")
    nom_linea: str = Field(..., description="Nombre de la línea.")
    ind_activo: bool = Field(..., description="Indica si la línea está activa.")
    
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
        
# Esquema para la Creación de Líneas
class LineCreate(LineBase):
    """
    Esquema para la Creación de Líneas.

    Hereda de `LineBase` y se utiliza para validar los datos
    al crear una nueva línea.
    """
    pass
# Esquema para la Actualización de Líneas
class LineUpdate(LineBase):
    """
    Esquema para la Actualización de Líneas.
    Define los campos que pueden ser actualizados para una línea existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    id_categoria: Optional[Decimal] = None
    nom_linea: Optional[str] = None
    ind_activo: Optional[bool] = None
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
