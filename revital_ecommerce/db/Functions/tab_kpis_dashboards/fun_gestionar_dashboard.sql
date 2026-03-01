/*
 * FUNCIONES: Gestión de Dashboards y Widgets Personalizados
 * 
 * DESCRIPCIÓN: Conjunto de funciones para que usuarios creen, configuren
 *              y gestionen sus dashboards personalizados con widgets de KPIs.
 * 
 * FUNCIONES INCLUIDAS:
 *   - fun_crear_dashboard: Crear nuevo dashboard
 *   - fun_agregar_widget: Agregar widget a dashboard
 *   - fun_obtener_dashboard_completo: Obtener dashboard con todos sus widgets
 *   - fun_actualizar_posicion_widget: Reposicionar widgets
 *   - fun_duplicar_dashboard: Duplicar dashboard existente
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- =====================================================
-- FUNCIÓN: fun_crear_dashboard
-- =====================================================

/*
 * FUNCIÓN: fun_crear_dashboard
 * 
 * DESCRIPCIÓN: Crea un nuevo dashboard personalizado para un usuario
 * 
 * PARÁMETROS:
 *   - p_id_usuario: ID del usuario propietario
 *   - p_nombre_dashboard: Nombre del dashboard
 *   - p_descripcion: Descripción opcional
 *   - p_configuracion: JSON con configuración visual
 *   - p_es_principal: Si será el dashboard principal del usuario
 */
