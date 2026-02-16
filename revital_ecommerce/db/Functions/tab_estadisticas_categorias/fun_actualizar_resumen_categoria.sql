/*
 * FUNCIÓN: fun_actualizar_resumen_categoria
 * 
 * DESCRIPCIÓN: Actualiza automáticamente las estadísticas agregadas de ventas por categoría
 *              en la tabla tab_estadisticas_categorias. Consolida métricas de todos los
 *              productos de la categoría y calcula análisis de participación y tendencias.
 * 
 * PARÁMETROS:
 *   - p_id_categoria: ID de la categoría específica (opcional)
 *   - p_recalcular_todo: Si TRUE, recalcula todas las categorías (default: FALSE)
 * 
 * LÓGICA:
 *   - Si se especifica categoría: actualiza solo esa categoría
 *   - Si p_recalcular_todo = TRUE: actualiza todas las categorías
 *   - Agrega estadísticas de productos de la categoría
 *   - Calcula participación en ventas totales del sistema
 *   - Identifica productos top de la categoría
 *   - Calcula crecimiento y tendencias mensuales
 * 
 * MÉTRICAS CALCULADAS:
 *   - Agregación de productos (total, activos, con ventas)
 *   - Suma de órdenes, unidades e ingresos
 *   - Estadísticas mensuales comparativas
 *   - Participación en ventas totales
 *   - Productos destacados de la categoría
 *   - Análisis de crecimiento y tendencias
 * 
 * RETORNA: JSON con resumen de la actualización:
 *   - success: boolean
 *   - categorias_actualizadas: integer
 *   - tiempo_procesamiento: interval
 *   - periodo_calculo: string
 * 
 * USO: 
 *   - Llamada desde triggers al completar órdenes
 *   - Procesos batch de análisis categorial
 *   - Mantenimiento de estadísticas agregadas
 * 
 * DEPENDENCIAS:
 *   - tab_estadisticas_productos debe estar actualizada
 *   - Funciona mejor si se ejecuta después de fun_actualizar_resumen_ventas
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_actualizar_resumen_categoria(
    p_id_categoria DECIMAL(10) DEFAULT NULL,
    p_recalcular_todo BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    v_inicio_proceso TIMESTAMP := NOW();
    v_categorias_actualizadas INT := 0;
    v_mes_actual VARCHAR(7) := TO_CHAR(NOW(), 'YYYY-MM');
    v_mes_anterior VARCHAR(7) := TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM');
    v_categoria_record RECORD;
    v_stats_record RECORD;
    v_total_ventas_sistema DECIMAL(15,2) := 0;
    v_top_productos RECORD;
BEGIN
    -- OBTENER: Total de ventas del sistema para calcular participación
    SELECT SUM(o.val_total_pedido) INTO v_total_ventas_sistema
    FROM tab_ordenes o 
    WHERE o.ind_estado IN (2, 3); -- Órdenes pagadas o completadas
    
    v_total_ventas_sistema := COALESCE(v_total_ventas_sistema, 1); -- Evitar división por 0
    
    -- DECIDIR: Qué categorías actualizar (tabla categories)
    FOR v_categoria_record IN 
        SELECT DISTINCT c.id AS id_categoria
        FROM tab_categories c
        WHERE c.is_active = TRUE
          AND (p_recalcular_todo = TRUE OR 
               p_id_categoria IS NULL OR 
               c.id = p_id_categoria)
    LOOP
        -- CALCULAR: Estadísticas completas para la categoría
        SELECT 
            c.name AS nom_categoria,
            c.is_active AS categoria_activa,
            COUNT(p.id) AS total_productos,
            COUNT(CASE WHEN p.is_active THEN 1 END) AS productos_activos,
            COUNT(CASE WHEN ep.total_unidades_vendidas > 0 THEN 1 END) AS productos_con_ventas,
            COALESCE(SUM(ep.total_ordenes), 0) AS total_ordenes,
            COALESCE(SUM(ep.total_unidades_vendidas), 0) AS total_unidades_vendidas,
            COALESCE(SUM(ep.total_ingresos), 0) AS total_ingresos,
            COALESCE(SUM(ep.ventas_mes_actual), 0) AS ventas_mes_actual,
            COALESCE(SUM(ep.ingresos_mes_actual), 0) AS ingresos_mes_actual,
            COALESCE(SUM(ep.ventas_mes_anterior), 0) AS ventas_mes_anterior,
            COALESCE(SUM(ep.ingresos_mes_anterior), 0) AS ingresos_mes_anterior,
            MIN(ep.fecha_primera_venta) AS fecha_primera_venta,
            MAX(ep.fecha_ultima_venta) AS fecha_ultima_venta,
            CASE WHEN COUNT(p.id) > 0 THEN ROUND(AVG(ep.precio_actual), 2) ELSE 0 END AS precio_promedio_categoria
        INTO v_stats_record
        FROM tab_categories c
        LEFT JOIN tab_products p ON p.category_id = c.id
        LEFT JOIN tab_estadisticas_productos ep ON ep.product_id = p.id
        WHERE c.id = v_categoria_record.id_categoria
        GROUP BY c.id, c.name, c.is_active;
        
        -- CALCULAR: Análisis adicionales y productos top
        DECLARE
            v_participacion_ventas DECIMAL(5,2) := 0;
            v_crecimiento_mensual DECIMAL(5,2) := 0;
            v_producto_mas_vendido VARCHAR(255);
            v_producto_mayor_ingreso VARCHAR(255);
            v_unidades_top_producto INT := 0;
            v_mejor_mes_ventas VARCHAR(7);
        BEGIN
            -- Participación en ventas totales
            IF v_total_ventas_sistema > 0 AND v_stats_record.total_ingresos > 0 THEN
                v_participacion_ventas := ROUND((v_stats_record.total_ingresos / v_total_ventas_sistema) * 100, 2);
            END IF;
            
            -- Crecimiento mensual
            IF v_stats_record.ingresos_mes_anterior > 0 THEN
                v_crecimiento_mensual := ROUND(
                    ((v_stats_record.ingresos_mes_actual - v_stats_record.ingresos_mes_anterior) / 
                     v_stats_record.ingresos_mes_anterior) * 100, 2);
            ELSIF v_stats_record.ingresos_mes_actual > 0 THEN
                v_crecimiento_mensual := 100; -- Nuevo crecimiento desde 0
            END IF;
            
            -- Producto más vendido por unidades (products con category_id)
            SELECT ep.nom_producto, ep.total_unidades_vendidas
            INTO v_producto_mas_vendido, v_unidades_top_producto
            FROM tab_estadisticas_productos ep
            JOIN tab_products p ON p.id = ep.product_id AND p.category_id = v_categoria_record.id_categoria
            WHERE ep.total_unidades_vendidas > 0
            ORDER BY ep.total_unidades_vendidas DESC
            LIMIT 1;
            
            -- Producto que genera más ingresos
            SELECT ep.nom_producto INTO v_producto_mayor_ingreso
            FROM tab_estadisticas_productos ep
            JOIN tab_products p ON p.id = ep.product_id AND p.category_id = v_categoria_record.id_categoria
            WHERE ep.total_ingresos > 0
            ORDER BY ep.total_ingresos DESC LIMIT 1;
            
            -- Mejor mes de ventas de la categoría (vía variant -> product -> category_id)
            SELECT TO_CHAR(o.fec_pedido, 'YYYY-MM') INTO v_mejor_mes_ventas
            FROM tab_orden_productos op
            JOIN tab_product_variant_combinations pv ON pv.id = op.variant_id
            JOIN tab_product_variant_groups g ON g.id = pv.group_id
            JOIN tab_products p ON p.id = g.product_id AND p.category_id = v_categoria_record.id_categoria
            JOIN tab_ordenes o ON op.id_orden = o.id_orden
            WHERE o.ind_estado IN (2, 3)
            GROUP BY TO_CHAR(o.fec_pedido, 'YYYY-MM')
            ORDER BY SUM(op.cant_producto * op.precio_unitario_orden) DESC LIMIT 1;
            
            -- INSERTAR/ACTUALIZAR: tab_estadisticas_categorias (category_id)
            INSERT INTO tab_estadisticas_categorias (
                category_id,
                nom_categoria,
                categoria_activa,
                total_productos,
                productos_activos,
                productos_con_ventas,
                total_ordenes,
                total_unidades_vendidas,
                total_ingresos,
                ventas_mes_actual,
                ingresos_mes_actual,
                ventas_mes_anterior,
                ingresos_mes_anterior,
                participacion_ventas,
                crecimiento_mensual,
                precio_promedio_categoria,
                producto_mas_vendido,
                producto_mayor_ingreso,
                unidades_top_producto,
                fecha_primera_venta,
                fecha_ultima_venta,
                mejor_mes_ventas,
                ultima_actualizacion,
                periodo_calculo
            ) VALUES (
                v_categoria_record.id_categoria,
                v_stats_record.nom_categoria,
                v_stats_record.categoria_activa,
                v_stats_record.total_productos,
                v_stats_record.productos_activos,
                v_stats_record.productos_con_ventas,
                v_stats_record.total_ordenes,
                v_stats_record.total_unidades_vendidas,
                v_stats_record.total_ingresos,
                v_stats_record.ventas_mes_actual,
                v_stats_record.ingresos_mes_actual,
                v_stats_record.ventas_mes_anterior,
                v_stats_record.ingresos_mes_anterior,
                v_participacion_ventas,
                v_crecimiento_mensual,
                v_stats_record.precio_promedio_categoria,
                v_producto_mas_vendido,
                v_producto_mayor_ingreso,
                v_unidades_top_producto,
                v_stats_record.fecha_primera_venta,
                v_stats_record.fecha_ultima_venta,
                v_mejor_mes_ventas,
                NOW(),
                v_mes_actual
            )
            ON CONFLICT (category_id)
            DO UPDATE SET
                nom_categoria = EXCLUDED.nom_categoria,
                categoria_activa = EXCLUDED.categoria_activa,
                total_productos = EXCLUDED.total_productos,
                productos_activos = EXCLUDED.productos_activos,
                productos_con_ventas = EXCLUDED.productos_con_ventas,
                total_ordenes = EXCLUDED.total_ordenes,
                total_unidades_vendidas = EXCLUDED.total_unidades_vendidas,
                total_ingresos = EXCLUDED.total_ingresos,
                ventas_mes_actual = EXCLUDED.ventas_mes_actual,
                ingresos_mes_actual = EXCLUDED.ingresos_mes_actual,
                ventas_mes_anterior = EXCLUDED.ventas_mes_anterior,
                ingresos_mes_anterior = EXCLUDED.ingresos_mes_anterior,
                participacion_ventas = EXCLUDED.participacion_ventas,
                crecimiento_mensual = EXCLUDED.crecimiento_mensual,
                precio_promedio_categoria = EXCLUDED.precio_promedio_categoria,
                producto_mas_vendido = EXCLUDED.producto_mas_vendido,
                producto_mayor_ingreso = EXCLUDED.producto_mayor_ingreso,
                unidades_top_producto = EXCLUDED.unidades_top_producto,
                fecha_primera_venta = EXCLUDED.fecha_primera_venta,
                fecha_ultima_venta = EXCLUDED.fecha_ultima_venta,
                mejor_mes_ventas = EXCLUDED.mejor_mes_ventas,
                ultima_actualizacion = EXCLUDED.ultima_actualizacion,
                periodo_calculo = EXCLUDED.periodo_calculo;
                
            v_categorias_actualizadas := v_categorias_actualizadas + 1;
            
        END;
    END LOOP;
    
    -- RESPUESTA: Resultado de la actualización
    RETURN json_build_object(
        'success', true,
        'categorias_actualizadas', v_categorias_actualizadas,
        'tiempo_procesamiento', (NOW() - v_inicio_proceso),
        'periodo_calculo', v_mes_actual,
        'mes_anterior_procesado', v_mes_anterior,
        'total_ventas_sistema', v_total_ventas_sistema,
        'timestamp', NOW(),
        'tipo_actualizacion', CASE 
            WHEN p_recalcular_todo THEN 'RECALCULO_COMPLETO'
            WHEN p_id_categoria IS NOT NULL THEN 'CATEGORIA_ESPECIFICA'
            ELSE 'INCREMENTAL'
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error al actualizar estadísticas de categoría: ' || SQLERRM,
            'categorias_actualizadas', v_categorias_actualizadas,
            'tiempo_procesamiento', (NOW() - v_inicio_proceso),
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN AUXILIAR: fun_sincronizar_estadisticas_completas
-- =====================================================

/*
 * FUNCIÓN: fun_sincronizar_estadisticas_completas
 * 
 * DESCRIPCIÓN: Función auxiliar que actualiza tanto estadísticas de productos
 *              como de categorías en secuencia optimizada.
 * 
 * PARÁMETROS:
 *   - p_id_categoria: ID de categoría (opcional)
 *   - p_forzar_recalculo: Si TRUE, fuerza recálculo completo
 * 
 * RETORNA: JSON con resumen completo de ambas actualizaciones
 */
