-- *********************************************************
-- * BASE DE DATOS SYNKRO SAAS - PANEL DE CONTROL         *
-- * Gestión de Instancias de E-Commerce                  *
-- * CREADO POR: Synkro Team                              *
-- * Fecha: Noviembre 2025                                *
-- *********************************************************

-- ============================================================
-- ELIMINACIÓN DE OBJETOS EXISTENTES (SI EXISTEN)
-- ============================================================

-- Eliminar vistas primero
DROP VIEW IF EXISTS vw_resumen_instancias;
DROP VIEW IF EXISTS vw_metricas_agregadas;
DROP VIEW IF EXISTS vw_suscripciones_activas;

-- Eliminar tipos ENUM
-- ENUMs de usuarios eliminados - ya no se necesitan
DROP TYPE IF EXISTS enum_estado_plan;
DROP TYPE IF EXISTS enum_estado_cliente;
DROP TYPE IF EXISTS enum_estado_instancia;
DROP TYPE IF EXISTS enum_tipo_facturacion;
DROP TYPE IF EXISTS enum_estado_suscripcion;
DROP TYPE IF EXISTS enum_estado_pago;
DROP TYPE IF EXISTS enum_tipo_deploy;
DROP TYPE IF EXISTS enum_estado_deploy;
DROP TYPE IF EXISTS enum_ambiente;
DROP TYPE IF EXISTS enum_tipo_dominio;
DROP TYPE IF EXISTS enum_estado_dominio;
DROP TYPE IF EXISTS enum_tipo_cambio;
DROP TYPE IF EXISTS enum_tipo_identificacion;

-- Eliminar tablas en orden de dependencias
DROP TABLE IF EXISTS tab_historial_planes;
DROP TABLE IF EXISTS tab_uso_recursos;
DROP TABLE IF EXISTS tab_reg_del;
DROP TABLE IF EXISTS tab_auditoria;
DROP TABLE IF EXISTS tab_metricas_instancias;
DROP TABLE IF EXISTS tab_facturacion;
DROP TABLE IF EXISTS tab_suscripciones;
DROP TABLE IF EXISTS tab_dominios;
DROP TABLE IF EXISTS tab_deployments;
DROP TABLE IF EXISTS tab_instancias;
DROP TABLE IF EXISTS tab_clientes;
DROP TABLE IF EXISTS tab_planes;
DROP TABLE IF EXISTS tab_usuarios_synkro;

-- Eliminar secuencias
-- seq_usuarios_synkro eliminada - ya no se necesita
-- seq_clientes eliminada - se usa identificacion_fiscal como ID
DROP SEQUENCE IF EXISTS seq_instancias;
DROP SEQUENCE IF EXISTS seq_planes;
DROP SEQUENCE IF EXISTS seq_suscripciones;
DROP SEQUENCE IF EXISTS seq_facturacion;
DROP SEQUENCE IF EXISTS seq_deployments;
DROP SEQUENCE IF EXISTS seq_dominios;
DROP SEQUENCE IF EXISTS seq_metricas;
DROP SEQUENCE IF EXISTS seq_auditoria;

-- ============================================================
-- CREACIÓN DE SECUENCIAS
-- ============================================================

-- seq_usuarios_synkro eliminada - el cliente gestiona su propia instancia
-- Secuencia seq_clientes eliminada - se usa NIT como ID
CREATE SEQUENCE seq_instancias START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_planes START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_suscripciones START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_facturacion START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_deployments START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_dominios START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_metricas START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_auditoria START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_reg_del START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_uso_recursos START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_historial_planes START WITH 1 INCREMENT BY 1;

-- ============================================================
-- CREACIÓN DE TIPOS ENUM
-- ============================================================

