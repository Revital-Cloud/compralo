/*
 * FUNCIÓN: fun_delete_suscripcion
 */
CREATE OR REPLACE FUNCTION fun_delete_suscripcion(
    p_id_suscripcion tab_suscripciones.id_suscripcion%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_facturas_pendientes INTEGER;
BEGIN
    IF p_id_suscripcion IS NULL OR p_id_suscripcion <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la suscripción es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_suscripciones WHERE id_suscripcion = p_id_suscripcion) THEN
        RETURN json_build_object('success', false, 'message', 'La suscripción no existe');
    END IF;

    -- Verificar facturas pendientes
    SELECT COUNT(*) INTO v_facturas_pendientes
    FROM tab_facturacion_cabecera
    WHERE id_suscripcion = p_id_suscripcion AND estado_pago = 'pendiente';

    IF v_facturas_pendientes > 0 THEN
        RETURN json_build_object('success', false, 'message', 'No se puede eliminar la suscripción porque tiene facturas pendientes', 'facturas_pendientes', v_facturas_pendientes);
    END IF;

    DELETE FROM tab_suscripciones WHERE id_suscripcion = p_id_suscripcion;

    RETURN json_build_object('success', true, 'message', 'Suscripción eliminada correctamente (soft delete)', 'id_suscripcion', p_id_suscripcion);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
