"""
Módulo de Servicios de Producto.

Este módulo contiene la lógica de negocio para gestionar los productos.
Se encarga de interactuar con la base de datos para realizar operaciones
CRUD (Crear, Leer, Actualizar, Eliminar) sobre los productos, utilizando
funciones de base de datos (procedimientos almacenados o funciones SQL).

Las funciones aquí definidas son llamadas por los routers de la API
y utilizan los esquemas Pydantic para la validación y transformación de datos.

Mapa del módulo (alto nivel):
- Catálogo público: listado, detalle por slug/id, filtros y búsqueda.
- Panel admin: listado avanzado, detalle compuesto, creación/edición compuesta.
- Gestión de activación/desactivación y soporte de imágenes/variantes.

Se consume principalmente desde:
- `routers/product_router.py`
- módulos de analítica/notificaciones que leen stock o estado de producto.
"""
# Lógica de negocio 
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import UploadFile
from typing import List, Optional
import json
import re
import unicodedata
from uuid import uuid4
from psycopg2.extras import Json

from schemas.product_schema import (
    ProductCreate,
    ProductUpdate,
    ProductFilterParams,
    ProductFiltered,
    ProductFilterResponse,
    ProductFilterStats,
    ProductCreateComposite,
)
from services import cloudinary_service
from services.out_of_stock_notification_service import (
    LOW_STOCK_MAX,
    notify_variant_low_stock,
    notify_variant_out_of_stock,
)
# No necesitamos importar el schema Product aquí si solo devolvemos mappings
# y el router se encarga de la validación con el response_model.

MAX_IMAGES_PER_VARIANT = 10

# Portada en listados / PDP resumido: galería "Sin color" (panel admin), no la primera variante por id de grupo
SQL_IMG_PRINCIPAL_COALESCE_P = """COALESCE(
  (SELECT pvi.image_url FROM tab_product_variant_images pvi
   INNER JOIN tab_product_variant_groups g ON g.id = pvi.variant_group_id
   WHERE g.product_id = p.id
     AND LOWER(TRIM(COALESCE(g.dominant_value, ''))) = 'sin color'
   ORDER BY pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
   LIMIT 1),
  (SELECT pvi.image_url FROM tab_product_variant_images pvi
   INNER JOIN tab_product_variant_groups g ON g.id = pvi.variant_group_id
   WHERE g.product_id = p.id
   ORDER BY g.id, pvi.sort_order, pvi.id
   LIMIT 1)
)"""


def _normalize_for_search(text: Optional[str]) -> str:
    """Normaliza texto para búsqueda: minúsculas y sin tildes (ej. 'José' -> 'jose')."""
    if not text:
        return ""
    s = text.strip().lower()
    nfd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn")


def _resolve_attribute_value_id(db: Session, attr_id: int, val) -> tuple:
    """
    Si `val` es ID válido en `tab_attribute_values` para `attr_id`,
    devuelve `(value_id, value_text)`, de lo contrario `(None, None)`.
    """
    try:
        vint = int(val)
    except (TypeError, ValueError):
        return (None, None)
    r = db.execute(
        text("SELECT id, value FROM tab_attribute_values WHERE id = :vid AND attribute_id = :aid"),
        {"vid": vint, "aid": attr_id}
    ).first()
    if r:
        return (vint, r[1])
    return (None, None)


def _resolve_filter_value_display(db: Session, attribute_id: int, raw_value: str) -> str:
    """
    Si raw_value es un ID de tab_attribute_values para este atributo, devuelve el texto (value);
    si no, devuelve raw_value. Evita mostrar "5", "6", "8" en filtros cuando en JSONB se guardó el value_id.
    """
    if not raw_value or not str(raw_value).strip():
        return str(raw_value)
    s = str(raw_value).strip()
    try:
        vint = int(s)
    except (TypeError, ValueError):
        return s
    r = db.execute(
        text("SELECT value FROM tab_attribute_values WHERE attribute_id = :aid AND id = :vid AND is_active = TRUE"),
        {"aid": attribute_id, "vid": vint},
    ).first()
    return r[0] if r else s


def _filter_values_for_attribute(db: Session, attribute_id: int, display_values: List[str]) -> List[str]:
    """
    Para filtrar combinaciones por atributo: devuelve display_values más los value_id (como string)
    que corresponden a esos textos en tab_attribute_values, para que coincidan tanto
    combinaciones que guardaron "128GB" como las que guardaron "5".
    """
    out = list(display_values)
    if not display_values:
        return out
    r = db.execute(
        text("""
            SELECT id, value FROM tab_attribute_values
            WHERE attribute_id = :aid AND is_active = TRUE AND value = ANY(:vals)
        """),
        {"aid": attribute_id, "vals": display_values},
    ).mappings().all()
    for row in r:
        out.append(str(row["id"]))
    return list(dict.fromkeys(out))  # dedupe preserving order


def _get_images_for_product_or_variant(
    db: Session, product_id: Decimal, variant_id: Optional[Decimal] = None
) -> List[dict]:
    """
    Obtiene imágenes del modelo variant_groups: si variant_id (combination id) está definido,
    imágenes del grupo de esa combinación; si no, primera imagen de cualquier grupo del producto.
    Devuelve lista con { image_url, is_main, sort_order } (is_primary -> is_main).

    Uso:
    - normalizar payload de imágenes para endpoints de detalle/admin.
    """
    if variant_id is not None:
        rows = db.execute(
            text("""
                SELECT pvi.image_url, pvi.is_primary AS is_main, pvi.sort_order
                FROM tab_product_variant_images pvi
                JOIN tab_product_variant_combinations c ON c.group_id = pvi.variant_group_id
                WHERE c.id = :vid
                ORDER BY pvi.sort_order, pvi.id
            """),
            {"vid": variant_id},
        ).mappings().all()
        if rows:
            return [{"image_url": r["image_url"], "is_main": bool(r.get("is_main")), "sort_order": int(r.get("sort_order") or 0)} for r in rows]
    rows = db.execute(
        text("""
            SELECT pvi.image_url, pvi.is_primary AS is_main, pvi.sort_order
            FROM tab_product_variant_images pvi
            JOIN tab_product_variant_groups g ON g.id = pvi.variant_group_id
            WHERE g.product_id = :pid
            ORDER BY CASE WHEN LOWER(TRIM(COALESCE(g.dominant_value, ''))) = 'sin color' THEN 0 ELSE 1 END,
                     g.id, pvi.sort_order, pvi.id
        """),
        {"pid": product_id},
    ).mappings().all()
    return [{"image_url": r["image_url"], "is_main": bool(r.get("is_main")), "sort_order": int(r.get("sort_order") or 0)} for r in rows]


# Productos para admin (tab_products + variant_combinations/groups; usa fun_get_all_products_admin)
def get_products_admin(db: Session, params: dict):
    """
    Obtiene todos los productos para el panel de administración usando
    fun_get_all_products_admin (tab_products, variant_combinations/groups, tab_categories, tab_marcas).
    Filtros por search, category_id, id_marca se aplican en Python (la función DB no los tiene).

    Salida:
    - lista lista para panel admin con datos agregados y métricas de stock.
    """
    try:
        params = params or {}
        ordenar_por = params.get('ordenar_por', 'nombre')
        orden = params.get('orden', 'ASC')
        limit = params.get('limit', 50)
        offset = params.get('offset', 0)
        search = params.get('search')
        category_id_param = params.get('category_id') or params.get('id_categoria')
        if category_id_param is not None and (category_id_param == "" or int(category_id_param) == 0):
            category_id_param = None
        line_id_param = params.get('line_id')
        if line_id_param is not None and (line_id_param == "" or int(line_id_param) == 0):
            line_id_param = None
        subline_id_param = params.get('subline_id')
        if subline_id_param is not None and (subline_id_param == "" or int(subline_id_param) == 0):
            subline_id_param = None
        id_marca = params.get('id_marca')
        if id_marca is not None and (id_marca == "" or int(id_marca) == 0):
            id_marca = None
        id_proveedor = params.get('id_proveedor')
        if id_proveedor is not None and (id_proveedor == "" or int(id_proveedor) == 0):
            id_proveedor = None

        limit_val = min(int(limit), 1000)
        offset_val = max(0, int(offset))
        has_filters = (
            (search and search.strip())
            or (category_id_param is not None)
            or (line_id_param is not None)
            or (subline_id_param is not None)
            or (id_marca is not None)
            or (id_proveedor is not None)
        )
        if has_filters:
            # Con filtros: traer hasta 1000, filtrar en app y paginar
            fetch_limit, fetch_offset = 1000, 0
        else:
            fetch_limit, fetch_offset = limit_val, offset_val

        # Estadísticas globales de stock: solo productos activos (los deshabilitados no cuentan como "sin stock")
        global_stock_q = text("""
            WITH product_stock AS (
                SELECT p.id,
                    COALESCE(SUM(c.stock), 0)::BIGINT AS stock_total
                FROM tab_products p
                LEFT JOIN tab_product_variant_groups g ON g.product_id = p.id
                LEFT JOIN tab_product_variant_combinations c ON c.group_id = g.id AND c.is_active = TRUE
                WHERE p.is_active = TRUE
                GROUP BY p.id
            )
            SELECT
                COUNT(*) FILTER (WHERE stock_total > 10) AS en_stock,
                COUNT(*) FILTER (WHERE stock_total > 0 AND stock_total <= 10) AS stock_bajo,
                COUNT(*) FILTER (WHERE stock_total = 0) AS sin_stock
            FROM product_stock
        """)
        global_stock_row = db.execute(global_stock_q).mappings().first()
        stock_en_global = int(global_stock_row["en_stock"] or 0) if global_stock_row else 0
        stock_bajo_global = int(global_stock_row["stock_bajo"] or 0) if global_stock_row else 0
        stock_sin_global = int(global_stock_row["sin_stock"] or 0) if global_stock_row else 0

        query = text("""
            SELECT
                product_id,
                category_id,
                nom_categoria,
                nom_producto,
                slug_producto,
                description,
                img_principal,
                precio_min,
                precio_max,
                stock_total,
                nom_marca,
                id_proveedor,
                nom_proveedor,
                fec_insert,
                ind_activo_producto,
                ind_activo_categoria,
                ind_activo_marca,
                total_registros
            FROM fun_get_all_products_admin(
                :p_ordenar_por, :p_orden, :p_limit, :p_offset
            )
        """)
        result = db.execute(query, {
            "p_ordenar_por": ordenar_por,
            "p_orden": orden,
            "p_limit": fetch_limit,
            "p_offset": fetch_offset,
        })
        rows = result.mappings().all()

        # Total: desde la función de BD. Sin filtros, usar además COUNT(*) para asegurar total correcto de paginación
        total_original = int(rows[0].get("total_registros") or 0) if rows else 0
        if not has_filters:
            cnt = db.execute(text("SELECT COUNT(*) AS n FROM tab_products")).scalar()
            total_from_count = int(cnt) if cnt is not None else 0
            if total_from_count > 0:
                total_original = total_from_count
        elif total_original == 0 and rows:
            cnt = db.execute(text("SELECT COUNT(*) AS n FROM tab_products")).scalar()
            total_original = int(cnt) if cnt is not None else total_original

        # Filtros adicionales en aplicación (search, category_id, line_id, subline_id)
        # Búsqueda normalizada: sin importar tildes (ej. "jose" encuentra "José")
        if search and search.strip():
            norm_query = _normalize_for_search(search)
            rows = [
                r
                for r in rows
                if norm_query in _normalize_for_search(r.get("nom_producto") or "")
            ]
        if subline_id_param is not None:
            sid = int(subline_id_param)
            rows = [r for r in rows if r.get("category_id") is not None and int(r.get("category_id")) == sid]
        elif line_id_param is not None:
            lid = int(line_id_param)
            children_q = text("SELECT id FROM tab_categories WHERE parent_id = :pid")
            children_ids = [row["id"] for row in db.execute(children_q, {"pid": lid}).mappings().all()]
            allowed_ids = [lid] + children_ids
            rows = [
                r
                for r in rows
                if r.get("category_id") is not None and int(r.get("category_id")) in allowed_ids
            ]
        elif category_id_param is not None:
            rows = [
                r
                for r in rows
                if r.get("category_id") is not None and int(r.get("category_id")) == int(category_id_param)
            ]
        if id_marca is not None:
            mid = int(id_marca)
            if rows and "id_marca" in rows[0]:
                rows = [
                    r for r in rows
                    if r.get("id_marca") is not None and int(r.get("id_marca")) == mid
                ]
            else:
                q_marca = text("SELECT id FROM tab_products WHERE id_marca = :mid")
                allowed_ids = {
                    int(row["id"]) for row in db.execute(q_marca, {"mid": mid}).mappings().all()
                }
                rows = [
                    r for r in rows
                    if r.get("product_id") is not None and int(r.get("product_id")) in allowed_ids
                ]
        if id_proveedor is not None:
            pid = int(id_proveedor)
            if rows and "id_proveedor" in rows[0]:
                rows = [
                    r for r in rows
                    if r.get("id_proveedor") is not None and int(r.get("id_proveedor")) == pid
                ]
            else:
                q_prov = text("SELECT id FROM tab_products WHERE id_proveedor = :pid")
                allowed_ids = {
                    int(row["id"]) for row in db.execute(q_prov, {"pid": pid}).mappings().all()
                }
                rows = [
                    r for r in rows
                    if r.get("product_id") is not None and int(r.get("product_id")) in allowed_ids
                ]

        total_filtered = len(rows) if has_filters else total_original

        if has_filters:
            rows = rows[offset_val : offset_val + limit_val]

        out = []
        for i, r in enumerate(rows):
            item = {
                "category_id": str(r.get("category_id") or ""),
                "id": str(r.get("product_id") or ""),
                "category_name": (r.get("nom_categoria") or "") or "",
                "name": (r.get("nom_producto") or "") or "",
                "description": r.get("description"),
                "slug_producto": r.get("slug_producto"),
                "image_url": r.get("img_principal"),
                # Asegurar que precio_min y precio_max siempre sean strings válidos, incluso si son NULL
                "price_min": str(r.get("precio_min") or 0) if r.get("precio_min") is not None else "0",
                "price_max": str(r.get("precio_max") or r.get("precio_min") or 0) if (r.get("precio_max") is not None or r.get("precio_min") is not None) else "0",
                # Asegurar que stock_total siempre sea un número válido
                "stock_total": int(r.get("stock_total") or 0) if r.get("stock_total") is not None else 0,
                "id_marca": str(r.get("id_marca") or "") if r.get("id_marca") is not None else "",
                "nom_marca": (r.get("nom_marca") or "") or "",
                "id_proveedor": str(r.get("id_proveedor") or "") if r.get("id_proveedor") is not None else "",
                "nom_proveedor": (r.get("nom_proveedor") or "") or "",
                "fec_insert": str(r.get("fec_insert") or ""),
                "is_active": bool(r.get("ind_activo_producto", True)),
                "ind_activo_categoria": bool(r.get("ind_activo_categoria", True)),
                "ind_activo_marca": bool(r.get("ind_activo_marca", True)),
                "total_registros": total_filtered,
            }
            if i == 0:
                item["stock_stats_en_stock"] = stock_en_global
                item["stock_stats_bajo"] = stock_bajo_global
                item["stock_stats_sin_stock"] = stock_sin_global
            out.append(item)
        return out
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos para admin: {str(e)}")

