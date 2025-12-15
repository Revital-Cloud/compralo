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

-- Eliminar tablas en orden de dependencias
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
DROP SEQUENCE IF EXISTS seq_usuarios_synkro;
DROP SEQUENCE IF EXISTS seq_clientes;
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

CREATE SEQUENCE seq_usuarios_synkro START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_clientes START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_instancias START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_planes START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_suscripciones START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_facturacion START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_deployments START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_dominios START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_metricas START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_auditoria START WITH 1 INCREMENT BY 1;

-- ============================================================
-- TABLA: tab_usuarios_synkro
-- Descripción: Usuarios del panel de control de Synkro
-- ============================================================

CREATE TABLE tab_usuarios_synkro (
    id_usuario_synkro DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_usuarios_synkro'),
    nom_usuario VARCHAR NOT NULL,
    email_usuario VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    rol_usuario VARCHAR NOT NULL DEFAULT 'admin' CHECK (rol_usuario IN ('super_admin', 'admin', 'support', 'viewer')),
    status_usuario VARCHAR NOT NULL DEFAULT 'activo' CHECK (status_usuario IN ('activo', 'inactivo', 'suspendido')),
    last_login TIMESTAMP WITHOUT TIME ZONE,
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update DECIMAL(10),
    fec_update TIMESTAMP WITHOUT TIME ZONE
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_synkro_email ON tab_usuarios_synkro(email_usuario);
CREATE INDEX idx_usuarios_synkro_rol ON tab_usuarios_synkro(rol_usuario);
CREATE INDEX idx_usuarios_synkro_estado ON tab_usuarios_synkro(status_usuario);

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
    estado_plan VARCHAR NOT NULL DEFAULT 'activo' CHECK (estado_plan IN ('activo', 'inactivo', 'deprecado')),
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update DECIMAL(10),
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
    id_cliente DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_clientes'),
    nom_empresa VARCHAR NOT NULL,
    nit_empresa VARCHAR,
    email_contacto VARCHAR NOT NULL,
    telefono_contacto VARCHAR,
    direccion_empresa TEXT,
    ciudad VARCHAR,
    pais VARCHAR NOT NULL DEFAULT 'Colombia',
    nom_contacto_principal VARCHAR NOT NULL,
    email_contacto_principal VARCHAR NOT NULL,
    telefono_contacto_principal VARCHAR,
    estado_cliente VARCHAR NOT NULL DEFAULT 'prospecto' CHECK (estado_cliente IN ('prospecto', 'activo', 'suspendido', 'cancelado', 'trial')),
    fecha_activacion TIMESTAMP WITHOUT TIME ZONE,
    fecha_ultimo_acceso TIMESTAMP WITHOUT TIME ZONE,
    notas_internas TEXT,
    id_usuario_asignado DECIMAL(10,0), -- Usuario de Synkro asignado como account manager
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update DECIMAL(10),
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_cliente_usuario_asignado FOREIGN KEY (id_usuario_asignado) REFERENCES tab_usuarios_synkro(id_usuario_synkro)
);

-- Índices para clientes
CREATE INDEX idx_clientes_email ON tab_clientes(email_contacto);
CREATE INDEX idx_clientes_estado ON tab_clientes(estado_cliente);
CREATE INDEX idx_clientes_nit ON tab_clientes(nit_empresa);
CREATE INDEX idx_clientes_usuario_asignado ON tab_clientes(id_usuario_asignado);

-- ============================================================
-- TABLA: tab_instancias
-- Descripción: Instancias de e-commerce creadas para cada cliente
-- ============================================================

CREATE TABLE tab_instancias (
    id_instancia DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_instancias'),
    id_cliente DECIMAL(10,0) NOT NULL,
    nom_instancia VARCHAR NOT NULL,
    slug_instancia VARCHAR NOT NULL UNIQUE, -- Identificador único para URLs
    subdominio VARCHAR UNIQUE, -- Ej: empresa-abc.synkro.com
    dominio_personalizado VARCHAR, -- Ej: tienda.empresa-abc.com
    estado_instancia VARCHAR NOT NULL DEFAULT 'creando' CHECK (estado_instancia IN ('creando', 'activa', 'suspendida', 'eliminada', 'error')),
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
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update DECIMAL(10),
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_instancia_cliente FOREIGN KEY (id_cliente) REFERENCES tab_clientes(id_cliente),
    CONSTRAINT fk_instancia_creador FOREIGN KEY (usr_insert) REFERENCES tab_usuarios_synkro(id_usuario_synkro)
);

