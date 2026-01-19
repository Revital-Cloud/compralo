/*
 * FUNCIÓN: fun_insert_factura
 */
CREATE OR REPLACE FUNCTION fun_insert_factura(
    p_id_suscripcion tab_facturacion.id_suscripcion%TYPE,
    p_identificacion_fiscal_cliente tab_facturacion.identificacion_fiscal_cliente%TYPE,
    p_num_factura tab_facturacion.num_factura%TYPE,
    p_concepto_factura tab_facturacion.concepto_factura%TYPE,
    p_subtotal tab_facturacion.subtotal%TYPE,
    p_impuestos tab_facturacion.impuestos%TYPE DEFAULT 0,
    p_descuentos tab_facturacion.descuentos%TYPE DEFAULT 0,
    p_total tab_facturacion.total%TYPE,
    p_moneda tab_facturacion.moneda%TYPE DEFAULT 'USD',
    p_estado_pago tab_facturacion.estado_pago%TYPE DEFAULT 'pendiente',
    p_metodo_pago tab_facturacion.metodo_pago%TYPE DEFAULT NULL,
    p_fecha_emision tab_facturacion.fecha_emision%TYPE DEFAULT CURRENT_TIMESTAMP,
    p_fecha_vencimiento tab_facturacion.fecha_vencimiento%TYPE DEFAULT NULL,
    p_referencia_pago tab_facturacion.referencia_pago%TYPE DEFAULT NULL,
    p_notas tab_facturacion.notas%TYPE DEFAULT NULL,
    p_usr_insert tab_facturacion.usr_insert%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_id_factura DECIMAL(10,0);
    v_num_factura_existe INTEGER;
BEGIN
    -- Validaciones básicas
    IF p_id_suscripcion IS NULL OR p_id_suscripcion <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la suscripción es obligatorio');
    END IF;

    IF p_identificacion_fiscal_cliente IS NULL OR TRIM(p_identificacion_fiscal_cliente) = '' THEN
        RETURN json_build_object('success', false, 'message', 'La identificación fiscal del cliente es obligatoria');
    END IF;

    IF p_num_factura IS NULL OR TRIM(p_num_factura) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El número de factura es obligatorio');
    END IF;

    IF p_subtotal IS NULL OR p_subtotal <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El subtotal es obligatorio y debe ser mayor a 0');
    END IF;

    IF p_total IS NULL OR p_total <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El total es obligatorio y debe ser mayor a 0');
    END IF;

    IF p_usr_insert IS NULL OR TRIM(p_usr_insert) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que crea el registro es obligatorio');
    END IF;

    -- Validar unicidad de número de factura
    SELECT COUNT(*) INTO v_num_factura_existe FROM tab_facturacion WHERE num_factura = p_num_factura;
    IF v_num_factura_existe > 0 THEN
        RETURN json_build_object('success', false, 'message', 'Ya existe una factura con este número');
    END IF;

    -- Validar que la suscripción existe
    IF NOT EXISTS (SELECT 1 FROM tab_suscripciones WHERE id_suscripcion = p_id_suscripcion) THEN
        RETURN json_build_object('success', false, 'message', 'La suscripción no existe');
    END IF;

    -- Insertar factura
    INSERT INTO tab_facturacion (
        id_suscripcion, identificacion_fiscal_cliente, num_factura, concepto_factura,
        subtotal, impuestos, descuentos, total, moneda, estado_pago, metodo_pago,
        fecha_emision, fecha_vencimiento, referencia_pago, notas, usr_insert, fec_insert
    ) VALUES (
        p_id_suscripcion, p_identificacion_fiscal_cliente, p_num_factura, p_concepto_factura,
        p_subtotal, p_impuestos, p_descuentos, p_total, p_moneda, p_estado_pago, p_metodo_pago,
        p_fecha_emision, p_fecha_vencimiento, p_referencia_pago, p_notas, p_usr_insert, CURRENT_TIMESTAMP
    ) RETURNING id_factura INTO v_id_factura;

    RETURN json_build_object('success', true, 'message', 'Factura insertada correctamente', 'id_factura', v_id_factura);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