-- ENUMs de usuarios eliminados - el cliente gestiona su propia instancia
CREATE TYPE enum_estado_plan AS ENUM ('activo', 'inactivo', 'deprecado');
CREATE TYPE enum_estado_cliente AS ENUM ('prospecto', 'activo', 'suspendido', 'cancelado', 'trial');
CREATE TYPE enum_estado_instancia AS ENUM ('creando', 'activa', 'suspendida', 'eliminada', 'error');
CREATE TYPE enum_tipo_facturacion AS ENUM ('mensual', 'anual', 'trimestral');
CREATE TYPE enum_estado_suscripcion AS ENUM ('activa', 'cancelada', 'suspendida', 'expirada', 'trial');
CREATE TYPE enum_estado_pago AS ENUM ('pendiente', 'pagado', 'fallido', 'reembolsado', 'cancelado');
CREATE TYPE enum_tipo_deploy AS ENUM ('manual', 'automatico', 'rollback', 'hotfix');
CREATE TYPE enum_estado_deploy AS ENUM ('iniciado', 'en_proceso', 'completado', 'fallido', 'cancelado');
CREATE TYPE enum_ambiente AS ENUM ('desarrollo', 'staging', 'produccion');
CREATE TYPE enum_tipo_dominio AS ENUM ('subdominio', 'personalizado', 'wildcard');
CREATE TYPE enum_estado_dominio AS ENUM ('pendiente', 'activo', 'error', 'desactivado');
CREATE TYPE enum_tipo_cambio AS ENUM ('upgrade', 'downgrade', 'inicial', 'renovacion');
CREATE TYPE enum_tipo_identificacion AS ENUM ('NIT', 'EIN', 'RFC', 'CUIT', 'RUT', 'NIF', 'CIF', 'CNPJ', 'RUC', 'OTRO');

-- ============================================================
-- TABLA: tab_usuarios_synkro ELIMINADA
-- Descripción: Ya no se necesita - el cliente gestiona su propia instancia
-- ============================================================

-- ============================================================
-- TABLA: tab_planes
-- Descripción: Planes de suscripción disponibles (Starter, Business, Enterprise)
-- ============================================================

CREATE TABLE tab_planes (
    id_plan DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_planes'),
    nom_plan VARCHAR NOT NULL UNIQUE,
    desc_plan TEXT,
    precio_mensual DECIMAL(10,2) NOT NULL,
    precio_anual DECIMAL(10,2),
    moneda VARCHAR NOT NULL DEFAULT 'USD',
    max_productos INTEGER,
    max_usuarios INTEGER,
    max_almacenamiento_gb INTEGER,
    features_json JSONB, -- Características del plan en formato JSON
    estado_plan enum_estado_plan NOT NULL DEFAULT 'activo',
    usr_insert VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email o identificación fiscal del cliente que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE
);

-- Índices para planes
CREATE INDEX idx_planes_estado ON tab_planes(estado_plan);
CREATE INDEX idx_planes_nombre ON tab_planes(nom_plan);


-- ============================================================
-- TABLA: tab_clientes
-- Descripción: Empresas/clientes que contratan el servicio
-- ============================================================

CREATE TABLE tab_clientes (
    identificacion_fiscal VARCHAR PRIMARY KEY, -- Identificación fiscal única
    tipo_identificacion enum_tipo_identificacion NOT NULL DEFAULT 'NIT',
    nom_empresa VARCHAR NOT NULL,
    email_contacto VARCHAR NOT NULL,
    telefono_contacto VARCHAR,
    direccion_empresa TEXT,
    ciudad VARCHAR,
    pais VARCHAR NOT NULL DEFAULT 'Colombia',
    nom_contacto_principal VARCHAR NOT NULL,
    email_contacto_principal VARCHAR NOT NULL,
    telefono_contacto_principal VARCHAR,
    estado_cliente enum_estado_cliente NOT NULL DEFAULT 'prospecto',
    fecha_activacion TIMESTAMP WITHOUT TIME ZONE,
    fecha_ultimo_acceso TIMESTAMP WITHOUT TIME ZONE,
    notas_internas TEXT,
    usr_insert VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email o identificación fiscal del cliente que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE
);

