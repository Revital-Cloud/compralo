-- Añade id_proveedor a tab_products para asociar producto a proveedor (opcional).
-- Debe ejecutarse después de que existan tab_products y tab_proveedores.

ALTER TABLE tab_products
  ADD COLUMN IF NOT EXISTS id_proveedor DECIMAL(10) NULL REFERENCES tab_proveedores(id_proveedor);

CREATE INDEX IF NOT EXISTS idx_tab_products_id_proveedor ON tab_products(id_proveedor);

COMMENT ON COLUMN tab_products.id_proveedor IS 'Proveedor del producto; opcional.';