def get_products(db: Session):
    """
    Obtiene todos los productos activos (tab_products + variant_combinations).
    Usa fun_get_productos_activos y ratings desde tab_comentarios por product_id.
    """
    try:
        products_query = text("""
            SELECT
                product_id,
                category_id,
                nom_categoria,
                nom_producto,
                slug_producto,
                description,
                id_marca,
                precio_min,
                stock_total,
                img_principal
            FROM fun_get_productos_activos()
        """)
        products_result = db.execute(products_query)
        products_data = list(products_result.mappings().all())
        if not products_data:
            return []

        product_ids = list({r["product_id"] for r in products_data})
        if not product_ids:
            return []
        # Parámetros nombrados para IN (PostgreSQL): ANY(:ids::decimal[])
        ratings_query = text("""
            SELECT product_id,
                   ROUND(AVG(calificacion)::numeric, 1)::float AS rating,
                   COUNT(*)::int AS review_count
            FROM tab_comentarios
            WHERE ind_activo = TRUE AND calificacion IS NOT NULL AND product_id = ANY(:ids)
            GROUP BY product_id
        """)
        ratings_result = db.execute(ratings_query, {"ids": product_ids})
        ratings_by_id = {r["product_id"]: {"rating": float(r["rating"]) if r["rating"] is not None else None, "review_count": r["review_count"]} for r in ratings_result.mappings().all()}

        out = []
        for r in products_data:
            pid = r.get("product_id")
            rating_info = ratings_by_id.get(pid) or {}
            out.append({
                "id": pid,
                "category_id": r.get("category_id"),
                "name": r.get("nom_producto") or "",
                "slug": r.get("slug_producto"),
                "description": r.get("description"),
                "image_url": r.get("img_principal"),
                "price_min": r.get("precio_min"),
                "stock_total": int(r.get("stock_total") or 0),
                "id_marca": r.get("id_marca"),
                "is_active": True,
                "usr_insert": None,
                "fec_insert": None,
                "usr_update": None,
                "fec_update": None,
                "category_name": r.get("nom_categoria"),
                "rating": rating_info.get("rating"),
                "review_count": rating_info.get("review_count", 0),
            })
        return out
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos: {str(e)}")

# Un producto por slug o id (tab_products; sin línea/sublínea)
def get_product_by_slug_or_id(db: Session, slug_or_id: str):
    """
    Obtiene un producto por slug (tab_products.slug) o por id.
    Acepta: slug (ej. "laptop-gamer"), id numérico ("5"), o formato legacy "5-null-null-5" (usa último número como id).
    """
    if not slug_or_id or not str(slug_or_id).strip():
        return None
    s = str(slug_or_id).strip()
    # Solo dígitos -> id
    if s.isdigit():
        return get_product_by_id(db, Decimal(s))
    # Legacy "num-null-null-num" -> usar último número como product_id
    legacy = re.match(r"^(\d+)-null-null-(\d+)$", s, re.IGNORECASE)
    if legacy:
        return get_product_by_id(db, Decimal(legacy.group(2)))
    # Por slug
    return get_product_by_slug(db, s)


def get_product(id_categoria: Decimal, id_linea: Decimal, id_sublinea: Decimal, id_producto: Decimal, db: Session):
    """Compatibilidad: solo usa id_producto."""
    return get_product_by_id(db, id_producto)


def get_product_by_slug(db: Session, slug: str):
    """
    Obtiene un producto por tab_products.slug (misma forma que get_product_by_id).
    """
    if not slug or not slug.strip():
        return None
    try:
        query = text("""
            SELECT
                p.id AS id_producto,
                p.category_id AS id_categoria,
                p.name AS nom_producto,
                p.slug,
                p.description,
                p.id_marca,
                p.id_proveedor,
                p.is_active AS ind_activo,
                p.usr_insert,
                p.fec_insert,
                p.usr_update,
                p.fec_update,
                c.name AS nom_categoria,
                (SELECT MIN(cmb.price) FROM tab_product_variant_combinations cmb
                 JOIN tab_product_variant_groups gr ON gr.id = cmb.group_id
                 WHERE gr.product_id = p.id AND cmb.is_active = TRUE) AS val_precio,
                (SELECT COALESCE(SUM(cmb.stock), 0) FROM tab_product_variant_combinations cmb
                 JOIN tab_product_variant_groups gr ON gr.id = cmb.group_id
                 WHERE gr.product_id = p.id AND cmb.is_active = TRUE) AS num_stock,
                """ + SQL_IMG_PRINCIPAL_COALESCE_P + """ AS img_principal,
                m.nom_marca,
                pr.nom_proveedor
            FROM tab_products p
            JOIN tab_categories c ON c.id = p.category_id
            LEFT JOIN tab_marcas m ON m.id_marca = p.id_marca
            LEFT JOIN tab_proveedores pr ON pr.id_proveedor = p.id_proveedor
            WHERE p.slug = :slug AND p.is_active = TRUE
        """)
        row = db.execute(query, {"slug": slug.strip()}).mappings().first()
        if row is None:
            return None
        product_id = row.get("id_producto")
        if product_id is not None:
            return get_product_by_id(db, Decimal(product_id))
        return _row_to_product_dict(db, row)
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el producto por slug: {str(e)}")


def _row_to_product_dict(db: Session, row) -> dict:
    """Convierte una fila a dict API: tab_products + price_min, stock_total, image_url (calculados)."""
    product_dict = dict(row)
    product_id = product_dict.get("id_producto") or product_dict.get("id")
    product_dict["id"] = product_id
    product_dict["name"] = product_dict.get("nom_producto") or product_dict.get("name") or ""
    product_dict["category_name"] = product_dict.get("nom_categoria") or product_dict.get("category_name") or ""
    if product_dict.get("category_id") is None and product_dict.get("id_categoria") is not None:
        product_dict["category_id"] = product_dict["id_categoria"]
    product_dict.setdefault("slug", product_dict.get("slug"))
    product_dict["price_min"] = product_dict.get("val_precio")
    product_dict["stock_total"] = int(product_dict.get("num_stock") or 0) if product_dict.get("num_stock") is not None else 0
    img_main = product_dict.pop("img_principal", None)
    product_dict["image_url"] = img_main
    rating_row = db.execute(
        text("""
            SELECT ROUND(AVG(calificacion)::numeric, 1)::float AS rating, COUNT(*)::int AS review_count
            FROM tab_comentarios
            WHERE product_id = :product_id AND ind_activo = TRUE AND calificacion IS NOT NULL
        """),
        {"product_id": product_id},
    ).mappings().first()
    if rating_row and (rating_row.get("review_count") or 0) > 0:
        product_dict["rating"] = float(rating_row["rating"]) if rating_row.get("rating") is not None else None
        product_dict["review_count"] = int(rating_row["review_count"])
    else:
        product_dict["rating"] = None
        product_dict["review_count"] = 0
    return product_dict


def _build_product_images_dict(rows: List[dict]) -> Optional[dict]:
    """Convierte filas (image_url, is_main, sort_order) en { main, gallery, thumbnails }."""
    if not rows:
        return None
    sorted_rows = sorted(rows, key=lambda r: (int(r.get("sort_order") or 0), r.get("image_url") or ""))
    urls = [r["image_url"] for r in sorted_rows if r.get("image_url")]
    if not urls:
        return None
    main_url = None
    for r in sorted_rows:
        if r.get("is_main") and r.get("image_url"):
            main_url = r["image_url"]
            break
    if not main_url:
        main_url = urls[0]
    gallery = [u for u in urls if u != main_url]
    return {"main": main_url, "gallery": gallery, "thumbnails": urls}


