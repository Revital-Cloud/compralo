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
        id_linea (Decimal): Identificador único para la línea.
        nom_linea (str): Nombre de la línea.
    """
    id_linea: Decimal = Field(..., description="Identificador único para la línea.")
    nom_linea: str = Field(..., description="Nombre de la línea.")
    id_categoria: Decimal = Field(..., description="Identificador de la categoría a la que pertenece la línea.")
    
    class Config:
        from_attributes = True
        
        
# esquema para Mostar las lineas   
class Line(LineBase):
    """
    Esquema para Mostrar Líneas.

    Hereda de `LineBase` y se utiliza para validar los datos
    al mostrar una línea específica. Incluye todos los campos de `LineBase`.
    """
    pass 
        
# Esquema para la Creación de Líneas
class LineCreate(LineBase):
    nom_linea: str = Field(..., description="Nombre de la línea.")
    id_categoria: Decimal = Field(..., description="Identificador de la categoría a la que pertenece la línea.")

# Esquema para la Actualización de Líneas
class LineUpdate(LineCreate):
    """
    Esquema para la Actualización de Líneas.

    Utiliza los mismos campos que LineBase, pero se puede extender si es necesario.
    """
    pass

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
