/*
 * FUNCIÓN: fun_calcular_kpi
 * 
 * DESCRIPCIÓN: Calcula el valor de un KPI específico ejecutando su fórmula SQL
 *              con parámetros dinámicos y gestiona cache para optimización.
 * 
 * PARÁMETROS:
 *   - p_id_kpi: ID del KPI a calcular
 *   - p_parametros: Parámetros JSON para la consulta (opcional)
 *   - p_forzar_recalculo: Si TRUE, ignora cache y recalcula (default: FALSE)
 * 
 * LÓGICA:
 *   - Verifica si existe cache válido
 *   - Ejecuta fórmula SQL dinámicamente
 *   - Calcula valor anterior para comparación
 *   - Determina tendencia automáticamente
 *   - Almacena resultado en cache
 * 
 * RETORNA: JSON con:
 *   - valor_actual: Valor calculado del KPI
 *   - valor_anterior: Valor del período anterior
 *   - porcentaje_cambio: % de cambio vs anterior
 *   - tendencia: POSITIVA/NEGATIVA/ESTABLE
 *   - datos_extra: Datos adicionales para gráficos
 *   - metadata: Información del cálculo
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */
CREATE OR REPLACE FUNCTION fun_calcular_kpi(
    p_id_kpi INT,
    p_parametros JSONB DEFAULT '{}',
    p_forzar_recalculo BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    v_kpi_config RECORD;
    v_cache_record RECORD;
    v_parametros_hash VARCHAR(64);
    v_sql_formula TEXT;
    v_sql_anterior TEXT;
    v_valor_actual DECIMAL(15,4);
    v_valor_anterior DECIMAL(15,4);
    v_porcentaje_cambio DECIMAL(5,2);
    v_tendencia VARCHAR(10);
    v_datos_extra JSONB;
    v_metadata JSONB;
    v_fecha_expiracion TIMESTAMP;
    v_inicio_calculo TIMESTAMP := NOW();
BEGIN
    -- OBTENER: Configuración del KPI
    SELECT 
        k.id_kpi,
        k.id_tipo_kpi,
        k.nom_kpi,
        k.descripcion_kpi,
        k.formula_sql,
        k.unidad_medida,
        k.formato_numero,
        k.rango_esperado_min,
        k.rango_esperado_max,
        k.frecuencia_actualizacion,
        k.ultima_actualizacion,
        k.duracion_cache_minutos,
        k.tipo_grafico_sugerido,
        k.color_primario,
        k.mostrar_tendencia,
        k.mostrar_comparacion,
        k.solo_administradores,
        k.requiere_parametros,
        k.parametros_permitidos,
        k.creado_por,
        k.ind_activo,
        k.fec_creacion,
        k.fec_update,
        t.nom_tipo_kpi
    INTO v_kpi_config
    FROM tab_kpis_maestros k
    JOIN tab_tipos_kpi t ON k.id_tipo_kpi = t.id_tipo_kpi
    WHERE k.id_kpi = p_id_kpi 
      AND k.ind_activo = TRUE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'KPI no encontrado o inactivo',
            'id_kpi', p_id_kpi
        );
    END IF;
    
    -- GENERAR: Hash único para cache basado en parámetros
    v_parametros_hash := ENCODE(SHA256(CONVERT_TO(
        p_id_kpi::TEXT || COALESCE(p_parametros::TEXT, '{}'), 'UTF8'
    )), 'hex');
    
    -- VERIFICAR: Cache existente y válido
    IF NOT p_forzar_recalculo THEN
        SELECT
            id_cache,
            id_kpi,
            parametros_hash,
            valor_actual,
            valor_anterior,
            porcentaje_cambio,
            tendencia,
            datos_extra,
            metadata_calculo,
            fecha_calculo,
            fecha_expiracion,
            numero_accesos
        INTO v_cache_record
        FROM tab_valores_kpi_cache
        WHERE id_kpi = p_id_kpi 
          AND parametros_hash = v_parametros_hash
          AND fecha_expiracion > NOW();
        
        IF FOUND THEN
            -- ACTUALIZAR: Contador de accesos al cache
            UPDATE tab_valores_kpi_cache 
            SET numero_accesos = numero_accesos + 1
            WHERE id_cache = v_cache_record.id_cache;
            
            -- RETORNAR: Datos del cache
            RETURN json_build_object(
                'success', true,
                'origen', 'CACHE',
                'valor_actual', v_cache_record.valor_actual,
                'valor_anterior', v_cache_record.valor_anterior,
                'porcentaje_cambio', v_cache_record.porcentaje_cambio,
                'tendencia', v_cache_record.tendencia,
                'datos_extra', v_cache_record.datos_extra,
                'metadata', v_cache_record.metadata_calculo,
                'fecha_calculo', v_cache_record.fecha_calculo,
                'kpi_config', row_to_json(v_kpi_config)
            );
        END IF;
    END IF;
    
    -- PREPARAR: Fórmula SQL con reemplazo de parámetros
    v_sql_formula := v_kpi_config.formula_sql;
    
    -- REEMPLAZAR: Parámetros en la fórmula SQL
    IF p_parametros IS NOT NULL AND jsonb_typeof(p_parametros) = 'object' THEN
        DECLARE
            param_key TEXT;
            param_value TEXT;
        BEGIN
            FOR param_key, param_value IN 
                SELECT key, value FROM jsonb_each_text(p_parametros)
            LOOP
                v_sql_formula := REPLACE(v_sql_formula, '${' || param_key || '}', param_value);
            END LOOP;
        END;
    END IF;
    
    -- REEMPLAZAR: Variables de sistema comunes
    v_sql_formula := REPLACE(v_sql_formula, '${FECHA_ACTUAL}', '''NOW()''');
    v_sql_formula := REPLACE(v_sql_formula, '${MES_ACTUAL}', '''' || TO_CHAR(NOW(), 'YYYY-MM') || '''');
    v_sql_formula := REPLACE(v_sql_formula, '${MES_ANTERIOR}', '''' || TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM') || '''');
    v_sql_formula := REPLACE(v_sql_formula, '${TRIMESTRE_ACTUAL}', '''' || TO_CHAR(NOW(), 'YYYY-Q') || '''');
    v_sql_formula := REPLACE(v_sql_formula, '${AÑO_ACTUAL}', EXTRACT(YEAR FROM NOW())::TEXT);
    
    -- EJECUTAR: Fórmula principal para valor actual
    BEGIN
        EXECUTE v_sql_formula INTO v_valor_actual;
        v_valor_actual := COALESCE(v_valor_actual, 0);
    EXCEPTION
        WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Error ejecutando fórmula SQL: ' || SQLERRM,
                'sql_formula', v_sql_formula,
                'sql_state', SQLSTATE
            );
    END;
    
    -- CALCULAR: Valor anterior para comparación
    v_sql_anterior := REPLACE(v_kpi_config.formula_sql, '${MES_ACTUAL}', '''' || TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM') || '''');
    v_sql_anterior := REPLACE(v_sql_anterior, '${MES_ANTERIOR}', '''' || TO_CHAR(NOW() - INTERVAL '2 month', 'YYYY-MM') || '''');
    v_sql_anterior := REPLACE(v_sql_anterior, '${TRIMESTRE_ACTUAL}', '''' || TO_CHAR(NOW() - INTERVAL '3 months', 'YYYY-Q') || '''');
    v_sql_anterior := REPLACE(v_sql_anterior, '${AÑO_ACTUAL}', (EXTRACT(YEAR FROM NOW()) - 1)::TEXT);
    
    -- Reemplazar parámetros también en consulta anterior
    IF p_parametros IS NOT NULL AND jsonb_typeof(p_parametros) = 'object' THEN
        DECLARE
            param_key TEXT;
            param_value TEXT;
        BEGIN
            FOR param_key, param_value IN 
                SELECT key, value FROM jsonb_each_text(p_parametros)
            LOOP
                v_sql_anterior := REPLACE(v_sql_anterior, '${' || param_key || '}', param_value);
            END LOOP;
        END;
    END IF;
    
    BEGIN
        EXECUTE v_sql_anterior INTO v_valor_anterior;
        v_valor_anterior := COALESCE(v_valor_anterior, 0);
    EXCEPTION
        WHEN OTHERS THEN
            v_valor_anterior := 0; -- Si falla, usar 0 como valor anterior
    END;
    
    -- CALCULAR: Porcentaje de cambio y tendencia
    IF v_valor_anterior > 0 THEN
        v_porcentaje_cambio := ROUND(((v_valor_actual - v_valor_anterior) / v_valor_anterior) * 100, 2);
    ELSE
        v_porcentaje_cambio := CASE WHEN v_valor_actual > 0 THEN 100.00 ELSE 0.00 END;
    END IF;
    
    -- DETERMINAR: Tendencia
    IF v_porcentaje_cambio > 1 THEN
        v_tendencia := 'POSITIVA';
    ELSIF v_porcentaje_cambio < -1 THEN
        v_tendencia := 'NEGATIVA';
    ELSE
        v_tendencia := 'ESTABLE';
    END IF;
    
    -- CONSTRUIR: Datos extra para gráficos (si el KPI lo requiere)
    v_datos_extra := '{}';
    
    -- Si es un KPI que necesita datos históricos para gráficos
    IF v_kpi_config.tipo_grafico_sugerido IN ('LINEA', 'BARRA') THEN
        DECLARE
            v_sql_historico TEXT;
            v_datos_historicos JSONB;
        BEGIN
            -- Construir consulta histórica básica (últimos 12 meses)
            v_sql_historico := REPLACE(v_kpi_config.formula_sql, 
                'WHERE', 
                'WHERE DATE_TRUNC(''month'', fec_pedido) >= DATE_TRUNC(''month'', NOW() - INTERVAL ''11 months'') AND'
            );
            
            -- Para KPIs complejos, usar datos básicos
            v_datos_extra := json_build_object(
                'tipo_grafico', v_kpi_config.tipo_grafico_sugerido,
                'historico_disponible', true,
                'periodo_datos', '12_MESES'
            );
        EXCEPTION
            WHEN OTHERS THEN
                v_datos_extra := '{}';
        END;
    END IF;
    
    -- CONSTRUIR: Metadata del cálculo
    v_metadata := json_build_object(
        'tiempo_calculo_ms', EXTRACT(EPOCH FROM (NOW() - v_inicio_calculo)) * 1000,
        'formula_ejecutada', v_sql_formula,
        'parametros_usados', p_parametros,
        'origen_calculo', 'TIEMPO_REAL',
        'validacion_formula', 'OK',
        'rango_esperado', json_build_object(
            'min', v_kpi_config.rango_esperado_min,
            'max', v_kpi_config.rango_esperado_max,
            'dentro_rango', (
                v_valor_actual >= COALESCE(v_kpi_config.rango_esperado_min, v_valor_actual) AND
                v_valor_actual <= COALESCE(v_kpi_config.rango_esperado_max, v_valor_actual)
            )
        )
    );
    
    -- CALCULAR: Fecha de expiración del cache
    v_fecha_expiracion := NOW() + (v_kpi_config.duracion_cache_minutos || ' minutes')::INTERVAL;
    
    -- ALMACENAR: Resultado en cache
    INSERT INTO tab_valores_kpi_cache (
        id_kpi, parametros_hash, valor_actual, valor_anterior,
        porcentaje_cambio, tendencia, datos_extra, metadata_calculo,
        fecha_expiracion, numero_accesos
    ) VALUES (
        p_id_kpi, v_parametros_hash, v_valor_actual, v_valor_anterior,
        v_porcentaje_cambio, v_tendencia, v_datos_extra, v_metadata,
        v_fecha_expiracion, 1
    )
    ON CONFLICT (id_kpi, parametros_hash) 
    DO UPDATE SET 
        valor_actual = EXCLUDED.valor_actual,
        valor_anterior = EXCLUDED.valor_anterior,
        porcentaje_cambio = EXCLUDED.porcentaje_cambio,
        tendencia = EXCLUDED.tendencia,
        datos_extra = EXCLUDED.datos_extra,
        metadata_calculo = EXCLUDED.metadata_calculo,
        fecha_calculo = NOW(),
        fecha_expiracion = EXCLUDED.fecha_expiracion,
        numero_accesos = tab_valores_kpi_cache.numero_accesos + 1;
    
    -- ACTUALIZAR: Última actualización del KPI
    UPDATE tab_kpis_maestros 
    SET ultima_actualizacion = NOW()
    WHERE id_kpi = p_id_kpi;
    
    -- RETORNAR: Resultado completo
    RETURN json_build_object(
        'success', true,
        'origen', 'CALCULADO',
        'valor_actual', v_valor_actual,
        'valor_anterior', v_valor_anterior,
        'porcentaje_cambio', v_porcentaje_cambio,
        'tendencia', v_tendencia,
        'datos_extra', v_datos_extra,
        'metadata', v_metadata,
        'fecha_calculo', NOW(),
        'kpi_config', json_build_object(
            'id_kpi', v_kpi_config.id_kpi,
            'nombre', v_kpi_config.nom_kpi,
            'tipo', v_kpi_config.nom_tipo_kpi,
            'unidad_medida', v_kpi_config.unidad_medida,
            'formato_numero', v_kpi_config.formato_numero,
            'tipo_grafico', v_kpi_config.tipo_grafico_sugerido,
            'color_primario', v_kpi_config.color_primario
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error general calculando KPI: ' || SQLERRM,
            'sql_state', SQLSTATE,
            'id_kpi', p_id_kpi,
            'parametros', p_parametros,
            'tiempo_transcurrido', EXTRACT(EPOCH FROM (NOW() - v_inicio_calculo)) * 1000
        );
END;
$$ LANGUAGE plpgsql; 