def get_product_by_id(db: Session, product_id: Decimal):
    """
    Obtiene un producto por tab_products.id usando el modelo variant_groups:
    grupos dominantes (ej. Color), combinaciones (stock/SKU/attributes JSONB), imágenes por grupo.
    Respuesta compatible con PDP: variant_groups, variants (combinations), images_by_variant (por grupo), variant_options.
    """
    try:
        query = text("""
            SELECT
                p.id AS id_producto,
                p.category_id AS id_categoria,
                p.name AS nom_producto,
                p.slug,
                p.description,
                p.id_marca,
                p.id_proveedor,
                p.is_active AS ind_activo,
                p.usr_insert,
                p.fec_insert,
                p.usr_update,
                p.fec_update,
                c.name AS nom_categoria,
                (SELECT MIN(cmb.price) FROM tab_product_variant_combinations cmb
                 JOIN tab_product_variant_groups gr ON gr.id = cmb.group_id
                 WHERE gr.product_id = p.id AND cmb.is_active = TRUE) AS val_precio,
                (SELECT COALESCE(SUM(cmb.stock), 0) FROM tab_product_variant_combinations cmb
                 JOIN tab_product_variant_groups gr ON gr.id = cmb.group_id
                 WHERE gr.product_id = p.id AND cmb.is_active = TRUE) AS num_stock,
                """ + SQL_IMG_PRINCIPAL_COALESCE_P + """ AS img_principal,
                m.nom_marca,
                pr.nom_proveedor
            FROM tab_products p
            JOIN tab_categories c ON c.id = p.category_id
            LEFT JOIN tab_marcas m ON m.id_marca = p.id_marca
            LEFT JOIN tab_proveedores pr ON pr.id_proveedor = p.id_proveedor
            WHERE p.id = :product_id
        """)
        row = db.execute(query, {"product_id": product_id}).mappings().first()
        if row is None:
            return None
        result = _row_to_product_dict(db, row)
        result["num_stock"] = result.get("stock_total", 0)
        # Para descuentos en PDP: el esquema Product usa category_id; la query devuelve id_categoria
        if result.get("id_categoria") is not None and result.get("category_id") is None:
            result["category_id"] = result["id_categoria"]

        # Grupos dominantes (ej. Color) con imágenes
        group_rows = db.execute(
            text("""
                SELECT id, dominant_attribute, dominant_value, is_active
                FROM tab_product_variant_groups
                WHERE product_id = :pid AND is_active = TRUE
                ORDER BY id
            """),
            {"pid": product_id},
        ).mappings().all()
        group_ids = [int(r["id"]) for r in group_rows]
        result["variant_groups"] = []
        result["product_images"] = []  # Imágenes del producto (no asociadas a variante); van primero en la galería
        images_by_group = {}
        if group_ids:
            img_rows = db.execute(
                text("""
                    SELECT variant_group_id, image_url, is_primary, sort_order
                    FROM tab_product_variant_images
                    WHERE variant_group_id = ANY(:gids)
                    ORDER BY variant_group_id, sort_order, id
                """),
                {"gids": group_ids},
            ).mappings().all()
            for r in img_rows:
                gid = str(int(r["variant_group_id"]))
                url = (r.get("image_url") or "").strip()
                if not url:
                    continue
                if gid not in images_by_group:
                    images_by_group[gid] = []
                seen = {x["image_url"] for x in images_by_group[gid]}
                if url in seen:
                    continue
                images_by_group[gid].append({
                    "image_url": url,
                    "is_main": bool(r.get("is_primary")),
                    "sort_order": int(r.get("sort_order") or 0),
                })
            # Imágenes de producto: grupo "Sin color" (van primero en la galería PDP)
            sin_color = next((g for g in group_rows if (g.get("dominant_value") or "").strip().lower() == "sin color"), None)
            if sin_color:
                sin_imgs = images_by_group.get(str(int(sin_color["id"])), [])
                result["product_images"] = sorted(sin_imgs, key=lambda x: (x.get("sort_order") or 0))

            # variant_groups: solo grupos de color (excluir "Sin color" para el selector)
            for g in group_rows:
                dv = (g.get("dominant_value") or "").strip().lower()
                if dv == "sin color":
                    continue
                gid = int(g["id"])
                imgs = images_by_group.get(str(gid), [])
                result["variant_groups"].append({
                    "id": gid,
                    "dominant_attribute": g.get("dominant_attribute") or "color",
                    "dominant_value": g.get("dominant_value") or "",
                    "images": sorted(imgs, key=lambda x: (x.get("sort_order") or 0)),
                })

        # Combinaciones (variantes vendibles) con group_id, attributes JSONB y tipo_clasificacion
        combo_rows = db.execute(
            text("""
                SELECT c.id, c.group_id, c.sku, c.price, c.stock, c.attributes, c.is_active, c.tipo_clasificacion
                FROM tab_product_variant_combinations c
                JOIN tab_product_variant_groups g ON g.id = c.group_id
                WHERE g.product_id = :pid AND c.is_active = TRUE
                ORDER BY c.group_id, c.id
            """),
            {"pid": product_id},
        ).mappings().all()
        result["variants"] = []
        for c in combo_rows:
            attrs = c.get("attributes")
            if attrs is None:
                attrs = {}
            elif isinstance(attrs, str):
                try:
                    attrs = json.loads(attrs) if attrs else {}
                except Exception:
                    attrs = {}
            else:
                attrs = dict(attrs)
            tipo_clasif = (c.get("tipo_clasificacion") or "").strip() or None
            if tipo_clasif:
                attrs["Tipo/Clasificación"] = tipo_clasif
            result["variants"].append({
                "id": int(c["id"]),
                "group_id": int(c["group_id"]),
                "sku": c.get("sku"),
                "price": float(c["price"]) if c.get("price") is not None else 0,
                "stock": int(c.get("stock") or 0),
                "is_active": bool(c.get("is_active", True)),
                "attributes": attrs,
                "tipo_clasificacion": tipo_clasif,
            })
        # images_by_variant: por cada combination id, las imágenes de su grupo (PDP usa galería por grupo)
        images_by_variant = {}
        for v in result["variants"]:
            gid = str(v["group_id"])
            images_by_variant[str(v["id"])] = images_by_group.get(gid, [])
        result["images_by_variant"] = images_by_variant

        # Resolver attribute_id y value_id a nombres legibles (tab_attributes, tab_attribute_values)
        attr_ids = set()
        val_ids = set()
        for v in result["variants"]:
            for aid, vid in (v.get("attributes") or {}).items():
                if aid and vid is not None:
                    try:
                        attr_ids.add(int(aid))
                        val_ids.add(int(vid))
                    except (TypeError, ValueError):
                        pass
        for g in result["variant_groups"]:
            dv = g.get("dominant_value")
            if dv is not None and str(dv).strip():
                try:
                    val_ids.add(int(dv))
                except (TypeError, ValueError):
                    pass
        attr_id_to_name = {}
        val_id_to_display = {}  # value_id -> {"value": str, "hex_color": str|None}
        if attr_ids or val_ids:
            if attr_ids:
                attr_rows = db.execute(
                    text("SELECT id, name FROM tab_attributes WHERE id = ANY(:ids)"),
                    {"ids": list(attr_ids)},
                ).mappings().all()
                for r in attr_rows:
                    attr_id_to_name[int(r["id"])] = (r.get("name") or "").strip() or f"Atributo {r['id']}"
            if val_ids:
                val_rows = db.execute(
                    text("SELECT id, value, hex_color FROM tab_attribute_values WHERE id = ANY(:ids)"),
                    {"ids": list(val_ids)},
                ).mappings().all()
                for r in val_rows:
                    val_id_to_display[int(r["id"])] = {
                        "value": (r.get("value") or "").strip() or str(r["id"]),
                        "hex_color": r.get("hex_color"),
                    }

        value_to_hex = {}
        display_vals = set()
        for g in result["variant_groups"]:
            raw = g.get("dominant_value") or ""
            if raw and str(raw).strip():
                try:
                    int(raw)
                except (TypeError, ValueError):
                    display_vals.add(str(raw).strip().lower())
        for v in result["variants"]:
            for _aid, val in (v.get("attributes") or {}).items():
                if val is not None and str(val).strip():
                    try:
                        int(val)
                    except (TypeError, ValueError):
                        display_vals.add(str(val).strip().lower())
        if display_vals:
            hex_rows = db.execute(
                text("SELECT LOWER(TRIM(value)) AS k, hex_color FROM tab_attribute_values WHERE LOWER(TRIM(value)) = ANY(:vals) AND hex_color IS NOT NULL AND hex_color != ''"),
                {"vals": list(display_vals)},
            ).mappings().all()
            for r in hex_rows:
                if r.get("k") and r.get("hex_color"):
                    value_to_hex[r["k"]] = (r.get("hex_color") or "").strip()

        # variant_options: atributo dominante primero, luego atributos internos con nombres legibles
        def _resolve_dominant_display(raw_val):
            if raw_val is None or str(raw_val).strip() == "":
                return None, None
            try:
                vid = int(raw_val)
                d = val_id_to_display.get(vid)
                if d:
                    return d["value"], d.get("hex_color")
            except (TypeError, ValueError):
                pass
            s = str(raw_val).strip()
            hex_c = value_to_hex.get(s.lower()) if s else None
            return s if s else None, hex_c

        colors_seen = {}  # display_value -> {name, value, hex_color}
        internal_attr_values = {}  # attr_id -> { value_display -> [variant_ids] }
        dominant_raw_to_display = {}  # raw (value_id o string) -> display_value
        for g in result["variant_groups"]:
            raw = g.get("dominant_value") or ""
            if not raw:
                continue
            display_val, hex_c = _resolve_dominant_display(raw)
            if display_val is None:
                display_val = str(raw).strip()
                hex_c = value_to_hex.get(display_val.lower()) if display_val else None
            dominant_raw_to_display[str(raw)] = display_val
            if display_val not in colors_seen:
                colors_seen[display_val] = {"name": display_val, "value": display_val, "hex_color": hex_c}
        # Fallback: si en BD quedaron "Variante 1", "Variante 2"... usar tipo_clasificacion de cada grupo
        _variante_pattern = re.compile(r"^Variante\s*\d+$", re.IGNORECASE)
        if colors_seen and all(_variante_pattern.match(str(k).strip()) for k in colors_seen):
            group_id_to_tipo = {}
            for v in result["variants"]:
                gid = v.get("group_id")
                tc = v.get("tipo_clasificacion") or (v.get("attributes") or {}).get("Tipo/Clasificación")
                if gid is not None and tc and str(tc).strip():
                    group_id_to_tipo[gid] = str(tc).strip()
            if group_id_to_tipo:
                colors_seen = {}
                dominant_value_to_variant_ids = {}
                for g in result["variant_groups"]:
                    gid = g["id"]
                    vids = [v["id"] for v in result["variants"] if v["group_id"] == gid]
                    raw = g.get("dominant_value") or ""
                    display = group_id_to_tipo.get(gid) or dominant_raw_to_display.get(str(raw), str(raw).strip() or "Sin nombre")
                    dominant_raw_to_display[str(raw)] = display
                    if display not in colors_seen:
                        colors_seen[display] = {"name": display, "value": display, "hex_color": None}
                    dominant_value_to_variant_ids[display] = vids
                for g in result["variant_groups"]:
                    raw = g.get("dominant_value") or ""
                    if raw and str(raw) in dominant_raw_to_display:
                        g["dominant_value"] = dominant_raw_to_display[str(raw)]
            else:
                dominant_value_to_variant_ids = {}
                for g in result["variant_groups"]:
                    gid = g["id"]
                    vids = [v["id"] for v in result["variants"] if v["group_id"] == gid]
                    raw = g.get("dominant_value") or ""
                    display = dominant_raw_to_display.get(str(raw), raw) if raw else ""
                    dominant_value_to_variant_ids[display] = vids
        else:
            # Actualizar variant_groups con dominant_value legible para que el frontend pueda emparejar
            for g in result["variant_groups"]:
                raw = g.get("dominant_value") or ""
                if raw and str(raw) in dominant_raw_to_display:
                    g["dominant_value"] = dominant_raw_to_display[str(raw)]
            dominant_value_to_variant_ids = {}
            for g in result["variant_groups"]:
                gid = g["id"]
                vids = [v["id"] for v in result["variants"] if v["group_id"] == gid]
                raw = g.get("dominant_value") or ""
                display = dominant_raw_to_display.get(str(raw), raw) if raw else ""
                dominant_value_to_variant_ids[display] = vids
        attributes_list = []
        dominant_attr_name = (result["variant_groups"][0].get("dominant_attribute") or "color") if result["variant_groups"] else "color"
        # Heuristic only (no DB): if all dominant values look like sizes (S,M,L,XL...), label as Talla so PDP is not wrong
        _size_codes = {"s", "m", "l", "xl", "xxl", "xs"}
        if colors_seen and all(
            (str(v).strip().lower() in _size_codes for v in colors_seen)
        ):
            dominant_attr_name = "talla"
        # Si las opciones dominantes coinciden con tipo_clasificacion, titular "Tipo/Clasificación" en lugar de "Color"/"Opciones"
        _tipo_vals = set()
        for _v in result["variants"]:
            _tc = _v.get("tipo_clasificacion") or (_v.get("attributes") or {}).get("Tipo/Clasificación")
            if _tc and str(_tc).strip():
                _tipo_vals.add(str(_tc).strip())
        is_tipo_clasificacion_dominant = False
        if colors_seen and _tipo_vals and set(colors_seen.keys()) == _tipo_vals:
            dominant_attr_name = "Tipo/Clasificación"
            is_tipo_clasificacion_dominant = True
        # Fallback: if colors_seen is empty but we have groups, add at least one value from the first group so PDP shows color options
        if not colors_seen and result["variant_groups"]:
            first_g = result["variant_groups"][0]
            raw = first_g.get("dominant_value") or ""
            display = str(raw).strip() if raw else "Sin color"
            colors_seen[display] = {"name": display, "value": display, "hex_color": None}
            gid = first_g.get("id")
            vids = [v["id"] for v in result["variants"] if v.get("group_id") == gid]
            dominant_value_to_variant_ids[display] = vids
        attributes_list.append({
            "attribute_id": "dominant",
            "attribute_name": (dominant_attr_name or "color").capitalize(),
            "values": [
                {
                    "value": val,
                    "hex_color": colors_seen.get(val, {}).get("hex_color"),
                    "variant_ids": dominant_value_to_variant_ids.get(val, []),
                }
                for val in colors_seen
            ],
        })
        for v in result["variants"]:
            for attr_id_str, val_raw in (v.get("attributes") or {}).items():
                if attr_id_str is None or val_raw is None:
                    continue
                try:
                    aid = int(attr_id_str)
                except (TypeError, ValueError):
                    continue
                attr_name = attr_id_to_name.get(aid) or f"Atributo {aid}"
                try:
                    vid = int(val_raw)
                except (TypeError, ValueError):
                    vid = None
                if vid is not None and vid in val_id_to_display:
                    display = val_id_to_display[vid]["value"]
                    hex_c = val_id_to_display[vid].get("hex_color")
                else:
                    display = str(val_raw).strip() or str(val_raw)
                    hex_c = value_to_hex.get(display.lower()) if display else None
                if aid not in internal_attr_values:
                    internal_attr_values[aid] = {"_name": attr_name, "_vals": {}}
                vals = internal_attr_values[aid]["_vals"]
                if display not in vals:
                    vals[display] = {"ids": [], "hex_color": hex_c}
                vals[display]["ids"].append(v["id"])
        for aid, data in internal_attr_values.items():
            attr_name = data.get("_name", f"Atributo {aid}")
            vals = data.get("_vals", {})
            attributes_list.append({
                "attribute_id": str(aid),
                "attribute_name": attr_name,
                "values": [
                    {"value": val, "hex_color": info.get("hex_color"), "variant_ids": info["ids"]}
                    for val, info in vals.items()
                ],
            })
        sizes_flat = []
        for aid, data in internal_attr_values.items():
            if (data.get("_name") or "").lower() == "talla":
                vals = list((data.get("_vals") or {}).keys())
                sizes_flat = [{"name": s, "available": True} for s in sorted(vals)]
                break
        # Atributo sintético Tipo/Clasificación solo cuando aporta opciones distintas al dominante
        # (evita duplicar OPCIONES y TIPO/CLASIFICACIÓN con los mismos valores, ej. Estándar/Reforzada/Pro)
        tipo_clasif_to_ids = {}
        for v in result["variants"]:
            tc = v.get("tipo_clasificacion") or (v.get("attributes") or {}).get("Tipo/Clasificación")
            if tc and str(tc).strip():
                val = str(tc).strip()
                if val not in tipo_clasif_to_ids:
                    tipo_clasif_to_ids[val] = []
                tipo_clasif_to_ids[val].append(v["id"])
        dominant_vals_set = set(colors_seen.keys())
        tipo_vals_set = set(tipo_clasif_to_ids.keys())
        if tipo_clasif_to_ids and tipo_vals_set != dominant_vals_set:
            attributes_list.append({
                "attribute_id": "tipo_clasificacion",
                "attribute_name": "Tipo/Clasificación",
                "values": [
                    {"value": val, "hex_color": None, "variant_ids": ids}
                    for val, ids in sorted(tipo_clasif_to_ids.items())
                ],
            })
        result["variant_options"] = {
            "colors": list(colors_seen.values()),
            "sizes": sizes_flat,
            "attributes": attributes_list,
        }
        for v in result["variants"]:
            g = next((x for x in result["variant_groups"] if x["id"] == v["group_id"]), None)
            raw = (g.get("dominant_value") or "") if g else ""
            v["color"] = dominant_raw_to_display.get(str(raw), raw) if raw else ""
            v["size"] = (v.get("attributes") or {}).get("talla") or (v.get("attributes") or {}).get("Talla") or ""
            attrs = dict(v.get("attributes") or {})
            attrs["dominant"] = v["color"]
            # Si el atributo dominante es "Tipo/Clasificación", eliminar la clave duplicada "Tipo/Clasificación"
            # porque el valor ya está en "dominant" y se mapeará al mismo nombre en el frontend
            if is_tipo_clasificacion_dominant and "Tipo/Clasificación" in attrs:
                tipo_val = str(attrs.get("Tipo/Clasificación", "")).strip()
                dominant_val = str(v["color"]).strip()
                if tipo_val.lower() == dominant_val.lower():
                    del attrs["Tipo/Clasificación"]
            v["attributes"] = attrs
        # Imagen principal y galería: solo product_images (grupo Sin color en BD); sin mezclar imágenes de variantes de color
        all_imgs = list(result.get("product_images") or [])
        if all_imgs:
            main_url = next((i["image_url"] for i in all_imgs if i.get("is_main")), all_imgs[0]["image_url"])
            if main_url:
                result["image_url"] = result.get("image_url") or main_url
            result["images"] = [{"image_url": i["image_url"], "is_main": i.get("is_main", False), "sort_order": i.get("sort_order", 0)} for i in all_imgs]
        elif not result.get("images") and result.get("image_url"):
            result["images"] = [{"image_url": result["image_url"], "is_main": True, "sort_order": 0}]
        spcf = {}
        if result.get("description"):
            spcf["description"] = result["description"]
        if result.get("variant_options", {}).get("colors"):
            spcf["colores"] = ", ".join(c.get("value", c.get("name", "")) for c in result["variant_options"]["colors"])
        if result.get("variant_options", {}).get("sizes"):
            spcf["opciones"] = ", ".join(s.get("name", "") for s in result["variant_options"]["sizes"])
        if spcf:
            result["spcf_producto"] = spcf
        return result
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el producto: {str(e)}")

