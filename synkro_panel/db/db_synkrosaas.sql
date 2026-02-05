-- *********************************************************
-- * BASE DE DATOS SYNKRO SAAS - PANEL DE CONTROL         *
-- * Gestión de Instancias de E-Commerce                  *
-- * CREADO POR: Synkro Team                              *
-- * Fecha: Diciembre 2025                                *
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
DROP TYPE IF EXISTS enum_pais;
DROP TYPE IF EXISTS enum_moneda;
DROP TYPE IF EXISTS enum_metodo_pago;
DROP TYPE IF EXISTS enum_region_deployment;
DROP TYPE IF EXISTS enum_tipo_metrica;
DROP TYPE IF EXISTS enum_unidad_medida;
DROP TYPE IF EXISTS enum_rol_synkro;

-- Eliminar tablas en orden de dependencias
DROP TABLE IF EXISTS tab_historial_planes;
DROP TABLE IF EXISTS tab_uso_recursos;
DROP TABLE IF EXISTS tab_reg_del;
DROP TABLE IF EXISTS tab_auditoria;
DROP TABLE IF EXISTS tab_metricas_instancias;
DROP TABLE IF EXISTS tab_facturacion_detalle;
DROP TABLE IF EXISTS tab_facturacion_cabecera;
DROP TABLE IF EXISTS tab_suscripciones;
DROP TABLE IF EXISTS tab_dominios;
DROP TABLE IF EXISTS tab_deployments;
DROP TABLE IF EXISTS tab_instancias;
DROP TABLE IF EXISTS tab_clientes;
DROP TABLE IF EXISTS tab_planes;
DROP TABLE IF EXISTS tab_usuarios_synkro;

-- Eliminar secuencias
-- seq_clientes eliminada - se usa identificacion_fiscal como ID
DROP SEQUENCE IF EXISTS seq_usuarios_synkro;
DROP SEQUENCE IF EXISTS seq_instancias;
DROP SEQUENCE IF EXISTS seq_planes;
DROP SEQUENCE IF EXISTS seq_suscripciones;
DROP SEQUENCE IF EXISTS seq_facturacion;
DROP SEQUENCE IF EXISTS seq_facturacion_detalle;
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
CREATE SEQUENCE seq_facturacion_detalle START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_deployments START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_dominios START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_metricas START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_auditoria START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_reg_del START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_uso_recursos START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_historial_planes START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_usuarios_synkro START WITH 1 INCREMENT BY 1;

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
CREATE TYPE enum_pais AS ENUM ('CO', 'US', 'MX', 'AR', 'CL', 'PE', 'EC', 'PA', 'UY', 'BR', 'ES', 'OTRO');
CREATE TYPE enum_moneda AS ENUM ('USD', 'COP', 'EUR', 'MXN', 'BRL', 'ARS', 'CLP', 'PEN', 'UYU', 'DOP', 'CRC', 'GTQ', 'PAB', 'VES', 'GBP', 'CAD', 'OTRA');
CREATE TYPE enum_metodo_pago AS ENUM ('tarjeta', 'transferencia', 'paypal', 'stripe', 'wompi', 'pse', 'efectivo', 'crypto', 'otro');
CREATE TYPE enum_region_deployment AS ENUM ('us-east-1', 'us-west-2', 'sa-east-1', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1', 'custom');
CREATE TYPE enum_tipo_metrica AS ENUM ('uptime', 'response_time', 'cpu', 'memory', 'storage', 'traffic', 'orders', 'revenue', 'errors', 'latency', 'requests');
CREATE TYPE enum_unidad_medida AS ENUM ('ms', 'percent', 'gb', 'mb', 'count', 'usd', 'req_per_sec', 's', 'other');
CREATE TYPE enum_rol_synkro AS ENUM ('admin_synkro', 'soporte', 'ventas');

-- ============================================================
-- TABLA: tab_usuarios_synkro
-- Descripción: Usuarios administradores de la plataforma Synkro (super admins, soporte, ventas, etc.)
-- ============================================================

CREATE TABLE tab_usuarios_synkro (
    id_usuario DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_usuarios_synkro'),
    nom_usuario VARCHAR NOT NULL,
    ape_usuario VARCHAR NOT NULL,
    email_usuario VARCHAR NOT NULL UNIQUE,
    password_usuario VARCHAR NOT NULL, -- Hash de la contraseña (usar Argon2 como en ecommerce)
    rol_synkro enum_rol_synkro NOT NULL, -- Rol del usuario (admin_synkro, soporte, ventas)
    ind_activo BOOLEAN DEFAULT true, -- Si el usuario puede acceder al panel
    fecha_ultimo_acceso TIMESTAMP WITHOUT TIME ZONE,
    usr_insert VARCHAR NOT NULL, -- Email del admin que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email del admin que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE
);

-- Índices para usuarios_synkro
CREATE INDEX idx_usuarios_synkro_email ON tab_usuarios_synkro(email_usuario);
CREATE INDEX idx_usuarios_synkro_rol ON tab_usuarios_synkro(rol_synkro);
CREATE INDEX idx_usuarios_synkro_activo ON tab_usuarios_synkro(ind_activo);

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
    moneda enum_moneda NOT NULL DEFAULT 'USD',
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
    pais enum_pais NOT NULL DEFAULT 'CO',
    nom_contacto_principal VARCHAR NOT NULL,
    email_contacto_principal VARCHAR NOT NULL,
    telefono_contacto_principal VARCHAR,
    estado_cliente enum_estado_cliente NOT NULL DEFAULT 'prospecto',
    fecha_activacion TIMESTAMP WITHOUT TIME ZONE,
    fecha_ultimo_acceso TIMESTAMP WITHOUT TIME ZONE,
    notas_internas TEXT,
    -- Campos de autenticación y acceso
    password_cliente VARCHAR, -- Hash de la contraseña (usar Argon2 como en ecommerce)
    ind_activo BOOLEAN DEFAULT true, -- Si el cliente puede acceder al panel
    -- NOTA: Todos los registros en tab_clientes son implícitamente "Cliente"
    -- Los Admin Synkro están en tab_usuarios_synkro
    -- Campos de auditoría
    usr_insert VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email o identificación fiscal del cliente que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE
);

-- Índices para clientes
CREATE INDEX idx_clientes_email ON tab_clientes(email_contacto);
CREATE INDEX idx_clientes_email_principal ON tab_clientes(email_contacto_principal); -- Para login
CREATE INDEX idx_clientes_estado ON tab_clientes(estado_cliente);
CREATE INDEX idx_clientes_activo ON tab_clientes(ind_activo); -- Para filtrar clientes activos
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
    region_deployment enum_region_deployment DEFAULT 'us-east-1', -- Región de AWS/GCP/etc
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
-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_instancias_cliente_estado ON tab_instancias(identificacion_fiscal_cliente, estado_instancia)
    WHERE estado_instancia = 'activa';