CREATE OR REPLACE FUNCTION fun_sincronizar_estadisticas_completas(
    p_id_categoria DECIMAL(10) DEFAULT NULL,
    p_forzar_recalculo BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    v_inicio_proceso TIMESTAMP := NOW();
    v_resultado_productos JSON;
    v_resultado_categorias JSON;
    v_productos_actualizados INT := 0;
    v_categorias_actualizadas INT := 0;
BEGIN
    -- PASO 1: Actualizar estadísticas de productos
    SELECT fun_actualizar_resumen_ventas(
        p_id_categoria, NULL, p_forzar_recalculo
    ) INTO v_resultado_productos;
    
    -- Extraer contador de productos actualizados
    v_productos_actualizados := (v_resultado_productos->>'productos_actualizados')::INT;
    
    -- PASO 2: Actualizar estadísticas de categorías
    SELECT fun_actualizar_resumen_categoria(
        p_id_categoria, p_forzar_recalculo
    ) INTO v_resultado_categorias;
    
    -- Extraer contador de categorías actualizadas
    v_categorias_actualizadas := (v_resultado_categorias->>'categorias_actualizadas')::INT;
    
    -- RESPUESTA: Resultado consolidado
    RETURN json_build_object(
        'success', true,
        'tipo_sincronizacion', CASE 
            WHEN p_forzar_recalculo THEN 'RECALCULO_FORZADO'
            WHEN p_id_categoria IS NOT NULL THEN 'CATEGORIA_ESPECIFICA'
            ELSE 'SINCRONIZACION_COMPLETA'
        END,
        'tiempo_total_procesamiento', (NOW() - v_inicio_proceso),
        'productos_actualizados', v_productos_actualizados,
        'categorias_actualizadas', v_categorias_actualizadas,
        'resultado_productos', v_resultado_productos,
        'resultado_categorias', v_resultado_categorias,
        'timestamp', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error en sincronización completa: ' || SQLERRM,
            'productos_actualizados', v_productos_actualizados,
            'categorias_actualizadas', v_categorias_actualizadas,
            'tiempo_procesamiento', (NOW() - v_inicio_proceso),
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql; 