def get_product_admin_detail(
    db: Session,
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,
    id_producto: Decimal,
):
    """
    Obtiene un producto para edición en admin (tab_products). Se usa id_producto; el resto por compatibilidad de URL.
    """
    row = get_product_by_id(db, id_producto)
    if not row:
        return None
    return {
        "category_id": str(row.get("category_id") or row.get("id_categoria") or ""),
        "id": str(row.get("id_producto") or row.get("id") or ""),
        "category_name": row.get("nom_categoria") or row.get("category_name") or "",
        "name": row.get("nom_producto") or row.get("name") or "",
        "description": row.get("description"),
        "image_url": row.get("image_url") or (row.get("img_producto") or {}).get("main") if isinstance(row.get("img_producto"), dict) else None,
        "price_min": str(row.get("val_precio") or row.get("price_min") or "0"),
        "stock_total": int(row.get("num_stock") or row.get("stock_total") or 0),
        "id_proveedor": str(row.get("id_proveedor") or ""),
        "id_marca": str(row.get("id_marca") or ""),
        "nom_proveedor": row.get("nom_proveedor") or "",
        "nom_marca": row.get("nom_marca") or "",
        "usr_insert": str(row.get("usr_insert") or ""),
        "fec_insert": str(row.get("fec_insert") or ""),
        "usr_update": str(row.get("usr_update") or "") if row.get("usr_update") else "",
        "fec_update": str(row.get("fec_update") or "") if row.get("fec_update") else "",
        "ind_activo_producto": bool(row.get("ind_activo", True)),
        "ind_activo_categoria": True,
        "ind_activo_proveedor": True,
        "ind_activo_marca": True,
    }


def get_product_with_variants_for_admin(db: Session, product_id: Decimal):
    """
    Devuelve producto + variant_groups (con imágenes) + combinaciones por grupo para el formulario de edición.
    Modelo: tab_product_variant_groups, tab_product_variant_combinations, tab_product_variant_images.
    """
    prod_row = db.execute(text("""
        SELECT id, category_id, name, description, id_marca, id_proveedor, is_active
        FROM tab_products WHERE id = :pid
    """), {"pid": product_id}).mappings().first()
    if not prod_row:
        return None
    group_rows = db.execute(text("""
        SELECT id, dominant_attribute, dominant_value, is_active
        FROM tab_product_variant_groups WHERE product_id = :pid ORDER BY id
    """), {"pid": product_id}).mappings().all()
    def _int_or_none(v):
        if v is None: return None
        try: return int(v)
        except (TypeError, ValueError): return None
    if not group_rows:
        raw_cat = prod_row.get("category_id")
        cat_id = int(raw_cat) if raw_cat is not None else 0
        return {
            "product": {
                "name": prod_row["name"],
                "category_id": cat_id,
                "id_marca": _int_or_none(prod_row.get("id_marca")),
                "id_proveedor": _int_or_none(prod_row.get("id_proveedor")),
                "description": prod_row["description"],
                "is_active": bool(prod_row.get("is_active", True)),
            },
            "variants": [],
            "image_urls": [],
            "images_by_variant": {},
            "variant_groups": [],
        }
    group_ids = [int(r["id"]) for r in group_rows]
    img_rows = db.execute(text("""
        SELECT variant_group_id, image_url, is_primary, sort_order
        FROM tab_product_variant_images
        WHERE variant_group_id = ANY(:gids) ORDER BY variant_group_id, sort_order, id
    """), {"gids": group_ids}).mappings().all()
    images_by_group = {}
    for r in img_rows:
        gid = str(int(r["variant_group_id"]))
        url = (r.get("image_url") or "").strip()
        if not url:
            continue
        if gid not in images_by_group:
            images_by_group[gid] = []
        _norm = url.split("?")[0].split("#")[0].strip()
        seen_in_g = { (x.get("image_url") or "").strip().split("?")[0].split("#")[0].strip() for x in images_by_group[gid] }
        if _norm in seen_in_g:
            continue
        images_by_group[gid].append({
            "image_url": url,
            "is_main": bool(r.get("is_primary")),
            "sort_order": int(r.get("sort_order") or 0),
        })
    # Solo combinaciones activas: las dadas de baja en edición (is_active=FALSE) no deben reaparecer al reabrir el formulario
    combo_rows = db.execute(text("""
        SELECT id, group_id, sku, price, stock, attributes, is_active, tipo_clasificacion
        FROM tab_product_variant_combinations
        WHERE group_id = ANY(:gids) AND is_active = TRUE
        ORDER BY group_id, id
    """), {"gids": group_ids}).mappings().all()
    combinations_by_group = {}
    variants_flat = []
    for c in combo_rows:
        gid = int(c["group_id"])
        if gid not in combinations_by_group:
            combinations_by_group[gid] = []
        attrs = c.get("attributes") or {}
        if isinstance(attrs, str):
            try:
                attrs = json.loads(attrs) if attrs else {}
            except Exception:
                attrs = {}
        combinations_by_group[gid].append({
            "id": int(c["id"]),
            "sku": c.get("sku"),
            "price": float(c["price"]) if c.get("price") is not None else 0,
            "stock": int(c.get("stock") or 0),
            "is_active": bool(c.get("is_active", True)),
            "attributes": attrs,
            "tipo_clasificacion": c.get("tipo_clasificacion"),
        })
        variants_flat.append({
            "id": int(c["id"]),
            "group_id": gid,
            "sku": c.get("sku"),
            "price": float(c["price"]) if c.get("price") is not None else 0,
            "stock": int(c.get("stock") or 0),
            "is_active": bool(c.get("is_active", True)),
            "attributes": dict(attrs),
            "tipo_clasificacion": c.get("tipo_clasificacion"),
        })
    # Resolver nombre del atributo dominante -> attribute_id (frontend usa attribute_id como clave; "dominant" solo para color)
    # Usamos tab_attributes global para que funcione aunque el atributo no esté en tab_category_attributes
    attr_rows = db.execute(text("""
        SELECT id, LOWER(TRIM(name)) AS name FROM tab_attributes
    """)).mappings().all()
    name_to_attr_id = {(r.get("name") or "").strip(): int(r["id"]) for r in attr_rows if (r.get("name") or "").strip()}
    group_id_to_dominant_attr_name = {int(g["id"]): (g.get("dominant_attribute") or "").strip().lower() for g in group_rows}
    group_id_to_dominant_value = {int(g["id"]): (g.get("dominant_value") or "") for g in group_rows}
    for v in variants_flat:
        gid = int(v["group_id"])
        dom_val = group_id_to_dominant_value.get(gid)
        if dom_val is not None and str(dom_val).strip() and str(dom_val).strip().lower() != "sin color":
            v["attributes"] = dict(v.get("attributes") or {})
            v["attributes"]["dominant"] = dom_val
            # Clave por attribute_id para que el formulario muestre el valor en "Atributos de la categoría"
            dom_attr_name = group_id_to_dominant_attr_name.get(gid)
            dominant_attr_id = name_to_attr_id.get(dom_attr_name) if dom_attr_name else None
            if dominant_attr_id is not None:
                v["attributes"][str(dominant_attr_id)] = dom_val
        # tipo_clasificacion: solo columna BD o clave explícita en JSON (no el atributo dominante: Color/Potencia/etc.)
        if not (v.get("tipo_clasificacion") or str(v.get("tipo_clasificacion") or "").strip()):
            if isinstance(v.get("attributes"), dict) and (v["attributes"] or {}).get("Tipo/Clasificación"):
                v["tipo_clasificacion"] = str((v["attributes"] or {}).get("Tipo/Clasificación") or "").strip() or None
    variant_groups = []
    for g in group_rows:
        gid = int(g["id"])
        imgs = sorted(images_by_group.get(str(gid), []), key=lambda x: (x.get("sort_order") or 0))
        seen = set()
        urls_dedup = []
        for x in imgs:
            u = (x.get("image_url") or "").strip()
            if u and u not in seen:
                seen.add(u)
                urls_dedup.append(u)
        variant_groups.append({
            "id": gid,
            "dominant_attribute": g.get("dominant_attribute") or "color",
            "dominant_value": g.get("dominant_value") or "",
            "image_urls": urls_dedup,
            "combinations": combinations_by_group.get(gid, []),
        })
    # Imágenes de producto (panel admin): solo grupo "Sin color"; sin usar el primer grupo de color como portada
    sin_color_row = next((g for g in group_rows if (g.get("dominant_value") or "").strip().lower() == "sin color"), None)
    first_group_id = int(sin_color_row["id"]) if sin_color_row else None
    combos_by_group = {}
    for v in variants_flat:
        gid = int(v["group_id"])
        if gid not in combos_by_group:
            combos_by_group[gid] = []
        combos_by_group[gid].append(v["id"])
    # Dedupe por URL (normalizada: sin query string) para evitar duplicados cuando la misma imagen tiene ?v=1 y ?v=2
    def _normalize_url_for_dedupe(url: str) -> str:
        u = (url or "").strip()
        if "?" in u:
            u = u.split("?")[0]
        if "#" in u:
            u = u.split("#")[0]
        return u

    def _dedupe_images_by_url(imgs: list) -> list:
        seen = set()
        out = []
        for x in imgs:
            u = (x.get("image_url") or "").strip()
            if not u:
                continue
            key = _normalize_url_for_dedupe(u)
            if key in seen:
                continue
            seen.add(key)
            out.append(x)
        return out

    images_by_variant = {}
    for v in variants_flat:
        gid = str(v["group_id"])
        combo_id = v["id"]
        group_combos = combos_by_group.get(int(v["group_id"]), [])
        first_in_group = min(group_combos) if group_combos else combo_id
        is_product_images_combo = (
            first_group_id is not None
            and int(v["group_id"]) == first_group_id
            and combo_id == first_in_group
        )
        if is_product_images_combo:
            images_by_variant[str(combo_id)] = []
        else:
            images_by_variant[str(combo_id)] = _dedupe_images_by_url(images_by_group.get(gid, []))
    image_urls_ordered = []
    if sin_color_row:
        gid_for_product = str(int(sin_color_row["id"]))
        imgs = sorted(images_by_group.get(gid_for_product, []), key=lambda x: (x.get("sort_order") or 0))
        seen = set()
        for x in imgs:
            url = (x.get("image_url") or "").strip()
            if not url or url in seen:
                continue
            seen.add(url)
            image_urls_ordered.append((url, x.get("is_main")))
        main_url = next((u for u, is_main in image_urls_ordered if is_main), None)
        rest = [u for u, is_main in image_urls_ordered if u != main_url]
        image_urls_ordered = ([main_url] if main_url else []) + rest
    # Ensure category_id is int for frontend (Decimal serialization can vary)
    raw_cat = prod_row.get("category_id")
    category_id = int(raw_cat) if raw_cat is not None else 0
    return {
        "product": {
            "name": prod_row["name"],
            "category_id": category_id,
            "id_marca": _int_or_none(prod_row.get("id_marca")),
            "id_proveedor": _int_or_none(prod_row.get("id_proveedor")),
            "description": prod_row["description"],
            "is_active": bool(prod_row.get("is_active", True)),
        },
        "variants": variants_flat,
        "image_urls": image_urls_ordered,
        "images_by_variant": images_by_variant,
        "variant_groups": variant_groups,
    }

