/*
 * Filtra productos por categoría (opcionalmente con subcategorías), marca, nombre, precio, stock.
 * Usa products, product_variants, categories. total_registros para paginación.
 */
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
            (SELECT MIN(pv.price) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS precio_min,
            (SELECT COALESCE(SUM(pv.stock), 0) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS stock_total,
            (SELECT pi.image_url FROM tab_product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS img_principal
        FROM tab_products p
        JOIN tab_categories c ON c.id = p.category_id
        WHERE p.is_active = TRUE
        AND p.category_id IN (SELECT id FROM category_ids)
        AND (p_id_marca IS NULL OR p.id_marca = p_id_marca)
        AND (p_nombre_producto IS NULL OR trim(p_nombre_producto) = '' OR UPPER(p.name) LIKE '%' || UPPER(trim(p_nombre_producto)) || '%')
    ),
    filt AS (
        SELECT agg.*
        FROM agg
        WHERE (p_precio_min IS NULL OR agg.precio_min >= p_precio_min)
        AND (p_precio_max IS NULL OR agg.precio_min <= p_precio_max)
        AND (NOT p_solo_con_stock OR (agg.stock_total > 0))
    ),
    total AS (SELECT COUNT(*) AS n FROM filt)
    SELECT
        f.product_id,
        f.category_id,
        f.nom_categoria,
        f.nom_producto,
        f.slug_producto,
        f.description,
        f.id_marca,
        f.precio_min,
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
