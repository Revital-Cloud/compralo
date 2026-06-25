/*
 * Triggers para tab_orden_compra_proveedor (modelo products/variant_combinations).
 * - Validar que product_id existe (y variant_id pertenece al producto vía combinations).
 * - Al marcar como recibido (estado 3): actualizar stock de la combinación, crear lote
 *   FIFO con el costo de compra y registrar el movimiento.
 *
 * NOTA: la versión previa usaba tab_product_variants (tabla eliminada tras la migración a
 *       variant_groups/combinations), por lo que NO actualizaba stock. Esta versión opera
 *       sobre tab_product_variant_combinations y bloquea la fila (FOR UPDATE) para
 *       serializar compras/ventas concurrentes de la misma variante (FIFO por llegada).
 *
 * Requiere: tab_lotes_inventario, fun_saldo_costo_inventario
 *           (ver migrations/add_fifo_inventory_lots.sql).
 */

CREATE OR REPLACE FUNCTION fun_trigger_validar_producto_compra_proveedor()
RETURNS TRIGGER AS $$
DECLARE
    v_ok BOOLEAN := FALSE;
BEGIN
    IF NEW.product_id IS NULL THEN
        RAISE EXCEPTION 'product_id es obligatorio en tab_orden_compra_proveedor.';
    END IF;

    SELECT EXISTS(SELECT 1 FROM tab_products WHERE id = NEW.product_id) INTO v_ok;
    IF NOT v_ok THEN
        RAISE EXCEPTION 'PRODUCTO_NO_EXISTE: El producto id % no existe en tab_products.', NEW.product_id;
    END IF;

    IF NEW.variant_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1
            FROM tab_product_variant_combinations c
            JOIN tab_product_variant_groups g ON g.id = c.group_id
            WHERE c.id = NEW.variant_id AND g.product_id = NEW.product_id
        ) INTO v_ok;
        IF NOT v_ok THEN
            RAISE EXCEPTION 'Variant_id % no pertenece al product_id %.', NEW.variant_id, NEW.product_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fun_trigger_actualizar_stock_compra_proveedor()
RETURNS TRIGGER AS $$
DECLARE
    v_variant_id     DECIMAL(10);
    v_stock_anterior INT;
    v_stock_nuevo    INT;
    v_saldo_anterior DECIMAL(14, 2);
    v_saldo_nuevo    DECIMAL(14, 2);
    v_usr            DECIMAL(10);
BEGIN
    IF NEW.ind_estado_producto != 3 OR (OLD.ind_estado_producto IS NOT NULL AND OLD.ind_estado_producto = 3) THEN
        RETURN NEW;
    END IF;

    v_variant_id := NEW.variant_id;
    IF v_variant_id IS NULL THEN
        RAISE NOTICE 'Orden compra %: variant_id NULL, no se actualiza stock. Asigne variant_id.', NEW.id_orden_compra;
        RETURN NEW;
    END IF;

    v_usr := COALESCE(NEW.usr_update, NEW.usr_insert);

    -- Bloqueo de fila (serializa con ventas/compras concurrentes de la variante).
    SELECT stock INTO v_stock_anterior
    FROM tab_product_variant_combinations
    WHERE id = v_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Combinación % no encontrada.', v_variant_id;
    END IF;

    v_stock_nuevo := v_stock_anterior + NEW.cantidad_recibida;

    UPDATE tab_product_variant_combinations
    SET stock = v_stock_nuevo, usr_update = v_usr, fec_update = NOW()
    WHERE id = v_variant_id;

    -- Lote FIFO con el costo de compra.
    INSERT INTO tab_lotes_inventario (
        variant_id, costo_unitario, cantidad_inicial, cantidad_restante, origen, id_orden_compra, fec_entrada, usr_insert
    ) VALUES (
        v_variant_id, NEW.costo_unitario, NEW.cantidad_recibida, NEW.cantidad_recibida,
        'entrada_compra', NEW.id_orden_compra, NOW(), v_usr
    );

    v_saldo_nuevo := fun_saldo_costo_inventario(v_variant_id);
    v_saldo_anterior := v_saldo_nuevo - (NEW.cantidad_recibida * NEW.costo_unitario);

    INSERT INTO tab_movimientos_inventario (
        variant_id, tipo_movimiento, cantidad, costo_unitario_movimiento,
        stock_anterior, stock_actual,
        saldo_costo_total_anterior_mov, saldo_costo_total_actual_mov,
        id_orden_compra, descripcion, observaciones, usr_insert
    ) VALUES (
        v_variant_id, 'entrada_compra', NEW.cantidad_recibida, NEW.costo_unitario,
        v_stock_anterior, v_stock_nuevo,
        v_saldo_anterior, v_saldo_nuevo,
        NEW.id_orden_compra,
        'Entrada por compra a proveedor (FIFO) - Orden compra #' || NEW.id_orden_compra || ' - Variante: ' || v_variant_id,
        'Lote FIFO creado automáticamente por trigger de compras',
        v_usr
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_producto_compra_proveedor ON tab_orden_compra_proveedor;
CREATE TRIGGER trg_validar_producto_compra_proveedor
    BEFORE INSERT ON tab_orden_compra_proveedor
    FOR EACH ROW
    EXECUTE FUNCTION fun_trigger_validar_producto_compra_proveedor();

DROP TRIGGER IF EXISTS trg_actualizar_stock_compra_proveedor ON tab_orden_compra_proveedor;
CREATE TRIGGER trg_actualizar_stock_compra_proveedor
    AFTER UPDATE OF ind_estado_producto ON tab_orden_compra_proveedor
    FOR EACH ROW
    WHEN (NEW.ind_estado_producto = 3)
    EXECUTE FUNCTION fun_trigger_actualizar_stock_compra_proveedor();
