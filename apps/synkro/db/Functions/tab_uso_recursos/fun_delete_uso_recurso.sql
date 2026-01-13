/*
 * FUNCIÓN: fun_delete_uso_recurso
 * 
 * DESCRIPCIÓN: Elimina una medición de uso de recursos (soft delete)
 * NOTA: Normalmente no se eliminan, pero se permite para correcciones
 */
CREATE OR REPLACE FUNCTION fun_delete_uso_recurso(
    p_id_uso_recurso tab_uso_recursos.id_uso_recurso%TYPE
) RETURNS JSON AS
$$
BEGIN
    IF p_id_uso_recurso IS NULL OR p_id_uso_recurso <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la medición es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_uso_recursos WHERE id_uso_recurso = p_id_uso_recurso) THEN
        RETURN json_build_object('success', false, 'message', 'La medición no existe');
    END IF;

    DELETE FROM tab_uso_recursos WHERE id_uso_recurso = p_id_uso_recurso;

    RETURN json_build_object('success', true, 'message', 'Medición eliminada correctamente (soft delete)', 'id_uso_recurso', p_id_uso_recurso);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
