"""
Esquemas para generación de descripciones de producto con IA.
"""
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class GenerateProductDescriptionRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Nombre del producto")
    category: str = Field(..., min_length=2, max_length=120, description="Categoría comercial")
    brand: Optional[str] = Field(None, max_length=120, description="Marca del producto")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Atributos relevantes del producto")
    tone: Optional[str] = Field(None, max_length=60, description="Tono comercial deseado")


class GenerateProductDescriptionResponse(BaseModel):
    description: str
