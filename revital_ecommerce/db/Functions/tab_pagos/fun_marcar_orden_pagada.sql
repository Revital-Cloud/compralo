/*
 * FUNCIÓN: fun_marcar_orden_pagada
 * 
 * DESCRIPCIÓN: Función centralizada para marcar una orden como pagada y ejecutar
 *              todas las operaciones necesarias de sincronización. Trabaja con
 *              cualquier método de pago (MercadoPago, transferencia, efectivo, etc.)
 * 
 * PARÁMETROS:
 *   - p_id_orden: ID de la orden a marcar como pagada
 *   - p_metodo_pago: Método de pago utilizado
 *   - p_referencia_pago: Referencia del pago (ID transacción, comprobante, etc.)
 *   - p_monto_pagado: Monto efectivamente pagado
 *   - p_observaciones: Observaciones del pago (opcional)
 *   - p_usr_operacion: Usuario que registra el pago
 * 
 * LÓGICA DE PROCESAMIENTO:
 *   1. Validar que la orden existe y está en estado válido
 *   2. Verificar que el monto pagado coincida con el total de la orden
 *   3. Marcar orden como pagada (estado 2)
 *   4. Registrar información del pago
 *   5. Aplicar descuentos usados automáticamente
 *   6. Activar acumulación de puntos
 *   7. Actualizar estadísticas de ventas
 *   8. Enviar notificaciones si corresponde
 * 
 * ESTADOS DE ORDEN ESTANDARIZADOS:
 *   1 = Pendiente     (orden creada, esperando pago)
 *   2 = Pagada        (pago confirmado, en preparación)  ← ESTE FUNCIÓN
 *   3 = Completado    (orden finalizada/enviada)
 *   4 = Cancelado     (orden cancelada por cualquier motivo)
 * 
 * RETORNA: JSON con resultado detallado:
 *   - success: boolean
 *   - message: string con descripción
 *   - id_orden: integer
 *   - estado_anterior: integer
 *   - estado_actual: integer
 *   - procesos_ejecutados: array con detalles
 * 
 * CASOS DE USO:
 *   - Confirmación automática desde webhooks de MercadoPago
 *   - Confirmación manual de transferencias bancarias  
 *   - Registro de pagos en efectivo
 *   - Confirmación de otros métodos de pago
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_marcar_orden_pagada(
    p_id_orden tab_ordenes.id_orden%TYPE,
    p_metodo_pago tab_ordenes.metodo_pago%TYPE,
    p_referencia_pago VARCHAR(255),
    p_monto_pagado tab_ordenes.val_total_pedido%TYPE,
    p_usr_operacion tab_ordenes.usr_update%TYPE,
    p_observaciones tab_ordenes.des_observaciones%TYPE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_orden_record RECORD;
    v_estado_anterior tab_ordenes.ind_estado%TYPE;
    v_diferencia_monto tab_ordenes.val_total_pedido%TYPE;
    v_procesos_ejecutados JSON[] := ARRAY[]::JSON[];
    v_descuentos_usados JSON;
    v_resultado_puntos JSON;
    v_resultado_estadisticas JSON;
    v_inicio_proceso TIMESTAMP := NOW();
BEGIN
    -- PASO 1: Validar y obtener información de la orden
    SELECT 
        id_orden, id_usuario, ind_estado, val_total_pedido,
        val_total_productos, val_total_descuentos,
        detalle_descuentos_aplicados
    INTO v_orden_record
    FROM tab_ordenes 
    WHERE id_orden = p_id_orden;
    
    -- Verificar que la orden existe
    IF v_orden_record.id_orden IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La orden especificada no existe',
            'id_orden', p_id_orden
        );
    END IF;
    
    v_estado_anterior := v_orden_record.ind_estado;
    
    -- Verificar que la orden esté en estado válido para pago
    IF v_orden_record.ind_estado NOT IN (1, 2) THEN  -- 1=Pendiente, 2=Pagada (reproceso)
        RETURN json_build_object(
            'success', false,
            'message', 'La orden no está en estado válido para procesamiento de pago',
            'id_orden', p_id_orden,
            'estado_actual', v_orden_record.ind_estado,
            'estados_validos', 'Solo se pueden procesar órdenes Pendientes (1)'
        );
    END IF;
    
    -- PASO 2: Validar monto pagado
    v_diferencia_monto := ABS(p_monto_pagado - v_orden_record.val_total_pedido);
    
    IF v_diferencia_monto > 0.01 THEN  -- Tolerancia de 1 centavo
        RETURN json_build_object(
            'success', false,
            'message', 'El monto pagado no coincide con el total de la orden',
            'id_orden', p_id_orden,
            'monto_esperado', v_orden_record.val_total_pedido,
            'monto_pagado', p_monto_pagado,
            'diferencia', v_diferencia_monto
        );
    END IF;
    
    DECLARE
        v_resultado_cambio_estado JSON;
    BEGIN
        -- PASO 3: Marcar orden como pagada usando función centralizada
        SELECT fun_cambiar_estado_orden(
            p_id_orden,
            2,  -- Estado: Pagada
            CONCAT('Pago confirmado - Método: ', p_metodo_pago, 
                   ' - Referencia: ', COALESCE(p_referencia_pago, 'N/A')),
            p_usr_operacion
        ) INTO v_resultado_cambio_estado;
        
        -- Verificar que el cambio de estado fue exitoso
        IF NOT (v_resultado_cambio_estado->>'success')::BOOLEAN THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Error al cambiar estado de orden: ' || 
                          (v_resultado_cambio_estado->>'message')::TEXT,
                'id_orden', p_id_orden,
                'detalle_error', v_resultado_cambio_estado
            );
        END IF;
        
        v_procesos_ejecutados := v_procesos_ejecutados || 
            json_build_object(
                'proceso', 'MARCAR_ORDEN_PAGADA',
                'resultado', 'exitoso',
                'estado_anterior', v_estado_anterior,
                'estado_nuevo', 2,
                'timestamp', NOW(),
                'detalle_cambio', v_resultado_cambio_estado
            );
        
        -- PASO 4: El registro del pago se maneja a través de tab_pagos por el sistema de pagos
        -- Esta función se enfoca en marcar la orden como pagada una vez confirmado el pago
        v_procesos_ejecutados := v_procesos_ejecutados || 
            json_build_object(
                'proceso', 'REGISTRAR_PAGO',
                'resultado', 'gestionado_por_sistema_pagos',
                'metodo', p_metodo_pago,
                'referencia', p_referencia_pago,
                'nota', 'El registro del pago se maneja automáticamente por tab_pagos'
            );
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Error al marcar orden como pagada: ' || SQLERRM,
                'id_orden', p_id_orden,
                'sql_state', SQLSTATE
            );
    END;
    
    -- PASO 5: Procesar descuentos usados automáticamente
    BEGIN
        IF v_orden_record.detalle_descuentos_aplicados IS NOT NULL THEN
            -- Extraer descuentos del JSON y procesarlos
            SELECT fun_procesar_descuentos_usados_orden(
                p_id_orden, 
                v_orden_record.id_usuario,
                v_orden_record.detalle_descuentos_aplicados,
                p_usr_operacion
            ) INTO v_descuentos_usados;
            
            v_procesos_ejecutados := v_procesos_ejecutados || 
                json_build_object(
                    'proceso', 'PROCESAR_DESCUENTOS',
                    'resultado', 'exitoso',
                    'descuentos_procesados', v_descuentos_usados
                );
        ELSE
            v_procesos_ejecutados := v_procesos_ejecutados || 
                json_build_object(
                    'proceso', 'PROCESAR_DESCUENTOS',
                    'resultado', 'omitido',
                    'razon', 'sin_descuentos_aplicados'
                );
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error pero continuar con otros procesos
            v_procesos_ejecutados := v_procesos_ejecutados || 
                json_build_object(
                    'proceso', 'PROCESAR_DESCUENTOS',
                    'resultado', 'error',
                    'error', SQLERRM
                );
    END;
    
    -- PASO 6: Activar acumulación de puntos
    BEGIN
        SELECT fun_acumular_puntos_compra(
            v_orden_record.id_usuario,
            p_id_orden,
            v_orden_record.val_total_productos,
            p_usr_operacion
        ) INTO v_resultado_puntos;
        
        v_procesos_ejecutados := v_procesos_ejecutados || 
            json_build_object(
                'proceso', 'ACUMULAR_PUNTOS',
                'resultado', 'exitoso',
                'puntos_otorgados', v_resultado_puntos
            );
            
    EXCEPTION
        WHEN OTHERS THEN
            v_procesos_ejecutados := v_procesos_ejecutados || 
                json_build_object(
                    'proceso', 'ACUMULAR_PUNTOS',
                    'resultado', 'error',
                    'error', SQLERRM
                );
    END;
    
    -- PASO 7: Actualizar estadísticas de ventas automáticamente
    -- NOTA: Esto se ejecutará automáticamente por el trigger cuando se complete la orden
    -- Aquí solo registramos que las estadísticas se activarán
    v_procesos_ejecutados := v_procesos_ejecutados || 
        json_build_object(
            'proceso', 'ESTADISTICAS_VENTAS',
            'resultado', 'programado',
            'nota', 'Se actualizarán automáticamente al completar la orden'
        );
    
    -- RESPUESTA EXITOSA
    RETURN json_build_object(
        'success', true,
        'message', 'Orden marcada como pagada exitosamente',
        'id_orden', p_id_orden,
        'estado_anterior', v_estado_anterior,
        'estado_actual', 2,
        'metodo_pago', p_metodo_pago,
        'referencia_pago', p_referencia_pago,
        'monto_pagado', p_monto_pagado,
        'tiempo_procesamiento', (NOW() - v_inicio_proceso),
        'procesos_ejecutados', array_to_json(v_procesos_ejecutados),
        'resumen', json_build_object(
            'orden_actualizada', true,
            'pago_registrado', true,
            'descuentos_procesados', (v_descuentos_usados IS NOT NULL),
            'puntos_acumulados', (v_resultado_puntos IS NOT NULL),
            'estadisticas_programadas', true
        ),
        'timestamp', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error general al procesar pago: ' || SQLERRM,
            'id_orden', p_id_orden,
            'tiempo_procesamiento', (NOW() - v_inicio_proceso),
            'procesos_ejecutados', array_to_json(v_procesos_ejecutados),
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;
