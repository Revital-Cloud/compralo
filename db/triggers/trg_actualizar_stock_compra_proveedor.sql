/*
 * TRIGGER: trg_actualizar_stock_compra_proveedor
 * 
 * DESCRIPCIÓN: Trigger que se ejecuta al insertar o actualizar registros en
 *              tab_orden_compra_proveedor para:
 *              1. Validar que el producto existe antes de insertar
 *              2. Si el producto no existe, sugerir crearlo con fun_insert_producto
 *              3. Actualizar automáticamente el stock cuando se marca como recibido
 * 
 * EVENTOS:
 *   - BEFORE INSERT: Valida que el producto existe
 *   - AFTER UPDATE: Actualiza stock cuando cambia a estado 3 (Recibido)
 * 
 * LÓGICA DE ACTUALIZACIÓN DE STOCK:
 *   - Solo cuando ind_estado_producto cambia a 3 (Recibido)
 *   - Suma la cantidad_recibida al num_stock del producto
 *   - Registra movimiento en tab_movimientos_inventario
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */

-- =====================================================
-- FUNCIÓN: Validar producto existe antes de insertar
-- =====================================================

/*
 * FUNCIÓN: fun_trigger_validar_producto_compra_proveedor
 * 
 * DESCRIPCIÓN: Valida que el producto existe antes de permitir inserción.
 *              Si no existe, lanza error con instrucciones para crearlo.
 */
CREATE OR REPLACE FUNCTION fun_trigger_validar_producto_compra_proveedor()
RETURNS TRIGGER AS $$
DECLARE
    v_producto_existe BOOLEAN := FALSE;
    v_producto_nombre tab_productos.nom_producto%TYPE;
BEGIN
    -- Verificar si el producto existe
    SELECT EXISTS(
        SELECT 1 FROM tab_productos p 
        WHERE p.id_categoria = NEW.id_categoria 
          AND p.id_linea = NEW.id_linea 
          AND p.id_sublinea = NEW.id_sublinea 
          AND p.id_producto = NEW.id_producto
    ) INTO v_producto_existe;
    
    -- Si el producto no existe, lanzar error con instrucciones
    IF NOT v_producto_existe THEN
        RAISE EXCEPTION 'PRODUCTO_NO_EXISTE: El producto [%/%/%/%] no existe en tab_productos. 
                        Debe ejecutar fun_insert_producto() para crear el producto antes de generar la orden de compra.
                        
                        Ejemplo de uso:
                        SELECT fun_insert_producto(
                            p_id_categoria => %,
                            p_id_linea => %,
                            p_id_sublinea => %,
                            p_id_producto => %,
                            p_nom_producto => ''NOMBRE_DEL_PRODUCTO'',
                            p_des_producto => ''Descripción del producto'',
                            p_num_stock => 0,
                            p_num_precio => 0.00,
                            p_usr_operacion => ''USUARIO''
                        );', 
                        NEW.id_categoria, NEW.id_linea, NEW.id_sublinea, NEW.id_producto,
                        NEW.id_categoria, NEW.id_linea, NEW.id_sublinea, NEW.id_producto;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Actualizar stock al recibir productos
-- =====================================================

/*
 * FUNCIÓN: fun_trigger_actualizar_stock_compra_proveedor
 * 
 * DESCRIPCIÓN: Actualiza el stock del producto cuando se marca como recibido
 *              y registra el movimiento en tab_movimientos_inventario.
 */
CREATE OR REPLACE FUNCTION fun_trigger_actualizar_stock_compra_proveedor()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_anterior INT;
    v_stock_nuevo INT;
    v_id_movimiento INT;
    v_descripcion VARCHAR;
