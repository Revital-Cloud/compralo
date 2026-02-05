/*
 * FUNCIÓN: fun_insert_suscripcion
 * 
 * DESCRIPCIÓN: Inserta una nueva suscripción
 */
CREATE OR REPLACE FUNCTION fun_insert_suscripcion(
    p_identificacion_fiscal_cliente tab_suscripciones.identificacion_fiscal_cliente%TYPE,
    p_id_plan tab_suscripciones.id_plan%TYPE,
    p_precio_actual tab_suscripciones.precio_actual%TYPE,
    p_usr_insert tab_suscripciones.usr_insert%TYPE,
    p_id_instancia tab_suscripciones.id_instancia%TYPE DEFAULT NULL,
    p_tipo_facturacion tab_suscripciones.tipo_facturacion%TYPE DEFAULT 'mensual',
    p_fecha_inicio tab_suscripciones.fecha_inicio%TYPE DEFAULT CURRENT_TIMESTAMP,
    p_fecha_fin tab_suscripciones.fecha_fin%TYPE DEFAULT NULL,
    p_fecha_proximo_pago tab_suscripciones.fecha_proximo_pago%TYPE DEFAULT NULL,
    p_estado_suscripcion tab_suscripciones.estado_suscripcion%TYPE DEFAULT 'activa',
    p_metodo_pago tab_suscripciones.metodo_pago%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
DECLARE
    v_id_suscripcion DECIMAL(10,0);
    v_cliente_existe INTEGER;
    v_plan_existe INTEGER;
    v_precio_plan DECIMAL(10,2);
BEGIN
    -- Validaciones básicas
    IF p_identificacion_fiscal_cliente IS NULL OR TRIM(p_identificacion_fiscal_cliente) = '' THEN
        RETURN json_build_object('success', false, 'message', 'La identificación fiscal del cliente es obligatoria');
    END IF;

    IF p_id_plan IS NULL OR p_id_plan <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID del plan es obligatorio');
    END IF;

    IF p_precio_actual IS NULL OR p_precio_actual <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El precio actual es obligatorio y debe ser mayor a 0');
    END IF;

    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que crea el registro es obligatorio');
    END IF;

    -- Validar que el cliente existe
    SELECT COUNT(*) INTO v_cliente_existe FROM tab_clientes WHERE identificacion_fiscal = p_identificacion_fiscal_cliente;
    IF v_cliente_existe = 0 THEN
        RETURN json_build_object('success', false, 'message', 'El cliente no existe');
    END IF;

    -- Validar que el plan existe y obtener precio (MAX para compatibilidad con reglas de agregación)
    SELECT COUNT(*), MAX(precio_mensual) INTO v_plan_existe, v_precio_plan FROM tab_planes WHERE id_plan = p_id_plan;
    IF v_plan_existe = 0 THEN
        RETURN json_build_object('success', false, 'message', 'El plan no existe');
    END IF;

    -- Validar instancia si se proporciona
    IF p_id_instancia IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM tab_instancias WHERE id_instancia = p_id_instancia) THEN
            RETURN json_build_object('success', false, 'message', 'La instancia no existe');
        END IF;
    END IF;

    -- Insertar suscripción
    INSERT INTO tab_suscripciones (
        identificacion_fiscal_cliente, id_plan, id_instancia, tipo_facturacion,
        precio_actual, fecha_inicio, fecha_fin, fecha_proximo_pago,
        estado_suscripcion, metodo_pago, usr_insert, fec_insert
    ) VALUES (
        p_identificacion_fiscal_cliente, p_id_plan, p_id_instancia, p_tipo_facturacion,
        p_precio_actual, p_fecha_inicio, p_fecha_fin, p_fecha_proximo_pago,
        p_estado_suscripcion, p_metodo_pago, p_usr_insert, CURRENT_TIMESTAMP
    ) RETURNING id_suscripcion INTO v_id_suscripcion;

    RETURN json_build_object('success', true, 'message', 'Suscripción insertada correctamente', 'id_suscripcion', v_id_suscripcion);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
