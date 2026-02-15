/*
 * Triggers para tab_orden_compra_proveedor (modelo products/product_variants).
 * - Validar que product_id existe (y variant_id si se envía).
 * - Al marcar como recibido (estado 3), actualizar stock de la variante y registrar movimiento.
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
            SELECT 1 FROM tab_product_variants
            WHERE id = NEW.variant_id AND product_id = NEW.product_id
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
    v_variant_id DECIMAL(10);
    v_stock_anterior INT;
    v_stock_nuevo INT;
    v_descripcion VARCHAR;
BEGIN
    IF NEW.ind_estado_producto != 3 OR (OLD.ind_estado_producto IS NOT NULL AND OLD.ind_estado_producto = 3) THEN
        RETURN NEW;
    END IF;

    v_variant_id := NEW.variant_id;
    IF v_variant_id IS NULL THEN
        RAISE NOTICE 'Orden compra %: variant_id NULL, no se actualiza stock. Asigne variant_id para actualizar inventario.', NEW.id_orden_compra;
        RETURN NEW;
    END IF;

    SELECT stock INTO v_stock_anterior
    FROM tab_product_variants
    WHERE id = v_variant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variante % no encontrada.', v_variant_id;
    END IF;

    v_stock_nuevo := v_stock_anterior + NEW.cantidad_recibida;

    UPDATE tab_product_variants
    SET stock = v_stock_nuevo, updated_at = NOW()
    WHERE id = v_variant_id;

    v_descripcion := 'Entrada por compra a proveedor - Orden: ' || NEW.id_orden_compra || ' - Variante: ' || v_variant_id;

    INSERT INTO tab_movimientos_inventario (
        variant_id, tipo_movimiento, cantidad, costo_unitario_movimiento,
        stock_anterior, stock_actual, id_orden_compra, descripcion, observaciones, usr_insert
    ) VALUES (
        v_variant_id, 'entrada_compra', NEW.cantidad_recibida, NEW.costo_unitario,
        v_stock_anterior, v_stock_nuevo, NEW.id_orden_compra, v_descripcion,
        'Actualización automática por trigger de compras a proveedores',
        COALESCE(NEW.usr_update, NEW.usr_insert)
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
