/*
 * Filtra productos por categoría (opcionalmente con subcategorías), marca, nombre, precio, stock.
 * Usa products, product_variants, categories. total_registros para paginación.
 * Búsqueda por nombre insensible a tildes (unaccent): "jose" encuentra "José".
 * Requiere extensión unaccent para búsqueda sin tildes (ejecutar una vez como superuser):
 *   CREATE EXTENSION IF NOT EXISTS unaccent;
 *
 * Si cambias el tipo de retorno (ej. añadir precio_max), ejecuta antes:
 *   DROP FUNCTION IF EXISTS fun_filter_products(numeric,boolean,numeric,varchar,numeric,numeric,boolean,varchar,varchar,integer,integer);
 */
DROP FUNCTION IF EXISTS fun_filter_products(numeric, boolean, numeric, character varying, numeric, numeric, boolean, character varying, character varying, integer, integer);

CREATE OR REPLACE FUNCTION fun_filter_products(
    p_category_id DECIMAL DEFAULT NULL,
    p_include_subcategories BOOLEAN DEFAULT FALSE,
    p_id_marca DECIMAL DEFAULT NULL,
    p_nombre_producto VARCHAR DEFAULT NULL,
    p_precio_min DECIMAL DEFAULT NULL,
    p_precio_max DECIMAL DEFAULT NULL,
    p_solo_con_stock BOOLEAN DEFAULT FALSE,
    p_ordenar_por VARCHAR(20) DEFAULT 'nombre',
    p_orden VARCHAR(4) DEFAULT 'ASC',
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    product_id DECIMAL,
    category_id DECIMAL,
    nom_categoria VARCHAR,
    nom_producto VARCHAR,
    slug_producto VARCHAR,
    description TEXT,
    id_marca DECIMAL,
    precio_min DECIMAL,
    precio_max DECIMAL,
    stock_total BIGINT,
    img_principal VARCHAR,
    total_registros BIGINT
) AS $$
BEGIN
    IF p_limit > 1000 THEN p_limit := 1000; END IF;
    IF p_offset < 0 THEN p_offset := 0; END IF;
    IF UPPER(p_orden) NOT IN ('ASC', 'DESC') THEN p_orden := 'ASC'; END IF;
    IF p_ordenar_por NOT IN ('precio', 'nombre', 'stock', 'fecha') THEN p_ordenar_por := 'nombre'; END IF;

    RETURN QUERY
    WITH RECURSIVE tree AS (
        SELECT id FROM tab_categories WHERE id = COALESCE(p_category_id, 0)
        UNION ALL
        SELECT c.id FROM tab_categories c INNER JOIN tree t ON c.parent_id = t.id
    ),
    category_ids AS (
        SELECT id FROM tab_categories WHERE is_active = TRUE
        AND (
            p_category_id IS NULL
            OR (p_category_id IS NOT NULL AND NOT p_include_subcategories AND id = p_category_id)
            OR (p_category_id IS NOT NULL AND p_include_subcategories AND id IN (SELECT id FROM tree))
        )
    ),
    agg AS (
        SELECT
            p.id AS product_id,
            p.category_id,
            c.name AS nom_categoria,
            p.name AS nom_producto,
            p.slug AS slug_producto,
            p.description,
            p.id_marca,
            (SELECT MIN(c.price) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id AND c.is_active = TRUE) AS precio_min,
            (SELECT MAX(c.price) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id AND c.is_active = TRUE) AS precio_max,
            (SELECT COALESCE(SUM(c.stock), 0) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id AND c.is_active = TRUE) AS stock_total,
            (SELECT pvi.image_url FROM tab_product_variant_images pvi JOIN tab_product_variant_groups g ON g.id = pvi.variant_group_id WHERE g.product_id = p.id ORDER BY g.id, pvi.sort_order, pvi.id LIMIT 1) AS img_principal
        FROM tab_products p
        JOIN tab_categories c ON c.id = p.category_id
        WHERE p.is_active = TRUE
        AND p.category_id IN (SELECT id FROM category_ids)
        AND (p_id_marca IS NULL OR p.id_marca = p_id_marca)
        AND (p_nombre_producto IS NULL OR trim(p_nombre_producto) = '' OR unaccent(lower(p.name)) LIKE '%' || unaccent(lower(trim(p_nombre_producto))) || '%')
    ),
    filt AS (
        SELECT 
            agg.product_id,
            agg.category_id,
            agg.nom_categoria,
            agg.nom_producto,
            agg.slug_producto,
            agg.description,
            agg.id_marca,
            agg.precio_min,
            agg.precio_max,
            agg.stock_total,
            agg.img_principal
        FROM agg
        WHERE (p_precio_min IS NULL OR agg.precio_min >= p_precio_min)
        AND (p_precio_max IS NULL OR agg.precio_min <= p_precio_max)
        AND (NOT p_solo_con_stock OR (agg.stock_total > 0))
    ),
    total AS (SELECT COUNT(1) AS n FROM filt)
    SELECT
        f.product_id,
        f.category_id,
        f.nom_categoria,
        f.nom_producto,
        f.slug_producto,
        f.description,
        f.id_marca,
        f.precio_min,
        f.precio_max,
        f.stock_total::BIGINT,
        f.img_principal,
        (SELECT n FROM total)
    FROM filt f
    ORDER BY
        CASE WHEN p_ordenar_por = 'precio' AND UPPER(p_orden) = 'ASC' THEN f.precio_min END ASC NULLS LAST,
        CASE WHEN p_ordenar_por = 'precio' AND UPPER(p_orden) = 'DESC' THEN f.precio_min END DESC NULLS LAST,
        CASE WHEN p_ordenar_por = 'nombre' AND UPPER(p_orden) = 'ASC' THEN f.nom_producto END ASC,
        CASE WHEN p_ordenar_por = 'nombre' AND UPPER(p_orden) = 'DESC' THEN f.nom_producto END DESC,
        CASE WHEN p_ordenar_por = 'stock' AND UPPER(p_orden) = 'ASC' THEN f.stock_total END ASC NULLS LAST,
        CASE WHEN p_ordenar_por = 'stock' AND UPPER(p_orden) = 'DESC' THEN f.stock_total END DESC NULLS LAST,
        f.product_id
    LIMIT p_limit OFFSET p_offset;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en filtrado de productos: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
