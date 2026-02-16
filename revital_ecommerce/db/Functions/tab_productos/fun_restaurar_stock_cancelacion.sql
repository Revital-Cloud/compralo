/*
 * Restaura stock de variantes cuando una orden pasa a estado cancelado (ind_estado = 4).
 * Usa tab_orden_productos.variant_id (combination id) y tab_product_variant_combinations.
 */
CREATE OR REPLACE FUNCTION fun_restaurar_stock_cancelacion()
RETURNS TRIGGER AS $$
DECLARE
    v_record RECORD;
    v_stock_actual INT;
    v_stock_nuevo INT;
    v_count INT := 0;
BEGIN
    IF OLD.ind_estado = 4 OR NEW.ind_estado != 4 THEN
        RETURN NULL;
    END IF;

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
        WHERE id = v_record.variant_id;

        v_stock_nuevo := v_stock_actual + v_record.cant_producto;

        UPDATE tab_product_variant_combinations
        SET stock = v_stock_nuevo, usr_update = COALESCE(NEW.usr_update, 1000000000), fec_update = NOW()
        WHERE id = v_record.variant_id;

        INSERT INTO tab_movimientos_inventario (
            variant_id, tipo_movimiento, cantidad,
            stock_anterior, stock_actual,
            id_orden_usuario_detalle, descripcion, usr_insert
        ) VALUES (
            v_record.variant_id,
            'devolucion_usuario',
            v_record.cant_producto,
            v_stock_actual,
            v_stock_nuevo,
            v_record.id_orden_producto,
            'Devolución por cancelación - Orden #' || NEW.id_orden || ' - ' || v_record.nom_producto,
            COALESCE(NEW.usr_update, 1000000000)
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en restauración de stock para orden #%: %', NEW.id_orden, SQLERRM;
END;
$$ LANGUAGE plpgsql;
