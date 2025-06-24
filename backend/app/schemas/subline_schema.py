"""
Módulo de Esquemas de Sublineas.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con las sublineas.
Incluye esquemas para la creación, actualización y visualización de sublineas,
así como un esquema para mensajes de respuesta genéricos.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from decimal import Decimal
class SublineBase(BaseModel):
    """
    Esquema Base para Sublineas.

    Contiene los campos comunes para la creación y visualización de sublineas.
    Utilizado como base para otros esquemas de sublineas más específicos.
    Atributos:
        id_categoria (Decimal): Identificador de la categoría.
        id_linea (Decimal): Identificador de la linea.
        nom_sublinea (str): Nombre de la sublinea.
        ind_activo (bool): Indica si la sublinea está activa.
    """
    id_categoria: Decimal = Field(..., description="Identificador de la categoría.")
    id_linea: Decimal = Field(..., description="Identificador de la linea.")
    nom_sublinea: str = Field(..., description = "Nombre de la sublinea.")
    ind_activo: bool = Field(..., description = "Indica si la sublinea está activa.")

    class Config:
        from_attributes = True
        

class Subline(SublineBase):
    """
    Esquema para la Visualización de Sublineas.

    Hereda de `SublineBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de sublineas.
    Incluye el `id_sublinea` y los campos de auditoría.
    """
    id_sublinea: Decimal
class SublineCreate(SublineBase):
    """
    Esquema para la Creación de Sublineas.

    Hereda de `SublineBase` y se utiliza para validar los datos
    al crear una nueva sublinea. Puede incluir campos adicionales o
    modificar el comportamiento de los campos heredados si es necesario
    para la operación de creación.
    """
    pass
class SublineUpdate(SublineBase):
    """
    Esquema para la Actualización de Sublineas.

    Define los campos que pueden ser actualizados para una sublinea existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    id_categoria: Optional[Decimal] = None
    id_linea: Optional[Decimal] = None
    nom_sublinea: Optional[str] = None
    ind_activo: Optional[bool] = None
    
    
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str
    
