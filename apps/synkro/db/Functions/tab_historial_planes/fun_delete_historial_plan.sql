/*
 * FUNCIÓN: fun_delete_historial_plan
 * 
 * DESCRIPCIÓN: Elimina un registro del historial de planes (soft delete)
 * NOTA: Normalmente no se eliminan, pero se permite para correcciones
 */
CREATE OR REPLACE FUNCTION fun_delete_historial_plan(
    p_id_historial tab_historial_planes.id_historial%TYPE
) RETURNS JSON AS
$$
BEGIN
    IF p_id_historial IS NULL OR p_id_historial <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID del historial es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_historial_planes WHERE id_historial = p_id_historial) THEN
        RETURN json_build_object('success', false, 'message', 'El registro del historial no existe');
    END IF;

    DELETE FROM tab_historial_planes WHERE id_historial = p_id_historial;

    RETURN json_build_object('success', true, 'message', 'Registro del historial eliminado correctamente (soft delete)', 'id_historial', p_id_historial);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
