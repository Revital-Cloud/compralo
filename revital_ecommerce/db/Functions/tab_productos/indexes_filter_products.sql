/*
 * Índices para optimizar fun_filter_products (tab_products, variant_combinations/groups, tab_categories).
 */
-- products: categoría, marca, nombre, activo
CREATE INDEX IF NOT EXISTS idx_products_category_active ON tab_products (category_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_marca_active ON tab_products (id_marca, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_name ON tab_products (name) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_category_marca ON tab_products (category_id, id_marca, is_active) WHERE is_active = TRUE;
-- categories
CREATE INDEX IF NOT EXISTS idx_categories_active ON tab_categories (id, parent_id) WHERE is_active = TRUE;
-- Actualizar estadísticas
ANALYZE tab_products;
ANALYZE tab_categories;
ANALYZE tab_product_variant_combinations;
ANALYZE tab_product_variant_groups;
