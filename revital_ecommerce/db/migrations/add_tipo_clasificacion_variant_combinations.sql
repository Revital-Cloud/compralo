/*
 * Migración: Agregar campo tipo_clasificacion a tab_product_variant_combinations
 * 
 * Este campo permite clasificar las variantes por tipo/clasificación (ej. "Estándar", "Premium", "Básico")
 * y se guarda por defecto junto con precio y stock.
 */

-- Agregar columna tipo_clasificacion (opcional, VARCHAR)
ALTER TABLE tab_product_variant_combinations
ADD COLUMN IF NOT EXISTS tipo_clasificacion VARCHAR(100) NULL;

-- Comentario para documentación
COMMENT ON COLUMN tab_product_variant_combinations.tipo_clasificacion IS 'Tipo o clasificación de la variante (ej. Estándar, Premium, Básico). Campo opcional que se guarda junto con precio y stock.';
