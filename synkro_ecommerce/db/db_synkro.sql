-- *********************************************************
-- * SCRIPT PARA LA BASE DE DATOS DE ADSO 2993127 - SYNKRO *
-- * CREADO POR: Kevin, Alejandro, Camilo                  *
-- * Fecha: Mayo 08 de 2025                                *
-- *********************************************************

-- Eliminar primero VISTAS, luego TABLAS DEPENDIENTES, luego TABLAS BASE

-- Primero: Eliminar VISTAS que dependen de las tablas
DROP VIEW IF EXISTS vw_resumen_puntos_usuario;
DROP VIEW IF EXISTS vw_descuentos_canjeables;

-- Segundo: Eliminar TABLAS en orden de dependencias

-- Nivel 4: Tablas que dependen de múltiples otras (orden corregido)
DROP TABLE IF EXISTS tab_movimientos_inventario; --depende de productos Y tab_orden_productos
DROP TABLE IF EXISTS tab_carrito_productos; --depende de carritos y productos
DROP TABLE IF EXISTS tab_orden_productos; --depende de ordenes y productos  
DROP TABLE IF EXISTS tab_favoritos; --depende de usuarios y productos
DROP TABLE IF EXISTS tab_orden_compra_proveedor; --depende de proveedores y productos (tabla unificada)
DROP TABLE IF EXISTS tab_estadisticas_productos; --depende de productos
DROP TABLE IF EXISTS tab_estadisticas_categorias; --depende de categorias

-- Nivel 3: Sistema de fidelización y órdenes
DROP TABLE IF EXISTS tab_pagos; -- depende de ordenes
DROP TABLE IF EXISTS tab_metodos_pago_usuario; -- depende de usuarios
DROP TABLE IF EXISTS tab_canjes_puntos_descuentos; --depende de usuarios y descuentos
DROP TABLE IF EXISTS tab_movimientos_puntos; --depende de usuarios
DROP TABLE IF EXISTS tab_puntos_usuario; --depende de usuarios
DROP TABLE IF EXISTS tab_descuentos_usuarios; --depende de usuarios y descuentos
DROP TABLE IF EXISTS tab_ordenes; --depende de usuarios y descuentos
DROP TABLE IF EXISTS tab_descuentos; --depende de categorias, marcas, productos

-- Nivel 2: Tablas intermedias
DROP TABLE IF EXISTS tab_comentarios; --depende de usuarios, productos, lineas, sublineas, categorias
DROP TABLE IF EXISTS tab_productos; --depende de sublineas, proveedores, marcas
DROP TABLE IF EXISTS tab_carritos; --depende de usuarios
DROP TABLE IF EXISTS tab_direcciones_usuario; --depende de usuarios
DROP TABLE IF EXISTS tab_sublineas; --depende de lineas
DROP TABLE IF EXISTS tab_lineas; --depende de categorias
DROP TABLE IF EXISTS tab_usuarios; --depende de roles


-- Nivel 1: Tablas base (no dependen de otras)
DROP TABLE IF EXISTS tab_categorias;
DROP TABLE IF EXISTS tab_marcas;
DROP TABLE IF EXISTS tab_proveedores;
DROP TABLE IF EXISTS tab_roles;

DROP TABLE IF EXISTS tab_cms_content;
DROP TABLE IF EXISTS tab_config_puntos_empresa;
DROP TABLE IF EXISTS tab_reg_del;



-- Tabla para registrar eliminaciones lógicas o logs de borrado
CREATE TABLE IF NOT EXISTS tab_reg_del(
    id_del                      SERIAL 	PRIMARY KEY,
    tab_name                    VARCHAR 	NOT NULL,
    atributos                   JSONB 		NOT NULL,
    usr_delete                  VARCHAR 	NOT NULL,
    fec_delete                  TIMESTAMP 	WITHOUT TIME ZONE NOT NULL 
);

-- Tabla Categorias
CREATE TABLE IF NOT EXISTS tab_categorias (
    id_categoria                DECIMAL(10),
    nom_categoria               VARCHAR 		NOT NULL 		UNIQUE,
    ind_activo                  BOOLEAN 		DEFAULT TRUE,
    usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP 		WITHOUT TIME ZONE 	NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP 		WITHOUT TIME ZONE,
		PRIMARY KEY (id_categoria)
);

-- Tabla Linea
CREATE TABLE IF NOT EXISTS tab_lineas (
    id_categoria                DECIMAL(10),
    id_linea                    DECIMAL(10),
    FOREIGN KEY (id_categoria)  REFERENCES tab_categorias(id_categoria),
    nom_linea                   VARCHAR 		NOT NULL UNIQUE,
    ind_activo                  BOOLEAN 		DEFAULT TRUE,
    usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP 		WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP 		WITHOUT TIME ZONE,
    PRIMARY KEY (id_linea, id_categoria)
);

-- Tabla Sublinea
CREATE TABLE IF NOT EXISTS tab_sublineas (
    id_categoria                DECIMAL(10),
    id_linea                    DECIMAL(10),
    id_sublinea                 DECIMAL(10),
    FOREIGN KEY (id_linea, id_categoria)  REFERENCES tab_lineas(id_linea, id_categoria),
    nom_sublinea                VARCHAR 		NOT NULL,
    ind_activo                  BOOLEAN 		DEFAULT TRUE,
    usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP 		WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP		WITHOUT TIME ZONE,
    PRIMARY KEY (id_sublinea, id_linea, id_categoria)
);

