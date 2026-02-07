/*
 * FUNCIÓN: fun_marcar_orden_completada
 * 
 * DESCRIPCIÓN: Función centralizada para marcar una orden como completada cuando
 *              la empresa de envíos confirma la entrega. Solamente cambia el estado
 *              y ejecuta triggers mínimos necesarios.
 * 
 * PARÁMETROS:
 *   - p_id_orden: ID de la orden a marcar como completada
 *   - p_observaciones: Observaciones de la confirmación (opcional)
 *   - p_usr_operacion: Usuario que confirma la entrega
 * 
 * LÓGICA DE PROCESAMIENTO:
 *   1. Validar que la orden existe y está en estado pagada (2)
 *   2. Verificar que no esté ya completada
 *   3. Marcar orden como completada (estado 3)
 *   4. Los triggers mínimos se ejecutan automáticamente
 * 
 * ESTADOS DE ORDEN:
 *   1 = Pendiente     (orden creada, esperando pago)
 *   2 = Pagada        (pago confirmado, en preparación) ← ESTADO REQUERIDO
 *   3 = Completada    (entrega confirmada)              ← ESTA FUNCIÓN
 * 
 * NOTA: Los procesos críticos (puntos, stock, estadísticas) se ejecutan
 *       en el estado PAGADA, no aquí. Esta función solo confirma entrega.
 * 
 * RETORNA: JSON con resultado:
 *   - success: boolean
 *   - message: string con descripción
 *   - id_orden: integer
 *   - estado_anterior: integer
 *   - estado_actual: integer
 * 
 * CASOS DE USO:
 *   - Confirmación manual de entrega por administrador
 *   - Confirmación automática por sistema de logística
 *   - Confirmación de entrega por atención al cliente
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_marcar_orden_completada(
    p_id_orden tab_ordenes.id_orden%TYPE,
    p_observaciones tab_ordenes.des_observaciones%TYPE,
    p_usr_operacion tab_ordenes.usr_update%TYPE
) RETURNS JSON AS $$
DECLARE
    v_orden_record RECORD;
    v_estado_anterior tab_ordenes.ind_estado%TYPE;
BEGIN
    -- PASO 1: Validar y obtener información de la orden
    SELECT 
        id_orden, id_usuario, ind_estado, val_total_pedido,
        metodo_pago, fec_pedido
    INTO v_orden_record
    FROM tab_ordenes 
    WHERE id_orden = p_id_orden;
    
    -- Verificar que la orden existe
    IF v_orden_record.id_orden IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La orden especificada no existe',
            'id_orden', p_id_orden,
            'codigo_error', 'ORDEN_NO_ENCONTRADA'
        );
    END IF;
    
    v_estado_anterior := v_orden_record.ind_estado;
    
    -- PASO 2: Verificar que la orden esté en estado PAGADA
    IF v_orden_record.ind_estado != 2 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La orden debe estar en estado PAGADA para poder completarse',
            'id_orden', p_id_orden,
            'estado_actual', v_orden_record.ind_estado,
            'estado_requerido', 2,
            'codigo_error', 'ESTADO_INVALIDO'
        );
    END IF;
    
    -- PASO 3: Marcar orden como completada
    UPDATE tab_ordenes 
    SET 
        ind_estado = 3,                              -- Estado COMPLETADA
        des_observaciones = COALESCE(p_observaciones, des_observaciones),
        usr_update = p_usr_operacion,
        fec_update = NOW()
    WHERE id_orden = p_id_orden;
    
    -- PASO 4: Respuesta exitosa
    RETURN json_build_object(
        'success', true,
        'message', 'Orden marcada como completada exitosamente',
        'id_orden', p_id_orden,
        'estado_anterior', v_estado_anterior,
        'estado_actual', 3,
        'usuario_operacion', p_usr_operacion,

        'informacion_orden', json_build_object(
            'id_usuario', v_orden_record.id_usuario,
            'total_pagado', v_orden_record.val_total_pedido,
            'fecha_pedido', v_orden_record.fec_pedido,
            'metodo_pago', v_orden_record.metodo_pago
        ),
        'nota', 'Los procesos críticos (puntos, stock, estadísticas) se ejecutaron cuando se marcó como PAGADA',
        'timestamp', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error al procesar completación de orden: ' || SQLERRM,
            'id_orden', p_id_orden,
            'sql_state', SQLSTATE,
            'codigo_error', 'ERROR_INTERNO'
        );
END;
$$ LANGUAGE plpgsql; 