/*
 * FUNCIÓN: fun_aplicar_canje_orden
 * 
 * DESCRIPCIÓN: Aplica un canje de puntos por descuento a una orden específica,
 *              marcando el canje como utilizado y actualizando los totales de la orden.
 *              Los puntos ya fueron descontados en fn_canjear_puntos_descuento.
 * 
 * PARÁMETROS:
 *   - p_id_canje: ID del canje a aplicar
 *   - p_id_orden: ID de la orden donde se aplica el canje
 *   - p_id_usuario: ID del usuario (para validación)
 * 
 * RETORNA: JSON - Resultado de la operación
 * 
 * LÓGICA:
 *   1. Validar que el canje existe y pertenece al usuario
 *   2. Verificar que no esté ya utilizado
 *   3. Verificar que no haya expirado
 *   4. Validar que la orden existe y pertenece al usuario
 *   5. Verificar que la orden no esté completada
 *   6. Calcular descuento usando la misma lógica que fun_calcular_total_carrito
 *   7. Actualizar totales de la orden con el descuento aplicado
 *   8. Marcar como utilizado y asociar a la orden
 *   
 * NOTA: Esta función SÍ actualiza los totales de la orden y aplica el descuento.
 *       Los puntos ya fueron descontados en fn_canjear_puntos_descuento.
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_aplicar_canje_orden(
    p_id_canje tab_canjes_puntos_descuentos.id_canje%TYPE,
    p_id_orden tab_ordenes.id_orden%TYPE,
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_usr_operacion tab_canjes_puntos_descuentos.usr_update%TYPE
) RETURNS JSON AS $$
DECLARE
    v_canje RECORD;
    v_orden RECORD;
    v_descuento_info RECORD;
    v_valor_descuento DECIMAL(10,2) := 0;
    v_total_productos DECIMAL(10,2);
    v_total_descuentos_actual DECIMAL(10,2);
    v_total_final DECIMAL(10,2);
    v_descuentos_aplicados JSON;
    v_nuevo_descuento JSON;
BEGIN
    -- PASO 1: Obtener información del canje y validar
    SELECT 
        c.id_canje, c.id_usuario, c.id_descuento, c.puntos_utilizados,
        c.ind_utilizado, c.fec_expiracion_canje, c.id_orden_aplicado,
        d.nom_descuento, d.tipo_calculo, d.val_porce_descuento, d.val_monto_descuento,
        d.aplica_a, d.min_valor_pedido, d.cantidad_minima_producto, d.monto_minimo_producto,
        d.id_categoria_aplica, d.id_marca_aplica, d.id_producto_aplica,
        d.id_categoria, d.id_linea, d.id_sublinea
    INTO v_canje
    FROM tab_canjes_puntos_descuentos c
    JOIN tab_descuentos d ON c.id_descuento = d.id_descuento
    WHERE c.id_canje = p_id_canje;

    -- VALIDACIÓN 1: Verificar que el canje existe
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El canje especificado no existe'
        );
    END IF;

    -- VALIDACIÓN 2: Verificar que pertenece al usuario
    IF v_canje.id_usuario != p_id_usuario THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El canje no pertenece al usuario especificado'
        );
    END IF;

    -- VALIDACIÓN 3: Verificar que no esté ya utilizado
    IF v_canje.ind_utilizado THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El canje ya ha sido utilizado',
            'orden_aplicado', v_canje.id_orden_aplicado
        );
    END IF;

    -- VALIDACIÓN 4: Verificar que no haya expirado
    IF v_canje.fec_expiracion_canje IS NOT NULL AND v_canje.fec_expiracion_canje < CURRENT_DATE THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El canje ha expirado',
            'fecha_expiracion', v_canje.fec_expiracion_canje
        );
    END IF;

    -- VALIDACIÓN 5: Verificar que la orden existe y pertenece al usuario
    SELECT 
        o.id_orden, o.id_usuario, o.val_total_productos, o.val_total_descuentos, 
        o.val_total_pedido, o.ind_estado, o.detalle_descuentos_aplicados
    INTO v_orden
    FROM tab_ordenes o
    WHERE o.id_orden = p_id_orden AND o.id_usuario = p_id_usuario;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La orden no existe o no pertenece al usuario'
        );
    END IF;

    -- VALIDACIÓN 6: Verificar que la orden no esté completada
    IF v_orden.ind_estado = 3 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se puede aplicar canje a una orden ya completada'
        );
    END IF;

    -- PASO 2: Calcular valor del descuento usando la misma lógica que fun_calcular_total_carrito
    v_total_productos := v_orden.val_total_productos;
    
    -- Calcular descuento según el tipo de aplicación
    CASE 
        -- TIPO 1: Descuento por total del pedido
        WHEN v_canje.aplica_a = 'total_pedido' AND v_total_productos >= v_canje.min_valor_pedido THEN
            IF v_canje.tipo_calculo THEN 
                -- Porcentual sobre el total de productos
                v_valor_descuento := v_total_productos * v_canje.val_porce_descuento / 100;
            ELSE 
                -- Fijo: no puede exceder el total
                v_valor_descuento := LEAST(v_canje.val_monto_descuento, v_total_productos);
            END IF;
            
        -- TIPO 2: Descuento por producto específico
        WHEN v_canje.aplica_a = 'producto_especifico' THEN
            SELECT COALESCE(SUM(
                CASE WHEN v_canje.tipo_calculo THEN 
                   -- Porcentual sobre el valor del producto específico
                   (op.cantidad * op.precio_unitario * v_canje.val_porce_descuento / 100)
                ELSE 
                   -- Fijo: una sola aplicación por producto
                   LEAST(op.cantidad, 1) * v_canje.val_monto_descuento
                END
            ), 0) INTO v_valor_descuento
            FROM tab_orden_productos op
            WHERE op.id_orden = p_id_orden
                AND op.id_categoria_producto = v_canje.id_categoria
                AND op.id_linea_producto = v_canje.id_linea
                AND op.id_sublinea_producto = v_canje.id_sublinea
                AND op.id_producto = v_canje.id_producto_aplica
                AND op.cantidad >= v_canje.cantidad_minima_producto
                AND (op.cantidad * op.precio_unitario) >= v_canje.monto_minimo_producto;
                
        -- TIPO 3: Descuento por categoría específica
        WHEN v_canje.aplica_a = 'categoria_especifica' THEN
            SELECT COALESCE(SUM(
                CASE WHEN v_canje.tipo_calculo THEN 
                   -- Porcentual sobre todos los productos de la categoría
                   (op.cantidad * op.precio_unitario * v_canje.val_porce_descuento / 100)
                ELSE 
                   -- Fijo: por cada producto de la categoría
                   op.cantidad * v_canje.val_monto_descuento
                END
            ), 0) INTO v_valor_descuento
            FROM tab_orden_productos op
            WHERE op.id_orden = p_id_orden
                AND op.id_categoria_producto = v_canje.id_categoria_aplica
                AND op.cantidad >= v_canje.cantidad_minima_producto
                AND (op.cantidad * op.precio_unitario) >= v_canje.monto_minimo_producto;
                
        -- TIPO 4: Descuento por marca específica
        WHEN v_canje.aplica_a = 'marca_especifica' THEN
            SELECT COALESCE(SUM(
                CASE WHEN v_canje.tipo_calculo THEN 
                   -- Porcentual sobre todos los productos de la marca
                   (op.cantidad * op.precio_unitario * v_canje.val_porce_descuento / 100)
                ELSE 
                   -- Fijo: por cada producto de la marca
                   op.cantidad * v_canje.val_monto_descuento
                END
            ), 0) INTO v_valor_descuento
            FROM tab_orden_productos op
            JOIN tab_productos p ON (
                op.id_categoria_producto = p.id_categoria AND 
                op.id_linea_producto = p.id_linea AND 
                op.id_sublinea_producto = p.id_sublinea AND 
                op.id_producto = p.id_producto
                AND p.ind_activo = TRUE
            )
            WHERE op.id_orden = p_id_orden
                AND p.id_marca = v_canje.id_marca_aplica
                AND op.cantidad >= v_canje.cantidad_minima_producto
                AND (op.cantidad * op.precio_unitario) >= v_canje.monto_minimo_producto;
        ELSE
            v_valor_descuento := 0;
    END CASE;
    
    -- Validar que el descuento calculado sea aplicable
    IF v_valor_descuento <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El descuento no aplica a los productos de esta orden',
            'motivo', 'No cumple con los criterios de aplicación del descuento'
        );
    END IF;
    
    -- PASO 3: Actualizar totales de la orden
    v_total_descuentos_actual := COALESCE(v_orden.val_total_descuentos, 0) + v_valor_descuento;
    v_total_final := v_total_productos - v_total_descuentos_actual;
    
    -- Asegurar que el total final no sea negativo
    IF v_total_final < 0 THEN
        v_valor_descuento := v_valor_descuento + v_total_final; -- Ajustar descuento
        v_total_descuentos_actual := v_total_productos; -- Descuento máximo = total productos
        v_total_final := 0;
    END IF;
    
    -- PASO 4: Preparar JSON del nuevo descuento aplicado
    v_nuevo_descuento := json_build_object(
        'id_descuento', v_canje.id_descuento,
        'id_canje', v_canje.id_canje,
        'nombre', v_canje.nom_descuento,
        'tipo', CASE WHEN v_canje.tipo_calculo THEN 'porcentaje' ELSE 'monto_fijo' END,
        'valor', CASE WHEN v_canje.tipo_calculo THEN v_canje.val_porce_descuento ELSE v_canje.val_monto_descuento END,
        'descuento_aplicado', v_valor_descuento,
        'puntos_utilizados', v_canje.puntos_utilizados,
        'tipo_descuento', 'canje_puntos'
    );
    
    -- Agregar el nuevo descuento a los existentes
    v_descuentos_aplicados := COALESCE(v_orden.detalle_descuentos_aplicados, '[]'::JSON);
    v_descuentos_aplicados := (
        SELECT json_agg(elemento)
        FROM (
            SELECT json_array_elements(v_descuentos_aplicados) AS elemento
            UNION ALL
            SELECT v_nuevo_descuento AS elemento
        ) AS subconsulta
    );
    
    -- PASO 5: Actualizar la orden con los nuevos totales
    UPDATE tab_ordenes
    SET 
        val_total_descuentos = v_total_descuentos_actual,
        val_total_pedido = v_total_final,
        detalle_descuentos_aplicados = v_descuentos_aplicados,
        usr_update = p_usr_operacion,
        fec_update = NOW()
    WHERE id_orden = p_id_orden;
    
    -- PASO 6: Marcar el canje como utilizado
    UPDATE tab_canjes_puntos_descuentos
    SET 
        ind_utilizado = TRUE,
        fec_utilizacion = NOW(),
        id_orden_aplicado = p_id_orden,
        usr_update = p_usr_operacion
    WHERE id_canje = p_id_canje;

    -- RESPUESTA: Confirmar éxito con información completa
    RETURN json_build_object(
        'success', true,
        'message', 'Canje aplicado exitosamente a la orden',
        'id_canje', p_id_canje,
        'id_orden', p_id_orden,
        'descuento', v_canje.nom_descuento,
        'puntos_utilizados', v_canje.puntos_utilizados,
        'valor_descuento_aplicado', v_valor_descuento,
        'total_productos', v_total_productos,
        'total_descuentos', v_total_descuentos_actual,
        'total_final', v_total_final
    );

-- MANEJO DE ERRORES
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error inesperado: ' || SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql; 