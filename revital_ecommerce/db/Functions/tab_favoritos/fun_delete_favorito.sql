/*
 * Elimina un producto de favoritos del usuario. Usa product_id.
 */
CREATE OR REPLACE FUNCTION fun_delete_favorito(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_product_id tab_products.id%TYPE
) RETURNS VARCHAR AS $$
BEGIN
    IF p_id_usuario IS NULL OR p_product_id IS NULL THEN
        RETURN 'Error: id_usuario y product_id son obligatorios.';
    END IF;
    DELETE FROM tab_favoritos
    WHERE id_usuario = p_id_usuario AND product_id = p_product_id;
    IF FOUND THEN
        RETURN 'Favorito eliminado correctamente';
    ELSE
        RETURN 'Error: El favorito no existe o ya fue eliminado';
    END IF;
END;
$$ LANGUAGE plpgsql;