#create product
async def create_product(db: Session, product: ProductCreate, image_files: Optional[List[UploadFile]] = None, usr_insert: Decimal = None):
    """
    Crea un nuevo producto en la base de datos llamando a una función SQL.
    Si se proporcionan archivos de imagen, los sube a Cloudinary primero.

    Utiliza la función de base de datos `fun_insert_producto` para insertar
    un nuevo producto. Los datos del producto se toman del esquema `ProductCreate`.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        product (ProductCreate): Un objeto Pydantic `ProductCreate` con los datos del producto.
        image_files (Optional[List[UploadFile]]): Lista de archivos de imagen opcionales para subir a Cloudinary.

    Returns:
        dict or None: Un diccionario que representa el producto creado (generalmente el JSON
                      devuelto por la función SQL) o None si la creación falla o la función
                      SQL no devuelve el resultado esperado.
    """
    try:
        # Validación con tab_categories
        category_id = product.id_categoria or getattr(product, "category_id", None)
        if category_id is not None:
            validate_cat = db.execute(text(
                "SELECT 1 FROM tab_categories WHERE id = :cid"
            ), {"cid": category_id}).first()
            if not validate_cat:
                raise Exception("La categoría seleccionada no existe")
        print(f"🔍 DEBUG: image_files recibidos en servicio: {image_files}")
        print(f"🔍 DEBUG: Tipo de image_files: {type(image_files)}")
        
        # Si hay imágenes, subirlas a Cloudinary primero
        if image_files and len(image_files) > 0:
            print(f"🚀 DEBUG: Iniciando subida de {len(image_files)} imágenes a Cloudinary...")
            
            # Debug de cada archivo
            for i, file in enumerate(image_files):
                print(f"🔍 DEBUG: Archivo {i}: {file.filename}, tipo: {file.content_type}, tamaño: {file.size}")
            
            try:
                # Subir múltiples imágenes con transformación automática a WebP y optimización
                product_images = await cloudinary_service.upload_multiple_images(
                    image_files,
                    transform_to_webp=True,
                    quality="auto:good",
                    width=1200,  # Ancho máximo para productos
                    height=1200,  # Alto máximo para productos
                    generate_thumbnails=True
                )
                
                print(f"✅ DEBUG: Imágenes subidas exitosamente: {product_images}")
                
                # ✅ Mantener compatibilidad con el campo img_producto
                product.img_producto = product_images
                print(f"🖼️ DEBUG: img_producto asignado: {product.img_producto}")
                
                # ✅ No asignar a product.images ya que ProductCreate no tiene ese campo
                print(f"🖼️ DEBUG: Estructura completa de imágenes: {product_images}")
                
            except Exception as e:
                print(f"❌ ERROR al subir imágenes: {str(e)}")
                raise Exception(f"Error al subir imágenes a Cloudinary: {str(e)}")
        else:
            print("⚠️ DEBUG: No se recibieron archivos de imagen")
            product.img_producto = '{}'  # Estructura vacía
        
        category_id = product.id_categoria or getattr(product, "category_id", None)
        if not category_id:
            raise Exception("category_id o id_categoria es requerido")
        description = getattr(product, "description", None) or ((getattr(product, "spcf_producto", None) or {}).get("description") if isinstance(getattr(product, "spcf_producto", None), dict) else None)
        q1 = text("SELECT fun_insert_producto(:p_category_id, :p_name, :p_description, :p_id_marca, :p_is_active, :p_usr_operacion)")
        r1 = db.execute(q1, {"p_category_id": category_id, "p_name": getattr(product, "name", None) or getattr(product, "nom_producto", ""), "p_description": description, "p_id_marca": product.id_marca, "p_is_active": getattr(product, "is_active", getattr(product, "ind_activo", True)), "p_usr_operacion": usr_insert})
        msg = r1.fetchone()[0]
        if not msg or str(msg).strip().upper().startswith("ERROR"):
            db.rollback()
            raise Exception(str(msg) if msg else "Error al insertar producto")
        product_id = Decimal(str(msg).replace("OK:", "").strip())
        db.commit()
        spcf = getattr(product, "spcf_producto", None) or {}
        price = getattr(product, "val_precio", None) or getattr(product, "price_min", None) or Decimal("0")
        stock = int(getattr(product, "num_stock", 0) or getattr(product, "stock_total", 0) or 0)
        q2 = text("SELECT fun_insert_product_variant(:p_product_id, :p_price, :p_stock, NULL, TRUE, :p_usr_operacion)")
        r2 = db.execute(q2, {"p_product_id": product_id, "p_price": price, "p_stock": stock, "p_usr_operacion": usr_insert})
        vmsg = r2.fetchone()[0]
        if not vmsg or str(vmsg).strip().upper().startswith("ERROR"):
            db.rollback()
            raise Exception(str(vmsg) if vmsg else "Error al insertar variante")
        variant_id = Decimal(str(vmsg).replace("OK:", "").strip())
        db.commit()
        if isinstance(spcf, dict) and spcf:
            attrs_json = {str(k): str(v) for k, v in spcf.items()
                          if k not in ("description", "color", "Color", "size", "tamaño", "Tamaño") and v is not None and (not isinstance(v, str) or v.strip())}
            if attrs_json:
                db.execute(
                    text("UPDATE tab_product_variant_combinations SET attributes = attributes || CAST(:attrs AS JSONB), fec_update = NOW() WHERE id = :vid"),
                    {"attrs": json.dumps(attrs_json), "vid": variant_id},
                )
                db.commit()
        img_data = getattr(product, "img_producto", None)
        urls = []
        if isinstance(img_data, dict):
            if img_data.get("main"):
                urls.append(img_data["main"])
            urls.extend([u for u in (img_data.get("gallery") or []) if u and u not in urls])
        for i, url in enumerate(urls):
            db.execute(text("SELECT fun_insert_product_image(:pid, :url, :main, :ord, :usr)"), {"pid": product_id, "url": url, "main": (i == 0), "ord": i, "usr": usr_insert})
        if urls:
            db.commit()
        return f"OK:{product_id}"
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear el producto: {str(e)}")


def _get_dominant_attr_id(db: Session, attr_ids: set) -> Optional[int]:
    """Obtiene el attribute_id que corresponde a 'color' (dominante); si no hay, el primero."""
    if not attr_ids:
        return None
    row = db.execute(
        text("SELECT id FROM tab_attributes WHERE id = ANY(:ids) AND LOWER(TRIM(name)) = 'color' LIMIT 1"),
        {"ids": list(attr_ids)},
    ).first()
    if row:
        return int(row[0])
    return min(attr_ids) if attr_ids else None


def _get_color_attribute_id(db: Session) -> Optional[int]:
    """Id del atributo 'Color' (dominante). Usado para opciones de filtro y filtrado por color."""
    row = db.execute(
        text("SELECT id FROM tab_attributes WHERE LOWER(TRIM(name)) = 'color' LIMIT 1"),
    ).first()
    return int(row[0]) if row else None


def _get_attribute_name(db: Session, attr_id: Optional[int], default: str = "color") -> str:
    """
    Obtiene el nombre del atributo dado su id.

    - Si attr_id es None o no se encuentra en DB, devuelve `default` (por compatibilidad).
    - Esto permite que el atributo dominante para variantes/imágenes no se llame siempre "color"
      cuando en realidad es, por ejemplo, "Almacenamiento", "Tipo", etc.
    """
    if attr_id is None:
        return default
    row = db.execute(
        text("SELECT name FROM tab_attributes WHERE id = :id LIMIT 1"),
        {"id": int(attr_id)},
    ).first()
    if row and row[0]:
        name = str(row[0]).strip()
        return name or default
    return default


def _group_variants_by_dominant(payload_variants: list, dominant_attr_id: Optional[int]) -> dict:
    """Agrupa variantes por valor del atributo dominante (ej. color). Key = valor o 'Sin color'."""
    groups = {}
    for v in payload_variants:
        attrs = getattr(v, "attributes", None) or {}
        dominant_val = "Sin color"
        if dominant_attr_id is not None and str(dominant_attr_id) in attrs:
            dominant_val = str(attrs[str(dominant_attr_id)]).strip() or "Sin color"
        elif attrs:
            first_key = next(iter(attrs), None)
            if first_key is not None and attrs[first_key] is not None:
                dominant_val = str(attrs[first_key]).strip() or "Sin color"
        if dominant_val not in groups:
            groups[dominant_val] = []
        groups[dominant_val].append(v)
    return groups


def _group_variants_one_per_row(payload_variants: list, dominant_attr_id: Optional[int]) -> dict:
    """
    Un grupo por variante (cada fila = su grupo e imágenes).
    Si el mismo valor dominante se repite (ej. 2 variantes "Blanco"), la primera conserva
    el label simple ("Blanco") y las demás usan label compuesto ("Blanco - Con USB" o "Blanco - Variante N")
    para no violar UNIQUE(product_id, dominant_value).
    """
    result = {}
    # 1) Obtener valor dominante por fila (atributo dominante, o tipo_clasificación, o primer atributo; evitar "Variante N" si hay algo mejor)
    dominant_vals = []
    for i, v in enumerate(payload_variants):
        attrs = getattr(v, "attributes", None) or {}
        val = ""
        if dominant_attr_id is not None and str(dominant_attr_id) in attrs:
            val = str(attrs[str(dominant_attr_id)]).strip()
        if not val and attrs:
            val = next((str(attrs[k]).strip() for k in attrs if attrs[k] is not None), "") or ""
        if not val:
            tipo = getattr(v, "tipo_clasificacion", None)
            val = (str(tipo).strip() if tipo is not None else "") or ""
        dominant_vals.append(val or f"Variante {i + 1}")
    # 2) Contar cuántas veces aparece cada valor
    counts = {}
    for v in dominant_vals:
        counts[v] = counts.get(v, 0) + 1
    # 3) Asignar label: si es único queda igual; si se repite, primera vez igual y el resto con sufijo
    seen_count = {}
    for i, v in enumerate(payload_variants):
        base = dominant_vals[i]
        if counts.get(base, 0) <= 1:
            label = base
        else:
            seen_count[base] = seen_count.get(base, 0) + 1
            if seen_count[base] == 1:
                label = base
            else:
                tipo = getattr(v, "tipo_clasificacion", None)
                tipo_txt = (str(tipo).strip() if tipo is not None else "") or ""
                label = f"{base} - {tipo_txt}" if tipo_txt else f"{base} - Variante {i + 1}"
        result[i] = (label, [v])
    return result