CREATE INDEX idx_instancias_estado_fecha_activacion ON tab_instancias(estado_instancia, fecha_activacion)
    WHERE fecha_activacion IS NOT NULL;

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
    metodo_pago enum_metodo_pago, -- 'tarjeta', 'transferencia', 'paypal', etc.
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
-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_suscripciones_cliente_estado ON tab_suscripciones(identificacion_fiscal_cliente, estado_suscripcion)
    WHERE estado_suscripcion = 'activa';
CREATE INDEX idx_suscripciones_instancia_estado ON tab_suscripciones(id_instancia, estado_suscripcion)
    WHERE id_instancia IS NOT NULL AND estado_suscripcion = 'activa';
CREATE INDEX idx_suscripciones_fecha_proximo_pago_estado ON tab_suscripciones(fecha_proximo_pago, estado_suscripcion)
    WHERE estado_suscripcion = 'activa' AND fecha_proximo_pago IS NOT NULL;

-- ============================================================
-- TABLA: tab_facturacion_cabecera
-- Descripción: Cabecera de facturas de suscripciones
-- ============================================================

CREATE TABLE tab_facturacion_cabecera (
    id_factura DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_facturacion'),
    id_suscripcion DECIMAL(10,0) NOT NULL,
    identificacion_fiscal_cliente VARCHAR NOT NULL,
    num_factura VARCHAR NOT NULL UNIQUE,
    -- Totales (calculados desde el detalle)
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    moneda enum_moneda NOT NULL DEFAULT 'USD',
    -- Estado y pago
    estado_pago enum_estado_pago NOT NULL DEFAULT 'pendiente',
    metodo_pago enum_metodo_pago,
    fecha_emision TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP WITHOUT TIME ZONE,
    fecha_pago TIMESTAMP WITHOUT TIME ZONE,
    referencia_pago VARCHAR, -- Referencia de pago externa (Wompi, Stripe, etc.)
    -- Información adicional
    periodo_facturado_desde TIMESTAMP WITHOUT TIME ZONE, -- Inicio del período facturado
    periodo_facturado_hasta TIMESTAMP WITHOUT TIME ZONE, -- Fin del período facturado
    notas TEXT,
    -- Campos de auditoría
    usr_insert VARCHAR NOT NULL, -- Email o identificación fiscal del cliente que creó el registro
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR, -- Email o identificación fiscal del cliente que actualizó el registro
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_factura_cabecera_suscripcion FOREIGN KEY (id_suscripcion) REFERENCES tab_suscripciones(id_suscripcion),
    CONSTRAINT fk_factura_cabecera_cliente FOREIGN KEY (identificacion_fiscal_cliente) REFERENCES tab_clientes(identificacion_fiscal)
);

-- Índices para facturación cabecera
CREATE INDEX idx_facturacion_cabecera_suscripcion ON tab_facturacion_cabecera(id_suscripcion);
CREATE INDEX idx_facturacion_cabecera_cliente ON tab_facturacion_cabecera(identificacion_fiscal_cliente);
CREATE INDEX idx_facturacion_cabecera_estado ON tab_facturacion_cabecera(estado_pago);
CREATE INDEX idx_facturacion_cabecera_num_factura ON tab_facturacion_cabecera(num_factura);
CREATE INDEX idx_facturacion_cabecera_fecha_emision ON tab_facturacion_cabecera(fecha_emision);
CREATE INDEX idx_facturacion_cabecera_fecha_vencimiento ON tab_facturacion_cabecera(fecha_vencimiento);
CREATE INDEX idx_facturacion_cabecera_periodo ON tab_facturacion_cabecera(periodo_facturado_desde, periodo_facturado_hasta);
-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_facturacion_cabecera_cliente_estado ON tab_facturacion_cabecera(identificacion_fiscal_cliente, estado_pago)
    WHERE estado_pago = 'pendiente';
CREATE INDEX idx_facturacion_cabecera_suscripcion_estado ON tab_facturacion_cabecera(id_suscripcion, estado_pago);
CREATE INDEX idx_facturacion_cabecera_fecha_vencimiento_estado ON tab_facturacion_cabecera(fecha_vencimiento, estado_pago)
    WHERE fecha_vencimiento IS NOT NULL AND estado_pago = 'pendiente';

-- ============================================================
-- TABLA: tab_facturacion_detalle
-- Descripción: Detalle de líneas de factura (conceptos, servicios, etc.)
-- ============================================================

CREATE TABLE tab_facturacion_detalle (
    id_detalle DECIMAL(10,0) PRIMARY KEY DEFAULT nextval('seq_facturacion_detalle'),
    id_factura DECIMAL(10,0) NOT NULL,
    num_linea INTEGER NOT NULL, -- Número de línea en la factura (1, 2, 3, ...)
    concepto VARCHAR NOT NULL, -- Descripción del concepto (ej: "Suscripción Plan Business - Enero 2025")
    cantidad DECIMAL(10,2) DEFAULT 1, -- Cantidad (puede ser 1 para suscripciones, o más para otros conceptos)
    precio_unitario DECIMAL(10,2) NOT NULL, -- Precio por unidad
    descuento_linea DECIMAL(10,2) DEFAULT 0, -- Descuento aplicado a esta línea
    subtotal_linea DECIMAL(10,2) NOT NULL, -- (cantidad * precio_unitario) - descuento_linea
    impuesto_linea DECIMAL(10,2) DEFAULT 0, -- Impuestos de esta línea
    total_linea DECIMAL(10,2) NOT NULL, -- subtotal_linea + impuesto_linea
    -- Información adicional
    id_plan DECIMAL(10,0), -- Plan asociado (si aplica)
    id_instancia DECIMAL(10,0), -- Instancia asociada (si aplica)
    metadata_json JSONB, -- Información adicional en formato JSON
    -- Campos de auditoría
    usr_insert VARCHAR NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update VARCHAR,
    fec_update TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_factura_detalle_cabecera FOREIGN KEY (id_factura) REFERENCES tab_facturacion_cabecera(id_factura) ON DELETE CASCADE,
    CONSTRAINT fk_factura_detalle_plan FOREIGN KEY (id_plan) REFERENCES tab_planes(id_plan) ON DELETE SET NULL,
    CONSTRAINT fk_factura_detalle_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia) ON DELETE SET NULL,
    CONSTRAINT chk_num_linea_positivo CHECK (num_linea > 0),
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT chk_precio_unitario_positivo CHECK (precio_unitario > 0),
    CONSTRAINT chk_subtotal_linea_positivo CHECK (subtotal_linea >= 0),
    CONSTRAINT chk_total_linea_positivo CHECK (total_linea >= 0),
    CONSTRAINT uq_factura_num_linea UNIQUE (id_factura, num_linea) -- Una factura no puede tener líneas duplicadas
);