-- Índices para clientes
CREATE INDEX idx_clientes_email ON tab_clientes(email_contacto);
CREATE INDEX idx_clientes_estado ON tab_clientes(estado_cliente);
-- idx_clientes_identificacion no necesario - identificacion_fiscal es PK (índice automático)
CREATE INDEX idx_clientes_tipo_identificacion ON tab_clientes(tipo_identificacion);

-- ============================================================
-- TABLA: tab_instancias
-- Descripción: Instancias de e-commerce creadas para cada cliente
-- ============================================================

CREATE TABLE tab_instancias (
    id_instancia DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_instancias'),
    identificacion_fiscal_cliente VARCHAR NOT NULL,
    nom_instancia VARCHAR NOT NULL,
    slug_instancia VARCHAR NOT NULL UNIQUE, -- Identificador único para URLs
    subdominio VARCHAR UNIQUE, -- Ej: empresa-abc.synkro.com
    dominio_personalizado VARCHAR, -- Ej: tienda.empresa-abc.com
    estado_instancia enum_estado_instancia NOT NULL DEFAULT 'creando',
    version_instancia VARCHAR NOT NULL DEFAULT '1.0.0',
    db_nombre VARCHAR NOT NULL UNIQUE, -- Nombre de la base de datos PostgreSQL
    db_host VARCHAR,
    db_puerto INTEGER DEFAULT 5432,
    db_usuario VARCHAR,
    -- NO almacenar password en texto plano, usar sistema de secrets
    backend_url VARCHAR, -- URL del backend de la instancia
    frontend_url VARCHAR, -- URL del frontend de la instancia
    region_deployment VARCHAR DEFAULT 'us-east-1', -- Región de AWS/GCP/etc
    config_json JSONB, -- Configuración adicional en formato JSON
    fecha_activacion TIMESTAMP WITHOUT TIME ZONE,
    fecha_ultimo_deploy TIMESTAMP WITHOUT TIME ZONE,
    usr_insert VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que creó la instancia
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email o NIT del cliente que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_instancia_cliente FOREIGN KEY (identificacion_fiscal_cliente) REFERENCES tab_clientes(identificacion_fiscal)
);

-- Índices para instancias
CREATE INDEX idx_instancias_cliente ON tab_instancias(identificacion_fiscal_cliente);
CREATE INDEX idx_instancias_estado ON tab_instancias(estado_instancia);
CREATE INDEX idx_instancias_slug ON tab_instancias(slug_instancia);
CREATE INDEX idx_instancias_subdominio ON tab_instancias(subdominio);
CREATE INDEX idx_instancias_dominio ON tab_instancias(dominio_personalizado);

-- ============================================================
-- TABLA: tab_suscripciones
-- Descripción: Suscripciones activas de clientes a planes
-- ============================================================

CREATE TABLE tab_suscripciones (
    id_suscripcion DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_suscripciones'),
    identificacion_fiscal_cliente VARCHAR NOT NULL,
    id_plan DECIMAL(10,0) NOT NULL,
    id_instancia DECIMAL(10,0), -- Instancia asociada (puede ser NULL si aún no se crea)
    tipo_facturacion enum_tipo_facturacion NOT NULL DEFAULT 'mensual',
    precio_actual DECIMAL(10,2) NOT NULL, -- Precio al momento de la suscripción
    fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITHOUT TIME ZONE, -- NULL para suscripciones activas indefinidas
    fecha_proximo_pago TIMESTAMP WITHOUT TIME ZONE,
    estado_suscripcion enum_estado_suscripcion NOT NULL DEFAULT 'activa',
    metodo_pago VARCHAR, -- 'tarjeta', 'transferencia', 'paypal', etc.
    fecha_cancelacion TIMESTAMP WITHOUT TIME ZONE,
    motivo_cancelacion TEXT,
    usr_insert VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email o identificación fiscal del cliente que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_suscripcion_cliente FOREIGN KEY (identificacion_fiscal_cliente) REFERENCES tab_clientes(identificacion_fiscal),
    CONSTRAINT fk_suscripcion_plan FOREIGN KEY (id_plan) REFERENCES tab_planes(id_plan),
    CONSTRAINT fk_suscripcion_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia) ON DELETE SET NULL
);

