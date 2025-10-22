/*
 * FUNCIÓN: fun_restaurar_stock_cancelacion
 * 
 * DESCRIPCIÓN: Función TRIGGER que restaura automáticamente el stock de productos
 *              cuando una orden cambia a estado cancelado (ind_estado = 4).
 *              Se ejecuta después de UPDATE en tab_ordenes.
 * 
 * PARÁMETROS: Ninguno (función TRIGGER - usa NEW y OLD records)
 * 
 * RETORNA: TRIGGER - NULL (estándar para triggers AFTER)
 * 
 * LÓGICA:
 *   1. Verificar que es un cambio a estado cancelado
 *   2. Obtener todos los productos de la orden cancelada
 *   3. Para cada producto: restaurar stock + registrar movimiento
 *   4. Actualizar fechas de modificación
 * 
 * EFECTOS:
 *   - Aumenta num_stock en tab_productos (por cada producto de la orden)
 *   - Crea registros en tab_movimientos_inventario (tipo: devolucion_usuario)
 *   - Actualiza fec_update de los productos afectados
 * 
 * CASOS DE USO:
 *   - Cliente cancela orden antes del envío
 *   - Administrador cancela orden por problemas de pago
 *   - Sistema cancela orden por stock insuficiente post-venta
 * 
 * SEGURIDAD:
 *   - Solo restaura si el cambio es específicamente a cancelado
 *   - Registra auditoría completa de la restauración
 *   - Manejo de errores con EXCEPTION
 * 
 * USO: Se ejecuta automáticamente por TRIGGER
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_restaurar_stock_cancelacion()
RETURNS TRIGGER AS $$
DECLARE
    v_producto_record RECORD;
    v_stock_actual INT;
    v_stock_nuevo INT;
    v_count_productos INT := 0;
BEGIN
    -- VALIDACIÓN: Solo procesar si es cambio a estado cancelado (4)
    -- OLD.ind_estado != 4 significa que NO estaba cancelada antes
    -- NEW.ind_estado = 4 significa que AHORA está cancelada
    IF OLD.ind_estado = 4 OR NEW.ind_estado != 4 THEN
        -- Si ya estaba cancelada o no es cancelación, no hacer nada
        RETURN NULL;
    END IF;
    
    -- LOG: Iniciar proceso de restauración
    RAISE NOTICE 'Iniciando restauración de stock para orden cancelada #%', NEW.id_orden;
    
    -- PASO 1: Obtener todos los productos de la orden cancelada
    FOR v_producto_record IN
        SELECT 
            op.id_categoria_producto, op.id_linea_producto, 
            op.id_sublinea_producto, op.id_producto,
            op.cant_producto, op.id_orden_producto,
            p.nom_producto, p.num_stock
        FROM tab_orden_productos op
        JOIN tab_productos p ON (
            op.id_categoria_producto = p.id_categoria AND
            op.id_linea_producto = p.id_linea AND
            op.id_sublinea_producto = p.id_sublinea AND
            op.id_producto = p.id_producto
        )
        WHERE op.id_orden = NEW.id_orden
    LOOP
        -- PASO 2: Calcular nuevo stock (restaurar cantidad)
        v_stock_actual := v_producto_record.num_stock;
        v_stock_nuevo := v_stock_actual + v_producto_record.cant_producto;
        
        -- PASO 3: Restaurar stock del producto
        UPDATE tab_productos 
        SET num_stock = v_stock_nuevo,
            usr_update = NEW.usr_update
        WHERE id_categoria = v_producto_record.id_categoria_producto
          AND id_linea = v_producto_record.id_linea_producto
          AND id_sublinea = v_producto_record.id_sublinea_producto
          AND id_producto = v_producto_record.id_producto;
        
        -- PASO 4: Registrar movimiento de inventario para auditoría
        INSERT INTO tab_movimientos_inventario (
            id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto,
            tipo_movimiento, cantidad, 
            saldo_cantidad_anterior_mov, saldo_cantidad_actual_mov,
            id_orden_usuario_detalle, descripcion, usr_insert
        ) VALUES (
            v_producto_record.id_categoria_producto, v_producto_record.id_linea_producto, 
            v_producto_record.id_sublinea_producto, v_producto_record.id_producto,
            'devolucion_usuario',                                   -- Tipo de movimiento
            v_producto_record.cant_producto,                        -- Cantidad restaurada
            v_stock_actual,                                         -- Stock anterior
            v_stock_nuevo,                                          -- Stock actual (restaurado)
            v_producto_record.id_orden_producto,                    -- Referencia a orden producto
            'Devolución por cancelación - Orden #' || NEW.id_orden || ' - ' || v_producto_record.nom_producto,
            NEW.usr_update                                         -- Usuario que canceló
        );
        
        -- LOG: Registro por producto
        RAISE NOTICE 'Stock restaurado: % - Cantidad: %, Stock anterior: %, Stock actual: %', 
            v_producto_record.nom_producto, v_producto_record.cant_producto, 
            v_stock_actual, v_stock_nuevo;
            
        -- Contador para resumen
        v_count_productos := v_count_productos + 1;
    END LOOP;
    
    -- LOG: Resumen final
    RAISE NOTICE 'Restauración completada: % productos restaurados para orden #%', 
        v_count_productos, NEW.id_orden;
    
    -- RETORNO: NULL estándar para triggers AFTER
    RETURN NULL;

-- MANEJO DE ERRORES: Capturar excepciones y hacer rollback automático
EXCEPTION 
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en restauración automática de stock para orden #%: %', 
            NEW.id_orden, SQLERRM;
END;
$$ LANGUAGE plpgsql; 