CREATE TABLE IF NOT EXISTS tab_estadisticas_categorias (
    -- Identificación de la categoría
    id_categoria                DECIMAL(10) PRIMARY KEY,
    nom_categoria               VARCHAR(255),
    categoria_activa            BOOLEAN,
    -- Estadísticas agregadas de productos
    total_productos             INT DEFAULT 0,              -- Productos totales en la categoría
    productos_activos           INT DEFAULT 0,              -- Productos activos
    productos_con_ventas        INT DEFAULT 0,              -- Productos que han tenido ventas
    -- Estadísticas de ventas agregadas
    total_ordenes               INT DEFAULT 0,              -- Órdenes que incluyen productos de esta categoría
    total_unidades_vendidas     INT DEFAULT 0,              -- Suma de todas las unidades vendidas
    total_ingresos              DECIMAL(15,2) DEFAULT 0,    -- Suma de todos los ingresos
    -- Estadísticas temporales
    ventas_mes_actual           INT DEFAULT 0,              -- Ventas del mes actual
    ingresos_mes_actual         DECIMAL(12,2) DEFAULT 0,    -- Ingresos del mes actual
    ventas_mes_anterior         INT DEFAULT 0,              -- Ventas del mes anterior
    ingresos_mes_anterior       DECIMAL(12,2) DEFAULT 0,    -- Ingresos del mes anterior
    -- Tendencias y análisis
    participacion_ventas        DECIMAL(5,2) DEFAULT 0,     -- % de participación en ventas totales
    crecimiento_mensual         DECIMAL(5,2) DEFAULT 0,     -- % de crecimiento vs mes anterior
    precio_promedio_categoria   DECIMAL(10,2) DEFAULT 0,    -- Precio promedio de productos
    -- Top productos
    producto_mas_vendido        VARCHAR(255),               -- Nombre del producto más vendido
    producto_mayor_ingreso      VARCHAR(255),               -- Producto que genera más ingresos
    unidades_top_producto       INT DEFAULT 0,              -- Unidades del producto más vendido
    -- Fechas importantes
    fecha_primera_venta         DATE,                       -- Primera venta en la categoría
    fecha_ultima_venta          DATE,                       -- Última venta en la categoría
    mejor_mes_ventas            VARCHAR(7),                 -- Mejor mes de ventas (YYYY-MM)
    -- Control de actualizaciones
    ultima_actualizacion        TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    periodo_calculo             VARCHAR(7),                 -- Período del último cálculo
    -- FK Constraint
    FOREIGN KEY (id_categoria) REFERENCES tab_categorias(id_categoria)
);

--Tabla de Roles
CREATE TABLE IF NOT EXISTS tab_roles (
    id_rol                      DECIMAL(1),
    nom_rol                     VARCHAR 		NOT NULL UNIQUE,
    des_rol                     VARCHAR,
	usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP 		WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP 		WITHOUT TIME ZONE,
		PRIMARY KEY(id_rol)
);



-- Tabla Usuarios
CREATE TABLE IF NOT EXISTS tab_usuarios (
    id_usuario                  DECIMAL(10),
--datos personales
    nom_usuario                 VARCHAR 		NOT NULL,
    ape_usuario                 VARCHAR 		NOT NULL,
    email_usuario               VARCHAR 		NOT NULL UNIQUE,
    password_usuario            VARCHAR 		NOT NULL,
-- Referencia a roles    
    id_rol                      DECIMAL(1) 		DEFAULT 2,
    FOREIGN KEY (id_rol)        REFERENCES tab_roles(id_rol),
--datos personales adicionales
    ind_genero                  BOOLEAN 		NOT NULL,
    cel_usuario                 VARCHAR 		NOT NULL,
    fec_nacimiento              DATE, 
--ind_
    ind_activo                  BOOLEAN 		DEFAULT TRUE,
-- Campos de auditoría    
    usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
		PRIMARY KEY (id_usuario)
);

-- Tabla de Direcciones de Usuario (Múltiples direcciones por usuario)
CREATE TABLE IF NOT EXISTS tab_direcciones_usuario (
    id_direccion                DECIMAL         PRIMARY KEY,
    id_usuario                  DECIMAL(10) 	NOT NULL,
        FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario) ON DELETE SET NULL,
    nombre_direccion            VARCHAR 	    NOT NULL,       -- "Casa", "Trabajo", "Casa de mamá", etc.
    calle_direccion             VARCHAR	        NOT NULL,      -- Dirección completa de la calle
    ciudad                      VARCHAR         NOT NULL,           -- Ciudad
    departamento                VARCHAR         NOT NULL,           -- Departamento/Estado
    codigo_postal               VARCHAR         NOT NULL,           -- Código postal
    barrio                      VARCHAR         NOT NULL,           -- Barrio/Sector
    referencias                 VARCHAR,                   -- "Portón azul", "Al lado del parque"
    complemento                 VARCHAR,                   -- Apartamento, oficina, casa, etc.
    ind_principal               BOOLEAN 		NOT NULL DEFAULT FALSE, -- Solo UNA puede ser principal por usuario
    ind_activa                  BOOLEAN 		NOT NULL DEFAULT TRUE,  -- Para soft delete
-- Campos de auditoría    
    usr_insert                  DECIMAL(10) 	NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    
    -- Constraints de validación
    CONSTRAINT chk_nombre_direccion_no_vacio CHECK (LENGTH(TRIM(nombre_direccion)) >= 2),
    CONSTRAINT chk_calle_direccion_no_vacia CHECK (LENGTH(TRIM(calle_direccion)) >= 5)
);

-- Índices para optimizar consultas de direcciones
CREATE INDEX IF NOT EXISTS idx_direcciones_usuario_lookup 
    ON tab_direcciones_usuario(id_usuario, ind_activa);

CREATE INDEX IF NOT EXISTS idx_direcciones_usuario_principal 
    ON tab_direcciones_usuario(id_usuario, ind_principal) 
    WHERE ind_principal = TRUE;

CREATE INDEX IF NOT EXISTS idx_direcciones_usuario_ciudad 
    ON tab_direcciones_usuario(ciudad, departamento) 
    WHERE ind_activa = TRUE;

-- Constraint único para asegurar solo UNA dirección principal por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_direcciones_una_principal_por_usuario 
    ON tab_direcciones_usuario(id_usuario) 
    WHERE ind_principal = TRUE AND ind_activa = TRUE;


-- 2. Tabla para Métodos de Pago (Actualizada para Wompi)
CREATE TABLE IF NOT EXISTS tab_metodos_pago_usuario (
    id_metodo_pago              SERIAL PRIMARY KEY,
    id_usuario                  DECIMAL(10) NOT NULL,
    FOREIGN KEY (id_usuario)    REFERENCES tab_usuarios(id_usuario),

    -- Información del Proveedor (ahora con Wompi por defecto)
    provider_name               VARCHAR(50) NOT NULL DEFAULT 'wompi',
    provider_source_id          VARCHAR(255) NOT NULL,          -- ID de la fuente de pago en Wompi (reemplaza provider_card_id)

    -- Detalles no sensibles de la tarjeta (Wompi provee estos datos)
    brand                       VARCHAR(50),                    -- Marca: 'VISA', 'MASTERCARD'
    last_four_digits            VARCHAR(4),
    expiration_month            INTEGER,
    expiration_year             INTEGER,
    card_holder                 VARCHAR(255),                   -- Nombre del titular

    -- Control y Estado
    is_default                  BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Auditoría
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,

    -- Constraint actualizado
    UNIQUE (id_usuario, provider_source_id, provider_name)
);

