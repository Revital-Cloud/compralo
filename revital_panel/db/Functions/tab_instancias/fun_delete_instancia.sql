/*
 * FUNCIÓN: fun_delete_instancia
 * 
 * DESCRIPCIÓN: Elimina una instancia (soft delete)
 */
CREATE OR REPLACE FUNCTION fun_delete_instancia(
    p_id_instancia tab_instancias.id_instancia%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_suscripciones_activas INTEGER;
BEGIN
    IF p_id_instancia IS NULL OR p_id_instancia <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la instancia es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_instancias WHERE id_instancia = p_id_instancia) THEN
        RETURN json_build_object('success', false, 'message', 'La instancia no existe');
    END IF;

    SELECT COUNT(*) INTO v_suscripciones_activas
    FROM tab_suscripciones
    WHERE id_instancia = p_id_instancia AND estado_suscripcion = 'activa';

    IF v_suscripciones_activas > 0 THEN
        RETURN json_build_object('success', false, 'message', 'No se puede eliminar la instancia porque tiene suscripciones activas', 'suscripciones_activas', v_suscripciones_activas);
    END IF;

    DELETE FROM tab_instancias WHERE id_instancia = p_id_instancia;

    RETURN json_build_object('success', true, 'message', 'Instancia eliminada correctamente (soft delete)', 'id_instancia', p_id_instancia);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
