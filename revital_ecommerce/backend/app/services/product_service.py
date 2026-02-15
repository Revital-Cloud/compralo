"""
Módulo de Servicios de Producto.

Este módulo contiene la lógica de negocio para gestionar los productos.
Se encarga de interactuar con la base de datos para realizar operaciones
CRUD (Crear, Leer, Actualizar, Eliminar) sobre los productos, utilizando
funciones de base de datos (procedimientos almacenados o funciones SQL).

Las funciones aquí definidas son llamadas por los routers de la API
y utilizan los esquemas Pydantic para la validación y transformación de datos.
"""
# Lógica de negocio 
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import UploadFile
from typing import List, Optional
import json
import re
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
# No necesitamos importar el schema Product aquí si solo devolvemos mappings
# y el router se encarga de la validación con el response_model.

MAX_IMAGES_PER_VARIANT = 10


def _resolve_attribute_value_id(db: Session, attr_id: int, val) -> tuple:
    """If val is int and exists in tab_attribute_values for attr_id, return (value_id, value_text); else (None, None)."""
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


def _get_images_for_product_or_variant(
    db: Session, product_id: Decimal, variant_id: Optional[Decimal] = None
) -> List[dict]:
    """
    Obtiene imágenes: si variant_id está definido, primero intenta imágenes de la variante;
    si no hay, fallback a imágenes del producto (variant_id IS NULL).
    Siempre devuelve lista ordenada por sort_order, id con { image_url, is_main, sort_order }.
    """
    if variant_id is not None:
        rows = db.execute(
            text("""
                SELECT image_url, is_main, sort_order
                FROM tab_product_images
                WHERE variant_id = :vid
                ORDER BY sort_order, id
            """),
            {"vid": variant_id},
        ).mappings().all()
        if rows:
            return [{"image_url": r["image_url"], "is_main": bool(r.get("is_main")), "sort_order": int(r.get("sort_order") or 0)} for r in rows]
    rows = db.execute(
        text("""
            SELECT image_url, is_main, sort_order
            FROM tab_product_images
            WHERE product_id = :pid AND variant_id IS NULL
            ORDER BY sort_order, id
        """),
        {"pid": product_id},
    ).mappings().all()
    return [{"image_url": r["image_url"], "is_main": bool(r.get("is_main")), "sort_order": int(r.get("sort_order") or 0)} for r in rows]