def create_product_composite(db: Session, payload: ProductCreateComposite, usr_insert: Decimal):
    """
    Crea producto + variant_groups (dominante) + imágenes por grupo + combinaciones (stock/SKU/attributes JSONB).
    Agrupa variantes por atributo 'color' (o primer atributo) y escribe en tab_product_variant_groups/combinations/images.
    """
    try:
        p = payload.product
        all_attr_ids = set()
        for v in payload.variants:
            if v.attributes:
                for k in v.attributes:
                    try:
                        all_attr_ids.add(int(k))
                    except (TypeError, ValueError):
                        pass
        dominant_attr_id = _get_dominant_attr_id(db, all_attr_ids)
        groups_one_per_row = _group_variants_one_per_row(payload.variants, dominant_attr_id)

        q1 = text(
            "SELECT fun_insert_producto(:p_category_id, :p_name, :p_description, :p_id_marca, :p_is_active, :p_usr_operacion, :p_id_proveedor)"
        )
        r1 = db.execute(q1, {
            "p_category_id": p.category_id,
            "p_name": p.name,
            "p_description": p.description,
            "p_id_marca": p.id_marca,
            "p_is_active": p.is_active,
            "p_usr_operacion": usr_insert,
            "p_id_proveedor": getattr(p, "id_proveedor", None),
        })
        msg = r1.fetchone()[0]
        if not msg or str(msg).strip().upper().startswith("ERROR"):
            raise Exception(str(msg) if msg else "Error al insertar producto")
        product_id = Decimal(str(msg).replace("OK:", "").strip())

        # Nombre del atributo dominante: si existe en tab_attributes úsalo (ej. "Almacenamiento", "Tipo");
        # si no, caer en "color" por compatibilidad con datos antiguos.
        dominant_attr_name = _get_attribute_name(db, dominant_attr_id, default="color")
        product_image_urls_create = getattr(payload, "image_urls", None) or []
        if product_image_urls_create:
            rg = db.execute(
                text("SELECT fun_insert_variant_group(:pid, :attr, :val, TRUE)"),
                {"pid": product_id, "attr": dominant_attr_name, "val": "Sin color"},
            ).fetchone()[0]
            if rg and not str(rg).strip().upper().startswith("ERROR"):
                sin_color_gid = int(str(rg).replace("OK:", "").strip())
                seen = set()
                for ord_i, url in enumerate(product_image_urls_create):
                    url = (url or "").strip()
                    if not url or url in seen:
                        continue
                    seen.add(url)
                    db.execute(
                        text("SELECT fun_insert_variant_group_image(:gid, :url, :primary, :ord)"),
                        {"gid": sin_color_gid, "url": url, "primary": ord_i == 0, "ord": ord_i},
                    )

        for _idx, (group_label, variants_in_group) in sorted(groups_one_per_row.items()):
            resolved_label = group_label or "Sin color"
            if dominant_attr_id is not None and (group_label or "").strip():
                _, text_val = _resolve_attribute_value_id(db, dominant_attr_id, group_label)
                if text_val:
                    resolved_label = text_val
            rg = db.execute(
                text("SELECT fun_insert_variant_group(:pid, :attr, :val, TRUE)"),
                {"pid": product_id, "attr": dominant_attr_name, "val": resolved_label},
            ).fetchone()[0]
            if not rg or str(rg).strip().upper().startswith("ERROR"):
                raise Exception(str(rg) if rg else "Error al insertar grupo")
            group_id = int(str(rg).replace("OK:", "").strip())

            seen_urls = set()
            for idx, v in enumerate(variants_in_group):
                variant_urls = getattr(v, "image_urls", None) or []
                main_idx = min(int(getattr(v, "main_index", 0) or 0), max(0, len(variant_urls) - 1))
                for i, url in enumerate(variant_urls):
                    if not (url and str(url).strip()) or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    db.execute(
                        text("SELECT fun_insert_variant_group_image(:gid, :url, :primary, :ord)"),
                        {"gid": group_id, "url": url.strip(), "primary": (idx == 0 and i == main_idx), "ord": len(seen_urls) - 1},
                    )

            for v in variants_in_group:
                internal_attrs = {}
                if v.attributes:
                    for k, val in v.attributes.items():
                        if dominant_attr_id is not None and str(k) == str(dominant_attr_id):
                            continue
                        if val is None or str(val).strip() == "":
                            continue
                        try:
                            _, text_val = _resolve_attribute_value_id(db, int(k), val)
                            if text_val:
                                internal_attrs[str(k)] = text_val
                            else:
                                internal_attrs[str(k)] = str(val).strip()
                        except (TypeError, ValueError):
                            internal_attrs[str(k)] = str(val).strip()
                attrs_json = json.dumps(internal_attrs) if internal_attrs else "{}"
                tipo_clasif = (v.tipo_clasificacion and v.tipo_clasificacion.strip()) or None if hasattr(v, 'tipo_clasificacion') else None
                sku_to_try = (v.sku and v.sku.strip()) or None
                rc = None
                for _attempt in range(4):
                    rc = db.execute(
                        text("SELECT fun_insert_variant_combination(:gid, :sku, :price, :stock, CAST(:attrs AS JSONB), :active, :tipo_clasif)"),
                        {
                            "gid": group_id,
                            "sku": sku_to_try,
                            "price": v.price,
                            "stock": v.stock,
                            "attrs": attrs_json,
                            "active": v.is_active,
                            "tipo_clasif": tipo_clasif,
                        },
                    ).fetchone()[0]
                    if rc and not str(rc).strip().upper().startswith("ERROR"):
                        break
                    if rc and "SKU duplicado" in str(rc):
                        sku_to_try = f"RV-{int(product_id)}-{group_id}-{uuid4().hex[:8]}"
                        continue
                    break
                if not rc or str(rc).strip().upper().startswith("ERROR"):
                    raise Exception(str(rc) if rc else "Error al insertar combinación")

        db.commit()
        return f"OK:{product_id}"
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear producto compuesto: {str(e)}")


def update_product_composite(db: Session, product_id: Decimal, payload: ProductCreateComposite, usr_update: Decimal):
    """
    Actualiza producto y reemplaza variant_groups, imágenes por grupo y combinaciones.
    """
    try:
        p = payload.product
        r = db.execute(text("""
            SELECT fun_update_producto(
                :p_id, :p_category_id, :p_name, :p_description, :p_id_marca, :p_is_active, :p_usr_operacion, :p_id_proveedor
            )
        """), {
            "p_id": product_id,
            "p_category_id": p.category_id,
            "p_name": p.name,
            "p_description": p.description,
            "p_id_marca": p.id_marca,
            "p_is_active": p.is_active,
            "p_usr_operacion": usr_update,
            "p_id_proveedor": getattr(p, "id_proveedor", None),
        })
        msg = r.fetchone()[0]
        if msg and str(msg).strip().upper().startswith("ERROR"):
            raise Exception(str(msg))

        # No eliminar variantes/grupos que estén referenciados por órdenes o carritos activos.
        # De lo contrario, falla por FK (tab_orden_productos.variant_id / tab_carrito_productos.variant_id -> combinations.id).
        locked_group_rows = db.execute(text("""
            SELECT DISTINCT g.id
            FROM tab_product_variant_groups g
            JOIN tab_product_variant_combinations c ON c.group_id = g.id
            WHERE g.product_id = :pid
              AND (
                    EXISTS (SELECT 1 FROM tab_orden_productos op WHERE op.variant_id = c.id)
                 OR EXISTS (SELECT 1 FROM tab_carrito_productos cp WHERE cp.variant_id = c.id)
              )
        """), {"pid": product_id}).fetchall()
        locked_group_ids = [int(r[0]) for r in locked_group_rows if r and r[0] is not None]

        db.execute(text("""
            DELETE FROM tab_product_variant_images
            WHERE variant_group_id IN (
                SELECT id FROM tab_product_variant_groups
                WHERE product_id = :pid
                  AND id <> ALL(:locked_ids)
            )
        """), {"pid": product_id, "locked_ids": locked_group_ids})
        db.execute(text("""
            DELETE FROM tab_product_variant_combinations
            WHERE id IN (
                SELECT c.id
                FROM tab_product_variant_combinations c
                JOIN tab_product_variant_groups g ON g.id = c.group_id
                WHERE g.product_id = :pid
                  AND g.id <> ALL(:locked_ids)
                  AND NOT EXISTS (SELECT 1 FROM tab_orden_productos op WHERE op.variant_id = c.id)
                  AND NOT EXISTS (SELECT 1 FROM tab_carrito_productos cp WHERE cp.variant_id = c.id)
            )
        """), {"pid": product_id, "locked_ids": locked_group_ids})
        db.execute(text("""
            DELETE FROM tab_product_variant_groups g
            WHERE g.product_id = :pid
              AND g.id <> ALL(:locked_ids)
              AND NOT EXISTS (
                    SELECT 1 FROM tab_product_variant_combinations c
                    WHERE c.group_id = g.id
              )
        """), {"pid": product_id, "locked_ids": locked_group_ids})

        all_attr_ids = set()
        for v in payload.variants:
            if v.attributes:
                for k in v.attributes:
                    try:
                        all_attr_ids.add(int(k))
                    except (TypeError, ValueError):
                        pass
        dominant_attr_id = _get_dominant_attr_id(db, all_attr_ids)
        groups_one_per_row = _group_variants_one_per_row(payload.variants, dominant_attr_id)
        # Nombre del atributo dominante al actualizar: mismo criterio que en create_product_composite
        dominant_attr_name = _get_attribute_name(db, dominant_attr_id, default="color")

        product_image_urls = getattr(payload, "image_urls", None) or []
        # Grupo "Sin color" para imágenes del producto (panel admin / PDP); no copiar a grupos de color
        if product_image_urls:
            rg = db.execute(
                text("SELECT fun_insert_variant_group(:pid, :attr, :val, TRUE)"),
                {"pid": product_id, "attr": dominant_attr_name, "val": "Sin color"},
            ).fetchone()[0]
            if rg and not str(rg).strip().upper().startswith("ERROR"):
                sin_color_gid = int(str(rg).replace("OK:", "").strip())
                db.execute(
                    text("DELETE FROM tab_product_variant_images WHERE variant_group_id = :gid"),
                    {"gid": sin_color_gid},
                )
                seen_urls = set()
                for ord_i, url in enumerate(product_image_urls):
                    url = (url or "").strip()
                    if not url or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    db.execute(
                        text("SELECT fun_insert_variant_group_image(:gid, :url, :primary, :ord)"),
                        {"gid": sin_color_gid, "url": url, "primary": ord_i == 0, "ord": ord_i},
                    )

        for _idx, (group_label, variants_in_group) in sorted(groups_one_per_row.items()):
            # Resolve value_id to display string for group dominant_value (e.g. "123" -> "Negro")
            resolved_label = group_label or "Sin color"
            if dominant_attr_id is not None and (group_label or "").strip():
                _, text_val = _resolve_attribute_value_id(db, dominant_attr_id, group_label)
                if text_val:
                    resolved_label = text_val
            rg = db.execute(
                text("SELECT fun_insert_variant_group(:pid, :attr, :val, TRUE)"),
                {"pid": product_id, "attr": dominant_attr_name, "val": resolved_label},
            ).fetchone()[0]
            if not rg or str(rg).strip().upper().startswith("ERROR"):
                raise Exception(str(rg) if rg else "Error al insertar grupo")
            group_id = int(str(rg).replace("OK:", "").strip())

            db.execute(
                text("DELETE FROM tab_product_variant_images WHERE variant_group_id = :gid"),
                {"gid": group_id},
            )
            seen_urls = set()
            ord_next = 0
            # Mismo group_id que el bloque de imágenes de producto: volver a escribir la galería antes de las imágenes por variante
            if (resolved_label or "").strip().lower() == "sin color" and product_image_urls:
                for url in product_image_urls:
                    url = (url or "").strip()
                    if not url or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    db.execute(
                        text("SELECT fun_insert_variant_group_image(:gid, :url, :primary, :ord)"),
                        {"gid": group_id, "url": url, "primary": ord_next == 0, "ord": ord_next},
                    )
                    ord_next += 1
            for idx, v in enumerate(variants_in_group):
                variant_urls = getattr(v, "image_urls", None) or []
                main_idx = min(int(getattr(v, "main_index", 0) or 0), max(0, len(variant_urls) - 1))
                _sin_color_gallery = (resolved_label or "").strip().lower() == "sin color" and bool(product_image_urls)
                for i, url in enumerate(variant_urls):
                    if not (url and str(url).strip()) or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    db.execute(
                        text("SELECT fun_insert_variant_group_image(:gid, :url, :primary, :ord)"),
                        {
                            "gid": group_id,
                            "url": url.strip(),
                            "primary": (idx == 0 and i == main_idx) and not _sin_color_gallery,
                            "ord": ord_next,
                        },
                    )
                    ord_next += 1

            # Combinaciones: borrar solo las no referenciadas (órdenes/carrito);
            # actualizar las referenciadas existentes; insertar el resto.
            db.execute(text("""
                DELETE FROM tab_product_variant_combinations c
                WHERE c.group_id = :gid
                  AND NOT EXISTS (
                    SELECT 1 FROM tab_orden_productos op WHERE op.variant_id = c.id
                  )
                  AND NOT EXISTS (
                    SELECT 1 FROM tab_carrito_productos cp WHERE cp.variant_id = c.id
                  )
            """), {"gid": group_id})
            ref_rows = db.execute(text("""
                SELECT c.id FROM tab_product_variant_combinations c
                WHERE c.group_id = :gid
                  AND (
                        EXISTS (SELECT 1 FROM tab_orden_productos op WHERE op.variant_id = c.id)
                     OR EXISTS (SELECT 1 FROM tab_carrito_productos cp WHERE cp.variant_id = c.id)
                  )
                ORDER BY c.id
            """), {"gid": group_id}).fetchall()
            ref_ids = [int(r[0]) for r in ref_rows if r and r[0] is not None]

            for idx, v in enumerate(variants_in_group):
                internal_attrs = {}
                if v.attributes:
                    for k, val in v.attributes.items():
                        if dominant_attr_id is not None and str(k) == str(dominant_attr_id):
                            continue
                        if val is None or str(val).strip() == "":
                            continue
                        try:
                            _, text_val = _resolve_attribute_value_id(db, int(k), val)
                            if text_val:
                                internal_attrs[str(k)] = text_val
                            else:
                                internal_attrs[str(k)] = str(val).strip()
                        except (TypeError, ValueError):
                            internal_attrs[str(k)] = str(val).strip()
                attrs_json = json.dumps(internal_attrs) if internal_attrs else "{}"
                tipo_clasif = (v.tipo_clasificacion and v.tipo_clasificacion.strip()) or None if hasattr(v, 'tipo_clasificacion') else None
                sku_to_try = (v.sku and v.sku.strip()) or None
                if idx < len(ref_ids):
                    cid = ref_ids[idx]
                    prev_row = db.execute(
                        text("SELECT stock, sku FROM tab_product_variant_combinations WHERE id = :cid"),
                        {"cid": cid},
                    ).fetchone()
                    old_stock = int(prev_row[0] or 0) if prev_row else 0
                    new_stock = int(v.stock or 0)
                    db.execute(text("""
                        UPDATE tab_product_variant_combinations
                        SET sku = COALESCE(:sku, sku),
                            price = :price,
                            stock = :stock,
                            attributes = CAST(:attrs AS JSONB),
                            is_active = :active,
                            tipo_clasificacion = :tipo_clasif,
                            usr_update = :usr,
                            fec_update = NOW()
                        WHERE id = :cid
                    """), {
                        "sku": sku_to_try,
                        "price": v.price,
                        "stock": v.stock,
                        "attrs": attrs_json,
                        "active": v.is_active,
                        "tipo_clasif": tipo_clasif,
                        "usr": usr_update,
                        "cid": cid,
                    })
                    if new_stock == 0 and old_stock > 0:
                        pname_row = db.execute(
                            text("SELECT name FROM tab_products WHERE id = :pid"),
                            {"pid": product_id},
                        ).fetchone()
                        pname = str(pname_row[0] or "") if pname_row else ""
                        notify_variant_out_of_stock(
                            db,
                            product_id=int(product_id),
                            product_name=pname,
                            variant_id=int(cid),
                            sku=sku_to_try,
                            order_id=None,
                            source_label="Edición en panel admin",
                        )
                    elif (
                        1 <= new_stock <= LOW_STOCK_MAX
                        and old_stock > LOW_STOCK_MAX
                    ):
                        pname_row = db.execute(
                            text("SELECT name FROM tab_products WHERE id = :pid"),
                            {"pid": product_id},
                        ).fetchone()
                        pname = str(pname_row[0] or "") if pname_row else ""
                        notify_variant_low_stock(
                            db,
                            product_id=int(product_id),
                            product_name=pname,
                            variant_id=int(cid),
                            sku=sku_to_try,
                            current_stock=new_stock,
                            order_id=None,
                            source_label="Edición en panel admin",
                        )
                else:
                    rc = None
                    for _attempt in range(4):
                        rc = db.execute(
                            text("SELECT fun_insert_variant_combination(:gid, :sku, :price, :stock, CAST(:attrs AS JSONB), :active, :tipo_clasif)"),
                            {
                                "gid": group_id,
                                "sku": sku_to_try,
                                "price": v.price,
                                "stock": v.stock,
                                "attrs": attrs_json,
                                "active": v.is_active,
                                "tipo_clasif": tipo_clasif,
                            },
                        ).fetchone()[0]
                        if rc and not str(rc).strip().upper().startswith("ERROR"):
                            break
                        if rc and "SKU duplicado" in str(rc):
                            sku_to_try = f"RV-{int(product_id)}-{group_id}-{uuid4().hex[:8]}"
                            continue
                        break
                    if not rc or str(rc).strip().upper().startswith("ERROR"):
                        raise Exception(str(rc) if rc else "Error al insertar combinación")

            for j in range(len(variants_in_group), len(ref_ids)):
                db.execute(text("""
                    UPDATE tab_product_variant_combinations
                    SET is_active = FALSE, usr_update = :usr, fec_update = NOW()
                    WHERE id = :cid
                """), {"cid": ref_ids[j], "usr": usr_update})

        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar producto compuesto: {str(e)}")