-- Índices para instancias
CREATE INDEX idx_instancias_cliente ON tab_instancias(id_cliente);
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
    id_cliente DECIMAL(10,0) NOT NULL,
    id_plan DECIMAL(10,0) NOT NULL,
    id_instancia DECIMAL(10,0), -- Instancia asociada (puede ser NULL si aún no se crea)
    tipo_facturacion VARCHAR NOT NULL DEFAULT 'mensual' CHECK (tipo_facturacion IN ('mensual', 'anual', 'trimestral')),
    precio_actual DECIMAL(10,2) NOT NULL, -- Precio al momento de la suscripción
    fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITHOUT TIME ZONE, -- NULL para suscripciones activas indefinidas
    fecha_proximo_pago TIMESTAMP WITHOUT TIME ZONE,
    estado_suscripcion VARCHAR NOT NULL DEFAULT 'activa' CHECK (estado_suscripcion IN ('activa', 'cancelada', 'suspendida', 'expirada', 'trial')),
    metodo_pago VARCHAR, -- 'tarjeta', 'transferencia', 'paypal', etc.
    fecha_cancelacion TIMESTAMP WITHOUT TIME ZONE,
    motivo_cancelacion TEXT,
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update DECIMAL(10),
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_suscripcion_cliente FOREIGN KEY (id_cliente) REFERENCES tab_clientes(id_cliente),
    CONSTRAINT fk_suscripcion_plan FOREIGN KEY (id_plan) REFERENCES tab_planes(id_plan),
    CONSTRAINT fk_suscripcion_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia) ON DELETE SET NULL
);

-- Índices para suscripciones
CREATE INDEX idx_suscripciones_cliente ON tab_suscripciones(id_cliente);
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
    id_cliente DECIMAL(10,0) NOT NULL,
    num_factura VARCHAR NOT NULL UNIQUE,
    concepto_factura VARCHAR NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    moneda VARCHAR NOT NULL DEFAULT 'USD',
    estado_pago VARCHAR NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'fallido', 'reembolsado', 'cancelado')),
    metodo_pago VARCHAR,
    fecha_emision TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP WITHOUT TIME ZONE,
    fecha_pago TIMESTAMP WITHOUT TIME ZONE,
    referencia_pago VARCHAR, -- Referencia de pago externa (Wompi, Stripe, etc.)
    notas TEXT,
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update DECIMAL(10),
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_factura_suscripcion FOREIGN KEY (id_suscripcion) REFERENCES tab_suscripciones(id_suscripcion),
    CONSTRAINT fk_factura_cliente FOREIGN KEY (id_cliente) REFERENCES tab_clientes(id_cliente)
);

-- Índices para facturación
CREATE INDEX idx_facturacion_suscripcion ON tab_facturacion(id_suscripcion);
CREATE INDEX idx_facturacion_cliente ON tab_facturacion(id_cliente);
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
    tipo_deploy VARCHAR NOT NULL DEFAULT 'manual' CHECK (tipo_deploy IN ('manual', 'automatico', 'rollback', 'hotfix')),
    estado_deploy VARCHAR NOT NULL DEFAULT 'iniciado' CHECK (estado_deploy IN ('iniciado', 'en_proceso', 'completado', 'fallido', 'cancelado')),
    ambiente VARCHAR NOT NULL DEFAULT 'produccion' CHECK (ambiente IN ('desarrollo', 'staging', 'produccion')),
    logs_deploy TEXT,
    fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITHOUT TIME ZONE,
    duracion_segundos INTEGER,
    iniciado_por DECIMAL(10,0),
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update DECIMAL(10),
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_deployment_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia),
    CONSTRAINT fk_deployment_usuario FOREIGN KEY (iniciado_por) REFERENCES tab_usuarios_synkro(id_usuario_synkro)
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
    tipo_dominio VARCHAR NOT NULL DEFAULT 'subdominio' CHECK (tipo_dominio IN ('subdominio', 'personalizado', 'wildcard')),
    estado_dominio VARCHAR NOT NULL DEFAULT 'pendiente' CHECK (estado_dominio IN ('pendiente', 'activo', 'error', 'desactivado')),
    ssl_habilitado BOOLEAN DEFAULT FALSE,
    fecha_ssl_emision TIMESTAMP WITHOUT TIME ZONE,
    fecha_ssl_vencimiento TIMESTAMP WITHOUT TIME ZONE,
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update DECIMAL(10),
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
    id_usuario_synkro DECIMAL(10,0),
    id_cliente DECIMAL(10,0),
    id_instancia DECIMAL(10,0),
    tipo_accion VARCHAR NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', 'deploy', 'suspend', etc.
    entidad_afectada VARCHAR NOT NULL, -- 'cliente', 'instancia', 'suscripcion', 'factura', etc.
    descripcion_accion TEXT,
    datos_anteriores JSONB, -- Estado anterior (para updates)
    datos_nuevos JSONB, -- Estado nuevo (para creates/updates)
    ip_origen VARCHAR,
    user_agent TEXT,
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario_synkro) REFERENCES tab_usuarios_synkro(id_usuario_synkro) ON DELETE SET NULL,
    CONSTRAINT fk_auditoria_cliente FOREIGN KEY (id_cliente) REFERENCES tab_clientes(id_cliente) ON DELETE SET NULL,
    CONSTRAINT fk_auditoria_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia) ON DELETE SET NULL
);

