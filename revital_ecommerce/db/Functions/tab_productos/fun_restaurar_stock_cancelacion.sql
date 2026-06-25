/*
 * Restaura stock de variantes cuando una orden pasa a estado cancelado (ind_estado = 4).
 * Usa tab_orden_productos.variant_id (combination id) y tab_product_variant_combinations.
 *
 * CONCURRENCIA: bloquea la fila de stock (FOR UPDATE) para serializar con ventas/compras.
 * FIFO: las unidades devueltas reingresan como un lote nuevo (capa más reciente) con el
 *       COGS con el que salió la venta, para mantener balanceado el costo de inventario.
 *
 * Requiere: tab_lotes_inventario, fun_saldo_costo_inventario
 *           (ver migrations/add_fifo_inventory_lots.sql).
 */
CREATE OR REPLACE FUNCTION fun_restaurar_stock_cancelacion()
RETURNS TRIGGER AS $$
DECLARE
    v_record       RECORD;
    v_stock_actual INT;
    v_stock_nuevo  INT;
    v_costo        DECIMAL(12, 2);
    v_usr          DECIMAL(10);
    v_saldo_actual DECIMAL(14, 2);
BEGIN
    IF OLD.ind_estado = 4 OR NEW.ind_estado != 4 THEN
        RETURN NULL;
    END IF;

    v_usr := COALESCE(NEW.usr_update, 1000000000);

    FOR v_record IN
        SELECT op.id_orden_producto, op.variant_id, op.cant_producto, p.name AS nom_producto
        FROM tab_orden_productos op
        JOIN tab_product_variant_combinations pv ON pv.id = op.variant_id
        JOIN tab_product_variant_groups g ON g.id = pv.group_id
        JOIN tab_products p ON p.id = g.product_id
        WHERE op.id_orden = NEW.id_orden
    LOOP
        SELECT stock INTO v_stock_actual
        FROM tab_product_variant_combinations
        WHERE id = v_record.variant_id
        FOR UPDATE;

        v_stock_nuevo := v_stock_actual + v_record.cant_producto;

        UPDATE tab_product_variant_combinations
        SET stock = v_stock_nuevo, usr_update = v_usr, fec_update = NOW()
        WHERE id = v_record.variant_id;

        -- Costo de la devolución = COGS con el que salió esa venta.
        SELECT costo_unitario_movimiento INTO v_costo
        FROM tab_movimientos_inventario
        WHERE variant_id = v_record.variant_id
          AND id_orden_usuario_detalle = v_record.id_orden_producto
          AND tipo_movimiento = 'salida_venta'
        ORDER BY id_movimiento DESC
        LIMIT 1;
        v_costo := COALESCE(v_costo, 0);

        INSERT INTO tab_lotes_inventario (
            variant_id, costo_unitario, cantidad_inicial, cantidad_restante, origen, fec_entrada, usr_insert
        ) VALUES (
            v_record.variant_id, v_costo, v_record.cant_producto, v_record.cant_producto,
            'devolucion_usuario', NOW(), v_usr
        );

        v_saldo_actual := fun_saldo_costo_inventario(v_record.variant_id);

        INSERT INTO tab_movimientos_inventario (
            variant_id, tipo_movimiento, cantidad, costo_unitario_movimiento,
            stock_anterior, stock_actual, saldo_costo_total_actual_mov,
            id_orden_usuario_detalle, descripcion, usr_insert
        ) VALUES (
            v_record.variant_id,
            'devolucion_usuario',
            v_record.cant_producto,
            v_costo,
            v_stock_actual,
            v_stock_nuevo,
            v_saldo_actual,
            v_record.id_orden_producto,
            'Devolución por cancelación (FIFO) - Orden #' || NEW.id_orden || ' - ' || v_record.nom_producto,
            v_usr
        );
    END LOOP;

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en restauración de stock para orden #%: %', NEW.id_orden, SQLERRM;
END;
$$ LANGUAGE plpgsql;