-- Índices para suscripciones
CREATE INDEX idx_suscripciones_cliente ON tab_suscripciones(identificacion_fiscal_cliente);
CREATE INDEX idx_suscripciones_plan ON tab_suscripciones(id_plan);
CREATE INDEX idx_suscripciones_estado ON tab_suscripciones(estado_suscripcion);
CREATE INDEX idx_suscripciones_fecha_fin ON tab_suscripciones(fecha_fin);
CREATE INDEX idx_suscripciones_proximo_pago ON tab_suscripciones(fecha_proximo_pago);

-- ============================================================
-- TABLA: tab_facturacion
-- Descripción: Facturas y pagos de suscripciones
-- ============================================================

CREATE TABLE tab_facturacion (
    id_factura DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_facturacion'),
    id_suscripcion DECIMAL(10,0) NOT NULL,
    identificacion_fiscal_cliente VARCHAR NOT NULL,
    num_factura VARCHAR NOT NULL UNIQUE,
    concepto_factura VARCHAR NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    moneda VARCHAR NOT NULL DEFAULT 'USD',
    estado_pago enum_estado_pago NOT NULL DEFAULT 'pendiente',
    metodo_pago VARCHAR,
    fecha_emision TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP WITHOUT TIME ZONE,
    fecha_pago TIMESTAMP WITHOUT TIME ZONE,
    referencia_pago VARCHAR, -- Referencia de pago externa (Wompi, Stripe, etc.)
    notas TEXT,
    usr_insert VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email o identificación fiscal del cliente que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_factura_suscripcion FOREIGN KEY (id_suscripcion) REFERENCES tab_suscripciones(id_suscripcion),
    CONSTRAINT fk_factura_cliente FOREIGN KEY (identificacion_fiscal_cliente) REFERENCES tab_clientes(identificacion_fiscal)
);

-- Índices para facturación
CREATE INDEX idx_facturacion_suscripcion ON tab_facturacion(id_suscripcion);
CREATE INDEX idx_facturacion_cliente ON tab_facturacion(identificacion_fiscal_cliente);
CREATE INDEX idx_facturacion_estado ON tab_facturacion(estado_pago);
CREATE INDEX idx_facturacion_num_factura ON tab_facturacion(num_factura);
CREATE INDEX idx_facturacion_fecha_emision ON tab_facturacion(fecha_emision);
CREATE INDEX idx_facturacion_fecha_vencimiento ON tab_facturacion(fecha_vencimiento);

-- ============================================================
-- TABLA: tab_deployments
-- Descripción: Información de deployments de instancias
-- ============================================================

CREATE TABLE tab_deployments (
    id_deployment DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_deployments'),
    id_instancia DECIMAL(10,0) NOT NULL,
    version_deploy VARCHAR NOT NULL,
    tipo_deploy enum_tipo_deploy NOT NULL DEFAULT 'manual',
    estado_deploy enum_estado_deploy NOT NULL DEFAULT 'iniciado',
    ambiente enum_ambiente NOT NULL DEFAULT 'produccion',
    logs_deploy TEXT,
    fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITHOUT TIME ZONE,
    duracion_segundos INTEGER,
    iniciado_por VARCHAR, -- Email o identificación fiscal del cliente que inició el deployment
    usr_insert VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email o identificación fiscal del cliente que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_deployment_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia)
);

-- Índices para deployments
CREATE INDEX idx_deployments_instancia ON tab_deployments(id_instancia);
CREATE INDEX idx_deployments_estado ON tab_deployments(estado_deploy);
CREATE INDEX idx_deployments_fecha_inicio ON tab_deployments(fecha_inicio);

-- ============================================================
-- TABLA: tab_dominios
-- Descripción: Dominios asociados a instancias
-- ============================================================

