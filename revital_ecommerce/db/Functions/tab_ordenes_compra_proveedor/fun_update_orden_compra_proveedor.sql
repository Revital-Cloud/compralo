/*
 * FUNCIÓN: fun_update_orden_compra_proveedor
 * 
 * DESCRIPCIÓN: Actualiza un registro existente de orden de compra a proveedor.
 *              Permite modificar cantidades, costos, fechas y estados.
 *              Controla cambios de estado que afectan el stock.
 * 
 * PARÁMETROS:
 *   - p_id_orden_compra: ID de la orden de compra a actualizar
 *   - p_fec_esperada_entrega: Nueva fecha esperada de entrega (opcional)
 *   - p_observaciones_orden: Nuevas observaciones de la orden (opcional)
 *   - p_cantidad_solicitada: Nueva cantidad solicitada (opcional)
 *   - p_cantidad_recibida: Nueva cantidad recibida (opcional)
 *   - p_costo_unitario: Nuevo costo unitario (opcional)
 *   - p_ind_estado_producto: Nuevo estado del producto (opcional)
 *   - p_observaciones_producto: Nuevas observaciones del producto (opcional)
 *   - p_usr_operacion: Usuario que realiza la actualización
 * 
 * RETORNA: JSON con resultado:
 *   - success: boolean
 *   - message: string descriptivo
 *   - cambios_realizados: object con cambios
 *   - estado_anterior: integer
 *   - estado_nuevo: integer
 *   - stock_actualizado: boolean
 * 
 * ESTADOS DEL PRODUCTO:
 *   1 = Solicitado    → No afecta stock
 *   2 = Parcial       → No afecta stock  
 *   3 = Recibido      → ACTUALIZA STOCK (+cantidad_recibida)
 *   4 = Cancelado     → No afecta stock
 * 
 * LÓGICA:
 *   1. Validar que el registro existe
 *   2. Obtener valores actuales
 *   3. Aplicar cambios solo en campos especificados
 *   4. Validar coherencia de datos
 *   5. Actualizar registro
 *   6. Trigger automático actualiza stock si cambia a estado 3
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_orden_compra_proveedor(
    p_id_orden_compra tab_orden_compra_proveedor.id_orden_compra%TYPE,
    p_fec_esperada_entrega tab_orden_compra_proveedor.fec_esperada_entrega%TYPE,
    p_observaciones_orden tab_orden_compra_proveedor.observaciones_orden%TYPE,
    p_cantidad_solicitada tab_orden_compra_proveedor.cantidad_solicitada%TYPE,
    p_cantidad_recibida tab_orden_compra_proveedor.cantidad_recibida%TYPE,
    p_costo_unitario tab_orden_compra_proveedor.costo_unitario%TYPE,
    p_ind_estado_producto tab_orden_compra_proveedor.ind_estado_producto%TYPE,
    p_observaciones_producto tab_orden_compra_proveedor.observaciones_producto%TYPE,
    p_usr_operacion tab_orden_compra_proveedor.usr_update%TYPE
) RETURNS JSON AS $$
DECLARE
    v_registro_actual RECORD;
    v_cambios_realizados JSON := '{}'::JSON;
    v_hay_cambios BOOLEAN := FALSE;
    v_estado_anterior INTEGER;
    v_estado_nuevo INTEGER;
    v_inicio_proceso TIMESTAMP := NOW();
    v_fec_recepcion_completa TIMESTAMP;
BEGIN
    -- VALIDACIÓN 1: Usuario operación obligatorio
    IF p_usr_operacion IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que realiza la operación es obligatorio para auditoría',
            'campo_error', 'usr_operacion'
        );
    END IF;
    
    -- VALIDACIÓN 2: Verificar que el registro existe
    SELECT 
        id_orden_compra, id_proveedor,
        fec_orden_compra, fec_esperada_entrega, observaciones_orden,
        product_id, variant_id,
        cantidad_solicitada, cantidad_recibida, costo_unitario,
        ind_estado_producto, fec_recepcion_completa, observaciones_producto
    INTO v_registro_actual
    FROM tab_orden_compra_proveedor 
    WHERE id_orden_compra = p_id_orden_compra;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se encontró el registro de orden de compra especificado',
            'campo_error', 'id_orden_compra',
            'id_buscado', p_id_orden_compra
        );
    END IF;
    
    -- Guardar estado anterior para comparación
    v_estado_anterior := v_registro_actual.ind_estado_producto;
    v_estado_nuevo := COALESCE(p_ind_estado_producto, v_estado_anterior);
    
    -- VALIDACIONES ESPECÍFICAS
    
    -- Validar fecha esperada de entrega
    IF p_fec_esperada_entrega IS NOT NULL AND p_fec_esperada_entrega < v_registro_actual.fec_orden_compra THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La fecha esperada de entrega no puede ser anterior a la fecha de la orden',
            'campo_error', 'fec_esperada_entrega',
            'fec_orden_compra', v_registro_actual.fec_orden_compra
        );
    END IF;
    
    -- Validar cantidad solicitada
    IF p_cantidad_solicitada IS NOT NULL AND p_cantidad_solicitada <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La cantidad solicitada debe ser mayor a 0',
            'campo_error', 'cantidad_solicitada'
        );
    END IF;
    
    -- Validar cantidad recibida
    IF p_cantidad_recibida IS NOT NULL THEN
        IF p_cantidad_recibida < 0 THEN
            RETURN json_build_object(
                'success', false,
                'message', 'La cantidad recibida no puede ser negativa',
                'campo_error', 'cantidad_recibida'
            );
        END IF;
        
        -- No puede recibir más de lo solicitado
        IF p_cantidad_recibida > COALESCE(p_cantidad_solicitada, v_registro_actual.cantidad_solicitada) THEN
            RETURN json_build_object(
                'success', false,
                'message', 'La cantidad recibida no puede ser mayor a la cantidad solicitada',
                'campo_error', 'cantidad_recibida',
                'cantidad_solicitada', COALESCE(p_cantidad_solicitada, v_registro_actual.cantidad_solicitada)
            );
        END IF;
    END IF;
    
    -- Validar costo unitario
    IF p_costo_unitario IS NOT NULL AND p_costo_unitario <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El costo unitario debe ser mayor a 0',
            'campo_error', 'costo_unitario'
        );
    END IF;
    
    -- Validar estado del producto
    IF p_ind_estado_producto IS NOT NULL AND p_ind_estado_producto NOT BETWEEN 1 AND 4 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El estado del producto debe estar entre 1 (Solicitado) y 4 (Cancelado)',
            'campo_error', 'ind_estado_producto',
            'estados_validos', json_build_object(
                '1', 'Solicitado',
                '2', 'Parcial', 
                '3', 'Recibido',
                '4', 'Cancelado'
            )
        );
    END IF;
    
    -- Determinar fecha de recepción completa
    IF v_estado_nuevo = 3 THEN
        v_fec_recepcion_completa := NOW();
    ELSE
        v_fec_recepcion_completa := NULL;
    END IF;
    
    -- CONSTRUIR JSON DE CAMBIOS
    v_cambios_realizados := json_build_object();
    
    IF p_fec_esperada_entrega IS NOT NULL AND p_fec_esperada_entrega != v_registro_actual.fec_esperada_entrega THEN
        v_cambios_realizados := v_cambios_realizados || json_build_object(
            'fec_esperada_entrega', json_build_object(
                'anterior', v_registro_actual.fec_esperada_entrega,
                'nuevo', p_fec_esperada_entrega
            )
        );
        v_hay_cambios := TRUE;
    END IF;
    
    IF p_cantidad_solicitada IS NOT NULL AND p_cantidad_solicitada != v_registro_actual.cantidad_solicitada THEN
        v_cambios_realizados := v_cambios_realizados || json_build_object(
            'cantidad_solicitada', json_build_object(
                'anterior', v_registro_actual.cantidad_solicitada,
                'nuevo', p_cantidad_solicitada
            )
        );
        v_hay_cambios := TRUE;
    END IF;
    
    IF p_cantidad_recibida IS NOT NULL AND p_cantidad_recibida != v_registro_actual.cantidad_recibida THEN
        v_cambios_realizados := v_cambios_realizados || json_build_object(
            'cantidad_recibida', json_build_object(
                'anterior', v_registro_actual.cantidad_recibida,
                'nuevo', p_cantidad_recibida
            )
        );
        v_hay_cambios := TRUE;
    END IF;
    
    IF p_costo_unitario IS NOT NULL AND p_costo_unitario != v_registro_actual.costo_unitario THEN
        v_cambios_realizados := v_cambios_realizados || json_build_object(
            'costo_unitario', json_build_object(
                'anterior', v_registro_actual.costo_unitario,
                'nuevo', p_costo_unitario
            )
        );
        v_hay_cambios := TRUE;
    END IF;
    
    IF p_ind_estado_producto IS NOT NULL AND p_ind_estado_producto != v_registro_actual.ind_estado_producto THEN
        v_cambios_realizados := v_cambios_realizados || json_build_object(
            'ind_estado_producto', json_build_object(
                'anterior', v_registro_actual.ind_estado_producto,
                'nuevo', p_ind_estado_producto
            )
        );
        v_hay_cambios := TRUE;
    END IF;
    
    -- Verificar si hay cambios
    IF NOT v_hay_cambios AND p_observaciones_orden IS NULL AND p_observaciones_producto IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se especificaron cambios para realizar',
            'registro_actual', json_build_object(
                'id_orden_compra', v_registro_actual.id_orden_compra
            )
        );
    END IF;
    
    -- ACTUALIZACIÓN: Aplicar cambios
    UPDATE tab_orden_compra_proveedor 
    SET 
        fec_esperada_entrega = COALESCE(p_fec_esperada_entrega, fec_esperada_entrega),
        observaciones_orden = COALESCE(p_observaciones_orden, observaciones_orden),
        cantidad_solicitada = COALESCE(p_cantidad_solicitada, cantidad_solicitada),
        cantidad_recibida = COALESCE(p_cantidad_recibida, cantidad_recibida),
        costo_unitario = COALESCE(p_costo_unitario, costo_unitario),
        ind_estado_producto = COALESCE(p_ind_estado_producto, ind_estado_producto),
        fec_recepcion_completa = v_fec_recepcion_completa,
        observaciones_producto = COALESCE(p_observaciones_producto, observaciones_producto),
        usr_update = p_usr_operacion
    WHERE id_orden_compra = p_id_orden_compra;
    
    -- RESULTADO EXITOSO
    RETURN json_build_object(
        'success', true,
        'message', 'Orden de compra a proveedor actualizada exitosamente',
        'id_orden_compra', p_id_orden_compra,
        'cambios_realizados', v_cambios_realizados,
        'estado_anterior', v_estado_anterior,
        'estado_nuevo', v_estado_nuevo,
        'stock_sera_actualizado', (v_estado_anterior != 3 AND v_estado_nuevo = 3),
        'fec_recepcion_completa', v_fec_recepcion_completa,
        'tiempo_procesamiento', (NOW() - v_inicio_proceso),
        'nota_trigger', CASE 
            WHEN v_estado_anterior != 3 AND v_estado_nuevo = 3 
            THEN 'El trigger actualizará automáticamente el stock del producto'
            ELSE 'No se actualizará stock (estado no cambió a Recibido)'
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error inesperado al actualizar orden de compra: ' || SQLERRM,
            'sql_state', SQLSTATE,
            'tiempo_procesamiento', (NOW() - v_inicio_proceso)
        );
END;
$$ LANGUAGE plpgsql; 