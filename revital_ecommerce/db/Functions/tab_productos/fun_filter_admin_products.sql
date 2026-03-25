/*
 * Lista todos los productos (activos e inactivos) para el panel de administración.
 * Usa tab_products, variant_combinations/groups, variant_images, tab_categories, tab_marcas.
 *
 * Si la función ya existe y cambias el tipo de retorno (ej. añadir precio_max),
 * PostgreSQL exige DROP antes de CREATE. Ejecuta primero:
 *   DROP FUNCTION IF EXISTS fun_get_all_products_admin(varchar, varchar, int, int);
 */
DROP FUNCTION IF EXISTS fun_get_all_products_admin(varchar, varchar, int, int);

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
    precio_max DECIMAL,
    stock_total BIGINT,
    id_marca DECIMAL,
    nom_marca VARCHAR,
    id_proveedor DECIMAL,
    nom_proveedor VARCHAR,
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
            ) AS img_principal,
            -- Para admin: mostrar precio y stock incluso si las variantes están inactivas
            (SELECT MIN(c.price) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id) AS precio_min,
            (SELECT MAX(c.price) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id) AS precio_max,
            (SELECT COALESCE(SUM(c.stock), 0) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id) AS stock_total,
            p.id_marca,
            m.nom_marca,
            p.id_proveedor,
            pr.nom_proveedor,
            p.fec_insert,
            p.is_active AS ind_activo_producto,
            c.is_active AS ind_activo_categoria,
            m.ind_activo AS ind_activo_marca
        FROM tab_products p
        JOIN tab_categories c ON c.id = p.category_id
        LEFT JOIN tab_marcas m ON m.id_marca = p.id_marca
        LEFT JOIN tab_proveedores pr ON pr.id_proveedor = p.id_proveedor
    ),
    total AS (SELECT COUNT(1) AS n FROM agg)
    SELECT
        a.product_id,
        a.category_id,
        a.nom_categoria,
        a.nom_producto,
        a.slug_producto,
        a.description,
        a.img_principal,
        a.precio_min,
        a.precio_max,
        a.stock_total::BIGINT,
        a.id_marca,
        a.nom_marca,
        a.id_proveedor,
        a.nom_proveedor,
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
