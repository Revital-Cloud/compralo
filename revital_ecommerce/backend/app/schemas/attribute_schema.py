"""
Schemas for tab_attributes (master attributes catalog) and tab_attribute_values.
"""
import re
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


class AttributeBase(BaseModel):
    name: str = Field(..., min_length=1, description="Attribute name")
    data_type: str = Field(..., description="One of: text, number, boolean")
    has_predefined_values: bool = Field(False, description="If True, attribute uses tab_attribute_values")

    class Config:
        from_attributes = True


class AttributeCreate(AttributeBase):
    pass


class AttributeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    data_type: Optional[str] = None
    has_predefined_values: Optional[bool] = None


class Attribute(AttributeBase):
    id: Decimal = Field(..., description="Attribute id")
    usr_insert: Optional[Decimal] = None
    fec_insert: Optional[datetime] = None
    usr_update: Optional[Decimal] = None
    fec_update: Optional[datetime] = None

    class Config:
        from_attributes = True


class ResponseMessage(BaseModel):
    message: str


# ---------------------------------------------------------------------------
# Attribute values (tab_attribute_values)
# ---------------------------------------------------------------------------


class AttributeValueBase(BaseModel):
    value: str = Field(..., min_length=1, description="Display value")
    hex_color: Optional[str] = Field(None, description="Hex color e.g. #RRGGBB for swatches")
    sort_order: int = Field(0, ge=0, description="Display order")
    is_active: bool = Field(True, description="Active flag")

    @field_validator("hex_color")
    @classmethod
    def validate_hex_color(cls, v: Optional[str]) -> Optional[str]:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        v = v.strip()
        if not HEX_COLOR_PATTERN.match(v):
            raise ValueError("hex_color debe ser un color HEX válido (#RRGGBB)")
        return v


class AttributeValueCreate(AttributeValueBase):
    pass


class AttributeValueUpdate(BaseModel):
    value: Optional[str] = Field(None, min_length=1)
    hex_color: Optional[str] = None
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

    @field_validator("hex_color")
    @classmethod
    def validate_hex_color(cls, v: Optional[str]) -> Optional[str]:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        v = v.strip()
        if not HEX_COLOR_PATTERN.match(v):
            raise ValueError("hex_color debe ser un color HEX válido (#RRGGBB)")
        return v


class AttributeValue(AttributeValueBase):
    id: Decimal = Field(..., description="Value id")
    attribute_id: Decimal = Field(..., description="Attribute id")
    usr_insert: Optional[Decimal] = None
    fec_insert: Optional[datetime] = None
    usr_update: Optional[Decimal] = None
    fec_update: Optional[datetime] = None

    class Config:
        from_attributes = True
