/*
 * VISTAS Y TRIGGERS: Sistema de KPIs y Dashboards
 * 
 * DESCRIPCIÓN: Vistas optimizadas para consultas frecuentes del sistema
 *              de KPIs y triggers para automatización de alertas y cache.
 * 
 * COMPONENTES:
 *   - Vistas para dashboards y KPIs
 *   - Triggers para limpieza automática de cache
 *   - Triggers para alertas automáticas
 *   - Funciones de mantenimiento
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- =====================================================
-- VISTA: vw_kpis_disponibles
-- =====================================================

CREATE OR REPLACE VIEW vw_kpis_disponibles AS
SELECT 
    k.id_kpi,
    k.nom_kpi,
    k.descripcion_kpi,
    k.unidad_medida,
    k.formato_numero,
    k.tipo_grafico_sugerido,
    k.color_primario,
    k.mostrar_tendencia,
    k.mostrar_comparacion,
    k.solo_administradores,
    k.requiere_parametros,
    k.parametros_permitidos,
    k.frecuencia_actualizacion,
    k.duracion_cache_minutos,
    k.rango_esperado_min,
    k.rango_esperado_max,
    
    -- Información del tipo de KPI
    t.nom_tipo_kpi,
    t.descripcion as descripcion_tipo,
    t.color_categoria,
    t.icono,
    t.orden_visualizacion,
    
    -- Estadísticas de uso
    COALESCE(uso.widgets_activos, 0) as widgets_activos,
    COALESCE(uso.dashboards_usando, 0) as dashboards_usando,
    k.ultima_actualizacion,
    
    -- Usuario creador
    u.nom_usuario as creado_por_usuario,
    k.fec_creacion,
    k.fec_update
    
FROM tab_kpis_maestros k
JOIN tab_tipos_kpi t ON k.id_tipo_kpi = t.id_tipo_kpi
LEFT JOIN tab_usuarios u ON k.creado_por = u.id_usuario
    LEFT JOIN (
    SELECT 
        w.id_kpi,
        COUNT(1) as widgets_activos,
        COUNT(DISTINCT w.id_dashboard) as dashboards_usando
    FROM tab_widgets_dashboard w
    JOIN tab_dashboards_usuarios d ON w.id_dashboard = d.id_dashboard
    WHERE w.ind_activo = TRUE AND d.ind_activo = TRUE
    GROUP BY w.id_kpi
) uso ON k.id_kpi = uso.id_kpi
WHERE k.ind_activo = TRUE AND t.ind_activo = TRUE
ORDER BY t.orden_visualizacion, k.nom_kpi;

-- =====================================================
-- VISTA: vw_dashboards_usuarios_completo
-- =====================================================

CREATE OR REPLACE VIEW vw_dashboards_usuarios_completo AS
SELECT 
    d.id_dashboard,
    d.id_usuario,
    d.nom_dashboard,
    d.descripcion,
    d.tipo_layout,
    d.columnas_grid,
    d.tema_color,
    d.mostrar_filtros,
    d.es_publico,
    d.es_dashboard_principal,
    d.auto_refresh_segundos,
    d.notificaciones_cambios,
    d.fecha_ultimo_acceso,
    d.numero_accesos,
    d.fec_creacion,
    d.fec_update,
    
    -- Información del usuario propietario
    u.nom_usuario as propietario,
    u.email as email_propietario,
    
    -- Estadísticas del dashboard
    COALESCE(stats.total_widgets, 0) as total_widgets,
    COALESCE(stats.widgets_activos, 0) as widgets_activos,
    COALESCE(stats.tipos_kpi_usados, 0) as tipos_kpi_diferentes,
    
    -- Información de compartición
    CASE 
        WHEN d.es_publico THEN 'Público'
        WHEN compartido.dashboards_compartidos > 0 THEN 'Compartido'
        ELSE 'Privado'
    END as tipo_acceso,
    
    COALESCE(compartido.dashboards_compartidos, 0) as veces_compartido,
    
    -- Métricas de rendimiento
    CASE 
        WHEN d.numero_accesos > 100 THEN 'Alto uso'
        WHEN d.numero_accesos > 20 THEN 'Uso moderado'
        WHEN d.numero_accesos > 0 THEN 'Poco uso'
        ELSE 'Sin uso'
    END as nivel_uso,
    
    -- Última actividad
    GREATEST(d.fecha_ultimo_acceso, d.fec_update) as ultima_actividad
    
FROM tab_dashboards_usuarios d
JOIN tab_usuarios u ON d.id_usuario = u.id_usuario
LEFT JOIN (
    SELECT 
        w.id_dashboard,
        COUNT(1) as total_widgets,
        COUNT(CASE WHEN w.ind_activo THEN 1 END) as widgets_activos,
        COUNT(DISTINCT k.id_tipo_kpi) as tipos_kpi_usados
    FROM tab_widgets_dashboard w
    JOIN tab_kpis_maestros k ON w.id_kpi = k.id_kpi
    GROUP BY w.id_dashboard
) stats ON d.id_dashboard = stats.id_dashboard
LEFT JOIN (
    SELECT 
        id_dashboard,
        COUNT(1) as dashboards_compartidos
    FROM tab_compartir_dashboards
    WHERE ind_activo = TRUE
    GROUP BY id_dashboard
) compartido ON d.id_dashboard = compartido.id_dashboard
WHERE d.ind_activo = TRUE
ORDER BY d.es_dashboard_principal DESC, d.fecha_ultimo_acceso DESC;

-- =====================================================
-- VISTA: vw_widgets_con_valores
-- =====================================================

CREATE OR REPLACE VIEW vw_widgets_con_valores AS
SELECT 
    w.id_widget,
    w.id_dashboard,
    w.id_kpi,
    w.posicion_x,
    w.posicion_y,
    w.ancho_columnas,
    w.alto_filas,
    w.orden_z,
    w.titulo_personalizado,
    w.mostrar_titulo,
    w.tipo_grafico,
    w.color_personalizado,
    w.mostrar_valor_anterior,
    w.mostrar_porcentaje_cambio,
    w.parametros_kpi,
    w.periodo_comparacion,
    w.filtros_adicionales,
    w.fec_creacion as widget_creado,
    w.fec_update as widget_actualizado,
    
    -- Información del KPI
    k.nom_kpi,
    k.descripcion_kpi,
    k.unidad_medida,
    k.formato_numero,
    k.tipo_grafico_sugerido,
    k.color_primario as color_kpi,
    k.mostrar_tendencia,
    k.frecuencia_actualizacion,
    
    -- Información del tipo de KPI
    t.nom_tipo_kpi,
    t.color_categoria,
    t.icono,
    
    -- Valores en cache (si existen)
    c.valor_actual,
    c.valor_anterior,
    c.porcentaje_cambio,
    c.tendencia,
    c.datos_extra,
    c.fecha_calculo,
    c.fecha_expiracion,
    c.numero_accesos as accesos_cache,
    
    -- Estado del cache
    CASE 
        WHEN c.fecha_expiracion > NOW() THEN 'VIGENTE'
        WHEN c.fecha_expiracion IS NOT NULL THEN 'EXPIRADO'
        ELSE 'SIN_CACHE'
    END as estado_cache,
    
    -- Dashboard información
    d.nom_dashboard,
    d.id_usuario as propietario_dashboard,
    u.nom_usuario as nombre_propietario
    
FROM tab_widgets_dashboard w
JOIN tab_kpis_maestros k ON w.id_kpi = k.id_kpi
JOIN tab_tipos_kpi t ON k.id_tipo_kpi = t.id_tipo_kpi
JOIN tab_dashboards_usuarios d ON w.id_dashboard = d.id_dashboard
JOIN tab_usuarios u ON d.id_usuario = u.id_usuario
LEFT JOIN tab_valores_kpi_cache c ON (
    k.id_kpi = c.id_kpi AND 
    ENCODE(SHA256(CONVERT_TO(k.id_kpi::TEXT || COALESCE(w.parametros_kpi::TEXT, '{}'), 'UTF8')), 'hex') = c.parametros_hash
)
WHERE w.ind_activo = TRUE 
  AND k.ind_activo = TRUE 
  AND t.ind_activo = TRUE
  AND d.ind_activo = TRUE
ORDER BY d.id_dashboard, w.posicion_y, w.posicion_x;

-- =====================================================
-- VISTA: vw_alertas_kpi_activas
-- =====================================================

CREATE OR REPLACE VIEW vw_alertas_kpi_activas AS
SELECT 
    a.id_alerta,
    a.id_kpi,
    a.id_usuario,
    a.nom_alerta,
    a.tipo_condicion,
    a.valor_umbral_min,
    a.valor_umbral_max,
    a.porcentaje_cambio_umbral,
    a.metodo_notificacion,
    a.frecuencia_verificacion,
    a.ultima_verificacion,
    a.ultima_activacion,
    a.numero_activaciones,
    a.fec_creacion as alerta_creada,
    
    -- Información del KPI
    k.nom_kpi,
    k.descripcion_kpi,
    k.unidad_medida,
    k.formato_numero,
    t.nom_tipo_kpi,
    
    -- Información del usuario
    u.nom_usuario,
    u.email,
    
    -- Valor actual del KPI (si existe en cache)
    c.valor_actual,
    c.valor_anterior,
    c.porcentaje_cambio,
    c.tendencia,
    c.fecha_calculo,
    
    -- Estado de la alerta
    CASE 
        WHEN a.ultima_verificacion IS NULL THEN 'PENDIENTE'
        WHEN a.ultima_verificacion < NOW() - (
            CASE a.frecuencia_verificacion 
                WHEN 'TIEMPO_REAL' THEN INTERVAL '5 minutes'
                WHEN 'HORARIA' THEN INTERVAL '1 hour'
                WHEN 'DIARIA' THEN INTERVAL '1 day'
                ELSE INTERVAL '1 hour'
            END
        ) THEN 'REQUIERE_VERIFICACION'
        ELSE 'AL_DIA'
    END as estado_verificacion,
    
    -- Evaluación de condición (si hay valor)
    CASE 
        WHEN c.valor_actual IS NULL THEN NULL
        WHEN a.tipo_condicion = 'MAYOR_QUE' AND c.valor_actual > a.valor_umbral_min THEN TRUE
        WHEN a.tipo_condicion = 'MENOR_QUE' AND c.valor_actual < a.valor_umbral_max THEN TRUE
        WHEN a.tipo_condicion = 'ENTRE' AND c.valor_actual BETWEEN a.valor_umbral_min AND a.valor_umbral_max THEN TRUE
        WHEN a.tipo_condicion = 'CAMBIO_PORCENTUAL' AND ABS(c.porcentaje_cambio) > a.porcentaje_cambio_umbral THEN TRUE
        ELSE FALSE
    END as condicion_cumplida
    
FROM tab_alertas_kpi a
JOIN tab_kpis_maestros k ON a.id_kpi = k.id_kpi
JOIN tab_tipos_kpi t ON k.id_tipo_kpi = t.id_tipo_kpi
JOIN tab_usuarios u ON a.id_usuario = u.id_usuario
LEFT JOIN tab_valores_kpi_cache c ON k.id_kpi = c.id_kpi
WHERE a.ind_activo = TRUE 
  AND k.ind_activo = TRUE 
  AND u.ind_activo = TRUE
ORDER BY a.ultima_verificacion ASC NULLS FIRST, a.fec_creacion DESC;

-- =====================================================
-- FUNCIÓN: fun_limpiar_cache_expirado
-- =====================================================

/*
 * FUNCIÓN: fun_limpiar_cache_expirado
 * 
 * DESCRIPCIÓN: Limpia entradas de cache expiradas para mantener
 *              el rendimiento de la tabla de cache.
 */
