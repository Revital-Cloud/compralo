"""
Esquemas para la barra informativa superior (Top Info Bar).

La configuración se almacena en tab_cms_content con nom_cms_content = 'top_info_bar'.
El contenido extendido (colores, fechas, ind_visible) va en des_cms_content (JSONB).
"""
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# Regex hex 3 o 6 caracteres; nombres CSS seguros (solo letras y espacios)
HEX_PATTERN = r"^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$"
SAFE_COLOR_NAMES = {
    "black", "white", "red", "green", "blue", "yellow", "orange", "gray", "grey",
    "transparent", "currentcolor", "inherit", "initial", "unset",
    "silver", "maroon", "purple", "fuchsia", "lime", "olive", "navy", "teal", "aqua",
    "darkblue", "darkred", "darkgreen", "darkgray", "lightgray", "midnightblue",
}


def _validate_color(v: Optional[str]) -> Optional[str]:
    if v is None or v == "":
        return v
    v = v.strip()
    if not v:
        return None
    import re
    if re.match(HEX_PATTERN, v):
        return v
    if v.lower() in SAFE_COLOR_NAMES:
        return v
    raise ValueError("Color debe ser hex (#xxx o #xxxxxx) o un nombre CSS seguro")


class TopInfoBarPayload(BaseModel):
    """Payload para crear/actualizar la barra (admin)."""

    des_mensaje: str = Field(..., min_length=1, max_length=2000, description="Contenido de la barra (texto/HTML básico)")
    ind_activo: bool = Field(True, description="Activo (mapea a ind_publicado)")
    ind_visible: bool = Field(True, description="Mostrar u ocultar la barra")
    color_fondo: Optional[str] = Field(None, description="Color de fondo (hex o nombre CSS)")
    color_texto: Optional[str] = Field(None, description="Color del texto (hex o nombre CSS)")
    fec_inicio: Optional[date] = Field(None, description="Fecha inicio vigencia")
    fec_fin: Optional[date] = Field(None, description="Fecha fin vigencia")
    boton_texto: Optional[str] = Field(None, max_length=80, description="Texto del botón CTA (opcional)")
    boton_url: Optional[str] = Field(None, max_length=2000, description="URL del botón CTA (opcional)")
    boton_color_fondo: Optional[str] = Field(None, description="Color de fondo del botón CTA (hex o nombre CSS)")
    boton_color_texto: Optional[str] = Field(None, description="Color del texto del botón CTA (hex o nombre CSS)")

    @field_validator("color_fondo", "color_texto", "boton_color_fondo", "boton_color_texto")
    @classmethod
    def validate_color_field(cls, v: Optional[str]) -> Optional[str]:
        return _validate_color(v)

    @field_validator("fec_fin")
    @classmethod
    def fec_fin_after_inicio(cls, v: Optional[date], info):
        if v is not None and info.data.get("fec_inicio") is not None and info.data["fec_inicio"] > v:
            raise ValueError("fec_fin debe ser mayor o igual que fec_inicio")
        return v


class TopInfoBarPublic(BaseModel):
    """Respuesta del endpoint público (solo lo necesario para renderizar)."""

    des_mensaje: str
    color_fondo: Optional[str] = None
    color_texto: Optional[str] = None
    boton_texto: Optional[str] = None
    boton_url: Optional[str] = None
    boton_color_fondo: Optional[str] = None
    boton_color_texto: Optional[str] = None


class TopInfoBar(BaseModel):
    """Respuesta admin (configuración completa)."""

    id_cms_content: int
    nom_cms_content: str
    des_mensaje: str
    ind_activo: bool
    ind_visible: bool
    color_fondo: Optional[str] = None
    color_texto: Optional[str] = None
    fec_inicio: Optional[date] = None
    fec_fin: Optional[date] = None
    boton_texto: Optional[str] = None
    boton_url: Optional[str] = None
    boton_color_fondo: Optional[str] = None
    boton_color_texto: Optional[str] = None
    num_version: int

    class Config:
        from_attributes = True
