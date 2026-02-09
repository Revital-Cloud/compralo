/*
 * FUNCIÓN: fun_actualizar_pago
 * 
 * DESCRIPCIÓN: Actualiza un registro de pago existente. Se usa típicamente al recibir
 *              una notificación (webhook) del proveedor de pagos.
 * 
 * PARÁMETROS:
 *   - p_provider_payment_id: ID del pago en el proveedor (obligatorio para identificar la transacción)
 *   - p_status: Nuevo estado del pago (approved, rejected, etc.)
 *   - p_status_detail: Detalle del nuevo estado
 *   - p_payment_method_id: Método de pago usado (visa, master, etc.)
 *   - p_payment_type_id: Tipo de pago (credit_card, ticket, etc.)
 *   - p_fee_amount: Comisión del proveedor
 *   - p_net_received_amount: Monto neto recibido
 *   - p_provider_date_approved: Fecha de aprobación del proveedor
 *   - p_raw_response: Respuesta JSON completa del proveedor (para auditoría)
 *   - p_usr_operacion: ID del usuario que procesa la actualización (puede ser un usuario de sistema)
 * 
 * RETORNA: JSON - Resultado de la operación
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_actualizar_pago(
    -- CAMBIO: Usamos el ID de transacción para buscar y actualizar.
    p_provider_transaction_id tab_pagos.provider_transaction_id%TYPE,
    p_status tab_pagos.status%TYPE,
    p_status_detail tab_pagos.status_detail%TYPE,
    -- CAMBIO: Renombramos campos para ser más genéricos, como en la tabla
    p_payment_method_type tab_pagos.payment_method_type%TYPE,
    p_payment_method_extra JSONB,
    p_fee_amount tab_pagos.fee_amount%TYPE,
    p_net_received_amount tab_pagos.net_received_amount%TYPE,
    p_provider_date_approved tab_pagos.provider_date_approved%TYPE,
    p_raw_response JSONB,
    p_usr_operacion tab_usuarios.id_usuario%TYPE
) RETURNS JSON AS $$
DECLARE
    v_updated_rows INT;
BEGIN
    -- VALIDACIONES
    IF p_provider_payment_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'El ID de pago del proveedor es obligatorio.');
    END IF;

    -- ACTUALIZACIÓN
    UPDATE tab_pagos
    SET
        status = p_status,
        status_detail = p_status_detail,
        payment_method_type = p_payment_method_type,
        payment_method_extra = p_payment_method_extra,
        fee_amount = p_fee_amount,
        net_received_amount = p_net_received_amount,
        provider_date_approved = p_provider_date_approved,
        raw_response = p_raw_response,
        estado_procesamiento = CASE WHEN p_status = 'APPROVED' THEN 'procesado' ELSE 'error' END,
        usr_update = p_usr_operacion,
        fec_update = NOW()
    WHERE
        -- Usamos el ID de transacción para encontrar el registro
        provider_transaction_id = p_provider_transaction_id;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    -- RESPUESTA
    IF v_updated_rows = 0 THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'No se encontró un pago con el ID de proveedor especificado.'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Pago actualizado exitosamente.'
    );

EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error inesperado: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql; 