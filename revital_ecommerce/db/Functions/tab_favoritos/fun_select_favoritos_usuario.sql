/*
 * Lista favoritos del usuario con detalle: product_id, nombre, imagen principal, precio mínimo.
 * Usa tab_favoritos.product_id y tablas products, product_variants, product_images.
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
        (SELECT pi.image_url FROM tab_product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS img_principal,
        (SELECT MIN(pv.price) FROM tab_product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS precio_min
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
    RETURN QUERY SELECT * FROM fun_select_favoritos_usuario_con_detalles(p_id_usuario);
END;
$$ LANGUAGE plpgsql;
