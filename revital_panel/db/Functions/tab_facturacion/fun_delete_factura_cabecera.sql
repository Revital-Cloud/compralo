/*
 * FUNCIÓN: fun_delete_factura_cabecera
 * 
 * DESCRIPCIÓN: Elimina una cabecera de factura (soft delete)
 *              El registro se guarda en tab_reg_del mediante trigger
 *              El detalle se elimina automáticamente por CASCADE
 * 
 * PARÁMETROS:
 *   - p_id_factura: ID de la factura a eliminar (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * NOTA: Esta función realiza un DELETE físico, pero el trigger
 *       de auditoría guarda el registro en tab_reg_del (soft delete).
 *       El detalle se elimina automáticamente por CASCADE.
 * 
 * AUTOR: Sistema DB_Revital SaaS
 * FECHA: Diciembre 2025
 */
CREATE OR REPLACE FUNCTION fun_delete_factura_cabecera(
    p_id_factura tab_facturacion_cabecera.id_factura%TYPE
) RETURNS JSON AS
$$
DECLARE
    v_factura_existe INTEGER;
    v_estado_pago enum_estado_pago;
BEGIN
    -- Validación: ID de factura
    IF p_id_factura IS NULL OR p_id_factura <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID de la factura es obligatorio'
        );
    END IF;

    -- Validar que la factura existe
    SELECT COUNT(*), estado_pago INTO v_factura_existe, v_estado_pago
    FROM tab_facturacion_cabecera
    WHERE id_factura = p_id_factura
    GROUP BY estado_pago;

    IF v_factura_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La factura no existe'
        );
    END IF;

    -- Advertencia si la factura está pagada
    IF v_estado_pago = 'pagado' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede eliminar una factura que ya está pagada. Considere cancelarla o reembolsarla primero.'
        );
    END IF;

    -- Eliminar la cabecera (el trigger guardará el registro en tab_reg_del)
    -- El detalle se eliminará automáticamente por CASCADE
    DELETE FROM tab_facturacion_cabecera
    WHERE id_factura = p_id_factura;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Factura eliminada correctamente (soft delete). El detalle también fue eliminado.',
            'id_factura', p_id_factura
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo eliminar la factura'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al eliminar la factura: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
