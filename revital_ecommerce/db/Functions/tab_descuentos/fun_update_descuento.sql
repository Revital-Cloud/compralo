/*
 * FUNCIÓN: fun_update_descuento
 * 
 * DESCRIPCIÓN: Actualiza un descuento existente con validaciones completas de negocio.
 *              Maneja tipos de descuento, aplicaciones específicas y configuraciones avanzadas.
 * 
 * PARÁMETROS OBLIGATORIOS:
 *   - p_id_descuento: ID del descuento a actualizar
 *   - p_nom_descuento: Nombre del descuento (mínimo 3 caracteres)
 *   - p_des_descuento: Descripción del descuento
 *   - p_tipo_calculo: Tipo de cálculo ('porcentaje' o 'monto')
 *   - p_val_porce_descuento: Valor porcentual (si aplica)
 *   - p_val_monto_descuento: Valor de monto fijo (si aplica)
 *   - p_aplica_a: A qué aplica ('producto_especifico', 'categoria_especifica', 'marca_especifica', etc.)
 *   - p_fec_inicio: Fecha de inicio de vigencia
 *   - p_fec_fin: Fecha de fin de vigencia
 * 
 * PARÁMETROS OPCIONALES:
 *   - p_id_categoria, p_id_linea, p_id_sublinea: Para productos específicos
 *   - p_id_producto_aplica: ID del producto específico
 *   - p_id_categoria_aplica: ID de categoría específica
 *   - p_id_marca_aplica: ID de marca específica
 *   - p_id_linea_aplica: ID de línea específica (requiere p_id_categoria para FK compuesta)
 *   - p_id_sublinea_aplica: ID de sublínea específica (requiere p_id_categoria e p_id_linea para FK compuesta)
 *   - p_max_usos_total: Máximo número de usos total
 *   - p_codigo_descuento: Código único del descuento
 *   - Y muchos más parámetros de configuración avanzada
 * 
 * RETORNA: JSON - Objeto con resultado de la operación
 * 
 * LÓGICA:
 *   1. Validar que el descuento existe
 *   2. Validar parámetros obligatorios
 *   3. Validar fechas y horarios
 *   4. Validar unicidad de código
 *   5. Validar campos según tipo de aplicación
 *   6. Actualizar descuento con todas las configuraciones
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_update_descuento(
    p_id_descuento                  tab_descuentos.id_descuento%TYPE,
    p_nom_descuento                 tab_descuentos.nom_descuento%TYPE,
    p_des_descuento                 tab_descuentos.des_descuento%TYPE,
    p_tipo_calculo                  tab_descuentos.tipo_calculo%TYPE,
    p_val_porce_descuento           tab_descuentos.val_porce_descuento%TYPE,
    p_val_monto_descuento           tab_descuentos.val_monto_descuento%TYPE,
    p_aplica_a                      tab_descuentos.aplica_a%TYPE,
    p_id_categoria                  tab_descuentos.id_categoria%TYPE,
    p_id_linea                      tab_descuentos.id_linea%TYPE,
    p_id_sublinea                   tab_descuentos.id_sublinea%TYPE,
    p_id_producto_aplica            tab_descuentos.id_producto_aplica%TYPE,
    p_id_categoria_aplica           tab_descuentos.id_categoria_aplica%TYPE,
    p_id_marca_aplica               tab_descuentos.id_marca_aplica%TYPE,
    p_id_linea_aplica               tab_descuentos.id_linea_aplica%TYPE,
    p_id_sublinea_aplica            tab_descuentos.id_sublinea_aplica%TYPE,
    p_min_valor_pedido              tab_descuentos.min_valor_pedido%TYPE,
    p_ind_es_para_cumpleanos       tab_descuentos.ind_es_para_cumpleanos%TYPE,
    p_fec_inicio                    tab_descuentos.fec_inicio%TYPE,
    p_fec_fin                       tab_descuentos.fec_fin%TYPE,
    p_max_usos_total                tab_descuentos.max_usos_total%TYPE,
    p_costo_puntos_canje            tab_descuentos.costo_puntos_canje%TYPE,
    p_ind_canjeable_puntos          tab_descuentos.ind_canjeable_puntos%TYPE,
    p_codigo_descuento              tab_descuentos.codigo_descuento%TYPE,
    p_max_usos_por_usuario          tab_descuentos.max_usos_por_usuario%TYPE,
    p_dias_semana_aplica            tab_descuentos.dias_semana_aplica%TYPE,
    p_horas_inicio                  tab_descuentos.horas_inicio%TYPE,
    p_horas_fin                     tab_descuentos.horas_fin%TYPE,
    p_solo_primera_compra           tab_descuentos.solo_primera_compra%TYPE,
    p_monto_minimo_producto         tab_descuentos.monto_minimo_producto%TYPE,
    p_cantidad_minima_producto      tab_descuentos.cantidad_minima_producto%TYPE,
    p_requiere_codigo               tab_descuentos.requiere_codigo%TYPE,
    p_usr_operacion                 tab_descuentos.usr_update%TYPE
) RETURNS JSON AS $$
DECLARE
    v_existe BOOLEAN := FALSE;
BEGIN
    -- VALIDACIÓN 1: Verificar que el descuento existe
    SELECT EXISTS(SELECT 1 FROM tab_descuentos WHERE id_descuento = p_id_descuento) INTO v_existe;
    
    IF NOT v_existe THEN
        RETURN json_build_object('success', false, 'message', 'El descuento especificado no existe');
    END IF;

    -- VALIDACIÓN 2: Nombre del descuento
    IF p_nom_descuento IS NULL OR LENGTH(TRIM(p_nom_descuento)) < 3 THEN
        RETURN json_build_object('success', false, 'message', 'El nombre del descuento debe tener al menos 3 caracteres');
    END IF;

    -- VALIDACIÓN 3: Fechas de vigencia (ambas NULL o ambas con valor)
    IF (p_fec_inicio IS NULL AND p_fec_fin IS NOT NULL) OR (p_fec_inicio IS NOT NULL AND p_fec_fin IS NULL) THEN
        RETURN json_build_object('success', false, 'message', 'Debe especificar ambas fechas o ninguna');
    END IF;

    -- VALIDACIÓN 4: Coherencia de fechas (si ambas tienen valor)
    IF p_fec_inicio IS NOT NULL AND p_fec_fin IS NOT NULL AND p_fec_fin < p_fec_inicio THEN
        RETURN json_build_object('success', false, 'message', 'La fecha de fin debe ser mayor o igual a la fecha de inicio');
    END IF;

    -- VALIDACIÓN 5: Unicidad del código de descuento
    IF p_codigo_descuento IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM tab_descuentos WHERE codigo_descuento = p_codigo_descuento AND id_descuento != p_id_descuento) THEN
            RETURN json_build_object('success', false, 'message', 'El código de descuento ya existe');
        END IF;
    END IF;

    -- VALIDACIÓN 6: Horarios de aplicación
    IF (p_horas_inicio IS NOT NULL AND p_horas_fin IS NULL) OR (p_horas_inicio IS NULL AND p_horas_fin IS NOT NULL) THEN
        RETURN json_build_object('success', false, 'message', 'Si especifica horarios, debe incluir tanto hora de inicio como de fin');
    END IF;

    -- VALIDACIÓN 7: Campos específicos según tipo de aplicación
    CASE p_aplica_a
        WHEN 'producto_especifico' THEN
            IF p_id_producto_aplica IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de producto específico se requiere id_producto_aplica');
            END IF;
        WHEN 'categoria_especifica' THEN
            IF p_id_categoria_aplica IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de categoría específica se requiere id_categoria_aplica');
            END IF;
        WHEN 'marca_especifica' THEN
            IF p_id_marca_aplica IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de marca específica se requiere id_marca_aplica');
            END IF;
        WHEN 'linea_especifica' THEN
            IF p_id_linea_aplica IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de línea específica se requiere id_linea_aplica');
            END IF;
            IF p_id_categoria IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de línea específica se requiere id_categoria (FK compuesta)');
            END IF;
        WHEN 'sublinea_especifica' THEN
            IF p_id_sublinea_aplica IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de sublínea específica se requiere id_sublinea_aplica');
            END IF;
            IF p_id_categoria IS NULL OR p_id_linea IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de sublínea específica se requieren id_categoria e id_linea (FK compuesta)');
            END IF;
        WHEN 'total_pedido', 'costo_envio', 'envio_gratis', 'segunda_unidad', 'compra_minima' THEN
            -- No requieren campos específicos adicionales
            NULL;
        ELSE
            RETURN json_build_object('success', false, 'message', 'Tipo de aplicación no válido: ' || p_aplica_a);
    END CASE;

    -- ACTUALIZACIÓN: Modificar descuento existente
    UPDATE tab_descuentos SET
        nom_descuento = p_nom_descuento,                               -- Nuevo nombre
        des_descuento = p_des_descuento,                               -- Nueva descripción
        tipo_calculo = p_tipo_calculo,                                 -- Nuevo tipo de cálculo
        val_porce_descuento = p_val_porce_descuento,                   -- Nuevo valor porcentual
        val_monto_descuento = p_val_monto_descuento,                   -- Nuevo monto fijo
        aplica_a = p_aplica_a,                                         -- Nueva aplicación
        id_categoria = p_id_categoria,                                 -- Nueva categoría
        id_linea = p_id_linea,                                         -- Nueva línea
        id_sublinea = p_id_sublinea,                                   -- Nueva sublínea
        id_producto_aplica = p_id_producto_aplica,                     -- Nuevo producto específico
        id_categoria_aplica = p_id_categoria_aplica,                   -- Nueva categoría específica
        id_marca_aplica = p_id_marca_aplica,                           -- Nueva marca específica
        id_linea_aplica = p_id_linea_aplica,                           -- Nueva línea específica
        id_sublinea_aplica = p_id_sublinea_aplica,                     -- Nueva sublínea específica
        min_valor_pedido = p_min_valor_pedido,                         -- Nuevo valor mínimo
        ind_es_para_cumpleanos = p_ind_es_para_cumpleanos,             -- Nuevo indicador cumpleaños
        fec_inicio = p_fec_inicio,                                     -- Nueva fecha inicio
        fec_fin = p_fec_fin,                                           -- Nueva fecha fin
        max_usos_total = p_max_usos_total,                             -- Nuevos usos máximos totales
        costo_puntos_canje = p_costo_puntos_canje,                     -- Nuevo costo puntos canje
        ind_canjeable_puntos = p_ind_canjeable_puntos,                 -- Nuevo indicador canjeable puntos
        codigo_descuento = p_codigo_descuento,                         -- Nuevo código
        max_usos_por_usuario = p_max_usos_por_usuario,                 -- Nuevos usos por usuario
        dias_semana_aplica = p_dias_semana_aplica,                     -- Nuevos días aplicables
        horas_inicio = p_horas_inicio,                                 -- Nueva hora inicio
        horas_fin = p_horas_fin,                                       -- Nueva hora fin
        solo_primera_compra = p_solo_primera_compra,                   -- Nuevo indicador primera compra
        monto_minimo_producto = p_monto_minimo_producto,               -- Nuevo monto mínimo producto
        cantidad_minima_producto = p_cantidad_minima_producto,         -- Nueva cantidad mínima producto
        requiere_codigo = p_requiere_codigo,                           -- Nuevo requerimiento código
        usr_update = p_usr_operacion                                  -- Usuario que actualiza
    WHERE id_descuento = p_id_descuento;

    -- RESPUESTA: Confirmar éxito de la actualización
    RETURN json_build_object(
        'success', true, 
        'message', 'Descuento actualizado exitosamente',
        'id_descuento', p_id_descuento
    );

-- MANEJO DE ERRORES: Capturar excepciones específicas
EXCEPTION 
    WHEN foreign_key_violation THEN
        RETURN json_build_object('success', false, 'message', 'Error: Referencia a categoría, producto o marca inexistente');
    WHEN check_violation THEN
        RETURN json_build_object('success', false, 'message', 'Error: Valores fuera de rango permitido');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error inesperado: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;