CREATE TABLE tab_dominios (
    id_dominio DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_dominios'),
    id_instancia DECIMAL(10,0) NOT NULL,
    nom_dominio VARCHAR NOT NULL UNIQUE,
    tipo_dominio enum_tipo_dominio NOT NULL DEFAULT 'subdominio',
    estado_dominio enum_estado_dominio NOT NULL DEFAULT 'pendiente',
    ssl_habilitado BOOLEAN DEFAULT FALSE,
    fecha_ssl_emision TIMESTAMP WITHOUT TIME ZONE,
    fecha_ssl_vencimiento TIMESTAMP WITHOUT TIME ZONE,
    usr_insert VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email o identificación fiscal del cliente que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_dominio_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia)
);

-- Índices para dominios
CREATE INDEX idx_dominios_instancia ON tab_dominios(id_instancia);
CREATE INDEX idx_dominios_estado ON tab_dominios(estado_dominio);
CREATE INDEX idx_dominios_nombre ON tab_dominios(nom_dominio);

-- ============================================================
-- TABLA: tab_metricas_instancias
-- Descripción: Métricas y monitoreo de instancias
-- ============================================================

CREATE TABLE tab_metricas_instancias (
    id_metrica DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_metricas'),
    id_instancia DECIMAL(10,0) NOT NULL,
    fecha_metrica TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_metrica VARCHAR NOT NULL, -- 'uptime', 'response_time', 'cpu', 'memory', 'storage', 'traffic', 'orders', 'revenue'
    valor_metrica DECIMAL(15,4) NOT NULL,
    unidad_medida VARCHAR, -- 'ms', 'percent', 'gb', 'count', 'usd'
    metadata_json JSONB, -- Información adicional de la métrica
    CONSTRAINT fk_metrica_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia)
);

-- Índices para métricas
CREATE INDEX idx_metricas_instancia ON tab_metricas_instancias(id_instancia);
CREATE INDEX idx_metricas_tipo ON tab_metricas_instancias(tipo_metrica);
CREATE INDEX idx_metricas_fecha ON tab_metricas_instancias(fecha_metrica);
CREATE INDEX idx_metricas_instancia_fecha ON tab_metricas_instancias(id_instancia, fecha_metrica);

-- ============================================================
-- TABLA: tab_auditoria
-- Descripción: Logs de acciones en el panel de control
-- ============================================================

CREATE TABLE tab_auditoria (
    id_auditoria DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_auditoria'),
    usuario_email VARCHAR, -- Email o identificación fiscal del cliente que realizó la acción
    identificacion_fiscal_cliente VARCHAR,
    id_instancia DECIMAL(10,0),
    tipo_accion VARCHAR NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', 'deploy', 'suspend', etc.
    entidad_afectada VARCHAR NOT NULL, -- 'cliente', 'instancia', 'suscripcion', 'factura', etc.
    descripcion_accion TEXT,
    datos_anteriores JSONB, -- Estado anterior (para updates)
    datos_nuevos JSONB, -- Estado nuevo (para creates/updates)
    ip_origen VARCHAR,
    user_agent TEXT,
    usr_insert VARCHAR NOT NULL, -- Email o NIT del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_auditoria_cliente FOREIGN KEY (identificacion_fiscal_cliente) REFERENCES tab_clientes(identificacion_fiscal) ON DELETE SET NULL,
    CONSTRAINT fk_auditoria_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia) ON DELETE SET NULL
);

-- Índices para auditoría
CREATE INDEX idx_auditoria_usuario ON tab_auditoria(usuario_email);
CREATE INDEX idx_auditoria_cliente ON tab_auditoria(identificacion_fiscal_cliente);
CREATE INDEX idx_auditoria_instancia ON tab_auditoria(id_instancia);
CREATE INDEX idx_auditoria_tipo_accion ON tab_auditoria(tipo_accion);
CREATE INDEX idx_auditoria_fecha ON tab_auditoria(fec_insert);
CREATE INDEX idx_auditoria_entidad ON tab_auditoria(entidad_afectada);

-- ============================================================
-- TABLA: tab_reg_del
-- Descripción: Registro de eliminaciones lógicas (soft deletes)
-- ============================================================