#update product
async def update_product(
    id_categoria: Decimal,
    id_linea: Decimal,
    id_sublinea: Decimal,         
    id_producto: Decimal,
    product: ProductUpdate,
    db: Session,
    image_files: Optional[List[UploadFile]] = None,
    usr_update: Decimal = None
    ):
    """
    Actualiza un producto existente en la base de datos llamando a una función SQL.
    Si se proporciona un archivo de imagen, lo sube a Cloudinary primero.

    Utiliza la función de base de datos `fun_update_producto` para actualizar
    un producto existente, identificado por `id_producto`. Los datos para la
    actualización se toman del esquema `ProductUpdate` (solo campos proporcionados).

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_producto (int): El ID del producto a actualizar.
        product (ProductUpdate): Un objeto Pydantic `ProductUpdate` con los datos a actualizar.
        image_file (Optional[UploadFile]): Archivo de imagen opcional para subir a Cloudinary.

    Returns:
        dict or None: Un diccionario que representa el producto actualizado (generalmente el JSON
                      devuelto por la función SQL) o None si la actualización falla o la función
                      SQL no devuelve el resultado esperado.
    """
    try:
        print(f"🔍 DEBUG UPDATE: image_files recibidos en servicio: {image_files}")
        print(f"🔍 DEBUG UPDATE: Tipo de image_files: {type(image_files)}")
        
        # Si hay imágenes, subirlas a Cloudinary primero
        if image_files and len(image_files) > 0:
            print(f"🚀 DEBUG UPDATE: Iniciando subida de {len(image_files)} imágenes a Cloudinary...")
            
            # Debug de cada archivo
            for i, file in enumerate(image_files):
                print(f"🔍 DEBUG UPDATE: Archivo {i}: {file.filename}, tipo: {file.content_type}, tamaño: {file.size}")
            
            try:
                # Subir múltiples imágenes con transformación automática a WebP y optimización
                product_images = await cloudinary_service.upload_multiple_images(
                    image_files,
                    transform_to_webp=True,
                    quality="auto:good",
                    width=1200,  # Ancho máximo para productos
                    height=1200,  # Alto máximo para productos
                    generate_thumbnails=True
                )
                
                print(f"✅ DEBUG UPDATE: Imágenes subidas exitosamente: {product_images}")
                
                # ✅ Mantener compatibilidad con el campo img_producto
                product.img_producto = product_images
                print(f"🖼️ DEBUG UPDATE: img_producto asignado: {product.img_producto}")
                
                # ✅ No asignar a product.images ya que ProductUpdate no tiene ese campo
                print(f"🖼️ DEBUG UPDATE: Estructura completa de imágenes: {product_images}")
                
            except Exception as e:
                print(f"❌ ERROR UPDATE al subir imágenes: {str(e)}")
                raise Exception(f"Error al subir imágenes a Cloudinary: {str(e)}")
        else:
            print("⚠️ DEBUG UPDATE: No se recibieron archivos de imagen")
            # No modificar img_producto si no hay nuevas imágenes
        
        params = product.model_dump(exclude_unset=True) # Solo incluye campos que se proporcionaron

        # Asegurar que TODAS las llaves esperadas por la función SQL existan
        # aunque sea con valor None, para evitar errores de bind parameter faltante
        expected_keys = ['name', 'description', 'id_marca', 'is_active']
        for key in expected_keys:
            if key not in params:
                params[key] = None
        # fun_update_producto(p_id, p_category_id, p_name, p_description, p_id_marca, p_is_active, p_usr_operacion)
        category_id = params.get("category_id") or params.get("id_categoria") or id_categoria
        query = text("""
            SELECT fun_update_producto(
                :p_id, :p_category_id, :p_name, :p_description, :p_id_marca, :p_is_active, :p_usr_operacion
            )
        """)
        result = db.execute(query, {
            "p_id": id_producto,
            "p_category_id": category_id,
            "p_name": params.get("name") or params.get("nom_producto"),
            "p_description": params.get("description"),
            "p_id_marca": params.get("id_marca"),
            "p_is_active": params.get("is_active"),
            "p_usr_operacion": usr_update,
        })
        fetched_result = result.fetchone()
        msg = fetched_result[0] if fetched_result else None
        if msg and str(msg).strip().lower().startswith("error:"):
            db.rollback()
            raise Exception(str(msg).strip())
        db.commit()
        return msg
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar el producto: {str(e)}")

