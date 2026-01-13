/*
 * FUNCIÓN: fun_insert_historial_plan
 * 
 * DESCRIPCIÓN: Inserta un registro en el historial de cambios de plan
 * NOTA: Normalmente se inserta automáticamente cuando se cambia un plan
 */
CREATE OR REPLACE FUNCTION fun_insert_historial_plan(
    p_id_suscripcion tab_historial_planes.id_suscripcion%TYPE,
    p_id_plan_nuevo tab_historial_planes.id_plan_nuevo%TYPE,
    p_precio_nuevo tab_historial_planes.precio_nuevo%TYPE,
    p_tipo_cambio tab_historial_planes.tipo_cambio%TYPE,
    p_fecha_efectiva tab_historial_planes.fecha_efectiva%TYPE,
    p_usr_insert tab_historial_planes.usr_insert%TYPE,
    p_id_plan_anterior tab_historial_planes.id_plan_anterior%TYPE DEFAULT NULL,
    p_precio_anterior tab_historial_planes.precio_anterior%TYPE DEFAULT NULL,
    p_fecha_cambio tab_historial_planes.fecha_cambio%TYPE DEFAULT CURRENT_TIMESTAMP,
    p_motivo_cambio tab_historial_planes.motivo_cambio%TYPE DEFAULT NULL,
    p_usuario_email tab_historial_planes.usuario_email%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
DECLARE
    v_id_historial DECIMAL(10,0);
BEGIN
    IF p_id_suscripcion IS NULL OR p_id_suscripcion <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la suscripción es obligatorio');
    END IF;

    IF p_id_plan_nuevo IS NULL OR p_id_plan_nuevo <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID del plan nuevo es obligatorio');
    END IF;

    IF p_precio_nuevo IS NULL OR p_precio_nuevo <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El precio nuevo es obligatorio y debe ser mayor a 0');
    END IF;

    IF p_fecha_efectiva IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'La fecha efectiva es obligatoria');
    END IF;

    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que crea el registro es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_suscripciones WHERE id_suscripcion = p_id_suscripcion) THEN
        RETURN json_build_object('success', false, 'message', 'La suscripción no existe');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_planes WHERE id_plan = p_id_plan_nuevo) THEN
        RETURN json_build_object('success', false, 'message', 'El plan nuevo no existe');
    END IF;

    IF p_id_plan_anterior IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tab_planes WHERE id_plan = p_id_plan_anterior) THEN
        RETURN json_build_object('success', false, 'message', 'El plan anterior no existe');
    END IF;

    INSERT INTO tab_historial_planes (
        id_suscripcion, id_plan_anterior, id_plan_nuevo, precio_anterior, precio_nuevo,
        tipo_cambio, fecha_cambio, fecha_efectiva, motivo_cambio, usuario_email, usr_insert, fec_insert
    ) VALUES (
        p_id_suscripcion, p_id_plan_anterior, p_id_plan_nuevo, p_precio_anterior, p_precio_nuevo,
        p_tipo_cambio, p_fecha_cambio, p_fecha_efectiva, p_motivo_cambio, p_usuario_email, p_usr_insert, CURRENT_TIMESTAMP
    ) RETURNING id_historial INTO v_id_historial;

    RETURN json_build_object('success', true, 'message', 'Historial de plan insertado correctamente', 'id_historial', v_id_historial);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
