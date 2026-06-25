/*
 * Funciones de costeo FIFO de inventario.
 *
 * La tabla de lotes (tab_lotes_inventario) y el backfill inicial se definen en
 * migrations/add_fifo_inventory_lots.sql. Aquí están las funciones auxiliares
 * reutilizadas por los triggers de stock (venta, compra a proveedor, devolución).
 *
 *  - fun_consumir_fifo(variant_id, cantidad): consume los lotes más antiguos
 *    primero, bloqueándolos (FOR UPDATE) en orden FIFO, y devuelve el COGS total.
 *    Tolerante a desincronización: si faltan lotes, costea el faltante a 0 y deja
 *    traza (el stock de la combinación es la fuente de verdad de disponibilidad).
 *  - fun_saldo_costo_inventario(variant_id): valor de costo del inventario abierto.
 */

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

CREATE OR REPLACE FUNCTION fun_saldo_costo_inventario(p_variant_id DECIMAL(10))
RETURNS DECIMAL(14, 2) AS $$
    SELECT COALESCE(SUM(cantidad_restante * costo_unitario), 0)::DECIMAL(14, 2)
    FROM tab_lotes_inventario
    WHERE variant_id = p_variant_id;
$$ LANGUAGE sql;