def deactivate_activate_product(
    db: Session,
    category_id: Decimal,
    line_id: Decimal,
    subline_id: Decimal,
    product_id: Decimal,
    usr_update: Decimal,
    activar: bool,
):
    """Activa o desactiva producto y sus variantes (fun_deactivate_activate_producto por product_id)."""
    try:
        query = text("""
        SELECT fun_deactivate_activate_producto(:p_id_producto, :p_activar, :p_usr_operacion)
        """)
        params = {
            "p_id_producto": product_id,
            "p_activar": activar,
            "p_usr_operacion": usr_update,
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al cambiar estado del producto: {str(e)}")

def deactivate_product(
    db: Session, 
    category_id: Decimal,
    line_id: Decimal,
    subline_id: Decimal,
    product_id: Decimal,
    usr_update: Decimal
    ):
    """
    Desactiva un producto existente de la base de datos (wrapper para mantener compatibilidad).
    
    Utiliza la función de base de datos `fun_deactivate_producto` para eliminar
    un producto existente, identificado por `id_producto`.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        category_id (Decimal): El ID de la categoría del producto a desactivar.
        line_id (Decimal): El ID de la línea del producto a desactivar.
        subline_id (Decimal): El ID de la sublínea del producto a desactivar.
        product_id (Decimal): El ID del producto a desactivar.
    
    Returns:
        dict or None: Un diccionario con el mensaje de resultado o None si falla.
    """
    return deactivate_activate_product(db, category_id, line_id, subline_id, product_id, usr_update, False)


def set_product_active(
    db: Session,
    product_id: Decimal,
    active: bool,
    usr_update: Decimal,
):
    """
    Actualiza únicamente el campo is_active de un producto y sus variantes.
    Usa fun_deactivate_activate_producto.
    """
    return deactivate_activate_product(
        db, Decimal(0), Decimal(0), Decimal(0), product_id, usr_update, active
    )

#filter products
def filter_products(db: Session, filters: ProductFilterParams) -> ProductFilterResponse:
    """
    Filtra productos con fun_filter_products (tab_products, variant_combinations).
    Opcionalmente filtra por atributos (combinations.attributes JSONB) en aplicación.
    """
    try:
        if filters.precio_min is not None and filters.precio_max is not None and filters.precio_min > filters.precio_max:
            raise ValueError("El precio mínimo no puede ser mayor al precio máximo")

        params = {
            "p_category_id": filters.category_id,
            "p_include_subcategories": filters.include_subcategories,
            "p_id_marca": filters.id_marca,
            "p_nombre_producto": filters.nombre_producto,
            "p_precio_min": filters.precio_min,
            "p_precio_max": filters.precio_max,
            "p_solo_con_stock": filters.solo_con_stock,
            "p_solo_en_oferta": filters.solo_en_oferta,
            "p_ordenar_por": filters.ordenar_por,
            "p_orden": filters.orden,
            "p_limit": filters.limit,
            "p_offset": filters.offset,
        }
        query = text("""
            SELECT product_id, category_id, nom_categoria, nom_producto, slug_producto, description,
                   id_marca, precio_min, precio_max, stock_total, img_principal, total_registros
            FROM fun_filter_products(
                :p_category_id, :p_include_subcategories, :p_id_marca, :p_nombre_producto,
                :p_precio_min, :p_precio_max, :p_solo_con_stock, :p_solo_en_oferta, :p_ordenar_por, :p_orden,
                :p_limit, :p_offset
            )
        """)
        result = db.execute(query, params)
        rows = list(result.mappings().all())

        # Filtro por atributos: Color por g.dominant_value; el resto por c.attributes->>attribute_id.
        if getattr(filters, "atributos", None) and filters.atributos:
            product_ids_with_attrs = None
            color_attr_id = _get_color_attribute_id(db)
            for (aid, values) in filters.atributos.items():
                if not values:
                    continue
                aid_int = int(aid)
                vals_expanded = _filter_values_for_attribute(db, aid_int, list(values))
                if color_attr_id is not None and aid_int == color_attr_id:
                    q = text("""
                        SELECT DISTINCT g.product_id
                        FROM tab_product_variant_groups g
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE g.is_active = TRUE AND p.is_active = TRUE
                          AND g.dominant_value = ANY(:vals)
                    """)
                    r = db.execute(q, {"vals": vals_expanded})
                else:
                    attr_key = str(aid_int)
                    q = text("""
                        SELECT DISTINCT g.product_id
                        FROM tab_product_variant_combinations c
                        JOIN tab_product_variant_groups g ON g.id = c.group_id
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE c.is_active = TRUE AND p.is_active = TRUE
                          AND c.attributes->>:attr_key = ANY(:vals)
                    """)
                    r = db.execute(q, {"attr_key": attr_key, "vals": vals_expanded})
                ids = {x["product_id"] for x in r.mappings().all()}
                if product_ids_with_attrs is None:
                    product_ids_with_attrs = ids
                else:
                    product_ids_with_attrs &= ids
            if product_ids_with_attrs is not None and len(product_ids_with_attrs) > 0:
                rows = [r for r in rows if r.get("product_id") in product_ids_with_attrs]

        product_ids = [r["product_id"] for r in rows]
        ratings_dict = {}
        if product_ids:
            rq = text("""
                SELECT product_id, ROUND(AVG(calificacion)::numeric, 1)::float AS rating
                FROM tab_comentarios
                WHERE ind_activo = TRUE AND calificacion IS NOT NULL AND product_id = ANY(:ids)
                GROUP BY product_id
            """)
            rres = db.execute(rq, {"ids": product_ids})
            ratings_dict = {r["product_id"]: r["rating"] for r in rres.mappings().all()}

        total = rows[0]["total_registros"] if rows else 0
        products = []
        for row in rows:
            products.append(ProductFiltered(
                category_id=int(row["category_id"]) if row.get("category_id") is not None else 0,
                id=int(row["product_id"]) if row.get("product_id") is not None else 0,
                slug=row.get("slug_producto"),
                category_name=(row.get("nom_categoria") or "") or "",
                name=(row.get("nom_producto") or "") or "",
                description=row.get("description"),
                image_url=row.get("img_principal"),
                price_min=row.get("precio_min") or Decimal("0"),
                price_max=row.get("precio_max") or row.get("precio_min") or Decimal("0"),
                stock_total=int(row.get("stock_total") or 0),
                total_registros=int(total),
                rating=ratings_dict.get(row["product_id"]),
                id_marca=int(row["id_marca"]) if row.get("id_marca") is not None else None,
                nom_marca=row.get("nom_marca"),
                fec_insert=None,
            ))

        page = (filters.offset // filters.limit) + 1
        total_pages = (int(total) + filters.limit - 1) // filters.limit if total else 0
        return ProductFilterResponse(
            products=products,
            total=int(total),
            page=page,
            total_pages=total_pages,
            limit=filters.limit,
            offset=filters.offset,
        )
    except Exception as e:
        # Log detallado para depuración en entorno de desarrollo
        print(f"[ERROR] Error al filtrar productos: {e}")
        db.rollback()
        raise Exception(f"Error al filtrar productos: {str(e)}")

def get_filter_stats(db: Session, filters: ProductFilterParams) -> ProductFilterStats:
    """
    Estadísticas de productos que coinciden con los filtros (tab_products + variant_combinations).
    Usa la misma lógica que filter_products pero sin paginación para contar y agregar.
    """
    try:
        # Usar fun_filter_products con límite alto para obtener total y agregados
        params = {
            "p_category_id": filters.category_id,
            "p_include_subcategories": filters.include_subcategories,
            "p_id_marca": filters.id_marca,
            "p_nombre_producto": filters.nombre_producto,
            "p_precio_min": filters.precio_min,
            "p_precio_max": filters.precio_max,
            "p_solo_con_stock": filters.solo_con_stock,
            "p_solo_en_oferta": filters.solo_en_oferta,
            "p_ordenar_por": "nombre",
            "p_orden": "ASC",
            "p_limit": 10000,
            "p_offset": 0,
        }
        query = text("""
            SELECT product_id, category_id, nom_categoria, id_marca, precio_min, stock_total, total_registros
            FROM fun_filter_products(
                :p_category_id, :p_include_subcategories, :p_id_marca, :p_nombre_producto,
                :p_precio_min, :p_precio_max, :p_solo_con_stock, :p_solo_en_oferta, :p_ordenar_por, :p_orden,
                :p_limit, :p_offset
            )
        """)
        result = db.execute(query, params)
        rows = list(result.mappings().all())
        if getattr(filters, "atributos", None) and filters.atributos:
            product_ids_with_attrs = None
            color_attr_id = _get_color_attribute_id(db)
            for (aid, values) in filters.atributos.items():
                if not values:
                    continue
                aid_int = int(aid)
                vals_expanded = _filter_values_for_attribute(db, aid_int, list(values))
                if color_attr_id is not None and aid_int == color_attr_id:
                    q = text("""
                        SELECT DISTINCT g.product_id
                        FROM tab_product_variant_groups g
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE g.is_active = TRUE AND p.is_active = TRUE
                          AND g.dominant_value = ANY(:vals)
                    """)
                    r = db.execute(q, {"vals": vals_expanded})
                else:
                    attr_key = str(aid_int)
                    q = text("""
                        SELECT DISTINCT g.product_id
                        FROM tab_product_variant_combinations c
                        JOIN tab_product_variant_groups g ON g.id = c.group_id
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE c.is_active = TRUE AND p.is_active = TRUE
                          AND c.attributes->>:attr_key = ANY(:vals)
                    """)
                    r = db.execute(q, {"attr_key": attr_key, "vals": vals_expanded})
                ids = {x["product_id"] for x in r.mappings().all()}
                product_ids_with_attrs = ids if product_ids_with_attrs is None else (product_ids_with_attrs & ids)
            if product_ids_with_attrs is not None and product_ids_with_attrs:
                rows = [r for r in rows if r.get("product_id") in product_ids_with_attrs]

        if not rows:
            return ProductFilterStats(
                total_productos=0,
                precio_minimo=None,
                precio_maximo=None,
                precio_promedio=None,
                total_stock=0,
                categorias_disponibles=0,
                marcas_disponibles=0,
            )
        precios = [float(r["precio_min"]) for r in rows if r.get("precio_min") is not None]
        stocks = [int(r.get("stock_total") or 0) for r in rows]
        categorias = len(set(r["category_id"] for r in rows if r.get("category_id") is not None))
        return ProductFilterStats(
            total_productos=len(rows),
            precio_minimo=Decimal(min(precios)) if precios else None,
            precio_maximo=Decimal(max(precios)) if precios else None,
            precio_promedio=Decimal(sum(precios) / len(precios)) if precios else None,
            total_stock=sum(stocks),
            categorias_disponibles=categorias,
            marcas_disponibles=len(set(r.get("id_marca") for r in rows if r.get("id_marca") is not None)),
        )
    except Exception as e:
        # Log detallado para depuración en entorno de desarrollo
        print(f"[ERROR] Error al obtener estadísticas de filtros: {e}")
        db.rollback()
        raise Exception(f"Error al obtener estadísticas de filtros: {str(e)}")

def get_filter_options(db: Session, category_id: Optional[int] = None) -> dict:
    """
    Opciones de filtro para tienda: árbol de categorías, precio, atributos (solo si category_id),
    marcas. Los atributos solo se devuelven cuando se pasa category_id y son los de esa categoría.
    En combinations.attributes el JSONB usa clave numérica (attribute_id como string).
    """
    try:
        # Árbol de categorías (solo activas): lista con id, name, slug, parent_id, level, children opcional
        tree_query = text("""
            SELECT
                id,
                name,
                slug,
                parent_id,
                is_active,
                level,
                path_ids
            FROM fun_get_categories_tree(NULL, TRUE)
        """)
        tree_rows = db.execute(tree_query).mappings().all()
        # Construir árbol: raíz (level=0) -> hijos (level=1) -> nietos (level=2)
        by_id = {r["id"]: dict(r) for r in tree_rows}
        for r in tree_rows:
            r = by_id[r["id"]]
            r["children"] = []
        roots = []
        for r in tree_rows:
            row = by_id[r["id"]]
            if row["parent_id"] is None:
                roots.append(row)
            else:
                parent = by_id.get(row["parent_id"])
                if parent:
                    parent.setdefault("children", []).append(row)
        categories_tree = _serialize_tree(roots)

        # Rango de precios desde combinaciones activas
        precios_query = text("""
            SELECT MIN(c.price) AS precio_minimo, MAX(c.price) AS precio_maximo
            FROM tab_product_variant_combinations c
            JOIN tab_product_variant_groups g ON g.id = c.group_id
            JOIN tab_products p ON p.id = g.product_id
            WHERE c.is_active = TRUE AND p.is_active = TRUE
        """)
        precios = db.execute(precios_query).mappings().first()
        price_range = {
            "minimo": float(precios["precio_minimo"]) if precios and precios["precio_minimo"] is not None else 0,
            "maximo": float(precios["precio_maximo"]) if precios and precios["precio_maximo"] is not None else 0,
        } if precios else {"minimo": 0, "maximo": 0}

        # Atributos solo para la categoría seleccionada; en JSONB la clave es attribute_id (string)
        attributes = []
        if category_id is not None:
            attrs_query = text("""
                SELECT a.id AS attribute_id, a.name AS attribute_name
                FROM tab_attributes a
                JOIN tab_category_attributes ca ON ca.attribute_id = a.id
                WHERE ca.category_id = :category_id AND ca.is_filterable = TRUE
                GROUP BY a.id, a.name
                ORDER BY a.name
            """)
            attrs = db.execute(attrs_query, {"category_id": category_id}).mappings().all()
            color_attr_id = _get_color_attribute_id(db)
            for a in attrs:
                attr_id = int(a["attribute_id"])
                attr_name = (a["attribute_name"] or "").strip().lower()
                raw_values = []
                # Color (atributo dominante) está en tab_product_variant_groups.dominant_value, no en combinations.attributes
                if attr_name == "color" and color_attr_id is not None and attr_id == color_attr_id:
                    dom_query = text("""
                        SELECT DISTINCT g.dominant_value AS value_text
                        FROM tab_product_variant_groups g
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE g.is_active = TRUE AND p.is_active = TRUE AND p.category_id = :category_id
                          AND (g.dominant_value) IS NOT NULL AND trim(COALESCE(g.dominant_value, '')) != ''
                          AND LOWER(TRIM(g.dominant_value)) != 'sin color'
                        ORDER BY value_text
                    """)
                    raw_values = [
                        str(r["value_text"]) for r in db.execute(dom_query, {"category_id": category_id}).mappings().all()
                        if r.get("value_text")
                    ]
                else:
                    attr_key = str(attr_id)
                    values_query = text("""
                        SELECT DISTINCT c.attributes->>:attr_key AS value_text
                        FROM tab_product_variant_combinations c
                        JOIN tab_product_variant_groups g ON g.id = c.group_id
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE c.is_active = TRUE AND p.is_active = TRUE AND p.category_id = :category_id
                          AND (c.attributes->>:attr_key) IS NOT NULL AND trim(COALESCE(c.attributes->>:attr_key, '')) != ''
                        ORDER BY value_text
                    """)
                    raw_values = [
                        str(r["value_text"]) for r in db.execute(values_query, {"attr_key": attr_key, "category_id": category_id}).mappings().all()
                        if r.get("value_text")
                    ]
                # Resolver value_id -> texto (tab_attribute_values) para no mostrar "5", "6", "8" en la UI
                display_values = sorted(
                    {_resolve_filter_value_display(db, attr_id, v) for v in raw_values},
                    key=str.casefold,
                )
                attributes.append({
                    "id": attr_id,
                    "name": a["attribute_name"],
                    "values": display_values,
                })

        marcas_query = text("SELECT id_marca, nom_marca FROM tab_marcas WHERE ind_activo = TRUE ORDER BY nom_marca")
        marcas = [dict(m) for m in db.execute(marcas_query).mappings().all()]

        # Lista plana de categorías (compatibilidad con frontend que usa categorias[])
        def flatten_tree(nodes, out):
            for n in nodes:
                out.append({"id": n["id"], "name": n["name"]})
                if n.get("children"):
                    flatten_tree(n["children"], out)
        categorias_flat = []
        flatten_tree(categories_tree, categorias_flat)

        return {
            "categories_tree": categories_tree,
            "price_range": price_range,
            "precio_rango": price_range,
            "attributes": attributes,
            "marcas": marcas,
            "categorias": categorias_flat,
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener opciones de filtro: {str(e)}")


def _serialize_tree(nodes):
    """Convierte nodos del árbol a dicts serializables (id, name, slug, parent_id, children)."""
    out = []
    for n in nodes:
        node = {"id": n.get("id"), "name": n.get("name"), "slug": n.get("slug"), "parent_id": n.get("parent_id")}
        if n.get("children"):
            node["children"] = _serialize_tree(n["children"])
        else:
            node["children"] = []
        out.append(node)
    return out


def get_filter_options_admin(db: Session) -> dict:
    """
    Opciones de filtro para admin (tab_categories, tab_marcas, tab_proveedores, precios desde tab_product_variant_combinations).
    """
    try:
        categorias_query = text("""
            SELECT id, name AS nom_categoria, parent_id FROM tab_categories ORDER BY name
        """)
        categorias = db.execute(categorias_query).mappings().all()

        marcas_query = text("""
            SELECT id_marca, nom_marca FROM tab_marcas ORDER BY nom_marca
        """)
        marcas = db.execute(marcas_query).mappings().all()

        proveedores_query = text("""
            SELECT id_proveedor, nom_proveedor FROM tab_proveedores ORDER BY nom_proveedor
        """)
        proveedores = db.execute(proveedores_query).mappings().all()

        precios_query = text("""
            SELECT MIN(price) AS precio_minimo, MAX(price) AS precio_maximo
            FROM tab_product_variant_combinations WHERE is_active = TRUE
        """)
        precios = db.execute(precios_query).mappings().first()

        return {
            "categorias": [dict(c) for c in categorias],
            "marcas": [dict(m) for m in marcas],
            "proveedores": [dict(p) for p in proveedores],
            "precio_rango": {
                "minimo": float(precios["precio_minimo"]) if precios and precios["precio_minimo"] is not None else 0,
                "maximo": float(precios["precio_maximo"]) if precios and precios["precio_maximo"] is not None else 0,
            } if precios else {"minimo": 0, "maximo": 0},
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener opciones de filtro admin: {str(e)}")