/*
 * FUNCIÓN: fun_update_suscripcion
 */
CREATE OR REPLACE FUNCTION fun_update_suscripcion(
    p_id_suscripcion tab_suscripciones.id_suscripcion%TYPE,
    p_usr_update tab_suscripciones.usr_update%TYPE,
    p_id_plan tab_suscripciones.id_plan%TYPE DEFAULT NULL,
    p_id_instancia tab_suscripciones.id_instancia%TYPE DEFAULT NULL,
    p_tipo_facturacion tab_suscripciones.tipo_facturacion%TYPE DEFAULT NULL,
    p_precio_actual tab_suscripciones.precio_actual%TYPE DEFAULT NULL,
    p_fecha_fin tab_suscripciones.fecha_fin%TYPE DEFAULT NULL,
    p_fecha_proximo_pago tab_suscripciones.fecha_proximo_pago%TYPE DEFAULT NULL,
    p_estado_suscripcion tab_suscripciones.estado_suscripcion%TYPE DEFAULT NULL,
    p_metodo_pago tab_suscripciones.metodo_pago%TYPE DEFAULT NULL,
    p_fecha_cancelacion tab_suscripciones.fecha_cancelacion%TYPE DEFAULT NULL,
    p_motivo_cancelacion tab_suscripciones.motivo_cancelacion%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
BEGIN
    IF p_id_suscripcion IS NULL OR p_id_suscripcion <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la suscripción es obligatorio');
    END IF;

    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que actualiza es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_suscripciones WHERE id_suscripcion = p_id_suscripcion) THEN
        RETURN json_build_object('success', false, 'message', 'La suscripción no existe');
    END IF;

    UPDATE tab_suscripciones
    SET 
        id_plan = COALESCE(p_id_plan, id_plan),
        id_instancia = COALESCE(p_id_instancia, id_instancia),
        tipo_facturacion = COALESCE(p_tipo_facturacion, tipo_facturacion),
        precio_actual = COALESCE(p_precio_actual, precio_actual),
        fecha_fin = COALESCE(p_fecha_fin, fecha_fin),
        fecha_proximo_pago = COALESCE(p_fecha_proximo_pago, fecha_proximo_pago),
        estado_suscripcion = COALESCE(p_estado_suscripcion, estado_suscripcion),
        metodo_pago = COALESCE(p_metodo_pago, metodo_pago),
        fecha_cancelacion = COALESCE(p_fecha_cancelacion, fecha_cancelacion),
        motivo_cancelacion = COALESCE(p_motivo_cancelacion, motivo_cancelacion),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_suscripcion = p_id_suscripcion;

    RETURN json_build_object('success', true, 'message', 'Suscripción actualizada correctamente', 'id_suscripcion', p_id_suscripcion);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