CREATE OR REPLACE FUNCTION fun_limpiar_cache_expirado()
RETURNS JSON AS $$
DECLARE
    v_registros_eliminados INT;
    v_inicio_proceso TIMESTAMP := NOW();
BEGIN
    -- ELIMINAR: Cache expirado (más de 24 horas de expiración)
    DELETE FROM tab_valores_kpi_cache 
    WHERE fecha_expiracion < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS v_registros_eliminados = ROW_COUNT;
    
    -- VACUUM: Optimizar tabla después de limpieza
    IF v_registros_eliminados > 100 THEN
        VACUUM ANALYZE tab_valores_kpi_cache;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'registros_eliminados', v_registros_eliminados,
        'tiempo_procesamiento', (NOW() - v_inicio_proceso),
        'fecha_limpieza', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error limpiando cache: ' || SQLERRM,
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: fun_verificar_alertas_kpi
-- =====================================================

/*
 * FUNCIÓN: fun_verificar_alertas_kpi
 * 
 * DESCRIPCIÓN: Verifica todas las alertas activas y ejecuta
 *              notificaciones cuando se cumplen las condiciones.
 */
CREATE OR REPLACE FUNCTION fun_verificar_alertas_kpi()
RETURNS JSON AS $$
DECLARE
    v_alerta_record RECORD;
    v_kpi_valor JSON;
    v_alertas_verificadas INT := 0;
    v_alertas_activadas INT := 0;
    v_inicio_proceso TIMESTAMP := NOW();
