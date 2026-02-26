/*
 * FUNCIÓN: fun_obtener_pago
 * 
 * DESCRIPCIÓN: Obtiene la información de un pago a partir del ID de la orden.
 * 
 * PARÁMETROS:
 *   - p_id_orden: ID de la orden en nuestro sistema.
 * 
 * RETORNA: JSON - Un objeto con los detalles del pago o un mensaje de error.
 * 
 * LÓGICA:
 *   1. Busca el pago asociado a la orden.
 *   2. Si lo encuentra, devuelve sus detalles en formato JSON.
 *   3. Si no, devuelve un mensaje indicando que no se encontró.
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_obtener_pago(
    p_id_orden tab_ordenes.id_orden%TYPE
) RETURNS JSON AS $$
DECLARE
    v_pago_info RECORD;
BEGIN
    -- VALIDACIÓN
    IF p_id_orden IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la orden es obligatorio.');
    END IF;

    -- CONSULTA (evitar SELECT *; traer columnas explícitas)
    SELECT 
        id_pago,
        id_orden,
        reference,
        provider_transaction_id,
        provider_name,
        status,
        status_detail,
        amount,
        currency_id,
        installments,
        payment_method_type,
        payment_method_extra,
        fee_amount,
        net_received_amount,
        provider_date_created,
        provider_date_approved,
        raw_response,
        raw_last_event,
        parent_payment_id,
        estado_procesamiento,
        usr_insert,
        fec_insert,
        usr_update,
        fec_update
    INTO v_pago_info
    FROM tab_pagos
    WHERE id_orden = p_id_orden
    ORDER BY fec_insert DESC
    LIMIT 1;

    -- RESPUESTA
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'No se encontró información de pago para la orden especificada.');
    END IF;

    RETURN json_build_object(
        'success', true,
        'pago', row_to_json(v_pago_info)
    );

EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error inesperado: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql; 