-- Índices para facturación detalle
CREATE INDEX idx_facturacion_detalle_factura ON tab_facturacion_detalle(id_factura);
CREATE INDEX idx_facturacion_detalle_plan ON tab_facturacion_detalle(id_plan);
CREATE INDEX idx_facturacion_detalle_instancia ON tab_facturacion_detalle(id_instancia);
CREATE INDEX idx_facturacion_detalle_metadata_gin ON tab_facturacion_detalle USING GIN (metadata_json);

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
-- Descripción: Métricas y monitoreo de instancias (PARTICIONADA POR MES)
-- ============================================================

-- Tabla padre particionada por rango de fecha (mensual)
CREATE TABLE tab_metricas_instancias (
    id_metrica DECIMAL(10,0) DEFAULT nextval('seq_metricas'),
    id_instancia DECIMAL(10,0) NOT NULL,
    fecha_metrica TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_metrica enum_tipo_metrica NOT NULL, -- Catálogo controlado de métricas
    valor_metrica DECIMAL(15,4) NOT NULL,
    unidad_medida enum_unidad_medida, -- Unidades controladas
    metadata_json JSONB, -- Información adicional de la métrica
    CONSTRAINT pk_metricas PRIMARY KEY (id_metrica, fecha_metrica),
    CONSTRAINT fk_metrica_instancia FOREIGN KEY (id_instancia) REFERENCES tab_instancias(id_instancia)
) PARTITION BY RANGE (fecha_metrica);

-- Índices en la tabla padre (se heredan a las particiones)
CREATE INDEX idx_metricas_instancia ON tab_metricas_instancias(id_instancia);
CREATE INDEX idx_metricas_tipo ON tab_metricas_instancias(tipo_metrica);
CREATE INDEX idx_metricas_fecha ON tab_metricas_instancias(fecha_metrica);
CREATE INDEX idx_metricas_instancia_fecha ON tab_metricas_instancias(id_instancia, fecha_metrica DESC);
CREATE INDEX idx_metricas_instancia_tipo_fecha ON tab_metricas_instancias(id_instancia, tipo_metrica, fecha_metrica DESC);
CREATE INDEX idx_metricas_metadata_gin ON tab_metricas_instancias USING GIN (metadata_json);

-- Crear particiones para los próximos 12 meses (desde enero 2026)
CREATE TABLE tab_metricas_instancias_2026_01 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE tab_metricas_instancias_2026_02 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE tab_metricas_instancias_2026_03 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE tab_metricas_instancias_2026_04 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE tab_metricas_instancias_2026_05 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE tab_metricas_instancias_2026_06 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE tab_metricas_instancias_2026_07 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE tab_metricas_instancias_2026_08 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE tab_metricas_instancias_2026_09 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE tab_metricas_instancias_2026_10 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE tab_metricas_instancias_2026_11 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE tab_metricas_instancias_2026_12 PARTITION OF tab_metricas_instancias
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Función para crear particiones automáticamente (ejecutar mensualmente)
-- NOTA: Esta función debe ejecutarse mediante un job programado (cron, pg_cron, etc.)
-- Ejemplo de configuración con pg_cron:
--   SELECT cron.schedule('crear-particion-metricas', '0 0 1 * *', 'SELECT fn_crear_particion_metricas_mes_siguiente();');
CREATE OR REPLACE FUNCTION fn_crear_particion_metricas_mes_siguiente()
RETURNS void AS $$
DECLARE
    fecha_inicio DATE;
    fecha_fin DATE;
    nombre_particion TEXT;
BEGIN
    -- Calcular el primer día del mes siguiente
    fecha_inicio := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    fecha_fin := fecha_inicio + INTERVAL '1 month';
    
    -- Generar nombre de partición (formato: tab_metricas_instancias_YYYY_MM)
    nombre_particion := 'tab_metricas_instancias_' || TO_CHAR(fecha_inicio, 'YYYY_MM');
    
    -- Crear partición si no existe
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF tab_metricas_instancias FOR VALUES FROM (%L) TO (%L)',
        nombre_particion,
        fecha_inicio,
        fecha_fin
    );
    
    RAISE NOTICE 'Partición creada: % desde % hasta %', nombre_particion, fecha_inicio, fecha_fin;
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar particiones antiguas (mantener solo últimos N meses)
-- NOTA: Ejecutar con cuidado, asegurarse de tener backups antes de eliminar datos
-- Ejemplo: SELECT fn_eliminar_particiones_metricas_antiguas(12); -- Mantener últimos 12 meses
CREATE OR REPLACE FUNCTION fn_eliminar_particiones_metricas_antiguas(meses_a_mantener INTEGER DEFAULT 12)
RETURNS TABLE(particion_eliminada TEXT, fecha_inicio DATE, fecha_fin DATE) AS $$
DECLARE
    fecha_limite DATE;
    particion RECORD;
    fecha_particion DATE;
    fecha_particion_str TEXT;
BEGIN
    -- Calcular fecha límite (mantener desde esta fecha hacia adelante)
    fecha_limite := DATE_TRUNC('month', CURRENT_DATE - (meses_a_mantener || ' months')::INTERVAL);
    
    -- Buscar particiones anteriores a la fecha límite
    FOR particion IN
        SELECT 
            schemaname,
            tablename
        FROM pg_tables
        WHERE schemaname = current_schema()
        AND tablename LIKE 'tab_metricas_instancias_%'
        AND tablename ~ '^tab_metricas_instancias_\d{4}_\d{2}$'
    LOOP
        -- Extraer año y mes de la partición (formato: tab_metricas_instancias_YYYY_MM)
        fecha_particion_str := (regexp_match(particion.tablename, '(\d{4}_\d{2})$'))[1];
        
        IF fecha_particion_str IS NOT NULL THEN
            fecha_particion := TO_DATE(
                REPLACE(fecha_particion_str, '_', '-') || '-01',
                'YYYY-MM-DD'
            );
            
            -- Si la partición es anterior a la fecha límite, eliminarla
            IF fecha_particion < fecha_limite THEN
                EXECUTE format('DROP TABLE IF EXISTS %I.%I', particion.schemaname, particion.tablename);
                
                particion_eliminada := particion.tablename;
                fecha_inicio := fecha_particion;
                fecha_fin := fecha_particion + INTERVAL '1 month';
                
                RETURN NEXT;
            END IF;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

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
-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_auditoria_cliente_fecha ON tab_auditoria(identificacion_fiscal_cliente, fec_insert DESC)
    WHERE identificacion_fiscal_cliente IS NOT NULL;
CREATE INDEX idx_auditoria_instancia_fecha ON tab_auditoria(id_instancia, fec_insert DESC)
    WHERE id_instancia IS NOT NULL;
