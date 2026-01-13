/*
 * FUNCIÓN: fun_update_factura
 */
CREATE OR REPLACE FUNCTION fun_update_factura(
    p_id_factura tab_facturacion.id_factura%TYPE,
    p_concepto_factura tab_facturacion.concepto_factura%TYPE DEFAULT NULL,
    p_subtotal tab_facturacion.subtotal%TYPE DEFAULT NULL,
    p_impuestos tab_facturacion.impuestos%TYPE DEFAULT NULL,
    p_descuentos tab_facturacion.descuentos%TYPE DEFAULT NULL,
    p_total tab_facturacion.total%TYPE DEFAULT NULL,
    p_moneda tab_facturacion.moneda%TYPE DEFAULT NULL,
    p_estado_pago tab_facturacion.estado_pago%TYPE DEFAULT NULL,
    p_metodo_pago tab_facturacion.metodo_pago%TYPE DEFAULT NULL,
    p_fecha_vencimiento tab_facturacion.fecha_vencimiento%TYPE DEFAULT NULL,
    p_fecha_pago tab_facturacion.fecha_pago%TYPE DEFAULT NULL,
    p_referencia_pago tab_facturacion.referencia_pago%TYPE DEFAULT NULL,
    p_notas tab_facturacion.notas%TYPE DEFAULT NULL,
    p_usr_update tab_facturacion.usr_update%TYPE
) RETURNS JSON AS
$$
BEGIN
    IF p_id_factura IS NULL OR p_id_factura <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la factura es obligatorio');
    END IF;

    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object('success', false, 'message', 'El usuario que actualiza es obligatorio');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tab_facturacion WHERE id_factura = p_id_factura) THEN
        RETURN json_build_object('success', false, 'message', 'La factura no existe');
    END IF;

    UPDATE tab_facturacion
    SET 
        concepto_factura = COALESCE(p_concepto_factura, concepto_factura),
        subtotal = COALESCE(p_subtotal, subtotal),
        impuestos = COALESCE(p_impuestos, impuestos),
        descuentos = COALESCE(p_descuentos, descuentos),
        total = COALESCE(p_total, total),
        moneda = COALESCE(p_moneda, moneda),
        estado_pago = COALESCE(p_estado_pago, estado_pago),
        metodo_pago = COALESCE(p_metodo_pago, metodo_pago),
        fecha_vencimiento = COALESCE(p_fecha_vencimiento, fecha_vencimiento),
        fecha_pago = COALESCE(p_fecha_pago, fecha_pago),
        referencia_pago = COALESCE(p_referencia_pago, referencia_pago),
        notas = COALESCE(p_notas, notas),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_factura = p_id_factura;

    RETURN json_build_object('success', true, 'message', 'Factura actualizada correctamente', 'id_factura', p_id_factura);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$
LANGUAGE plpgsql;
