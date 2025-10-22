CREATE OR REPLACE FUNCTION fun_delete_categoria(p_id_categoria INTEGER)
RETURNS JSON AS $$
DECLARE
    v_count_lineas INTEGER;
    v_result JSON;
    v_id_categoria INTEGER := p_id_categoria;
BEGIN
    -- Verificar si la categoría existe
    IF NOT EXISTS (SELECT 1 FROM tab_categorias WHERE id_categoria = p_id_categoria) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La categoría no existe',
            'id_categoria', p_id_categoria
        );
    END IF;

    -- Verificar si la categoría tiene líneas asociadas
    SELECT COUNT(*) INTO v_count_lineas 
    FROM tab_lineas 
    WHERE id_categoria = v_id_categoria AND ind_activo = true;

    IF v_count_lineas > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar la categoría porque tiene líneas asociadas',
            'lineas_asociadas', v_count_lineas,
            'id_categoria', p_id_categoria
        );
    END IF;

    -- Eliminar la categoría completamente
    DELETE FROM tab_categorias 
    WHERE id_categoria = v_id_categoria;

    RETURN json_build_object(
        'success', true,
        'message', 'Categoría eliminada exitosamente',
        'id_categoria', p_id_categoria
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar la categoría: ' || SQLERRM,
            'id_categoria', p_id_categoria
        );
END;
$$ LANGUAGE plpgsql;