CREATE INDEX idx_auditoria_entidad_tipo_fecha ON tab_auditoria(entidad_afectada, tipo_accion, fec_insert DESC);

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
    -- Alertas (calculadas directamente desde columnas base, no desde columnas generadas)
    ind_alerta_productos BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN max_productos IS NULL OR max_productos = 0 THEN FALSE
            ELSE (productos_actuales::DECIMAL / max_productos::DECIMAL * 100) >= 80
        END
    ) STORED,
    ind_alerta_usuarios BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN max_usuarios IS NULL OR max_usuarios = 0 THEN FALSE
            ELSE (usuarios_actuales::DECIMAL / max_usuarios::DECIMAL * 100) >= 80
        END
    ) STORED,
    ind_alerta_almacenamiento BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN max_almacenamiento_gb IS NULL OR max_almacenamiento_gb = 0 THEN FALSE
            ELSE (almacenamiento_actual_gb / max_almacenamiento_gb::DECIMAL * 100) >= 80
        END
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
-- CONSTRAINTS ADICIONALES PARA CONSISTENCIA
-- ============================================================

-- Constraint: Instancias activas deben tener suscripción activa
-- NOTA: Este constraint usa una función para verificar la existencia de suscripción activa
CREATE OR REPLACE FUNCTION fn_verificar_suscripcion_activa()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_instancia = 'activa' THEN
        IF NOT EXISTS (
            SELECT 1 FROM tab_suscripciones s
            WHERE s.id_instancia = NEW.id_instancia
            AND s.estado_suscripcion = 'activa'
        ) THEN
            RAISE EXCEPTION 'Una instancia activa debe tener una suscripción activa asociada';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_suscripcion_activa
    AFTER INSERT OR UPDATE OF estado_instancia ON tab_instancias
    FOR EACH ROW
    WHEN (NEW.estado_instancia = 'activa')
    EXECUTE FUNCTION fn_verificar_suscripcion_activa();

-- Constraint: Validar formato de email
CREATE OR REPLACE FUNCTION fn_validar_email(email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE tab_clientes
ADD CONSTRAINT chk_email_contacto_valido 
CHECK (fn_validar_email(email_contacto));

ALTER TABLE tab_clientes
ADD CONSTRAINT chk_email_contacto_principal_valido 
CHECK (fn_validar_email(email_contacto_principal));

-- Constraint: Validar email de usuarios_synkro
ALTER TABLE tab_usuarios_synkro
ADD CONSTRAINT chk_email_usuario_valido 
CHECK (fn_validar_email(email_usuario));

-- Constraint: Fechas lógicas en suscripciones
ALTER TABLE tab_suscripciones
ADD CONSTRAINT chk_fecha_fin_mayor_inicio 
CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio);

ALTER TABLE tab_suscripciones
ADD CONSTRAINT chk_fecha_proximo_pago_futura 
CHECK (fecha_proximo_pago IS NULL OR fecha_proximo_pago >= fecha_inicio);

-- Constraint: Fechas lógicas en facturación cabecera
ALTER TABLE tab_facturacion_cabecera
ADD CONSTRAINT chk_fecha_vencimiento_mayor_emision 
CHECK (fecha_vencimiento IS NULL OR fecha_vencimiento >= fecha_emision);

ALTER TABLE tab_facturacion_cabecera
ADD CONSTRAINT chk_fecha_pago_mayor_emision 
CHECK (fecha_pago IS NULL OR fecha_pago >= fecha_emision);

ALTER TABLE tab_facturacion_cabecera
ADD CONSTRAINT chk_total_positivo 
CHECK (total >= 0);

ALTER TABLE tab_facturacion_cabecera
ADD CONSTRAINT chk_subtotal_positivo 
CHECK (subtotal >= 0);

ALTER TABLE tab_facturacion_cabecera
ADD CONSTRAINT chk_periodo_facturado_valido 
CHECK (periodo_facturado_hasta IS NULL OR periodo_facturado_desde IS NULL OR periodo_facturado_hasta >= periodo_facturado_desde);

-- Constraint: Valores monetarios positivos en planes
ALTER TABLE tab_planes
ADD CONSTRAINT chk_precio_mensual_positivo 
CHECK (precio_mensual > 0);

ALTER TABLE tab_planes
ADD CONSTRAINT chk_precio_anual_positivo 
CHECK (precio_anual IS NULL OR precio_anual > 0);

-- Constraint: Slug de instancia debe ser URL-safe (solo letras, números, guiones)
ALTER TABLE tab_instancias
ADD CONSTRAINT chk_slug_valido 
CHECK (slug_instancia ~ '^[a-z0-9-]+$');

-- Constraint: Versión de instancia debe seguir formato semántico (X.Y.Z)
ALTER TABLE tab_instancias
ADD CONSTRAINT chk_version_valida 
CHECK (version_instancia ~ '^\d+\.\d+\.\d+');

-- Constraint: Fechas lógicas en deployments
ALTER TABLE tab_deployments
ADD CONSTRAINT chk_fecha_fin_mayor_inicio 
CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

ALTER TABLE tab_deployments
ADD CONSTRAINT chk_duracion_positiva 
CHECK (duracion_segundos IS NULL OR duracion_segundos >= 0);

-- Constraint: Fechas SSL lógicas en dominios
ALTER TABLE tab_dominios
ADD CONSTRAINT chk_fecha_ssl_vencimiento_mayor_emision 
CHECK (fecha_ssl_vencimiento IS NULL OR fecha_ssl_emision IS NULL OR fecha_ssl_vencimiento >= fecha_ssl_emision);

-- Constraint: Valores de métricas positivos
ALTER TABLE tab_metricas_instancias
ADD CONSTRAINT chk_valor_metrica_positivo 
CHECK (valor_metrica >= 0);

-- Constraint: Fechas lógicas en historial de planes
ALTER TABLE tab_historial_planes
ADD CONSTRAINT chk_precio_nuevo_positivo 
CHECK (precio_nuevo > 0);

ALTER TABLE tab_historial_planes
ADD CONSTRAINT chk_precio_anterior_positivo 
CHECK (precio_anterior IS NULL OR precio_anterior > 0);

-- Constraint: Validar que fecha_activacion se establezca cuando estado_cliente cambia a 'activo'
CREATE OR REPLACE FUNCTION fn_validar_fecha_activacion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_cliente = 'activo' AND NEW.fecha_activacion IS NULL THEN
        NEW.fecha_activacion := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_fecha_activacion_cliente
    BEFORE INSERT OR UPDATE OF estado_cliente ON tab_clientes
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_fecha_activacion();

