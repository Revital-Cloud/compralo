"""
Módulo de Esquemas de CMS Content

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con el CMS Content.
Incluye esquemas para la creación, actualización y visualización de CMS Content,
así como un esquema para mensajes de respuesta genéricos.

"""
from pydantic import BaseModel, Field
from typing import Optional,Dict,Any
from decimal import Decimal

class CmsBase(BaseModel):
    """
    Esquema Base para CMS Content

    Contiene los campos comunes para la creación y visualización de CMS Content.
    Utilizado como base para otros esquemas de CMS Content más específicos.

    Atributos:
        nom_cms_content (str): Nombre del pagina
        des_cms_content (Dict[str,Any]): Secciones con sus cambios
        num_version (int): Número de versión
        usr_insert (Optional[Decimal]): Usuario que insertó el registro.
    """
    nom_cms_content: str = Field(..., description="Nombre del pagina")
    des_cms_content: Dict[str,Any] = Field(...,description="Secciones con sus cambios")
    num_version: int = Field(...,description="numero de version")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")

    class Config:
        from_attributes = True

class CmsCreate(CmsBase):
    """
    Esquema para crear un nuevo CMS Content

    Hereda de `CmsBase` y se utiliza para validar los datos
    antes de crear un nuevo CMS Content.
    """
    pass

class CmsUpdate(BaseModel):
    """
    Esquema para actualizar un CMS Content existente

    Define los campos que pueden ser actualizados para un CMS Content existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    nom_cms_content: Optional[str] = Field(None, description="Nombre del pagina")
    des_cms_content: Optional[Dict[str,Any]] = Field(None, description="Secciones con sus cambios")
    num_version: Optional[int] = Field(None, description="numero de version")
    ind_publicado: Optional[bool] = Field(None, description="Indicador si esta publicado o no")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")

class Cms(CmsBase):
    """
    Esquema para la visualización de un CMS Content

    Hereda de `CmsBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de CMS Content.
    Incluye el `id_cms_content` y los campos de auditoría.
    """
    id_cms_content: int
    nom_cms_content: str
    des_cms_content: Dict[str,Any]
    num_version: int
    ind_publicado: bool

class ResponseMessage(BaseModel):
    """
    Esquema para mensajes de respuesta genéricos

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str