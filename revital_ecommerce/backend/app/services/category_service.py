from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.category_schema import CategoryCreate, CategoryUpdate

"""
En este archivo se crean las funciones utilizando "query by example" para interactuar con la base de datos en un CRUD básico:
 
# `get_categories`: Obtiene todos los proveedores registrados en la base de datos. (trae lo importante, no lo de auditoría)
# `get_category`: Obtiene un proveedor específico por su ID.
# `create_category`: Crea una nueva categoría en la base de datos llamando a la función fun_insert_categoria().
# `update_category`: Actualiza una categoría existente en la base de datos llamando a la función fun_update_categoria().
# `delete_category`: Elimina una categoría existente en la base de datos llamando a la función fun_delete_categoria().

Responsabilidades principales:
- consulta de árbol de categorías (raíz/línea/sublínea),
- CRUD de categorías vía funciones SQL,
- asignación de atributos por categoría (`tab_category_attributes`),
- activación/desactivación en cascada.
"""


# Todas las categorías (tab_categories + conteo de productos activos en tab_products)
def get_categories(db: Session):
    """
    Lista todas las categorías con conteo de productos activos.

    Se consume desde:
    - `category_router.get_categories`
    """
    try:
        query = text("""
        SELECT
            c.id,
            c.name,
            c.slug,
            c.parent_id,
            c.is_active,
            c.is_active AS ind_activo,
            c.usr_insert,
            c.fec_insert,
            c.usr_update,
            c.fec_update,
            (SELECT COUNT(*) FROM tab_products p
             WHERE p.category_id = c.id AND p.is_active = true)::int AS productos_count
        FROM tab_categories c
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener categorías: {str(e)}")

# Categorías raíz (parent_id IS NULL)
def get_categories_roots(db: Session):
    """Obtiene categorías raíz (`parent_id IS NULL`)."""
    try:
        query = text("""
        SELECT
            c.id,
            c.name,
            c.slug,
            c.parent_id,
            c.is_active,
            c.is_active AS ind_activo,
            c.usr_insert,
            c.fec_insert,
            c.usr_update,
            c.fec_update,
            (SELECT COUNT(*) FROM tab_products p
             WHERE p.category_id = c.id AND p.is_active = true)::int AS productos_count
        FROM tab_categories c
        WHERE c.parent_id IS NULL
        ORDER BY c.name
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener categorías raíz: {str(e)}")

# Líneas (hijas de categorías raíz)
def get_categories_lines(db: Session):
    """Obtiene categorías de segundo nivel (líneas)."""
    try:
        query = text("""
        SELECT
            c.id,
            c.name,
            c.slug,
            c.parent_id,
            c.is_active,
            c.is_active AS ind_activo,
            c.usr_insert,
            c.fec_insert,
            c.usr_update,
            c.fec_update,
            (SELECT COUNT(*) FROM tab_products p
             WHERE p.category_id = c.id AND p.is_active = true)::int AS productos_count
        FROM tab_categories c
        WHERE c.parent_id IN (SELECT id FROM tab_categories WHERE parent_id IS NULL)
        ORDER BY c.name
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener líneas: {str(e)}")

# Sublíneas (nietas de categorías raíz)
def get_categories_sublines(db: Session):
    """Obtiene categorías de tercer nivel (sublíneas)."""
    try:
        query = text("""
        SELECT
            c.id,
            c.name,
            c.slug,
            c.parent_id,
            c.is_active,
            c.is_active AS ind_activo,
            c.usr_insert,
            c.fec_insert,
            c.usr_update,
            c.fec_update,
            (SELECT COUNT(*) FROM tab_products p
             WHERE p.category_id = c.id AND p.is_active = true)::int AS productos_count
        FROM tab_categories c
        WHERE c.parent_id IN (
            SELECT id FROM tab_categories 
            WHERE parent_id IN (SELECT id FROM tab_categories WHERE parent_id IS NULL)
        )
        ORDER BY c.name
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener sublíneas: {str(e)}")

# Una categoría específica (tab_categories)
def get_category(db: Session, category_id: Decimal):
    """Obtiene una categoría por ID con su conteo de productos activos."""
    try:
        query = text("""
        SELECT
            c.id,
            c.name,
            c.slug,
            c.parent_id,
            c.is_active,
            c.is_active AS ind_activo,
            c.usr_insert,
            c.fec_insert,
            c.usr_update,
            c.fec_update,
            (SELECT COUNT(*) FROM tab_products p
             WHERE p.category_id = c.id AND p.is_active = true)::int AS productos_count
        FROM tab_categories c
        WHERE c.id = :category_id
        """)
        result = db.execute(query, {"category_id": category_id})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener la categoría: {str(e)}")
    
    
# Crear una categoría (fun_insert_categoria: p_name, p_parent_id, p_is_active, p_usr_operacion)
def create_category(db: Session, category: CategoryCreate, usr_insert: Decimal):
    """
    Crea categoría mediante `fun_insert_categoria`.

    Comportamiento:
    - acepta `is_active` o `ind_activo` desde frontend,
    - parsea mensaje SQL para extraer `id` creado cuando aplica.
    """
    try:
        payload = category.model_dump(exclude_none=True)
        query = text("""
        SELECT fun_insert_categoria(
            :p_name,
            :p_parent_id,
            :p_is_active,
            :p_usr_operacion
        )
        """)
        # Aceptar is_active o ind_activo del frontend; por defecto True al crear
        is_active = payload.get("is_active") if payload.get("is_active") is not None else payload.get("ind_activo", True)
        result = db.execute(query, {
            "p_name": payload.get("name"),
            "p_parent_id": payload.get("parent_id"),
            "p_is_active": is_active,
            "p_usr_operacion": usr_insert,
        })
        fetched_result = result.fetchone()
        db.commit()
        msg = fetched_result[0] if fetched_result else None
        if not msg:
            return None
        msg_str = str(msg).strip()
        if msg_str.upper().startswith("ERROR"):
            raise Exception(msg_str)
        # Mensaje de éxito: "Categoría insertada correctamente. Id: 123"
        prefix = "Categoría insertada correctamente. Id:"
        if prefix in msg_str:
            id_str = msg_str.split(prefix, 1)[-1].strip()
            return Decimal(id_str) if id_str.isdigit() else None
        return None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear la categoría: {str(e)}")
    
# Actualizar categoría (fun_update_categoria: p_id, p_name, p_parent_id, p_is_active, p_usr_operacion)
def update_category(db: Session, category_id: Decimal, category: CategoryUpdate, usr_update: Decimal):
    """
    Actualiza categoría mediante `fun_update_categoria`.

    Nota:
    - si faltan campos opcionales, usa valores actuales para mantener contrato.
    """
    try:
        payload = category.model_dump(exclude_unset=True)
        # Obtener valores actuales si no se envían (la función espera p_name obligatorio)
        current = get_category(db, category_id)
        if not current:
            raise ValueError("Categoría no encontrada")
        name = payload.get("name", current.get("name"))
        query = text("""
        SELECT fun_update_categoria(
            :p_id,
            :p_name,
            :p_parent_id,
            :p_is_active,
            :p_usr_operacion
        )
        """)
        is_active = payload.get("is_active") if payload.get("is_active") is not None else payload.get("ind_activo")
        if is_active is None:
            is_active = current.get("is_active", True)
        result = db.execute(query, {
            "p_id": category_id,
            "p_name": name,
            "p_parent_id": payload.get("parent_id"),
            "p_is_active": is_active,
            "p_usr_operacion": usr_update,
        })
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar la categoría: {str(e)}")

# Activar o desactivar categoría (fun_deactivate_activate_categoria: p_id_categoria, p_activar, p_usr_operacion)
def deactivate_activate_category(db: Session, category_id: Decimal, usr_update: Decimal, activar: bool):
    """
    Activa o desactiva una categoría y en cascada subcategorías y productos (tab_categories / tab_products).

    Implementación:
    - delega en `fun_deactivate_activate_categoria`.
    """
    try:
        query = text("""
        SELECT fun_deactivate_activate_categoria(:p_id_categoria, :p_activar, :p_usr_operacion)
        """)
        result = db.execute(query, {
            "p_id_categoria": category_id,
            "p_activar": activar,
            "p_usr_operacion": usr_update,
        })
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al cambiar estado de la categoría: {str(e)}")

#Desactivar una categoria (mantener compatibilidad)
def deactivate_category(db: Session, category_id: Decimal, usr_update: Decimal):
    """
    Desactiva una categoría (wrapper para mantener compatibilidad).
    """
    return deactivate_activate_category(db, category_id, usr_update, False)


def get_category_attributes(db: Session, category_id: Decimal):
    """
    Lista atributos de una categoría (tab_category_attributes + nombre y data_type del atributo).
    Returns list of dicts: id, category_id, attribute_id, is_required, is_filterable, attribute_name, data_type.

    Se usa en:
    - configuración de formulario de producto por categoría.
    """
    try:
        query = text("""
            SELECT
                ca.id,
                ca.category_id,
                ca.attribute_id,
                ca.is_required,
                ca.is_filterable,
                a.name AS attribute_name,
                a.data_type,
                COALESCE(a.has_predefined_values, FALSE) AS has_predefined_values
            FROM tab_category_attributes ca
            JOIN tab_attributes a ON a.id = ca.attribute_id
            WHERE ca.category_id = :category_id
            ORDER BY a.name
        """)
        result = db.execute(query, {"category_id": category_id})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener atributos de la categoría: {str(e)}")


def get_category_attributes_with_values(db: Session, category_id: Decimal):
    """
    Lista atributos de la categoría con sus valores predefinidos (cuando has_predefined_values=True).
    Una sola query de atributos y una de valores para evitar N+1.

    Resultado:
    - lista de atributos, cada uno con `values` listo para UI.
    """
    try:
        attrs = get_category_attributes(db, category_id)
        attrs = [dict(a) for a in attrs]
        ids_with_values = [a["attribute_id"] for a in attrs if a.get("has_predefined_values")]
        if not ids_with_values:
            return [{"values": [], **a} for a in attrs]
        placeholders = ", ".join(f":id{i}" for i in range(len(ids_with_values)))
        values_q = text(f"""
            SELECT id, attribute_id, value, hex_color, sort_order
            FROM tab_attribute_values
            WHERE attribute_id IN ({placeholders}) AND is_active = TRUE
            ORDER BY attribute_id, sort_order, id
        """)
        params = {f"id{i}": aid for i, aid in enumerate(ids_with_values)}
        values_rows = db.execute(values_q, params).mappings().all()
        by_attr: dict = {}
        for row in values_rows:
            aid = row["attribute_id"]
            if aid not in by_attr:
                by_attr[aid] = []
            by_attr[aid].append({"id": row["id"], "value": row["value"], "hex_color": row["hex_color"], "sort_order": row["sort_order"]})
        for a in attrs:
            a["values"] = by_attr.get(a["attribute_id"], [])
        return attrs
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener atributos con valores: {str(e)}")


def set_category_attributes(db: Session, category_id: Decimal, items: list, usr: Decimal):
    """
    Reemplaza los atributos de una categoría: borra los existentes e inserta los nuevos.
    items: list of dicts with keys attribute_id, is_required, is_filterable.
    UNIQUE(category_id, attribute_id) respetado; id generado con COALESCE(MAX(id),0)+row_number.

    Estrategia:
    - operación de reemplazo total para simplificar sincronización frontend-backend.
    """
    try:
        delete_q = text("DELETE FROM tab_category_attributes WHERE category_id = :category_id")
        db.execute(delete_q, {"category_id": category_id})
        if not items:
            db.commit()
            return
        # Obtener siguiente id (evitar conflicto con múltiples inserts)
        max_q = text("SELECT COALESCE(MAX(id), 0) AS mx FROM tab_category_attributes")
        row = db.execute(max_q).fetchone()
        next_id = int(row[0]) + 1 if row else 1
        insert_q = text("""
            INSERT INTO tab_category_attributes (id, category_id, attribute_id, is_required, is_filterable, usr_insert)
            VALUES (:id, :category_id, :attribute_id, :is_required, :is_filterable, :usr_insert)
        """)
        for i, item in enumerate(items):
            db.execute(insert_q, {
                "id": next_id + i,
                "category_id": category_id,
                "attribute_id": item["attribute_id"],
                "is_required": item.get("is_required", False),
                "is_filterable": item.get("is_filterable", False),
                "usr_insert": usr,
            })
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al guardar atributos de la categoría: {str(e)}")