CREATE TRIGGER trg_validar_fecha_activacion_instancia
    BEFORE INSERT OR UPDATE OF estado_instancia ON tab_instancias
    FOR EACH ROW
    WHEN (NEW.estado_instancia = 'activa')
    EXECUTE FUNCTION fn_validar_fecha_activacion();

-- Constraint: Validar transiciones de estado de cliente
CREATE OR REPLACE FUNCTION fn_validar_transicion_estado_cliente()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar transiciones permitidas
    IF OLD.estado_cliente IS NOT NULL THEN
        CASE OLD.estado_cliente
            WHEN 'prospecto' THEN
                IF NEW.estado_cliente NOT IN ('trial', 'activo', 'cancelado') THEN
                    RAISE EXCEPTION 'Transición inválida desde prospecto a %', NEW.estado_cliente;
                END IF;
            WHEN 'trial' THEN
                IF NEW.estado_cliente NOT IN ('activo', 'cancelado') THEN
                    RAISE EXCEPTION 'Transición inválida desde trial a %', NEW.estado_cliente;
                END IF;
            WHEN 'activo' THEN
                IF NEW.estado_cliente NOT IN ('suspendido', 'cancelado', 'activo') THEN
                    RAISE EXCEPTION 'Transición inválida desde activo a %', NEW.estado_cliente;
                END IF;
            WHEN 'suspendido' THEN
                IF NEW.estado_cliente NOT IN ('activo', 'cancelado') THEN
                    RAISE EXCEPTION 'Transición inválida desde suspendido a %', NEW.estado_cliente;
                END IF;
            WHEN 'cancelado' THEN
                RAISE EXCEPTION 'No se puede cambiar el estado desde cancelado';
        END CASE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_transicion_estado_cliente
    BEFORE UPDATE OF estado_cliente ON tab_clientes
    FOR EACH ROW
    WHEN (OLD.estado_cliente IS DISTINCT FROM NEW.estado_cliente)
    EXECUTE FUNCTION fn_validar_transicion_estado_cliente();

-- Constraint: Validar transiciones de estado de instancia
CREATE OR REPLACE FUNCTION fn_validar_transicion_estado_instancia()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar transiciones permitidas
    IF OLD.estado_instancia IS NOT NULL THEN
        CASE OLD.estado_instancia
            WHEN 'creando' THEN
                IF NEW.estado_instancia NOT IN ('activa', 'error', 'eliminada') THEN
                    RAISE EXCEPTION 'Transición inválida desde creando a %', NEW.estado_instancia;
                END IF;
            WHEN 'activa' THEN
                IF NEW.estado_instancia NOT IN ('suspendida', 'eliminada', 'activa') THEN
                    RAISE EXCEPTION 'Transición inválida desde activa a %', NEW.estado_instancia;
                END IF;
            WHEN 'suspendida' THEN
                IF NEW.estado_instancia NOT IN ('activa', 'eliminada') THEN
                    RAISE EXCEPTION 'Transición inválida desde suspendida a %', NEW.estado_instancia;
                END IF;
            WHEN 'eliminada' THEN
                RAISE EXCEPTION 'No se puede cambiar el estado desde eliminada';
            WHEN 'error' THEN
                IF NEW.estado_instancia NOT IN ('creando', 'eliminada') THEN
                    RAISE EXCEPTION 'Transición inválida desde error a %', NEW.estado_instancia;
                END IF;
        END CASE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_transicion_estado_instancia
    BEFORE UPDATE OF estado_instancia ON tab_instancias
    FOR EACH ROW
    WHEN (OLD.estado_instancia IS DISTINCT FROM NEW.estado_instancia)
    EXECUTE FUNCTION fn_validar_transicion_estado_instancia();

-- Constraint: Validar transiciones de estado de suscripción
CREATE OR REPLACE FUNCTION fn_validar_transicion_estado_suscripcion()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar transiciones permitidas
    IF OLD.estado_suscripcion IS NOT NULL THEN
        CASE OLD.estado_suscripcion
            WHEN 'trial' THEN
                IF NEW.estado_suscripcion NOT IN ('activa', 'cancelada', 'expirada') THEN
                    RAISE EXCEPTION 'Transición inválida desde trial a %', NEW.estado_suscripcion;
                END IF;
            WHEN 'activa' THEN
                IF NEW.estado_suscripcion NOT IN ('suspendida', 'cancelada', 'expirada', 'activa') THEN
                    RAISE EXCEPTION 'Transición inválida desde activa a %', NEW.estado_suscripcion;
                END IF;
            WHEN 'suspendida' THEN
                IF NEW.estado_suscripcion NOT IN ('activa', 'cancelada') THEN
                    RAISE EXCEPTION 'Transición inválida desde suspendida a %', NEW.estado_suscripcion;
                END IF;
            WHEN 'cancelada' THEN
                RAISE EXCEPTION 'No se puede cambiar el estado desde cancelada';
            WHEN 'expirada' THEN
                IF NEW.estado_suscripcion NOT IN ('activa', 'cancelada') THEN
                    RAISE EXCEPTION 'Transición inválida desde expirada a %', NEW.estado_suscripcion;
                END IF;
        END CASE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_transicion_estado_suscripcion
    BEFORE UPDATE OF estado_suscripcion ON tab_suscripciones
    FOR EACH ROW
    WHEN (OLD.estado_suscripcion IS DISTINCT FROM NEW.estado_suscripcion)
    EXECUTE FUNCTION fn_validar_transicion_estado_suscripcion();

-- ============================================================
-- FUNCIONES DE FACTURACIÓN AUTOMÁTICA
-- ============================================================

-- Función: Generar número de factura único
CREATE OR REPLACE FUNCTION fn_generar_num_factura()
RETURNS VARCHAR AS $$
DECLARE
    prefijo VARCHAR := 'FAC-';
    anio VARCHAR := TO_CHAR(CURRENT_DATE, 'YYYY');
    mes VARCHAR := TO_CHAR(CURRENT_DATE, 'MM');
    num_secuencia INTEGER;
    num_factura VARCHAR;
