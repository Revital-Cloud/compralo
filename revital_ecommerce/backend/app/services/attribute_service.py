"""
Service for tab_attributes CRUD (master attributes catalog).
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.attribute_schema import (
    AttributeCreate,
    AttributeUpdate,
    AttributeValueCreate,
    AttributeValueUpdate,
)

VALID_DATA_TYPES = ("text", "number", "boolean")


def get_all(db: Session):
    """List all attributes (id, name, data_type, has_predefined_values)."""
    try:
        q = text("""
            SELECT id, name, data_type, has_predefined_values, usr_insert, fec_insert, usr_update, fec_update
            FROM tab_attributes
            ORDER BY name
        """)
        result = db.execute(q)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener atributos: {str(e)}")


def get_by_id(db: Session, id_attr: Decimal):
    """Get one attribute by id."""
    try:
        q = text("""
            SELECT id, name, data_type, has_predefined_values, usr_insert, fec_insert, usr_update, fec_update
            FROM tab_attributes
            WHERE id = :id
        """)
        result = db.execute(q, {"id": id_attr})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener atributo: {str(e)}")


def _validate_data_type(data_type: str) -> None:
    if data_type not in VALID_DATA_TYPES:
        raise ValueError(f"data_type debe ser uno de: {', '.join(VALID_DATA_TYPES)}")


def create(db: Session, attr: AttributeCreate, usr_insert: Decimal):
    """Create attribute. Validates name unique and data_type."""
    try:
        _validate_data_type(attr.data_type)
        existing = db.execute(
            text("SELECT 1 FROM tab_attributes WHERE LOWER(TRIM(name)) = LOWER(TRIM(:name))"),
            {"name": attr.name}
        ).first()
        if existing:
            raise ValueError("Ya existe un atributo con ese nombre")
        next_id = db.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM tab_attributes")).scalar()
        db.execute(
            text("""
                INSERT INTO tab_attributes (id, name, data_type, has_predefined_values, usr_insert)
                VALUES (:id, :name, :data_type, :has_predefined_values, :usr_insert)
            """),
            {
                "id": next_id,
                "name": attr.name.strip(),
                "data_type": attr.data_type,
                "has_predefined_values": getattr(attr, "has_predefined_values", False),
                "usr_insert": usr_insert,
            }
        )
        db.commit()
        return next_id
    except ValueError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear atributo: {str(e)}")


def update(db: Session, id_attr: Decimal, attr: AttributeUpdate, usr_update: Decimal):
    """Update attribute. Validates name unique and data_type if provided."""
    try:
        current = get_by_id(db, id_attr)
        if not current:
            raise ValueError("Atributo no encontrado")
        updates = attr.model_dump(exclude_unset=True)
        if not updates:
            return
        if "data_type" in updates:
            _validate_data_type(updates["data_type"])
        if "name" in updates:
            existing = db.execute(
                text("SELECT 1 FROM tab_attributes WHERE LOWER(TRIM(name)) = LOWER(TRIM(:name)) AND id != :id"),
                {"name": updates["name"], "id": id_attr}
            ).first()
            if existing:
                raise ValueError("Ya existe un atributo con ese nombre")
        set_clause = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = id_attr
        updates["usr_update"] = usr_update
        db.execute(
            text(f"UPDATE tab_attributes SET {set_clause}, usr_update = :usr_update WHERE id = :id"),
            updates
        )
        db.commit()
    except ValueError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar atributo: {str(e)}")


def delete(db: Session, id_attr: Decimal):
    """Delete attribute. Fails if referenced by tab_category_attributes or tab_product_variant_attributes.
    tab_attribute_values are removed by FK CASCADE."""
    try:
        ref_ca = db.execute(
            text("SELECT 1 FROM tab_category_attributes WHERE attribute_id = :id LIMIT 1"),
            {"id": id_attr}
        ).first()
        if ref_ca:
            raise ValueError("No se puede eliminar: el atributo está asignado a categorías")
        ref_pva = db.execute(
            text("SELECT 1 FROM tab_product_variant_attributes WHERE attribute_id = :id LIMIT 1"),
            {"id": id_attr}
        ).first()
        if ref_pva:
            raise ValueError("No se puede eliminar: el atributo tiene valores en variantes")
        db.execute(text("DELETE FROM tab_attributes WHERE id = :id"), {"id": id_attr})
        db.commit()
    except ValueError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar atributo: {str(e)}")


# ---------------------------------------------------------------------------
# Attribute values (tab_attribute_values)
# ---------------------------------------------------------------------------


def get_values_by_attribute_id(db: Session, attribute_id: Decimal):
    """List values for an attribute, ordered by sort_order."""
    try:
        q = text("""
            SELECT id, attribute_id, value, hex_color, sort_order, is_active,
                   usr_insert, fec_insert, usr_update, fec_update
            FROM tab_attribute_values
            WHERE attribute_id = :attribute_id
            ORDER BY sort_order, id
        """)
        result = db.execute(q, {"attribute_id": attribute_id})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener valores del atributo: {str(e)}")


def _ensure_attribute_has_predefined_values(db: Session, attribute_id: Decimal) -> None:
    row = db.execute(
        text("SELECT has_predefined_values FROM tab_attributes WHERE id = :id"),
        {"id": attribute_id}
    ).first()
    if not row:
        raise ValueError("Atributo no encontrado")
    if not row[0]:
        raise ValueError("El atributo no usa valores predefinidos; active has_predefined_values primero")


def create_value(
    db: Session,
    attribute_id: Decimal,
    payload: AttributeValueCreate,
    usr_insert: Decimal,
) -> Decimal:
    """Create an attribute value. Attribute must have has_predefined_values=True. Value must be unique per attribute."""
    try:
        _ensure_attribute_has_predefined_values(db, attribute_id)
        existing = db.execute(
            text("""
                SELECT 1 FROM tab_attribute_values
                WHERE attribute_id = :aid AND LOWER(TRIM(value)) = LOWER(TRIM(:val))
            """),
            {"aid": attribute_id, "val": payload.value}
        ).first()
        if existing:
            raise ValueError("Ya existe un valor con ese nombre en este atributo")
        next_id = db.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM tab_attribute_values")).scalar()
        db.execute(
            text("""
                INSERT INTO tab_attribute_values (id, attribute_id, value, hex_color, sort_order, is_active, usr_insert)
                VALUES (:id, :attribute_id, :value, :hex_color, :sort_order, :is_active, :usr_insert)
            """),
            {
                "id": next_id,
                "attribute_id": attribute_id,
                "value": payload.value.strip(),
                "hex_color": payload.hex_color.strip() if payload.hex_color else None,
                "sort_order": payload.sort_order,
                "is_active": payload.is_active,
                "usr_insert": usr_insert,
            }
        )
        db.commit()
        return next_id
    except ValueError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear valor: {str(e)}")


def update_value(
    db: Session,
    attribute_id: Decimal,
    value_id: Decimal,
    payload: AttributeValueUpdate,
    usr_update: Decimal,
) -> None:
    """Update an attribute value. Value must belong to attribute; value text must remain unique per attribute."""
    try:
        row = db.execute(
            text("SELECT id FROM tab_attribute_values WHERE id = :vid AND attribute_id = :aid"),
            {"vid": value_id, "aid": attribute_id}
        ).first()
        if not row:
            raise ValueError("Valor no encontrado o no pertenece al atributo")
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            return
        if "value" in updates:
            existing = db.execute(
                text("""
                    SELECT 1 FROM tab_attribute_values
                    WHERE attribute_id = :aid AND LOWER(TRIM(value)) = LOWER(TRIM(:val)) AND id != :vid
                """),
                {"aid": attribute_id, "val": updates["value"], "vid": value_id}
            ).first()
            if existing:
                raise ValueError("Ya existe un valor con ese nombre en este atributo")
            updates["value"] = updates["value"].strip()
        if "hex_color" in updates and updates["hex_color"] is not None:
            updates["hex_color"] = updates["hex_color"].strip() or None
        set_clause = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = value_id
        updates["attribute_id"] = attribute_id
        updates["usr_update"] = usr_update
        db.execute(
            text(f"UPDATE tab_attribute_values SET {set_clause}, usr_update = :usr_update WHERE id = :id AND attribute_id = :attribute_id"),
            updates
        )
        db.commit()
    except ValueError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar valor: {str(e)}")


def delete_value(db: Session, attribute_id: Decimal, value_id: Decimal) -> None:
    """Delete an attribute value. Fails if used in tab_product_variant_attributes."""
    try:
        row = db.execute(
            text("SELECT id FROM tab_attribute_values WHERE id = :vid AND attribute_id = :aid"),
            {"vid": value_id, "aid": attribute_id}
        ).first()
        if not row:
            raise ValueError("Valor no encontrado o no pertenece al atributo")
        ref = db.execute(
            text("SELECT 1 FROM tab_product_variant_attributes WHERE attribute_value_id = :vid LIMIT 1"),
            {"vid": value_id}
        ).first()
        if ref:
            raise ValueError("No se puede eliminar: el valor está en uso en variantes de producto")
        db.execute(
            text("DELETE FROM tab_attribute_values WHERE id = :vid AND attribute_id = :aid"),
            {"vid": value_id, "aid": attribute_id}
        )
        db.commit()
    except ValueError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar valor: {str(e)}")
