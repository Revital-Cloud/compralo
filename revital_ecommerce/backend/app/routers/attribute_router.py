"""
Router for tab_attributes (master attributes catalog). Admin only.
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.attribute_schema import (
    AttributeCreate,
    AttributeUpdate,
    Attribute,
    AttributeValue,
    AttributeValueCreate,
    AttributeValueUpdate,
    ResponseMessage,
)
from services import attribute_service

router = APIRouter(tags=["Atributos"])


def _row_to_attribute(r) -> Attribute | None:
    """Build Attribute from DB row; skip rows with invalid name (e.g. empty string)."""
    d = dict(r)
    if not (d.get("name") or "").strip():
        return None
    return Attribute(**d)


@router.get("/attributes", response_model=list[Attribute])
async def get_attributes(db: Session = Depends(get_db)):
    """List all attributes (id, name, data_type). Invalid rows (e.g. empty name) are excluded."""
    rows = attribute_service.get_all(db)
    return [a for r in rows if (a := _row_to_attribute(r)) is not None]


@router.get("/attributes/{id_attr}", response_model=Attribute)
async def get_attribute(id_attr: Decimal, db: Session = Depends(get_db)):
    """Get one attribute by id."""
    row = attribute_service.get_by_id(db, id_attr)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Atributo no encontrado")
    att = _row_to_attribute(row)
    if att is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Atributo no encontrado")
    return att


@router.post("/attributes", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_attribute(
    attr: AttributeCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """Create attribute. Name must be unique; data_type must be text, number or boolean."""
    try:
        attribute_service.create(db, attr, current_user.id_usuario)
        return ResponseMessage(message="Atributo creado exitosamente")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/attributes/{id_attr}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_attribute(
    id_attr: Decimal,
    attr: AttributeUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """Update attribute."""
    try:
        attribute_service.update(db, id_attr, attr, current_user.id_usuario)
        return ResponseMessage(message="Atributo actualizado exitosamente")
    except ValueError as e:
        if "no encontrado" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/attributes/{id_attr}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_attribute(
    id_attr: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """Delete attribute. Fails if used by categories or variant attributes."""
    try:
        attribute_service.delete(db, id_attr)
        return ResponseMessage(message="Atributo eliminado exitosamente")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ---------------------------------------------------------------------------
# Attribute values (tab_attribute_values)
# ---------------------------------------------------------------------------


@router.get("/attributes/{id_attr}/values", response_model=list[AttributeValue])
async def get_attribute_values(id_attr: Decimal, db: Session = Depends(get_db)):
    """List values for an attribute, ordered by sort_order."""
    rows = attribute_service.get_values_by_attribute_id(db, id_attr)
    return [AttributeValue(**dict(r)) for r in rows]


@router.post(
    "/attributes/{id_attr}/values",
    response_model=ResponseMessage,
    status_code=status.HTTP_201_CREATED,
)
async def create_attribute_value(
    id_attr: Decimal,
    payload: AttributeValueCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """Create a value for an attribute. Attribute must have has_predefined_values=True."""
    try:
        attribute_service.create_value(db, id_attr, payload, current_user.id_usuario)
        return ResponseMessage(message="Valor creado exitosamente")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/attributes/{id_attr}/values/{id_val}", response_model=ResponseMessage)
async def update_attribute_value(
    id_attr: Decimal,
    id_val: Decimal,
    payload: AttributeValueUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """Update an attribute value."""
    try:
        attribute_service.update_value(db, id_attr, id_val, payload, current_user.id_usuario)
        return ResponseMessage(message="Valor actualizado exitosamente")
    except ValueError as e:
        if "no encontrado" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/attributes/{id_attr}/values/{id_val}", response_model=ResponseMessage)
async def delete_attribute_value(
    id_attr: Decimal,
    id_val: Decimal,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    """Delete an attribute value. Fails if used in product variant attributes."""
    try:
        attribute_service.delete_value(db, id_attr, id_val)
        return ResponseMessage(message="Valor eliminado exitosamente")
    except ValueError as e:
        if "no encontrado" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
