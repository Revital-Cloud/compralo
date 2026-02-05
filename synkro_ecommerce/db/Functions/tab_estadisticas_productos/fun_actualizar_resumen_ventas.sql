/*
 * FUNCIÓN: fun_actualizar_resumen_ventas
 * 
 * DESCRIPCIÓN: Actualiza automáticamente las estadísticas de ventas por producto
 *              en la tabla tab_estadisticas_productos. Calcula métricas completas
 *              incluyendo totales históricos, promedios, tendencias y rotación.
 * 
 * PARÁMETROS:
 *   - p_id_categoria: ID de categoría del producto (opcional)
 *   - p_id_linea: ID de línea del producto (opcional)  
 *   - p_id_sublinea: ID de sublínea del producto (opcional)
 *   - p_id_producto: ID del producto específico (opcional)
 *   - p_recalcular_todo: Si TRUE, recalcula todas las estadísticas (default: FALSE)
 * 
 * LÓGICA:
 *   - Si se especifica producto: actualiza solo ese producto
 *   - Si p_recalcular_todo = TRUE: actualiza todos los productos
 *   - Calcula estadísticas históricas y mensuales
 *   - Determina nivel de rotación automáticamente
 *   - Actualiza información desnormalizada para rendimiento
 * 
 * MÉTRICAS CALCULADAS:
 *   - Total de órdenes y unidades vendidas
 *   - Ingresos totales y promedios
 *   - Estadísticas mensuales (actual vs anterior)
 *   - Fechas de primera y última venta
 *   - Rotación de inventario y nivel
 *   - Tendencias y análisis de rendimiento
 * 
 * RETORNA: JSON con resumen de la actualización:
 *   - success: boolean
 *   - productos_actualizados: integer
 *   - tiempo_procesamiento: interval
 *   - periodo_calculo: string
 * 
 * USO: 
 *   - Llamada desde triggers al completar órdenes
 *   - Procesos batch de actualización
 *   - Mantenimiento de estadísticas
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_actualizar_resumen_ventas(
    p_id_categoria DECIMAL(10) DEFAULT NULL,
    p_id_linea DECIMAL(10) DEFAULT NULL,
    p_id_sublinea DECIMAL(10) DEFAULT NULL,
    p_id_producto DECIMAL(10) DEFAULT NULL,
    p_recalcular_todo BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    v_inicio_proceso TIMESTAMP := NOW();
    v_productos_actualizados INT := 0;
    v_mes_actual VARCHAR(7) := TO_CHAR(NOW(), 'YYYY-MM');
    v_mes_anterior VARCHAR(7) := TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM');
    v_producto_record RECORD;
    v_stats_record RECORD;
    v_total_ventas_sistema DECIMAL(15,2) := 0;
BEGIN
    -- OBTENER: Total de ventas del sistema para calcular participación
    SELECT SUM(o.val_total_pedido) INTO v_total_ventas_sistema
    FROM tab_ordenes o 
    WHERE o.ind_estado IN (2, 3); -- Órdenes pagadas o completadas
    
    v_total_ventas_sistema := COALESCE(v_total_ventas_sistema, 1); -- Evitar división por 0
    
    -- DECIDIR: Qué productos actualizar
    FOR v_producto_record IN 
        SELECT DISTINCT 
            op.id_categoria_producto as id_categoria,
            op.id_linea_producto as id_linea,
            op.id_sublinea_producto as id_sublinea,
            op.id_producto
        FROM tab_orden_productos op
        JOIN tab_ordenes o ON op.id_orden = o.id_orden
        WHERE o.ind_estado IN (2, 3)  -- Órdenes pagadas o completadas
          AND (p_recalcular_todo = TRUE OR (
              p_id_categoria IS NULL OR op.id_categoria_producto = p_id_categoria) AND
              (p_id_linea IS NULL OR op.id_linea_producto = p_id_linea) AND
              (p_id_sublinea IS NULL OR op.id_sublinea_producto = p_id_sublinea) AND
              (p_id_producto IS NULL OR op.id_producto = p_id_producto)
          )
    LOOP
        -- CALCULAR: Estadísticas completas para el producto
        SELECT 
            -- Información básica del producto
            p.nom_producto,
            p.val_precio as precio_actual,
            p.num_stock as stock_actual,
            p.ind_activo as producto_activo,
            
            -- Estadísticas históricas totales
            COUNT(DISTINCT o.id_orden) as total_ordenes,
            COALESCE(SUM(op.cant_producto), 0) as total_unidades_vendidas,
            COALESCE(SUM(op.cant_producto * op.precio_unitario_orden), 0) as total_ingresos,
            
            -- Estadísticas del mes actual
            COALESCE(SUM(CASE 
                WHEN TO_CHAR(o.fec_pedido, 'YYYY-MM') = v_mes_actual 
                THEN op.cant_producto ELSE 0 END), 0) as ventas_mes_actual,
            COALESCE(SUM(CASE 
                WHEN TO_CHAR(o.fec_pedido, 'YYYY-MM') = v_mes_actual 
                THEN op.cant_producto * op.precio_unitario_orden ELSE 0 END), 0) as ingresos_mes_actual,
                
            -- Estadísticas del mes anterior
            COALESCE(SUM(CASE 
                WHEN TO_CHAR(o.fec_pedido, 'YYYY-MM') = v_mes_anterior 
                THEN op.cant_producto ELSE 0 END), 0) as ventas_mes_anterior,
            COALESCE(SUM(CASE 
                WHEN TO_CHAR(o.fec_pedido, 'YYYY-MM') = v_mes_anterior 
                THEN op.cant_producto * op.precio_unitario_orden ELSE 0 END), 0) as ingresos_mes_anterior,
            
            -- Fechas importantes
            MIN(o.fec_pedido)::DATE as fecha_primera_venta,
            MAX(o.fec_pedido)::DATE as fecha_ultima_venta,
            
            -- Precio promedio de venta
            CASE 
                WHEN SUM(op.cant_producto) > 0 
                THEN ROUND(SUM(op.cant_producto * op.precio_unitario_orden) / SUM(op.cant_producto), 2)
                ELSE 0 
            END as precio_promedio_venta,
            
            -- Análisis mensual para promedios
            ROUND(COALESCE(SUM(op.cant_producto), 0) / GREATEST(1, 
                EXTRACT(months FROM AGE(NOW(), MIN(o.fec_pedido)))), 2) as promedio_venta_mensual,
            ROUND(COALESCE(SUM(op.cant_producto * op.precio_unitario_orden), 0) / GREATEST(1, 
                EXTRACT(months FROM AGE(NOW(), MIN(o.fec_pedido)))), 2) as promedio_ingreso_mensual
                
        INTO v_stats_record
        FROM tab_productos p
        LEFT JOIN tab_orden_productos op ON (
            p.id_categoria = op.id_categoria_producto AND
            p.id_linea = op.id_linea_producto AND
            p.id_sublinea = op.id_sublinea_producto AND
            p.id_producto = op.id_producto
        )
        LEFT JOIN tab_ordenes o ON op.id_orden = o.id_orden AND o.ind_estado IN (2, 3)
        WHERE p.id_categoria = v_producto_record.id_categoria
          AND p.id_linea = v_producto_record.id_linea
          AND p.id_sublinea = v_producto_record.id_sublinea
          AND p.id_producto = v_producto_record.id_producto
        GROUP BY p.id_categoria, p.id_linea, p.id_sublinea, p.id_producto, 
                 p.nom_producto, p.val_precio, p.num_stock, p.ind_activo;
        
        -- CALCULAR: Análisis adicionales
        DECLARE
            v_dias_desde_ultima_venta INT;
            v_rotacion_inventario DECIMAL(5,2) := 0;
            v_nivel_rotacion VARCHAR(20);
            v_mejor_mes VARCHAR(7);
            v_mejor_venta_unidades INT := 0;
        BEGIN
            -- Días desde última venta
            IF v_stats_record.fecha_ultima_venta IS NOT NULL THEN
                v_dias_desde_ultima_venta := EXTRACT(days FROM NOW() - v_stats_record.fecha_ultima_venta);
            ELSE
                v_dias_desde_ultima_venta := NULL;
            END IF;
            
            -- Rotación de inventario (ventas anuales / stock promedio)
            IF v_stats_record.stock_actual > 0 AND v_stats_record.promedio_venta_mensual > 0 THEN
                v_rotacion_inventario := ROUND((v_stats_record.promedio_venta_mensual * 12) / v_stats_record.stock_actual, 2);
            END IF;
            
            -- Nivel de rotación
            IF v_stats_record.total_unidades_vendidas = 0 THEN
                v_nivel_rotacion := 'SIN_VENTAS';
            ELSIF v_rotacion_inventario >= 12 THEN
                v_nivel_rotacion := 'ALTA';
            ELSIF v_rotacion_inventario >= 4 THEN
                v_nivel_rotacion := 'MEDIA';
            ELSE
                v_nivel_rotacion := 'BAJA';
            END IF;
            
            -- Encontrar mejor mes de ventas
            SELECT 
                TO_CHAR(o.fec_pedido, 'YYYY-MM'),
                SUM(op.cant_producto)
            INTO v_mejor_mes, v_mejor_venta_unidades
            FROM tab_orden_productos op
            JOIN tab_ordenes o ON op.id_orden = o.id_orden
            WHERE o.ind_estado IN (2, 3)
              AND op.id_categoria_producto = v_producto_record.id_categoria
              AND op.id_linea_producto = v_producto_record.id_linea
              AND op.id_sublinea_producto = v_producto_record.id_sublinea
              AND op.id_producto = v_producto_record.id_producto
            GROUP BY TO_CHAR(o.fec_pedido, 'YYYY-MM')
            ORDER BY SUM(op.cant_producto) DESC
            LIMIT 1;
            
            -- INSERTAR/ACTUALIZAR: Estadísticas del producto
            INSERT INTO tab_estadisticas_productos (
                id_categoria, id_linea, id_sublinea, id_producto,
                nom_producto, precio_actual, stock_actual, producto_activo,
                total_ordenes, total_unidades_vendidas, total_ingresos,
                ventas_mes_actual, ingresos_mes_actual,
                ventas_mes_anterior, ingresos_mes_anterior,
                promedio_venta_mensual, promedio_ingreso_mensual, precio_promedio_venta,
                fecha_primera_venta, fecha_ultima_venta, mes_mejor_venta, mejor_venta_unidades,
                dias_desde_ultima_venta, rotacion_inventario, nivel_rotacion,
                ultima_actualizacion, periodo_calculo
            ) VALUES (
                v_producto_record.id_categoria, v_producto_record.id_linea, 
                v_producto_record.id_sublinea, v_producto_record.id_producto,
                v_stats_record.nom_producto, v_stats_record.precio_actual, 
                v_stats_record.stock_actual, v_stats_record.producto_activo,
                v_stats_record.total_ordenes, v_stats_record.total_unidades_vendidas, 
                v_stats_record.total_ingresos,
                v_stats_record.ventas_mes_actual, v_stats_record.ingresos_mes_actual,
                v_stats_record.ventas_mes_anterior, v_stats_record.ingresos_mes_anterior,
                v_stats_record.promedio_venta_mensual, v_stats_record.promedio_ingreso_mensual, 
                v_stats_record.precio_promedio_venta,
                v_stats_record.fecha_primera_venta, v_stats_record.fecha_ultima_venta, 
                v_mejor_mes, v_mejor_venta_unidades,
                v_dias_desde_ultima_venta, v_rotacion_inventario, v_nivel_rotacion,
                NOW(), v_mes_actual
            )
            ON CONFLICT (id_categoria, id_linea, id_sublinea, id_producto)
            DO UPDATE SET
                nom_producto = EXCLUDED.nom_producto,
                precio_actual = EXCLUDED.precio_actual,
                stock_actual = EXCLUDED.stock_actual,
                producto_activo = EXCLUDED.producto_activo,
                total_ordenes = EXCLUDED.total_ordenes,
                total_unidades_vendidas = EXCLUDED.total_unidades_vendidas,
                total_ingresos = EXCLUDED.total_ingresos,
                ventas_mes_actual = EXCLUDED.ventas_mes_actual,
                ingresos_mes_actual = EXCLUDED.ingresos_mes_actual,
                ventas_mes_anterior = EXCLUDED.ventas_mes_anterior,
                ingresos_mes_anterior = EXCLUDED.ingresos_mes_anterior,
                promedio_venta_mensual = EXCLUDED.promedio_venta_mensual,
                promedio_ingreso_mensual = EXCLUDED.promedio_ingreso_mensual,
                precio_promedio_venta = EXCLUDED.precio_promedio_venta,
                fecha_primera_venta = EXCLUDED.fecha_primera_venta,
                fecha_ultima_venta = EXCLUDED.fecha_ultima_venta,
                mes_mejor_venta = EXCLUDED.mes_mejor_venta,
                mejor_venta_unidades = EXCLUDED.mejor_venta_unidades,
                dias_desde_ultima_venta = EXCLUDED.dias_desde_ultima_venta,
                rotacion_inventario = EXCLUDED.rotacion_inventario,
                nivel_rotacion = EXCLUDED.nivel_rotacion,
                ultima_actualizacion = EXCLUDED.ultima_actualizacion,
                periodo_calculo = EXCLUDED.periodo_calculo;
                
            v_productos_actualizados := v_productos_actualizados + 1;
            
        END;
    END LOOP;
    
    -- RESPUESTA: Resultado de la actualización
    RETURN json_build_object(
        'success', true,
        'productos_actualizados', v_productos_actualizados,
        'tiempo_procesamiento', (NOW() - v_inicio_proceso),
        'periodo_calculo', v_mes_actual,
        'mes_anterior_procesado', v_mes_anterior,
        'timestamp', NOW(),
        'tipo_actualizacion', CASE 
            WHEN p_recalcular_todo THEN 'RECALCULO_COMPLETO'
            WHEN p_id_producto IS NOT NULL THEN 'PRODUCTO_ESPECIFICO'
            ELSE 'INCREMENTAL'
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error al actualizar estadísticas: ' || SQLERRM,
            'productos_actualizados', v_productos_actualizados,
            'tiempo_procesamiento', (NOW() - v_inicio_proceso),
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql; 