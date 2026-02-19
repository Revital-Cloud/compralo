-- =========================================
-- TRUNCATE: Dejar solo tab_roles y tab_usuarios
-- =========================================
-- Vacía todas las tablas de catálogo, órdenes, carritos, etc.
-- Mantiene intactos: tab_roles, tab_usuarios
-- Ejecutar desde la raíz del repo: psql -U ... -d ... -f revital_ecommerce/db/scripts/truncate_keep_roles_users.sql
-- =========================================

-- Desactivar triggers temporalmente (evita errores en FKs durante truncate)
SET session_replication_role = replica;

-- Orden: primero tablas que dependen de otras (hojas), al final las raíz.
-- CASCADE vacía también tablas con FK hacia las listadas (por si añadiste más).
TRUNCATE TABLE tab_movimientos_inventario RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_carrito_productos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_orden_productos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_pagos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_comentarios RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_canjes_puntos_descuentos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_movimientos_puntos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_puntos_usuario RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_descuentos_usuarios RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_ordenes RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_descuentos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_favoritos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_orden_compra_proveedor RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_estadisticas_productos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_estadisticas_categorias RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_product_variant_attributes RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_product_images RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_product_variants RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_products RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_category_attributes RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_attribute_values RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_attributes RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_carritos RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_direcciones_usuario RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_metodos_pago_usuario RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_proveedores RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_marcas RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_cms_content RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_config_puntos_empresa RESTART IDENTITY CASCADE;
TRUNCATE TABLE tab_reg_del RESTART IDENTITY CASCADE;

-- Tablas opcionales (si existen en tu esquema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_alertas_kpi') THEN
    TRUNCATE TABLE tab_alertas_kpi RESTART IDENTITY CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_compartir_dashboards') THEN
    TRUNCATE TABLE tab_compartir_dashboards RESTART IDENTITY CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_widgets_dashboard') THEN
    TRUNCATE TABLE tab_widgets_dashboard RESTART IDENTITY CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_dashboards_usuarios') THEN
    TRUNCATE TABLE tab_dashboards_usuarios RESTART IDENTITY CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_valores_kpi_cache') THEN
    TRUNCATE TABLE tab_valores_kpi_cache RESTART IDENTITY CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_kpis_maestros') THEN
    TRUNCATE TABLE tab_kpis_maestros RESTART IDENTITY CASCADE;
  END IF;
END $$;

-- Reactivar triggers
SET session_replication_role = DEFAULT;

-- Confirmación
SELECT 'Truncate listo. Quedan solo tab_roles y tab_usuarios con datos.' AS mensaje;
SELECT (SELECT COUNT(*) FROM tab_roles) AS roles, (SELECT COUNT(*) FROM tab_usuarios) AS usuarios;
