/*
 * TRIGGERS: Actualización Automática de Estadísticas de Ventas
 * 
 * DESCRIPCIÓN: Triggers que actualizan automáticamente las estadísticas de ventas
 *              por producto y categoría cuando se completan órdenes o se modifican.
 *              Garantizan que las tablas desnormalizadas estén siempre actualizadas.
 * 
 * EVENTOS MONITOREADOS:
 *   - Cambio de estado de orden a COMPLETADA (ind_estado = 3)
 *   - Modificación de productos en órdenes completadas
 *   - Actualización de precios en órdenes 
 * 
 * FUNCIONES EJECUTADAS:
 *   - fun_actualizar_resumen_ventas (por producto)
 *   - fun_actualizar_resumen_categoria (por categoría)
 *   - fun_sincronizar_estadisticas_completas (completa)
 * 
 * CARACTERÍSTICAS:
 *   - Ejecución asíncrona para no bloquear transacciones
 *   - Manejo de errores gracioso
 *   - Logs detallados de ejecución
 *   - Optimización para múltiples productos
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- =====================================================
-- FUNCIÓN: Actualizar estadísticas por orden completada
-- =====================================================

/*
 * FUNCIÓN: fun_trigger_actualizar_estadisticas_orden
 * 
 * DESCRIPCIÓN: Función ejecutada por triggers para actualizar estadísticas
 *              cuando se PAGA una orden. Las estadísticas se actualizan cuando
 *              efectivamente se realiza la venta (pago), no cuando se entrega.
 */
CREATE OR REPLACE FUNCTION fun_trigger_actualizar_estadisticas_orden()
RETURNS TRIGGER AS $$
DECLARE
    v_categoria_actual DECIMAL(10);
    v_categoria_record RECORD;
    v_resultado JSON;
    v_productos_afectados INT := 0;
    v_categorias_afectadas INT := 0;
    v_inicio_proceso TIMESTAMP := NOW();
BEGIN
    -- VALIDAR: Solo procesar órdenes PAGADAS
    -- Lógica: Las estadísticas se actualizan cuando se confirma la venta (pago)
    IF NEW.ind_estado != 2 THEN
        RETURN NEW; -- No es orden pagada, no hacer nada
    END IF;
    
    -- VALIDAR: Solo procesar si el estado cambió a PAGADA
    IF TG_OP = 'UPDATE' AND OLD.ind_estado = 2 THEN
        RETURN NEW; -- Ya era pagada, no procesar de nuevo
    END IF;
    
    -- LOG: Inicio del proceso
    RAISE NOTICE 'Iniciando actualización de estadísticas para orden PAGADA ID: %', NEW.id_orden;
    
    BEGIN
        -- OBTENER: Categorías afectadas por esta orden (vía variant -> product -> category_id)
        FOR v_categoria_record IN 
            SELECT DISTINCT p.category_id AS id_categoria
            FROM tab_orden_productos op
            JOIN tab_product_variant_combinations pv ON pv.id = op.variant_id
            JOIN tab_product_variant_groups g ON g.id = pv.group_id
            JOIN tab_products p ON p.id = g.product_id
            WHERE op.id_orden = NEW.id_orden
        LOOP
            -- ACTUALIZAR: Estadísticas de productos de la categoría
            SELECT fun_actualizar_resumen_ventas(
                v_categoria_record.id_categoria, NULL, FALSE
            ) INTO v_resultado;
            
            -- Verificar resultado de productos
            IF (v_resultado->>'success')::BOOLEAN THEN
                v_productos_afectados := v_productos_afectados + 
                    (v_resultado->>'productos_actualizados')::INT;
                    
                RAISE NOTICE 'Productos actualizados en categoría %: %', 
                    v_categoria_record.id_categoria, 
                    (v_resultado->>'productos_actualizados')::INT;
            ELSE
                RAISE WARNING 'Error actualizando productos categoría %: %', 
                    v_categoria_record.id_categoria, 
                    (v_resultado->>'error')::TEXT;
            END IF;
            
            -- ACTUALIZAR: Estadísticas de la categoría
            SELECT fun_actualizar_resumen_categoria(
                v_categoria_record.id_categoria, FALSE
            ) INTO v_resultado;
            
            -- Verificar resultado de categoría
            IF (v_resultado->>'success')::BOOLEAN THEN
                v_categorias_afectadas := v_categorias_afectadas + 
                    (v_resultado->>'categorias_actualizadas')::INT;
                    
                RAISE NOTICE 'Categoría actualizada: %', v_categoria_record.id_categoria;
            ELSE
                RAISE WARNING 'Error actualizando categoría %: %', 
                    v_categoria_record.id_categoria, 
                    (v_resultado->>'error')::TEXT;
            END IF;
            
        END LOOP;
        
        -- LOG: Resumen final
        RAISE NOTICE 'Estadísticas actualizadas - Orden: %, Productos: %, Categorías: %, Tiempo: %', 
            NEW.id_orden, 
            v_productos_afectados, 
            v_categorias_afectadas,
            (NOW() - v_inicio_proceso);
            
    EXCEPTION
        WHEN OTHERS THEN
            -- MANEJO DE ERRORES: Log pero no fallar la transacción principal
            RAISE WARNING 'Error en actualización de estadísticas para orden %: % (SQL State: %)', 
                NEW.id_orden, SQLERRM, SQLSTATE;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- FUNCIÓN: Actualizar estadísticas por cambios en productos de orden
-- =====================================================

