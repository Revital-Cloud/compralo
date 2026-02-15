/*
 * Índices para optimizar fun_filter_products (tab_products, tab_product_variants, tab_categories).
 * tab_productos/tab_categorias/tab_lineas/tab_sublineas ya no existen.
 */
-- products: categoría, marca, nombre, activo
CREATE INDEX IF NOT EXISTS idx_products_category_active ON tab_products (category_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_marca_active ON tab_products (id_marca, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_name ON tab_products (name) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_category_marca ON tab_products (category_id, id_marca, is_active) WHERE is_active = TRUE;
-- Búsqueda por nombre (opcional GIN para full-text)
-- CREATE INDEX IF NOT EXISTS idx_products_name_gin ON tab_products USING gin (to_tsvector('spanish', name)) WHERE is_active = TRUE;
-- categories
CREATE INDEX IF NOT EXISTS idx_categories_active ON tab_categories (id, parent_id) WHERE is_active = TRUE;
-- product_variants (precio/stock ya indexados por product_id en schema principal)
-- Actualizar estadísticas
ANALYZE tab_products;
ANALYZE tab_categories;
ANALYZE tab_product_variants;
