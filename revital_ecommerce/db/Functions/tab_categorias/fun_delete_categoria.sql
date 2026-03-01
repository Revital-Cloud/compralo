/*
 * Elimina una categoría de la tabla tab_categories.
 * No permite eliminar si tiene hijas o productos asociados.
 */
CREATE OR REPLACE FUNCTION fun_delete_categoria(p_id DECIMAL)
RETURNS JSON AS $$
DECLARE
    v_children INT;
    v_products INT;
BEGIN
    IF p_id IS NULL OR NOT EXISTS (SELECT 1 FROM tab_categories WHERE id = p_id) THEN
        RETURN json_build_object('success', false, 'message', 'La categoría no existe', 'id_categoria', p_id);
    END IF;

    SELECT COUNT(1) INTO v_children FROM tab_categories WHERE parent_id = p_id;
    IF v_children > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar: tiene subcategorías asociadas',
            'id_categoria', p_id,
            'hijas', v_children
        );
    END IF;

    SELECT COUNT(1) INTO v_products FROM tab_products WHERE category_id = p_id;
    IF v_products > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar: tiene productos asociados',
            'id_categoria', p_id,
            'productos', v_products
        );
    END IF;

    DELETE FROM tab_estadisticas_categorias WHERE category_id = p_id;
    DELETE FROM tab_category_attributes WHERE category_id = p_id;
    DELETE FROM tab_categories WHERE id = p_id;

    RETURN json_build_object('success', true, 'message', 'Categoría eliminada', 'id_categoria', p_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM, 'id_categoria', p_id);
END;
$$ LANGUAGE plpgsql;
