-- Migración: Agregar variant_id a tab_product_images para imágenes por variante
-- Fecha: 2026-02
-- Regla: variant_id IS NULL = imagen del producto; variant_id NOT NULL = imagen de la variante.
-- product_id se mantiene. Los registros existentes quedan con variant_id = NULL (imágenes de producto).

ALTER TABLE tab_product_images
ADD COLUMN IF NOT EXISTS variant_id DECIMAL(10) NULL
REFERENCES tab_product_variants(id);

CREATE INDEX IF NOT EXISTS idx_tab_product_images_variant_id
ON tab_product_images(variant_id);