CREATE TABLE tab_reg_del (
    id_del DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_reg_del'),
    tab_name VARCHAR NOT NULL, -- Nombre de la tabla donde se eliminó el registro
    atributos JSONB NOT NULL, -- Datos del registro eliminado en formato JSON
    usr_delete VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que realizó la eliminación
    fec_delete TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tab_reg_del
CREATE INDEX idx_reg_del_tabla ON tab_reg_del(tab_name);
CREATE INDEX idx_reg_del_fecha ON tab_reg_del(fec_delete);
CREATE INDEX idx_reg_del_usuario ON tab_reg_del(usr_delete);

-- ============================================================
-- TABLA: tab_uso_recursos
-- Descripción: Tracking de uso de recursos por instancia vs límites del plan
-- ============================================================

CREATE TABLE tab_uso_recursos (
    id_uso_recurso DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_uso_recursos'),
    id_instancia DECIMAL(10,0) NOT NULL,
    id_suscripcion DECIMAL(10,0) NOT NULL,
    fecha_medicion TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Recursos medidos
    productos_actuales INTEGER NOT NULL DEFAULT 0 CHECK (productos_actuales >= 0),
    usuarios_actuales INTEGER NOT NULL DEFAULT 0 CHECK (usuarios_actuales >= 0),
    almacenamiento_actual_gb DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (almacenamiento_actual_gb >= 0),
    -- Límites del plan al momento de la medición
    max_productos INTEGER, -- NULL = ilimitado
    max_usuarios INTEGER, -- NULL = ilimitado
    max_almacenamiento_gb INTEGER, -- NULL = ilimitado
    -- Porcentajes de uso
    porcentaje_uso_productos DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN max_productos IS NULL OR max_productos = 0 THEN NULL
            ELSE (productos_actuales::DECIMAL / max_productos::DECIMAL * 100)
        END
    ) STORED,
    porcentaje_uso_usuarios DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN max_usuarios IS NULL OR max_usuarios = 0 THEN NULL
            ELSE (usuarios_actuales::DECIMAL / max_usuarios::DECIMAL * 100)
        END
    ) STORED,
    porcentaje_uso_almacenamiento DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN max_almacenamiento_gb IS NULL OR max_almacenamiento_gb = 0 THEN NULL
            ELSE (almacenamiento_actual_gb / max_almacenamiento_gb::DECIMAL * 100)
        END
    ) STORED,
    -- Alertas
    ind_alerta_productos BOOLEAN GENERATED ALWAYS AS (
        porcentaje_uso_productos IS NOT NULL AND porcentaje_uso_productos >= 80
    ) STORED,
    ind_alerta_usuarios BOOLEAN GENERATED ALWAYS AS (
        porcentaje_uso_usuarios IS NOT NULL AND porcentaje_uso_usuarios >= 80
    ) STORED,
    ind_alerta_almacenamiento BOOLEAN GENERATED ALWAYS AS (
        porcentaje_uso_almacenamiento IS NOT NULL AND porcentaje_uso_almacenamiento >= 80
    ) STORED,
    usr_insert VARCHAR NOT NULL, -- Email o NIT del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_uso_recursos_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia),
    CONSTRAINT fk_uso_recursos_suscripcion FOREIGN KEY (id_suscripcion) REFERENCES tab_suscripciones(id_suscripcion)
);

-- Índices para tab_uso_recursos
CREATE INDEX idx_uso_recursos_instancia ON tab_uso_recursos(id_instancia);
CREATE INDEX idx_uso_recursos_suscripcion ON tab_uso_recursos(id_suscripcion);
CREATE INDEX idx_uso_recursos_fecha ON tab_uso_recursos(fecha_medicion);
CREATE INDEX idx_uso_recursos_alertas ON tab_uso_recursos(ind_alerta_productos, ind_alerta_usuarios, ind_alerta_almacenamiento)
    WHERE ind_alerta_productos = TRUE OR ind_alerta_usuarios = TRUE OR ind_alerta_almacenamiento = TRUE;

