/*
 * Lista productos con categoría, precio mínimo, stock total e imagen principal.
 * Usa tab_products, variant_combinations/groups, variant_images, tab_categories.
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
        (SELECT MIN(c.price) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id AND c.is_active = TRUE) AS precio_min,
        (SELECT COALESCE(SUM(c.stock), 0) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id AND c.is_active = TRUE) AS stock_total,
        COALESCE(
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
        ) AS img_principal
    FROM tab_products p
    JOIN tab_categories c ON c.id = p.category_id
    ORDER BY p.id;
END;
$$ LANGUAGE plpgsql;
