# Esquemas Pydantic (validación de datos, request/response)
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any # Usaremos Dict o Any para JSONB
from decimal import Decimal # Para campos DECIMAL si se requiere precisión
from datetime import datetime

# Esquema Base para Categorías (alineado con tab_categories: id, name, slug, parent_id, is_active)
class CategoryBase(BaseModel):
    """
    Esquema Base para Categorías.

    Contiene los campos comunes para la creación y visualización de categorías.
    Alineado con tab_categories (name, slug, parent_id, is_active).
    """
    name: str = Field(..., description="Nombre de la categoría (tab_categories.name).")
    is_active: Optional[bool] = Field(None, description="tab_categories.is_active.")
    parent_id: Optional[Decimal] = Field(None, description="ID de la categoría padre (NULL = raíz).")
    slug: Optional[str] = Field(None, description="Slug único de la categoría.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del registro.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del registro.")

    class Config:
        from_attributes = True
      
# Esquema para la Creación de Categorías (acepta ind_activo del frontend)
class CategoryCreate(CategoryBase):
    """
    Esquema para la Creación de Categorías.
    Hereda de `CategoryBase` y se utiliza para validar los datos
    al crear una nueva categoría. Acepta ind_activo como alias de is_active.
    """
    ind_activo: Optional[bool] = Field(None, description="Alias de is_active (frontend).")

# Esquema para la Actualización de Categorías (acepta ind_activo del frontend)
class CategoryUpdate(BaseModel):
    """
    Esquema para la Actualización de Categorías.
    Permite actualizar campos opcionales (alineado con fun_update_categoria).
    """
    name: Optional[str] = Field(None, description="Nombre de la categoría.")
    is_active: Optional[bool] = Field(None, description="tab_categories.is_active.")
    ind_activo: Optional[bool] = Field(None, description="Alias de is_active (frontend).")
    parent_id: Optional[Decimal] = Field(None, description="ID de la categoría padre.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")

# Esquema para llamar una sola categoría
class Category(CategoryBase):
    """
    Esquema para la respuesta de una categoría (tab_categories).
    id = tab_categories.id. ind_activo = mismo valor que is_active para compatibilidad con el frontend.
    """
    id: Decimal = Field(..., description="Identificador único para la categoría (tab_categories.id).")
    ind_activo: Optional[bool] = Field(None, description="Alias de is_active para el frontend.")
    productos_count: Optional[int] = Field(None, description="Cantidad de productos activos en la categoría.")
        
# Esquema para toggle (activar/desactivar)
class ToggleRequest(BaseModel):
    """
    Esquema para solicitudes de activar/desactivar.
    
    Utilizado en endpoints toggle para activar o desactivar entidades.
    
    Atributos:
        activar (bool): True para activar, False para desactivar.
    """
    activar: bool = Field(..., description="True para activar, False para desactivar.")

# Category attributes (tab_category_attributes)
class CategoryAttributeItem(BaseModel):
    """One attribute linked to a category (request body)."""
    attribute_id: Decimal = Field(..., description="ID del atributo en tab_attributes.")
    is_required: bool = Field(False, description="Si es obligatorio en variantes.")
    is_filterable: bool = Field(False, description="Si aparece en filtros públicos.")


class SetCategoryAttributesRequest(BaseModel):
    """Body for PUT /categories/{id}/attributes."""
    attributes: list[CategoryAttributeItem] = Field(default_factory=list, description="Lista de atributos de la categoría.")


class CategoryAttributeResponse(BaseModel):
    """One row for GET /categories/{id}/attributes (with attribute name and data_type)."""
    id: Decimal = Field(..., description="ID en tab_category_attributes.")
    category_id: Decimal = Field(..., description="ID de la categoría.")
    attribute_id: Decimal = Field(..., description="ID del atributo.")
    is_required: bool = Field(..., description="Si es obligatorio.")
    is_filterable: bool = Field(..., description="Si es filtrable.")
    attribute_name: Optional[str] = Field(None, description="Nombre del atributo (tab_attributes.name).")
    data_type: Optional[str] = Field(None, description="Tipo de dato: text, number, boolean.")
    has_predefined_values: bool = Field(False, description="Si el atributo usa valores de tab_attribute_values.")

    class Config:
        from_attributes = True


class AttributeValueSummary(BaseModel):
    """Minimal attribute value for GET /categories/{id}/attributes-with-values."""
    id: Decimal = Field(..., description="ID en tab_attribute_values.")
    value: str = Field(..., description="Valor mostrado.")
    hex_color: Optional[str] = Field(None, description="Color HEX para swatches.")
    sort_order: int = Field(0, description="Orden de visualización.")

    class Config:
        from_attributes = True


class CategoryAttributeWithValuesResponse(CategoryAttributeResponse):
    """Category attribute plus list of predefined values when has_predefined_values is True."""
    values: list[AttributeValueSummary] = Field(default_factory=list, description="Valores predefinidos del atributo.")


# Respuesta de creación (incluye id para poder llamar a PUT /categories/{id}/attributes)
class CreateCategoryResponse(BaseModel):
    message: str
    id: Optional[Decimal] = Field(None, description="ID de la categoría creada.")

# Mensajitos para las respuesta api en categorias
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.

    Atributos:
        message (str): El mensaje a ser enviado en la respuesta.
    """
    message: str