# Productos para admin (tab_products + tab_product_variants; usa fun_get_all_products_admin)
def get_products_admin(db: Session, params: dict):
    """
    Obtiene todos los productos para el panel de administración usando
    fun_get_all_products_admin (tab_products, tab_product_variants, tab_categories, tab_marcas).
    Filtros por search, category_id, id_marca se aplican en Python (la función DB no los tiene).
    """
    try:
        params = params or {}
        ordenar_por = params.get('ordenar_por', 'nombre')
        orden = params.get('orden', 'ASC')
        limit = params.get('limit', 50)
        offset = params.get('offset', 0)
        search = params.get('search')
        category_id_param = params.get('category_id') or params.get('id_categoria')
        id_marca = params.get('id_marca')

        limit_val = min(int(limit), 1000)
        offset_val = max(0, int(offset))
        has_filters = (search and search.strip()) or (category_id_param is not None)
        if has_filters:
            # Con filtros: traer hasta 1000, filtrar en app y paginar
            fetch_limit, fetch_offset = 1000, 0
        else:
            fetch_limit, fetch_offset = limit_val, offset_val

        query = text("""
            SELECT * FROM fun_get_all_products_admin(
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

        if search and search.strip():
            search_lower = search.strip().lower()
            rows = [r for r in rows if (r.get("nom_producto") or "").lower().find(search_lower) >= 0]
        if category_id_param is not None:
            rows = [r for r in rows if r.get("category_id") is not None and int(r.get("category_id")) == int(category_id_param)]

        total_filtered = len(rows)
        if has_filters:
            rows = rows[offset_val : offset_val + limit_val]

        out = []
        for r in rows:
            out.append({
                "category_id": str(r.get("category_id") or ""),
                "id": str(r.get("product_id") or ""),
                "category_name": (r.get("nom_categoria") or "") or "",
                "name": (r.get("nom_producto") or "") or "",
                "description": r.get("description"),
                "slug_producto": r.get("slug_producto"),
                "image_url": r.get("img_principal"),
                "price_min": str(r.get("precio_min") or "0"),
                "stock_total": int(r.get("stock_total") or 0),
                "id_marca": str(r.get("id_marca") or "") if r.get("id_marca") is not None else "",
                "nom_marca": (r.get("nom_marca") or "") or "",
                "fec_insert": str(r.get("fec_insert") or ""),
                "is_active": bool(r.get("ind_activo_producto", True)),
                "ind_activo_categoria": bool(r.get("ind_activo_categoria", True)),
                "ind_activo_marca": bool(r.get("ind_activo_marca", True)),
                "total_registros": total_filtered,
            })
        return out
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos para admin: {str(e)}")

def get_products(db: Session):
    """
    Obtiene todos los productos activos (tab_products + tab_product_variants).
    Usa fun_get_productos_activos y ratings desde tab_comentarios por product_id.
    """
    try:
        products_query = text("SELECT * FROM fun_get_productos_activos()")
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
                p.is_active AS ind_activo,
                p.usr_insert,
                p.fec_insert,
                p.usr_update,
                p.fec_update,
                c.name AS nom_categoria,
                (SELECT MIN(pv.price) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS val_precio,
                (SELECT COALESCE(SUM(pv.stock), 0) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS num_stock,
                (SELECT pi.image_url FROM tab_product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL AND pi.is_main = TRUE LIMIT 1) AS img_principal,
                m.nom_marca
            FROM tab_products p
            JOIN tab_categories c ON c.id = p.category_id
            LEFT JOIN tab_marcas m ON m.id_marca = p.id_marca
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
    Obtiene un producto por tab_products.id con categoría, precio mínimo, stock, imágenes (producto + por variante), variantes y rating.
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
                p.is_active AS ind_activo,
                p.usr_insert,
                p.fec_insert,
                p.usr_update,
                p.fec_update,
                c.name AS nom_categoria,
                (SELECT MIN(pv.price) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS val_precio,
                (SELECT COALESCE(SUM(pv.stock), 0) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS num_stock,
                (SELECT pi.image_url FROM tab_product_images pi WHERE pi.product_id = p.id AND pi.variant_id IS NULL AND pi.is_main = TRUE LIMIT 1) AS img_principal,
                m.nom_marca
            FROM tab_products p
            JOIN tab_categories c ON c.id = p.category_id
            LEFT JOIN tab_marcas m ON m.id_marca = p.id_marca
            WHERE p.id = :product_id
        """)
        row = db.execute(query, {"product_id": product_id}).mappings().first()
        if row is None:
            return None
        result = _row_to_product_dict(db, row)
        result["num_stock"] = result.get("stock_total", 0)
        # Imágenes del producto (variant_id IS NULL)
        prod_img_rows = db.execute(
            text("""
                SELECT image_url, is_main, sort_order FROM tab_product_images
                WHERE product_id = :pid AND variant_id IS NULL
                ORDER BY sort_order, id
            """),
            {"pid": product_id},
        ).mappings().all()
        img_built = _build_product_images_dict([dict(r) for r in prod_img_rows])
        result["image_url"] = img_built.get("main") if img_built else result.get("image_url")
        # Orden: imagen principal primero, luego galería (para thumbnails y flechas en la ficha)
        main_list = [img_built["main"]] if img_built.get("main") else []
        gallery_list = img_built.get("gallery") or []
        img_urls = main_list + gallery_list
        result["images"] = [{"image_url": u, "is_main": (u == (img_built.get("main") if img_built else None)), "sort_order": i} for i, u in enumerate(img_urls)]
        if not result["images"] and result.get("image_url"):
            result["images"] = [{"image_url": result["image_url"], "is_main": True, "sort_order": 0}]
        # Variantes activas
        variant_rows = db.execute(
            text("""
                SELECT id, sku, price, stock, is_active
                FROM tab_product_variants WHERE product_id = :pid AND is_active = TRUE
                ORDER BY id
            """),
            {"pid": product_id},
        ).mappings().all()
        result["variants"] = [
            {
                "id": int(v["id"]),
                "sku": v.get("sku"),
                "price": float(v["price"]) if v.get("price") is not None else 0,
                "stock": int(v.get("stock") or 0),
                "is_active": bool(v.get("is_active", True)),
            }
            for v in variant_rows
        ]
        # Imágenes por variante (variant_id IS NOT NULL)
        var_img_rows = db.execute(
            text("""
                SELECT variant_id, image_url, is_main, sort_order FROM tab_product_images
                WHERE product_id = :pid AND variant_id IS NOT NULL
                ORDER BY variant_id, sort_order, id
            """),
            {"pid": product_id},
        ).mappings().all()
        images_by_variant = {}
        for r in var_img_rows:
            vid = str(int(r["variant_id"]))
            if vid not in images_by_variant:
                images_by_variant[vid] = []
            images_by_variant[vid].append({
                "image_url": r["image_url"],
                "is_main": bool(r.get("is_main")),
                "sort_order": int(r.get("sort_order") or 0),
            })
        result["images_by_variant"] = images_by_variant
        # Atributos de variantes (tab_product_variant_attributes) para variant_options (colores/tallas)
        pva_rows = db.execute(
            text("""
                SELECT pva.variant_id, pva.attribute_id, a.name AS attribute_name,
                       pva.value_text, pva.value_number, pva.value_boolean,
                       pva.attribute_value_id, av.value AS attr_value, av.hex_color
                FROM tab_product_variant_attributes pva
                JOIN tab_attributes a ON a.id = pva.attribute_id
                LEFT JOIN tab_attribute_values av ON av.id = pva.attribute_value_id
                JOIN tab_product_variants pv ON pv.id = pva.variant_id
                WHERE pv.product_id = :pid AND pv.is_active = TRUE
            """),
            {"pid": product_id},
        ).mappings().all()
        colors_seen = {}
        sizes_set = set()
        variant_attrs_by_vid = {}
        variant_color_size = {}  # vid -> { "color": str, "size": str }
        # Por atributo: attribute_id -> attribute_name -> values: [ (value, hex_color, variant_ids) ]
        attributes_by_id = {}  # attribute_id -> { "name": str, "values": { (value, hex_color) -> [variant_ids] } }
        for r in pva_rows:
            vid = int(r["variant_id"])
            aid = int(r["attribute_id"])
            attr_name = (r.get("attribute_name") or "").strip() or f"Atributo {aid}"
            if vid not in variant_attrs_by_vid:
                variant_attrs_by_vid[vid] = {}
            display_val = r.get("attr_value") or r.get("value_text")
            if display_val is None and r.get("value_number") is not None:
                display_val = str(r["value_number"])
            if display_val is None and r.get("value_boolean") is not None:
                display_val = "Sí" if r["value_boolean"] else "No"
            hex_color = r.get("hex_color")
            if vid not in variant_color_size:
                variant_color_size[vid] = {"color": "", "size": ""}
            if hex_color:
                key = (display_val or "", hex_color)
                if key not in colors_seen:
                    colors_seen[key] = {"name": display_val or "", "value": display_val or "", "hex_color": hex_color}
                variant_color_size[vid]["color"] = display_val or ""
            else:
                if display_val:
                    sizes_set.add(display_val)
                prev = variant_color_size[vid]["size"]
                variant_color_size[vid]["size"] = (prev + " / " + display_val).strip() if prev else (display_val or "")
            variant_attrs_by_vid[vid][str(r["attribute_id"])] = {"value": display_val, "hex_color": hex_color}
            if aid not in attributes_by_id:
                attributes_by_id[aid] = {"name": attr_name, "values": {}}
            key_val = (display_val or "", hex_color or "")
            if key_val not in attributes_by_id[aid]["values"]:
                attributes_by_id[aid]["values"][key_val] = []
            attributes_by_id[aid]["values"][key_val].append(vid)
        # Lista de atributos para el frontend: nombre + valores con variant_ids (para filtrado dependiente)
        attributes_list = []
        for aid, data in sorted(attributes_by_id.items()):
            values_with_ids = []
            for (val, hc), vids in data["values"].items():
                values_with_ids.append({
                    "value": val,
                    "hex_color": hc if hc else None,
                    "variant_ids": vids,
                })
            attributes_list.append({
                "attribute_id": aid,
                "attribute_name": data["name"],
                "values": values_with_ids,
            })
        result["variant_options"] = {
            "colors": list(colors_seen.values()),
            "sizes": [{"name": s, "available": True} for s in sorted(sizes_set)] if sizes_set else [],
            "attributes": attributes_list,
        }
        # Enriquecer cada variante con color, size y mapa de atributos (para filtrado dependiente en frontend)
        for v in result["variants"]:
            vid = v["id"]
            cs = variant_color_size.get(vid, {})
            v["color"] = cs.get("color", "")
            v["size"] = cs.get("size", "")
            v["attributes"] = {aid: data["value"] for aid, data in variant_attrs_by_vid.get(vid, {}).items()}
        # Productos con variantes por atributos (Color, Almacenamiento, etc.): la imagen del producto
        # debe ser solo la subida como "imagen principal" (variant_id IS NULL), sin usar la primera variante
        # como fallback, para que en tienda no se muestre un color preseleccionado.
        has_attribute_variants = bool(attributes_list)
        if not has_attribute_variants:
            # Sin atributos: fallback a primera variante si no hay imagen de producto
            if not result.get("image_url") and images_by_variant:
                for vid, imgs in images_by_variant.items():
                    if imgs:
                        sorted_imgs = sorted(imgs, key=lambda x: (x.get("sort_order") or 0))
                        main_img = next((i for i in sorted_imgs if i.get("is_main")), sorted_imgs[0])
                        if main_img.get("image_url"):
                            result["image_url"] = main_img["image_url"]
                            break
            # Galería: si hay pocas imágenes de producto, añadir las de variantes
            if images_by_variant and len(result.get("images") or []) <= 1:
                all_urls = [x.get("image_url") for x in (result.get("images") or []) if x.get("image_url")]
                if result.get("image_url") and result["image_url"] not in all_urls:
                    all_urls.insert(0, result["image_url"])
                for vid in sorted(images_by_variant.keys(), key=lambda x: int(x)):
                    for img in sorted(images_by_variant[vid], key=lambda x: (x.get("sort_order") or 0)):
                        url = img.get("image_url")
                        if url and url not in all_urls:
                            all_urls.append(url)
                if all_urls:
                    result["images"] = [{"image_url": u, "is_main": i == 0, "sort_order": i} for i, u in enumerate(all_urls)]
        # Especificaciones para la sección "Acerca del producto"
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
        "id_proveedor": "",
        "id_marca": str(row.get("id_marca") or ""),
        "nom_proveedor": "",
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
    Devuelve producto + variantes + atributos + image_urls para el formulario de edición (modelo compuesto).
    """
    prod_row = db.execute(text("""
        SELECT id, category_id, name, description, id_marca, is_active
        FROM tab_products WHERE id = :pid
    """), {"pid": product_id}).mappings().first()
    if not prod_row:
        return None
    variants_rows = db.execute(text("""
        SELECT id, sku, price, stock, is_active
        FROM tab_product_variants WHERE product_id = :pid ORDER BY id
    """), {"pid": product_id}).mappings().all()
    attr_rows = db.execute(text("""
        SELECT pva.variant_id, pva.attribute_id, a.data_type,
               pva.value_text, pva.value_number, pva.value_boolean,
               pva.attribute_value_id,
               av.value AS attr_value_display, av.hex_color AS attr_hex_color
        FROM tab_product_variant_attributes pva
        JOIN tab_attributes a ON a.id = pva.attribute_id
        LEFT JOIN tab_attribute_values av ON av.id = pva.attribute_value_id
        JOIN tab_product_variants pv ON pv.id = pva.variant_id
        WHERE pv.product_id = :pid
    """), {"pid": product_id}).mappings().all()
    img_rows = db.execute(text("""
        SELECT image_url, is_main, sort_order FROM tab_product_images
        WHERE product_id = :pid AND variant_id IS NULL
        ORDER BY sort_order, id
    """), {"pid": product_id}).mappings().all()
    variant_img_rows = db.execute(text("""
        SELECT variant_id, image_url, is_main, sort_order FROM tab_product_images
        WHERE product_id = :pid AND variant_id IS NOT NULL
        ORDER BY variant_id, sort_order, id
    """), {"pid": product_id}).mappings().all()
    images_by_variant = {}
    for r in variant_img_rows:
        vid = str(int(r["variant_id"]))
        if vid not in images_by_variant:
            images_by_variant[vid] = []
        images_by_variant[vid].append({
            "image_url": r["image_url"],
            "is_main": bool(r.get("is_main")),
            "sort_order": int(r.get("sort_order") or 0),
        })
    attr_by_variant = {}
    for r in attr_rows:
        vid = int(r["variant_id"])
        if vid not in attr_by_variant:
            attr_by_variant[vid] = {}
        aid = int(r["attribute_id"])
        # Predefined value: return attribute_value_id so admin form can preselect
        if r.get("attribute_value_id") is not None:
            attr_by_variant[vid][str(aid)] = int(r["attribute_value_id"])
        else:
            dtype = (r.get("data_type") or "text").lower()
            if dtype == "number":
                val = r.get("value_number")
            elif dtype == "boolean":
                val = r.get("value_boolean")
            else:
                val = r.get("value_text")
            attr_by_variant[vid][str(aid)] = val
    variants = []
    for v in variants_rows:
        vid = int(v["id"])
        attrs = attr_by_variant.get(vid, {})
        variants.append({
            "id": vid,
            "sku": v.get("sku"),
            "price": v.get("price"),
            "stock": int(v.get("stock") or 0),
            "is_active": bool(v.get("is_active", True)),
            "attributes": attrs if attrs else {},
        })
    image_urls = [r["image_url"] for r in img_rows if r.get("image_url")]
    return {
        "product": {
            "name": prod_row["name"],
            "category_id": prod_row["category_id"],
            "id_marca": prod_row["id_marca"],
            "description": prod_row["description"],
            "is_active": bool(prod_row.get("is_active", True)),
        },
        "variants": variants,
        "image_urls": image_urls,
        "images_by_variant": images_by_variant,
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
            next_id = db.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM tab_product_variant_attributes")).scalar()
            for k, v in spcf.items():
                if k in ("description", "color", "Color", "size", "tamaño", "Tamaño") or v is None or (isinstance(v, str) and not v.strip()):
                    continue
                attr_id = r[0] if (r := db.execute(text("SELECT id FROM tab_attributes WHERE name = :n LIMIT 1"), {"n": str(k)}).first()) else (k if isinstance(k, (int, Decimal)) else None)
                if attr_id is not None:
                    db.execute(text("INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, value_text, usr_insert) VALUES (:id, :vid, :aid, :val, :usr)"), {"id": next_id, "vid": variant_id, "aid": attr_id, "val": str(v), "usr": usr_insert})
                    next_id += 1
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


def create_product_composite(db: Session, payload: ProductCreateComposite, usr_insert: Decimal):
    """
    Crea producto + imágenes + variantes + atributos de variante en una sola transacción.
    No hace commit intermedio; rollback en cualquier error.
    """
    try:
        p = payload.product
        # 1) Insertar producto
        q1 = text(
            "SELECT fun_insert_producto(:p_category_id, :p_name, :p_description, :p_id_marca, :p_is_active, :p_usr_operacion)"
        )
        r1 = db.execute(q1, {
            "p_category_id": p.category_id,
            "p_name": p.name,
            "p_description": p.description,
            "p_id_marca": p.id_marca,
            "p_is_active": p.is_active,
            "p_usr_operacion": usr_insert,
        })
        msg = r1.fetchone()[0]
        if not msg or str(msg).strip().upper().startswith("ERROR"):
            raise Exception(str(msg) if msg else "Error al insertar producto")
        product_id = Decimal(str(msg).replace("OK:", "").strip())

        # 2) Imágenes del producto (variant_id NULL)
        for i, url in enumerate(payload.image_urls or []):
            if not (url and str(url).strip()):
                continue
            db.execute(text(
                "SELECT fun_insert_product_image(:pid, :url, :main, :ord, :usr, :variant_id)"
            ), {"pid": product_id, "url": url.strip(), "main": (i == 0), "ord": i, "usr": usr_insert, "variant_id": None})

        # Atributos: obtener data_type por attribute_id
        all_attr_ids = set()
        for v in payload.variants:
            if v.attributes:
                for k in v.attributes:
                    try:
                        all_attr_ids.add(int(k))
                    except (TypeError, ValueError):
                        pass
        attr_types = {}
        if all_attr_ids:
            q_attr = text("SELECT id, data_type FROM tab_attributes WHERE id = ANY(:ids)")
            for row in db.execute(q_attr, {"ids": list(all_attr_ids)}).mappings():
                attr_types[int(row["id"])] = (row["data_type"] or "text").lower()

        # 3) Variantes + variant_attributes
        next_pva_id = db.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM tab_product_variant_attributes")).scalar() or 1
        for v in payload.variants:
            q2 = text(
                "SELECT fun_insert_product_variant(:p_product_id, :p_price, :p_stock, :p_sku, :p_is_active, :p_usr_operacion)"
            )
            r2 = db.execute(q2, {
                "p_product_id": product_id,
                "p_price": v.price,
                "p_stock": v.stock,
                "p_sku": (v.sku and v.sku.strip()) or None,
                "p_is_active": v.is_active,
                "p_usr_operacion": usr_insert,
            })
            vmsg = r2.fetchone()[0]
            if not vmsg or str(vmsg).strip().upper().startswith("ERROR"):
                raise Exception(str(vmsg) if vmsg else "Error al insertar variante")
            variant_id = Decimal(str(vmsg).replace("OK:", "").strip())

            # Imágenes de la variante
            variant_urls = getattr(v, "image_urls", None) or []
            if len(variant_urls) > MAX_IMAGES_PER_VARIANT:
                raise Exception(f"Máximo {MAX_IMAGES_PER_VARIANT} imágenes por variante.")
            main_idx = min(int(getattr(v, "main_index", 0) or 0), max(0, len(variant_urls) - 1))
            for i, url in enumerate(variant_urls):
                if not (url and str(url).strip()):
                    continue
                db.execute(text(
                    "SELECT fun_insert_product_image(:pid, :url, :main, :ord, :usr, :variant_id)"
                ), {"pid": product_id, "url": url.strip(), "main": (i == main_idx), "ord": i, "usr": usr_insert, "variant_id": variant_id})

            if v.attributes:
                for attr_id_str, val in v.attributes.items():
                    if val is None:
                        continue
                    try:
                        attr_id = int(attr_id_str)
                    except (TypeError, ValueError):
                        continue
                    av_id, av_text = _resolve_attribute_value_id(db, attr_id, val)
                    if av_id is not None:
                        db.execute(text("""
                            INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, attribute_value_id, value_text, usr_insert)
                            VALUES (:id, :vid, :aid, :avid, :val, :usr)
                        """), {"id": next_pva_id, "vid": variant_id, "aid": attr_id, "avid": av_id, "val": av_text, "usr": usr_insert})
                    else:
                        dtype = attr_types.get(attr_id, "text")
                        if dtype == "number":
                            db.execute(text("""
                                INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, value_number, usr_insert)
                                VALUES (:id, :vid, :aid, :val, :usr)
                            """), {"id": next_pva_id, "vid": variant_id, "aid": attr_id, "val": Decimal(str(val)) if val != "" else None, "usr": usr_insert})
                        elif dtype == "boolean":
                            bool_val = val in (True, "true", "1", 1, "yes", "sí")
                            db.execute(text("""
                                INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, value_boolean, usr_insert)
                                VALUES (:id, :vid, :aid, :val, :usr)
                            """), {"id": next_pva_id, "vid": variant_id, "aid": attr_id, "val": bool_val, "usr": usr_insert})
                        else:
                            db.execute(text("""
                                INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, value_text, usr_insert)
                                VALUES (:id, :vid, :aid, :val, :usr)
                            """), {"id": next_pva_id, "vid": variant_id, "aid": attr_id, "val": str(val) if val is not None else None, "usr": usr_insert})
                    next_pva_id += 1

        db.commit()
        return f"OK:{product_id}"
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear producto compuesto: {str(e)}")


def update_product_composite(db: Session, product_id: Decimal, payload: ProductCreateComposite, usr_update: Decimal):
    """
    Actualiza producto + imágenes + variantes en una transacción.
    Reemplaza variantes e imágenes por los enviados.
    """
    try:
        p = payload.product
        q_upd = text("""
            SELECT fun_update_producto(
                :p_id, :p_category_id, :p_name, :p_description, :p_id_marca, :p_is_active, :p_usr_operacion
            )
        """)
        r = db.execute(q_upd, {
            "p_id": product_id,
            "p_category_id": p.category_id,
            "p_name": p.name,
            "p_description": p.description,
            "p_id_marca": p.id_marca,
            "p_is_active": p.is_active,
            "p_usr_operacion": usr_update,
        })
        msg = r.fetchone()[0]
        if msg and str(msg).strip().upper().startswith("ERROR"):
            raise Exception(str(msg))

        db.execute(text("DELETE FROM tab_product_images WHERE product_id = :pid"), {"pid": product_id})
        db.execute(text("DELETE FROM tab_product_variant_attributes WHERE variant_id IN (SELECT id FROM tab_product_variants WHERE product_id = :pid)"), {"pid": product_id})
        db.execute(text("DELETE FROM tab_product_variants WHERE product_id = :pid"), {"pid": product_id})

        for i, url in enumerate(payload.image_urls or []):
            if url and str(url).strip():
                db.execute(text("SELECT fun_insert_product_image(:pid, :url, :main, :ord, :usr, :variant_id)"),
                    {"pid": product_id, "url": url.strip(), "main": (i == 0), "ord": i, "usr": usr_update, "variant_id": None})

        all_attr_ids = set()
        for v in payload.variants:
            if v.attributes:
                for k in v.attributes:
                    try:
                        all_attr_ids.add(int(k))
                    except (TypeError, ValueError):
                        pass
        attr_types = {}
        if all_attr_ids:
            for row in db.execute(text("SELECT id, data_type FROM tab_attributes WHERE id = ANY(:ids)"), {"ids": list(all_attr_ids)}).mappings():
                attr_types[int(row["id"])] = (row["data_type"] or "text").lower()

        next_pva_id = db.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM tab_product_variant_attributes")).scalar() or 1
        for v in payload.variants:
            r2 = db.execute(text(
                "SELECT fun_insert_product_variant(:p_product_id, :p_price, :p_stock, :p_sku, :p_is_active, :p_usr_operacion)"
            ), {
                "p_product_id": product_id,
                "p_price": v.price,
                "p_stock": v.stock,
                "p_sku": (v.sku and v.sku.strip()) or None,
                "p_is_active": v.is_active,
                "p_usr_operacion": usr_update,
            })
            vmsg = r2.fetchone()[0]
            if not vmsg or str(vmsg).strip().upper().startswith("ERROR"):
                raise Exception(str(vmsg) if vmsg else "Error al insertar variante")
            variant_id = Decimal(str(vmsg).replace("OK:", "").strip())
            variant_urls = getattr(v, "image_urls", None) or []
            if len(variant_urls) > MAX_IMAGES_PER_VARIANT:
                raise Exception(f"Máximo {MAX_IMAGES_PER_VARIANT} imágenes por variante.")
            main_idx = min(int(getattr(v, "main_index", 0) or 0), max(0, len(variant_urls) - 1))
            for i, url in enumerate(variant_urls):
                if not (url and str(url).strip()):
                    continue
                db.execute(text(
                    "SELECT fun_insert_product_image(:pid, :url, :main, :ord, :usr, :variant_id)"
                ), {"pid": product_id, "url": url.strip(), "main": (i == main_idx), "ord": i, "usr": usr_update, "variant_id": variant_id})
            if v.attributes:
                for attr_id_str, val in v.attributes.items():
                    if val is None:
                        continue
                    try:
                        attr_id = int(attr_id_str)
                    except (TypeError, ValueError):
                        continue
                    av_id, av_text = _resolve_attribute_value_id(db, attr_id, val)
                    if av_id is not None:
                        db.execute(text("""
                            INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, attribute_value_id, value_text, usr_insert)
                            VALUES (:id, :vid, :aid, :avid, :val, :usr)
                        """), {"id": next_pva_id, "vid": variant_id, "aid": attr_id, "avid": av_id, "val": av_text, "usr": usr_update})
                    else:
                        dtype = attr_types.get(attr_id, "text")
                        if dtype == "number":
                            db.execute(text("""
                                INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, value_number, usr_insert)
                                VALUES (:id, :vid, :aid, :val, :usr)
                            """), {"id": next_pva_id, "vid": variant_id, "aid": attr_id, "val": Decimal(str(val)) if val != "" else None, "usr": usr_update})
                        elif dtype == "boolean":
                            bool_val = val in (True, "true", "1", 1, "yes", "sí")
                            db.execute(text("""
                                INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, value_boolean, usr_insert)
                                VALUES (:id, :vid, :aid, :val, :usr)
                            """), {"id": next_pva_id, "vid": variant_id, "aid": attr_id, "val": bool_val, "usr": usr_update})
                        else:
                            db.execute(text("""
                                INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, value_text, usr_insert)
                                VALUES (:id, :vid, :aid, :val, :usr)
                            """), {"id": next_pva_id, "vid": variant_id, "aid": attr_id, "val": str(val) if val is not None else None, "usr": usr_update})
                    next_pva_id += 1
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
    Filtra productos con fun_filter_products (tab_products, tab_product_variants).
    Opcionalmente filtra por atributos (tab_product_variant_attributes) en aplicación.
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
            "p_ordenar_por": filters.ordenar_por,
            "p_orden": filters.orden,
            "p_limit": filters.limit,
            "p_offset": filters.offset,
        }
        query = text("""
            SELECT product_id, category_id, nom_categoria, nom_producto, slug_producto, description,
                   id_marca, precio_min, stock_total, img_principal, total_registros
            FROM fun_filter_products(
                :p_category_id, :p_include_subcategories, :p_id_marca, :p_nombre_producto,
                :p_precio_min, :p_precio_max, :p_solo_con_stock, :p_ordenar_por, :p_orden,
                :p_limit, :p_offset
            )
        """)
        result = db.execute(query, params)
        rows = list(result.mappings().all())

        # Filtro por atributos: productos que tengan variantes con todos los pares (attribute_id, value) indicados
        if getattr(filters, "atributos", None) and filters.atributos:
            product_ids_with_attrs = None
            for (aid, values) in filters.atributos.items():
                if not values:
                    continue
                q = text("""
                    SELECT DISTINCT pv.product_id
                    FROM tab_product_variant_attributes pva
                    JOIN tab_product_variants pv ON pv.id = pva.variant_id
                    JOIN tab_products p ON p.id = pv.product_id
                    WHERE pva.attribute_id = :aid AND pv.is_active = TRUE AND p.is_active = TRUE
                      AND pva.value_text = ANY(:vals)
                """)
                r = db.execute(q, {"aid": int(aid), "vals": list(values)})
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
        db.rollback()
        raise Exception(f"Error al filtrar productos: {str(e)}")

def get_filter_stats(db: Session, filters: ProductFilterParams) -> ProductFilterStats:
    """
    Estadísticas de productos que coinciden con los filtros (tab_products + tab_product_variants).
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
            "p_ordenar_por": "nombre",
            "p_orden": "ASC",
            "p_limit": 10000,
            "p_offset": 0,
        }
        query = text("""
            SELECT product_id, category_id, nom_categoria, id_marca, precio_min, stock_total, total_registros
            FROM fun_filter_products(
                :p_category_id, :p_include_subcategories, :p_id_marca, :p_nombre_producto,
                :p_precio_min, :p_precio_max, :p_solo_con_stock, :p_ordenar_por, :p_orden,
                :p_limit, :p_offset
            )
        """)
        result = db.execute(query, params)
        rows = list(result.mappings().all())
        if getattr(filters, "atributos", None) and filters.atributos:
            product_ids_with_attrs = None
            for (aid, values) in filters.atributos.items():
                if not values:
                    continue
                q = text("""
                    SELECT DISTINCT pv.product_id FROM tab_product_variant_attributes pva
                    JOIN tab_product_variants pv ON pv.id = pva.variant_id
                    JOIN tab_products p ON p.id = pv.product_id
                    WHERE pva.attribute_id = :aid AND pv.is_active = TRUE AND p.is_active = TRUE
                      AND pva.value_text = ANY(:vals)
                """)
                r = db.execute(q, {"aid": int(aid), "vals": list(values)})
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
        db.rollback()
        raise Exception(f"Error al obtener estadísticas de filtros: {str(e)}")

