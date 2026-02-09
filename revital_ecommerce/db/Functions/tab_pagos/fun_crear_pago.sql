/*
 * FUNCIÓN: fun_crear_pago
 * 
 * DESCRIPCIÓN: Crea un registro inicial para una transacción de pago.
 *              Guarda la referencia a la orden y los datos iniciales del proveedor.
 * 
 * PARÁMETROS:
 *   - p_id_orden: ID de la orden de nuestro sistema (obligatorio)
 *   - p_provider_name: Nombre del proveedor (ej. 'mercadopago')
 *   - p_provider_preference_id: ID de la preferencia de pago del proveedor
 *   - p_amount: Monto total de la transacción
 *   - p_status: Estado inicial del pago (generalmente 'pending')
 *   - p_usr_operacion: ID del usuario que inicia la operación
 * 
 * RETORNA: JSON - Resultado de la operación, incluyendo el ID del pago creado.
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_crear_pago(
    p_id_orden tab_ordenes.id_orden%TYPE,
    p_provider_name tab_pagos.provider_name%TYPE,
    -- CAMBIO: Usamos el ID de transacción, que es más genérico. Puede ser nulo al inicio.
    p_provider_transaction_id tab_pagos.provider_transaction_id%TYPE,
    p_amount tab_pagos.amount%TYPE,
    p_status tab_pagos.status%TYPE,
    p_usr_operacion tab_usuarios.id_usuario%TYPE
) RETURNS JSON AS $$
DECLARE
    v_id_pago INT;
BEGIN
    -- VALIDACIONES
    IF p_id_orden IS NULL OR p_amount <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'El ID de la orden y un monto válido son requeridos.');
    END IF;

     -- INSERCIÓN ACTUALIZADA
    INSERT INTO tab_pagos (
        id_orden,
        provider_name,
        provider_transaction_id, -- Columna actualizada
        amount,
        status,
        status_detail,
        estado_procesamiento,
        usr_insert,
        fec_insert
    ) VALUES (
        p_id_orden,
        p_provider_name,
        p_provider_transaction_id,
        p_amount,
        p_status,
        'payment_intent_created',
        'pendiente',
        p_usr_operacion,
        NOW()
    ) RETURNING id_pago INTO v_id_pago;

    -- RESPUESTA
    RETURN json_build_object(
        'success', true,
        'message', 'Registro de pago creado exitosamente.',
        'id_pago', v_id_pago
    );

EXCEPTION 
    WHEN foreign_key_violation THEN
        RETURN json_build_object('success', false, 'message', 'La orden especificada no existe.');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error inesperado: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql; 