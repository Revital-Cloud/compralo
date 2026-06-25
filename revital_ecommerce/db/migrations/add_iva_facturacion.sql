-- Migración: IVA y base para facturación electrónica (Colombia)
-- Fecha: 2026-06-19
-- Descripción: Agrega el modelo fiscal para IVA y los cimientos de facturación
--              electrónica DIAN, de forma 100% ADITIVA (no rompe el flujo actual).
--
--   Decisión de diseño: los precios YA INCLUYEN IVA (precio al público con IVA
--   incluido, estándar B2C en Colombia). Por lo tanto el total que paga el cliente
--   NO cambia: el IVA se DESCOMPONE (base + IVA) solo para reportes y la factura.
--   Esto mantiene válido el CHECK chk_totales_orden de tab_ordenes.
--
--   Contenido:
--     1. tab_uvt                -> UVT vigente por año (parámetro fiscal)
--     2. tab_tarifas_iva        -> catálogo de tarifas de IVA versionadas
--     3. tab_products.id_tarifa_iva -> clasificación fiscal por producto
--     4. tab_ordenes (columnas) -> desglose informativo de IVA (nullable)
--     5. Seeds: UVT 2025/2026 y tarifas 19% / 5% / Exento / Excluido

-- =========================================================================
-- 1. UVT (Unidad de Valor Tributario) por año
--    Fuente 2026: Resolución DIAN 000238 del 15-dic-2025 ($52.374)
-- =========================================================================
CREATE TABLE IF NOT EXISTS tab_uvt (
    anio            INT                         PRIMARY KEY,
    val_uvt         DECIMAL(12,2)               NOT NULL CHECK (val_uvt > 0),
    des_resolucion  VARCHAR(160)                NOT NULL,
    usr_insert      DECIMAL(10)                 NOT NULL DEFAULT 0,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 2. Catálogo de tarifas de IVA (versionadas por vigencia)
--    tipo_iva distingue los 3 estados fiscales que NO son equivalentes:
--      GRAVADO  -> cobra IVA (19% o 5%)
--      EXENTO   -> 0% pero con derecho a IVA descontable
--      EXCLUIDO -> sin IVA y sin derecho a descontable
-- =========================================================================
CREATE TABLE IF NOT EXISTS tab_tarifas_iva (
    id_tarifa_iva       DECIMAL(10)                 PRIMARY KEY,
    cod_tarifa          VARCHAR(20)                 NOT NULL UNIQUE,
    des_tarifa          VARCHAR(120)                NOT NULL,
    val_porcentaje      DECIMAL(6,4)                NOT NULL CHECK (val_porcentaje >= 0),
    tipo_iva            VARCHAR(20)                 NOT NULL
                        CHECK (tipo_iva IN ('GRAVADO','EXENTO','EXCLUIDO')),
    cod_dian            VARCHAR(5)                  NOT NULL DEFAULT '01',  -- código impuesto DIAN (01=IVA)
    fec_vigencia_desde  DATE                        NOT NULL,
    fec_vigencia_hasta  DATE                        NULL,
    is_active           BOOLEAN                     NOT NULL DEFAULT TRUE,
    usr_insert          DECIMAL(10)                 NOT NULL DEFAULT 0,
    fec_insert          TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update          DECIMAL(10),
    fec_update          TIMESTAMP WITHOUT TIME ZONE,
    -- Coherencia: GRAVADO debe tener % > 0; EXENTO/EXCLUIDO deben ser 0%
    CONSTRAINT chk_tarifa_iva_coherente CHECK (
        (tipo_iva = 'GRAVADO'  AND val_porcentaje > 0) OR
        (tipo_iva IN ('EXENTO','EXCLUIDO') AND val_porcentaje = 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_tarifas_iva_activa
    ON tab_tarifas_iva(is_active) WHERE is_active = TRUE;

-- =========================================================================
-- 3. Clasificación fiscal por producto (nullable -> default a tarifa general)
-- =========================================================================
ALTER TABLE tab_products
    ADD COLUMN IF NOT EXISTS id_tarifa_iva DECIMAL(10) NULL
        REFERENCES tab_tarifas_iva(id_tarifa_iva);

CREATE INDEX IF NOT EXISTS idx_products_tarifa_iva
    ON tab_products(id_tarifa_iva) WHERE id_tarifa_iva IS NOT NULL;

-- =========================================================================
-- 4. Desglose informativo de IVA en la orden (NULLABLE => no toca chk_totales_orden)
--    Para órdenes con IVA incluido se cumple:
--      val_total_productos = val_base_gravable + val_total_iva + val_total_excluido
-- =========================================================================
ALTER TABLE tab_ordenes
    ADD COLUMN IF NOT EXISTS val_base_gravable  DECIMAL(10,0) NULL CHECK (val_base_gravable  >= 0),
    ADD COLUMN IF NOT EXISTS val_total_iva      DECIMAL(10,0) NULL CHECK (val_total_iva      >= 0),
    ADD COLUMN IF NOT EXISTS val_total_excluido DECIMAL(10,0) NULL CHECK (val_total_excluido >= 0);

-- =========================================================================
-- 5. SEEDS
-- =========================================================================

-- UVT 2025 y 2026
INSERT INTO tab_uvt (anio, val_uvt, des_resolucion) VALUES
    (2025, 49799.00, 'Resolución DIAN 000193 de 2024'),
    (2026, 52374.00, 'Resolución DIAN 000238 del 15-dic-2025')
ON CONFLICT (anio) DO NOTHING;

-- Tarifas de IVA (IDs reservados 1..4)
INSERT INTO tab_tarifas_iva
    (id_tarifa_iva, cod_tarifa, des_tarifa, val_porcentaje, tipo_iva, cod_dian, fec_vigencia_desde)
VALUES
    (1, 'IVA_19',   'IVA general 19%',          0.1900, 'GRAVADO',  '01', DATE '2017-01-01'),
    (2, 'IVA_5',    'IVA reducido 5%',          0.0500, 'GRAVADO',  '01', DATE '2017-01-01'),
    (3, 'EXENTO',   'Exento (0% con derecho)',  0.0000, 'EXENTO',   '01', DATE '2017-01-01'),
    (4, 'EXCLUIDO', 'Excluido (sin IVA)',       0.0000, 'EXCLUIDO', '01', DATE '2017-01-01')
ON CONFLICT (id_tarifa_iva) DO NOTHING;

-- Por defecto, los productos sin clasificar quedan como IVA general 19%.
-- (Ajustar por contador: marcar exentos/excluidos/5% según corresponda.)
UPDATE tab_products
    SET id_tarifa_iva = 1
    WHERE id_tarifa_iva IS NULL;
