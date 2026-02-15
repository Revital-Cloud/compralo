/*
 * Lista solo productos activos (is_active = TRUE) con categoría, precio mínimo, stock e imagen.
 */
CREATE OR REPLACE FUNCTION fun_get_productos_activos()
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
    img_principal VARCHAR
) AS $$
BEGIN
    RETURN QUERY
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
    ORDER BY p.id;
END;
$$ LANGUAGE plpgsql;
