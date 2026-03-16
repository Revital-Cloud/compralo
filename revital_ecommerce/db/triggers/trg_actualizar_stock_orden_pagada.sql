/*
 * TRIGGER: trg_actualizar_stock_orden_pagada
 * 
 * DESCRIPCIÓN: Reduce automáticamente el stock de productos cuando una orden
 *              pasa a estado pagada/procesada. Usa la función
 *              fun_actualizar_stock_automatico en modo "orden completa".
 */

DROP TRIGGER IF EXISTS trg_actualizar_stock_orden_pagada ON tab_ordenes;

CREATE TRIGGER trg_actualizar_stock_orden_pagada
    AFTER INSERT OR UPDATE ON tab_ordenes
    FOR EACH ROW
    WHEN (
        NEW.ind_estado IN (2, 3)
        AND (
            TG_OP = 'INSERT'
            OR OLD.ind_estado IS DISTINCT FROM NEW.ind_estado
        )
    )
    EXECUTE FUNCTION fun_actualizar_stock_automatico();