BEGIN
    -- Obtener el siguiente número de secuencia del mes actual
    SELECT COALESCE(MAX(CAST(SUBSTRING(fc.num_factura FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO num_secuencia
    FROM tab_facturacion_cabecera fc
    WHERE fc.num_factura LIKE prefijo || anio || '-' || mes || '-%';
    
    -- Formato: FAC-YYYY-MM-XXXXX (ej: FAC-2025-12-00001)
    num_factura := prefijo || anio || '-' || mes || '-' || LPAD(num_secuencia::TEXT, 5, '0');
    
    RETURN num_factura;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar totales de factura desde el detalle
CREATE OR REPLACE FUNCTION fn_actualizar_totales_factura(p_id_factura DECIMAL)
RETURNS void AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_impuestos DECIMAL(10,2);
    v_descuentos DECIMAL(10,2);
    v_total DECIMAL(10,2);
BEGIN
    -- Calcular totales desde el detalle
    SELECT 
        COALESCE(SUM(subtotal_linea), 0),
        COALESCE(SUM(impuesto_linea), 0),
        COALESCE(SUM(descuento_linea), 0),
        COALESCE(SUM(total_linea), 0)
    INTO v_subtotal, v_impuestos, v_descuentos, v_total
    FROM tab_facturacion_detalle
    WHERE id_factura = p_id_factura;
    
    -- Actualizar la cabecera
    UPDATE tab_facturacion_cabecera
    SET 
        subtotal = v_subtotal,
        impuestos = v_impuestos,
        descuentos = v_descuentos,
        total = v_total,
        fec_update = CURRENT_TIMESTAMP
    WHERE id_factura = p_id_factura;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Actualizar totales automáticamente cuando se modifica el detalle
CREATE OR REPLACE FUNCTION trg_actualizar_totales_factura()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM fn_actualizar_totales_factura(COALESCE(NEW.id_factura, OLD.id_factura));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_totales_factura_after_insert
    AFTER INSERT ON tab_facturacion_detalle
    FOR EACH ROW
    EXECUTE FUNCTION trg_actualizar_totales_factura();

CREATE TRIGGER trg_actualizar_totales_factura_after_update
    AFTER UPDATE ON tab_facturacion_detalle
    FOR EACH ROW
    EXECUTE FUNCTION trg_actualizar_totales_factura();

CREATE TRIGGER trg_actualizar_totales_factura_after_delete
    AFTER DELETE ON tab_facturacion_detalle
    FOR EACH ROW
    EXECUTE FUNCTION trg_actualizar_totales_factura();

-- Función: Generar factura para una suscripción (mensual o anual)
CREATE OR REPLACE FUNCTION fn_generar_factura_suscripcion(
    p_id_suscripcion DECIMAL,
    p_periodo_desde TIMESTAMP,
    p_periodo_hasta TIMESTAMP,
    p_usuario_insert VARCHAR DEFAULT 'system'
)
RETURNS DECIMAL AS $$
DECLARE
    v_suscripcion RECORD;
    v_cliente RECORD;
    v_plan RECORD;
    v_id_factura DECIMAL;
    v_num_factura VARCHAR;
    v_precio DECIMAL(10,2);
    v_fecha_vencimiento TIMESTAMP;
    v_periodo_nombre VARCHAR;
BEGIN
    -- Obtener información de la suscripción
    SELECT s.*, c.identificacion_fiscal, c.email_contacto
    INTO v_suscripcion
    FROM tab_suscripciones s
    JOIN tab_clientes c ON s.identificacion_fiscal_cliente = c.identificacion_fiscal
    WHERE s.id_suscripcion = p_id_suscripcion
    AND s.estado_suscripcion = 'activa';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Suscripción no encontrada o no activa: %', p_id_suscripcion;
    END IF;
    
    -- Obtener información del plan
    SELECT * INTO v_plan
    FROM tab_planes
    WHERE id_plan = v_suscripcion.id_plan;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan no encontrado: %', v_suscripcion.id_plan;
    END IF;
    
    -- Determinar precio según tipo de facturación
    IF v_suscripcion.tipo_facturacion = 'anual' AND v_plan.precio_anual IS NOT NULL THEN
        v_precio := v_plan.precio_anual;
    ELSE
        v_precio := v_suscripcion.precio_actual;
    END IF;
    
    -- Generar número de factura
    v_num_factura := fn_generar_num_factura();
    
    -- Calcular fecha de vencimiento (30 días después de la emisión)
    v_fecha_vencimiento := CURRENT_TIMESTAMP + INTERVAL '30 days';
    
    -- Generar nombre del período
    v_periodo_nombre := TO_CHAR(p_periodo_desde, 'Mon YYYY');
    IF p_periodo_hasta IS NOT NULL AND p_periodo_hasta != p_periodo_desde THEN
        v_periodo_nombre := v_periodo_nombre || ' - ' || TO_CHAR(p_periodo_hasta, 'Mon YYYY');
    END IF;
    
    -- Crear cabecera de factura
    INSERT INTO tab_facturacion_cabecera (
        id_suscripcion,
        identificacion_fiscal_cliente,
        num_factura,
        subtotal,
        impuestos,
        descuentos,
        total,
        moneda,
        estado_pago,
        fecha_emision,
        fecha_vencimiento,
        periodo_facturado_desde,
        periodo_facturado_hasta,
        notas,
        usr_insert,
        fec_insert
    ) VALUES (
        p_id_suscripcion,
        v_suscripcion.identificacion_fiscal,
        v_num_factura,
        0, -- Se calculará desde el detalle
        0,
        0,
        0,
        v_plan.moneda,
        'pendiente',
        CURRENT_TIMESTAMP,
        v_fecha_vencimiento,
        p_periodo_desde,
        p_periodo_hasta,
        'Facturación automática - ' || v_periodo_nombre,
        p_usuario_insert,
        CURRENT_TIMESTAMP
    ) RETURNING id_factura INTO v_id_factura;
    
    -- Crear detalle de factura
    INSERT INTO tab_facturacion_detalle (
        id_factura,
        num_linea,
        concepto,
        cantidad,
        precio_unitario,
        descuento_linea,
        subtotal_linea,
        impuesto_linea,
        total_linea,
        id_plan,
        id_instancia,
        metadata_json,
        usr_insert,
        fec_insert
    ) VALUES (
        v_id_factura,
        1,
        'Suscripción ' || v_plan.nom_plan || ' - ' || v_periodo_nombre,
        1,
        v_precio,
        0,
        v_precio,
        0,
        v_precio,
        v_plan.id_plan,
        v_suscripcion.id_instancia,
        jsonb_build_object(
            'tipo_facturacion', v_suscripcion.tipo_facturacion,
            'periodo_desde', p_periodo_desde,
            'periodo_hasta', p_periodo_hasta
        ),
        p_usuario_insert,
        CURRENT_TIMESTAMP
    );
    
    -- Los totales se actualizarán automáticamente por el trigger
    
    RETURN v_id_factura;
END;
$$ LANGUAGE plpgsql;

-- Función: Generar facturas mensuales para todas las suscripciones activas
CREATE OR REPLACE FUNCTION fn_generar_facturas_mensuales(
    p_fecha_periodo DATE DEFAULT CURRENT_DATE,
    p_usuario_insert VARCHAR DEFAULT 'system'
)
RETURNS TABLE(
    id_factura DECIMAL,
    num_factura VARCHAR,
    identificacion_fiscal_cliente VARCHAR,
    total DECIMAL(10,2),
    estado VARCHAR
) AS $$
DECLARE
    v_suscripcion RECORD;
    v_periodo_desde TIMESTAMP;
    v_periodo_hasta TIMESTAMP;
    v_id_factura DECIMAL;
    v_factura_existente BOOLEAN;
BEGIN
    -- Calcular período (mes completo)
    v_periodo_desde := DATE_TRUNC('month', p_fecha_periodo);
    v_periodo_hasta := (DATE_TRUNC('month', p_fecha_periodo) + INTERVAL '1 month - 1 day')::DATE + TIME '23:59:59';
    
    -- Cursor para recorrer suscripciones activas con facturación mensual
    FOR v_suscripcion IN
        SELECT s.id_suscripcion, s.identificacion_fiscal_cliente, s.tipo_facturacion
        FROM tab_suscripciones s
        WHERE s.estado_suscripcion = 'activa'
        AND s.tipo_facturacion = 'mensual'
        AND (
            s.fecha_proximo_pago IS NULL 
            OR DATE_TRUNC('month', s.fecha_proximo_pago) = DATE_TRUNC('month', p_fecha_periodo)
        )
    LOOP
        -- Verificar si ya existe una factura para este período
        SELECT EXISTS(
            SELECT 1
            FROM tab_facturacion_cabecera fc
            WHERE fc.id_suscripcion = v_suscripcion.id_suscripcion
            AND fc.periodo_facturado_desde = v_periodo_desde
            AND fc.periodo_facturado_hasta = v_periodo_hasta
        ) INTO v_factura_existente;
        
        -- Solo generar si no existe
        IF NOT v_factura_existente THEN
            BEGIN
                v_id_factura := fn_generar_factura_suscripcion(
                    v_suscripcion.id_suscripcion,
                    v_periodo_desde,
                    v_periodo_hasta,
                    p_usuario_insert
                );
                
                -- Retornar información de la factura generada
                RETURN QUERY
                SELECT fc.id_factura, fc.num_factura, fc.identificacion_fiscal_cliente, fc.total, fc.estado_pago::VARCHAR
                FROM tab_facturacion_cabecera fc
                WHERE fc.id_factura = v_id_factura;
                
            EXCEPTION WHEN OTHERS THEN
                -- Log error pero continuar con otras suscripciones
                RAISE WARNING 'Error al generar factura para suscripción %: %', v_suscripcion.id_suscripcion, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Función: Generar facturas anuales para todas las suscripciones activas
CREATE OR REPLACE FUNCTION fn_generar_facturas_anuales(
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    p_usuario_insert VARCHAR DEFAULT 'system'
)
RETURNS TABLE(
    id_factura DECIMAL,
    num_factura VARCHAR,
    identificacion_fiscal_cliente VARCHAR,
    total DECIMAL(10,2),
    estado VARCHAR
) AS $$
DECLARE
    v_suscripcion RECORD;
    v_periodo_desde TIMESTAMP;
    v_periodo_hasta TIMESTAMP;
    v_id_factura DECIMAL;
    v_factura_existente BOOLEAN;
BEGIN
    -- Calcular período (año completo)
    v_periodo_desde := DATE_TRUNC('year', DATE(p_anio || '-01-01'));
    v_periodo_hasta := (DATE_TRUNC('year', DATE(p_anio || '-01-01')) + INTERVAL '1 year - 1 day')::DATE + TIME '23:59:59';
    
    -- Cursor para recorrer suscripciones activas con facturación anual
    FOR v_suscripcion IN
        SELECT s.id_suscripcion, s.identificacion_fiscal_cliente, s.tipo_facturacion
        FROM tab_suscripciones s
        WHERE s.estado_suscripcion = 'activa'
        AND s.tipo_facturacion = 'anual'
        AND (
            s.fecha_proximo_pago IS NULL 
            OR EXTRACT(YEAR FROM s.fecha_proximo_pago) = p_anio
        )
    LOOP
        -- Verificar si ya existe una factura para este período
        SELECT EXISTS(
            SELECT 1
            FROM tab_facturacion_cabecera fc
            WHERE fc.id_suscripcion = v_suscripcion.id_suscripcion
            AND fc.periodo_facturado_desde = v_periodo_desde
            AND fc.periodo_facturado_hasta = v_periodo_hasta
        ) INTO v_factura_existente;
        
        -- Solo generar si no existe
        IF NOT v_factura_existente THEN
            BEGIN
                v_id_factura := fn_generar_factura_suscripcion(
                    v_suscripcion.id_suscripcion,
                    v_periodo_desde,
                    v_periodo_hasta,
                    p_usuario_insert
                );
                
                -- Retornar información de la factura generada
                RETURN QUERY
                SELECT fc.id_factura, fc.num_factura, fc.identificacion_fiscal_cliente, fc.total, fc.estado_pago::VARCHAR
                FROM tab_facturacion_cabecera fc
                WHERE fc.id_factura = v_id_factura;
                
            EXCEPTION WHEN OTHERS THEN
                -- Log error pero continuar con otras suscripciones
                RAISE WARNING 'Error al generar factura para suscripción %: %', v_suscripcion.id_suscripcion, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

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

COMMENT ON TABLE tab_usuarios_synkro IS 'Usuarios administradores de la plataforma Synkro (super admins, soporte, ventas, etc.)';
COMMENT ON TABLE tab_planes IS 'Planes de suscripción disponibles para clientes';
COMMENT ON TABLE tab_clientes IS 'Empresas/clientes que contratan el servicio SaaS. Incluye autenticación para acceso al panel de control. Todos los registros son implícitamente "Cliente"';
COMMENT ON COLUMN tab_clientes.password_cliente IS 'Hash de la contraseña del cliente (usar Argon2 como en ecommerce)';
COMMENT ON COLUMN tab_clientes.ind_activo IS 'Indica si el cliente puede acceder al panel de control';
COMMENT ON COLUMN tab_usuarios_synkro.password_usuario IS 'Hash de la contraseña del usuario admin (usar Argon2 como en ecommerce)';
COMMENT ON COLUMN tab_usuarios_synkro.rol_synkro IS 'Rol del usuario admin (admin_synkro, soporte, ventas)';
COMMENT ON COLUMN tab_usuarios_synkro.ind_activo IS 'Indica si el usuario admin puede acceder al panel';
COMMENT ON TABLE tab_instancias IS 'Instancias de e-commerce creadas para cada cliente';
COMMENT ON TABLE tab_suscripciones IS 'Suscripciones activas de clientes a planes';
COMMENT ON TABLE tab_facturacion_cabecera IS 'Cabecera de facturas de suscripciones';
COMMENT ON TABLE tab_facturacion_detalle IS 'Detalle de líneas de factura (conceptos, servicios, etc.)';
COMMENT ON TABLE tab_deployments IS 'Historial de deployments de instancias';
COMMENT ON TABLE tab_dominios IS 'Dominios asociados a instancias';
COMMENT ON TABLE tab_metricas_instancias IS 'Métricas y monitoreo de instancias';
COMMENT ON TABLE tab_auditoria IS 'Logs de auditoría de acciones en el panel de control';
COMMENT ON TABLE tab_reg_del IS 'Registro de eliminaciones lógicas (soft deletes)';
COMMENT ON TABLE tab_uso_recursos IS 'Tracking de uso de recursos por instancia vs límites del plan';
COMMENT ON TABLE tab_historial_planes IS 'Historial de cambios de plan en suscripciones';

-- ============================================================
-- MEJORAS IMPLEMENTADAS
-- ============================================================

-- 1. PARTICIONAMIENTO DE tab_metricas_instancias
--    - Tabla particionada por rango mensual para mejorar performance
--    - Particiones creadas para los próximos 12 meses (desde enero 2026)
--    - Función fn_crear_particion_metricas_mes_siguiente() para crear particiones automáticamente
--    - Función fn_eliminar_particiones_metricas_antiguas() para limpiar particiones antiguas
--    - Índice GIN en metadata_json para búsquedas eficientes
--    - Mantiene DECIMAL(10,0) con secuencia seq_metricas

-- 2. ESTRUCTURA DE FACTURACIÓN (CABECERA Y DETALLE)
--    - tab_facturacion_cabecera: Información general de la factura (totales, estado, fechas)
--    - tab_facturacion_detalle: Líneas de factura con conceptos, precios, descuentos
--    - Los totales de la cabecera se calculan automáticamente desde el detalle mediante triggers
--    - Soporte para múltiples líneas por factura (flexibilidad para agregar conceptos adicionales)

-- 3. FUNCIONES DE FACTURACIÓN AUTOMÁTICA
--    - fn_generar_num_factura(): Genera número de factura único con formato FAC-YYYY-MM-XXXXX
--    - fn_actualizar_totales_factura(): Actualiza totales de cabecera desde el detalle
--    - fn_generar_factura_suscripcion(): Genera factura individual para una suscripción
--    - fn_generar_facturas_mensuales(): Genera facturas mensuales para todas las suscripciones activas
--    - fn_generar_facturas_anuales(): Genera facturas anuales para todas las suscripciones activas
--    - Uso de cursors para procesar múltiples suscripciones eficientemente
--    - Validación para evitar facturas duplicadas por período

-- 4. ÍNDICES COMPUESTOS ADICIONALES
--    - idx_suscripciones_cliente_estado: Para consultas de suscripciones activas por cliente
--    - idx_suscripciones_instancia_estado: Para consultas de suscripciones activas por instancia
--    - idx_suscripciones_fecha_proximo_pago_estado: Para facturación programada
--    - idx_facturacion_cabecera_cliente_estado: Para facturas pendientes por cliente
--    - idx_facturacion_cabecera_suscripcion_estado: Para facturas por suscripción
--    - idx_facturacion_cabecera_fecha_vencimiento_estado: Para facturas vencidas
--    - idx_facturacion_cabecera_periodo: Para búsquedas por período facturado
--    - idx_instancias_cliente_estado: Para instancias activas por cliente
--    - idx_instancias_estado_fecha_activacion: Para consultas de activación
--    - idx_auditoria_cliente_fecha: Para auditoría por cliente ordenada por fecha
--    - idx_auditoria_instancia_fecha: Para auditoría por instancia ordenada por fecha
--    - idx_auditoria_entidad_tipo_fecha: Para auditoría por entidad y tipo
--    - idx_metricas_instancia_tipo_fecha: Para métricas por instancia y tipo ordenadas por fecha

-- 3. CONSTRAINTS ADICIONALES PARA CONSISTENCIA
--    - Validación de emails con función fn_validar_email()
--    - Validación de fechas lógicas (fin > inicio, vencimiento >= emisión, etc.)
--    - Validación de valores positivos (precios, totales, métricas)
--    - Validación de formato de slug (URL-safe)
--    - Validación de formato de versión (semántica X.Y.Z)
--    - Validación de duraciones positivas
--    - Trigger para establecer fecha_activacion automáticamente

-- 4. VALIDACIONES DE TRANSICIONES DE ESTADO
--    - fn_validar_transicion_estado_cliente(): Valida transiciones de estado_cliente
--      prospecto → trial/activo/cancelado
--      trial → activo/cancelado
--      activo → suspendido/cancelado/activo
--      suspendido → activo/cancelado
--      cancelado → (no se puede cambiar)
--    
--    - fn_validar_transicion_estado_instancia(): Valida transiciones de estado_instancia
--      creando → activa/error/eliminada
--      activa → suspendida/eliminada/activa
--      suspendida → activa/eliminada
--      eliminada → (no se puede cambiar)
--      error → creando/eliminada
--    
--    - fn_validar_transicion_estado_suscripcion(): Valida transiciones de estado_suscripcion
--      trial → activa/cancelada/expirada
--      activa → suspendida/cancelada/expirada/activa
--      suspendida → activa/cancelada
--      cancelada → (no se puede cambiar)
--      expirada → activa/cancelada

-- 5. TRIGGER DE CONSISTENCIA
--    - trg_verificar_suscripcion_activa: Asegura que instancias activas tengan suscripción activa
--      (Se ejecuta después de INSERT/UPDATE en tab_instancias cuando estado = 'activa')

-- NOTAS DE MANTENIMIENTO:
--    - Ejecutar fn_crear_particion_metricas_mes_siguiente() mensualmente (recomendado día 1 de cada mes)
--    - Ejecutar fn_eliminar_particiones_metricas_antiguas(N) periódicamente para limpiar datos antiguos
--    - Revisar y ajustar las fechas de las particiones iniciales según la fecha de implementación
--    - FACTURACIÓN AUTOMÁTICA:
--      * Ejecutar fn_generar_facturas_mensuales() el día 1 de cada mes para facturar el mes anterior
--      * Ejecutar fn_generar_facturas_anuales() el día 1 de enero para facturar el año anterior
--      * Configurar cron job o pg_cron para ejecución automática:
--        SELECT cron.schedule('generar-facturas-mensuales', '0 0 1 * *', 'SELECT fn_generar_facturas_mensuales();');
--        SELECT cron.schedule('generar-facturas-anuales', '0 0 1 1 *', 'SELECT fn_generar_facturas_anuales();');
--    - Los triggers de validación de estado pueden ser deshabilitados temporalmente si es necesario:
--      ALTER TABLE tab_clientes DISABLE TRIGGER trg_validar_transicion_estado_cliente;
--      ALTER TABLE tab_instancias DISABLE TRIGGER trg_validar_transicion_estado_instancia;
--      ALTER TABLE tab_suscripciones DISABLE TRIGGER trg_validar_transicion_estado_suscripcion;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

