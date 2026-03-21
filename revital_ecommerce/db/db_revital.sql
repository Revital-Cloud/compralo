-- **********************************************************
-- * SCRIPT PARA LA BASE DE DATOS DE ADSO 2993127 - REVITAL *
-- * CREADO POR: Kevin, Alejandro, Camilo                   *
-- * Fecha: Mayo 08 de 2025                                 *
-- **********************************************************

-- Orden: VISTAS → tablas dependientes → tablas base.

-- Vistas (dependen de tablas)
DROP VIEW IF EXISTS vw_resumen_puntos_usuario;
DROP VIEW IF EXISTS vw_descuentos_canjeables;
DROP VIEW IF EXISTS vw_top_productos_vendidos;
DROP VIEW IF EXISTS vw_resumen_ventas_categoria;
DROP VIEW IF EXISTS vw_kpis_disponibles;

-- Nivel 4: dependencias cruzadas (inventario, carrito, órdenes, favoritos, compras, estadísticas)
DROP TABLE IF EXISTS tab_movimientos_inventario;
DROP TABLE IF EXISTS tab_carrito_productos;
DROP TABLE IF EXISTS tab_orden_productos;
DROP TABLE IF EXISTS tab_favoritos;
DROP TABLE IF EXISTS tab_orden_compra_proveedor;
DROP TABLE IF EXISTS tab_estadisticas_productos;
DROP TABLE IF EXISTS tab_estadisticas_categorias;

-- Nivel 3: comentarios antes que órdenes (FK); pagos; fidelización; descuentos
DROP TABLE IF EXISTS tab_comentarios;
DROP TABLE IF EXISTS tab_pagos;
DROP TABLE IF EXISTS tab_metodos_pago_usuario;
DROP TABLE IF EXISTS tab_canjes_puntos_descuentos;
DROP TABLE IF EXISTS tab_movimientos_puntos;
DROP TABLE IF EXISTS tab_puntos_usuario;
DROP TABLE IF EXISTS tab_descuentos_usuarios;
DROP TABLE IF EXISTS tab_ordenes;
DROP TABLE IF EXISTS tab_descuentos;

-- Nivel 2: carrito cabecera, direcciones, KPIs, usuarios
DROP TABLE IF EXISTS tab_carritos;
DROP TABLE IF EXISTS tab_direcciones_usuario;
DROP TABLE IF EXISTS tab_alertas_kpi;
DROP TABLE IF EXISTS tab_compartir_dashboards;
DROP TABLE IF EXISTS tab_widgets_dashboard;
DROP TABLE IF EXISTS tab_dashboards_usuarios;
DROP TABLE IF EXISTS tab_valores_kpi_cache;
DROP TABLE IF EXISTS tab_kpis_maestros;
DROP TABLE IF EXISTS tab_usuarios;

-- Nivel 1: catálogo (español — esquema actual)
DROP TABLE IF EXISTS tab_imagenes_grupo_variante;
DROP TABLE IF EXISTS tab_combinaciones_variante_producto;
DROP TABLE IF EXISTS tab_grupos_variante_producto;
DROP TABLE IF EXISTS tab_productos;
DROP TABLE IF EXISTS tab_atributos_categoria;
DROP TABLE IF EXISTS tab_valores_atributo;
DROP TABLE IF EXISTS tab_atributos;
DROP TABLE IF EXISTS tab_categorias;

DROP TABLE IF EXISTS tab_marcas;
DROP TABLE IF EXISTS tab_proveedores;
DROP TABLE IF EXISTS tab_roles;

DROP TABLE IF EXISTS tab_cms_content;
DROP TABLE IF EXISTS tab_config_puntos_empresa;
DROP TABLE IF EXISTS tab_reg_del;


