-- Envia shipping + checkout shipping metadata + order totals with shipping cost.
-- Apply after backing up: psql ... -f migrations/add_envia_shipping_tables.sql

-- 1) Shipping row per order (label / tracking)
CREATE TABLE IF NOT EXISTS tab_ordenes_envio (
    id_envio            DECIMAL(10) NOT NULL,
    id_orden            DECIMAL(10) NOT NULL REFERENCES tab_ordenes(id_orden) ON DELETE CASCADE,
    id_direccion        DECIMAL NOT NULL REFERENCES tab_direcciones_usuario(id_direccion),
    carrier             VARCHAR(80) NOT NULL,
    service             VARCHAR(120) NOT NULL,
    costo_envio         DECIMAL(10, 0) NOT NULL DEFAULT 0 CHECK (costo_envio >= 0),
    tracking_number     VARCHAR(120),
    tracking_url        VARCHAR(512),
    label_url           VARCHAR(1024),
    estado_envio        VARCHAR(120),
    fecha_generacion    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_entrega       TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id_envio)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ordenes_envio_id_orden_unique ON tab_ordenes_envio(id_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_envio_tracking ON tab_ordenes_envio(tracking_number)
    WHERE tracking_number IS NOT NULL;

-- 2) Checkout session shipping snapshot (keyed by Wompi reference)
CREATE TABLE IF NOT EXISTS tab_checkout_shipping (
    reference           VARCHAR(255) NOT NULL PRIMARY KEY,
    id_direccion        DECIMAL NOT NULL,
    shipping_carrier    VARCHAR(80) NOT NULL,
    shipping_service    VARCHAR(120) NOT NULL,
    shipping_cost       DECIMAL(12, 2) NOT NULL CHECK (shipping_cost >= 0),
    weight_kg           NUMERIC(10, 3) NOT NULL CHECK (weight_kg > 0),
    length_cm           NUMERIC(10, 2) NOT NULL CHECK (length_cm > 0),
    width_cm            NUMERIC(10, 2) NOT NULL CHECK (width_cm > 0),
    height_cm           NUMERIC(10, 2) NOT NULL CHECK (height_cm > 0),
    usr_insert          DECIMAL(10) NOT NULL,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_shipping_fec ON tab_checkout_shipping(fec_insert DESC);

-- 3) Order: shipping cost + link to envio row
ALTER TABLE tab_ordenes
    ADD COLUMN IF NOT EXISTS val_costo_envio DECIMAL(10, 0) NOT NULL DEFAULT 0;

ALTER TABLE tab_ordenes
    ADD COLUMN IF NOT EXISTS id_envio DECIMAL(10) NULL REFERENCES tab_ordenes_envio(id_envio);

ALTER TABLE tab_ordenes DROP CONSTRAINT IF EXISTS chk_totales_orden;
ALTER TABLE tab_ordenes ADD CONSTRAINT chk_totales_orden CHECK (
    val_total_pedido = val_total_productos - val_total_descuentos + val_costo_envio
);
