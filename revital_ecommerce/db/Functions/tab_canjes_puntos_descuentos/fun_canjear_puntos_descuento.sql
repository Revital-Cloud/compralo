/*
 * FUNCIÓN: fun_canjear_puntos_descuento
 * 
 * DESCRIPCIÓN: Permite a un usuario canjear sus puntos acumulados por un descuento
 *              específico, descontando los puntos y creando un canje disponible.
 *              INTELIGENCIA AGREGADA: Si el usuario tiene un carrito activo que
 *              cumple los criterios del descuento, lo aplica automáticamente.
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario que realiza el canje (obligatorio)
 *   - p_id_descuento: ID del descuento que se desea canjear (obligatorio)
 * 
 * RETORNA: JSON - Objeto con resultado de la operación:
 *   - success: booleano indicando éxito o fallo
 *   - message: mensaje descriptivo del resultado
 *   - id_canje: ID del canje creado (si es exitoso)
 *   - descuento: nombre del descuento canjeado
 *   - puntos_utilizados: cantidad de puntos descontados
 *   - puntos_restantes: puntos que le quedan al usuario
 *   - aplicado_automaticamente: boolean si se aplicó al carrito actual
 *   - valor_descuento_aplicado: monto del descuento si se aplicó automáticamente
 *   - total_carrito_anterior: total del carrito antes del descuento
 *   - total_carrito_final: total del carrito después del descuento
 * 
 * LÓGICA:
 *   1. Validar que el descuento existe y es canjeable por puntos
 *   2. Verificar que está vigente (fechas y estado activo)
 *   3. Verificar que el usuario tiene puntos suficientes
 *   4. Descontar puntos del usuario y actualizar totales
 *   5. Crear registro de canje con expiración (30 días)
 *   6. Registrar movimiento de puntos para auditoría
 *   7. NUEVO: Buscar carrito activo del usuario
 *   8. NUEVO: Si carrito cumple criterios, aplicar descuento automáticamente
 *   9. Retornar confirmación con detalles del canje y aplicación automática
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_canjear_puntos_descuento(
    p_id_usuario tab_usuarios.id_usuario%TYPE,
    p_id_descuento tab_descuentos.id_descuento%TYPE,
    p_usr_operacion tab_canjes_puntos_descuentos.usr_insert%TYPE
) RETURNS JSON AS $$
DECLARE
    v_descuento RECORD;
    v_puntos_usuario INT;
    v_puntos_anteriores INT;
    v_puntos_nuevos INT;
    v_id_canje INT;
    
    -- Variables para aplicación automática al carrito
    v_id_carrito tab_carritos.id_carrito%TYPE;
    v_carrito_total DECIMAL(10,2);
    v_descuento_aplicado DECIMAL(10,2) := 0;
    v_total_final DECIMAL(10,2);
    v_aplicado_automaticamente BOOLEAN := FALSE;
    v_calculo_carrito JSON;
BEGIN
    -- PASO 1: Verificar que el descuento existe y es canjeable
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
            WHEN (d.fec_inicio IS NULL AND d.fec_fin IS NULL) 
                 OR (d.fec_inicio IS NOT NULL AND d.fec_fin IS NOT NULL AND CURRENT_DATE BETWEEN d.fec_inicio AND d.fec_fin) 
            THEN TRUE 
            ELSE FALSE 
        END AS vigente
    INTO v_descuento
    FROM tab_descuentos d
    WHERE d.id_descuento = p_id_descuento;
    
    -- VALIDACIÓN 1: Existencia del descuento
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Descuento no encontrado');
    END IF;
    
    -- VALIDACIÓN 2: Verificar que es canjeable por puntos
    IF NOT v_descuento.ind_canjeable_puntos THEN
        RETURN json_build_object('success', false, 'message', 'Este descuento no es canjeable por puntos');
    END IF;
    
    -- VALIDACIÓN 3: Verificar vigencia para canje (fechas null = siempre; con fechas = current entre ellas)
    IF NOT v_descuento.vigente THEN
        RETURN json_build_object('success', false, 'message', 'El descuento no está vigente para canje');
    END IF;

    -- PASO 2: Asegurar que el usuario tenga registro de puntos
    INSERT INTO tab_puntos_usuario (id_usuario, usr_insert)
    VALUES (p_id_usuario, p_usr_operacion)
    ON CONFLICT (id_usuario) DO NOTHING;
    
    -- PASO 3: Verificar puntos disponibles del usuario
    SELECT COALESCE(puntos_disponibles, 0) INTO v_puntos_usuario
    FROM tab_puntos_usuario
    WHERE id_usuario = p_id_usuario;
    
    -- VALIDACIÓN 4: Verificar puntos suficientes
    IF v_puntos_usuario < v_descuento.costo_puntos_canje THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Puntos insuficientes',
            'puntos_necesarios', v_descuento.costo_puntos_canje,
            'puntos_disponibles', v_puntos_usuario
        );
    END IF;
    
    -- PASO 4: Calcular nuevos totales de puntos
    v_puntos_anteriores := v_puntos_usuario;
    v_puntos_nuevos := v_puntos_anteriores - v_descuento.costo_puntos_canje;
    
    -- PASO 5: Actualizar puntos del usuario
    UPDATE tab_puntos_usuario
    SET puntos_disponibles = v_puntos_nuevos,
        puntos_totales_canjeados = puntos_totales_canjeados + v_descuento.costo_puntos_canje,
        fec_ultimo_canje = NOW(),
        usr_update = p_usr_operacion
    WHERE id_usuario = p_id_usuario;
    
    -- PASO 6: Registrar el canje (válido por 30 días)
    INSERT INTO tab_canjes_puntos_descuentos (
        id_usuario, id_descuento, puntos_utilizados,
        fec_expiracion_canje, usr_insert
    ) VALUES (
        p_id_usuario, p_id_descuento, v_descuento.costo_puntos_canje,
        CURRENT_DATE + INTERVAL '30 days', p_usr_operacion
    ) RETURNING id_canje INTO v_id_canje;
    
    -- PASO 7: Registrar movimiento de puntos para auditoría (tipo 2 = canje)
    INSERT INTO tab_movimientos_puntos (
        id_usuario, tipo_movimiento, cantidad_puntos,
        puntos_disponibles_anterior, puntos_disponibles_actual,
        id_descuento_canjeado, descripcion, usr_insert
    ) VALUES (
        p_id_usuario, 2, -v_descuento.costo_puntos_canje,
        v_puntos_anteriores, v_puntos_nuevos,
        p_id_descuento,
        CONCAT('Canje por descuento: ', v_descuento.nom_descuento),
        p_usr_operacion
    );
    
    -- PASO 8 NUEVO: Buscar carrito activo del usuario y verificar si aplica automáticamente
    SELECT c.id_carrito INTO v_id_carrito
    FROM tab_carritos c
    WHERE c.id_usuario = p_id_usuario
        AND EXISTS (
            SELECT 1 FROM tab_carrito_productos cp 
            WHERE cp.id_carrito = c.id_carrito
        )
    ORDER BY c.fec_update DESC
    LIMIT 1;
    
    -- Si el usuario tiene un carrito activo, verificar si el descuento aplica
    IF v_id_carrito IS NOT NULL THEN
        BEGIN
            -- Calcular total del carrito con el canje recién creado
            SELECT fun_calcular_total_carrito(
                p_id_usuario, 
                NULL, -- session_id 
                v_id_canje -- aplicar el canje recién creado
            ) INTO v_calculo_carrito;
            
            -- Extraer información del cálculo
            IF (v_calculo_carrito->>'success')::BOOLEAN = TRUE THEN
                v_carrito_total := (v_calculo_carrito->>'total_productos')::DECIMAL;
                v_total_final := (v_calculo_carrito->>'total_final')::DECIMAL;
                
                -- Verificar si el descuento se aplicó (buscar en descuentos aplicados)
                IF v_calculo_carrito->'descuentos_aplicados' IS NOT NULL AND 
                   json_array_length(v_calculo_carrito->'descuentos_aplicados') > 0 THEN
                    
                    -- Buscar si nuestro canje está en los descuentos aplicados
                    SELECT SUM((descuento->>'descuento_aplicado')::DECIMAL)
                    INTO v_descuento_aplicado
                    FROM json_array_elements(v_calculo_carrito->'descuentos_aplicados') AS descuento
                    WHERE (descuento->>'id_canje')::INT = v_id_canje;
                    
                    -- Si se aplicó el descuento, marcarlo como utilizado automáticamente
                    IF v_descuento_aplicado > 0 THEN
                        v_aplicado_automaticamente := TRUE;
                        
                        -- Marcar el canje como utilizado automáticamente en el carrito
                        UPDATE tab_canjes_puntos_descuentos
                        SET ind_utilizado = TRUE,
                            fec_utilizacion = NOW(),
                            usr_update = p_usr_operacion
                        WHERE id_canje = v_id_canje;
                    END IF;
                END IF;
            END IF;
        EXCEPTION 
            WHEN OTHERS THEN
                -- Si hay error en el cálculo del carrito, continuar sin aplicación automática
                v_aplicado_automaticamente := FALSE;
        END;
    END IF;
    
    -- RESPUESTA: Confirmar éxito del canje con información de aplicación automática
    RETURN json_build_object(
        'success', true,
        'message', CASE 
            WHEN v_aplicado_automaticamente THEN 
                'Descuento canjeado y aplicado automáticamente a tu carrito actual'
            ELSE 
                'Descuento canjeado exitosamente. Disponible para usar en tu próxima compra'
        END,
        'id_canje', v_id_canje,
        'descuento', v_descuento.nom_descuento,
        'puntos_utilizados', v_descuento.costo_puntos_canje,
        'puntos_restantes', v_puntos_nuevos,
        'aplicado_automaticamente', v_aplicado_automaticamente,
        'valor_descuento_aplicado', COALESCE(v_descuento_aplicado, 0),
        'total_carrito_anterior', COALESCE(v_carrito_total, 0),
        'total_carrito_final', COALESCE(v_total_final, 0),
        'id_carrito_aplicado', CASE WHEN v_aplicado_automaticamente THEN v_id_carrito ELSE NULL END
    );

-- MANEJO DE ERRORES: Capturar excepciones inesperadas
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Error inesperado: ' || SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql; 