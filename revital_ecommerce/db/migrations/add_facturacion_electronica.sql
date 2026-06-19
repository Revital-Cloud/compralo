-- Migración: Facturación electrónica DIAN (capa sobre el IVA ya existente)
-- Fecha: 2026-06-19
-- Descripción: Tablas para emitir facturas electrónicas a través de un proveedor
--              tecnológico (Factus/Alegra/...) vía la abstracción BillingProvider.
--              100% ADITIVA. Cada instancia Revital = un cliente (un NIT), por eso
--              la resolución de numeración no necesita tenant_id.
--
--   Tablas:
--     1. tab_resoluciones_dian -> resolución de numeración + consecutivo atómico
--     2. tab_facturas          -> factura electrónica (evidencia fiscal: CUFE, XML)
--     3. tab_factura_lineas     -> snapshot inmutable de líneas (IVA congelado)
--     4. tab_notas_credito      -> devoluciones / anulaciones (CUDE)
--
--   El consecutivo se asigna con SELECT ... FOR UPDATE sobre next_number
--   (ver invoice_service) para garantizar unicidad sin huecos.

-- =========================================================================
-- 1. Resolución de numeración autorizada por la DIAN
-- =========================================================================
CREATE TABLE IF NOT EXISTS tab_resoluciones_dian (
    id_resolucion       DECIMAL(10)                 PRIMARY KEY,
    num_resolucion      VARCHAR(60)                 NOT NULL,
    prefijo             VARCHAR(10)                 NOT NULL DEFAULT '',
    rango_desde         BIGINT                      NOT NULL CHECK (rango_desde >= 0),
    rango_hasta         BIGINT                      NOT NULL CHECK (rango_hasta >= rango_desde),
    consecutivo_actual  BIGINT                      NOT NULL,  -- siguiente número a asignar
    clave_tecnica       VARCHAR(120)                NOT NULL,  -- entra al cálculo del CUFE
    fec_vigencia_desde  DATE                        NOT NULL,
    fec_vigencia_hasta  DATE                        NOT NULL,
    is_active           BOOLEAN                     NOT NULL DEFAULT TRUE,
    usr_insert          DECIMAL(10)                 NOT NULL DEFAULT 0,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update          DECIMAL(10),
    fec_update          TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT chk_consecutivo_en_rango
        CHECK (consecutivo_actual >= rango_desde AND consecutivo_actual <= rango_hasta + 1)
);

-- =========================================================================
-- 2. Factura electrónica
-- =========================================================================
CREATE TABLE IF NOT EXISTS tab_facturas (
    id_factura          DECIMAL(10)                 PRIMARY KEY,
    id_orden            DECIMAL(10)                 NOT NULL REFERENCES tab_ordenes(id_orden),
    id_resolucion       DECIMAL(10)                 NULL REFERENCES tab_resoluciones_dian(id_resolucion),
    prefijo             VARCHAR(10)                 NOT NULL DEFAULT '',
    consecutivo         BIGINT                      NULL,       -- número dentro del rango
    -- Totales (pesos enteros). Coherentes con el desglose de IVA de la orden.
    val_base_gravable   DECIMAL(12,0)               NOT NULL DEFAULT 0 CHECK (val_base_gravable  >= 0),
    val_total_iva       DECIMAL(12,0)               NOT NULL DEFAULT 0 CHECK (val_total_iva       >= 0),
    val_total_excluido  DECIMAL(12,0)               NOT NULL DEFAULT 0 CHECK (val_total_excluido  >= 0),
    val_total_descuento DECIMAL(12,0)               NOT NULL DEFAULT 0 CHECK (val_total_descuento >= 0),
    val_total           DECIMAL(12,0)               NOT NULL CHECK (val_total >= 0),
    -- Estado del ciclo de validación previa DIAN
    estado_dian         VARCHAR(20)                 NOT NULL DEFAULT 'PENDING'
                        CHECK (estado_dian IN ('PENDING','SENT','ACCEPTED','REJECTED')),
    -- Evidencia fiscal (se llena tras la validación)
    cufe                VARCHAR(160)                NULL,
    qr_url              VARCHAR(512)                NULL,
    pdf_url             VARCHAR(512)                NULL,
    xml_factura         TEXT                        NULL,       -- XML UBL firmado (base64 o texto)
    -- Metadatos del proveedor
    proveedor           VARCHAR(30)                 NOT NULL DEFAULT 'mock',  -- mock|factus|alegra
    ambiente            VARCHAR(20)                 NOT NULL DEFAULT 'sandbox',
    referencia_externa  VARCHAR(120)                NULL,       -- reference_code enviado al proveedor
    respuesta_proveedor JSONB                       NULL,       -- respuesta cruda (auditoría)
    error_mensaje       VARCHAR(1000)               NULL,
    usr_insert          DECIMAL(10)                 NOT NULL DEFAULT 0,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update          DECIMAL(10),
    fec_update          TIMESTAMP WITHOUT TIME ZONE,
    -- Idempotencia: una factura "viva" por orden (las rechazadas pueden reintentarse)
    CONSTRAINT uq_factura_consecutivo UNIQUE (prefijo, consecutivo)
);

