"""
Módulo de Esquemas de CMS Content

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con el CMS Content.
Incluye esquemas para la creación, actualización y visualización de CMS Content,
así como un esquema para mensajes de respuesta genéricos.

"""
from pydantic import BaseModel, Field
from typing import Optional,Dict,Any

class CmsBase(BaseModel):
    """
    Esquema Base para CMS Content

    Contiene los campos comunes para la creación y visualización de CMS Content.
    Utilizado como base para otros esquemas de CMS Content más específicos.

    Atributos:
        nom_cms_content (str): Nombre del pagina
        des_cms_content (Dict[str,Any]): Secciones con sus cambios
    """
    nom_cms_content: str = Field(..., description="Nombre del pagina")
    des_cms_content: Dict[str,Any] = Field(...,description="Secciones con sus cambios")
    num_version: int = Field(...,description="numero de version")
    ind_publicado: bool= Field(...,description="Indicador si esta publicado o no")

    class Config:
        from_attributes = True

class CmsCreate(CmsBase):
    """
    Esquema para crear un nuevo CMS Content

    Hereda de `CmsBase` y se utiliza para validar los datos
    antes de crear un nuevo CMS Content.
    """
    pass

class CmsUpdate(CmsBase):
    """
    Esquema para actualizar un CMS Content existente

    Define los campos que pueden ser actualizados para un CMS Content existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    nom_cms_content: Optional[str] = None
    des_cms_content: Optional[Dict[str,Any]] = None
    num_version: Optional[int] = None
    ind_publicado: Optional[bool] = None

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