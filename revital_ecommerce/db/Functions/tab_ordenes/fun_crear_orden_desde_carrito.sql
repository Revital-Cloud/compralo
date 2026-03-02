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
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_crear_orden_desde_carrito(
    p_id_carrito tab_carritos.id_carrito%TYPE,
    p_id_direccion tab_direcciones_usuario.id_direccion%TYPE,
    p_codigo_descuento tab_descuentos.codigo_descuento%TYPE,
    p_observaciones tab_ordenes.des_observaciones%TYPE,
    p_usr_operacion tab_ordenes.usr_insert%TYPE,
    p_id_canje tab_canjes_puntos_descuentos.id_canje%TYPE DEFAULT NULL,
    p_ind_estado tab_ordenes.ind_estado%TYPE DEFAULT NULL,
    p_metodo_pago tab_ordenes.metodo_pago%TYPE DEFAULT NULL
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
    v_descuento_auto RECORD;                                 -- Record para iterar descuentos automáticos en registro de usos
    v_canje_info RECORD;                                     -- Información del canje
    v_es_primera_compra BOOLEAN := FALSE;                    -- Indicador primera compra
    v_descuento_canje_valor DECIMAL(10,2) := 0;               -- Descuento calculado por canje (PASO 7.5)

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
    SELECT COUNT(1), COALESCE(SUM(cp.cantidad * cp.precio_unitario_carrito), 0)----
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
    
    -- PASO 4: Verificar stock disponible (variantes)
    FOR v_producto_record IN 
        SELECT cp.variant_id, cp.cantidad, cp.precio_unitario_carrito, pv.stock, p.name AS nom_producto
        FROM tab_carrito_productos cp
        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id AND pv.is_active = TRUE
        JOIN tab_product_variant_groups g ON g.id = pv.group_id
        JOIN tab_products p ON p.id = g.product_id AND p.is_active = TRUE
        WHERE cp.id_carrito = p_id_carrito
    LOOP
        IF v_producto_record.cantidad > v_producto_record.stock THEN
            RETURN json_build_object(
                'success', false, 
                'message', 'Stock insuficiente para: ' || v_producto_record.nom_producto,
                'producto_sin_stock', v_producto_record.nom_producto,
                'stock_disponible', v_producto_record.stock,
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
    
    -- PASO 6: Calcular descuentos automáticos (misma lógica que fun_calcular_total_carrito,
    -- usando el nuevo esquema de descuentos basado en categorías/productos modernos)
    FOR v_descuento IN
        SELECT 
            d.id_descuento,
            d.nom_descuento,
            d.des_descuento,
            d.tipo_calculo,
            d.val_porce_descuento,
            d.val_monto_descuento,
            d.aplica_a,
            d.product_id_aplica,
            d.id_marca_aplica,
            d.min_valor_pedido,
            d.ind_es_para_cumpleanos,
            d.fec_inicio,
            d.fec_fin,
            d.ind_activo,
            d.max_usos_total,
            d.usos_actuales_total,
            d.costo_puntos_canje,
            d.ind_canjeable_puntos,
            d.codigo_descuento,
            d.max_usos_por_usuario,
            d.dias_semana_aplica,
            d.horas_inicio,
            d.horas_fin,
            d.solo_primera_compra,
            d.monto_minimo_producto,
            d.cantidad_minima_producto,
            d.requiere_codigo,
            d.usr_insert,
            d.fec_insert,
            d.usr_update,
            d.fec_update,
                CASE 
                    WHEN d.aplica_a IN ('total_pedido', 'todos') AND v_total_productos >= COALESCE(d.min_valor_pedido, 0) THEN
                        CASE WHEN d.tipo_calculo THEN
                           v_total_productos * d.val_porce_descuento / 100
                        ELSE
                            LEAST(d.val_monto_descuento, v_total_productos)
                        END
                    WHEN d.aplica_a = 'producto_especifico' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN d.tipo_calculo THEN 
                               (cp.cantidad * cp.precio_unitario_carrito * d.val_porce_descuento / 100)
                            ELSE 
                               LEAST(cp.cantidad, 1) * d.val_monto_descuento
                            END
                        ), 0)
                        FROM tab_carrito_productos cp
                        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                        JOIN tab_product_variant_groups g ON g.id = pv.group_id
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE cp.id_carrito = p_id_carrito
                            AND p.id = d.product_id_aplica
                            AND cp.cantidad >= d.cantidad_minima_producto
                            AND (cp.cantidad * cp.precio_unitario_carrito) >= d.monto_minimo_producto)
                    WHEN d.aplica_a = 'categoria_especifica' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN d.tipo_calculo THEN 
                               (cp.cantidad * cp.precio_unitario_carrito * d.val_porce_descuento / 100)
                            ELSE 
                               cp.cantidad * d.val_monto_descuento
                            END
                        ), 0)
                        FROM tab_carrito_productos cp
                        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                        JOIN tab_product_variant_groups g ON g.id = pv.group_id
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE cp.id_carrito = p_id_carrito
                            AND p.category_id = d.category_id_aplica
                            AND cp.cantidad >= d.cantidad_minima_producto
                            AND (cp.cantidad * cp.precio_unitario_carrito) >= d.monto_minimo_producto)
                    WHEN d.aplica_a = 'marca_especifica' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN d.tipo_calculo THEN 
                               (cp.cantidad * cp.precio_unitario_carrito * d.val_porce_descuento / 100)
                            ELSE 
                               cp.cantidad * d.val_monto_descuento
                            END
                        ), 0)
                        FROM tab_carrito_productos cp
                        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                        JOIN tab_product_variant_groups g ON g.id = pv.group_id
                        JOIN tab_products p ON p.id = g.product_id AND p.is_active = TRUE
                        WHERE cp.id_carrito = p_id_carrito
                            AND p.id_marca = d.id_marca_aplica
                            AND cp.cantidad >= d.cantidad_minima_producto
                            AND (cp.cantidad * cp.precio_unitario_carrito) >= d.monto_minimo_producto)
                    ELSE 0
                END AS descuento_calculado
        FROM tab_descuentos d
        WHERE d.ind_activo = TRUE
            AND (d.fec_inicio IS NULL OR d.fec_inicio <= CURRENT_DATE)
            AND (d.fec_fin IS NULL OR d.fec_fin >= CURRENT_DATE)
            AND d.ind_canjeable_puntos = FALSE
            AND d.requiere_codigo = FALSE
            AND (d.codigo_descuento IS NULL OR d.codigo_descuento = '')
            -- Usar función completa de validación para descuentos automáticos (incluye solo_primera_compra)
            AND v_id_usuario IS NOT NULL
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
        -- Buscar descuento por código (mismas columnas relevantes que en descuentos automáticos)
        SELECT 
            d.id_descuento,
            d.nom_descuento,
            d.des_descuento,
            d.tipo_calculo,
            d.val_porce_descuento,
            d.val_monto_descuento,
            d.aplica_a,
            d.product_id_aplica,
            d.id_marca_aplica,
            d.min_valor_pedido,
            d.ind_es_para_cumpleanos,
            d.fec_inicio,
            d.fec_fin,
            d.ind_activo,
            d.max_usos_total,
            d.usos_actuales_total,
            d.costo_puntos_canje,
            d.ind_canjeable_puntos,
            d.codigo_descuento,
            d.max_usos_por_usuario,
            d.dias_semana_aplica,
            d.horas_inicio,
            d.horas_fin,
            d.solo_primera_compra,
            d.monto_minimo_producto,
            d.cantidad_minima_producto,
            d.requiere_codigo,
            d.usr_insert,
            d.fec_insert,
            d.usr_update,
            d.fec_update,
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
        WHERE UPPER(TRIM(d.codigo_descuento)) = UPPER(TRIM(p_codigo_descuento))
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
    -- Misma lógica que fun_calcular_total_carrito para todos los aplica_a (total_pedido, categoria_especifica, etc.)
    IF p_id_canje IS NOT NULL AND v_id_usuario IS NOT NULL THEN
        -- Obtener información del canje y del descuento (mismas columnas que fun_calcular_total_carrito)
        SELECT 
            c.id_canje, c.id_usuario, c.id_descuento, c.puntos_utilizados,
            c.ind_utilizado, c.fec_expiracion_canje,
            d.nom_descuento, d.des_descuento, d.tipo_calculo,
            d.val_porce_descuento, d.val_monto_descuento, d.aplica_a,
            d.min_valor_pedido, d.cantidad_minima_producto, d.monto_minimo_producto,
            d.category_id_aplica, d.product_id_aplica, d.id_marca_aplica
        INTO v_canje_info
        FROM tab_canjes_puntos_descuentos c
        JOIN tab_descuentos d ON c.id_descuento = d.id_descuento
        WHERE c.id_canje = p_id_canje
            AND c.id_usuario = v_id_usuario
            AND c.ind_utilizado = FALSE
            AND (c.fec_expiracion_canje IS NULL OR c.fec_expiracion_canje >= CURRENT_DATE);

        -- Si el canje es válido, calcular descuento con la misma regla que el carrito
        IF FOUND THEN
            v_descuento_canje_valor := 0;
            -- Calcular valor del descuento canjeado (todos los aplica_a como en fun_calcular_total_carrito)
            SELECT
                    CASE
                        WHEN v_canje_info.aplica_a = 'total_pedido' AND v_total_productos >= COALESCE(v_canje_info.min_valor_pedido, 0) THEN
                            CASE WHEN v_canje_info.tipo_calculo THEN
                                LEAST(v_total_productos * v_canje_info.val_porce_descuento / 100, v_total_productos)
                            ELSE
                                LEAST(v_canje_info.val_monto_descuento, v_total_productos)
                            END
                        WHEN v_canje_info.aplica_a = 'producto_especifico' THEN
                            (SELECT COALESCE(SUM(
                                CASE WHEN v_canje_info.tipo_calculo THEN
                                    (cp.cantidad * cp.precio_unitario_carrito * v_canje_info.val_porce_descuento / 100)
                                ELSE
                                    LEAST(cp.cantidad, 1) * v_canje_info.val_monto_descuento
                                END
                            ), 0)
                            FROM tab_carrito_productos cp
                            JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                            JOIN tab_product_variant_groups g ON g.id = pv.group_id
                            JOIN tab_products p ON p.id = g.product_id
                            WHERE cp.id_carrito = p_id_carrito
                                AND p.id = v_canje_info.product_id_aplica
                                AND cp.cantidad >= COALESCE(v_canje_info.cantidad_minima_producto, 0)
                                AND (cp.cantidad * cp.precio_unitario_carrito) >= COALESCE(v_canje_info.monto_minimo_producto, 0))
                        WHEN v_canje_info.aplica_a = 'categoria_especifica' THEN
                            (SELECT COALESCE(SUM(
                                CASE WHEN v_canje_info.tipo_calculo THEN
                                    (cp.cantidad * cp.precio_unitario_carrito * v_canje_info.val_porce_descuento / 100)
                                ELSE
                                    cp.cantidad * v_canje_info.val_monto_descuento
                                END
                            ), 0)
                            FROM tab_carrito_productos cp
                            JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                            JOIN tab_product_variant_groups g ON g.id = pv.group_id
                            JOIN tab_products p ON p.id = g.product_id
                            WHERE cp.id_carrito = p_id_carrito
                                AND p.category_id = v_canje_info.category_id_aplica
                                AND cp.cantidad >= COALESCE(v_canje_info.cantidad_minima_producto, 0)
                                AND (cp.cantidad * cp.precio_unitario_carrito) >= COALESCE(v_canje_info.monto_minimo_producto, 0))
                        WHEN v_canje_info.aplica_a = 'marca_especifica' THEN
                            (SELECT COALESCE(SUM(
                                CASE WHEN v_canje_info.tipo_calculo THEN
                                    (cp.cantidad * cp.precio_unitario_carrito * v_canje_info.val_porce_descuento / 100)
                                ELSE
                                    cp.cantidad * v_canje_info.val_monto_descuento
                                END
                            ), 0)
                            FROM tab_carrito_productos cp
                            JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                            JOIN tab_product_variant_groups g ON g.id = pv.group_id
                            JOIN tab_products p ON p.id = g.product_id AND p.is_active = TRUE
                            WHERE cp.id_carrito = p_id_carrito
                                AND p.id_marca = v_canje_info.id_marca_aplica
                                AND cp.cantidad >= COALESCE(v_canje_info.cantidad_minima_producto, 0)
                                AND (cp.cantidad * cp.precio_unitario_carrito) >= COALESCE(v_canje_info.monto_minimo_producto, 0))
                        WHEN v_canje_info.aplica_a IN ('linea_especifica', 'sublinea_especifica') THEN
                            0
                        ELSE 0
                    END
            INTO v_descuento_canje_valor;

            -- Aplicar el descuento si es mayor a 0
            IF v_descuento_canje_valor > 0 THEN
                v_total_descuentos := v_total_descuentos + v_descuento_canje_valor;

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
            END IF;
        ELSE
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
    
    -- PASO 9: Siempre crear una nueva orden (no actualizar órdenes existentes)
    -- Esto evita sobreescribir órdenes anteriores del usuario
    -- PASO 10: Generar nuevo ID de orden
            SELECT COALESCE(MAX(id_orden), 0) + 1 INTO v_id_orden FROM tab_ordenes;
            
    -- PASO 11: Crear la orden principal (ind_estado y metodo_pago opcionales: cuando pago ya aprobado)
    -- Nota: trg_limpiar_carrito_pagado está definido solo para UPDATE; si la orden se crea ya como
    -- Pagada (INSERT ind_estado=2), la limpieza del carrito se hace en PASO 12b más abajo.
        INSERT INTO tab_ordenes (
            id_orden, id_usuario, val_total_productos, val_total_descuentos, 
            val_total_pedido, ind_estado, metodo_pago, des_observaciones,
                detalle_descuentos_aplicados, usr_insert
        ) VALUES (
            v_id_orden, 
                v_id_usuario,
            v_total_productos,
            v_total_descuentos,
            v_total_final, 
            COALESCE(p_ind_estado, 1),  -- 1=Pendiente por defecto; 2=Pagada cuando pago ya aprobado
            p_metodo_pago,  -- NULL por defecto; 'tarjeta'/'transferencia'/etc cuando pago aprobado
            p_observaciones,
                v_descuentos_aplicados,
            p_usr_operacion
        );
        
    -- PASO 12: Transferir productos del carrito a la orden (variant_id + opciones_elegidas)
        FOR v_producto_record IN 
            SELECT id_carrito_producto, variant_id, cantidad, precio_unitario_carrito,
                   COALESCE(opciones_elegidas, '{}'::JSONB) AS opciones_elegidas
            FROM tab_carrito_productos WHERE id_carrito = p_id_carrito
        LOOP
            INSERT INTO tab_orden_productos (
                id_orden_producto,
                id_orden,
                variant_id,
                cant_producto,
                precio_unitario_orden,
                subtotal,
                opciones_elegidas,
                usr_insert,
                fec_insert
            ) VALUES (
                (SELECT COALESCE(MAX(id_orden_producto), 0) + 1 FROM tab_orden_productos),
                v_id_orden,
                v_producto_record.variant_id,
                v_producto_record.cantidad,
                v_producto_record.precio_unitario_carrito,
                (v_producto_record.cantidad * v_producto_record.precio_unitario_carrito),
                v_producto_record.opciones_elegidas,
                p_usr_operacion,
                NOW()
            );
        END LOOP;

    -- PASO 12b: Si la orden se creó ya como Pagada, limpiar el carrito aquí (el trigger
    -- trg_limpiar_carrito_pagado solo se dispara en UPDATE; si disparara en INSERT, vaciaría
    -- el carrito antes de PASO 12 y no se copiarían ítems a tab_orden_productos).
        IF COALESCE(p_ind_estado, 1) = 2 THEN
            DELETE FROM tab_carrito_productos WHERE id_carrito = p_id_carrito;
            UPDATE tab_carritos SET usr_update = p_usr_operacion, fec_update = NOW() WHERE id_carrito = p_id_carrito;
        END IF;
        
    -- PASO 13: Marcar canje como utilizado (si se aplicó)
        IF p_id_canje IS NOT NULL AND v_descuento_canje IS NOT NULL THEN
            UPDATE tab_canjes_puntos_descuentos
            SET ind_utilizado = TRUE,
                fec_utilizacion = NOW(),
                id_orden_aplicado = v_id_orden,
                usr_update = p_usr_operacion
            WHERE id_canje = p_id_canje;
            
            -- Registrar uso del descuento canjeado (si hay usuario)
            IF v_id_usuario IS NOT NULL AND v_canje_info.id_descuento IS NOT NULL THEN
                PERFORM fun_registrar_uso_descuento(v_canje_info.id_descuento, v_id_usuario, p_usr_operacion);
            END IF;
        END IF;
        
    -- PASO 13.5: Registrar usos de descuentos aplicados (código y automáticos)
        -- Registrar uso del descuento por código (si se aplicó y hay usuario)
        IF v_descuento_codigo IS NOT NULL AND v_id_usuario IS NOT NULL THEN
            PERFORM fun_registrar_uso_descuento(
                (v_descuento_codigo->>'id_descuento')::DECIMAL,
                v_id_usuario,
                p_usr_operacion
            );
        END IF;
        
        -- Registrar usos de descuentos automáticos (si hay usuario)
        IF v_id_usuario IS NOT NULL AND v_descuentos_automaticos IS NOT NULL AND json_array_length(v_descuentos_automaticos) > 0 THEN
            FOR v_descuento_auto IN 
                SELECT (elem->>'id_descuento')::DECIMAL AS id_descuento_val
                FROM json_array_elements(v_descuentos_automaticos) AS elem
                WHERE (elem->>'id_descuento') IS NOT NULL
            LOOP
                PERFORM fun_registrar_uso_descuento(
                    v_descuento_auto.id_descuento_val,
                    v_id_usuario,
                    p_usr_operacion
                );
            END LOOP;
        END IF;
        
    -- PASO 14: Productos transferidos exitosamente a la orden
        -- NOTA: El carrito se mantiene intacto hasta que se PAGUE la orden
        --       El trigger trg_limpiar_carrito_pagado se encarga de limpiarlo automáticamente
        --       Esto permite que el usuario pueda cancelar y seguir comprando si es necesario
        
        -- RESPUESTA: Orden procesada exitosamente
        RETURN json_build_object(
            'success', true, 
        'message', 'Orden creada exitosamente',
        'accion_realizada', 'crear',
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
            'orden_actualizada', false
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
$$ LANGUAGE plpgsql; 