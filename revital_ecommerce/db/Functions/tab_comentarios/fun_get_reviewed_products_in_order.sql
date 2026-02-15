/*
 * Lista los product_id que el usuario ya reseñó en una orden.
 * Retorna product_key como product_id::VARCHAR para compatibilidad.
 */
CREATE OR REPLACE FUNCTION fun_get_reviewed_products_in_order(
    wid_orden tab_comentarios.id_orden%TYPE,
    wid_usuario tab_comentarios.id_usuario%TYPE
) RETURNS TABLE(product_key VARCHAR) AS $$
BEGIN
    IF wid_orden IS NULL OR wid_orden <= 0 THEN
        RAISE EXCEPTION 'El ID de orden es obligatorio y debe ser mayor a 0';
    END IF;
    IF wid_usuario IS NULL OR wid_usuario <= 0 THEN
        RAISE EXCEPTION 'El ID de usuario es obligatorio y debe ser mayor a 0';
    END IF;
    RETURN QUERY
    SELECT DISTINCT c.product_id::VARCHAR AS product_key
    FROM tab_comentarios c
    WHERE c.id_orden = wid_orden AND c.id_usuario = wid_usuario AND c.ind_activo = TRUE
    ORDER BY product_key;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al obtener productos reseñados: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
