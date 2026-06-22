-- ============================================================================
-- Inventario FIFO + control de concurrencia (anti-sobreventa)
-- ----------------------------------------------------------------------------
-- Objetivo:
--   1) Costeo FIFO real por lotes: cada entrada (compra / inventario inicial /
--      devolución) crea un lote con su costo; cada venta consume los lotes más
--      antiguos primero y registra el COGS (costo de la mercancía vendida).
--   2) Concurrencia FIFO: cuando hay compras o ventas SIMULTÁNEAS sobre la misma
--      variante, las operaciones se serializan por orden de llegada usando
--      bloqueo de fila (SELECT ... FOR UPDATE). El primero que llega bloquea y
--      procesa; el resto espera en cola (FIFO). Evita sobreventa y lost updates.
--
-- Modelo: el stock vivo y vendible está en tab_product_variant_combinations.
--   Los lotes (tab_lotes_inventario) son una capa de costeo sobre esa misma
--   variante. tab_movimientos_inventario ya referencia variant_id -> combinations.
--
-- Reaplicable: usa IF NOT EXISTS / CREATE OR REPLACE. El backfill no duplica.
-- Aplicar tras respaldar:  psql ... -f migrations/add_fifo_inventory_lots.sql
-- ============================================================================

-- 1) Tabla de lotes (capas FIFO) ---------------------------------------------
CREATE TABLE IF NOT EXISTS tab_lotes_inventario (
    id_lote             BIGSERIAL PRIMARY KEY,
    variant_id          DECIMAL(10) NOT NULL REFERENCES tab_product_variant_combinations(id),
    costo_unitario      DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0),
    cantidad_inicial    INT NOT NULL CHECK (cantidad_inicial >= 0),
    cantidad_restante   INT NOT NULL CHECK (cantidad_restante >= 0),
    origen              VARCHAR(30) NOT NULL DEFAULT 'entrada_compra'
                            CHECK (origen IN (
                                'entrada_compra', 'inventario_inicial',
                                'devolucion_usuario', 'ajuste_incremento'
                            )),
    id_orden_compra     DECIMAL(10) NULL REFERENCES tab_orden_compra_proveedor(id_orden_compra),
    fec_entrada         TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_insert          DECIMAL(10) NOT NULL DEFAULT 1000000000,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_lote_restante_le_inicial CHECK (cantidad_restante <= cantidad_inicial)
);

-- Índice para ordenar FIFO y localizar rápido lotes con saldo (cola FIFO).
CREATE INDEX IF NOT EXISTS idx_lotes_fifo
    ON tab_lotes_inventario (variant_id, fec_entrada, id_lote)
    WHERE cantidad_restante > 0;

-- 2) Backfill: lote inicial por variante con stock y sin lotes ----------------
-- Costo histórico desconocido -> 0. A partir de aquí, las compras reales crean
-- lotes con costo y el costeo FIFO será exacto hacia adelante.
INSERT INTO tab_lotes_inventario (
    variant_id, costo_unitario, cantidad_inicial, cantidad_restante, origen, fec_entrada, usr_insert
)
SELECT c.id, 0, c.stock, c.stock, 'inventario_inicial', NOW(), 1000000000
FROM tab_product_variant_combinations c
WHERE c.stock > 0
  AND NOT EXISTS (SELECT 1 FROM tab_lotes_inventario l WHERE l.variant_id = c.id);

-- 3) Consumo FIFO ------------------------------------------------------------
-- Consume p_cantidad unidades de los lotes más antiguos primero y devuelve el
-- COGS total. Bloquea los lotes (FOR UPDATE) en orden FIFO para serializar
-- consumos concurrentes. Tolerante: si los lotes están desincronizados con el
-- stock, costea el faltante a 0 y deja traza (el stock es la fuente de verdad
-- de disponibilidad; no se bloquea la venta por la capa de costeo).
CREATE OR REPLACE FUNCTION fun_consumir_fifo(
    p_variant_id DECIMAL(10),
    p_cantidad   INT
) RETURNS DECIMAL(14, 2) AS $$
DECLARE
    v_restante    INT := p_cantidad;
    v_costo_total DECIMAL(14, 2) := 0;
    v_take        INT;
    v_lote        RECORD;
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RETURN 0;
    END IF;

    FOR v_lote IN
        SELECT id_lote, cantidad_restante, costo_unitario
        FROM tab_lotes_inventario
        WHERE variant_id = p_variant_id AND cantidad_restante > 0
        ORDER BY fec_entrada, id_lote
        FOR UPDATE
    LOOP
        EXIT WHEN v_restante <= 0;
        v_take := LEAST(v_lote.cantidad_restante, v_restante);

        UPDATE tab_lotes_inventario
        SET cantidad_restante = cantidad_restante - v_take
        WHERE id_lote = v_lote.id_lote;

        v_costo_total := v_costo_total + (v_take * v_lote.costo_unitario);
        v_restante := v_restante - v_take;
    END LOOP;

    IF v_restante > 0 THEN
        RAISE NOTICE 'FIFO: lotes insuficientes para variante % (faltan % uds); faltante costeado a 0.',
            p_variant_id, v_restante;
    END IF;

    RETURN v_costo_total;
