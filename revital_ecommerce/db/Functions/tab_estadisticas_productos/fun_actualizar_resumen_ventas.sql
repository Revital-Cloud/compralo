/*
 * Actualiza tab_estadisticas_productos por product_id (modelo products/product_variants).
 * Parámetros: p_id_categoria (opcional), p_id_producto (opcional), p_recalcular_todo.
 */
CREATE OR REPLACE FUNCTION fun_actualizar_resumen_ventas(
    p_id_categoria DECIMAL(10) DEFAULT NULL,
    p_id_producto DECIMAL(10) DEFAULT NULL,
    p_recalcular_todo BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    v_inicio TIMESTAMP := NOW();
    v_productos_actualizados INT := 0;
    v_mes_actual VARCHAR(7) := TO_CHAR(NOW(), 'YYYY-MM');
    v_mes_anterior VARCHAR(7) := TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM');
    v_rec RECORD;
    v_stock_actual INT;
    v_precio_min DECIMAL(12,2);
BEGIN
    FOR v_rec IN
        SELECT DISTINCT p.id AS product_id
        FROM tab_orden_productos op
        JOIN tab_product_variant_combinations pv ON pv.id = op.variant_id
        JOIN tab_product_variant_groups g ON g.id = pv.group_id
        JOIN tab_products p ON p.id = g.product_id
        JOIN tab_ordenes o ON op.id_orden = o.id_orden
        WHERE o.ind_estado IN (2, 3)
          AND (p_recalcular_todo OR (p_id_categoria IS NULL OR p.category_id = p_id_categoria)
               AND (p_id_producto IS NULL OR p.id = p_id_producto))
    LOOP
        SELECT
            p.name,
            (SELECT MIN(c.price) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id AND c.is_active),
            (SELECT COALESCE(SUM(c.stock), 0) FROM tab_product_variant_combinations c JOIN tab_product_variant_groups g ON g.id = c.group_id WHERE g.product_id = p.id AND c.is_active),
            p.is_active,
            COUNT(DISTINCT o.id_orden),
            COALESCE(SUM(op.cant_producto), 0),
            COALESCE(SUM(op.cant_producto * op.precio_unitario_orden), 0),
            COALESCE(SUM(CASE WHEN TO_CHAR(o.fec_pedido, 'YYYY-MM') = v_mes_actual THEN op.cant_producto ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN TO_CHAR(o.fec_pedido, 'YYYY-MM') = v_mes_actual THEN op.cant_producto * op.precio_unitario_orden ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN TO_CHAR(o.fec_pedido, 'YYYY-MM') = v_mes_anterior THEN op.cant_producto ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN TO_CHAR(o.fec_pedido, 'YYYY-MM') = v_mes_anterior THEN op.cant_producto * op.precio_unitario_orden ELSE 0 END), 0),
            MIN(o.fec_pedido)::DATE,
            MAX(o.fec_pedido)::DATE,
            CASE WHEN SUM(op.cant_producto) > 0 THEN ROUND(SUM(op.cant_producto * op.precio_unitario_orden) / SUM(op.cant_producto), 2) ELSE 0 END,
            ROUND(COALESCE(SUM(op.cant_producto), 0) / GREATEST(1, EXTRACT(months FROM AGE(NOW(), MIN(o.fec_pedido)))), 2),
            ROUND(COALESCE(SUM(op.cant_producto * op.precio_unitario_orden), 0) / GREATEST(1, EXTRACT(months FROM AGE(NOW(), MIN(o.fec_pedido)))), 2)
        INTO v_rec.nom_producto, v_precio_min, v_stock_actual, v_rec.producto_activo,
             v_rec.total_ordenes, v_rec.total_unidades_vendidas, v_rec.total_ingresos,
             v_rec.ventas_mes_actual, v_rec.ingresos_mes_actual, v_rec.ventas_mes_anterior, v_rec.ingresos_mes_anterior,
             v_rec.fecha_primera_venta, v_rec.fecha_ultima_venta, v_rec.precio_promedio_venta,
             v_rec.promedio_venta_mensual, v_rec.promedio_ingreso_mensual
        FROM tab_products p
        LEFT JOIN tab_product_variant_groups g ON g.product_id = p.id
        LEFT JOIN tab_product_variant_combinations pv ON pv.group_id = g.id
        LEFT JOIN tab_orden_productos op ON op.variant_id = pv.id
        LEFT JOIN tab_ordenes o ON op.id_orden = o.id_orden AND o.ind_estado IN (2, 3)
        WHERE p.id = v_rec.product_id
        GROUP BY p.id, p.name, p.is_active;

        INSERT INTO tab_estadisticas_productos (
            product_id, nom_producto, precio_actual, stock_actual, producto_activo,
            total_ordenes, total_unidades_vendidas, total_ingresos,
            ventas_mes_actual, ingresos_mes_actual, ventas_mes_anterior, ingresos_mes_anterior,
            promedio_venta_mensual, promedio_ingreso_mensual, precio_promedio_venta,
            fecha_primera_venta, fecha_ultima_venta, mes_mejor_venta, mejor_venta_unidades,
            dias_desde_ultima_venta, rotacion_inventario, nivel_rotacion,
            ultima_actualizacion, periodo_calculo
        ) VALUES (
            v_rec.product_id, v_rec.nom_producto, v_precio_min, v_stock_actual, v_rec.producto_activo,
            v_rec.total_ordenes, v_rec.total_unidades_vendidas, v_rec.total_ingresos,
            v_rec.ventas_mes_actual, v_rec.ingresos_mes_actual, v_rec.ventas_mes_anterior, v_rec.ingresos_mes_anterior,
            v_rec.promedio_venta_mensual, v_rec.promedio_ingreso_mensual, v_rec.precio_promedio_venta,
            v_rec.fecha_primera_venta, v_rec.fecha_ultima_venta, NULL, 0,
            CASE WHEN v_rec.fecha_ultima_venta IS NOT NULL THEN EXTRACT(days FROM NOW() - v_rec.fecha_ultima_venta)::INT ELSE NULL END,
            0, CASE WHEN v_rec.total_unidades_vendidas = 0 THEN 'SIN_VENTAS' ELSE 'MEDIA' END,
            NOW(), v_mes_actual
        )
        ON CONFLICT (product_id) DO UPDATE SET
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
            dias_desde_ultima_venta = EXCLUDED.dias_desde_ultima_venta,
            nivel_rotacion = EXCLUDED.nivel_rotacion,
            ultima_actualizacion = EXCLUDED.ultima_actualizacion,
            periodo_calculo = EXCLUDED.periodo_calculo;

        v_productos_actualizados := v_productos_actualizados + 1;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'productos_actualizados', v_productos_actualizados,
        'tiempo_procesamiento', (NOW() - v_inicio),
        'periodo_calculo', v_mes_actual,
        'timestamp', NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'productos_actualizados', v_productos_actualizados,
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;