CREATE OR REPLACE FUNCTION fun_crear_dashboard(
    p_id_usuario DECIMAL(10),
    p_nombre_dashboard VARCHAR(100),
    p_descripcion TEXT DEFAULT NULL,
    p_configuracion JSONB DEFAULT '{}',
    p_es_principal BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    v_nuevo_dashboard_id INT;
    v_usuario_existe BOOLEAN;
    v_dashboard_existe BOOLEAN;
BEGIN
    -- VERIFICAR: Usuario existe y está activo
    SELECT EXISTS(
        SELECT 1 FROM tab_usuarios 
        WHERE id_usuario = p_id_usuario AND ind_activo = TRUE
    ) INTO v_usuario_existe;
    
    IF NOT v_usuario_existe THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuario no encontrado o inactivo',
            'id_usuario', p_id_usuario
        );
    END IF;
    
    -- VERIFICAR: Nombre único para el usuario
    SELECT EXISTS(
        SELECT 1 FROM tab_dashboards_usuarios 
        WHERE id_usuario = p_id_usuario 
          AND nom_dashboard = p_nombre_dashboard
          AND ind_activo = TRUE
    ) INTO v_dashboard_existe;
    
    IF v_dashboard_existe THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ya existe un dashboard con ese nombre para el usuario',
            'nombre_dashboard', p_nombre_dashboard
        );
    END IF;
    
    -- Si es principal, desmarcar otros dashboards principales
    IF p_es_principal THEN
        UPDATE tab_dashboards_usuarios 
        SET es_dashboard_principal = FALSE,
            fec_update = NOW()
        WHERE id_usuario = p_id_usuario;
    END IF;
    
    -- CREAR: Nuevo dashboard
    INSERT INTO tab_dashboards_usuarios (
        id_usuario, nom_dashboard, descripcion, 
        tipo_layout, columnas_grid, tema_color, mostrar_filtros,
        es_publico, es_dashboard_principal, auto_refresh_segundos,
        notificaciones_cambios, fecha_ultimo_acceso, numero_accesos
    ) VALUES (
        p_id_usuario, p_nombre_dashboard, p_descripcion,
        COALESCE(p_configuracion->>'tipo_layout', 'GRID'),
        COALESCE((p_configuracion->>'columnas_grid')::INT, 3),
        COALESCE(p_configuracion->>'tema_color', 'DEFAULT'),
        COALESCE((p_configuracion->>'mostrar_filtros')::BOOLEAN, TRUE),
        COALESCE((p_configuracion->>'es_publico')::BOOLEAN, FALSE),
        p_es_principal,
        COALESCE((p_configuracion->>'auto_refresh_segundos')::INT, 300),
        COALESCE((p_configuracion->>'notificaciones_cambios')::BOOLEAN, FALSE),
        NOW(), 1
    ) RETURNING id_dashboard INTO v_nuevo_dashboard_id;
    
    -- RESPUESTA: Dashboard creado exitosamente
    RETURN json_build_object(
        'success', true,
        'id_dashboard', v_nuevo_dashboard_id,
        'nombre_dashboard', p_nombre_dashboard,
        'es_principal', p_es_principal,
        'configuracion_aplicada', p_configuracion,
        'fecha_creacion', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error creando dashboard: ' || SQLERRM,
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: fun_agregar_widget
-- =====================================================

/*
 * FUNCIÓN: fun_agregar_widget
 * 
 * DESCRIPCIÓN: Agrega un widget de KPI a un dashboard específico
 * 
 * PARÁMETROS:
 *   - p_id_dashboard: ID del dashboard destino
 *   - p_id_kpi: ID del KPI a mostrar
 *   - p_configuracion_widget: JSON con configuración del widget
 *   - p_id_usuario: ID del usuario (para verificación de permisos)
 */
CREATE OR REPLACE FUNCTION fun_agregar_widget(
    p_id_dashboard INT,
    p_id_kpi INT,
    p_configuracion_widget JSONB DEFAULT '{}',
    p_id_usuario DECIMAL(10) DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_dashboard_valido BOOLEAN;
    v_kpi_valido BOOLEAN;
    v_nuevo_widget_id INT;
    v_posicion_x INT := 0;
    v_posicion_y INT := 0;
BEGIN
    -- VERIFICAR: Dashboard existe y pertenece al usuario
    SELECT EXISTS(
        SELECT 1 FROM tab_dashboards_usuarios 
        WHERE id_dashboard = p_id_dashboard
          AND (p_id_usuario IS NULL OR id_usuario = p_id_usuario)
          AND ind_activo = TRUE
    ) INTO v_dashboard_valido;
    
    IF NOT v_dashboard_valido THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Dashboard no encontrado o sin permisos',
            'id_dashboard', p_id_dashboard
        );
    END IF;
    
    -- VERIFICAR: KPI existe y está activo
    SELECT EXISTS(
        SELECT 1 FROM tab_kpis_maestros 
        WHERE id_kpi = p_id_kpi AND ind_activo = TRUE
    ) INTO v_kpi_valido;
    
    IF NOT v_kpi_valido THEN
        RETURN json_build_object(
            'success', false,
            'error', 'KPI no encontrado o inactivo',
            'id_kpi', p_id_kpi
        );
    END IF;
    
    -- CALCULAR: Posición automática si no se especifica
    IF p_configuracion_widget->>'posicion_x' IS NULL OR p_configuracion_widget->>'posicion_y' IS NULL THEN
        SELECT 
            COALESCE(MAX(posicion_x + ancho_columnas), 0),
            COALESCE(MAX(posicion_y), 0)
        INTO v_posicion_x, v_posicion_y
        FROM tab_widgets_dashboard 
        WHERE id_dashboard = p_id_dashboard AND ind_activo = TRUE;
        
        -- Si se excede el ancho de la grilla, pasar a siguiente fila
        DECLARE
            v_columnas_grid INT;
        BEGIN
            SELECT columnas_grid INTO v_columnas_grid
            FROM tab_dashboards_usuarios 
            WHERE id_dashboard = p_id_dashboard;
            
            IF v_posicion_x >= v_columnas_grid THEN
                v_posicion_x := 0;
                v_posicion_y := v_posicion_y + 1;
            END IF;
        END;
    ELSE
        v_posicion_x := (p_configuracion_widget->>'posicion_x')::INT;
        v_posicion_y := (p_configuracion_widget->>'posicion_y')::INT;
    END IF;
    
    -- CREAR: Nuevo widget
    INSERT INTO tab_widgets_dashboard (
        id_dashboard, id_kpi, posicion_x, posicion_y,
        ancho_columnas, alto_filas, orden_z,
        titulo_personalizado, mostrar_titulo, tipo_grafico, color_personalizado,
        mostrar_valor_anterior, mostrar_porcentaje_cambio,
        parametros_kpi, periodo_comparacion, filtros_adicionales
    ) VALUES (
        p_id_dashboard, p_id_kpi, v_posicion_x, v_posicion_y,
        COALESCE((p_configuracion_widget->>'ancho_columnas')::INT, 1),
        COALESCE((p_configuracion_widget->>'alto_filas')::INT, 1),
        COALESCE((p_configuracion_widget->>'orden_z')::INT, 1),
        p_configuracion_widget->>'titulo_personalizado',
        COALESCE((p_configuracion_widget->>'mostrar_titulo')::BOOLEAN, TRUE),
        p_configuracion_widget->>'tipo_grafico',
        p_configuracion_widget->>'color_personalizado',
        COALESCE((p_configuracion_widget->>'mostrar_valor_anterior')::BOOLEAN, TRUE),
        COALESCE((p_configuracion_widget->>'mostrar_porcentaje_cambio')::BOOLEAN, TRUE),
        COALESCE(p_configuracion_widget->'parametros_kpi', '{}'),
        COALESCE(p_configuracion_widget->>'periodo_comparacion', 'MES_ANTERIOR'),
        COALESCE(p_configuracion_widget->'filtros_adicionales', '{}')
    ) RETURNING id_widget INTO v_nuevo_widget_id;
    
    -- RESPUESTA: Widget agregado exitosamente
    RETURN json_build_object(
        'success', true,
        'id_widget', v_nuevo_widget_id,
        'id_dashboard', p_id_dashboard,
        'id_kpi', p_id_kpi,
        'posicion', json_build_object('x', v_posicion_x, 'y', v_posicion_y),
        'configuracion_aplicada', p_configuracion_widget,
        'fecha_creacion', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error agregando widget: ' || SQLERRM,
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: fun_obtener_dashboard_completo
-- =====================================================

/*
 * FUNCIÓN: fun_obtener_dashboard_completo
 * 
 * DESCRIPCIÓN: Obtiene un dashboard completo con todos sus widgets y valores calculados
 * 
 * PARÁMETROS:
 *   - p_id_dashboard: ID del dashboard
 *   - p_calcular_valores: Si calcular valores de KPIs en tiempo real
 *   - p_id_usuario: ID del usuario (para verificación de permisos)
 */
CREATE OR REPLACE FUNCTION fun_obtener_dashboard_completo(
    p_id_dashboard INT,
    p_calcular_valores BOOLEAN DEFAULT TRUE,
    p_id_usuario DECIMAL(10) DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_dashboard_info RECORD;
    v_widgets_array JSONB := '[]';
    v_widget_record RECORD;
    v_kpi_valor JSON;
    v_tiene_acceso BOOLEAN;
BEGIN
    -- VERIFICAR: Acceso al dashboard
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
        d.ind_activo,
        d.fec_creacion,
        d.fec_update,
        u.nom_usuario as propietario,
        EXISTS(
            SELECT 1 FROM tab_compartir_dashboards cd
            WHERE cd.id_dashboard = d.id_dashboard
              AND (cd.id_usuario_destino = p_id_usuario OR cd.id_usuario_destino IS NULL)
              AND cd.ind_activo = TRUE
        ) as dashboard_compartido
    INTO v_dashboard_info
    FROM tab_dashboards_usuarios d
    JOIN tab_usuarios u ON d.id_usuario = u.id_usuario
    WHERE d.id_dashboard = p_id_dashboard AND d.ind_activo = TRUE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Dashboard no encontrado',
            'id_dashboard', p_id_dashboard
        );
    END IF;
    
    -- Verificar permisos de acceso
    v_tiene_acceso := (
        v_dashboard_info.id_usuario = p_id_usuario OR  -- Es el propietario
        v_dashboard_info.es_publico OR                  -- Es público
        v_dashboard_info.dashboard_compartido           -- Está compartido con el usuario
    );
    
    IF NOT v_tiene_acceso AND p_id_usuario IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Sin permisos para acceder al dashboard',
            'id_dashboard', p_id_dashboard
        );
    END IF;
    
    -- OBTENER: Todos los widgets del dashboard
    FOR v_widget_record IN 
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
            w.ind_activo,
            w.fec_creacion,
            w.fec_update,
            k.nom_kpi,
            k.descripcion_kpi,
            k.unidad_medida,
            k.formato_numero,
            k.tipo_grafico_sugerido,
            k.color_primario,
            k.mostrar_tendencia,
            t.nom_tipo_kpi,
            t.color_categoria,
            t.icono
        FROM tab_widgets_dashboard w
        JOIN tab_kpis_maestros k ON w.id_kpi = k.id_kpi
        JOIN tab_tipos_kpi t ON k.id_tipo_kpi = t.id_tipo_kpi
        WHERE w.id_dashboard = p_id_dashboard 
          AND w.ind_activo = TRUE
          AND k.ind_activo = TRUE
        ORDER BY w.posicion_y, w.posicion_x
    LOOP
        -- CALCULAR: Valor del KPI si se solicita
        v_kpi_valor := '{}';
        IF p_calcular_valores THEN
            SELECT fun_calcular_kpi(
                v_widget_record.id_kpi,
                v_widget_record.parametros_kpi,
                FALSE  -- No forzar recálculo
            ) INTO v_kpi_valor;
        END IF;
        
        -- AGREGAR: Widget al array
        v_widgets_array := v_widgets_array || jsonb_build_object(
            'id_widget', v_widget_record.id_widget,
            'id_kpi', v_widget_record.id_kpi,
            'posicion', json_build_object(
                'x', v_widget_record.posicion_x,
                'y', v_widget_record.posicion_y,
                'ancho', v_widget_record.ancho_columnas,
                'alto', v_widget_record.alto_filas,
                'z_index', v_widget_record.orden_z
            ),
            'configuracion_visual', json_build_object(
                'titulo', COALESCE(v_widget_record.titulo_personalizado, v_widget_record.nom_kpi),
                'mostrar_titulo', v_widget_record.mostrar_titulo,
                'tipo_grafico', COALESCE(v_widget_record.tipo_grafico, v_widget_record.tipo_grafico_sugerido),
                'color', COALESCE(v_widget_record.color_personalizado, v_widget_record.color_primario),
                'mostrar_valor_anterior', v_widget_record.mostrar_valor_anterior,
                'mostrar_porcentaje_cambio', v_widget_record.mostrar_porcentaje_cambio
            ),
            'kpi_info', json_build_object(
                'nombre', v_widget_record.nom_kpi,
                'descripcion', v_widget_record.descripcion_kpi,
                'tipo_kpi', v_widget_record.nom_tipo_kpi,
                'unidad_medida', v_widget_record.unidad_medida,
                'formato_numero', v_widget_record.formato_numero,
                'icono_categoria', v_widget_record.icono,
                'color_categoria', v_widget_record.color_categoria
            ),
            'configuracion_datos', json_build_object(
                'parametros_kpi', v_widget_record.parametros_kpi,
                'periodo_comparacion', v_widget_record.periodo_comparacion,
                'filtros_adicionales', v_widget_record.filtros_adicionales
            ),
            'valor_calculado', v_kpi_valor,
            'fecha_creacion', v_widget_record.fec_creacion,
            'fecha_actualizacion', v_widget_record.fec_update
        );
    END LOOP;
    
    -- ACTUALIZAR: Estadísticas de acceso al dashboard
    UPDATE tab_dashboards_usuarios 
    SET fecha_ultimo_acceso = NOW(),
        numero_accesos = numero_accesos + 1
    WHERE id_dashboard = p_id_dashboard;
    
    -- RESPUESTA: Dashboard completo
    RETURN json_build_object(
        'success', true,
        'dashboard', json_build_object(
            'id_dashboard', v_dashboard_info.id_dashboard,
            'nombre', v_dashboard_info.nom_dashboard,
            'descripcion', v_dashboard_info.descripcion,
            'propietario', v_dashboard_info.propietario,
            'configuracion_visual', json_build_object(
                'tipo_layout', v_dashboard_info.tipo_layout,
                'columnas_grid', v_dashboard_info.columnas_grid,
                'tema_color', v_dashboard_info.tema_color,
                'mostrar_filtros', v_dashboard_info.mostrar_filtros,
                'auto_refresh_segundos', v_dashboard_info.auto_refresh_segundos
            ),
            'configuracion_acceso', json_build_object(
                'es_publico', v_dashboard_info.es_publico,
                'es_principal', v_dashboard_info.es_dashboard_principal,
                'notificaciones_cambios', v_dashboard_info.notificaciones_cambios
            ),
            'estadisticas_uso', json_build_object(
                'numero_accesos', v_dashboard_info.numero_accesos,
                'fecha_ultimo_acceso', v_dashboard_info.fecha_ultimo_acceso,
                'fecha_creacion', v_dashboard_info.fec_creacion
            )
        ),
        'widgets', v_widgets_array,
        'total_widgets', jsonb_array_length(v_widgets_array),
        'fecha_consulta', NOW(),
        'valores_calculados', p_calcular_valores
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error obteniendo dashboard: ' || SQLERRM,
            'sql_state', SQLSTATE,
            'id_dashboard', p_id_dashboard
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: fun_actualizar_posicion_widget
-- =====================================================

/*
 * FUNCIÓN: fun_actualizar_posicion_widget
 * 
 * DESCRIPCIÓN: Actualiza la posición y tamaño de un widget en el dashboard
 */
CREATE OR REPLACE FUNCTION fun_actualizar_posicion_widget(
    p_id_widget INT,
    p_nueva_posicion JSONB,
    p_id_usuario DECIMAL(10) DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_widget_valido BOOLEAN;
BEGIN
    -- VERIFICAR: Widget existe y pertenece al usuario
    SELECT EXISTS(
        SELECT 1 FROM tab_widgets_dashboard w
        JOIN tab_dashboards_usuarios d ON w.id_dashboard = d.id_dashboard
        WHERE w.id_widget = p_id_widget
          AND (p_id_usuario IS NULL OR d.id_usuario = p_id_usuario)
          AND w.ind_activo = TRUE
          AND d.ind_activo = TRUE
    ) INTO v_widget_valido;
    
    IF NOT v_widget_valido THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Widget no encontrado o sin permisos',
            'id_widget', p_id_widget
        );
    END IF;
    
    -- ACTUALIZAR: Posición del widget
    UPDATE tab_widgets_dashboard 
    SET posicion_x = COALESCE((p_nueva_posicion->>'x')::INT, posicion_x),
        posicion_y = COALESCE((p_nueva_posicion->>'y')::INT, posicion_y),
        ancho_columnas = COALESCE((p_nueva_posicion->>'ancho')::INT, ancho_columnas),
        alto_filas = COALESCE((p_nueva_posicion->>'alto')::INT, alto_filas),
        orden_z = COALESCE((p_nueva_posicion->>'z_index')::INT, orden_z),
        fec_update = NOW()
    WHERE id_widget = p_id_widget;
    
    RETURN json_build_object(
        'success', true,
        'id_widget', p_id_widget,
        'nueva_posicion', p_nueva_posicion,
        'fecha_actualizacion', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error actualizando posición: ' || SQLERRM,
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql; 