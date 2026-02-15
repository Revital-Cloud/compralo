/*
 * Lista productos con categoría, precio mínimo, stock total e imagen principal.
 * Usa products, product_variants, product_images, categories.
 */
CREATE OR REPLACE FUNCTION fun_get_productos()
RETURNS TABLE (
    product_id DECIMAL,
    category_id DECIMAL,
    nom_categoria VARCHAR,
    nom_producto VARCHAR,
    slug_producto VARCHAR,
    description TEXT,
    id_marca DECIMAL,
    is_active BOOLEAN,
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
        p.is_active,
        (SELECT MIN(pv.price) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS precio_min,
        (SELECT COALESCE(SUM(pv.stock), 0) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS stock_total,
        (SELECT pi.image_url FROM tab_product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS img_principal
    FROM tab_products p
    JOIN tab_categories c ON c.id = p.category_id
    ORDER BY p.id;
END;
$$ LANGUAGE plpgsql;