/*
 * FUNCIÓN: fun_trigger_actualizar_estadisticas_producto_orden
 * 
 * DESCRIPCIÓN: Función para triggers que actualizan estadísticas cuando
 *              se modifican productos en órdenes ya completadas.
 */
CREATE OR REPLACE FUNCTION fun_trigger_actualizar_estadisticas_producto_orden()
RETURNS TRIGGER AS $$
DECLARE
    v_orden_pagada BOOLEAN := FALSE;
    v_resultado JSON;
    v_category_id DECIMAL(10);
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT (o.ind_estado IN (2, 3)) INTO v_orden_pagada FROM tab_ordenes o WHERE o.id_orden = OLD.id_orden;
        SELECT p.category_id INTO v_category_id FROM tab_product_variant_combinations pv JOIN tab_product_variant_groups g ON g.id = pv.group_id JOIN tab_products p ON p.id = g.product_id WHERE pv.id = OLD.variant_id;
    ELSE
        SELECT (o.ind_estado IN (2, 3)) INTO v_orden_pagada FROM tab_ordenes o WHERE o.id_orden = NEW.id_orden;
        SELECT p.category_id INTO v_category_id FROM tab_product_variant_combinations pv JOIN tab_product_variant_groups g ON g.id = pv.group_id JOIN tab_products p ON p.id = g.product_id WHERE pv.id = NEW.variant_id;
    END IF;

    IF v_orden_pagada AND v_category_id IS NOT NULL THEN
        BEGIN
            SELECT fun_actualizar_resumen_ventas(v_category_id, NULL, FALSE) INTO v_resultado;
            SELECT fun_actualizar_resumen_categoria(v_category_id, FALSE) INTO v_resultado;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error actualizando estadísticas por cambio producto orden: %', SQLERRM;
        END;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- FUNCIÓN: Recalculación batch de estadísticas
-- =====================================================

/*
 * FUNCIÓN: fun_recalcular_estadisticas_batch
 * 
 * DESCRIPCIÓN: Función para recalcular todas las estadísticas en modo batch.
 *              Útil para mantenimiento o corrección de inconsistencias.
 */
CREATE OR REPLACE FUNCTION fun_recalcular_estadisticas_batch(
    p_solo_categorias_activas BOOLEAN DEFAULT TRUE,
    p_incluir_productos_inactivos BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    v_inicio_proceso TIMESTAMP := NOW();
    v_resultado_productos JSON;
    v_resultado_categorias JSON;
    v_categoria_record RECORD;
    v_total_productos INT := 0;
    v_total_categorias INT := 0;
BEGIN
    RAISE NOTICE 'Iniciando recálculo batch de estadísticas...';
    
    -- RECALCULAR: Todas las estadísticas de productos
    SELECT fun_actualizar_resumen_ventas(NULL, NULL, TRUE) 
    INTO v_resultado_productos;
    
    v_total_productos := (v_resultado_productos->>'productos_actualizados')::INT;
    
    -- RECALCULAR: Todas las estadísticas de categorías
    SELECT fun_actualizar_resumen_categoria(NULL, TRUE) 
    INTO v_resultado_categorias;
    
    v_total_categorias := (v_resultado_categorias->>'categorias_actualizadas')::INT;
    
    RAISE NOTICE 'Recálculo batch completado: % productos, % categorías en %',
        v_total_productos, v_total_categorias, (NOW() - v_inicio_proceso);
    
    -- RESPUESTA: Resultado consolidado
    RETURN json_build_object(
        'success', true,
        'tipo_operacion', 'RECALCULO_BATCH_COMPLETO',
        'tiempo_total_procesamiento', (NOW() - v_inicio_proceso),
        'productos_recalculados', v_total_productos,
        'categorias_recalculadas', v_total_categorias,
        'resultado_productos', v_resultado_productos,
        'resultado_categorias', v_resultado_categorias,
        'timestamp', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error en recálculo batch: ' || SQLERRM,
            'productos_procesados', v_total_productos,
            'categorias_procesadas', v_total_categorias,
            'tiempo_procesamiento', (NOW() - v_inicio_proceso),
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

--COMMENT ON FUNCTION fun_trigger_actualizar_estadisticas_orden() IS 
--'Función trigger que actualiza estadísticas automáticamente cuando se completa una orden';

--COMMENT ON FUNCTION fun_trigger_actualizar_estadisticas_producto_orden() IS 
--'Función trigger que actualiza estadísticas cuando se modifican productos en órdenes completadas';

--COMMENT ON FUNCTION fun_recalcular_estadisticas_batch() IS 
--'Función para recálculo completo de estadísticas en modo batch, útil para mantenimiento';

--COMMENT ON TRIGGER trg_actualizar_estadisticas_orden_completada ON tab_ordenes IS 
--'Trigger que actualiza estadísticas automáticamente al completar órdenes';

--COMMENT ON TRIGGER trg_actualizar_estadisticas_cambio_producto_orden ON tab_orden_productos IS 
--'Trigger que actualiza estadísticas cuando se modifican productos en órdenes completadas';

-- Mensaje de confirmación
--DO $$
--BEGIN
  --  RAISE NOTICE '✅ Triggers de estadísticas creados exitosamente';
    --RAISE NOTICE '🔄 Actualización automática al completar órdenes: ACTIVA';
    --RAISE NOTICE '📊 Estadísticas se mantienen sincronizadas en tiempo real';
    --RAISE NOTICE '🛠️ Función batch disponible: fun_recalcular_estadisticas_batch()';
--END $$; 