CREATE INDEX IF NOT EXISTS idx_facturas_orden  ON tab_facturas(id_orden);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON tab_facturas(estado_dian);
-- Solo puede existir una factura no-rechazada por orden (idempotencia de emisión)
CREATE UNIQUE INDEX IF NOT EXISTS idx_facturas_orden_viva
    ON tab_facturas(id_orden) WHERE estado_dian <> 'REJECTED';

-- =========================================================================
-- 3. Líneas de la factura (snapshot inmutable; IVA congelado al emitir)
-- =========================================================================
CREATE TABLE IF NOT EXISTS tab_factura_lineas (
    id_factura_linea    DECIMAL(10)                 PRIMARY KEY,
    id_factura          DECIMAL(10)                 NOT NULL REFERENCES tab_facturas(id_factura) ON DELETE CASCADE,
    descripcion         VARCHAR(300)                NOT NULL,
    cantidad            INT                         NOT NULL CHECK (cantidad > 0),
    precio_unitario     DECIMAL(12,0)               NOT NULL CHECK (precio_unitario >= 0),  -- bruto (IVA incl.)
    tipo_iva            VARCHAR(20)                 NOT NULL CHECK (tipo_iva IN ('GRAVADO','EXENTO','EXCLUIDO')),
    porcentaje_iva      DECIMAL(6,4)                NOT NULL DEFAULT 0,  -- congelado, p.ej. 0.1900
    base_gravable       DECIMAL(12,0)               NOT NULL DEFAULT 0,
    val_iva             DECIMAL(12,0)               NOT NULL DEFAULT 0,
    total_linea         DECIMAL(12,0)               NOT NULL CHECK (total_linea >= 0),
    usr_insert          DECIMAL(10)                 NOT NULL DEFAULT 0,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factura_lineas_factura ON tab_factura_lineas(id_factura);

-- =========================================================================
-- 4. Notas crédito (devoluciones / anulaciones). CUDE = CUFE de la nota.
-- =========================================================================
CREATE TABLE IF NOT EXISTS tab_notas_credito (
    id_nota_credito     DECIMAL(10)                 PRIMARY KEY,
    id_factura          DECIMAL(10)                 NOT NULL REFERENCES tab_facturas(id_factura),
    cod_concepto        VARCHAR(5)                  NOT NULL,  -- catálogo DIAN (1=devolución, 2=anulación, 4=descuento...)
    des_concepto        VARCHAR(200)                NULL,
    val_nota            DECIMAL(12,0)               NOT NULL CHECK (val_nota >= 0),
    estado_dian         VARCHAR(20)                 NOT NULL DEFAULT 'PENDING'
                        CHECK (estado_dian IN ('PENDING','SENT','ACCEPTED','REJECTED')),
    cude                VARCHAR(160)                NULL,
    pdf_url             VARCHAR(512)                NULL,
    xml_nota            TEXT                        NULL,
    proveedor           VARCHAR(30)                 NOT NULL DEFAULT 'mock',
    ambiente            VARCHAR(20)                 NOT NULL DEFAULT 'sandbox',
    respuesta_proveedor JSONB                       NULL,
    usr_insert          DECIMAL(10)                 NOT NULL DEFAULT 0,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update          DECIMAL(10),
    fec_update          TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notas_credito_factura ON tab_notas_credito(id_factura);
