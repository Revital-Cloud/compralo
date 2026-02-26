/*
 * Lista favoritos del usuario con detalle: product_id, nombre, imagen principal, precio mínimo.
 * Usa tab_favoritos.product_id y tablas products, variant_combinations/groups, variant_images.
 */
CREATE OR REPLACE FUNCTION fun_select_favoritos_usuario_con_detalles(
    p_id_usuario tab_favoritos.id_usuario%TYPE
) RETURNS TABLE (
    id_usuario DECIMAL,
    product_id DECIMAL,
    fec_insert TIMESTAMP,
    nom_producto VARCHAR,
    img_principal VARCHAR,
    precio_min DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tf.id_usuario,
        tf.product_id,
        tf.fec_insert,
        p.name AS nom_producto,
        (SELECT pvi.image_url FROM tab_product_variant_images pvi JOIN tab_product_variant_groups g ON g.id = pvi.variant_group_id WHERE g.product_id = p.id ORDER BY g.id, pvi.sort_order, pvi.id LIMIT 1) AS img_principal,
        (SELECT MIN(c.price) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id AND c.is_active = TRUE) AS precio_min
    FROM tab_favoritos tf
    JOIN tab_products p ON p.id = tf.product_id
    WHERE tf.id_usuario = p_id_usuario
    ORDER BY tf.fec_insert DESC;
END;
$$ LANGUAGE plpgsql;

-- Alias para compatibilidad
CREATE OR REPLACE FUNCTION fun_select_favoritos_usuario(p_id_usuario tab_favoritos.id_usuario%TYPE)
RETURNS TABLE (
    id_usuario DECIMAL,
    product_id DECIMAL,
    fec_insert TIMESTAMP,
    nom_producto VARCHAR,
    img_principal VARCHAR,
    precio_min DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id_usuario,
        product_id,
        fec_insert,
        nom_producto,
        img_principal,
        precio_min
    FROM fun_select_favoritos_usuario_con_detalles(p_id_usuario);
END;
$$ LANGUAGE plpgsql;
