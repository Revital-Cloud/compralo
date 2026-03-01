CREATE OR REPLACE FUNCTION fun_delete_linea(p_id_linea INTEGER)
RETURNS JSON AS $$
DECLARE
    v_count_sublineas INTEGER;
    v_result JSON;
    v_id_linea INTEGER := p_id_linea;
BEGIN
    -- Verificar si la línea existe
    IF NOT EXISTS (SELECT 1 FROM tab_lineas WHERE id_linea = p_id_linea) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La línea no existe',
            'id_linea', p_id_linea
        );
    END IF;

    -- Verificar si la línea tiene sublíneas asociadas
    SELECT COUNT(1) INTO v_count_sublineas 
    FROM tab_sublineas 
    WHERE id_linea = v_id_linea AND ind_activo = true;

    IF v_count_sublineas > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar la línea porque tiene sublíneas asociadas',
            'sublineas_asociadas', v_count_sublineas,
            'id_linea', p_id_linea
        );
    END IF;

    -- Eliminar la línea completamente
    DELETE FROM tab_lineas 
    WHERE id_linea = v_id_linea;

    RETURN json_build_object(
        'success', true,
        'message', 'Línea eliminada exitosamente',
        'id_linea', p_id_linea
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar la línea: ' || SQLERRM,
            'id_linea', p_id_linea
        );
END;
$$ LANGUAGE plpgsql;