-- Índices para auditoría
CREATE INDEX idx_auditoria_usuario ON tab_auditoria(id_usuario_synkro);
CREATE INDEX idx_auditoria_cliente ON tab_auditoria(id_cliente);
CREATE INDEX idx_auditoria_instancia ON tab_auditoria(id_instancia);
CREATE INDEX idx_auditoria_tipo_accion ON tab_auditoria(tipo_accion);
CREATE INDEX idx_auditoria_fecha ON tab_auditoria(fec_insert);
CREATE INDEX idx_auditoria_entidad ON tab_auditoria(entidad_afectada);


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
    c.id_cliente,
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
LEFT JOIN tab_clientes c ON i.id_cliente = c.id_cliente
LEFT JOIN tab_suscripciones s ON i.id_instancia = s.id_instancia
LEFT JOIN tab_planes p ON s.id_plan = p.id_plan;

-- Vista: Suscripciones activas con información completa
CREATE OR REPLACE VIEW vw_suscripciones_activas AS
SELECT 
    s.id_suscripcion,
    s.id_cliente,
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
JOIN tab_clientes c ON s.id_cliente = c.id_cliente
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
('Starter', 'Plan ideal para pequeñas empresas que están comenzando', 29.99, 299.90, 100, 3, 10, '{"analytics": false, "inventory": true, "marketing": false, "support": "email"}'::jsonb, 1, CURRENT_TIMESTAMP),
('Business', 'Plan completo para empresas en crecimiento', 79.99, 799.90, 1000, 10, 50, '{"analytics": true, "inventory": true, "marketing": true, "support": "priority"}'::jsonb, 1, CURRENT_TIMESTAMP),
('Enterprise', 'Solución empresarial con recursos ilimitados', 199.99, 1999.90, NULL, NULL, 200, '{"analytics": true, "inventory": true, "marketing": true, "support": "dedicated", "custom_integrations": true, "sla": "99.9%"}'::jsonb, 1, CURRENT_TIMESTAMP);

-- Insertar usuario super admin por defecto (password debe ser hasheado en la aplicación)
-- Password: 'admin123' (debe ser hasheado con Argon2 antes de insertar)
INSERT INTO tab_usuarios_synkro (id_usuario_synkro, nom_usuario, email_usuario, password_hash, rol_usuario, status_usuario, usr_insert, fec_insert) VALUES
(1, 'Super Admin', 'admin@synkro.com', '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_HASH', 'super_admin', 'activo', 1, CURRENT_TIMESTAMP);

-- ============================================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================================

COMMENT ON TABLE tab_usuarios_synkro IS 'Usuarios del panel de control de Synkro (administradores, soporte, etc.)';
COMMENT ON TABLE tab_planes IS 'Planes de suscripción disponibles para clientes';
COMMENT ON TABLE tab_clientes IS 'Empresas/clientes que contratan el servicio SaaS';
COMMENT ON TABLE tab_instancias IS 'Instancias de e-commerce creadas para cada cliente';
COMMENT ON TABLE tab_suscripciones IS 'Suscripciones activas de clientes a planes';
COMMENT ON TABLE tab_facturacion IS 'Facturas y pagos de suscripciones';
COMMENT ON TABLE tab_deployments IS 'Historial de deployments de instancias';
COMMENT ON TABLE tab_dominios IS 'Dominios asociados a instancias';
COMMENT ON TABLE tab_metricas_instancias IS 'Métricas y monitoreo de instancias';
COMMENT ON TABLE tab_auditoria IS 'Logs de auditoría de acciones en el panel de control';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