def get_filter_options(db: Session) -> dict:
    """
    Opciones de filtro para tienda: árbol de categorías (tab_categories), precio (variantes),
    atributos dinámicos (tab_attributes + tab_category_attributes is_filterable + valores desde tab_product_variant_attributes).
    Estructura: categories_tree, price_range, attributes (id, name, values), marcas.
    """
    try:
        # Árbol de categorías (solo activas): lista con id, name, slug, parent_id, level, children opcional
        tree_query = text("SELECT * FROM fun_get_categories_tree(NULL, TRUE)")
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

        # Rango de precios desde variantes activas
        precios_query = text("""
            SELECT MIN(price) AS precio_minimo, MAX(price) AS precio_maximo
            FROM tab_product_variants pv
            JOIN tab_products p ON p.id = pv.product_id
            WHERE pv.is_active = TRUE AND p.is_active = TRUE
        """)
        precios = db.execute(precios_query).mappings().first()
        price_range = {
            "minimo": float(precios["precio_minimo"]) if precios and precios["precio_minimo"] is not None else 0,
            "maximo": float(precios["precio_maximo"]) if precios and precios["precio_maximo"] is not None else 0,
        } if precios else {"minimo": 0, "maximo": 0}

        # Atributos filtrables: tab_category_attributes.is_filterable + distinct value_text
        attrs_query = text("""
            SELECT a.id AS attribute_id, a.name AS attribute_name
            FROM tab_attributes a
            JOIN tab_category_attributes ca ON ca.attribute_id = a.id
            WHERE ca.is_filterable = TRUE
            GROUP BY a.id, a.name
            ORDER BY a.name
        """)
        attrs = db.execute(attrs_query).mappings().all()
        attributes = []
        for a in attrs:
            values_query = text("""
                SELECT DISTINCT pva.value_text
                FROM tab_product_variant_attributes pva
                JOIN tab_product_variants pv ON pv.id = pva.variant_id
                JOIN tab_products p ON p.id = pv.product_id
                WHERE pva.attribute_id = :aid AND pva.value_text IS NOT NULL AND trim(pva.value_text) != ''
                  AND pv.is_active = TRUE AND p.is_active = TRUE
                ORDER BY pva.value_text
            """)
            values = [r["value_text"] for r in db.execute(values_query, {"aid": a["attribute_id"]}).mappings().all()]
            attributes.append({
                "id": int(a["attribute_id"]),
                "name": a["attribute_name"],
                "values": values,
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
    Opciones de filtro para admin (tab_categories, tab_marcas, tab_proveedores, precios desde tab_product_variants).
    """
    try:
        categorias_query = text("""
            SELECT id, name AS nom_categoria FROM tab_categories ORDER BY name
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
            FROM tab_product_variants WHERE is_active = TRUE
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