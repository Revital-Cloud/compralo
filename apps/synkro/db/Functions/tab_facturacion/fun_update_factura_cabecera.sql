/*
 * FUNCIÓN: fun_update_factura_cabecera
 * 
 * DESCRIPCIÓN: Actualiza una cabecera de factura existente
 * 
 * PARÁMETROS:
 *   - p_id_factura: ID de la factura a actualizar (obligatorio)
 *   - p_estado_pago: Estado del pago (opcional)
 *   - p_metodo_pago: Método de pago (opcional)
 *   - p_fecha_vencimiento: Fecha de vencimiento (opcional)
 *   - p_fecha_pago: Fecha de pago (opcional)
 *   - p_referencia_pago: Referencia de pago externa (opcional)
 *   - p_notas: Notas adicionales (opcional)
 *   - p_usr_update: Usuario que actualiza el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * NOTA: Los totales (subtotal, impuestos, descuentos, total) NO se pueden
 *       actualizar manualmente, se calculan automáticamente desde el detalle
 * 
 * AUTOR: Sistema DB_Synkro SaaS
 * FECHA: Diciembre 2025
 */
CREATE OR REPLACE FUNCTION fun_update_factura_cabecera(
    p_id_factura tab_facturacion_cabecera.id_factura%TYPE,
    p_estado_pago tab_facturacion_cabecera.estado_pago%TYPE DEFAULT NULL,
    p_metodo_pago tab_facturacion_cabecera.metodo_pago%TYPE DEFAULT NULL,
    p_fecha_vencimiento tab_facturacion_cabecera.fecha_vencimiento%TYPE DEFAULT NULL,
    p_fecha_pago tab_facturacion_cabecera.fecha_pago%TYPE DEFAULT NULL,
    p_referencia_pago tab_facturacion_cabecera.referencia_pago%TYPE DEFAULT NULL,
    p_notas tab_facturacion_cabecera.notas%TYPE DEFAULT NULL,
    p_usr_update tab_facturacion_cabecera.usr_update%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_factura_existe INTEGER;
BEGIN
    -- Validación: ID de factura
    IF p_id_factura IS NULL OR p_id_factura <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID de la factura es obligatorio'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que actualiza el registro es obligatorio'
        );
    END IF;

    -- Validar que la factura existe
    SELECT COUNT(*) INTO v_factura_existe
    FROM tab_facturacion_cabecera
    WHERE id_factura = p_id_factura;

    IF v_factura_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La factura no existe'
        );
    END IF;

    -- Actualizar cabecera de factura
    UPDATE tab_facturacion_cabecera
    SET 
        estado_pago = COALESCE(p_estado_pago, estado_pago),
        metodo_pago = COALESCE(p_metodo_pago, metodo_pago),
        fecha_vencimiento = COALESCE(p_fecha_vencimiento, fecha_vencimiento),
        fecha_pago = COALESCE(p_fecha_pago, fecha_pago),
        referencia_pago = COALESCE(p_referencia_pago, referencia_pago),
        notas = COALESCE(p_notas, notas),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_factura = p_id_factura;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Cabecera de factura actualizada correctamente',
            'id_factura', p_id_factura
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo actualizar la cabecera de factura'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al actualizar la cabecera de factura: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