-- Índice para obtener la última medición por instancia (usar ORDER BY fecha_medicion DESC LIMIT 1)
CREATE INDEX idx_uso_recursos_instancia_fecha ON tab_uso_recursos(id_instancia, fecha_medicion DESC);

-- ============================================================
-- TABLA: tab_historial_planes
-- Descripción: Historial de cambios de plan en suscripciones
-- ============================================================

CREATE TABLE tab_historial_planes (
    id_historial DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_historial_planes'),
    id_suscripcion DECIMAL(10,0) NOT NULL,
    id_plan_anterior DECIMAL(10,0), -- NULL si es la primera suscripción
    id_plan_nuevo DECIMAL(10,0) NOT NULL,
    precio_anterior DECIMAL(10,2), -- Precio del plan anterior
    precio_nuevo DECIMAL(10,2) NOT NULL, -- Precio del plan nuevo
    tipo_cambio enum_tipo_cambio NOT NULL,
    fecha_cambio TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_efectiva TIMESTAMP WITHOUT TIME ZONE NOT NULL, -- Fecha desde cuando aplica el cambio
    motivo_cambio TEXT, -- Razón del cambio (opcional)
    -- Información del cambio
    diferencia_precio DECIMAL(10,2) GENERATED ALWAYS AS (
        precio_nuevo - COALESCE(precio_anterior, 0)
    ) STORED,
    porcentaje_cambio DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN precio_anterior IS NULL OR precio_anterior = 0 THEN NULL
            ELSE ((precio_nuevo - precio_anterior) / precio_anterior * 100)
        END
    ) STORED,
    -- Usuario que realizó el cambio
    usuario_email VARCHAR, -- Email o identificación fiscal del cliente que realizó el cambio (NULL si fue automático)
    usr_insert VARCHAR NOT NULL, -- Email o NIT del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_suscripcion FOREIGN KEY (id_suscripcion) REFERENCES tab_suscripciones(id_suscripcion),
    CONSTRAINT fk_historial_plan_anterior FOREIGN KEY (id_plan_anterior) REFERENCES tab_planes(id_plan) ON DELETE SET NULL,
    CONSTRAINT fk_historial_plan_nuevo FOREIGN KEY (id_plan_nuevo) REFERENCES tab_planes(id_plan),
    CONSTRAINT chk_fecha_efectiva_futura CHECK (fecha_efectiva >= fecha_cambio)
);

-- Índices para tab_historial_planes
CREATE INDEX idx_historial_planes_suscripcion ON tab_historial_planes(id_suscripcion);
CREATE INDEX idx_historial_planes_fecha_cambio ON tab_historial_planes(fecha_cambio);
CREATE INDEX idx_historial_planes_tipo_cambio ON tab_historial_planes(tipo_cambio);
CREATE INDEX idx_historial_planes_plan_anterior ON tab_historial_planes(id_plan_anterior);
CREATE INDEX idx_historial_planes_plan_nuevo ON tab_historial_planes(id_plan_nuevo);

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: Resumen de instancias con información de cliente y suscripción
CREATE OR REPLACE VIEW vw_resumen_instancias AS
SELECT 
    i.id_instancia,
    i.nom_instancia,
    i.slug_instancia,
    i.subdominio,
    i.dominio_personalizado,
    i.estado_instancia,
    i.version_instancia,
    i.fec_insert AS fecha_creacion,
    i.fecha_activacion,
    c.identificacion_fiscal,
    c.tipo_identificacion,
    c.nom_empresa,
    c.email_contacto,
    c.estado_cliente,
    s.id_suscripcion,
    s.estado_suscripcion,
    s.tipo_facturacion,
    p.id_plan,
    p.nom_plan,
    p.precio_mensual
FROM tab_instancias i
LEFT JOIN tab_clientes c ON i.identificacion_fiscal_cliente = c.identificacion_fiscal
LEFT JOIN tab_suscripciones s ON i.id_instancia = s.id_instancia
LEFT JOIN tab_planes p ON s.id_plan = p.id_plan;