-- Índices para `tab_metodos_pago_usuario`
CREATE INDEX IF NOT EXISTS idx_metodos_pago_usuario
    ON tab_metodos_pago_usuario(id_usuario);

CREATE INDEX IF NOT EXISTS idx_metodos_pago_provider_source_id
    ON tab_metodos_pago_usuario(provider_source_id);


-- Tabla Carrito (Cabecera)
CREATE TABLE IF NOT EXISTS tab_carritos (
    id_carrito                  SERIAL,
    id_usuario                  DECIMAL(10) DEFAULT NULL,
    session_id                  VARCHAR DEFAULT NULL,
    FOREIGN KEY (id_usuario)    REFERENCES tab_usuarios(id_usuario),
	PRIMARY KEY(id_carrito),
	usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP 		WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP 		WITHOUT TIME ZONE,
    -- Restricción para asegurar que existe al menos uno
    CONSTRAINT chk_usuario_o_session CHECK (id_usuario IS NOT NULL OR session_id IS NOT NULL)
);

-- Tabla Proveedor
CREATE TABLE IF NOT EXISTS tab_proveedores (
    id_proveedor                DECIMAL(10),
    nom_proveedor               VARCHAR 		NOT NULL,
    email                       VARCHAR 		NOT NULL UNIQUE,
    tel_proveedor               DECIMAL(15) 	NOT NULL,
    ind_activo                  BOOLEAN 		DEFAULT TRUE,
    usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
		PRIMARY KEY(id_proveedor)
);

--Tabla de Marcas
CREATE TABLE IF NOT EXISTS tab_marcas (
    id_marca                    DECIMAL(10),
    nom_marca                   VARCHAR 		NOT NULL UNIQUE,
    ind_activo                  BOOLEAN 		DEFAULT TRUE,
    usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
		PRIMARY KEY(id_marca)
);

-- Tabla Producto
CREATE TABLE IF NOT EXISTS tab_productos (
    id_categoria                DECIMAL(10),
    id_linea                    DECIMAL(10),
    id_sublinea                 DECIMAL(10),
    id_producto                 DECIMAL(10),
    nom_producto                VARCHAR         NOT NULL,
    spcf_producto               JSONB           NOT NULL,
    img_producto                JSONB,          -- ✅ JSONB para múltiples imágenes
    val_precio                  DECIMAL(10)     NOT NULL CHECK (val_precio >= 0),
    id_proveedor                DECIMAL(10)     NOT NULL,
    id_marca                    DECIMAL(10)     NOT NULL,
    FOREIGN KEY (id_proveedor)  REFERENCES tab_proveedores(id_proveedor),
    FOREIGN KEY (id_categoria, id_linea, id_sublinea)   REFERENCES tab_sublineas(id_categoria, id_linea, id_sublinea),
    FOREIGN KEY (id_marca)      REFERENCES tab_marcas(id_marca),
    num_stock                   INT             NOT NULL DEFAULT 0 CHECK (num_stock >= 0),
    ind_activo                  BOOLEAN         DEFAULT TRUE,
    usr_insert                  DECIMAL(10)     NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id_categoria,id_linea,id_sublinea,id_producto)
);

-- Tabla de Órdenes de Compra a Proveedores (después de tab_productos)
CREATE TABLE IF NOT EXISTS tab_orden_compra_proveedor (
    id_orden_compra             DECIMAL(10) DEFAULT NULL,                           -- ID de la orden de compra (PK)
    id_proveedor                DECIMAL(10) NOT NULL,                  -- Proveedor de la orden
    fec_orden_compra            DATE NOT NULL DEFAULT CURRENT_DATE,    -- Fecha de la orden
    fec_esperada_entrega        DATE NOT NULL,                         -- Fecha esperada de entrega
    observaciones_orden         VARCHAR,                               -- Observaciones generales
    id_categoria                DECIMAL(10) NOT NULL,                  -- ID categoría del producto
    id_linea                    DECIMAL(10) NOT NULL,                  -- ID línea del producto  
    id_sublinea                 DECIMAL(10) NOT NULL,                  -- ID sublínea del producto
    id_producto                 DECIMAL(10) NOT NULL,                  -- ID del producto
    cantidad_solicitada         INT NOT NULL CHECK (cantidad_solicitada > 0),     -- Cantidad pedida
    cantidad_recibida           INT NOT NULL DEFAULT 0 CHECK (cantidad_recibida >= 0), -- Cantidad recibida
    costo_unitario              DECIMAL(10,2) NOT NULL CHECK (costo_unitario >= 0),    -- Costo por unidad
    subtotal_producto           DECIMAL(12,2) GENERATED ALWAYS AS (cantidad_solicitada * costo_unitario) STORED, -- Subtotal calculado
    ind_estado_producto         DECIMAL(1) NOT NULL DEFAULT 1 CHECK (ind_estado_producto BETWEEN 1 AND 4), -- Estado del producto
    fec_recepcion_completa      TIMESTAMP WITHOUT TIME ZONE,          -- Fecha cuando se completó recepción
    observaciones_producto      VARCHAR,                               -- Observaciones específicas del producto
    usr_insert                  DECIMAL(10) NOT NULL,                  -- Usuario que crea
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(), -- Fecha creación
    usr_update                  DECIMAL(10),                          -- Usuario que actualiza
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,          -- Fecha actualización
    
    PRIMARY KEY (id_orden_compra),
    FOREIGN KEY (id_proveedor) REFERENCES tab_proveedores(id_proveedor),
    FOREIGN KEY (id_categoria, id_linea, id_sublinea, id_producto) 
        REFERENCES tab_productos(id_categoria, id_linea, id_sublinea, id_producto),

    CONSTRAINT chk_cantidad_recibida_limite CHECK (cantidad_recibida <= cantidad_solicitada),
    CONSTRAINT chk_fec_esperada_futura CHECK (fec_esperada_entrega >= fec_orden_compra),
    CONSTRAINT chk_recepcion_completa_coherente CHECK (
        (ind_estado_producto = 3 AND fec_recepcion_completa IS NOT NULL) OR
        (ind_estado_producto != 3 AND fec_recepcion_completa IS NULL)
    )
);

