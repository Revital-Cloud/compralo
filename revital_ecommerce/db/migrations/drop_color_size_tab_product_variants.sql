-- Quita columnas color y size de tab_product_variants.
-- Color y talla pasan a gestionarse solo por tab_product_variant_attributes (atributos).
-- Idempotente: seguro ejecutar en bases ya migradas.
-- Tras aplicar, ejecutar también: Functions/tab_productos/fun_insert_product_variant.sql

ALTER TABLE tab_product_variants DROP COLUMN IF EXISTS color;
ALTER TABLE tab_product_variants DROP COLUMN IF EXISTS size;
