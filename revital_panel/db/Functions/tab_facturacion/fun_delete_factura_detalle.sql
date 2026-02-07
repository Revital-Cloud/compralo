/*
 * FUNCIÓN: fun_delete_factura_detalle
 * 
 * DESCRIPCIÓN: Elimina una línea de detalle de factura (soft delete)
 *              El registro se guarda en tab_reg_del mediante trigger
 * 
 * PARÁMETROS:
 *   - p_id_detalle: ID del detalle a eliminar (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * NOTA: Esta función realiza un DELETE físico, pero el trigger
 *       de auditoría guarda el registro en tab_reg_del (soft delete).
 *       Los totales de la cabecera se actualizarán automáticamente.
 * 
 * AUTOR: Sistema DB_Revital SaaS
 * FECHA: Diciembre 2025
 */
CREATE OR REPLACE FUNCTION fun_delete_factura_detalle(
    p_id_detalle tab_facturacion_detalle.id_detalle%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_detalle_existe INTEGER;
    v_id_factura DECIMAL(10,0);
    v_estado_pago enum_estado_pago;
BEGIN
    -- Validación: ID de detalle
    IF p_id_detalle IS NULL OR p_id_detalle <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID del detalle es obligatorio'
        );
    END IF;

    -- Validar que el detalle existe y obtener información de la factura
    SELECT 
        COUNT(*),
        fd.id_factura,
        fc.estado_pago
    INTO 
        v_detalle_existe,
        v_id_factura,
        v_estado_pago
    FROM tab_facturacion_detalle fd
    JOIN tab_facturacion_cabecera fc ON fd.id_factura = fc.id_factura
    WHERE fd.id_detalle = p_id_detalle
    GROUP BY fd.id_factura, fc.estado_pago;

    IF v_detalle_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El detalle no existe'
        );
    END IF;

    -- Advertencia si la factura está pagada
    IF v_estado_pago = 'pagado' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar una línea de una factura que ya está pagada'
        );
    END IF;

    -- Eliminar el detalle (el trigger guardará el registro en tab_reg_del)
    DELETE FROM tab_facturacion_detalle
    WHERE id_detalle = p_id_detalle;

    -- Los totales de la cabecera se actualizarán automáticamente por el trigger

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Línea de detalle eliminada correctamente (soft delete). Los totales de la factura se actualizarán automáticamente.',
            'id_detalle', p_id_detalle,
            'id_factura', v_id_factura
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo eliminar la línea de detalle'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar la línea de detalle: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