BEGIN
    -- Solo procesar si cambió a estado 3 (Recibido)
    IF NEW.ind_estado_producto = 3 AND (OLD.ind_estado_producto IS NULL OR OLD.ind_estado_producto != 3) THEN
        
        -- Obtener stock actual del producto
        SELECT num_stock INTO v_stock_anterior
        FROM tab_productos
        WHERE id_categoria = NEW.id_categoria
          AND id_linea = NEW.id_linea
          AND id_sublinea = NEW.id_sublinea
          AND id_producto = NEW.id_producto;
        
        -- Calcular nuevo stock
        v_stock_nuevo := v_stock_anterior + NEW.cantidad_recibida;
        
        -- Actualizar stock en tab_productos
        UPDATE tab_productos 
        SET 
            num_stock = v_stock_nuevo,
            usr_update = NEW.usr_update,
            fec_update = NOW()
        WHERE id_categoria = NEW.id_categoria
          AND id_linea = NEW.id_linea
          AND id_sublinea = NEW.id_sublinea
          AND id_producto = NEW.id_producto;
        
        -- Construir descripción del movimiento
        v_descripcion := 'Entrada por compra a proveedor - Orden: ' || NEW.id_orden_compra || 
                        ' - Producto: ' || NEW.id_categoria || '/' || NEW.id_linea || '/' || 
                        NEW.id_sublinea || '/' || NEW.id_producto;
        
        -- Registrar movimiento en tab_movimientos_inventario
        INSERT INTO tab_movimientos_inventario (
            id_categoria_producto,
            id_linea_producto, 
            id_sublinea_producto,
            id_producto,
            tipo_movimiento,
            cantidad,
            costo_unitario_movimiento,
            stock_anterior,
            stock_actual,
            descripcion,
            observaciones,
            usr_insert
        ) VALUES (
            NEW.id_categoria,
            NEW.id_linea,
            NEW.id_sublinea,
            NEW.id_producto,
            'entrada_compra',                    -- Tipo de movimiento
            NEW.cantidad_recibida,               -- Cantidad que ingresa
            NEW.costo_unitario,                  -- Costo unitario
            v_stock_anterior,                    -- Stock anterior
            v_stock_nuevo,                       -- Stock actual
            v_descripcion,                       -- Descripción del movimiento
            'Actualización automática por trigger de compras a proveedores', -- Observaciones
            COALESCE(NEW.usr_update, NEW.usr_insert) -- Usuario
        ) RETURNING id_movimiento INTO v_id_movimiento;
        
        -- Log del proceso
        RAISE NOTICE 'Stock actualizado automáticamente: Producto [%/%/%/%] - Stock anterior: % → Stock nuevo: % (+%) - Movimiento ID: %',
            NEW.id_categoria, NEW.id_linea, NEW.id_sublinea, NEW.id_producto,
            v_stock_anterior, v_stock_nuevo, NEW.cantidad_recibida, v_id_movimiento;
            
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- DOCUMENTACIÓN Y COMENTARIOS
-- =====================================================

--COMMENT ON FUNCTION fun_trigger_validar_producto_compra_proveedor() IS 
--'Función trigger que valida que el producto existe antes de crear orden de compra';

--COMMENT ON FUNCTION fun_trigger_actualizar_stock_compra_proveedor() IS 
--'Función trigger que actualiza automáticamente el stock cuando se reciben productos';

--COMMENT ON TRIGGER trg_validar_producto_compra_proveedor ON tab_orden_compra_proveedor IS 
--'Trigger que impide crear órdenes de compra para productos inexistentes';

--COMMENT ON TRIGGER trg_actualizar_stock_compra_proveedor ON tab_orden_compra_proveedor IS 
--'Trigger que actualiza stock automáticamente al marcar productos como recibidos';

-- Mensaje de confirmación
--DO $$
--BEGIN
   -- RAISE NOTICE '✅ Triggers de orden de compra a proveedor creados exitosamente';
   -- RAISE NOTICE '🔍 Validación automática: Producto debe existir antes de crear orden';
   -- RAISE NOTICE '📦 Actualización automática: Stock se actualiza al marcar como recibido';
    --RAISE NOTICE '📝 Registro automático: Movimientos se guardan en tab_movimientos_inventario';
    --RAISE NOTICE '';
    --RAISE NOTICE '🎯 Estados del producto:';
    --RAISE NOTICE '   1 = Solicitado  → No afecta stock';
    --RAISE NOTICE '   2 = Parcial     → No afecta stock';
    --RAISE NOTICE '   3 = Recibido    → ✅ ACTUALIZA STOCK (+cantidad_recibida)';
    --RAISE NOTICE '   4 = Cancelado   → No afecta stock';
--END $$; 