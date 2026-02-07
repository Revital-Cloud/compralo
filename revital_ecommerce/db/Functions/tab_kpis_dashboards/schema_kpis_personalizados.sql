/*
 * ESQUEMA: Sistema de KPIs Personalizados y Dashboards
 * 
 * DESCRIPCIÓN: Sistema completo para que administradores configuren KPIs
 *              y usuarios personalicen sus dashboards con métricas elegidas.
 *              Extiende el sistema de estadísticas existente.
 * 
 * CARACTERÍSTICAS:
 *   - KPIs configurables por administrador
 *   - Dashboards personalizables por usuario
 *   - Métricas calculadas en tiempo real
 *   - Widgets flexibles y reutilizables
 *   - Permisos granulares por rol
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- =====================================================
-- TABLA: tab_tipos_kpi
-- =====================================================

CREATE TABLE IF NOT EXISTS tab_tipos_kpi (
    id_tipo_kpi                 SERIAL PRIMARY KEY,
    nom_tipo_kpi                VARCHAR(100) NOT NULL UNIQUE,    -- Ventas, Inventario, Usuarios, etc.
    descripcion                 TEXT,
    color_categoria             VARCHAR(7) DEFAULT '#3498DB',     -- Color hex para UI
    icono                       VARCHAR(50),                     -- Icono para UI
    orden_visualizacion         INT DEFAULT 1,
    ind_activo                  BOOLEAN DEFAULT TRUE,
    fec_creacion               TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    fec_update                 TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA: tab_kpis_maestros
-- =====================================================

CREATE TABLE IF NOT EXISTS tab_kpis_maestros (
    id_kpi                      SERIAL PRIMARY KEY,
    id_tipo_kpi                 INT NOT NULL,
    nom_kpi                     VARCHAR(150) NOT NULL,            -- Nombre del KPI
    descripcion_kpi             TEXT,
    formula_sql                 TEXT NOT NULL,                    -- Query SQL para calcular el KPI
    unidad_medida              VARCHAR(20),                      -- €, %, unidades, días, etc.
    formato_numero             VARCHAR(20) DEFAULT 'DECIMAL',    -- DECIMAL, INTEGER, PERCENTAGE, CURRENCY
    rango_esperado_min         DECIMAL(15,2),                    -- Valor mínimo esperado
    rango_esperado_max         DECIMAL(15,2),                    -- Valor máximo esperado
    
    -- Configuración de actualización
    frecuencia_actualizacion   VARCHAR(20) DEFAULT 'TIEMPO_REAL', -- TIEMPO_REAL, HORARIA, DIARIA, SEMANAL
    ultima_actualizacion       TIMESTAMP WITHOUT TIME ZONE,
    duracion_cache_minutos     INT DEFAULT 15,                   -- Tiempo de cache para optimización
    
    -- Configuración visual
    tipo_grafico_sugerido      VARCHAR(30) DEFAULT 'NUMERO',     -- NUMERO, LINEA, BARRA, DONUT, GAUGE
    color_primario             VARCHAR(7) DEFAULT '#2ECC71',
    mostrar_tendencia          BOOLEAN DEFAULT TRUE,
    mostrar_comparacion        BOOLEAN DEFAULT TRUE,
    
    -- Permisos y control
    solo_administradores       BOOLEAN DEFAULT FALSE,            -- Solo admins pueden ver este KPI
    requiere_parametros        BOOLEAN DEFAULT FALSE,            -- Si requiere parámetros dinámicos
    parametros_permitidos      JSONB,                           -- Lista de parámetros válidos
    
    -- Metadatos
    creado_por                 DECIMAL(10),                     -- Usuario que creó el KPI
    ind_activo                 BOOLEAN DEFAULT TRUE,
    fec_creacion              TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    fec_update                TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (id_tipo_kpi) REFERENCES tab_tipos_kpi(id_tipo_kpi),
    FOREIGN KEY (creado_por) REFERENCES tab_usuarios(id_usuario)
);

-- =====================================================
-- TABLA: tab_dashboards_usuarios
-- =====================================================

CREATE TABLE IF NOT EXISTS tab_dashboards_usuarios (
    id_dashboard                SERIAL PRIMARY KEY,
    id_usuario                  DECIMAL(10) NOT NULL,
    nom_dashboard               VARCHAR(100) NOT NULL,
    descripcion                 TEXT,
    
    -- Configuración visual
    tipo_layout                 VARCHAR(20) DEFAULT 'GRID',     -- GRID, FLEX, MASONRY
    columnas_grid              INT DEFAULT 3,                   -- Número de columnas
    tema_color                 VARCHAR(20) DEFAULT 'DEFAULT',   -- DEFAULT, DARK, LIGHT, CUSTOM
    mostrar_filtros            BOOLEAN DEFAULT TRUE,
    
    -- Control de acceso
    es_publico                 BOOLEAN DEFAULT FALSE,           -- Si otros usuarios pueden verlo
    es_dashboard_principal     BOOLEAN DEFAULT FALSE,           -- Dashboard por defecto del usuario
    
    -- Configuración de actualización
    auto_refresh_segundos      INT DEFAULT 300,                 -- Auto-refresh cada 5 minutos
    notificaciones_cambios     BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    fecha_ultimo_acceso        TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    numero_accesos             INT DEFAULT 0,
    ind_activo                 BOOLEAN DEFAULT TRUE,
    fec_creacion              TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    fec_update                TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    UNIQUE(id_usuario, nom_dashboard)
);

-- =====================================================
-- TABLA: tab_widgets_dashboard
-- =====================================================

CREATE TABLE IF NOT EXISTS tab_widgets_dashboard (
    id_widget                   SERIAL PRIMARY KEY,
    id_dashboard                INT NOT NULL,
    id_kpi                      INT NOT NULL,
    
    -- Posicionamiento en el dashboard
    posicion_x                  INT NOT NULL DEFAULT 0,
    posicion_y                  INT NOT NULL DEFAULT 0,
    ancho_columnas             INT NOT NULL DEFAULT 1,
    alto_filas                 INT NOT NULL DEFAULT 1,
    orden_z                    INT DEFAULT 1,
    
    -- Configuración visual del widget
    titulo_personalizado       VARCHAR(150),                   -- Título override del KPI
    mostrar_titulo             BOOLEAN DEFAULT TRUE,
    tipo_grafico               VARCHAR(30),                    -- Override del tipo sugerido
    color_personalizado        VARCHAR(7),                     -- Override del color
    mostrar_valor_anterior     BOOLEAN DEFAULT TRUE,
    mostrar_porcentaje_cambio  BOOLEAN DEFAULT TRUE,
    
    -- Configuración de datos
    parametros_kpi             JSONB,                         -- Parámetros específicos para este widget
    periodo_comparacion        VARCHAR(20) DEFAULT 'MES_ANTERIOR', -- MES_ANTERIOR, TRIMESTRE_ANTERIOR, AÑO_ANTERIOR
    filtros_adicionales        JSONB,                         -- Filtros específicos del widget
    
    -- Estado y control
    ind_activo                 BOOLEAN DEFAULT TRUE,
    fec_creacion              TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    fec_update                TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (id_dashboard) REFERENCES tab_dashboards_usuarios(id_dashboard) ON DELETE CASCADE,
    FOREIGN KEY (id_kpi) REFERENCES tab_kpis_maestros(id_kpi)
);

-- =====================================================
-- TABLA: tab_valores_kpi_cache
-- =====================================================

CREATE TABLE IF NOT EXISTS tab_valores_kpi_cache (
    id_cache                    SERIAL PRIMARY KEY,
    id_kpi                      INT NOT NULL,
    parametros_hash             VARCHAR(64),                   -- Hash de parámetros para cache único
    
    -- Valores calculados
    valor_actual               DECIMAL(15,4),
    valor_anterior             DECIMAL(15,4),                 -- Para comparación
    porcentaje_cambio          DECIMAL(5,2),
    tendencia                  VARCHAR(10),                   -- POSITIVA, NEGATIVA, ESTABLE
    
    -- Datos adicionales
    datos_extra                JSONB,                         -- Datos adicionales para gráficos
    metadata_calculo           JSONB,                         -- Metadatos del cálculo
    
    -- Control de cache
    fecha_calculo              TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    fecha_expiracion           TIMESTAMP WITHOUT TIME ZONE,
    numero_accesos             INT DEFAULT 0,
    
    FOREIGN KEY (id_kpi) REFERENCES tab_kpis_maestros(id_kpi),
    UNIQUE(id_kpi, parametros_hash)
);

-- =====================================================
-- TABLA: tab_alertas_kpi
-- =====================================================

CREATE TABLE IF NOT EXISTS tab_alertas_kpi (
    id_alerta                   SERIAL PRIMARY KEY,
    id_kpi                      INT NOT NULL,
    id_usuario                  DECIMAL(10) NOT NULL,
    
    -- Configuración de la alerta
    nom_alerta                  VARCHAR(100) NOT NULL,
    tipo_condicion              VARCHAR(20) NOT NULL,         -- MAYOR_QUE, MENOR_QUE, ENTRE, CAMBIO_PORCENTUAL
    valor_umbral_min           DECIMAL(15,4),
    valor_umbral_max           DECIMAL(15,4),
    porcentaje_cambio_umbral   DECIMAL(5,2),
    
    -- Configuración de notificación
    metodo_notificacion        VARCHAR(20) DEFAULT 'EMAIL',   -- EMAIL, SMS, PUSH, INAPP
    frecuencia_verificacion    VARCHAR(20) DEFAULT 'HORARIA', -- TIEMPO_REAL, HORARIA, DIARIA
    
    -- Estado de la alerta
    ind_activo                 BOOLEAN DEFAULT TRUE,
    ultima_verificacion        TIMESTAMP WITHOUT TIME ZONE,
    ultima_activacion          TIMESTAMP WITHOUT TIME ZONE,
    numero_activaciones        INT DEFAULT 0,
    
    fec_creacion              TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    fec_update                TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (id_kpi) REFERENCES tab_kpis_maestros(id_kpi),
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario)
);

-- =====================================================
-- TABLA: tab_compartir_dashboards
-- =====================================================

CREATE TABLE IF NOT EXISTS tab_compartir_dashboards (
    id_compartir                SERIAL PRIMARY KEY,
    id_dashboard                INT NOT NULL,
    id_usuario_propietario      DECIMAL(10) NOT NULL,
    id_usuario_destino          DECIMAL(10),                  -- NULL para compartir público
    
    -- Permisos
    tipo_permiso                VARCHAR(20) DEFAULT 'VER',    -- VER, EDITAR, ADMINISTRAR
    puede_descargar             BOOLEAN DEFAULT FALSE,
    puede_duplicar              BOOLEAN DEFAULT FALSE,
    
    -- Control de acceso
    token_acceso_publico        VARCHAR(128) UNIQUE,          -- Para acceso sin login
    fecha_expiracion           DATE,                          -- Cuándo expira el acceso
    limite_accesos             INT,                           -- Máximo número de accesos
    accesos_realizados         INT DEFAULT 0,
    
    ind_activo                 BOOLEAN DEFAULT TRUE,
    fec_creacion              TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (id_dashboard) REFERENCES tab_dashboards_usuarios(id_dashboard) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_propietario) REFERENCES tab_usuarios(id_usuario),
    FOREIGN KEY (id_usuario_destino) REFERENCES tab_usuarios(id_usuario)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para tab_kpis_maestros
CREATE INDEX IF NOT EXISTS idx_kpis_maestros_tipo 
    ON tab_kpis_maestros(id_tipo_kpi, ind_activo);

CREATE INDEX IF NOT EXISTS idx_kpis_maestros_frecuencia 
    ON tab_kpis_maestros(frecuencia_actualizacion, ultima_actualizacion);

-- Índices para tab_dashboards_usuarios
CREATE INDEX IF NOT EXISTS idx_dashboards_usuario 
    ON tab_dashboards_usuarios(id_usuario, ind_activo);

CREATE INDEX IF NOT EXISTS idx_dashboards_publicos 
    ON tab_dashboards_usuarios(es_publico, ind_activo);

-- Índices para tab_widgets_dashboard
CREATE INDEX IF NOT EXISTS idx_widgets_dashboard 
    ON tab_widgets_dashboard(id_dashboard, ind_activo);

CREATE INDEX IF NOT EXISTS idx_widgets_posicion 
    ON tab_widgets_dashboard(id_dashboard, posicion_x, posicion_y);

-- Índices para tab_valores_kpi_cache
CREATE INDEX IF NOT EXISTS idx_cache_kpi_fecha 
    ON tab_valores_kpi_cache(id_kpi, fecha_expiracion);

CREATE INDEX IF NOT EXISTS idx_cache_accesos 
    ON tab_valores_kpi_cache(numero_accesos, fecha_calculo);

-- Índices para tab_alertas_kpi
CREATE INDEX IF NOT EXISTS idx_alertas_usuario 
    ON tab_alertas_kpi(id_usuario, ind_activo);

CREATE INDEX IF NOT EXISTS idx_alertas_verificacion 
    ON tab_alertas_kpi(frecuencia_verificacion, ultima_verificacion, ind_activo);

-- =====================================================
-- COMENTARIOS EN LAS TABLAS
-- =====================================================

COMMENT ON TABLE tab_tipos_kpi IS 
'Categorías de KPIs (Ventas, Inventario, Usuarios, etc.) para organización';

COMMENT ON TABLE tab_kpis_maestros IS 
'Definición maestra de KPIs con fórmulas SQL y configuración visual';

COMMENT ON TABLE tab_dashboards_usuarios IS 
'Dashboards personalizados creados por usuarios con configuración visual';

COMMENT ON TABLE tab_widgets_dashboard IS 
'Widgets individuales dentro de dashboards con posicionamiento y configuración';

COMMENT ON TABLE tab_valores_kpi_cache IS 
'Cache de valores calculados de KPIs para optimización de rendimiento';

COMMENT ON TABLE tab_alertas_kpi IS 
'Alertas configuradas por usuarios para monitoreo automático de KPIs';

COMMENT ON TABLE tab_compartir_dashboards IS 
'Control de acceso y compartición de dashboards entre usuarios'; 