BEGIN
    -- PROCESAR: Todas las alertas que requieren verificación (evitar SELECT * sobre la vista)
    FOR v_alerta_record IN 
        SELECT 
            id_alerta,
            id_kpi,
            nom_alerta,
            valor_umbral_min,
            valor_umbral_max,
            porcentaje_cambio_umbral,
            tipo_condicion,
            nom_usuario,
            nom_kpi
        FROM vw_alertas_kpi_activas 
        WHERE estado_verificacion IN ('PENDIENTE', 'REQUIERE_VERIFICACION')
    LOOP
        -- CALCULAR: Valor actual del KPI
        SELECT fun_calcular_kpi(v_alerta_record.id_kpi, '{}', FALSE) 
        INTO v_kpi_valor;
        
        -- ACTUALIZAR: Última verificación
        UPDATE tab_alertas_kpi 
        SET ultima_verificacion = NOW()
        WHERE id_alerta = v_alerta_record.id_alerta;
        
        v_alertas_verificadas := v_alertas_verificadas + 1;
        
        -- EVALUAR: Condición de la alerta
        IF (v_kpi_valor->>'success')::BOOLEAN THEN
            DECLARE
                v_valor_actual DECIMAL(15,4) := (v_kpi_valor->>'valor_actual')::DECIMAL;
                v_porcentaje_cambio DECIMAL(5,2) := (v_kpi_valor->>'porcentaje_cambio')::DECIMAL;
                v_condicion_cumplida BOOLEAN := FALSE;
            BEGIN
                -- Evaluar según tipo de condición
                CASE v_alerta_record.tipo_condicion
                    WHEN 'MAYOR_QUE' THEN
                        v_condicion_cumplida := v_valor_actual > v_alerta_record.valor_umbral_min;
                    WHEN 'MENOR_QUE' THEN
                        v_condicion_cumplida := v_valor_actual < v_alerta_record.valor_umbral_max;
                    WHEN 'ENTRE' THEN
                        v_condicion_cumplida := v_valor_actual BETWEEN v_alerta_record.valor_umbral_min AND v_alerta_record.valor_umbral_max;
                    WHEN 'CAMBIO_PORCENTUAL' THEN
                        v_condicion_cumplida := ABS(v_porcentaje_cambio) > v_alerta_record.porcentaje_cambio_umbral;
                END CASE;
                
                -- ACTIVAR: Alerta si se cumple la condición
                IF v_condicion_cumplida THEN
                    UPDATE tab_alertas_kpi 
                    SET ultima_activacion = NOW(),
                        numero_activaciones = numero_activaciones + 1
                    WHERE id_alerta = v_alerta_record.id_alerta;
                    
                    v_alertas_activadas := v_alertas_activadas + 1;
                    
                    -- ENVIAR: Notificación (llamar función externa)
                    -- Aquí se llamaría a la función de envío de notificaciones
                    -- ej: PERFORM fun_enviar_notificacion_alerta(v_alerta_record.id_alerta, v_kpi_valor);
                    
                    RAISE NOTICE 'Alerta activada: % para usuario % (KPI: %, Valor: %)', 
                        v_alerta_record.nom_alerta,
                        v_alerta_record.nom_usuario,
                        v_alerta_record.nom_kpi,
                        v_valor_actual;
                END IF;
            END;
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'alertas_verificadas', v_alertas_verificadas,
        'alertas_activadas', v_alertas_activadas,
        'tiempo_procesamiento', (NOW() - v_inicio_proceso),
        'fecha_verificacion', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error verificando alertas: ' || SQLERRM,
            'sql_state', SQLSTATE,
            'alertas_procesadas', v_alertas_verificadas
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Limpieza automática de cache
-- =====================================================

