CREATE OR REPLACE FUNCTION fun_delete_marca(p_id_marca INTEGER)
RETURNS JSON AS $$
DECLARE
    v_count_productos INTEGER;
    v_result JSON;
    v_id_marca INTEGER := p_id_marca;
BEGIN
    -- Verificar si la marca existe
    IF NOT EXISTS (SELECT 1 FROM tab_marcas WHERE id_marca = p_id_marca) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La marca no existe',
            'id_marca', p_id_marca
        );
    END IF;

    -- Verificar si la marca tiene productos asociados
    SELECT COUNT(1) INTO v_count_productos 
    FROM tab_productos 
    WHERE id_marca = v_id_marca AND ind_activo = true;

    IF v_count_productos > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar la marca porque tiene productos asociados',
            'productos_asociados', v_count_productos,
            'id_marca', p_id_marca
        );
    END IF;

    -- Eliminar la marca completamente
    DELETE FROM tab_marcas 
    WHERE id_marca = v_id_marca;

    RETURN json_build_object(
        'success', true,
        'message', 'Marca eliminada exitosamente',
        'id_marca', p_id_marca
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar la marca: ' || SQLERRM,
            'id_marca', p_id_marca
        );
END;
$$ LANGUAGE plpgsql;
