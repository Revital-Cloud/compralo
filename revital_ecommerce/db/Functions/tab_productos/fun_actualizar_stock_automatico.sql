/*
 * FUNCIÓN: fun_actualizar_stock_automatico
 * 
 * DESCRIPCIÓN: Función TRIGGER que reduce automáticamente el stock de productos
 *              ÚNICAMENTE cuando una orden es marcada como PAGADA.
 *              Procesa todos los productos de la orden y reduce su stock.
 * 
 * PARÁMETROS: Ninguno (función TRIGGER - usa NEW y OLD records)
 * 
 * RETORNA: TRIGGER - NULL (estándar para triggers AFTER)
 * 
 * LÓGICA:
 *   - Solo se ejecuta cuando una orden cambia a estado PAGADA (ind_estado = 2)
 *   - Procesa todos los productos de la orden pagada
 *   - Valida stock disponible antes de reducir
 *   - Registra movimientos de inventario
 * 
 * EFECTOS:
 *   - Reduce num_stock en tab_productos
 *   - Crea registro en tab_movimientos_inventario
 *   - Actualiza fec_update del producto
 * 
 * USO: Se ejecuta automáticamente por TRIGGER en UPDATE de tab_ordenes
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_actualizar_stock_automatico()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual INT;
    v_nom_producto VARCHAR;
    v_stock_nuevo INT;
    v_producto_record RECORD;
    v_total_productos_procesados INT := 0;
    v_id_orden tab_ordenes.id_orden%TYPE;
    v_usr_operacion tab_ordenes.usr_update%TYPE;
BEGIN
    -- VALIDACIÓN: Solo procesar cuando la orden cambia a estado PAGADA
    -- El trigger ya filtra con WHEN (OLD.ind_estado != 2 AND NEW.ind_estado = 2)
    -- Por lo tanto, cuando lleguemos aquí, ya sabemos que es el cambio correcto
    IF NEW.ind_estado != 2 THEN
        RETURN NULL; -- Seguridad extra: solo procesar estado PAGADA
    END IF;
    
    v_id_orden := NEW.id_orden;
    -- Si usr_update es NULL, usar ID del sistema (1000000000 = usuario sistema)
    v_usr_operacion := COALESCE(NEW.usr_update, 1000000000);
    
    -- LOG: Iniciar proceso
    RAISE NOTICE 'Iniciando actualización de stock para orden PAGADA #%', v_id_orden;
    
    -- Procesar cada producto de la orden pagada
    FOR v_producto_record IN
        SELECT 
            id_orden_producto, id_categoria_producto, id_linea_producto, 
            id_sublinea_producto, id_producto, cant_producto
        FROM tab_orden_productos 
        WHERE id_orden = v_id_orden
    LOOP
        -- PASO 1: Obtener stock actual del producto
        SELECT num_stock, nom_producto 
        INTO v_stock_actual, v_nom_producto
        FROM tab_productos 
        WHERE id_categoria = v_producto_record.id_categoria_producto
          AND id_linea = v_producto_record.id_linea_producto
          AND id_sublinea = v_producto_record.id_sublinea_producto
          AND id_producto = v_producto_record.id_producto;
        
        -- VALIDACIÓN: Verificar que el producto existe
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Error: Producto no encontrado (%, %, %, %)', 
                v_producto_record.id_categoria_producto, v_producto_record.id_linea_producto, 
                v_producto_record.id_sublinea_producto, v_producto_record.id_producto;
        END IF;
        
        -- VALIDACIÓN: Verificar stock suficiente
        IF v_stock_actual < v_producto_record.cant_producto THEN
            RAISE EXCEPTION 'Error: Stock insuficiente para %. Stock actual: %, Solicitado: %', 
                v_nom_producto, v_stock_actual, v_producto_record.cant_producto;
        END IF;
        
        -- PASO 2: Calcular nuevo stock
        v_stock_nuevo := v_stock_actual - v_producto_record.cant_producto;
        
        -- PASO 3: Actualizar stock del producto
        UPDATE tab_productos 
        SET num_stock = v_stock_nuevo,
            usr_update = v_usr_operacion
        WHERE id_categoria = v_producto_record.id_categoria_producto
          AND id_linea = v_producto_record.id_linea_producto
          AND id_sublinea = v_producto_record.id_sublinea_producto
          AND id_producto = v_producto_record.id_producto;
        
        -- PASO 4: Registrar movimiento de inventario
        INSERT INTO tab_movimientos_inventario (
            id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto,
            tipo_movimiento, cantidad, 
            stock_anterior, stock_actual,
            id_orden_usuario_detalle, descripcion, usr_insert
        ) VALUES (
            v_producto_record.id_categoria_producto, v_producto_record.id_linea_producto, 
            v_producto_record.id_sublinea_producto, v_producto_record.id_producto,
            'salida_venta',                                  -- Tipo específico para ventas pagadas
            v_producto_record.cant_producto,                        -- Cantidad vendida
            v_stock_actual,                                         -- Stock anterior
            v_stock_nuevo,                                          -- Stock actual
            v_producto_record.id_orden_producto,                    -- Referencia a orden producto
            'Venta pagada - Orden #' || v_id_orden || ' - ' || v_nom_producto,
            v_usr_operacion                                         -- Usuario que marcó como pagada
        );
        
        -- LOG: Producto procesado
        RAISE NOTICE 'Stock actualizado por PAGO: % - Stock anterior: %, Stock actual: %', 
            v_nom_producto, v_stock_actual, v_stock_nuevo;
        
        v_total_productos_procesados := v_total_productos_procesados + 1;
    END LOOP;
    
    -- LOG: Resumen final
    RAISE NOTICE 'Stock actualizado para orden PAGADA #%: % productos procesados', 
        v_id_orden, v_total_productos_procesados;
    
    -- RETORNO: NULL estándar para triggers AFTER
    RETURN NULL;

-- MANEJO DE ERRORES: Capturar excepciones y hacer rollback automático
EXCEPTION 
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en actualización automática de stock: %', SQLERRM;
END;
$$ LANGUAGE plpgsql; 