-- Vista: Suscripciones activas con información completa
CREATE OR REPLACE VIEW vw_suscripciones_activas AS
SELECT 
    s.id_suscripcion,
    s.identificacion_fiscal_cliente,
    c.tipo_identificacion,
    c.nom_empresa,
    c.email_contacto,
    s.id_plan,
    p.nom_plan,
    p.precio_mensual,
    s.precio_actual,
    s.tipo_facturacion,
    s.fecha_inicio,
    s.fecha_fin,
    s.fecha_proximo_pago,
    s.estado_suscripcion,
    i.id_instancia,
    i.nom_instancia,
    i.estado_instancia
FROM tab_suscripciones s
JOIN tab_clientes c ON s.identificacion_fiscal_cliente = c.identificacion_fiscal
JOIN tab_planes p ON s.id_plan = p.id_plan
LEFT JOIN tab_instancias i ON s.id_instancia = i.id_instancia
WHERE s.estado_suscripcion = 'activa';

-- Vista: Métricas agregadas por instancia (últimas 24 horas)
CREATE OR REPLACE VIEW vw_metricas_agregadas AS
SELECT 
    id_instancia,
    tipo_metrica,
    AVG(valor_metrica) AS promedio,
    MIN(valor_metrica) AS minimo,
    MAX(valor_metrica) AS maximo,
    COUNT(*) AS cantidad_registros,
    MAX(fecha_metrica) AS ultima_actualizacion
FROM tab_metricas_instancias
WHERE fecha_metrica >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY id_instancia, tipo_metrica;

-- ============================================================
-- DATOS INICIALES (SEED DATA)
-- ============================================================

-- Insertar planes por defecto
INSERT INTO tab_planes (nom_plan, desc_plan, precio_mensual, precio_anual, max_productos, max_usuarios, max_almacenamiento_gb, features_json, usr_insert, fec_insert) VALUES
('Starter', 'Plan ideal para pequeñas empresas que están comenzando', 29.99, 299.90, 100, 3, 10, '{"analytics": false, "inventory": true, "marketing": false, "support": "email"}'::jsonb, 'system', CURRENT_TIMESTAMP),
('Business', 'Plan completo para empresas en crecimiento', 79.99, 799.90, 1000, 10, 50, '{"analytics": true, "inventory": true, "marketing": true, "support": "priority"}'::jsonb, 'system', CURRENT_TIMESTAMP),
('Enterprise', 'Solución empresarial con recursos ilimitados', 199.99, 1999.90, NULL, NULL, 200, '{"analytics": true, "inventory": true, "marketing": true, "support": "dedicated", "custom_integrations": true, "sla": "99.9%"}'::jsonb, 'system', CURRENT_TIMESTAMP);

-- ============================================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================================

-- tab_usuarios_synkro eliminada - el cliente gestiona su propia instancia
COMMENT ON TABLE tab_planes IS 'Planes de suscripción disponibles para clientes';
COMMENT ON TABLE tab_clientes IS 'Empresas/clientes que contratan el servicio SaaS';
COMMENT ON TABLE tab_instancias IS 'Instancias de e-commerce creadas para cada cliente';
COMMENT ON TABLE tab_suscripciones IS 'Suscripciones activas de clientes a planes';
COMMENT ON TABLE tab_facturacion IS 'Facturas y pagos de suscripciones';
COMMENT ON TABLE tab_deployments IS 'Historial de deployments de instancias';
COMMENT ON TABLE tab_dominios IS 'Dominios asociados a instancias';
COMMENT ON TABLE tab_metricas_instancias IS 'Métricas y monitoreo de instancias';
COMMENT ON TABLE tab_auditoria IS 'Logs de auditoría de acciones en el panel de control';
COMMENT ON TABLE tab_reg_del IS 'Registro de eliminaciones lógicas (soft deletes)';
COMMENT ON TABLE tab_uso_recursos IS 'Tracking de uso de recursos por instancia vs límites del plan';
COMMENT ON TABLE tab_historial_planes IS 'Historial de cambios de plan en suscripciones';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

