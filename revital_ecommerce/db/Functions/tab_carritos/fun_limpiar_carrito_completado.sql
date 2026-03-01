/*
 * FUNCIÓN: fun_limpiar_carrito_pagado
 * 
 * DESCRIPCIÓN: Función TRIGGER que limpia automáticamente el carrito del usuario
 *              cuando una orden se ACTUALIZA a estado PAGADA (ind_estado = 2).
 *              El trigger trg_limpiar_carrito_pagado está definido solo para UPDATE
 *              (no INSERT): cuando la orden se crea ya como Pagada, la limpieza la
 *              hace fun_crear_orden_desde_carrito en PASO 12b, después de copiar
 *              ítems a tab_orden_productos.
 * 
 * PARÁMETROS: Ninguno (función TRIGGER - usa NEW y OLD records)
 * 
 * RETORNA: TRIGGER - NULL (estándar para triggers AFTER)
 * 
 * LÓGICA:
 *   1. Verificar que es un cambio a estado PAGADA (UPDATE)
 *   2. Obtener carrito(s) del usuario de la orden
 *   3. Eliminar todos los productos del carrito
 *   4. Mantener el carrito vacío para futuras compras
 *   5. Registrar auditoría de la limpieza
 * 
 * EFECTOS:
 *   - Elimina registros de tab_carrito_productos del usuario
 *   - Mantiene tab_carritos (solo lo vacía)
 *   - Actualiza fec_update del carrito
 * 
 * CASOS DE USO:
 *   - Orden se marca como pagada exitosamente
 *   - Pago confirmado automáticamente (MercadoPago)
 *   - Administrador marca orden como pagada
 * 
 * BENEFICIOS:
 *   - Evita que el usuario modifique carrito después de pagar
 *   - Mejora experiencia de usuario (carrito limpio para nueva compra)
 *   - Previene problemas de duplicación de productos
 *   - Reduce confusión post-pago
 * 
 * SEGURIDAD:
 *   - Solo limpia si el cambio es específicamente a PAGADA
 *   - Mantiene auditoría completa de la limpieza
 *   - No afecta carritos de otros usuarios
 * 
 * USO: Se ejecuta automáticamente por TRIGGER
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_limpiar_carrito_pagado()
RETURNS TRIGGER AS $$
DECLARE
    v_carrito_record RECORD;
    v_count_productos_eliminados INT := 0;
    v_count_carritos_limpiados INT := 0;
BEGIN
    -- VALIDACIÓN: El trigger solo se dispara en UPDATE (cuando orden pasa a Pagada).
    -- Las órdenes creadas ya como Pagada (INSERT ind_estado=2) no disparan este trigger;
    -- la limpieza del carrito en ese caso la hace fun_crear_orden_desde_carrito (PASO 12b).
    IF TG_OP != 'UPDATE' OR OLD.ind_estado = 2 OR NEW.ind_estado != 2 THEN
        RETURN NULL;
    END IF;
    
    -- LOG: Iniciar proceso de limpieza
    RAISE NOTICE 'Iniciando limpieza de carrito para orden PAGADA #% del usuario %', 
        NEW.id_orden, NEW.id_usuario;
    
    -- PASO 1: Obtener todos los carritos del usuario (puede tener múltiples)
    FOR v_carrito_record IN
        SELECT id_carrito
        FROM tab_carritos 
        WHERE id_usuario = NEW.id_usuario
    LOOP
        -- PASO 2: Contar productos antes de eliminar (para log)
        SELECT COUNT(1) INTO v_count_productos_eliminados
        FROM tab_carrito_productos 
        WHERE id_carrito = v_carrito_record.id_carrito;
        
        -- PASO 3: Solo proceder si el carrito tiene productos
        IF v_count_productos_eliminados > 0 THEN
            
            -- PASO 4: Eliminar todos los productos del carrito
            DELETE FROM tab_carrito_productos 
            WHERE id_carrito = v_carrito_record.id_carrito;
            
            -- PASO 5: Actualizar fecha de modificación del carrito (INSERT suele tener usr_update NULL)
            UPDATE tab_carritos 
            SET usr_update = COALESCE(NEW.usr_update, NEW.usr_insert)
            WHERE id_carrito = v_carrito_record.id_carrito;
            
            -- LOG: Registro por carrito limpiado
            RAISE NOTICE 'Carrito #% limpiado tras PAGO: % productos eliminados', 
                v_carrito_record.id_carrito, v_count_productos_eliminados;
                
            -- Contador de carritos procesados
            v_count_carritos_limpiados := v_count_carritos_limpiados + 1;
        ELSE
            -- LOG: Carrito ya estaba vacío
            RAISE NOTICE 'Carrito #% ya estaba vacío - no requiere limpieza', 
                v_carrito_record.id_carrito;
        END IF;
        
    END LOOP;
    
    -- VERIFICACIÓN: Si no se encontraron carritos, crear uno vacío para el usuario
    IF v_count_carritos_limpiados = 0 THEN
        -- Crear carrito vacío para futuras compras
        INSERT INTO tab_carritos (id_usuario, usr_insert)
        VALUES (NEW.id_usuario, COALESCE(NEW.usr_update, NEW.usr_insert));
        
        RAISE NOTICE 'Carrito vacío creado para usuario % tras PAGAR orden #%', 
            NEW.id_usuario, NEW.id_orden;
    END IF;
    
    -- LOG: Resumen final
    IF v_count_carritos_limpiados > 0 THEN
        RAISE NOTICE 'Limpieza completada tras PAGO: % carritos procesados para usuario % - orden #%', 
            v_count_carritos_limpiados, NEW.id_usuario, NEW.id_orden;
    ELSE
        RAISE NOTICE 'No se requirió limpieza de carrito para usuario % - orden PAGADA #%', 
            NEW.id_usuario, NEW.id_orden;
    END IF;
    
    -- RETORNO: NULL estándar para triggers AFTER
    RETURN NULL;

-- MANEJO DE ERRORES: Capturar excepciones y hacer rollback automático
EXCEPTION 
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en limpieza automática de carrito tras PAGO para usuario % - orden #%: %', 
            NEW.id_usuario, NEW.id_orden, SQLERRM;
END;
$$ LANGUAGE plpgsql; 