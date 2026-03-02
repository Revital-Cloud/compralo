/*
 * FUNCIÓN: fun_obtener_descuento
 * 
 * DESCRIPCIÓN: Obtiene información completa de un descuento específico con
 *              datos calculados, nombres resueltos y configuración detallada.
 * 
 * PARÁMETROS:
 *   - p_id_descuento: ID del descuento a obtener (obligatorio)
 * 
 * RETORNA: JSON - Objeto con información completa del descuento:
 *   - success: booleano indicando éxito
 *   - message: mensaje de error (si aplica)
 *   - descuento: objeto con toda la información del descuento
 * 
 * LÓGICA:
 *   1. Buscar descuento por ID
 *   2. Calcular información adicional (estado, porcentaje uso)
 *   3. Resolver nombres de productos, categorías y marcas relacionadas
 *   4. Construir respuesta JSON completa
 *   5. Manejar caso de descuento no encontrado
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_obtener_descuento(
    p_id_descuento tab_descuentos.id_descuento%TYPE
) RETURNS JSON AS $$
DECLARE
    v_descuento RECORD;
    v_resultado JSON;
BEGIN
    -- CONSULTA: Obtener descuento completo con información calculada
    SELECT 
        d.id_descuento,
        d.nom_descuento,
        d.des_descuento,
        d.tipo_calculo,
        d.val_porce_descuento,
        d.val_monto_descuento,
        d.aplica_a,
        d.category_id_aplica AS id_categoria_aplica,
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
            WHEN d.tipo_calculo THEN 'Porcentaje'
            ELSE 'Monto Fijo'
        END AS tipo_calculo_texto,                              -- Tipo de cálculo legible
        CASE 
            WHEN d.tipo_calculo THEN 
                CONCAT(d.val_porce_descuento::TEXT, '%')
            ELSE 
                CONCAT('$', d.val_monto_descuento::TEXT)
        END AS valor_mostrar,                                   -- Valor formateado
        CASE 
            WHEN NOT d.ind_activo THEN 'Inactivo'
            WHEN CURRENT_DATE < d.fec_inicio THEN 'Programado'
            WHEN CURRENT_DATE > d.fec_fin THEN 'Vencido'
            WHEN d.max_usos_total IS NOT NULL AND d.usos_actuales_total >= d.max_usos_total THEN 'Agotado'
            ELSE 'Activo'
        END AS estado_descuento,                                -- Estado calculado
        CASE 
            WHEN d.max_usos_total IS NOT NULL AND d.max_usos_total > 0 THEN
                ROUND((d.usos_actuales_total::DECIMAL / d.max_usos_total::DECIMAL) * 100, 1)
            ELSE NULL
        END AS porcentaje_uso,                                  -- Porcentaje de uso
        -- RESOLUCIÓN: Nombres de entidades relacionadas según tipo de aplicación
        CASE 
            WHEN d.aplica_a = 'producto_especifico' THEN
                (SELECT p.name FROM tab_products p 
                 WHERE p.id = d.product_id_aplica)
            ELSE NULL
        END AS nombre_producto_aplica,                          -- Nombre del producto específico
        CASE 
            WHEN d.aplica_a = 'categoria_especifica' THEN
                (SELECT c.name FROM tab_categories c WHERE c.id = d.category_id_aplica)
            ELSE NULL
        END AS nombre_categoria_aplica,                         -- Nombre de categoría específica
        CASE 
            WHEN d.aplica_a = 'marca_especifica' THEN
                (SELECT m.nom_marca FROM tab_marcas m WHERE m.id_marca = d.id_marca_aplica)
            ELSE NULL
        END AS nombre_marca_aplica                              -- Nombre de marca específica
    INTO v_descuento
    FROM tab_descuentos d
    WHERE d.id_descuento = p_id_descuento;

    -- Si no se encuentra el descuento
    IF v_descuento IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Descuento no encontrado'
        );
    END IF;

    -- Construir el JSON de respuesta
    v_resultado := json_build_object(
        'success', true,
        'descuento', json_build_object(
            'id_descuento', v_descuento.id_descuento,
            'nom_descuento', v_descuento.nom_descuento,
            'des_descuento', v_descuento.des_descuento,
            'tipo_calculo', v_descuento.tipo_calculo,
            'tipo_calculo_texto', v_descuento.tipo_calculo_texto,
            'val_porce_descuento', v_descuento.val_porce_descuento,
            'val_monto_descuento', v_descuento.val_monto_descuento,
            'valor_mostrar', v_descuento.valor_mostrar,
            'aplica_a', v_descuento.aplica_a,
            'min_valor_pedido', v_descuento.min_valor_pedido,
            'ind_es_para_cumpleanos', v_descuento.ind_es_para_cumpleanos,
            'fec_inicio', v_descuento.fec_inicio,
            'fec_fin', v_descuento.fec_fin,
            'ind_activo', v_descuento.ind_activo,
            'estado_descuento', v_descuento.estado_descuento,
            -- Configuración de uso
            'max_usos_total', v_descuento.max_usos_total,
            'usos_actuales_total', v_descuento.usos_actuales_total,
            'porcentaje_uso', v_descuento.porcentaje_uso,
            'max_usos_por_usuario', v_descuento.max_usos_por_usuario,
            -- Nuevos campos
            'codigo_descuento', v_descuento.codigo_descuento,
            'dias_semana_aplica', v_descuento.dias_semana_aplica,
            'horas_inicio', v_descuento.horas_inicio,
            'horas_fin', v_descuento.horas_fin,
            'solo_primera_compra', v_descuento.solo_primera_compra,
            'monto_minimo_producto', v_descuento.monto_minimo_producto,
            'cantidad_minima_producto', v_descuento.cantidad_minima_producto,
            'requiere_codigo', v_descuento.requiere_codigo,
            -- Referencias de aplicación
            'id_producto_aplica', v_descuento.product_id_aplica,
            'nombre_producto_aplica', v_descuento.nombre_producto_aplica,
            'id_categoria_aplica', v_descuento.id_categoria_aplica,
            'nombre_categoria_aplica', v_descuento.nombre_categoria_aplica,
            'id_marca_aplica', v_descuento.id_marca_aplica,
            'nombre_marca_aplica', v_descuento.nombre_marca_aplica,
            -- Auditoría
            'usr_insert', v_descuento.usr_insert,
            'fec_insert', v_descuento.fec_insert,
            'usr_update', v_descuento.usr_update,
            'fec_update', v_descuento.fec_update
        )
    );

    RETURN v_resultado;

EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql; 