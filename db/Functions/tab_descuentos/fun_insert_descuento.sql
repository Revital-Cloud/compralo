 /*
 * FUNCIÓN: fun_insert_descuento
 * 
 * DESCRIPCIÓN: Inserta un nuevo descuento en el sistema con todas las configuraciones
 *              posibles: porcentaje/monto, fechas, horarios, productos específicos, etc.
 * 
 * PARÁMETROS OBLIGATORIOS:
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
 *   1. Validar parámetros obligatorios
 *   2. Validar fechas y horarios
 *   3. Validar unicidad de código
 *   4. Validar campos según tipo de aplicación
 *   5. Generar ID secuencial
 *   6. Insertar descuento con todas las configuraciones
 * 
 * AUTOR: Sistema DB_Synkro
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_insert_descuento(
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
        p_ind_es_para_cumpleanos        tab_descuentos.ind_es_para_cumpleanos%TYPE,
        p_fec_inicio                    tab_descuentos.fec_inicio%TYPE,
        p_fec_fin                       tab_descuentos.fec_fin%TYPE,
        p_ind_activo                    tab_descuentos.ind_activo%TYPE,
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
        p_usr_operacion                 tab_descuentos.usr_insert%TYPE
) RETURNS JSON AS $$
DECLARE
    v_nuevo_id tab_descuentos.id_descuento%TYPE;
BEGIN
    -- VALIDACIÓN 1: Nombre del descuento
    IF p_nom_descuento IS NULL OR LENGTH(TRIM(p_nom_descuento)) < 3 THEN
        RETURN json_build_object('success', false, 'message', 'El nombre del descuento debe tener al menos 3 caracteres');
    END IF;

    -- VALIDACIÓN 2: Fechas de vigencia
    IF p_fec_inicio IS NULL OR p_fec_fin IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Las fechas de inicio y fin son obligatorias');
    END IF;

    -- VALIDACIÓN 3: Coherencia de fechas
    IF p_fec_fin < p_fec_inicio THEN
        RETURN json_build_object('success', false, 'message', 'La fecha de fin debe ser mayor o igual a la fecha de inicio');
    END IF;

    -- VALIDACIÓN 4: Unicidad del código de descuento
    IF p_codigo_descuento IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM tab_descuentos WHERE codigo_descuento = p_codigo_descuento) THEN
            RETURN json_build_object('success', false, 'message', 'El código de descuento ya existe');
        END IF;
    END IF;

    -- VALIDACIÓN 5: Horarios de aplicación
    IF (p_horas_inicio IS NOT NULL AND p_horas_fin IS NULL) OR (p_horas_inicio IS NULL AND p_horas_fin IS NOT NULL) THEN
        RETURN json_build_object('success', false, 'message', 'Si especifica horarios, debe incluir tanto hora de inicio como de fin');
    END IF;

    -- VALIDACIÓN 6: Campos específicos según tipo de aplicación
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

    -- GENERACIÓN: Crear ID secuencial automático
    SELECT COALESCE(MAX(id_descuento), 0) + 1 INTO v_nuevo_id FROM tab_descuentos;

    -- INSERCIÓN: Crear descuento con todas las configuraciones
    INSERT INTO tab_descuentos (
        id_descuento, nom_descuento, des_descuento, tipo_calculo,
        val_porce_descuento, val_monto_descuento, aplica_a,
        id_categoria, id_linea, id_sublinea, id_producto_aplica,
        id_categoria_aplica, id_marca_aplica, id_linea_aplica, id_sublinea_aplica,
        fec_inicio, fec_fin, max_usos_total, costo_puntos_canje,
        codigo_descuento, max_usos_por_usuario, dias_semana_aplica,
        horas_inicio, horas_fin,
        usr_insert
    ) VALUES (
        v_nuevo_id,                     -- ID generado automáticamente
        p_nom_descuento,                -- Nombre del descuento
        p_des_descuento,                -- Descripción del descuento
        p_tipo_calculo,                 -- Tipo de cálculo (porcentaje/monto)
        p_val_porce_descuento,          -- Valor porcentual
        p_val_monto_descuento,          -- Valor de monto fijo
        p_aplica_a,                     -- Tipo de aplicación
        p_id_categoria,                 -- Categoría (si aplica)
        p_id_linea,                     -- Línea (si aplica)
        p_id_sublinea,                  -- Sublínea (si aplica)
        p_id_producto_aplica,           -- Producto específico (si aplica)
        p_id_categoria_aplica,          -- Categoría específica (si aplica)
        p_id_marca_aplica,              -- Marca específica (si aplica)
        p_id_linea_aplica,              -- Línea específica (si aplica)
        p_id_sublinea_aplica,           -- Sublínea específica (si aplica)
        p_fec_inicio,                   -- Fecha de inicio
        p_fec_fin,                      -- Fecha de fin
        p_max_usos_total,               -- Máximo usos total
        p_costo_puntos_canje,           -- Costo en puntos para canje
        p_codigo_descuento,             -- Código único del descuento
        p_max_usos_por_usuario,         -- Máximo usos por usuario
        p_dias_semana_aplica,           -- Días de la semana que aplica
        p_horas_inicio,                 -- Hora de inicio
        p_horas_fin,                    -- Hora de fin
        p_usr_operacion                -- Usuario que crea el descuento
    );

    -- RESPUESTA: Confirmar éxito de la inserción
    RETURN json_build_object(
        'success', true, 
        'message', 'Descuento creado exitosamente',
        'id_descuento', v_nuevo_id
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