-- Índices para tab_orden_compra_proveedor
CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_orden 
    ON tab_orden_compra_proveedor(id_orden_compra, id_proveedor);

CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_producto 
    ON tab_orden_compra_proveedor(id_categoria, id_linea, id_sublinea, id_producto);

CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_estado 
    ON tab_orden_compra_proveedor(ind_estado_producto, fec_esperada_entrega);

CREATE INDEX IF NOT EXISTS idx_orden_compra_proveedor_proveedor_fecha 
    ON tab_orden_compra_proveedor(id_proveedor, fec_orden_compra DESC);

-- Tabla Comentarios
CREATE TABLE IF NOT EXISTS tab_comentarios (
    id_categoria                DECIMAL(10) 	NOT NULL,
    id_linea                    DECIMAL(10) 	NOT NULL,
    id_sublinea                 DECIMAL(10) 	NOT NULL,
    id_producto                 DECIMAL(10) 	NOT NULL,
    id_usuario                  DECIMAL(10) 	NOT NULL,
    id_orden                    DECIMAL(10) 	NOT NULL,  -- ID de la orden asociada al comentario
    id_comentario              DECIMAL(10) 	NOT NULL,
    comentario                  VARCHAR 		NOT NULL CHECK (LENGTH(TRIM(comentario)) >= 3),
    calificacion                INT 		NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    ind_activo                  BOOLEAN 		NOT NULL DEFAULT TRUE,
    usr_insert                  DECIMAL(10) 	NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	usr_update					DECIMAL(10),
	fec_update					TIMESTAMP WITHOUT TIME ZONE,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    FOREIGN KEY (id_orden) REFERENCES tab_ordenes(id_orden),
    FOREIGN KEY (id_categoria,id_linea,id_sublinea,id_producto) REFERENCES tab_productos(id_categoria, id_linea, id_sublinea, id_producto),
    PRIMARY KEY (id_comentario,id_categoria,id_linea,id_sublinea,id_producto),
    -- Restricción UNIQUE: Un usuario solo puede hacer una reseña por producto por orden
    CONSTRAINT uq_comentario_usuario_producto_orden UNIQUE (id_usuario, id_orden, id_categoria, id_linea, id_sublinea, id_producto)
);


