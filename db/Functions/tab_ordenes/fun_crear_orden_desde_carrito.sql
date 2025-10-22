/*
 * STORED PROCEDURE: fun_crear_orden_desde_carrito
 * 
 * DESCRIPCIÓN: Convierte el carrito del usuario en una orden de compra definitiva,
 *              aplicando descuentos automáticos y códigos según corresponda.
 *              Trabaja directamente con el carrito específico.
 * 
 * PARÁMETROS:
 *   - p_id_carrito: ID del carrito a convertir en orden
 *   - p_id_direccion: ID de la dirección de entrega
 *   - p_codigo_descuento: Código de descuento a aplicar (opcional)
 *   - p_observaciones: Observaciones adicionales de la orden (opcional)
 *   - p_usr_operacion: Usuario que realiza la operación
 *   - p_id_canje: ID del canje de puntos a aplicar (opcional)
 * 
 * RETORNA: JSON con estructura:
 *   - success: boolean (true/false)
 *   - message: string (mensaje descriptivo)
 *   - id_orden: integer (ID de la orden creada, solo en éxito)
 *   - total_productos: decimal (total de productos sin descuentos)
 *   - total_descuentos: decimal (total de descuentos aplicados)
 *   - total_final: decimal (total final de la orden)
 *   - descuentos_aplicados: array (detalle de descuentos)
 * 
 * PROCESO COMPLETO:
 *   1. Validar carrito y obtener información del usuario
 *   2. Validar dirección de entrega
 *   3. Verificar stock disponible de todos los productos
 *   4. Calcular descuentos automáticos + código de descuento + canje de puntos
 *   5. Crear orden principal (estado 'pendiente')
 *   6. Transferir productos del carrito a la orden
 *   7. Marcar canje como utilizado (si se aplicó)
 *   8. Limpiar carrito después de crear la orden
 * 
 * ESTADOS DE ORDEN:
 *   1 = Pendiente     (orden creada, esperando pago)       ← ESTA FUNCIÓN
 *   2 = Pagada        (pago confirmado, en preparación)
 *   3 = Completada    (orden finalizada/enviada)
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_crear_orden_desde_carrito(
    p_id_carrito tab_carritos.id_carrito%TYPE,
    p_id_direccion tab_direcciones_usuario.id_direccion%TYPE,
    p_codigo_descuento tab_descuentos.codigo_descuento%TYPE,
    p_observaciones tab_ordenes.des_observaciones%TYPE,
    p_usr_operacion tab_ordenes.usr_insert%TYPE,
    p_id_canje tab_canjes_puntos_descuentos.id_canje%TYPE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    -- Variables principales del proceso
    v_carrito_info RECORD;                                   -- Información del carrito
    v_id_usuario tab_usuarios.id_usuario%TYPE;               -- ID del usuario del carrito
    v_session_id tab_carritos.session_id%TYPE;               -- Session ID para usuarios anónimos
    v_total_productos DECIMAL(10,2) := 0;                    -- Total de productos sin descuentos
    v_total_descuentos DECIMAL(10,2) := 0;                   -- Total de descuentos aplicados
    v_total_final DECIMAL(10,2);                             -- Total final de la orden
    v_id_orden tab_ordenes.id_orden%TYPE;                    -- ID de la orden generada
    v_producto_record RECORD;                                -- Record para iterar productos
    v_direccion_valida BOOLEAN := FALSE;                     -- Validar dirección
    v_count_productos INT := 0;                              -- Contador de productos en carrito
    
    -- Variables para manejo de descuentos
    v_descuentos_automaticos JSON := '[]'::JSON;             -- Descuentos automáticos
    v_descuento_codigo JSON;                                 -- Descuento por código
    v_descuento_canje JSON;                                  -- Descuento por canje de puntos
    v_descuentos_aplicados JSON := '[]'::JSON;               -- Todos los descuentos aplicados
    v_descuento RECORD;                                       -- Record para iterar descuentos
    v_canje_info RECORD;                                     -- Información del canje
    v_es_primera_compra BOOLEAN := FALSE;                    -- Indicador primera compra
    v_orden_actualizada BOOLEAN := FALSE;                    -- Indicador si se actualizó orden existente

BEGIN
    -- PASO 1: Validar que el carrito existe y obtener información
    SELECT c.id_carrito, c.id_usuario, c.session_id
    INTO v_carrito_info
    FROM tab_carritos c
    WHERE c.id_carrito = p_id_carrito;
    
    -- Verificar que el carrito existe
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'El carrito especificado no existe',
            'id_carrito', p_id_carrito
        );
    END IF;
    
    -- Extraer datos del carrito
    v_id_usuario := v_carrito_info.id_usuario;
    v_session_id := v_carrito_info.session_id;
    
    -- PASO 2: Verificar que el carrito tenga productos
    SELECT COUNT(*), COALESCE(SUM(cp.cantidad * cp.precio_unitario_carrito), 0)
    INTO v_count_productos, v_total_productos
    FROM tab_carrito_productos cp
    WHERE cp.id_carrito = p_id_carrito;
    
    -- Validar que el carrito no esté vacío
    IF v_count_productos = 0 OR v_total_productos = 0 THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'El carrito está vacío',
            'id_carrito', p_id_carrito
        );
    END IF;
    
    -- PASO 3: Validar dirección de entrega (solo para usuarios registrados)
    IF v_id_usuario IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 
            FROM tab_direcciones_usuario 
            WHERE id_direccion = p_id_direccion
            AND id_usuario = v_id_usuario
            AND ind_activa = TRUE
        ) INTO v_direccion_valida;
        
        IF NOT v_direccion_valida THEN
            RETURN json_build_object(
                'success', false, 
                'message', 'La dirección especificada no existe o no pertenece al usuario',
                'id_direccion', p_id_direccion
            );
        END IF;
    END IF;
    
    -- PASO 4: Verificar stock disponible de todos los productos
    FOR v_producto_record IN 
        SELECT 
            cp.id_categoria_producto, cp.id_linea_producto, 
            cp.id_sublinea_producto, cp.id_producto,
            cp.cantidad, cp.precio_unitario_carrito,
            p.num_stock, p.nom_producto
        FROM tab_carrito_productos cp
        JOIN tab_productos p ON (
            cp.id_categoria_producto = p.id_categoria AND
            cp.id_linea_producto = p.id_linea AND
            cp.id_sublinea_producto = p.id_sublinea AND
            cp.id_producto = p.id_producto
            AND p.ind_activo = TRUE
        )
        WHERE cp.id_carrito = p_id_carrito
    LOOP
        -- Verificar stock suficiente
        IF v_producto_record.cantidad > v_producto_record.num_stock THEN
            RETURN json_build_object(
                'success', false, 
                'message', 'Stock insuficiente para: ' || v_producto_record.nom_producto,
                'producto_sin_stock', v_producto_record.nom_producto,
                'stock_disponible', v_producto_record.num_stock,
                'cantidad_solicitada', v_producto_record.cantidad
            );
        END IF;
    END LOOP;
    
    -- PASO 5: Verificar si es primera compra (solo usuarios registrados)
    IF v_id_usuario IS NOT NULL THEN
        SELECT NOT EXISTS (
            SELECT 1 FROM tab_ordenes WHERE id_usuario = v_id_usuario
        ) INTO v_es_primera_compra;
    END IF;
    
    -- PASO 6: Calcular descuentos automáticos
    FOR v_descuento IN
        SELECT d.*, 
                CASE 
                    WHEN d.aplica_a = 'total_pedido' AND v_total_productos >= d.min_valor_pedido THEN
                        CASE WHEN d.tipo_calculo THEN 
                           v_total_productos * d.val_porce_descuento / 100
                        ELSE 
                            LEAST(d.val_monto_descuento, v_total_productos)
                        END
                    WHEN d.aplica_a = 'categoria_especifica' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN d.tipo_calculo THEN 
                               (cp.cantidad * cp.precio_unitario_carrito * d.val_porce_descuento / 100)
                            ELSE 
                               cp.cantidad * d.val_monto_descuento
                            END
                        ), 0)
                        FROM tab_carrito_productos cp
                        WHERE cp.id_carrito = p_id_carrito
                            AND cp.id_categoria_producto = d.id_categoria_aplica
                            AND cp.cantidad >= d.cantidad_minima_producto
                         AND (cp.cantidad * cp.precio_unitario_carrito) >= d.monto_minimo_producto)
                    ELSE 0
                END AS descuento_calculado
        FROM tab_descuentos d
        WHERE d.ind_activo = TRUE
            AND CURRENT_DATE BETWEEN d.fec_inicio AND d.fec_fin
            AND d.ind_canjeable_puntos = FALSE
            AND d.requiere_codigo = FALSE
            AND (d.codigo_descuento IS NULL OR d.codigo_descuento = '')
            -- Usar función completa de validación para descuentos automáticos
            AND fun_validar_descuento_aplicable(d.id_descuento, v_id_usuario, NULL::VARCHAR, p_usr_operacion) = TRUE
    LOOP
        -- Aplicar descuento automático si es aplicable
        IF v_descuento.descuento_calculado > 0 THEN
            v_total_descuentos := v_total_descuentos + v_descuento.descuento_calculado;
            
            -- Agregar a array de descuentos automáticos
            v_descuentos_automaticos := (
                SELECT json_agg(elemento)
                FROM (
                    SELECT json_array_elements(v_descuentos_automaticos) AS elemento
                    UNION ALL
                    SELECT json_build_object(
                        'id_descuento', v_descuento.id_descuento,
                        'nombre', v_descuento.nom_descuento,
                        'tipo', CASE WHEN v_descuento.tipo_calculo THEN 'porcentaje' ELSE 'monto_fijo' END,
                        'valor', CASE WHEN v_descuento.tipo_calculo THEN v_descuento.val_porce_descuento ELSE v_descuento.val_monto_descuento END,
                        'descuento_aplicado', v_descuento.descuento_calculado,
                        'aplica_a', v_descuento.aplica_a,
                        'tipo_descuento', 'automatico'
                    )
                ) AS subconsulta
            );
        END IF;
    END LOOP;
    
    -- PASO 7: Aplicar código de descuento (si se especifica)
    IF p_codigo_descuento IS NOT NULL THEN
        -- Buscar descuento por código
        SELECT d.*, 
                CASE 
                    WHEN d.aplica_a = 'total_pedido' AND v_total_productos >= d.min_valor_pedido THEN
                        CASE WHEN d.tipo_calculo THEN 
                           v_total_productos * d.val_porce_descuento / 100
                        ELSE 
                            LEAST(d.val_monto_descuento, v_total_productos)
                        END
                    ELSE 0
                END AS descuento_calculado
        INTO v_descuento
        FROM tab_descuentos d
        WHERE d.codigo_descuento = p_codigo_descuento
            AND d.ind_activo = TRUE
            AND CURRENT_DATE BETWEEN d.fec_inicio AND d.fec_fin
            AND (d.requiere_codigo = TRUE OR d.codigo_descuento IS NOT NULL);
        
        -- Si se encontró el código, validar que sea aplicable al usuario
        IF FOUND AND v_descuento.descuento_calculado > 0 THEN
            -- VALIDACIÓN ESPECIAL: Para descuentos de solo_primera_compra, verificar antes de que exista la orden
            IF v_descuento.solo_primera_compra = TRUE THEN
                -- Para primera compra, validar manualmente sin depender de la función que verifica órdenes existentes
                IF v_es_primera_compra = FALSE THEN
                    -- El usuario ya no es primera compra, no puede usar este código
                    RETURN json_build_object(
                        'success', false,
                        'message', 'El código "' || p_codigo_descuento || '" solo es válido para la primera compra y usted ya ha realizado compras anteriormente',
                        'error_tipo', 'codigo_descuento_primera_compra',
                        'codigo_rechazado', p_codigo_descuento
                    );
                END IF;
            ELSE
                -- Para otros tipos de descuentos, usar la función completa de validación
                IF NOT fun_validar_descuento_aplicable(v_descuento.id_descuento, v_id_usuario, p_codigo_descuento, p_usr_operacion) THEN
                    RETURN json_build_object(
                        'success', false,
                        'message', 'El código "' || p_codigo_descuento || '" no es aplicable en este momento',
                        'error_tipo', 'codigo_descuento_no_aplicable',
                        'codigo_rechazado', p_codigo_descuento
                    );
                END IF;
            END IF;
            
            -- Si llegó hasta aquí, el descuento es válido y aplicable
            v_total_descuentos := v_total_descuentos + v_descuento.descuento_calculado;
            
            -- Crear objeto de descuento por código
            v_descuento_codigo := json_build_object(
                'id_descuento', v_descuento.id_descuento,
                'nombre', v_descuento.nom_descuento,
                'codigo', p_codigo_descuento,
                'tipo', CASE WHEN v_descuento.tipo_calculo THEN 'porcentaje' ELSE 'monto_fijo' END,
                'valor', CASE WHEN v_descuento.tipo_calculo THEN v_descuento.val_porce_descuento ELSE v_descuento.val_monto_descuento END,
                'descuento_aplicado', v_descuento.descuento_calculado,
                'tipo_descuento', 'codigo'
            );
        ELSE
            -- Código no encontrado o no aplicable
            RETURN json_build_object(
                'success', false,
                'message', 'El código de descuento "' || p_codigo_descuento || '" no es válido o no aplica a este pedido',
                'error_tipo', 'codigo_descuento_invalido',
                'codigo_rechazado', p_codigo_descuento
            );
        END IF;
    END IF;
    
    -- PASO 7.5: Aplicar descuento canjeado por puntos (si se especifica)
    IF p_id_canje IS NOT NULL AND v_id_usuario IS NOT NULL THEN
        -- Obtener información del canje y verificar que sea válido
        SELECT 
            c.id_canje, c.id_usuario, c.id_descuento, c.puntos_utilizados,
            c.ind_utilizado, c.fec_expiracion_canje,
            d.nom_descuento, d.des_descuento, d.tipo_calculo,
            d.val_porce_descuento, d.val_monto_descuento, d.aplica_a,
            d.min_valor_pedido
        INTO v_canje_info
        FROM tab_canjes_puntos_descuentos c
        JOIN tab_descuentos d ON c.id_descuento = d.id_descuento
        WHERE c.id_canje = p_id_canje
            AND c.id_usuario = v_id_usuario
            AND c.ind_utilizado = FALSE
            AND (c.fec_expiracion_canje IS NULL OR c.fec_expiracion_canje >= CURRENT_DATE);

        -- Si el canje es válido, calcular y aplicar el descuento
        IF FOUND THEN
            DECLARE
                v_descuento_canje_valor DECIMAL(10,2) := 0;
            BEGIN
                -- Calcular valor del descuento canjeado
                IF v_canje_info.aplica_a = 'total_pedido' AND v_total_productos >= v_canje_info.min_valor_pedido THEN
                    IF v_canje_info.tipo_calculo THEN 
                        -- Porcentual sobre el total de productos
                        v_descuento_canje_valor := v_total_productos * v_canje_info.val_porce_descuento / 100;
                    ELSE 
                        -- Monto fijo, no puede exceder el total
                        v_descuento_canje_valor := LEAST(v_canje_info.val_monto_descuento, v_total_productos);
                    END IF;
                END IF;
                
                -- Aplicar el descuento si es mayor a 0
                IF v_descuento_canje_valor > 0 THEN
                    v_total_descuentos := v_total_descuentos + v_descuento_canje_valor;
                    
                    -- Crear objeto JSON del descuento canjeado
                    v_descuento_canje := json_build_object(
                        'id_descuento', v_canje_info.id_descuento,
                        'id_canje', v_canje_info.id_canje,
                        'nombre', v_canje_info.nom_descuento,
                        'tipo', CASE WHEN v_canje_info.tipo_calculo THEN 'porcentaje' ELSE 'monto_fijo' END,
                        'valor', CASE WHEN v_canje_info.tipo_calculo THEN v_canje_info.val_porce_descuento ELSE v_canje_info.val_monto_descuento END,
                        'descuento_aplicado', v_descuento_canje_valor,
                        'puntos_utilizados', v_canje_info.puntos_utilizados,
                        'tipo_descuento', 'canje_puntos'
                    );
                    
                    -- NOTA: El canje se marcará como utilizado después de crear la orden
                END IF;
            END;
        ELSE
            -- Canje no válido o no disponible
            RETURN json_build_object(
                'success', false,
                'message', 'El canje especificado no es válido o ya fue utilizado',
                'error_tipo', 'canje_no_valido',
                'id_canje', p_id_canje
            );
        END IF;
    END IF;
    
    -- PASO 8: Calcular total final
    v_total_descuentos := LEAST(v_total_descuentos, v_total_productos);
    v_total_final := v_total_productos - v_total_descuentos;
    
    -- Construir array completo de descuentos aplicados
    v_descuentos_aplicados := (
        SELECT json_agg(elemento)
        FROM (
            -- Descuentos automáticos
            SELECT json_array_elements(v_descuentos_automaticos) AS elemento
            UNION ALL
            -- Descuento por código
            SELECT v_descuento_codigo AS elemento
            WHERE v_descuento_codigo IS NOT NULL
            UNION ALL
            -- Descuento por canje de puntos
            SELECT v_descuento_canje AS elemento
            WHERE v_descuento_canje IS NOT NULL
        ) AS combinados
    );
    
    -- PASO 9: Verificar si existe orden pendiente para actualizar o crear nueva
    SELECT id_orden INTO v_id_orden
    FROM tab_ordenes 
    WHERE id_usuario = v_id_usuario 
        AND ind_estado = 1  -- Solo órdenes pendientes
    ORDER BY fec_insert DESC 
    LIMIT 1;
    
    BEGIN
        IF v_id_orden IS NOT NULL THEN
            -- CASO A: Actualizar orden pendiente existente
            v_orden_actualizada := TRUE;
            
            -- PASO 10A: Eliminar productos anteriores de la orden
            DELETE FROM tab_orden_productos WHERE id_orden = v_id_orden;
            
            -- PASO 10B: Actualizar la orden principal con nuevos totales
            UPDATE tab_ordenes SET
                val_total_productos = v_total_productos,
                val_total_descuentos = v_total_descuentos,
                val_total_pedido = v_total_final,
                des_observaciones = p_observaciones,
                detalle_descuentos_aplicados = v_descuentos_aplicados,
                usr_update = p_usr_operacion,
                fec_update = NOW()
            WHERE id_orden = v_id_orden;
            
        ELSE
            -- CASO B: Crear nueva orden (no hay órdenes pendientes)
            -- PASO 10C: Generar nuevo ID de orden
            SELECT COALESCE(MAX(id_orden), 0) + 1 INTO v_id_orden FROM tab_ordenes;
            
            -- PASO 10D: Crear la orden principal
        INSERT INTO tab_ordenes (
            id_orden, id_usuario, val_total_productos, val_total_descuentos, 
            val_total_pedido, metodo_pago, des_observaciones,
                detalle_descuentos_aplicados, usr_insert
        ) VALUES (
            v_id_orden, 
                v_id_usuario,
            v_total_productos,
            v_total_descuentos,
            v_total_final, 
                NULL,  -- El método de pago se definirá al momento del pago
            p_observaciones,
                v_descuentos_aplicados,
            p_usr_operacion
        );
        END IF;
        
        -- PASO 11: Transferir productos del carrito a la orden
        FOR v_producto_record IN 
            SELECT * FROM tab_carrito_productos WHERE id_carrito = p_id_carrito
        LOOP
            INSERT INTO tab_orden_productos (
                id_orden_producto, id_categoria_producto, id_linea_producto,
                id_sublinea_producto, id_producto, id_orden, cant_producto,
                precio_unitario_orden, subtotal, usr_insert, fec_insert
            ) VALUES (
                (SELECT COALESCE(MAX(id_orden_producto), 0) + 1 FROM tab_orden_productos),
                v_producto_record.id_categoria_producto,
                v_producto_record.id_linea_producto,
                v_producto_record.id_sublinea_producto,
                v_producto_record.id_producto,
                v_id_orden,
                v_producto_record.cantidad,
                v_producto_record.precio_unitario_carrito,
                (v_producto_record.cantidad * v_producto_record.precio_unitario_carrito),
                p_usr_operacion,
                NOW()
            );
        END LOOP;
        
        -- PASO 12: Marcar canje como utilizado (si se aplicó)
        IF p_id_canje IS NOT NULL AND v_descuento_canje IS NOT NULL THEN
            UPDATE tab_canjes_puntos_descuentos
            SET ind_utilizado = TRUE,
                fec_utilizacion = NOW(),
                id_orden_aplicado = v_id_orden,
                usr_update = p_usr_operacion
            WHERE id_canje = p_id_canje;
        END IF;
        
        -- PASO 13: Productos transferidos exitosamente a la orden
        -- NOTA: El carrito se mantiene intacto hasta que se PAGUE la orden
        --       El trigger trg_limpiar_carrito_pagado se encarga de limpiarlo automáticamente
        --       Esto permite que el usuario pueda cancelar y seguir comprando si es necesario
        
        -- RESPUESTA: Orden procesada exitosamente
        RETURN json_build_object(
            'success', true, 
            'message', CASE 
                WHEN v_orden_actualizada THEN 'Orden actualizada exitosamente'
                ELSE 'Orden creada exitosamente'
            END,
            'accion_realizada', CASE 
                WHEN v_orden_actualizada THEN 'actualizar'
                ELSE 'crear'
            END,
            'id_orden', v_id_orden,
            'id_carrito', p_id_carrito,
            'total_productos', v_total_productos,
            'total_descuentos', v_total_descuentos,
            'total_final', v_total_final,
            'detalle_descuentos_aplicados', COALESCE(v_descuentos_aplicados, '[]'::JSON),
            'codigo_descuento_aplicado', p_codigo_descuento,
            'productos_transferidos', v_count_productos,
            'estado_orden', 'pendiente',
            'metodo_pago', NULL,
            'es_primera_compra', v_es_primera_compra,
            'procesos_automaticos', json_build_object(
                'carrito_limpiado', false,
                'carrito_limpieza_programada', 'Se limpiará automáticamente al pagar la orden',
                'stock_reservado', true,
                'triggers_activados', true,
                'orden_actualizada', v_orden_actualizada
            )
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error al crear la orden: ' || SQLERRM,
            'error_code', SQLSTATE,
            'id_carrito', p_id_carrito
        );
    END;
END;
$$ LANGUAGE plpgsql; 