/*
 * FUNCIÓN: fun_calcular_total_carrito
 * 
 * DESCRIPCIÓN: Función principal que calcula el total del carrito aplicando descuentos
 *              automáticos de empresa disponibles + descuentos canjeados por puntos.
 *              Soporta tanto usuarios registrados como usuarios anónimos.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario registrado (opcional)
 *   - p_session_id: ID de sesión para usuarios anónimos (opcional)
 *   - p_id_canje_aplicar: ID del canje de puntos a aplicar (opcional)
 * 
 * RETORNA: JSON con estructura completa:
 *   - total_productos: Monto total de productos sin descuentos
 *   - total_descuentos: Monto total de descuentos aplicados
 *   - total_final: Monto final a pagar (productos - descuentos)
 *   - descuentos_aplicados: Array de descuentos aplicados con detalles
 *   - descuentos_automaticos: Descuentos automáticos de empresa aplicados
 *   - descuento_canjeado: Descuento canjeado por puntos aplicado
 *   - es_primera_compra: Indicador si es primera compra del usuario
 *   - mensaje: Mensaje descriptivo del resultado
 * 
 * LÓGICA:
 *   1. Aplicar TODOS los descuentos automáticos de empresa activos y aplicables
 *   2. Aplicar UN descuento canjeado por puntos (si se especifica)
 *   3. Sumar todos los descuentos para el total
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_calcular_total_carrito(
    p_id_usuario tab_usuarios.id_usuario%TYPE DEFAULT NULL,      -- ID del usuario registrado (opcional)
    p_session_id tab_carritos.session_id%TYPE DEFAULT NULL,      -- ID de sesión para usuarios anónimos (opcional)
    p_id_canje_aplicar tab_canjes_puntos_descuentos.id_canje%TYPE DEFAULT NULL  -- ID opcional del canje a aplicar
) RETURNS JSON AS $$
DECLARE
    -- Variables principales del proceso
    v_id_carrito INT;                                           -- ID del carrito del usuario
    v_total_productos DECIMAL(10,2) := 0;                      -- Total de productos sin descuentos
    v_total_descuentos DECIMAL(10,2) := 0;                     -- Total de descuentos aplicados
    v_total_final DECIMAL(10,2);                               -- Total final a pagar
    v_descuentos_aplicados JSON := '[]'::JSON;                 -- Array de descuentos aplicados
    v_descuento RECORD;                                         -- Record para iterar descuentos
    v_es_primera_compra BOOLEAN;                                -- Indicador primera compra
    
    -- Variables para  lógica simplificada
    v_descuentos_automaticos JSON := '[]'::JSON;               -- Array de descuentos automáticos
    v_descuento_canjeado JSON;                                  -- Descuento canjeado por puntos
    v_total_desc_automaticos DECIMAL(10,2) := 0;               -- Total descuentos automáticos
    v_total_desc_canjeado DECIMAL(10,2) := 0;                  -- Total descuento canjeado
    v_canje_info RECORD;                                        -- Información del canje de puntos
    v_puntos_a_ganar INT;
    

BEGIN
    -- VALIDACIÓN: Al menos uno de los parámetros debe ser proporcionado
    IF p_id_usuario IS NULL AND p_session_id IS NULL THEN
        RAISE EXCEPTION 'Al menos uno de los parámetros (p_id_usuario o p_session_id) debe ser proporcionado';
    END IF;
    
    -- VALIDACIÓN: Solo usuarios registrados pueden comprar (y por tanto tener descuentos)
    -- Los usuarios anónimos solo pueden ver el carrito pero no pueden proceder al pago
    IF p_id_usuario IS NULL THEN
        -- Para usuarios anónimos, solo calcular total sin descuentos
        v_id_carrito := fun_obtener_carrito_usuario(p_id_usuario, p_session_id);
        
        -- Calcular total de productos sin descuentos
        SELECT COALESCE(SUM(cantidad * precio_unitario_carrito), 0) INTO v_total_productos
        FROM tab_carrito_productos
        WHERE id_carrito = v_id_carrito;
        
        -- Retornar resultado sin descuentos para usuarios anónimos
        RETURN json_build_object(
            'success', true,
            'total_final', v_total_productos,
            'total_productos', v_total_productos,
            'total_descuentos', 0,
            'ahorro_total', 0,
            'resumen', json_build_object(
                'subtotal', v_total_productos,
                'descuentos', 0,
                'total_a_pagar', v_total_productos,
                'ahorro_porcentaje', 0
            ),
            'descuentos_aplicados', NULL,
            'descuentos_automaticos', '[]'::JSON,
            'descuento_canjeado', NULL,
            'total_desc_automaticos', 0,
            'total_desc_canjeado', 0,
            'es_primera_compra', FALSE,
            'puntos_a_ganar', 0,
            'id_canje_aplicado', NULL,
            'mensaje', 'Regístrate para acceder a descuentos y puntos',
            'mensaje_puntos', 'Regístrate para acumular puntos',
            'mensaje_resumen', 'Total: $' || v_total_productos || ' (regístrate para descuentos)'
        );
    END IF;

    -- PASO 1: Obtener carrito del usuario
    -- Busca el carrito activo del usuario especificado (logueado o anónimo)
    v_id_carrito := fun_obtener_carrito_usuario(p_id_usuario, p_session_id);
    
    -- PASO 2: Calcular total de productos sin descuentos
    -- Suma cantidad × precio de todos los productos en el carrito
    -- COALESCE asegura que devuelva 0 si el carrito está vacío (SUM devolvería NULL)
    SELECT COALESCE(SUM(cantidad * precio_unitario_carrito), 0) INTO v_total_productos
    FROM tab_carrito_productos
    WHERE id_carrito = v_id_carrito;
    
    -- VALIDACIÓN: Si el carrito está vacío, retornar inmediatamente
    -- Evita procesar descuentos innecesariamente en carritos sin productos
    IF v_total_productos = 0 THEN
        RETURN json_build_object(
            'total_productos', 0,
            'total_descuentos', 0,
            'total_final', 0,
            'descuentos_aplicados', '[]'::JSON,
            'descuentos_automaticos', '[]'::JSON,
            'descuento_canjeado', NULL,
            'message', 'Carrito vacío'
        );
    END IF;
    
    -- PASO 3: Verificar si es primera compra del usuario
    -- NOT EXISTS verifica que NO exista ninguna orden previa del usuario
    -- Útil para aplicar descuentos de bienvenida a nuevos clientes
    -- Solo aplica para usuarios registrados
    IF p_id_usuario IS NOT NULL THEN
    SELECT NOT EXISTS (
        SELECT 1 FROM tab_ordenes WHERE id_usuario = p_id_usuario
    ) INTO v_es_primera_compra;
    ELSE
        v_es_primera_compra := FALSE; -- Usuarios anónimos no pueden tener "primera compra"
    END IF;
    
    -- PASO 4: Buscar y aplicar TODOS los descuentos automáticos disponibles y aplicables
    -- FOR LOOP itera sobre cada descuento automático que cumple las condiciones
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
                    -- TIPO 1: Descuento por total del pedido (o 'todos' = aplicar al total)
                    -- Se aplica cuando el total del carrito cumple el mínimo requerido
                    WHEN d.aplica_a IN ('total_pedido', 'todos') AND v_total_productos >= COALESCE(d.min_valor_pedido, 0) THEN
                        CASE WHEN d.tipo_calculo THEN 
                           -- Descuento porcentual: calcula % sobre el total
                           v_total_productos * d.val_porce_descuento / 100
                        ELSE 
                            -- Descuento fijo: aplica monto fijo pero no puede ser mayor al total
                            LEAST(d.val_monto_descuento, v_total_productos)
                        END
                    WHEN d.aplica_a = 'producto_especifico' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN d.tipo_calculo THEN (cp.cantidad * cp.precio_unitario_carrito * d.val_porce_descuento / 100)
                            ELSE LEAST(cp.cantidad, 1) * d.val_monto_descuento END
                        ), 0)
                        FROM tab_carrito_productos cp
                        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                        JOIN tab_product_variant_groups g ON g.id = pv.group_id
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE cp.id_carrito = v_id_carrito
                            AND p.id = d.product_id_aplica
                            AND cp.cantidad >= d.cantidad_minima_producto
                            AND (cp.cantidad * cp.precio_unitario_carrito) >= d.monto_minimo_producto)
                    WHEN d.aplica_a = 'categoria_especifica' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN d.tipo_calculo THEN (cp.cantidad * cp.precio_unitario_carrito * d.val_porce_descuento / 100)
                            ELSE cp.cantidad * d.val_monto_descuento END
                        ), 0)
                        FROM tab_carrito_productos cp
                        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                        JOIN tab_product_variant_groups g ON g.id = pv.group_id
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE cp.id_carrito = v_id_carrito
                            AND p.category_id = d.category_id_aplica
                            AND cp.cantidad >= d.cantidad_minima_producto
                            AND (cp.cantidad * cp.precio_unitario_carrito) >= d.monto_minimo_producto)
                    WHEN d.aplica_a = 'marca_especifica' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN d.tipo_calculo THEN (cp.cantidad * cp.precio_unitario_carrito * d.val_porce_descuento / 100)
                            ELSE cp.cantidad * d.val_monto_descuento END
                        ), 0)
                        FROM tab_carrito_productos cp
                        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                        JOIN tab_product_variant_groups g ON g.id = pv.group_id
                        JOIN tab_products p ON p.id = g.product_id AND p.is_active = TRUE
                        WHERE cp.id_carrito = v_id_carrito
                            AND p.id_marca = d.id_marca_aplica
                            AND cp.cantidad >= d.cantidad_minima_producto
                            AND (cp.cantidad * cp.precio_unitario_carrito) >= d.monto_minimo_producto)
                    -- Si no aplica ningún tipo, descuento = 0
                    ELSE 0
                END AS descuento_calculado
        FROM tab_descuentos d
        WHERE d.ind_activo = TRUE                                                    -- Solo descuentos activos
            AND (d.fec_inicio IS NULL OR d.fec_inicio <= CURRENT_DATE)               -- Fecha inicio: NULL = sin restricción
            AND (d.fec_fin IS NULL OR d.fec_fin >= CURRENT_DATE)                     -- Fecha fin: NULL = sin restricción (permite primera compra, cupón)
            AND d.ind_canjeable_puntos = FALSE                                      -- Solo descuentos automáticos (no canjeables)
            AND d.requiere_codigo = FALSE                                           -- Sin código requerido (automáticos)
            AND (d.codigo_descuento IS NULL OR d.codigo_descuento = '')            -- NO debe tener código definido (automáticos puros)
            -- Función que valida reglas adicionales del descuento
            -- Solo aplicar descuentos a usuarios registrados (los anónimos no pueden comprar)
            AND p_id_usuario IS NOT NULL 
            AND fun_validar_descuento_aplicable(d.id_descuento, p_id_usuario, NULL::VARCHAR, p_id_usuario) = TRUE
    LOOP
        -- PASO 5: Aplicar descuento automático si es aplicable
        -- Solo agrega descuentos que realmente tienen valor > 0
        IF v_descuento.descuento_calculado > 0 THEN
            -- Acumular al total de descuentos automáticos
            v_total_desc_automaticos := v_total_desc_automaticos + v_descuento.descuento_calculado;
            
            -- Agregar descuento automático al array
            -- Utiliza UNION ALL para combinar elementos existentes con el nuevo
            v_descuentos_automaticos := (
                SELECT json_agg(elemento)
                FROM (
                    -- Elementos ya existentes en el array
                    SELECT json_array_elements(v_descuentos_automaticos) AS elemento
                    UNION ALL
                    -- Nuevo elemento a agregar
                    SELECT json_build_object(
                        'id_descuento', v_descuento.id_descuento,
                        'nombre', v_descuento.nom_descuento,
                        -- Convierte tipo_calculo booleano a texto descriptivo
                        'tipo', CASE WHEN v_descuento.tipo_calculo THEN 'porcentaje' ELSE 'monto_fijo' END,
                        -- Muestra el valor original del descuento (% o monto)
                        'valor', CASE WHEN v_descuento.tipo_calculo THEN v_descuento.val_porce_descuento ELSE v_descuento.val_monto_descuento END,
                        -- Valor real aplicado en este carrito específico
                        'descuento_aplicado', v_descuento.descuento_calculado,
                        'aplica_a', v_descuento.aplica_a,
                        'tipo_descuento', 'automatico'
                    )
                ) AS subconsulta
            );
        END IF;
    END LOOP;

    -- PASO 6: Aplicar descuento canjeado por puntos (si se especifica)
    -- Solo procesa si el usuario pasó un ID de canje válido Y es un usuario registrado
    IF p_id_canje_aplicar IS NOT NULL AND p_id_usuario IS NOT NULL THEN
        -- Obtener información del canje y verificar que sea válido
        -- JOIN con descuentos para obtener toda la configuración necesaria
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
        WHERE c.id_canje = p_id_canje_aplicar
            -- Debe pertenecer al usuario que hace la consulta
            AND c.id_usuario = p_id_usuario
            -- No debe estar ya utilizado
            AND c.ind_utilizado = FALSE
            -- No debe estar expirado (si tiene fecha de expiración)
            AND (c.fec_expiracion_canje IS NULL OR c.fec_expiracion_canje >= CURRENT_DATE);

        -- Si el canje es válido, calcular el descuento
        -- FOUND es TRUE si la consulta anterior encontró registros
        IF FOUND THEN
            -- Calcular descuento usando la misma lógica que descuentos automáticos
            -- pero aplicando la configuración específica del canje
            SELECT 
                CASE 
                    -- TIPO 1: Descuento por total del pedido
                    WHEN v_canje_info.aplica_a = 'total_pedido' AND v_total_productos >= COALESCE(v_canje_info.min_valor_pedido, 0) THEN
                        CASE WHEN v_canje_info.tipo_calculo THEN 
                            -- Porcentual: sin límite máximo para canjes (ya pagaron puntos)
                           LEAST(v_total_productos * v_canje_info.val_porce_descuento / 100, v_total_productos)
                        ELSE 
                            -- Fijo: no puede exceder el total del carrito
                            LEAST(v_canje_info.val_monto_descuento, v_total_productos)
                        END
                    WHEN v_canje_info.aplica_a = 'producto_especifico' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN v_canje_info.tipo_calculo THEN (cp.cantidad * cp.precio_unitario_carrito * v_canje_info.val_porce_descuento / 100)
                            ELSE LEAST(cp.cantidad, 1) * v_canje_info.val_monto_descuento END
                        ), 0)
                        FROM tab_carrito_productos cp
                        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                        JOIN tab_product_variant_groups g ON g.id = pv.group_id
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE cp.id_carrito = v_id_carrito
                            AND p.id = v_canje_info.product_id_aplica
                            AND cp.cantidad >= v_canje_info.cantidad_minima_producto
                            AND (cp.cantidad * cp.precio_unitario_carrito) >= v_canje_info.monto_minimo_producto)
                    WHEN v_canje_info.aplica_a = 'categoria_especifica' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN v_canje_info.tipo_calculo THEN (cp.cantidad * cp.precio_unitario_carrito * v_canje_info.val_porce_descuento / 100)
                            ELSE cp.cantidad * v_canje_info.val_monto_descuento END
                        ), 0)
                        FROM tab_carrito_productos cp
                        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                        JOIN tab_product_variant_groups g ON g.id = pv.group_id
                        JOIN tab_products p ON p.id = g.product_id
                        WHERE cp.id_carrito = v_id_carrito
                            AND p.category_id = v_canje_info.category_id_aplica
                            AND cp.cantidad >= v_canje_info.cantidad_minima_producto
                            AND (cp.cantidad * cp.precio_unitario_carrito) >= v_canje_info.monto_minimo_producto)
                    WHEN v_canje_info.aplica_a = 'marca_especifica' THEN
                        (SELECT COALESCE(SUM(
                            CASE WHEN v_canje_info.tipo_calculo THEN (cp.cantidad * cp.precio_unitario_carrito * v_canje_info.val_porce_descuento / 100)
                            ELSE cp.cantidad * v_canje_info.val_monto_descuento END
                        ), 0)
                        FROM tab_carrito_productos cp
                        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                        JOIN tab_product_variant_groups g ON g.id = pv.group_id
                        JOIN tab_products p ON p.id = g.product_id AND p.is_active = TRUE
                        WHERE cp.id_carrito = v_id_carrito
                            AND p.id_marca = v_canje_info.id_marca_aplica
                            AND cp.cantidad >= v_canje_info.cantidad_minima_producto
                            AND (cp.cantidad * cp.precio_unitario_carrito) >= v_canje_info.monto_minimo_producto)
                    WHEN v_canje_info.aplica_a IN ('linea_especifica', 'sublinea_especifica') THEN 0
                    ELSE 0
                END INTO v_total_desc_canjeado;

            -- Si el descuento canjeado es aplicable, agregarlo
            -- Solo construye el objeto JSON si realmente hay descuento
            IF v_total_desc_canjeado > 0 THEN
                v_descuento_canjeado := json_build_object(
                    'id_canje', v_canje_info.id_canje,
                    'id_descuento', v_canje_info.id_descuento,
                    'nombre', v_canje_info.nom_descuento,
                    -- Convierte tipo_calculo booleano a texto descriptivo
                    'tipo', CASE WHEN v_canje_info.tipo_calculo THEN 'porcentaje' ELSE 'monto_fijo' END,
                    -- Valor original configurado en el descuento
                    'valor', CASE WHEN v_canje_info.tipo_calculo THEN v_canje_info.val_porce_descuento ELSE v_canje_info.val_monto_descuento END,
                    -- Valor realmente aplicado en este carrito
                    'descuento_aplicado', v_total_desc_canjeado,
                    'aplica_a', v_canje_info.aplica_a,
                    -- Información adicional específica de canjes
                    'puntos_utilizados', v_canje_info.puntos_utilizados,
                    'tipo_descuento', 'canjeado'
                );
            END IF;
        END IF;
    END IF;

    -- PASO 7: Sumar todos los descuentos
    -- Combina descuentos automáticos y canjeados en un total único
    v_total_descuentos := v_total_desc_automaticos + v_total_desc_canjeado;
    
    -- Construir array combinado de descuentos aplicados
    -- Solo mostrar descuentos_aplicados cuando hay MIX de automáticos y canjeados
    IF v_total_desc_automaticos > 0 AND v_total_desc_canjeado > 0 THEN
        -- Combinar automáticos y canjeado (ambos tipos presentes)
        v_descuentos_aplicados := (
            SELECT json_agg(elemento)
            FROM (
                -- Todos los descuentos automáticos
                SELECT json_array_elements(v_descuentos_automaticos) AS elemento
                UNION ALL
                -- El descuento canjeado
                SELECT v_descuento_canjeado AS elemento
            ) AS combinados
        );
    ELSE
        -- Solo un tipo de descuento: no duplicar información
        v_descuentos_aplicados := NULL; -- No mostrar campo duplicado
    END IF;
    
    -- PASO 8: Validación final - el descuento nunca puede exceder el total de productos
    -- LEAST asegura que el descuento nunca haga el total negativo
    v_total_descuentos := LEAST(v_total_descuentos, v_total_productos);
    -- Calcula el monto final que debe pagar el cliente
    v_total_final := v_total_productos - v_total_descuentos;
    
    -- NUEVO: Calcular puntos que ganará por esta compra (solo usuarios registrados)
    -- IMPORTANTE: Los puntos se calculan sobre el valor ANTES de descuentos para incentivar las compras
    IF p_id_usuario IS NOT NULL THEN
        -- Intentar calcular puntos, pero manejar caso donde no hay configuración activa
        BEGIN
            v_puntos_a_ganar := fun_calcular_puntos_por_compra(v_total_productos);
        EXCEPTION
            WHEN OTHERS THEN
                -- Si no hay configuración de puntos activa, no generar puntos
                v_puntos_a_ganar := 0;
        END;
    ELSE
        v_puntos_a_ganar := 0; -- Usuarios anónimos no acumulan puntos
    END IF;
    
    -- PASO 9: Construir respuesta JSON con todos los resultados del cálculo
    -- Retorna estructura completa con toda la información del cálculo
    RETURN json_build_object(
        -- === TOTALES PRINCIPALES (información más importante primero) ===
        'success', true,
        'total_final', v_total_final,                               -- TOTAL A PAGAR (más prominente)
        'total_productos', v_total_productos,                       -- Subtotal de productos sin descuentos
        'total_descuentos', v_total_descuentos,                     -- Total de descuentos aplicados
        'ahorro_total', v_total_descuentos,                         -- Cuánto se ahorra (igual que total_descuentos)
        
        -- === RESUMEN DE TOTALES ===
        'resumen', json_build_object(
            'subtotal', v_total_productos,
            'descuentos', v_total_descuentos,
            'total_a_pagar', v_total_final,
            'ahorro_porcentaje', CASE 
                WHEN v_total_productos > 0 THEN ROUND((v_total_descuentos / v_total_productos) * 100, 2)
                ELSE 0 
            END
        ),
        
        -- === DETALLES DE DESCUENTOS ===
        'descuentos_aplicados', v_descuentos_aplicados,             -- Array detallado de todos los descuentos
        'descuentos_automaticos', v_descuentos_automaticos,         -- Array de descuentos automáticos de empresa
        'descuento_canjeado', v_descuento_canjeado,                 -- Descuento canjeado por puntos
        'total_desc_automaticos', v_total_desc_automaticos,         -- Total de descuentos automáticos
        'total_desc_canjeado', v_total_desc_canjeado,               -- Total de descuento canjeado
        
        -- === INFORMACIÓN DEL USUARIO ===
        'es_primera_compra', v_es_primera_compra,                   -- Indicador para descuentos de bienvenida
        'puntos_a_ganar', v_puntos_a_ganar,                        -- Puntos que ganará con esta compra
        'id_canje_aplicado', p_id_canje_aplicar,                    -- ID del canje aplicado (si aplica)
        
        -- === MENSAJES INFORMATIVOS ===
        'mensaje', CASE 
            WHEN v_total_descuentos > 0 THEN 
                CASE 
                    WHEN v_total_desc_automaticos > 0 AND v_total_desc_canjeado > 0 THEN 'Descuentos automáticos + descuento canjeado aplicados'
                    WHEN v_total_desc_automaticos > 0 THEN 'Descuentos automáticos aplicados'
                    ELSE 'Descuento canjeado aplicado'
                END
            ELSE 'Sin descuentos aplicables' 
        END,
        'mensaje_puntos', CASE 
            WHEN p_id_usuario IS NULL THEN 'Regístrate para acumular puntos'
            WHEN v_puntos_a_ganar > 0 THEN 'Ganarás ' || v_puntos_a_ganar || ' puntos con esta compra'
            ELSE 'Esta compra no genera puntos'
        END,
        'mensaje_resumen', 'Total a pagar: $' || v_total_final || 
            CASE 
                WHEN v_total_descuentos > 0 THEN ' (ahorraste $' || v_total_descuentos || ')'
                ELSE ' (sin descuentos)'
        END
    );
END;
$$ LANGUAGE plpgsql; 