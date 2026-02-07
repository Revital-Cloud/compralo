/*
 * FUNCIÓN: fun_update_factura_detalle
 * 
 * DESCRIPCIÓN: Actualiza una línea de detalle de factura existente
 * 
 * PARÁMETROS:
 *   - p_id_detalle: ID del detalle a actualizar (obligatorio)
 *   - p_concepto: Descripción del concepto (opcional)
 *   - p_cantidad: Cantidad (opcional)
 *   - p_precio_unitario: Precio por unidad (opcional)
 *   - p_descuento_linea: Descuento aplicado a esta línea (opcional)
 *   - p_impuesto_linea: Impuestos de esta línea (opcional)
 *   - p_id_plan: ID del plan asociado (opcional)
 *   - p_id_instancia: ID de la instancia asociada (opcional)
 *   - p_metadata_json: Información adicional en JSON (opcional)
 *   - p_usr_update: Usuario que actualiza el registro (obligatorio)
 * 
 * RETORNA: JSON con resultado de la operación
 * 
 * NOTA: Los totales (subtotal_linea, total_linea) se recalculan automáticamente.
 *       Los totales de la cabecera se actualizan automáticamente mediante trigger.
 * 
 * AUTOR: Sistema DB_Revital SaaS
 * FECHA: Diciembre 2025
 */
CREATE OR REPLACE FUNCTION fun_update_factura_detalle(
    p_id_detalle tab_facturacion_detalle.id_detalle%TYPE,
    p_usr_update tab_facturacion_detalle.usr_update%TYPE,
    p_concepto tab_facturacion_detalle.concepto%TYPE DEFAULT NULL,
    p_cantidad tab_facturacion_detalle.cantidad%TYPE DEFAULT NULL,
    p_precio_unitario tab_facturacion_detalle.precio_unitario%TYPE DEFAULT NULL,
    p_descuento_linea tab_facturacion_detalle.descuento_linea%TYPE DEFAULT NULL,
    p_impuesto_linea tab_facturacion_detalle.impuesto_linea%TYPE DEFAULT NULL,
    p_id_plan tab_facturacion_detalle.id_plan%TYPE DEFAULT NULL,
    p_id_instancia tab_facturacion_detalle.id_instancia%TYPE DEFAULT NULL,
    p_metadata_json tab_facturacion_detalle.metadata_json%TYPE DEFAULT NULL
) RETURNS JSON AS
$$
DECLARE
    v_detalle_existe INTEGER;
    v_cantidad_actual DECIMAL(10,2);
    v_precio_actual DECIMAL(10,2);
    v_descuento_actual DECIMAL(10,2);
    v_impuesto_actual DECIMAL(10,2);
    v_subtotal_linea DECIMAL(10,2);
    v_total_linea DECIMAL(10,2);
BEGIN
    -- Validación: ID de detalle
    IF p_id_detalle IS NULL OR p_id_detalle <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID del detalle es obligatorio'
        );
    END IF;

    -- Validación: Usuario
    IF p_usr_update IS NULL OR TRIM(p_usr_update) = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que actualiza el registro es obligatorio'
        );
    END IF;

    -- Validar que el detalle existe y obtener valores actuales
    SELECT COUNT(*), cantidad, precio_unitario, descuento_linea, impuesto_linea
    INTO v_detalle_existe, v_cantidad_actual, v_precio_actual, v_descuento_actual, v_impuesto_actual
    FROM tab_facturacion_detalle
    WHERE id_detalle = p_id_detalle
    GROUP BY cantidad, precio_unitario, descuento_linea, impuesto_linea;

    IF v_detalle_existe = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El detalle no existe'
        );
    END IF;

    -- Usar valores actuales o nuevos
    v_cantidad_actual := COALESCE(p_cantidad, v_cantidad_actual);
    v_precio_actual := COALESCE(p_precio_unitario, v_precio_actual);
    v_descuento_actual := COALESCE(p_descuento_linea, v_descuento_actual, 0);
    v_impuesto_actual := COALESCE(p_impuesto_linea, v_impuesto_actual, 0);

    -- Validar valores
    IF v_cantidad_actual <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La cantidad debe ser mayor a 0'
        );
    END IF;

    IF v_precio_actual <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El precio unitario debe ser mayor a 0'
        );
    END IF;

    -- Recalcular subtotal y total
    v_subtotal_linea := (v_cantidad_actual * v_precio_actual) - v_descuento_actual;
    v_total_linea := v_subtotal_linea + v_impuesto_actual;

    -- Actualizar detalle
    UPDATE tab_facturacion_detalle
    SET 
        concepto = COALESCE(p_concepto, concepto),
        cantidad = v_cantidad_actual,
        precio_unitario = v_precio_actual,
        descuento_linea = v_descuento_actual,
        impuesto_linea = v_impuesto_actual,
        subtotal_linea = v_subtotal_linea,
        total_linea = v_total_linea,
        id_plan = COALESCE(p_id_plan, id_plan),
        id_instancia = COALESCE(p_id_instancia, id_instancia),
        metadata_json = COALESCE(p_metadata_json, metadata_json),
        usr_update = p_usr_update,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_detalle = p_id_detalle;

    -- Los totales de la cabecera se actualizarán automáticamente por el trigger

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Línea de detalle actualizada correctamente',
            'id_detalle', p_id_detalle,
            'subtotal_linea', v_subtotal_linea,
            'total_linea', v_total_linea
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'message', 'No se pudo actualizar la línea de detalle'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al actualizar la línea de detalle: ' || SQLERRM
        );
END;
$$
LANGUAGE plpgsql;
