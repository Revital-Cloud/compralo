/*
 * FUNCIÓN: fun_cambiar_plan_suscripcion
 * 
 * DESCRIPCIÓN: Cambia el plan de una suscripción existente
 * - Valida que la suscripción existe y está activa
 * - Obtiene el precio del plan nuevo según tipo_facturacion
 * - Determina automáticamente si es upgrade o downgrade comparando precios
 * - Actualiza la suscripción con el nuevo plan y precio
 * - Calcula fecha_efectiva (inmediata o próximo ciclo según tipo_facturacion)
 * - Registra el cambio en tab_historial_planes
 */
CREATE OR REPLACE FUNCTION fun_cambiar_plan_suscripcion(
    p_id_suscripcion tab_suscripciones.id_suscripcion%TYPE,
    p_id_plan_nuevo tab_suscripciones.id_plan%TYPE,
    p_usuario_email VARCHAR,
    p_motivo_cambio TEXT DEFAULT NULL,
    p_tipo_cambio enum_tipo_cambio DEFAULT NULL -- Si es NULL, se determina automáticamente
) RETURNS JSON AS
$$
DECLARE
    v_suscripcion RECORD;
    v_plan_nuevo RECORD;
    v_precio_nuevo DECIMAL(10,2);
    v_precio_anterior DECIMAL(10,2);
    v_id_plan_anterior DECIMAL(10,0);
    v_tipo_cambio_final enum_tipo_cambio;
    v_fecha_efectiva TIMESTAMP WITHOUT TIME ZONE;
    v_fecha_proximo_pago TIMESTAMP WITHOUT TIME ZONE;
    v_id_historial DECIMAL(10,0);
BEGIN
    -- Validaciones básicas
    IF p_id_suscripcion IS NULL OR p_id_suscripcion <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la suscripción es obligatorio');
    END IF;

    IF p_id_plan_nuevo IS NULL OR p_id_plan_nuevo <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID del plan nuevo es obligatorio');
    END IF;

    IF p_usuario_email IS NULL OR TRIM(p_usuario_email) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El email del usuario es obligatorio');
    END IF;

    -- Obtener información de la suscripción actual
    SELECT 
        id_suscripcion, id_plan, identificacion_fiscal_cliente, tipo_facturacion,
        precio_actual, fecha_inicio, fecha_fin, fecha_proximo_pago, estado_suscripcion
    INTO v_suscripcion
    FROM tab_suscripciones
    WHERE id_suscripcion = p_id_suscripcion;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'La suscripción no existe');
    END IF;

    -- Validar que la suscripción está activa
    IF v_suscripcion.estado_suscripcion != 'activa' THEN
        RETURN json_build_object('success', false, 'message', 'Solo se pueden cambiar planes de suscripciones activas');
    END IF;

    -- Validar que no sea el mismo plan
    IF v_suscripcion.id_plan = p_id_plan_nuevo THEN
        RETURN json_build_object('success', false, 'message', 'El plan nuevo es el mismo que el plan actual');
    END IF;

    -- Obtener información del plan nuevo
    SELECT id_plan, precio_mensual, precio_anual
    INTO v_plan_nuevo
    FROM tab_planes
    WHERE id_plan = p_id_plan_nuevo;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'El plan nuevo no existe');
    END IF;

    -- Determinar precio nuevo según tipo de facturación
    IF v_suscripcion.tipo_facturacion = 'anual' THEN
        v_precio_nuevo := v_plan_nuevo.precio_anual;
    ELSE
        v_precio_nuevo := v_plan_nuevo.precio_mensual;
    END IF;

    -- Guardar valores anteriores
    v_precio_anterior := v_suscripcion.precio_actual;
    v_id_plan_anterior := v_suscripcion.id_plan;

    -- Determinar tipo de cambio si no se proporciona
    IF p_tipo_cambio IS NULL THEN
        IF v_precio_nuevo > v_precio_anterior THEN
            v_tipo_cambio_final := 'upgrade';
        ELSIF v_precio_nuevo < v_precio_anterior THEN
            v_tipo_cambio_final := 'downgrade';
        ELSE
            -- Mismo precio, cambio lateral
            v_tipo_cambio_final := 'renovacion'; -- Usamos 'renovacion' para cambios laterales
        END IF;
    ELSE
        v_tipo_cambio_final := p_tipo_cambio;
    END IF;

    -- Calcular fecha efectiva: inmediata para cambios de plan
    v_fecha_efectiva := CURRENT_TIMESTAMP;

    -- Calcular próximo pago según tipo de facturación
    IF v_suscripcion.tipo_facturacion = 'anual' THEN
        v_fecha_proximo_pago := CURRENT_TIMESTAMP + INTERVAL '1 year';
    ELSE
        v_fecha_proximo_pago := CURRENT_TIMESTAMP + INTERVAL '1 month';
    END IF;

    -- Actualizar la suscripción con el nuevo plan y precio
    UPDATE tab_suscripciones
    SET 
        id_plan = p_id_plan_nuevo,
        precio_actual = v_precio_nuevo,
        fecha_proximo_pago = v_fecha_proximo_pago,
        usr_update = p_usuario_email,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_suscripcion = p_id_suscripcion;

    -- Registrar el cambio en el historial
    INSERT INTO tab_historial_planes (
        id_suscripcion, id_plan_anterior, id_plan_nuevo, precio_anterior, precio_nuevo,
        tipo_cambio, fecha_cambio, fecha_efectiva, motivo_cambio, usuario_email, usr_insert, fec_insert
    ) VALUES (
        p_id_suscripcion, v_id_plan_anterior, p_id_plan_nuevo, v_precio_anterior, v_precio_nuevo,
        v_tipo_cambio_final, CURRENT_TIMESTAMP, v_fecha_efectiva, p_motivo_cambio, p_usuario_email, p_usuario_email, CURRENT_TIMESTAMP
    ) RETURNING id_historial INTO v_id_historial;

    RETURN json_build_object(
        'success', true,
        'message', 'Plan de suscripción cambiado correctamente',
        'id_suscripcion', p_id_suscripcion,
        'id_plan_anterior', v_id_plan_anterior,
        'id_plan_nuevo', p_id_plan_nuevo,
        'precio_anterior', v_precio_anterior,
        'precio_nuevo', v_precio_nuevo,
        'tipo_cambio', v_tipo_cambio_final,
        'id_historial', v_id_historial
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error al cambiar plan: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