-- Tabla principal de descuentos con capacidades avanzadas
CREATE TABLE IF NOT EXISTS tab_descuentos (
    -- Campos originales
    id_descuento                DECIMAL(10) PRIMARY KEY,  --Identificador único del descuento
    nom_descuento               VARCHAR         NOT NULL, --Nombre descriptivo del descuento
    des_descuento               VARCHAR, --Descripción detallada del descuento
    tipo_calculo                BOOLEAN         NOT NULL, --TRUE = porcentaje, FALSE = monto fijo
    val_porce_descuento         DECIMAL(10,2)   NOT NULL, --Valor del descuento en porcentaje
    val_monto_descuento         DECIMAL(10,0)   NOT NULL, --Valor del descuento en monto fijo
    aplica_a                    VARCHAR(30)     NOT NULL, --Tipo de aplicación del descuento
    id_categoria                DECIMAL(10)     NULL,    -- Para FK a tab_productos (requerido por FK compuesta)
    id_linea                    DECIMAL(10)     NULL,    -- Para FK a tab_productos (requerido por FK compuesta)
    id_sublinea                 DECIMAL(10)     NULL,    -- Para FK a tab_productos (requerido por FK compuesta)
    
    id_producto_aplica          DECIMAL(10)     NULL,
    id_categoria_aplica         DECIMAL(10)     NULL,
    id_marca_aplica             DECIMAL(10)     NULL,
    id_linea_aplica             DECIMAL(10)     NULL,
    id_sublinea_aplica          DECIMAL(10)     NULL,
    min_valor_pedido            DECIMAL(10,2)   DEFAULT 0, --Monto mínimo de pedido para aplicar el descuento
    ind_es_para_cumpleanos      BOOLEAN         DEFAULT FALSE, --TRUE = el descuento es para cumpleaños, FALSE = el descuento no es para cumpleaños
    fec_inicio                  DATE            NOT NULL, --Fecha de inicio de validez del descuento
    fec_fin                     DATE            NOT NULL, --Fecha de fin de validez del descuento
    ind_activo                  BOOLEAN         DEFAULT TRUE, --TRUE = el descuento está activo, FALSE = el descuento está inactivo
    max_usos_total              INT             NULL, --Límite total de usos del descuento (NULL = ilimitado)
    usos_actuales_total         INT             DEFAULT 0, --Número de veces que el descuento ha sido usado
    -- Campos del sistema de fidelización
    costo_puntos_canje          INT             NULL CHECK (costo_puntos_canje IS NULL OR costo_puntos_canje > 0), --Costo en puntos para canjear este descuento
    ind_canjeable_puntos        BOOLEAN         NOT NULL DEFAULT FALSE, --TRUE = se puede canjear por puntos, FALSE = no se puede canjear por puntos
    -- Nuevos campos agregados
    codigo_descuento            VARCHAR         UNIQUE, --Código único para cupones (opcional)
    max_usos_por_usuario        INT             NULL, --Límite de usos por usuario (NULL = ilimitado)
    dias_semana_aplica          VARCHAR,        -- 'L,M,X,J,V,S,D' para días específicos
    horas_inicio                TIME, --Hora de inicio de validez del descuento
    horas_fin                   TIME, --Hora de fin de validez del descuento
    solo_primera_compra         BOOLEAN         DEFAULT FALSE, --TRUE = solo se puede aplicar en la primera compra del usuario, FALSE = se puede aplicar en todas las compras del usuario
    monto_minimo_producto       DECIMAL(10,2)   DEFAULT 0, --Monto mínimo de productos para aplicar el descuento
    cantidad_minima_producto    INT             DEFAULT 1, --Cantidad mínima de productos para aplicar el descuento
    requiere_codigo             BOOLEAN         DEFAULT FALSE,
	usr_insert                  DECIMAL(10)         NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    
    -- Constraints originales
    CONSTRAINT chk_fechas_validez_descuento     CHECK (fec_fin >= fec_inicio),
    CONSTRAINT chk_valor_descuento_coherente    CHECK (
        (tipo_calculo = TRUE AND val_porce_descuento >= 0 AND val_porce_descuento <= 100) OR 
        (tipo_calculo = FALSE AND val_monto_descuento >= 0)
    ),
    CONSTRAINT chk_fk_producto_condicional      CHECK (id_producto_aplica IS NULL OR aplica_a = 'producto_especifico'),
    CONSTRAINT chk_fk_categoria_condicional     CHECK (id_categoria_aplica IS NULL OR aplica_a = 'categoria_especifica'),
    CONSTRAINT chk_fk_marca_condicional         CHECK (id_marca_aplica IS NULL OR aplica_a = 'marca_especifica'),
    CONSTRAINT chk_fk_linea_condicional         CHECK (id_linea_aplica IS NULL OR aplica_a = 'linea_especifica'),
    CONSTRAINT chk_fk_sublinea_condicional      CHECK (id_sublinea_aplica IS NULL OR aplica_a = 'sublinea_especifica'),
    
    -- Nuevos constraints
    CONSTRAINT chk_aplica_a                     CHECK (aplica_a IN (
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
    CONSTRAINT chk_min_valor_pedido             CHECK (min_valor_pedido >= 0),
    CONSTRAINT chk_max_usos_total               CHECK (max_usos_total IS NULL OR max_usos_total > 0),
    CONSTRAINT chk_usos_actuales_total          CHECK (usos_actuales_total >= 0),
    CONSTRAINT chk_max_usos_por_usuario         CHECK (max_usos_por_usuario IS NULL OR max_usos_por_usuario > 0),
    CONSTRAINT chk_monto_minimo_producto        CHECK (monto_minimo_producto >= 0),
    CONSTRAINT chk_cantidad_minima_producto     CHECK (cantidad_minima_producto >= 1),
    CONSTRAINT chk_dias_semana_formato          CHECK (dias_semana_aplica IS NULL OR dias_semana_aplica ~ '^[LMXJVSD,]+$'),
    CONSTRAINT chk_horarios_coherentes          CHECK (
        (horas_inicio IS NULL AND horas_fin IS NULL) OR
        (horas_inicio IS NOT NULL AND horas_fin IS NOT NULL)
    ),
    
    -- Constraint para sistema de fidelización
    CONSTRAINT chk_canje_puntos_coherente       CHECK (
        (ind_canjeable_puntos = FALSE) OR 
        (ind_canjeable_puntos = TRUE AND costo_puntos_canje IS NOT NULL AND costo_puntos_canje > 0)
    ),
    
    -- Foreign Keys compuestas consistentes
    FOREIGN KEY (id_categoria, id_linea, id_sublinea, id_producto_aplica) 
        REFERENCES tab_productos(id_categoria, id_linea, id_sublinea, id_producto) 
        ON DELETE SET NULL,
    FOREIGN KEY (id_categoria_aplica) 
        REFERENCES tab_categorias(id_categoria) 
        ON DELETE SET NULL,
    FOREIGN KEY (id_marca_aplica) 
        REFERENCES tab_marcas(id_marca) 
        ON DELETE SET NULL,
    FOREIGN KEY (id_categoria, id_linea_aplica) 
        REFERENCES tab_lineas(id_categoria, id_linea) 
        ON DELETE SET NULL,
    FOREIGN KEY (id_categoria, id_linea, id_sublinea_aplica) 
        REFERENCES tab_sublineas(id_categoria, id_linea, id_sublinea) 
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tab_descuentos_usuarios (
    id_descuento                DECIMAL(10) NOT NULL, 
    id_usuario                  DECIMAL(10) NOT NULL,
    veces_usado                 INT DEFAULT 1, --Número de veces que el usuario ha usado este descuento

	usr_insert                  DECIMAL(10)         NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT chk_veces_usado                  CHECK (veces_usado >= 1),
    FOREIGN KEY (id_descuento) 
        REFERENCES tab_descuentos(id_descuento),
    FOREIGN KEY (id_usuario) 
        REFERENCES tab_usuarios(id_usuario),   
    UNIQUE(id_descuento, id_usuario)
);

-- Índices en tabla principal
CREATE INDEX IF NOT EXISTS idx_descuentos_fechas_activo 
    ON tab_descuentos(fec_inicio, fec_fin, ind_activo);

CREATE INDEX IF NOT EXISTS idx_descuentos_codigo 
    ON tab_descuentos(codigo_descuento) 
    WHERE codigo_descuento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_descuentos_aplica_a 
    ON tab_descuentos(aplica_a, ind_activo);

CREATE INDEX IF NOT EXISTS idx_descuentos_cumpleanos 
    ON tab_descuentos(ind_es_para_cumpleanos, ind_activo) 
    WHERE ind_es_para_cumpleanos = TRUE;

CREATE INDEX IF NOT EXISTS idx_descuentos_primera_compra 
    ON tab_descuentos(solo_primera_compra, ind_activo) 
    WHERE solo_primera_compra = TRUE;



-- Índices en tabla auxiliar
CREATE INDEX IF NOT EXISTS idx_descuentos_usuarios_lookup 
    ON tab_descuentos_usuarios(id_descuento, id_usuario);

CREATE INDEX IF NOT EXISTS idx_descuentos_usuarios_fecha 
    ON tab_descuentos_usuarios(fec_insert);

-- Tabla Ordenes 
CREATE TABLE IF NOT EXISTS tab_ordenes (
    id_orden                    DECIMAL(10),
    fec_pedido                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    id_usuario                  DECIMAL(10) 		NOT NULL,
    FOREIGN KEY (id_usuario)    REFERENCES tab_usuarios(id_usuario),
    -- Campos de totales actualizados
    val_total_productos         DECIMAL(10,0) 		NOT NULL CHECK (val_total_productos >= 0),
    val_total_descuentos        DECIMAL(10,0) 		NOT NULL DEFAULT 0 CHECK (val_total_descuentos >= 0),
    val_total_pedido            DECIMAL(10,0) 		NOT NULL CHECK (val_total_pedido >= 0),
    -- Estados y configuración
    ind_estado                  DECIMAL(1) 		NOT NULL DEFAULT 1 CHECK(ind_estado >= 1 AND ind_estado <= 3),
    metodo_pago                 VARCHAR(50) 	CHECK(metodo_pago IN ('tarjeta', 'efectivo_red_pagos', 'transferencia')),
    -- Campo de descuento legacy (mantener compatibilidad)
    id_descuento                DECIMAL(10),
    FOREIGN KEY (id_descuento)  REFERENCES tab_descuentos(id_descuento),
    -- Campo para guardar detalle de descuentos aplicados
    detalle_descuentos_aplicados   JSON,
    des_observaciones           VARCHAR,
    usr_insert                  DECIMAL(10) 			NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    -- Constraint para validar coherencia de totales
    CONSTRAINT chk_totales_orden CHECK (val_total_pedido = val_total_productos - val_total_descuentos),
	PRIMARY KEY (id_orden)
);

-- 3. Tabla para Pagos/Transacciones (Actualizada para Wompi Checkout Widget)
CREATE TABLE IF NOT EXISTS tab_pagos (
    id_pago                     SERIAL PRIMARY KEY,
    id_orden                    DECIMAL(10) NOT NULL,
    FOREIGN KEY (id_orden)      REFERENCES tab_ordenes(id_orden),
    
    -- Referencia única del pago (formato synkro_{order_id}_{random})
    reference                   VARCHAR(255),                   -- Referencia única del pago
    
    -- Información del Proveedor (ahora con Wompi)
    provider_transaction_id     VARCHAR(255),                    -- ID de la transacción en Wompi (nullable inicialmente)
    -- provider_preference_id   VARCHAR(255),                   -- ELIMINADA
    provider_name               VARCHAR(50) NOT NULL DEFAULT 'wompi',
    
    -- Estado del Pago (los estados de Wompi mapean bien aquí)
    status                      VARCHAR(50) NOT NULL,           -- 'CREATED', 'PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'
    status_detail               VARCHAR(100),                   -- status_message de Wompi
    
    -- Detalles de la Transacción
    amount                      DECIMAL(12, 2) NOT NULL,
    currency_id                 VARCHAR(10) NOT NULL DEFAULT 'COP',
    installments                INTEGER,
    payment_method_type         VARCHAR(50),                    -- Tipo de método de pago (ej: 'CARD', 'NEQUI')
    payment_method_extra        JSONB,                          -- Información extra como 'card_brand', 'card_type'

    -- Información de comisiones
    fee_amount                  DECIMAL(10, 2) DEFAULT 0.00,
    net_received_amount         DECIMAL(12, 2),

    -- Timestamps
    provider_date_created       TIMESTAMP,
    provider_date_approved      TIMESTAMP,
    
    raw_response                JSONB,                           -- Respuesta cruda del proveedor (legacy)
    raw_last_event              JSONB,                           -- Último webhook/evento recibido
    
    -- Control de reintentos
    parent_payment_id           INTEGER,                         -- ID del pago padre (para tracking de reintentos)
    FOREIGN KEY (parent_payment_id) REFERENCES tab_pagos(id_pago) ON DELETE SET NULL,
    
    -- Control Interno
    estado_procesamiento        VARCHAR(20) DEFAULT 'pendiente',
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,

    -- Constraints
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_estado_procesamiento CHECK (estado_procesamiento IN ('pendiente', 'procesado', 'error', 'cancelado'))
);

-- Índices para optimización de la tabla de pagos
CREATE INDEX IF NOT EXISTS idx_pagos_orden 
    ON tab_pagos(id_orden);
CREATE INDEX IF NOT EXISTS idx_pagos_provider_transaction_id
    ON tab_pagos(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pagos_status 
    ON tab_pagos(status, estado_procesamiento);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_creacion 
    ON tab_pagos(provider_date_created DESC);

-- Índice único en reference (para búsquedas rápidas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_reference 
    ON tab_pagos(reference) 
    WHERE reference IS NOT NULL;

-- Índice único parcial para provider_transaction_id (permite múltiples NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_provider_transaction_unique 
    ON tab_pagos(provider_transaction_id, provider_name) 
    WHERE provider_transaction_id IS NOT NULL;


-- Tabla de productos de la orden
CREATE TABLE IF NOT EXISTS tab_orden_productos (
    id_orden_producto           DECIMAL(10),
    -- AÑADIDO: Columnas para la FK compuesta a tab_productos
    id_categoria_producto       DECIMAL(10) 	NOT NULL,
    id_linea_producto           DECIMAL(10) 	NOT NULL,
    id_sublinea_producto        DECIMAL(10) 	NOT NULL,
    id_producto                 DECIMAL(10) 	NOT NULL, 
    id_orden                    DECIMAL(10) 	NOT NULL,
    FOREIGN KEY (id_orden)      REFERENCES tab_ordenes(id_orden),
    -- MODIFICADO: FK a tab_productos
    FOREIGN KEY (id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto) 
        REFERENCES tab_productos(id_categoria, id_linea, id_sublinea, id_producto),
    cant_producto               INT 			NOT NULL CHECK (cant_producto > 0),
    precio_unitario_orden       DECIMAL(10,0) 	NOT NULL CHECK (precio_unitario_orden >= 0),
    subtotal                    DECIMAL(10,0) 	NOT NULL CHECK (subtotal >= 0),
    usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    -- MODIFICADO: Restricción UNIQUE para incluir todos los componentes del producto
    CONSTRAINT uq_orden_producto UNIQUE (id_orden, id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto),
    -- Constraint para validar coherencia de subtotal
    CONSTRAINT chk_subtotal_orden_producto CHECK (subtotal = cant_producto * precio_unitario_orden),
	PRIMARY KEY(id_orden_producto)
);

-- Tabla Carrito Productos
CREATE TABLE IF NOT EXISTS tab_carrito_productos (
    id_carrito_producto         SERIAL,
    id_carrito                  INT 			NOT NULL,
    -- AÑADIDO: Columnas para la FK compuesta a tab_productos
    id_categoria_producto       DECIMAL(10) 	NOT NULL,
    id_linea_producto           DECIMAL(10) 	NOT NULL,
    id_sublinea_producto        DECIMAL(10) 	NOT NULL,
    id_producto                 DECIMAL(10) 	NOT NULL,
    cantidad                    INT 			NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario_carrito     DECIMAL(7,0) 	NOT NULL CHECK (precio_unitario_carrito >= 0),
    FOREIGN KEY (id_carrito)    REFERENCES tab_carritos(id_carrito),
    -- MODIFICADO: FK a tab_productos
    FOREIGN KEY (id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto) 
    REFERENCES tab_productos(id_categoria, id_linea, id_sublinea, id_producto),
    -- MODIFICADO: Restricción UNIQUE
    CONSTRAINT uq_carrito_producto UNIQUE (id_carrito, id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto),
	usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP 		WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP 		WITHOUT TIME ZONE,
		PRIMARY KEY(id_carrito_producto)
);

-- Tabla Movimientos de Inventario
CREATE TABLE IF NOT EXISTS tab_movimientos_inventario (
    id_movimiento               SERIAL,
    -- AÑADIDO: Columnas para la FK compuesta a tab_productos
    id_categoria_producto       DECIMAL(10) 	NOT NULL,
    id_linea_producto           DECIMAL(10) 	NOT NULL,
    id_sublinea_producto        DECIMAL(10) 	NOT NULL,
    id_producto                 DECIMAL(10) 	NOT NULL,
    tipo_movimiento             VARCHAR(25) 	NOT NULL CHECK (tipo_movimiento IN ('entrada_compra', 'salida_venta', 'ajuste_incremento', 'ajuste_decremento', 'devolucion_usuario', 'devolucion_proveedor', 'inventario_inicial')),
    cantidad                    INT 			NOT NULL CHECK (cantidad >= 0),
    costo_unitario_movimiento   DECIMAL(10,2) 	DEFAULT NULL,
    stock_anterior 				INT 			NULL,
    saldo_costo_total_anterior_mov DECIMAL(12,2) NULL,
    stock_actual   				INT 			NULL,
    saldo_costo_total_actual_mov DECIMAL(12,2) NULL,
    costo_promedio_ponderado_mov DECIMAL(10,2) NULL,
    id_orden_usuario_detalle    DECIMAL(10) 	NULL,
    id_orden_compra             DECIMAL(10) 	NULL,
    descripcion                 VARCHAR,
    observaciones               VARCHAR,
    usr_insert                  DECIMAL(10) 		NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    -- MODIFICADO: FK a tab_productos
    FOREIGN KEY (id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto) 
        REFERENCES tab_productos(id_categoria, id_linea, id_sublinea, id_producto),
    FOREIGN KEY (id_orden_usuario_detalle) REFERENCES tab_orden_productos(id_orden_producto),
    FOREIGN KEY (id_orden_compra) REFERENCES tab_orden_compra_proveedor(id_orden_compra),
		PRIMARY KEY (id_movimiento)
);

CREATE TABLE IF NOT EXISTS tab_estadisticas_productos (
    -- Identificación del producto (FK compuesta)
    id_categoria                DECIMAL(10) NOT NULL,
    id_linea                    DECIMAL(10) NOT NULL,
    id_sublinea                 DECIMAL(10) NOT NULL,
    id_producto                 DECIMAL(10) NOT NULL,
    nom_producto                VARCHAR(255),
    precio_actual               DECIMAL(10,2),
    stock_actual                INT,
    producto_activo             BOOLEAN,
    -- Estadísticas de ventas
    total_ordenes               INT DEFAULT 0,              -- Número total de órdenes que incluyen este producto
    total_unidades_vendidas     INT DEFAULT 0,              -- Cantidad total de unidades vendidas
    total_ingresos              DECIMAL(15,2) DEFAULT 0,    -- Ingresos totales generados
    -- Estadísticas temporales
    ventas_mes_actual           INT DEFAULT 0,              -- Unidades vendidas en el mes actual
    ingresos_mes_actual         DECIMAL(12,2) DEFAULT 0,    -- Ingresos del mes actual
    ventas_mes_anterior         INT DEFAULT 0,              -- Unidades vendidas en el mes anterior
    ingresos_mes_anterior       DECIMAL(12,2) DEFAULT 0,    -- Ingresos del mes anterior
    -- Estadísticas de tendencias
    promedio_venta_mensual      DECIMAL(8,2) DEFAULT 0,     -- Promedio de unidades vendidas por mes
    promedio_ingreso_mensual    DECIMAL(12,2) DEFAULT 0,    -- Promedio de ingresos por mes
    precio_promedio_venta       DECIMAL(10,2) DEFAULT 0,    -- Precio promedio de venta histórico
    -- Fechas importantes
    fecha_primera_venta         DATE,                       -- Primera vez que se vendió el producto
    fecha_ultima_venta          DATE,                       -- Última vez que se vendió el producto
    mes_mejor_venta             VARCHAR(7),                 -- Mes con mejores ventas (YYYY-MM)
    mejor_venta_unidades        INT DEFAULT 0,              -- Máximo de unidades vendidas en un mes
    -- Análisis de rotación
    dias_desde_ultima_venta     INT,                        -- Días desde la última venta
    rotacion_inventario         DECIMAL(5,2) DEFAULT 0,     -- Veces que rota el inventario al año
    nivel_rotacion              VARCHAR(20),                -- ALTA, MEDIA, BAJA, SIN_VENTAS
    -- Control de actualizaciones
    ultima_actualizacion        TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    periodo_calculo             VARCHAR(7),                 -- Período del último cálculo (YYYY-MM)
    -- FK Constraint
    FOREIGN KEY (id_categoria, id_linea, id_sublinea, id_producto) 
        REFERENCES tab_productos(id_categoria, id_linea, id_sublinea, id_producto),
    -- PK
    PRIMARY KEY (id_categoria, id_linea, id_sublinea, id_producto)
);

--Tabla de CMS
CREATE TABLE IF NOT EXISTS tab_cms_content (
    id_cms_content SERIAL PRIMARY KEY,
    nom_cms_content VARCHAR NOT NULL,
    des_cms_content JSONB NOT NULL,
    num_version INTEGER DEFAULT 1,
    ind_publicado BOOLEAN DEFAULT false,
    usr_insert DECIMAL(10) NOT NULL,
    fec_insert TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update DECIMAL(10),
    fec_update TIMESTAMP WITHOUT TIME ZONE
);

-- Tabla de Favoritos (Compatible con funciones CRUD existentes)
CREATE TABLE IF NOT EXISTS tab_favoritos (
    id_usuario                  DECIMAL(10) 	NOT NULL,
    -- Columnas para la FK compuesta a tab_productos
    id_categoria_producto       DECIMAL(10) 	NOT NULL,
    id_linea_producto           DECIMAL(10) 	NOT NULL,
    id_sublinea_producto        DECIMAL(10) 	NOT NULL,
    id_producto                 DECIMAL(10) 	NOT NULL,
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    FOREIGN KEY (id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto) REFERENCES tab_productos(id_categoria, id_linea, id_sublinea, id_producto),
    PRIMARY KEY (id_usuario, id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto)
);

-- Índices para optimizar consultas de favoritos
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario_fecha 
    ON tab_favoritos(id_usuario, fec_insert DESC);

CREATE INDEX IF NOT EXISTS idx_favoritos_producto 
    ON tab_favoritos(id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto);

CREATE INDEX IF NOT EXISTS idx_favoritos_fecha 
    ON tab_favoritos(fec_insert DESC);

-- =============================================================
-- SISTEMA DE FIDELIZACIÓN - TABLAS PRINCIPALES
-- =============================================================

-- Tabla de configuración del sistema de puntos por empresa
CREATE TABLE IF NOT EXISTS tab_config_puntos_empresa (
    id_config_puntos            SERIAL PRIMARY KEY,
    pesos_por_punto             DECIMAL(10,2) NOT NULL CHECK (pesos_por_punto > 0), -- Ej: 1000 pesos = 1 punto
    ind_activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    descripcion                 VARCHAR NOT NULL DEFAULT 'Configuración de puntos por pesos gastados',
    fec_inicio_vigencia         DATE NOT NULL DEFAULT CURRENT_DATE,
    fec_fin_vigencia            DATE NULL, -- NULL = sin fecha fin
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    
    CONSTRAINT chk_fechas_vigencia_puntos CHECK (fec_fin_vigencia IS NULL OR fec_fin_vigencia >= fec_inicio_vigencia)
);

-- Tabla de puntos acumulados por usuario
CREATE TABLE IF NOT EXISTS tab_puntos_usuario (
    id_usuario                  DECIMAL(10) PRIMARY KEY,
    puntos_disponibles          INT NOT NULL DEFAULT 0 CHECK (puntos_disponibles >= 0),
    puntos_totales_ganados      INT NOT NULL DEFAULT 0 CHECK (puntos_totales_ganados >= 0),
    puntos_totales_canjeados    INT NOT NULL DEFAULT 0 CHECK (puntos_totales_canjeados >= 0),
    fec_ultimo_canje            TIMESTAMP WITHOUT TIME ZONE NULL,
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    -- Constraint para verificar consistencia de puntos
    CONSTRAINT chk_consistencia_puntos CHECK (
        puntos_disponibles = (puntos_totales_ganados - puntos_totales_canjeados)
    )
);

-- Tabla de historial de movimientos de puntos (CON TIPO_MOVIMIENTO DECIMAL)
CREATE TABLE IF NOT EXISTS tab_movimientos_puntos (
    id_movimiento_puntos        SERIAL PRIMARY KEY,
    id_usuario                  DECIMAL(10) NOT NULL,
    tipo_movimiento             DECIMAL(1) NOT NULL CHECK (tipo_movimiento IN (1, 2, 3)), 
    -- 1 = acumulacion, 2 = canje, 3 = expiracion
    cantidad_puntos             INT NOT NULL CHECK (cantidad_puntos != 0),
    puntos_disponibles_anterior INT NOT NULL CHECK (puntos_disponibles_anterior >= 0),
    puntos_disponibles_actual   INT NOT NULL CHECK (puntos_disponibles_actual >= 0),
    id_orden_origen             DECIMAL(10) NULL, -- Si los puntos vienen de una compra
    id_descuento_canjeado       DECIMAL(10) NULL, -- Si los puntos se canjearon por un descuento
    descripcion                 VARCHAR NOT NULL,
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    FOREIGN KEY (id_orden_origen) REFERENCES tab_ordenes(id_orden),
    FOREIGN KEY (id_descuento_canjeado) REFERENCES tab_descuentos(id_descuento),
    
    -- Constraints de validación según tipo de movimiento
    CONSTRAINT chk_acumulacion_positiva CHECK (
        tipo_movimiento != 1 OR cantidad_puntos > 0
    ),
    CONSTRAINT chk_canje_negativo CHECK (
        tipo_movimiento != 2 OR cantidad_puntos < 0
    ),
    CONSTRAINT chk_orden_solo_acumulacion CHECK (
        id_orden_origen IS NULL OR tipo_movimiento = 1
    ),
    CONSTRAINT chk_descuento_solo_canje CHECK (
        id_descuento_canjeado IS NULL OR tipo_movimiento = 2
    )
);

-- Tabla para registrar canjes de puntos por descuentos
CREATE TABLE IF NOT EXISTS tab_canjes_puntos_descuentos (
    id_canje                    SERIAL PRIMARY KEY,
    id_usuario                  DECIMAL(10) NOT NULL,
    id_descuento                DECIMAL(10) NOT NULL,
    puntos_utilizados           INT NOT NULL CHECK (puntos_utilizados > 0),
    id_orden_aplicado           DECIMAL(10) NULL, -- Si ya se aplicó a una orden específica
    fec_expiracion_canje        TIMESTAMP WITHOUT TIME ZONE NULL, -- Fecha límite para usar el descuento canjeado
    ind_utilizado               BOOLEAN NOT NULL DEFAULT FALSE,
    fec_utilizacion             TIMESTAMP WITHOUT TIME ZONE NULL,
    usr_insert                  DECIMAL(10) NOT NULL,
    fec_insert                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    usr_update                  DECIMAL(10),
    fec_update                  TIMESTAMP WITHOUT TIME ZONE,
    
    FOREIGN KEY (id_usuario) REFERENCES tab_usuarios(id_usuario),
    FOREIGN KEY (id_descuento) REFERENCES tab_descuentos(id_descuento),
    FOREIGN KEY (id_orden_aplicado) REFERENCES tab_ordenes(id_orden),
    
    CONSTRAINT chk_utilizacion_coherente CHECK (
        (ind_utilizado = FALSE AND fec_utilizacion IS NULL AND id_orden_aplicado IS NULL) OR
        (ind_utilizado = TRUE AND fec_utilizacion IS NOT NULL)
    ),
    CONSTRAINT chk_fecha_expiracion CHECK (
        fec_expiracion_canje IS NULL OR fec_expiracion_canje > fec_insert
    )
);



-- =============================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS DE FIDELIZACIÓN
-- =============================================================

-- Índices para optimizar consultas
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