END;
$$ LANGUAGE plpgsql;

-- Saldo de costo de inventario (suma de lotes abiertos) de una variante.
CREATE OR REPLACE FUNCTION fun_saldo_costo_inventario(p_variant_id DECIMAL(10))
RETURNS DECIMAL(14, 2) AS $$
    SELECT COALESCE(SUM(cantidad_restante * costo_unitario), 0)::DECIMAL(14, 2)
    FROM tab_lotes_inventario
    WHERE variant_id = p_variant_id;
$$ LANGUAGE sql;

-- 4) Venta: descuento de stock con bloqueo FIFO + COGS por lotes -------------
CREATE OR REPLACE FUNCTION fun_actualizar_stock_automatico()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual  INT;
    v_stock_nuevo   INT;
    v_record        RECORD;
    v_id_orden      tab_ordenes.id_orden%TYPE;
    v_usr           DECIMAL(10);
    v_cogs_total    DECIMAL(14, 2);
    v_cogs_unit     DECIMAL(12, 2);
    v_saldo_actual  DECIMAL(14, 2);
BEGIN
    -- Disparar al entrar a "procesada/pagada" (2) o "completada" (3)
    IF NEW.ind_estado NOT IN (2, 3) THEN
        RETURN NULL;
    END IF;
    -- En UPDATE, solo descontar si antes no estaba pagada (evitar doble descuento)
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
        -- Bloqueo de fila: serializa ventas/compras concurrentes de esta variante
        -- en orden de llegada (FIFO). El segundo proceso espera a que el primero
        -- confirme, leyendo siempre el stock más reciente -> sin sobreventa.
        SELECT stock INTO v_stock_actual
        FROM tab_product_variant_combinations
        WHERE id = v_record.variant_id
        FOR UPDATE;

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

        -- Consumo FIFO de lotes -> COGS de esta línea de venta.
        v_cogs_total := fun_consumir_fifo(v_record.variant_id, v_record.cant_producto);
        v_cogs_unit := CASE
            WHEN v_record.cant_producto > 0 THEN ROUND(v_cogs_total / v_record.cant_producto, 2)
            ELSE 0 END;
        v_saldo_actual := fun_saldo_costo_inventario(v_record.variant_id);

        INSERT INTO tab_movimientos_inventario (
            variant_id, tipo_movimiento, cantidad, costo_unitario_movimiento,
            stock_anterior, stock_actual,
            saldo_costo_total_anterior_mov, saldo_costo_total_actual_mov,
            id_orden_usuario_detalle, descripcion, usr_insert
        ) VALUES (
            v_record.variant_id,
            'salida_venta',
            v_record.cant_producto,
            v_cogs_unit,
            v_stock_actual,
            v_stock_nuevo,
            v_saldo_actual + v_cogs_total,
            v_saldo_actual,
            v_record.id_orden_producto,
            'Venta procesada (FIFO) - Orden #' || v_id_orden || ' - ' || v_record.nom_producto,
            v_usr
        );
    END LOOP;

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en actualización automática de stock: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 5) Cancelación: devolución de stock con bloqueo + lote de devolución -------
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

        -- Costo de la devolución = COGS con el que salió esa venta (balancea costo).
        SELECT costo_unitario_movimiento INTO v_costo
        FROM tab_movimientos_inventario
        WHERE variant_id = v_record.variant_id
          AND id_orden_usuario_detalle = v_record.id_orden_producto
          AND tipo_movimiento = 'salida_venta'
        ORDER BY id_movimiento DESC
        LIMIT 1;
        v_costo := COALESCE(v_costo, 0);

        -- Reingresa como lote nuevo (capa más reciente).
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

-- 6) Compra a proveedor: entrada de stock -> crea lote FIFO ------------------
-- Reescritura: el trigger anterior usaba tab_product_variants (tabla eliminada
-- tras la migración a combinations) y por eso no actualizaba stock. Ahora opera
-- sobre tab_product_variant_combinations, bloquea la fila y crea el lote.
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

-- Triggers (recrear para asegurar binding a las funciones nuevas) ------------
DROP TRIGGER IF EXISTS trg_actualizar_stock_orden_pagada ON tab_ordenes;
CREATE TRIGGER trg_actualizar_stock_orden_pagada
    AFTER INSERT OR UPDATE ON tab_ordenes
    FOR EACH ROW
    EXECUTE FUNCTION fun_actualizar_stock_automatico();

DROP TRIGGER IF EXISTS trg_restaurar_stock_cancelacion ON tab_ordenes;
CREATE TRIGGER trg_restaurar_stock_cancelacion
    AFTER UPDATE ON tab_ordenes
    FOR EACH ROW
    EXECUTE FUNCTION fun_restaurar_stock_cancelacion();

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
