/*
 * Actualiza un descuento existente. Usa category_id_aplica, product_id_aplica, id_marca_aplica
 * (tab_descuentos ya no tiene id_categoria, id_linea, id_sublinea ni id_linea_aplica/id_sublinea_aplica).
 */
CREATE OR REPLACE FUNCTION fun_update_descuento(
    p_id_descuento                  DECIMAL(10),
    p_nom_descuento                 VARCHAR,
    p_des_descuento                 VARCHAR,
    p_tipo_calculo                  BOOLEAN,
    p_val_porce_descuento           DECIMAL(10,2),
    p_val_monto_descuento           DECIMAL(10,2),
    p_aplica_a                      VARCHAR(30),
    p_category_id_aplica           DECIMAL(10),
    p_product_id_aplica            DECIMAL(10),
    p_id_marca_aplica               DECIMAL(10),
    p_min_valor_pedido              DECIMAL(10,2),
    p_ind_es_para_cumpleanos        BOOLEAN,
    p_fec_inicio                    DATE,
    p_fec_fin                       DATE,
    p_max_usos_total                INT,
    p_costo_puntos_canje            INT,
    p_ind_canjeable_puntos          BOOLEAN,
    p_codigo_descuento              VARCHAR,
    p_max_usos_por_usuario          INT,
    p_dias_semana_aplica            VARCHAR,
    p_horas_inicio                  TIME,
    p_horas_fin                     TIME,
    p_solo_primera_compra           BOOLEAN,
    p_monto_minimo_producto         DECIMAL(10,2),
    p_cantidad_minima_producto      INT,
    p_requiere_codigo               BOOLEAN,
    p_usr_operacion                 DECIMAL(10),
    p_id_usuario_destino            DECIMAL(10) DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_existe BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(SELECT 1 FROM tab_descuentos WHERE id_descuento = p_id_descuento) INTO v_existe;
    IF NOT v_existe THEN
        RETURN json_build_object('success', false, 'message', 'El descuento especificado no existe');
    END IF;

    IF p_nom_descuento IS NULL OR LENGTH(TRIM(p_nom_descuento)) < 3 THEN
        RETURN json_build_object('success', false, 'message', 'El nombre del descuento debe tener al menos 3 caracteres');
    END IF;
    IF (p_fec_inicio IS NULL AND p_fec_fin IS NOT NULL) OR (p_fec_inicio IS NOT NULL AND p_fec_fin IS NULL) THEN
        RETURN json_build_object('success', false, 'message', 'Debe especificar ambas fechas o ninguna');
    END IF;
    IF p_fec_inicio IS NOT NULL AND p_fec_fin IS NOT NULL AND p_fec_fin < p_fec_inicio THEN
        RETURN json_build_object('success', false, 'message', 'La fecha de fin debe ser mayor o igual a la fecha de inicio');
    END IF;
    IF p_codigo_descuento IS NOT NULL AND EXISTS (SELECT 1 FROM tab_descuentos WHERE codigo_descuento = p_codigo_descuento AND id_descuento != p_id_descuento) THEN
        RETURN json_build_object('success', false, 'message', 'El código de descuento ya existe');
    END IF;
    IF (p_horas_inicio IS NOT NULL AND p_horas_fin IS NULL) OR (p_horas_inicio IS NULL AND p_horas_fin IS NOT NULL) THEN
        RETURN json_build_object('success', false, 'message', 'Si especifica horarios, debe incluir tanto hora de inicio como de fin');
    END IF;

    CASE p_aplica_a
        WHEN 'producto_especifico' THEN
            IF p_product_id_aplica IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de producto específico se requiere product_id_aplica');
            END IF;
        WHEN 'categoria_especifica' THEN
            IF p_category_id_aplica IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de categoría específica se requiere category_id_aplica');
            END IF;
        WHEN 'marca_especifica' THEN
            IF p_id_marca_aplica IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para descuentos de marca específica se requiere id_marca_aplica');
            END IF;
        WHEN 'linea_especifica', 'sublinea_especifica' THEN
            IF p_category_id_aplica IS NULL THEN
                RETURN json_build_object('success', false, 'message', 'Para linea/sublinea use category_id_aplica (categoría)');
            END IF;
        WHEN 'total_pedido', 'costo_envio', 'envio_gratis', 'segunda_unidad', 'compra_minima' THEN
            NULL;
        ELSE
            RETURN json_build_object('success', false, 'message', 'Tipo de aplicación no válido: ' || p_aplica_a);
    END CASE;

    UPDATE tab_descuentos SET
        nom_descuento = p_nom_descuento,
        des_descuento = p_des_descuento,
        tipo_calculo = p_tipo_calculo,
        val_porce_descuento = p_val_porce_descuento,
        val_monto_descuento = p_val_monto_descuento,
        aplica_a = p_aplica_a,
        category_id_aplica = p_category_id_aplica,
        product_id_aplica = p_product_id_aplica,
        id_marca_aplica = p_id_marca_aplica,
        min_valor_pedido = COALESCE(p_min_valor_pedido, min_valor_pedido),
        ind_es_para_cumpleanos = COALESCE(p_ind_es_para_cumpleanos, ind_es_para_cumpleanos),
        fec_inicio = p_fec_inicio,
        fec_fin = p_fec_fin,
        max_usos_total = p_max_usos_total,
        costo_puntos_canje = p_costo_puntos_canje,
        ind_canjeable_puntos = COALESCE(p_ind_canjeable_puntos, ind_canjeable_puntos),
        codigo_descuento = p_codigo_descuento,
        max_usos_por_usuario = p_max_usos_por_usuario,
        dias_semana_aplica = p_dias_semana_aplica,
        horas_inicio = p_horas_inicio,
        horas_fin = p_horas_fin,
        solo_primera_compra = COALESCE(p_solo_primera_compra, solo_primera_compra),
        monto_minimo_producto = COALESCE(p_monto_minimo_producto, monto_minimo_producto),
        cantidad_minima_producto = COALESCE(p_cantidad_minima_producto, cantidad_minima_producto),
        requiere_codigo = COALESCE(p_requiere_codigo, requiere_codigo),
        id_usuario_destino = p_id_usuario_destino,
        usr_update = p_usr_operacion,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_descuento = p_id_descuento;

    RETURN json_build_object('success', true, 'message', 'Descuento actualizado exitosamente', 'id_descuento', p_id_descuento);
EXCEPTION
    WHEN foreign_key_violation THEN
        RETURN json_build_object('success', false, 'message', 'Error: Referencia a categoría, producto o marca inexistente');
    WHEN check_violation THEN
        RETURN json_build_object('success', false, 'message', 'Error: Valores fuera de rango permitido');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error inesperado: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;
