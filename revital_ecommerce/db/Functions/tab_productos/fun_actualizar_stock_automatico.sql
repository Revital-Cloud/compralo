/*
 * FUNCIÓN: fun_actualizar_stock_automatico
 *
 * DESCRIPCIÓN: Trigger que reduce el stock de variantes cuando una orden se marca
 *              PROCESADA/PAGADA (estado 2) o cuando se marca directamente como
 *              COMPLETADA (estado 3).
 *              Usa variant_id (combination id) en tab_orden_productos y tab_product_variant_combinations.
 *
 * EFECTOS: Reduce stock en tab_product_variant_combinations; inserta en tab_movimientos_inventario (variant_id).
 */
CREATE OR REPLACE FUNCTION fun_actualizar_stock_automatico()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual INT;
    v_nom_producto VARCHAR;
    v_stock_nuevo INT;
    v_record RECORD;
    v_total INT := 0;
    v_id_orden tab_ordenes.id_orden%TYPE;
    v_usr DECIMAL(10);
BEGIN
    -- Disparar al entrar a "procesada/pagada" (2) o "completada" (3)
    IF NEW.ind_estado NOT IN (2, 3) THEN
        RETURN NULL;
    END IF;
    -- En UPDATE, solo reducir stock si antes no estaba pagada (evitar doble descuento)
    -- (si pasa de 2 -> 3 no debe volver a descontar)
    IF TG_OP = 'UPDATE' AND OLD.ind_estado IN (2, 3) THEN
        RETURN NULL;
    END IF;

    v_id_orden := NEW.id_orden;
    v_usr := COALESCE(NEW.usr_update, 1000000000);

    FOR v_record IN
        SELECT op.id_orden_producto, op.variant_id, op.cant_producto, p.name AS nom_producto
        FROM tab_orden_productos op
        JOIN tab_product_variant_combinations pv ON pv.id = op.variant_id
        JOIN tab_product_variant_groups g ON g.id = pv.group_id
        JOIN tab_products p ON p.id = g.product_id
        WHERE op.id_orden = v_id_orden
    LOOP
        SELECT stock INTO v_stock_actual
        FROM tab_product_variant_combinations
        WHERE id = v_record.variant_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Error: Combinación no encontrada (variant_id %)', v_record.variant_id;
        END IF;

        IF v_stock_actual < v_record.cant_producto THEN
            RAISE EXCEPTION 'Error: Stock insuficiente para %. Stock actual: %, Solicitado: %',
                v_record.nom_producto, v_stock_actual, v_record.cant_producto;
        END IF;

        v_stock_nuevo := v_stock_actual - v_record.cant_producto;

        UPDATE tab_product_variant_combinations
        SET stock = v_stock_nuevo, usr_update = v_usr, fec_update = NOW()
        WHERE id = v_record.variant_id;

        INSERT INTO tab_movimientos_inventario (
            variant_id, tipo_movimiento, cantidad,
            stock_anterior, stock_actual,
            id_orden_usuario_detalle, descripcion, usr_insert
        ) VALUES (
            v_record.variant_id,
            'salida_venta',
            v_record.cant_producto,
            v_stock_actual,
            v_stock_nuevo,
            v_record.id_orden_producto,
            'Venta procesada - Orden #' || v_id_orden || ' - ' || v_record.nom_producto,
            v_usr
        );

        v_total := v_total + 1;
    END LOOP;

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en actualización automática de stock: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
