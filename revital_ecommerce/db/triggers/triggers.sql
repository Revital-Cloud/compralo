-- =====================================================
-- TRIGGER: Acumular puntos al PAGAR orden
-- =====================================================

/*
 * TRIGGER: trg_orden_acumular_puntos
 * 
 * DESCRIPCIÓN: Se ejecuta cuando se actualiza una orden.
 *              Si la orden se marca como PAGADA, acumula puntos.
 *              Lógica: El usuario ya pagó, por lo tanto ya ganó los puntos.
 */
DROP TRIGGER IF EXISTS trg_orden_acumular_puntos ON tab_ordenes;

CREATE TRIGGER trg_orden_acumular_puntos
    AFTER INSERT OR UPDATE ON tab_ordenes
    FOR EACH ROW
    WHEN (NEW.ind_estado = 2)
    EXECUTE FUNCTION trg_acumular_puntos_orden();

-- =====================================================
-- TRIGGER: Actualizar estadísticas al PAGAR orden
-- =====================================================

/*
 * TRIGGER: trg_actualizar_estadisticas_orden_pagada
 * 
 * DESCRIPCIÓN: Se ejecuta cuando se inserta o actualiza una orden.
 *              Si la orden se marca como PAGADA, actualiza las estadísticas.
 *              Lógica: Las estadísticas se actualizan cuando se confirma la venta (pago).
 */

DROP TRIGGER IF EXISTS trg_actualizar_estadisticas_orden_pagada ON tab_ordenes;

CREATE TRIGGER trg_actualizar_estadisticas_orden_pagada
    AFTER INSERT OR UPDATE OF ind_estado ON tab_ordenes
    FOR EACH ROW
    WHEN (NEW.ind_estado = 2) -- Solo cuando se PAGA la orden
    EXECUTE FUNCTION fun_trigger_actualizar_estadisticas_orden();

-- =====================================================
-- TRIGGER: Actualizar estadísticas por cambios en productos de orden
-- =====================================================

/*
 * TRIGGER: trg_actualizar_estadisticas_cambio_producto_orden
 * 
 * DESCRIPCIÓN: Se ejecuta cuando se modifican productos en órdenes completadas.
 *              Actualiza las estadísticas afectadas por el cambio.
 */
DROP TRIGGER IF EXISTS trg_actualizar_estadisticas_cambio_producto_orden ON tab_orden_productos;

CREATE TRIGGER trg_actualizar_estadisticas_cambio_producto_orden
    AFTER INSERT OR UPDATE OR DELETE ON tab_orden_productos
    FOR EACH ROW
    EXECUTE FUNCTION fun_trigger_actualizar_estadisticas_producto_orden();

-- =====================================================
-- TRIGGER: Actualizar stock al PAGAR orden
-- =====================================================

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


-- =====================================================
-- TRIGGER: Marcar orden pagada al aprobar pago MP
-- =====================================================

/*
 * TRIGGER: trg_marcar_orden_pagada_mercadopago
 * 
 * DESCRIPCIÓN: Se ejecuta cuando se actualiza un pago de MercadoPago.
 *              Si el pago se aprueba, marca automáticamente la orden como pagada.
 */
DROP TRIGGER IF EXISTS trg_marcar_orden_pagada_mercadopago ON tab_pagos;

CREATE TRIGGER trg_marcar_orden_pagada_mercadopago
    AFTER UPDATE OF status ON tab_pagos
    FOR EACH ROW
    WHEN (NEW.status = 'approved') -- Solo cuando se aprueba el pago
    EXECUTE FUNCTION fun_trigger_marcar_orden_pagada_auto();


-- =====================================================
-- TRIGGER: Limpiar carrito al PAGAR orden
-- =====================================================

/*
 * TRIGGER: trg_limpiar_carrito_pagado
 * 
 * DESCRIPCIÓN: Se ejecuta solo cuando se ACTUALIZA una orden a PAGADA (ind_estado = 2).
 *              Limpia el carrito del usuario.
 *              No se usa en INSERT: cuando la orden se crea ya como Pagada (pago Wompi),
 *              fun_crear_orden_desde_carrito copia primero los ítems a tab_orden_productos
 *              y luego limpia el carrito en PASO 12b; si este trigger disparara en INSERT,
 *              vaciaría el carrito antes de copiar y no se insertarían productos en la orden.
 */

DROP TRIGGER IF EXISTS trg_limpiar_carrito_pagado ON tab_ordenes;

CREATE TRIGGER trg_limpiar_carrito_pagado
    AFTER UPDATE ON tab_ordenes
    FOR EACH ROW
    WHEN (OLD.ind_estado IS DISTINCT FROM 2 AND NEW.ind_estado = 2)
    EXECUTE FUNCTION fun_limpiar_carrito_pagado();


DROP TRIGGER IF EXISTS trg_restaurar_stock_cancelacion ON tab_ordenes;


-- =====================================================
-- TRIGGER: Restaurar stock al cancelar orden
-- =====================================================

/*
 * TRIGGER: trg_restaurar_stock_cancelacion
 * 
 * DESCRIPCIÓN: Se ejecuta cuando se actualiza una orden.
 *              Si la orden se marca como cancelada, restaura el stock.
 */
CREATE TRIGGER trg_restaurar_stock_cancelacion
    AFTER UPDATE ON tab_ordenes
    FOR EACH ROW
    WHEN (OLD.ind_estado != 4 AND NEW.ind_estado = 4)  -- Solo cuando cambia a cancelado
    EXECUTE FUNCTION fun_restaurar_stock_cancelacion();


-- =====================================================
-- TRIGGER: Validar producto antes de crear orden de compra a proveedor
-- =====================================================

/*
 * TRIGGER: trg_validar_producto_compra_proveedor
 * 
 * DESCRIPCIÓN: Se ejecuta antes de insertar una orden de compra a proveedor.
 *              Valida que el producto exista antes de crear la orden.
 */
DROP TRIGGER IF EXISTS trg_validar_producto_compra_proveedor ON tab_orden_compra_proveedor;

CREATE TRIGGER trg_validar_producto_compra_proveedor
    BEFORE INSERT ON tab_orden_compra_proveedor
    FOR EACH ROW
    EXECUTE FUNCTION fun_trigger_validar_producto_compra_proveedor();


-- =====================================================
-- TRIGGER: Actualizar stock al recibir productos
-- =====================================================

/*
 * TRIGGER: trg_actualizar_stock_compra_proveedor
 * 
 * DESCRIPCIÓN: Se ejecuta cuando se actualiza el estado de un producto en una orden de compra a proveedor.
 *              Actualiza el stock de los productos recibidos.
 */
DROP TRIGGER IF EXISTS trg_actualizar_stock_compra_proveedor ON tab_orden_compra_proveedor;

CREATE TRIGGER trg_actualizar_stock_compra_proveedor
    AFTER UPDATE OF ind_estado_producto ON tab_orden_compra_proveedor
    FOR EACH ROW
    WHEN (NEW.ind_estado_producto = 3) -- Solo cuando se marca como recibido
    EXECUTE FUNCTION fun_trigger_actualizar_stock_compra_proveedor();