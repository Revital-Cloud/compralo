CREATE OR REPLACE FUNCTION fun_delete_sublinea(p_id_sublinea INTEGER)
RETURNS JSON AS $$
DECLARE
    v_count_productos INTEGER;
    v_result JSON;
    v_id_sublinea INTEGER := p_id_sublinea;
BEGIN
    -- Verificar si la sublínea existe
    IF NOT EXISTS (SELECT 1 FROM tab_sublineas WHERE id_sublinea = p_id_sublinea) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La sublínea no existe',
            'id_sublinea', p_id_sublinea
        );
    END IF;

    -- Verificar si la sublínea tiene productos asociados
    SELECT COUNT(1) INTO v_count_productos 
    FROM tab_productos 
    WHERE id_sublinea = v_id_sublinea AND ind_activo = true;

    IF v_count_productos > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar la sublínea porque tiene productos asociados',
            'productos_asociados', v_count_productos,
            'id_sublinea', p_id_sublinea
        );
    END IF;

    -- Eliminar la sublínea completamente
    DELETE FROM tab_sublineas 
    WHERE id_sublinea = v_id_sublinea;

    RETURN json_build_object(
        'success', true,
        'message', 'Sublínea eliminada exitosamente',
        'id_sublinea', p_id_sublinea
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar la sublínea: ' || SQLERRM,
            'id_sublinea', p_id_sublinea
        );
END;
$$ LANGUAGE plpgsql;
