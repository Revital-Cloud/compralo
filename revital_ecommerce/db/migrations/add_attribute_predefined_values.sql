-- Migración: Valores predefinidos para atributos y swatches de color
-- Fecha: 2026-02
-- 1) tab_attributes.has_predefined_values
-- 2) tab_attribute_values (valores por atributo con hex_color, sort_order)
-- 3) tab_product_variant_attributes.attribute_value_id (opcional)

-- 1. Extender tab_attributes
ALTER TABLE tab_attributes
ADD COLUMN IF NOT EXISTS has_predefined_values BOOLEAN DEFAULT FALSE;

-- 2. Crear tab_attribute_values (auditoría: usr_insert, fec_insert, usr_update, fec_update)
CREATE TABLE IF NOT EXISTS tab_attribute_values (
    id              DECIMAL(10)                 PRIMARY KEY,
    attribute_id    DECIMAL(10)                 NOT NULL REFERENCES tab_attributes(id) ON DELETE CASCADE,
    value           VARCHAR                     NOT NULL,
    hex_color       VARCHAR                     NULL,
    sort_order      INT                         DEFAULT 0,
    is_active       BOOLEAN                     DEFAULT TRUE,
    usr_insert      DECIMAL(10)                 NOT NULL,
    fec_insert      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    usr_update      DECIMAL(10),
    fec_update      TIMESTAMP WITHOUT TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_tab_attribute_values_attribute_id
ON tab_attribute_values(attribute_id);

-- 3. Extender tab_product_variant_attributes
ALTER TABLE tab_product_variant_attributes
ADD COLUMN IF NOT EXISTS attribute_value_id DECIMAL(10) NULL
REFERENCES tab_attribute_values(id);

CREATE INDEX IF NOT EXISTS idx_tab_product_variant_attributes_attribute_value_id
ON tab_product_variant_attributes(attribute_value_id)
WHERE attribute_value_id IS NOT NULL;
