/*
 * TRIGGER: trg_actualizar_stock_orden_pagada
 * 
 * DESCRIPCIÓN: Reduce automáticamente el stock de productos cuando se PAGA una orden.
 *              Usa la función fun_actualizar_stock_automatico en modo "orden completa".
 */

DROP TRIGGER IF EXISTS trg_actualizar_stock_orden_pagada ON tab_ordenes;

CREATE TRIGGER trg_actualizar_stock_orden_pagada
    AFTER INSERT OR UPDATE ON tab_ordenes
    FOR EACH ROW
    WHEN (NEW.ind_estado = 2)
    EXECUTE FUNCTION fun_actualizar_stock_automatico();