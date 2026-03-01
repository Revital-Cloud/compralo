/*
 * FUNCIÓN: fun_acumular_puntos_compra  
 * 
 * DESCRIPCIÓN: Acumula puntos automáticamente cuando un usuario realiza una compra.
 *              Esta función se ejecuta automáticamente via trigger cuando una orden
 *              cambia a estado PAGADA (ind_estado = 2).
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario que realizó la compra (obligatorio)
 *   - p_id_orden: ID de la orden que genera los puntos (obligatorio)
 *   - p_val_total_pedido: Valor ANTES de descuentos para calcular puntos (obligatorio)
 *   - p_usr_operacion: Usuario que realiza la operación para auditoría (obligatorio)
 * 
 * RETORNA: JSON - Objeto con resultado de la operación:
 *   - success: booleano indicando éxito
 *   - message: mensaje descriptivo
 *   - puntos_acumulados: cantidad de puntos otorgados
 *   - saldo_anterior: puntos disponibles antes de la acumulación
 *   - saldo_nuevo: puntos disponibles después de la acumulación
 * 
 * LÓGICA:
 *   1. Validar parámetros de entrada
 *   2. Calcular puntos usando configuración activa
 *   3. Crear/verificar registro de puntos del usuario
 *   4. Actualizar saldo de puntos del usuario
 *   5. Registrar movimiento en historial de puntos
 *   6. Retornar resultado de la operación
 * 
 * DEPENDENCIAS:
 *   - fun_calcular_puntos_por_compra: Para calcular cantidad de puntos
 *   - tab_puntos_usuario: Para actualizar saldo del usuario
 *   - tab_movimientos_puntos: Para registrar historial
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_acumular_puntos_compra(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_id_orden tab_ordenes.id_orden%TYPE,  
    p_val_total_pedido tab_ordenes.val_total_pedido%TYPE,
    p_usr_operacion tab_ordenes.usr_insert%TYPE
) RETURNS JSON AS $$
DECLARE
    -- Variables para cálculo de puntos
    v_puntos_ganados INT;                               -- Puntos calculados por la compra
    v_saldo_anterior INT;                               -- Saldo de puntos antes de acumular
    v_saldo_nuevo INT;                                  -- Saldo de puntos después de acumular
    v_usuario_existe BOOLEAN := FALSE;                  -- Flag para verificar si usuario tiene registro
BEGIN
    -- VALIDACIÓN 1: Usuario obligatorio
    IF p_id_usuario IS NULL OR p_id_usuario <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID de usuario es obligatorio y debe ser mayor a 0'
        );
    END IF;
    
    -- VALIDACIÓN 2: Orden obligatoria
    IF p_id_orden IS NULL OR p_id_orden <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El ID de orden es obligatorio y debe ser mayor a 0'
        );
    END IF;
    
    -- VALIDACIÓN 3: Valor total debe ser positivo
    IF p_val_total_pedido IS NULL OR p_val_total_pedido <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El valor total del pedido debe ser mayor a 0'
        );
    END IF;
    
    -- VALIDACIÓN 4: Usuario operación para auditoría
    IF p_usr_operacion IS NULL OR p_usr_operacion <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El usuario que realiza la operación es obligatorio para auditoría'
        );
    END IF;
    
    -- VALIDACIÓN 5: Verificar que la orden no haya acumulado puntos previamente
    IF EXISTS (
        SELECT 1 FROM tab_movimientos_puntos 
        WHERE id_orden_origen = p_id_orden 
          AND tipo_movimiento = 1  -- tipo 1 = acumulación
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La orden ' || p_id_orden || ' ya tiene puntos acumulados previamente'
        );
    END IF;
    
    -- PASO 1: Calcular puntos ganados por la compra
    BEGIN
        SELECT fun_calcular_puntos_por_compra(p_val_total_pedido) INTO v_puntos_ganados;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Error al calcular puntos: ' || SQLERRM
            );
    END;
    
    -- VERIFICACIÓN: Si no se ganan puntos, no hay nada que hacer
    IF v_puntos_ganados <= 0 THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Compra procesada, pero no genera puntos (valor insuficiente)',
            'puntos_acumulados', 0,
            'saldo_anterior', 0,
            'saldo_nuevo', 0
        );
    END IF;
    
    -- PASO 2: Verificar si el usuario ya tiene registro de puntos
    SELECT 
        CASE WHEN COUNT(1) > 0 THEN TRUE ELSE FALSE END,
        COALESCE(MAX(puntos_disponibles), 0)
    INTO v_usuario_existe, v_saldo_anterior
    FROM tab_puntos_usuario
    WHERE id_usuario = p_id_usuario;
    
    -- PASO 3: Crear o actualizar registro de puntos del usuario
    IF NOT v_usuario_existe THEN
        -- INSERCIÓN: Crear registro inicial para el usuario
        INSERT INTO tab_puntos_usuario (
            id_usuario,
            puntos_disponibles,
            puntos_totales_ganados,
            puntos_totales_canjeados,
            usr_insert
        ) VALUES (
            p_id_usuario,
            v_puntos_ganados,                               -- Puntos disponibles = puntos ganados
            v_puntos_ganados,                               -- Total ganados = puntos ganados
            0,                                              -- Total canjeados = 0 (nuevo usuario)
            p_usr_operacion                               -- Usuario que registra
        );
        
        v_saldo_anterior := 0;                              -- Era un usuario nuevo
        v_saldo_nuevo := v_puntos_ganados;                  -- Su nuevo saldo son los puntos ganados
    ELSE
        -- ACTUALIZACIÓN: Sumar puntos al usuario existente
        UPDATE tab_puntos_usuario 
        SET 
            puntos_disponibles = puntos_disponibles + v_puntos_ganados,
            puntos_totales_ganados = puntos_totales_ganados + v_puntos_ganados,
            usr_update = p_usr_operacion
        WHERE id_usuario = p_id_usuario;
        
        v_saldo_nuevo := v_saldo_anterior + v_puntos_ganados;
    END IF;
    
    -- PASO 4: Registrar movimiento en historial de puntos
    INSERT INTO tab_movimientos_puntos (
        id_usuario,
        tipo_movimiento,                                    -- tipo 1 = acumulación
        cantidad_puntos,                                    -- Positivo para acumulación
        puntos_disponibles_anterior,
        puntos_disponibles_actual,
        id_orden_origen,                                    -- Orden que generó los puntos
        id_descuento_canjeado,                              -- NULL para acumulaciones
        descripcion,
        usr_insert
    ) VALUES (
        p_id_usuario,
        1,                                                  -- tipo 1 = acumulación
        v_puntos_ganados,                                   -- Cantidad positiva
        v_saldo_anterior,                                   -- Saldo antes de la acumulación
        v_saldo_nuevo,                                      -- Saldo después de la acumulación
        p_id_orden,                                         -- Orden origen
        NULL,                                               -- No aplica para acumulaciones
        'Puntos ganados por compra - Orden #' || p_id_orden || ' - Valor base: $' || p_val_total_pedido,
        p_usr_operacion
    );
    
    -- RESPUESTA: Retornar resultado exitoso con información detallada
    RETURN json_build_object(
        'success', true,
        'message', 'Puntos acumulados exitosamente por compra realizada',
        'puntos_acumulados', v_puntos_ganados,
        'saldo_anterior', v_saldo_anterior,
        'saldo_nuevo', v_saldo_nuevo,
        'orden_origen', p_id_orden,
        'valor_compra', p_val_total_pedido
    );

-- MANEJO DE ERRORES: Capturar excepciones no contempladas
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error inesperado al acumular puntos: ' || SQLERRM,
            'detalle', 'Usuario: ' || p_id_usuario || ', Orden: ' || p_id_orden
        );
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- EJEMPLOS DE USO Y PRUEBAS
-- =============================================================

-- Ejemplo 1: Acumular puntos por compra básica
-- SELECT fun_acumular_puntos_compra(1000000001, 1, 5000.00, 1000000000);

-- Ejemplo 2: Verificar que no se dupliquen puntos para la misma orden
-- SELECT fun_acumular_puntos_compra(1000000001, 1, 5000.00, 1000000000);

-- Verificar resultado en tabla de puntos del usuario
-- SELECT id_usuario, puntos_disponibles, puntos_totales_ganados, puntos_totales_canjeados, fec_ultimo_canje
-- FROM tab_puntos_usuario WHERE id_usuario = 1000000001;

-- Verificar movimiento en historial
-- SELECT id_usuario, tipo_movimiento, cantidad_puntos, puntos_disponibles_anterior, puntos_disponibles_actual, id_orden_origen, id_descuento_canjeado, descripcion, fec_insert
-- FROM tab_movimientos_puntos WHERE id_usuario = 1000000001 ORDER BY fec_insert DESC;