-- Registro de eliminaciones lógicas / auditoría de borrado
CREATE TABLE IF NOT EXISTS tab_reg_del (
    id_del          DECIMAL(10) PRIMARY KEY,
    nom_tabla       VARCHAR NOT NULL,
    atributos       JSONB NOT NULL,
    usr_eliminacion VARCHAR NOT NULL,
    fec_eliminacion TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- =============================================================
-- Catálogo: categorías jerárquicas, productos, variantes, atributos
-- =============================================================

CREATE TABLE IF NOT EXISTS tab_categorias (
    id_categoria        DECIMAL(10) PRIMARY KEY,
    nom_categoria       VARCHAR NOT NULL,
    slug_categoria      VARCHAR NOT NULL UNIQUE,
    id_categoria_padre  DECIMAL(10) NULL REFERENCES tab_categorias(id_categoria),
    ind_activo          BOOLEAN DEFAULT TRUE,
    usr_insert          DECIMAL(10) NOT NULL,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update          DECIMAL(10),
    fec_update          TIMESTAMP WITHOUT TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_tab_categorias_id_padre ON tab_categorias(id_categoria_padre);

-- Maestro de atributos dinámicos (tipo_dato: códigos text|number|boolean — contrato aplicación)
CREATE TABLE IF NOT EXISTS tab_atributos (
    id_atributo                 DECIMAL(10) PRIMARY KEY,
    nom_atributo                VARCHAR NOT NULL,
    tipo_dato                   VARCHAR NOT NULL CHECK (tipo_dato IN ('text', 'number', 'boolean')),
    ind_valores_predefinidos    BOOLEAN DEFAULT FALSE,
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS tab_valores_atributo (
    id_valor_atributo   DECIMAL(10) PRIMARY KEY,
    id_atributo         DECIMAL(10) NOT NULL REFERENCES tab_atributos(id_atributo),
    valor               VARCHAR NOT NULL,
    color_hex           VARCHAR NULL,
    orden               INT DEFAULT 0,
    ind_activo          BOOLEAN DEFAULT TRUE,
    usr_insert          DECIMAL(10) NOT NULL,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update          DECIMAL(10),
    fec_update          TIMESTAMP WITHOUT TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_tab_valores_atributo_id_atributo ON tab_valores_atributo(id_atributo);

CREATE TABLE IF NOT EXISTS tab_atributos_categoria (
    id_atributo_categoria   DECIMAL(10) PRIMARY KEY,
    id_categoria            DECIMAL(10) NOT NULL REFERENCES tab_categorias(id_categoria),
    id_atributo             DECIMAL(10) NOT NULL REFERENCES tab_atributos(id_atributo),
    ind_obligatorio         BOOLEAN NOT NULL DEFAULT FALSE,
    ind_filtrable           BOOLEAN NOT NULL DEFAULT FALSE,
    usr_insert              DECIMAL(10) NOT NULL,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE NULL,
    UNIQUE (id_categoria, id_atributo)
);
CREATE INDEX IF NOT EXISTS idx_tab_atributos_categoria_id_categoria ON tab_atributos_categoria(id_categoria);
CREATE INDEX IF NOT EXISTS idx_tab_atributos_categoria_id_atributo ON tab_atributos_categoria(id_atributo);

-- Producto sin precio ni stock (precio/stock en combinaciones de variante)
CREATE TABLE IF NOT EXISTS tab_productos (
    id_producto     DECIMAL(10) PRIMARY KEY,
    id_categoria    DECIMAL(10) NOT NULL REFERENCES tab_categorias(id_categoria),
    nom_producto    VARCHAR NOT NULL,
    slug_producto   VARCHAR NOT NULL UNIQUE,
    descripcion     TEXT NULL,
    id_marca        DECIMAL(10) NULL,
    id_proveedor    DECIMAL(10) NULL,
    ind_activo      BOOLEAN DEFAULT TRUE,
    usr_insert      DECIMAL(10) NOT NULL,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_tab_productos_id_categoria ON tab_productos(id_categoria);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tab_productos_slug ON tab_productos(slug_producto);

-- Grupo de variantes: una galería por valor dominante (ej. color)
CREATE TABLE IF NOT EXISTS tab_grupos_variante_producto (
    id_grupo_variante           DECIMAL(10) PRIMARY KEY,
    id_producto                 DECIMAL(10) NOT NULL REFERENCES tab_productos(id_producto),
    nom_atributo_dominante     VARCHAR(100) NOT NULL,
    valor_atributo_dominante    VARCHAR(255) NOT NULL,
    ind_activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    usr_insert                  DECIMAL(10) NOT NULL DEFAULT 0,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    UNIQUE (id_producto, valor_atributo_dominante)
);
CREATE INDEX IF NOT EXISTS idx_tab_grupos_variante_id_producto ON tab_grupos_variante_producto(id_producto);
CREATE INDEX IF NOT EXISTS idx_tab_grupos_variante_producto_activo ON tab_grupos_variante_producto(id_producto, ind_activo);

CREATE TABLE IF NOT EXISTS tab_combinaciones_variante_producto (
    id_combinacion_variante DECIMAL(10) PRIMARY KEY,
    id_grupo_variante       DECIMAL(10) NOT NULL REFERENCES tab_grupos_variante_producto(id_grupo_variante),
    cod_sku                 VARCHAR(120) NOT NULL UNIQUE,
    precio                  DECIMAL(12,2) NOT NULL CHECK (precio >= 0),
    cant_stock              INT NOT NULL DEFAULT 0 CHECK (cant_stock >= 0),
    tipo_clasificacion      VARCHAR(100) NULL,
    atributos               JSONB NOT NULL DEFAULT '{}',
    ind_activo              BOOLEAN NOT NULL DEFAULT TRUE,
    usr_insert              DECIMAL(10) NOT NULL DEFAULT 0,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_tab_combinaciones_variante_id_grupo ON tab_combinaciones_variante_producto(id_grupo_variante);
CREATE INDEX IF NOT EXISTS idx_tab_combinaciones_variante_grupo_activo ON tab_combinaciones_variante_producto(id_grupo_variante, ind_activo);
CREATE INDEX IF NOT EXISTS idx_tab_combinaciones_variante_atributos_gin ON tab_combinaciones_variante_producto USING GIN (atributos);

CREATE TABLE IF NOT EXISTS tab_imagenes_grupo_variante (
    id_imagen_grupo_variante    DECIMAL(10) PRIMARY KEY,
    id_grupo_variante           DECIMAL(10) NOT NULL REFERENCES tab_grupos_variante_producto(id_grupo_variante),
    url_imagen                  VARCHAR NOT NULL,
    ind_principal               BOOLEAN NOT NULL DEFAULT FALSE,
    orden                       INT NOT NULL DEFAULT 0,
    usr_insert                  DECIMAL(10) NOT NULL DEFAULT 0,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_tab_imagenes_grupo_variante_id_grupo ON tab_imagenes_grupo_variante(id_grupo_variante);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tab_imagenes_grupo_variante_grupo_url ON tab_imagenes_grupo_variante(id_grupo_variante, url_imagen);

-- =============================================================
-- Estadísticas por categoría (materializado / ETL)
-- =============================================================

CREATE TABLE IF NOT EXISTS tab_estadisticas_categorias (
    id_categoria                DECIMAL(10) PRIMARY KEY REFERENCES tab_categorias(id_categoria),
    nom_categoria               VARCHAR,
    categoria_activa            BOOLEAN,
    total_productos             INT DEFAULT 0,
    productos_activos           INT DEFAULT 0,
    productos_con_ventas        INT DEFAULT 0,
    total_ordenes               INT DEFAULT 0,
    total_unidades_vendidas     INT DEFAULT 0,
    total_ingresos              DECIMAL(15,2) DEFAULT 0,
    ventas_mes_actual           INT DEFAULT 0,
    ingresos_mes_actual         DECIMAL(12,2) DEFAULT 0,
    ventas_mes_anterior         INT DEFAULT 0,
    ingresos_mes_anterior       DECIMAL(12,2) DEFAULT 0,
    participacion_ventas        DECIMAL(5,2) DEFAULT 0,
    crecimiento_mensual         DECIMAL(5,2) DEFAULT 0,
    precio_promedio_categoria   DECIMAL(10,2) DEFAULT 0,
    producto_mas_vendido        VARCHAR(255),
    producto_mayor_ingreso      VARCHAR(255),
    unidades_top_producto       INT DEFAULT 0,
    fecha_primera_venta         DATE,
    fecha_ultima_venta          DATE,
    mejor_mes_ventas            VARCHAR(7),
    ultima_actualizacion        TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    periodo_calculo             VARCHAR(7)
);

CREATE TABLE IF NOT EXISTS tab_roles (
    id_rol      DECIMAL(1),
    nom_rol     VARCHAR NOT NULL UNIQUE,
    des_rol     VARCHAR,
    usr_insert  DECIMAL(10) NOT NULL,
    fec_insert  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update  DECIMAL(10),
    fec_update  TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id_rol)
);

CREATE TABLE IF NOT EXISTS tab_usuarios (
    id_usuario              DECIMAL(10),
    nom_usuario             VARCHAR NOT NULL,
    ape_usuario             VARCHAR NOT NULL,
    email_usuario           VARCHAR NOT NULL UNIQUE,
    password_usuario        VARCHAR NOT NULL,
    id_rol                  DECIMAL(1) DEFAULT 2,
    FOREIGN KEY (id_rol)    REFERENCES tab_roles(id_rol),
    ind_genero              BOOLEAN NOT NULL,
    cel_usuario             VARCHAR NOT NULL,
    fec_nacimiento          DATE,
    ind_activo              BOOLEAN DEFAULT TRUE,
    semilla_avatar          VARCHAR(255),
    colores_avatar          VARCHAR(500),
    fec_eliminacion_cuenta  TIMESTAMP WITHOUT TIME ZONE NULL,
    usr_insert              DECIMAL(10) NOT NULL,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id_usuario)
);

CREATE TABLE IF NOT EXISTS tab_direcciones_usuario (
    id_direccion        DECIMAL PRIMARY KEY,
    id_usuario          DECIMAL(10) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario) ON DELETE SET NULL,
    nombre_direccion    VARCHAR NOT NULL,
    calle_direccion     VARCHAR NOT NULL,
    ciudad              VARCHAR NOT NULL,
    departamento        VARCHAR NOT NULL,
    codigo_postal       VARCHAR NOT NULL,
    barrio              VARCHAR NOT NULL,
    referencias         VARCHAR,
    complemento         VARCHAR,
    ind_principal       BOOLEAN NOT NULL DEFAULT FALSE,
    ind_activa          BOOLEAN NOT NULL DEFAULT TRUE,
    usr_insert          DECIMAL(10) NOT NULL,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update          DECIMAL(10),
    fec_update          TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT chk_nombre_direccion_no_vacio CHECK (LENGTH(TRIM(nombre_direccion)) >= 2),
    CONSTRAINT chk_calle_direccion_no_vacia CHECK (LENGTH(TRIM(calle_direccion)) >= 5)
);

CREATE INDEX IF NOT EXISTS idx_direcciones_usuario_lookup
    ON tab_direcciones_usuario(id_usuario, ind_activa);

CREATE INDEX IF NOT EXISTS idx_direcciones_usuario_principal
    ON tab_direcciones_usuario(id_usuario, ind_principal)
    WHERE ind_principal = TRUE;

CREATE INDEX IF NOT EXISTS idx_direcciones_usuario_ciudad
    ON tab_direcciones_usuario(ciudad, departamento)
    WHERE ind_activa = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_direcciones_una_principal_por_usuario
    ON tab_direcciones_usuario(id_usuario)
    WHERE ind_principal = TRUE AND ind_activa = TRUE;

-- Métodos de pago guardados (Wompi u otro proveedor; cod_proveedor_pago por defecto 'wompi')
CREATE TABLE IF NOT EXISTS tab_metodos_pago_usuario (
    id_metodo_pago      DECIMAL(10) PRIMARY KEY,
    id_usuario          DECIMAL(10) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    cod_proveedor_pago  VARCHAR(50) NOT NULL DEFAULT 'wompi',
    id_fuente_proveedor VARCHAR(255) NOT NULL,
    marca_tarjeta       VARCHAR(50),
    ultimos_cuatro_digitos VARCHAR(4),
    mes_vencimiento     INTEGER,
    ano_vencimiento     INTEGER,
    titular_tarjeta     VARCHAR(255),
    ind_predeterminado  BOOLEAN NOT NULL DEFAULT FALSE,
    usr_insert          DECIMAL(10) NOT NULL,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update          DECIMAL(10),
    fec_update          TIMESTAMP WITHOUT TIME ZONE,
    UNIQUE (id_usuario, id_fuente_proveedor, cod_proveedor_pago)
);

CREATE INDEX IF NOT EXISTS idx_metodos_pago_usuario ON tab_metodos_pago_usuario(id_usuario);
CREATE INDEX IF NOT EXISTS idx_metodos_pago_id_fuente_proveedor ON tab_metodos_pago_usuario(id_fuente_proveedor);

CREATE TABLE IF NOT EXISTS tab_carritos (
    id_carrito      DECIMAL(10),
    id_usuario      DECIMAL(10) DEFAULT NULL,
    id_sesion       VARCHAR DEFAULT NULL,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    PRIMARY KEY (id_carrito),
    usr_insert      DECIMAL(10) NOT NULL,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT chk_usuario_o_sesion CHECK (id_usuario IS NOT NULL OR id_sesion IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS tab_proveedores (
    id_proveedor    DECIMAL(10),
    nom_proveedor   VARCHAR NOT NULL,
    correo_proveedor VARCHAR NOT NULL UNIQUE,
    tel_proveedor   DECIMAL(15) NOT NULL,
    ind_activo      BOOLEAN DEFAULT TRUE,
    usr_insert      DECIMAL(10) NOT NULL,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id_proveedor)
);

CREATE TABLE IF NOT EXISTS tab_marcas (
    id_marca        DECIMAL(10),
    nom_marca       VARCHAR NOT NULL UNIQUE,
    ind_activo      BOOLEAN DEFAULT TRUE,
    usr_insert      DECIMAL(10) NOT NULL,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id_marca)
);

ALTER TABLE tab_productos
    ADD CONSTRAINT fk_tab_productos_marca FOREIGN KEY (id_marca) REFERENCES tab_marcas(id_marca);
ALTER TABLE tab_productos
    ADD CONSTRAINT fk_tab_productos_proveedor FOREIGN KEY (id_proveedor) REFERENCES tab_proveedores(id_proveedor);

CREATE TABLE IF NOT EXISTS tab_orden_compra_proveedor (
    id_orden_compra         DECIMAL(10) DEFAULT NULL,
    id_proveedor            DECIMAL(10) NOT NULL REFERENCES tab_proveedores(id_proveedor),
    fec_orden_compra        DATE NOT NULL DEFAULT CURRENT_DATE,
    fec_esperada_entrega    DATE NOT NULL,
    observaciones_orden     VARCHAR,
    id_producto             DECIMAL(10) NOT NULL REFERENCES tab_productos(id_producto),
    id_combinacion_variante DECIMAL(10) NULL REFERENCES tab_combinaciones_variante_producto(id_combinacion_variante),
    cantidad_solicitada     INT NOT NULL CHECK (cantidad_solicitada > 0),
    cantidad_recibida       INT NOT NULL DEFAULT 0 CHECK (cantidad_recibida >= 0),
    costo_unitario         DECIMAL(10,2) NOT NULL CHECK (costo_unitario >= 0),
    subtotal_producto       DECIMAL(12,2) GENERATED ALWAYS AS (cantidad_solicitada * costo_unitario) STORED,
    ind_estado_producto     DECIMAL(1) NOT NULL DEFAULT 1 CHECK (ind_estado_producto BETWEEN 1 AND 4),
    fec_recepcion_completa  TIMESTAMP WITHOUT TIME ZONE,
    observaciones_producto  VARCHAR,
    usr_insert              DECIMAL(10) NOT NULL,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id_orden_compra),
    CONSTRAINT chk_cantidad_recibida_limite CHECK (cantidad_recibida <= cantidad_solicitada),
    CONSTRAINT chk_fec_esperada_futura CHECK (fec_esperada_entrega >= fec_orden_compra),
    CONSTRAINT chk_recepcion_completa_coherente CHECK (
        (ind_estado_producto = 3 AND fec_recepcion_completa IS NOT NULL) OR
        (ind_estado_producto != 3 AND fec_recepcion_completa IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_orden
    ON tab_orden_compra_proveedor(id_orden_compra, id_proveedor);
CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_producto
    ON tab_orden_compra_proveedor(id_producto);
CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_variante
    ON tab_orden_compra_proveedor(id_combinacion_variante) WHERE id_combinacion_variante IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_estado
    ON tab_orden_compra_proveedor(ind_estado_producto, fec_esperada_entrega);
CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_proveedor_fecha
    ON tab_orden_compra_proveedor(id_proveedor, fec_orden_compra DESC);

CREATE TABLE IF NOT EXISTS tab_comentarios (
    id_comentario   DECIMAL(10) NOT NULL,
    id_producto     DECIMAL(10) NOT NULL REFERENCES tab_productos(id_producto),
    id_usuario      DECIMAL(10) NOT NULL REFERENCES tab_usuarios(id_usuario),
    id_orden        DECIMAL(10) NOT NULL,
    comentario      VARCHAR NOT NULL CHECK (LENGTH(TRIM(comentario)) >= 3),
    calificacion    INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    ind_activo      BOOLEAN NOT NULL DEFAULT TRUE,
    usr_insert      DECIMAL(10) NOT NULL,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id_comentario, id_producto),
    CONSTRAINT uq_comentario_usuario_producto_orden UNIQUE (id_usuario, id_orden, id_producto)
);

CREATE TABLE IF NOT EXISTS tab_descuentos (
    id_descuento            DECIMAL(10) PRIMARY KEY,
    nom_descuento           VARCHAR NOT NULL,
    des_descuento           VARCHAR,
    tipo_calculo            BOOLEAN NOT NULL,
    val_porce_descuento     DECIMAL(10,2) NOT NULL,
    val_monto_descuento     DECIMAL(10,0) NOT NULL,
    aplica_a                VARCHAR(30) NOT NULL,
    id_categoria_aplica     DECIMAL(10) NULL REFERENCES tab_categorias(id_categoria) ON DELETE SET NULL,
    id_producto_aplica      DECIMAL(10) NULL REFERENCES tab_productos(id_producto) ON DELETE SET NULL,
    id_marca_aplica         DECIMAL(10) NULL,
    min_valor_pedido        DECIMAL(10,2) DEFAULT 0,
    ind_es_para_cumpleanos  BOOLEAN DEFAULT FALSE,
    fec_inicio              DATE NULL,
    fec_fin                 DATE NULL,
    ind_activo              BOOLEAN DEFAULT TRUE,
    max_usos_total          INT NULL,
    usos_actuales_total     INT DEFAULT 0,
    costo_puntos_canje      INT NULL CHECK (costo_puntos_canje IS NULL OR costo_puntos_canje > 0),
    ind_canjeable_puntos    BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_descuento        VARCHAR UNIQUE,
    max_usos_por_usuario    INT NULL,
    dias_semana_aplica      VARCHAR,
    horas_inicio            TIME,
    horas_fin               TIME,
    solo_primera_compra     BOOLEAN DEFAULT FALSE,
    monto_minimo_producto   DECIMAL(10,2) DEFAULT 0,
    cantidad_minima_producto INT DEFAULT 1,
    requiere_codigo         BOOLEAN DEFAULT FALSE,
    usr_insert              DECIMAL(10) NOT NULL,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT chk_fechas_validez_descuento CHECK (
        (fec_inicio IS NULL AND fec_fin IS NULL) OR
        (fec_inicio IS NOT NULL AND fec_fin IS NOT NULL AND fec_fin >= fec_inicio)
    ),
    CONSTRAINT chk_valor_descuento_coherente CHECK (
        (tipo_calculo = TRUE AND val_porce_descuento >= 0 AND val_porce_descuento <= 100) OR
        (tipo_calculo = FALSE AND val_monto_descuento >= 0)
    ),
    CONSTRAINT chk_fk_producto_condicional CHECK (id_producto_aplica IS NULL OR aplica_a = 'producto_especifico'),
    CONSTRAINT chk_fk_categoria_condicional CHECK (id_categoria_aplica IS NULL OR aplica_a = 'categoria_especifica'),
    CONSTRAINT chk_fk_marca_condicional CHECK (id_marca_aplica IS NULL OR aplica_a = 'marca_especifica'),
    CONSTRAINT chk_aplica_a CHECK (aplica_a IN (
        'total_pedido',
        'producto_especifico',
        'marca_especifica',
        'categoria_especifica',
        'linea_especifica',
        'sublinea_especifica',
        'costo_envio',
        'envio_gratis',
        'segunda_unidad',
        'compra_minima'
    )),
    CONSTRAINT chk_min_valor_pedido CHECK (min_valor_pedido >= 0),
    CONSTRAINT chk_max_usos_total CHECK (max_usos_total IS NULL OR max_usos_total > 0),
    CONSTRAINT chk_usos_actuales_total CHECK (usos_actuales_total >= 0),
    CONSTRAINT chk_max_usos_por_usuario CHECK (max_usos_por_usuario IS NULL OR max_usos_por_usuario > 0),
    CONSTRAINT chk_monto_minimo_producto CHECK (monto_minimo_producto >= 0),
    CONSTRAINT chk_cantidad_minima_producto CHECK (cantidad_minima_producto >= 1),
    CONSTRAINT chk_dias_semana_formato CHECK (dias_semana_aplica IS NULL OR dias_semana_aplica ~ '^[LMXJVSD,]+$'),
    CONSTRAINT chk_horarios_coherentes CHECK (
        (horas_inicio IS NULL AND horas_fin IS NULL) OR
        (horas_inicio IS NOT NULL AND horas_fin IS NOT NULL)
    ),
    CONSTRAINT chk_canje_puntos_coherente CHECK (
        (ind_canjeable_puntos = FALSE) OR
        (ind_canjeable_puntos = TRUE AND costo_puntos_canje IS NOT NULL AND costo_puntos_canje > 0)
    ),
    FOREIGN KEY (id_marca_aplica) REFERENCES tab_marcas(id_marca) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tab_descuentos_usuarios (
    id_descuento    DECIMAL(10) NOT NULL,
    id_usuario      DECIMAL(10) NOT NULL,
    veces_usado     INT DEFAULT 1,
    usr_insert      DECIMAL(10) NOT NULL,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT chk_veces_usado CHECK (veces_usado >= 1),
    FOREIGN KEY (id_descuento) REFERENCES tab_descuentos(id_descuento),
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    UNIQUE (id_descuento, id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_descuentos_fechas_activo
    ON tab_descuentos(fec_inicio, fec_fin, ind_activo);
CREATE INDEX IF NOT EXISTS idx_descuentos_codigo
    ON tab_descuentos(codigo_descuento) WHERE codigo_descuento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_descuentos_aplica_a
    ON tab_descuentos(aplica_a, ind_activo);
CREATE INDEX IF NOT EXISTS idx_descuentos_cumpleanos
    ON tab_descuentos(ind_es_para_cumpleanos, ind_activo) WHERE ind_es_para_cumpleanos = TRUE;
CREATE INDEX IF NOT EXISTS idx_descuentos_primera_compra
    ON tab_descuentos(solo_primera_compra, ind_activo) WHERE solo_primera_compra = TRUE;
CREATE INDEX IF NOT EXISTS idx_descuentos_usuarios_lookup
    ON tab_descuentos_usuarios(id_descuento, id_usuario);
CREATE INDEX IF NOT EXISTS idx_descuentos_usuarios_fecha
    ON tab_descuentos_usuarios(fec_insert);

CREATE TABLE IF NOT EXISTS tab_ordenes (
    id_orden                    DECIMAL(10),
    fec_pedido                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    id_usuario                  DECIMAL(10) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    val_total_productos         DECIMAL(10,0) NOT NULL CHECK (val_total_productos >= 0),
    val_total_descuentos        DECIMAL(10,0) NOT NULL DEFAULT 0 CHECK (val_total_descuentos >= 0),
    val_total_pedido            DECIMAL(10,0) NOT NULL CHECK (val_total_pedido >= 0),
    ind_estado                  DECIMAL(1) NOT NULL DEFAULT 1 CHECK (ind_estado >= 1 AND ind_estado <= 3),
    metodo_pago                 VARCHAR(50) CHECK (metodo_pago IN ('tarjeta', 'efectivo_red_pagos', 'transferencia')),
    id_descuento                DECIMAL(10),
    FOREIGN KEY (id_descuento) REFERENCES tab_descuentos(id_descuento),
    detalle_descuentos_aplicados JSON,
    des_observaciones           VARCHAR,
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT chk_totales_orden CHECK (val_total_pedido = val_total_productos - val_total_descuentos),
    PRIMARY KEY (id_orden)
);

ALTER TABLE tab_comentarios
    DROP CONSTRAINT IF EXISTS fk_comentarios_orden;
ALTER TABLE tab_comentarios
    ADD CONSTRAINT fk_comentarios_orden FOREIGN KEY (id_orden) REFERENCES tab_ordenes(id_orden);

-- Pagos Wompi: estado_pago almacena códigos del proveedor (CREATED, APPROVED, …)
CREATE TABLE IF NOT EXISTS tab_pagos (
    id_pago                 DECIMAL(10) PRIMARY KEY,
    id_orden                DECIMAL(10) NOT NULL,
    FOREIGN KEY (id_orden) REFERENCES tab_ordenes(id_orden),
    ref_pago                VARCHAR(255),
    id_transaccion_proveedor VARCHAR(255),
    cod_proveedor_pago      VARCHAR(50) NOT NULL DEFAULT 'wompi',
    estado_pago             VARCHAR(50) NOT NULL,
    detalle_estado_pago     VARCHAR(100),
    monto                   DECIMAL(12, 2) NOT NULL,
    cod_moneda              VARCHAR(10) NOT NULL DEFAULT 'COP',
    num_cuotas              INTEGER,
    tipo_medio_pago         VARCHAR(50),
    datos_extra_medio_pago  JSONB,
    monto_comision          DECIMAL(10, 2) DEFAULT 0.00,
    monto_neto_recibido     DECIMAL(12, 2),
    fec_creacion_proveedor  TIMESTAMP,
    fec_aprobacion_proveedor TIMESTAMP,
    respuesta_cruda         JSONB,
    ultimo_evento_crudo     JSONB,
    id_pago_padre           INTEGER,
    FOREIGN KEY (id_pago_padre) REFERENCES tab_pagos(id_pago) ON DELETE SET NULL,
    estado_procesamiento    VARCHAR(20) DEFAULT 'pendiente',
    usr_insert              DECIMAL(10) NOT NULL,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT chk_monto_positivo CHECK (monto > 0),
    CONSTRAINT chk_estado_procesamiento CHECK (estado_procesamiento IN ('pendiente', 'procesado', 'error', 'cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_pagos_orden ON tab_pagos(id_orden);
CREATE INDEX IF NOT EXISTS idx_pagos_id_transaccion_proveedor ON tab_pagos(id_transaccion_proveedor);
CREATE INDEX IF NOT EXISTS idx_pagos_estado_procesamiento ON tab_pagos(estado_pago, estado_procesamiento);
CREATE INDEX IF NOT EXISTS idx_pagos_fec_creacion_proveedor ON tab_pagos(fec_creacion_proveedor DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_ref_pago ON tab_pagos(ref_pago) WHERE ref_pago IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_transaccion_proveedor_unica
    ON tab_pagos(id_transaccion_proveedor, cod_proveedor_pago)
    WHERE id_transaccion_proveedor IS NOT NULL;

CREATE TABLE IF NOT EXISTS tab_orden_productos (
    id_orden_producto       DECIMAL(10),
    id_orden                DECIMAL(10) NOT NULL REFERENCES tab_ordenes(id_orden),
    id_combinacion_variante DECIMAL(10) NOT NULL REFERENCES tab_combinaciones_variante_producto(id_combinacion_variante),
    cant_producto           INT NOT NULL CHECK (cant_producto > 0),
    precio_unitario_orden   DECIMAL(10,0) NOT NULL CHECK (precio_unitario_orden >= 0),
    subtotal                DECIMAL(10,0) NOT NULL CHECK (subtotal >= 0),
    opciones_elegidas       JSONB NOT NULL DEFAULT '{}'::JSONB,
    usr_insert              DECIMAL(10) NOT NULL,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT uq_orden_producto UNIQUE (id_orden, id_combinacion_variante),
    CONSTRAINT chk_subtotal_orden_producto CHECK (subtotal = cant_producto * precio_unitario_orden),
    PRIMARY KEY (id_orden_producto)
);
CREATE INDEX IF NOT EXISTS idx_orden_productos_orden ON tab_orden_productos(id_orden);
CREATE INDEX IF NOT EXISTS idx_orden_productos_id_combinacion ON tab_orden_productos(id_combinacion_variante);

CREATE TABLE IF NOT EXISTS tab_carrito_productos (
    id_carrito_producto     DECIMAL(10) PRIMARY KEY,
    id_carrito              DECIMAL(10) NOT NULL REFERENCES tab_carritos(id_carrito),
    id_combinacion_variante DECIMAL(10) NOT NULL REFERENCES tab_combinaciones_variante_producto(id_combinacion_variante),
    cantidad                INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario_carrito DECIMAL(12,2) NOT NULL CHECK (precio_unitario_carrito >= 0),
    opciones_elegidas       JSONB NOT NULL DEFAULT '{}'::JSONB,
    usr_insert              DECIMAL(10) NOT NULL,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT uq_carrito_producto UNIQUE (id_carrito, id_combinacion_variante),
    -- PK definida arriba (sin autogeneración)
);
CREATE INDEX IF NOT EXISTS idx_carrito_productos_carrito ON tab_carrito_productos(id_carrito);
CREATE INDEX IF NOT EXISTS idx_carrito_productos_id_combinacion ON tab_carrito_productos(id_combinacion_variante);

CREATE TABLE IF NOT EXISTS tab_movimientos_inventario (
    id_movimiento                   DECIMAL(10),
    id_combinacion_variante         DECIMAL(10) NOT NULL REFERENCES tab_combinaciones_variante_producto(id_combinacion_variante),
    tipo_movimiento                 VARCHAR(25) NOT NULL CHECK (tipo_movimiento IN (
        'entrada_compra', 'salida_venta', 'ajuste_incremento', 'ajuste_decremento',
        'devolucion_usuario', 'devolucion_proveedor', 'inventario_inicial'
    )),
    cantidad                        INT NOT NULL CHECK (cantidad >= 0),
    costo_unitario_movimiento       DECIMAL(10,2) DEFAULT NULL,
    stock_anterior                  INT NULL,
    saldo_costo_total_anterior_mov  DECIMAL(12,2) NULL,
    stock_actual                    INT NULL,
    saldo_costo_total_actual_mov    DECIMAL(12,2) NULL,
    costo_promedio_ponderado_mov    DECIMAL(10,2) NULL,
    id_orden_usuario_detalle        DECIMAL(10) NULL REFERENCES tab_orden_productos(id_orden_producto),
    id_orden_compra                 DECIMAL(10) NULL REFERENCES tab_orden_compra_proveedor(id_orden_compra),
    descripcion                     VARCHAR,
    observaciones                   VARCHAR,
    usr_insert                      DECIMAL(10) NOT NULL,
    fec_insert                      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                      DECIMAL(10),
    fec_update                      TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id_movimiento)
);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_id_combinacion ON tab_movimientos_inventario(id_combinacion_variante);

CREATE TABLE IF NOT EXISTS tab_estadisticas_productos (
    id_producto             DECIMAL(10) NOT NULL PRIMARY KEY REFERENCES tab_productos(id_producto),
    nom_producto            VARCHAR,
    precio_actual           DECIMAL(10,2),
    stock_actual            INT,
    producto_activo         BOOLEAN,
    total_ordenes           INT DEFAULT 0,
    total_unidades_vendidas INT DEFAULT 0,
    total_ingresos          DECIMAL(15,2) DEFAULT 0,
    ventas_mes_actual       INT DEFAULT 0,
    ingresos_mes_actual     DECIMAL(12,2) DEFAULT 0,
    ventas_mes_anterior     INT DEFAULT 0,
    ingresos_mes_anterior   DECIMAL(12,2) DEFAULT 0,
    promedio_venta_mensual  DECIMAL(8,2) DEFAULT 0,
    promedio_ingreso_mensual DECIMAL(12,2) DEFAULT 0,
    precio_promedio_venta   DECIMAL(10,2) DEFAULT 0,
    fecha_primera_venta     DATE,
    fecha_ultima_venta      DATE,
    mes_mejor_venta         VARCHAR(7),
    mejor_venta_unidades    INT DEFAULT 0,
    dias_desde_ultima_venta INT,
    rotacion_inventario     DECIMAL(5,2) DEFAULT 0,
    nivel_rotacion          VARCHAR(20),
    ultima_actualizacion    TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    periodo_calculo         VARCHAR(7)
);

CREATE TABLE IF NOT EXISTS tab_cms_content (
    id_cms_content  DECIMAL(10) PRIMARY KEY,
    nom_cms_content VARCHAR NOT NULL,
    des_cms_content JSONB NOT NULL,
    num_version     INTEGER DEFAULT 1,
    ind_publicado   BOOLEAN DEFAULT false,
    usr_insert      DECIMAL(10) NOT NULL,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS tab_favoritos (
    id_usuario  DECIMAL(10) NOT NULL REFERENCES tab_usuarios(id_usuario),
    id_producto DECIMAL(10) NOT NULL REFERENCES tab_productos(id_producto),
    usr_insert  DECIMAL(10) NOT NULL,
    fec_insert  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    PRIMARY KEY (id_usuario, id_producto)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_usuario_fecha ON tab_favoritos(id_usuario, fec_insert DESC);
CREATE INDEX IF NOT EXISTS idx_favoritos_producto ON tab_favoritos(id_producto);
CREATE INDEX IF NOT EXISTS idx_favoritos_fecha ON tab_favoritos(fec_insert DESC);

-- =============================================================
-- Fidelización
-- =============================================================

CREATE TABLE IF NOT EXISTS tab_config_puntos_empresa (
    id_config_puntos    DECIMAL(10) PRIMARY KEY,
    pesos_por_punto     DECIMAL(10,2) NOT NULL CHECK (pesos_por_punto > 0),
    ind_activo          BOOLEAN NOT NULL DEFAULT TRUE,
    descripcion         VARCHAR NOT NULL DEFAULT 'Configuración de puntos por pesos gastados',
    fec_inicio_vigencia DATE NOT NULL DEFAULT CURRENT_DATE,
    fec_fin_vigencia    DATE NULL,
    usr_insert          DECIMAL(10) NOT NULL,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update          DECIMAL(10),
    fec_update          TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT chk_fechas_vigencia_puntos CHECK (fec_fin_vigencia IS NULL OR fec_fin_vigencia >= fec_inicio_vigencia)
);

CREATE TABLE IF NOT EXISTS tab_puntos_usuario (
    id_usuario              DECIMAL(10) PRIMARY KEY,
    puntos_disponibles      INT NOT NULL DEFAULT 0 CHECK (puntos_disponibles >= 0),
    puntos_totales_ganados  INT NOT NULL DEFAULT 0 CHECK (puntos_totales_ganados >= 0),
    puntos_totales_canjeados INT NOT NULL DEFAULT 0 CHECK (puntos_totales_canjeados >= 0),
    fec_ultimo_canje        TIMESTAMP WITHOUT TIME ZONE NULL,
    usr_insert              DECIMAL(10) NOT NULL,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    CONSTRAINT chk_consistencia_puntos CHECK (
        puntos_disponibles = (puntos_totales_ganados - puntos_totales_canjeados)
    )
);

CREATE TABLE IF NOT EXISTS tab_movimientos_puntos (
    id_movimiento_puntos        DECIMAL(10) PRIMARY KEY,
    id_usuario                  DECIMAL(10) NOT NULL,
    tipo_movimiento             DECIMAL(1) NOT NULL CHECK (tipo_movimiento IN (1, 2, 3)),
    cantidad_puntos             INT NOT NULL CHECK (cantidad_puntos != 0),
    puntos_disponibles_anterior INT NOT NULL CHECK (puntos_disponibles_anterior >= 0),
    puntos_disponibles_actual   INT NOT NULL CHECK (puntos_disponibles_actual >= 0),
    id_orden_origen             DECIMAL(10) NULL,
    id_descuento_canjeado       DECIMAL(10) NULL,
    descripcion                 VARCHAR NOT NULL,
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    FOREIGN KEY (id_orden_origen) REFERENCES tab_ordenes(id_orden),
    FOREIGN KEY (id_descuento_canjeado) REFERENCES tab_descuentos(id_descuento),
    CONSTRAINT chk_acumulacion_positiva CHECK (tipo_movimiento != 1 OR cantidad_puntos > 0),
    CONSTRAINT chk_canje_negativo CHECK (tipo_movimiento != 2 OR cantidad_puntos < 0),
    CONSTRAINT chk_orden_solo_acumulacion CHECK (id_orden_origen IS NULL OR tipo_movimiento = 1),
    CONSTRAINT chk_descuento_solo_canje CHECK (id_descuento_canjeado IS NULL OR tipo_movimiento = 2)
);

CREATE TABLE IF NOT EXISTS tab_canjes_puntos_descuentos (
    id_canje                DECIMAL(10) PRIMARY KEY,
    id_usuario              DECIMAL(10) NOT NULL,
    id_descuento            DECIMAL(10) NOT NULL,
    puntos_utilizados       INT NOT NULL CHECK (puntos_utilizados > 0),
    id_orden_aplicado       DECIMAL(10) NULL,
    fec_expiracion_canje    TIMESTAMP WITHOUT TIME ZONE NULL,
    ind_utilizado           BOOLEAN NOT NULL DEFAULT FALSE,
    fec_utilizacion         TIMESTAMP WITHOUT TIME ZONE NULL,
    usr_insert              DECIMAL(10) NOT NULL,
    fec_insert              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update              DECIMAL(10),
    fec_update              TIMESTAMP WITHOUT TIME ZONE,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    FOREIGN KEY (id_descuento) REFERENCES tab_descuentos(id_descuento),
    FOREIGN KEY (id_orden_aplicado) REFERENCES tab_ordenes(id_orden),
    CONSTRAINT chk_utilizacion_coherente CHECK (
        (ind_utilizado = FALSE AND fec_utilizacion IS NULL AND id_orden_aplicado IS NULL) OR
        (ind_utilizado = TRUE AND fec_utilizacion IS NOT NULL)
    ),
    CONSTRAINT chk_fecha_expiracion CHECK (fec_expiracion_canje IS NULL OR fec_expiracion_canje > fec_insert)
);

CREATE INDEX IF NOT EXISTS idx_puntos_usuario_lookup
    ON tab_puntos_usuario(id_usuario, puntos_disponibles);
CREATE INDEX IF NOT EXISTS idx_movimientos_puntos_usuario_fecha
    ON tab_movimientos_puntos(id_usuario, fec_insert DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_puntos_tipo
    ON tab_movimientos_puntos(tipo_movimiento, fec_insert DESC);
CREATE INDEX IF NOT EXISTS idx_descuentos_canjeables
    ON tab_descuentos(ind_canjeable_puntos, ind_activo, costo_puntos_canje)
    WHERE ind_canjeable_puntos = TRUE;
CREATE INDEX IF NOT EXISTS idx_canjes_usuario_disponibles
    ON tab_canjes_puntos_descuentos(id_usuario, ind_utilizado, fec_expiracion_canje)
    WHERE ind_utilizado = FALSE;
CREATE INDEX IF NOT EXISTS idx_config_puntos_activa
    ON tab_config_puntos_empresa(ind_activo, fec_inicio_vigencia, fec_fin_vigencia)
    WHERE ind_activo = TRUE;
