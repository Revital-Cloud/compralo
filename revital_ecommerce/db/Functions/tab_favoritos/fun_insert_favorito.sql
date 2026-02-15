/*
 * Agrega un producto a favoritos del usuario. Usa product_id (tabla products).
 */
CREATE OR REPLACE FUNCTION fun_insert_favorito(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_product_id tab_products.id%TYPE,
    p_usr_operacion DECIMAL DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_usr DECIMAL(10);
BEGIN
    IF p_id_usuario IS NULL OR p_product_id IS NULL THEN
        RETURN 'Error: id_usuario y product_id son obligatorios.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tab_products WHERE id = p_product_id) THEN
        RETURN 'Error: El producto no existe.';
    END IF;
    v_usr := COALESCE(p_usr_operacion, p_id_usuario);
    INSERT INTO tab_favoritos (id_usuario, product_id, usr_insert, fec_insert)
    VALUES (p_id_usuario, p_product_id, v_usr, NOW());
    RETURN 'Favorito agregado correctamente';
EXCEPTION
    WHEN unique_violation THEN
        RETURN 'Error: El producto ya está en favoritos.';
    WHEN foreign_key_violation THEN
        RETURN 'Error: Usuario o producto no existe.';
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;
