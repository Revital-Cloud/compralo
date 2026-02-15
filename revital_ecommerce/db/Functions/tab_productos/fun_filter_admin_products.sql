/*
 * Lista todos los productos (activos e inactivos) para el panel de administración.
 * Usa products, product_variants, categories, tab_marcas, product_images.
 */
CREATE OR REPLACE FUNCTION fun_get_all_products_admin(
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
    img_principal VARCHAR,
    precio_min DECIMAL,
    stock_total BIGINT,
    nom_marca VARCHAR,
    fec_insert TIMESTAMP WITHOUT TIME ZONE,
    ind_activo_producto BOOLEAN,
    ind_activo_categoria BOOLEAN,
    ind_activo_marca BOOLEAN,
    total_registros BIGINT
) AS $$
BEGIN
    IF p_limit > 1000 THEN p_limit := 1000; END IF;
    IF p_offset < 0 THEN p_offset := 0; END IF;
    IF UPPER(p_orden) NOT IN ('ASC', 'DESC') THEN p_orden := 'ASC'; END IF;
    IF p_ordenar_por NOT IN ('precio', 'nombre', 'stock', 'fecha', 'categoria', 'marca') THEN
        p_ordenar_por := 'nombre';
    END IF;

    RETURN QUERY
    WITH agg AS (
        SELECT
            p.id AS product_id,
            p.category_id,
            c.name AS nom_categoria,
            p.name AS nom_producto,
            p.slug AS slug_producto,
            p.description,
            (SELECT pi.image_url FROM tab_product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS img_principal,
            (SELECT MIN(pv.price) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS precio_min,
            (SELECT COALESCE(SUM(pv.stock), 0) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS stock_total,
            m.nom_marca,
            p.fec_insert,
            p.is_active AS ind_activo_producto,
            c.is_active AS ind_activo_categoria,
            m.ind_activo AS ind_activo_marca
        FROM tab_products p
        JOIN tab_categories c ON c.id = p.category_id
        LEFT JOIN tab_marcas m ON m.id_marca = p.id_marca
    ),
    total AS (SELECT COUNT(*) AS n FROM agg)
    SELECT
        a.product_id,
        a.category_id,
        a.nom_categoria,
        a.nom_producto,
        a.slug_producto,
        a.description,
        a.img_principal,
        a.precio_min,
        a.stock_total::BIGINT,
        a.nom_marca,
        a.fec_insert,
        a.ind_activo_producto,
        a.ind_activo_categoria,
        a.ind_activo_marca,
        (SELECT n FROM total)
    FROM agg a
    ORDER BY
        CASE WHEN p_ordenar_por = 'precio' AND UPPER(p_orden) = 'ASC' THEN a.precio_min END ASC NULLS LAST,
        CASE WHEN p_ordenar_por = 'precio' AND UPPER(p_orden) = 'DESC' THEN a.precio_min END DESC NULLS LAST,
        CASE WHEN p_ordenar_por = 'nombre' AND UPPER(p_orden) = 'ASC' THEN a.nom_producto END ASC,
        CASE WHEN p_ordenar_por = 'nombre' AND UPPER(p_orden) = 'DESC' THEN a.nom_producto END DESC,
        CASE WHEN p_ordenar_por = 'stock' AND UPPER(p_orden) = 'ASC' THEN a.stock_total END ASC NULLS LAST,
        CASE WHEN p_ordenar_por = 'stock' AND UPPER(p_orden) = 'DESC' THEN a.stock_total END DESC NULLS LAST,
        CASE WHEN p_ordenar_por = 'fecha' AND UPPER(p_orden) = 'ASC' THEN a.fec_insert END ASC NULLS LAST,
        CASE WHEN p_ordenar_por = 'fecha' AND UPPER(p_orden) = 'DESC' THEN a.fec_insert END DESC NULLS LAST,
        CASE WHEN p_ordenar_por = 'categoria' AND UPPER(p_orden) = 'ASC' THEN a.nom_categoria END ASC,
        CASE WHEN p_ordenar_por = 'categoria' AND UPPER(p_orden) = 'DESC' THEN a.nom_categoria END DESC,
        CASE WHEN p_ordenar_por = 'marca' AND UPPER(p_orden) = 'ASC' THEN a.nom_marca END ASC NULLS LAST,
        CASE WHEN p_ordenar_por = 'marca' AND UPPER(p_orden) = 'DESC' THEN a.nom_marca END DESC NULLS LAST,
        a.product_id
    LIMIT p_limit OFFSET p_offset;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en obtención de productos para admin: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