/*
 * TRIGGER: Ejecuta limpieza de cache cuando se inserta nuevo cache
 */
CREATE OR REPLACE FUNCTION fun_trigger_limpiar_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Ejecutar limpieza cada 100 inserts aproximadamente
    IF RANDOM() < 0.01 THEN
        PERFORM fun_limpiar_cache_expirado();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limpiar_cache_automatico
    AFTER INSERT ON tab_valores_kpi_cache
    FOR EACH ROW
    EXECUTE FUNCTION fun_trigger_limpiar_cache();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON VIEW vw_kpis_disponibles IS 
'Vista completa de KPIs disponibles con información de uso y configuración';

COMMENT ON VIEW vw_dashboards_usuarios_completo IS 
'Vista completa de dashboards con estadísticas de uso y compartición';

COMMENT ON VIEW vw_widgets_con_valores IS 
'Vista de widgets con valores de KPIs calculados y estado de cache';

COMMENT ON VIEW vw_alertas_kpi_activas IS 
'Vista de alertas activas con evaluación de condiciones en tiempo real';

COMMENT ON FUNCTION fun_limpiar_cache_expirado() IS 
'Función de mantenimiento para limpiar cache expirado automáticamente';

COMMENT ON FUNCTION fun_verificar_alertas_kpi() IS 
'Función para verificar y activar alertas de KPIs según condiciones configuradas'; 