/*
 * Filtra productos por categoría (opcionalmente con subcategorías), marca, nombre, precio, stock, oferta.
 * Usa products, product_variants, categories. total_registros para paginación.
 * Búsqueda por nombre insensible a tildes (unaccent): "jose" encuentra "José".
 * Requiere extensión unaccent para búsqueda sin tildes (ejecutar una vez como superuser):
 *   CREATE EXTENSION IF NOT EXISTS unaccent;
 *
 * p_solo_en_oferta: productos con al menos un descuento automático activo que aplica al producto
 * (misma idea que /discounts/active + getApplicableDiscount en la tienda).
 *
 * Si cambias la firma, ejecuta antes el DROP de la versión anterior.
 */
DROP FUNCTION IF EXISTS fun_filter_products(numeric, boolean, numeric, character varying, numeric, numeric, boolean, character varying, character varying, integer, integer);
DROP FUNCTION IF EXISTS fun_filter_products(numeric, boolean, numeric, character varying, numeric, numeric, boolean, boolean, character varying, character varying, integer, integer);

CREATE OR REPLACE FUNCTION fun_filter_products(
    p_category_id DECIMAL DEFAULT NULL,
    p_include_subcategories BOOLEAN DEFAULT FALSE,
    p_id_marca DECIMAL DEFAULT NULL,
    p_nombre_producto VARCHAR DEFAULT NULL,
    p_precio_min DECIMAL DEFAULT NULL,
    p_precio_max DECIMAL DEFAULT NULL,
    p_solo_con_stock BOOLEAN DEFAULT FALSE,
    p_solo_en_oferta BOOLEAN DEFAULT FALSE,
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
            (SELECT MIN(cmb.price) FROM tab_product_variant_combinations cmb JOIN tab_product_variant_groups g ON g.id = cmb.group_id WHERE g.product_id = p.id AND cmb.is_active = TRUE) AS precio_min,
            (SELECT MAX(cmb.price) FROM tab_product_variant_combinations cmb JOIN tab_product_variant_groups g ON g.id = cmb.group_id WHERE g.product_id = p.id AND cmb.is_active = TRUE) AS precio_max,
            (SELECT COALESCE(SUM(cmb.stock), 0) FROM tab_product_variant_combinations cmb JOIN tab_product_variant_groups g ON g.id = cmb.group_id WHERE g.product_id = p.id AND cmb.is_active = TRUE) AS stock_total,
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
        AND (
            NOT p_solo_en_oferta
            OR (
                agg.precio_min IS NOT NULL AND agg.precio_min > 0
                AND EXISTS (
                    SELECT 1 FROM tab_descuentos d
                    WHERE d.ind_activo = TRUE
                      AND COALESCE(d.ind_canjeable_puntos, FALSE) = FALSE
                      AND COALESCE(d.ind_es_para_cumpleanos, FALSE) = FALSE
                      AND COALESCE(d.solo_primera_compra, FALSE) = FALSE
                      AND COALESCE(d.requiere_codigo, FALSE) = FALSE
                      AND (d.fec_inicio IS NULL OR d.fec_inicio <= CURRENT_DATE)
                      AND (d.fec_fin IS NULL OR d.fec_fin >= CURRENT_DATE)
                      AND (d.max_usos_total IS NULL OR d.usos_actuales_total IS NULL OR d.usos_actuales_total < d.max_usos_total)
                      AND (
                          (d.tipo_calculo = TRUE AND COALESCE(d.val_porce_descuento, 0) > 0)
                          OR (d.tipo_calculo = FALSE AND COALESCE(d.val_monto_descuento, 0) > 0)
                      )
                      AND (
                          d.aplica_a IN ('todos', 'total_pedido')
                          OR (d.aplica_a = 'producto_especifico' AND d.product_id_aplica IS NOT NULL AND d.product_id_aplica = agg.product_id)
                          OR (d.aplica_a = 'categoria_especifica' AND d.category_id_aplica IS NOT NULL AND d.category_id_aplica = agg.category_id)
                          OR (d.aplica_a = 'marca_especifica' AND d.id_marca_aplica IS NOT NULL AND d.id_marca_aplica = agg.id_marca)
                          OR (d.aplica_a IN ('linea_especifica', 'sublinea_especifica') AND d.category_id_aplica IS NOT NULL AND d.category_id_aplica = agg.category_id)
                      )
                )
            )
        )
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
        (SELECT n FROM total) AS total_registros
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
