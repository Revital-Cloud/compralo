-- =========================================
-- DELETE: Dejar solo tab_roles y tab_usuarios
-- =========================================
-- Borra todos los registros de catálogo, órdenes, etc.
-- Mantiene intactos: tab_roles, tab_usuarios
-- Orden respetando claves foráneas.
-- =========================================

-- Hijos de órdenes / movimientos / carrito
DELETE FROM tab_movimientos_inventario;
DELETE FROM tab_carrito_productos;
DELETE FROM tab_orden_productos;
DELETE FROM tab_pagos;
DELETE FROM tab_comentarios;
DELETE FROM tab_canjes_puntos_descuentos;
DELETE FROM tab_movimientos_puntos;
DELETE FROM tab_puntos_usuario;
DELETE FROM tab_descuentos_usuarios;
DELETE FROM tab_ordenes;
DELETE FROM tab_descuentos;
DELETE FROM tab_favoritos;
DELETE FROM tab_orden_compra_proveedor;
DELETE FROM tab_estadisticas_productos;
DELETE FROM tab_estadisticas_categorias;

-- Variantes e imágenes de productos
DELETE FROM tab_product_variant_attributes;
DELETE FROM tab_product_images;
DELETE FROM tab_product_variants;
DELETE FROM tab_products;

-- Categorías y atributos
DELETE FROM tab_category_attributes;
DELETE FROM tab_attribute_values;
DELETE FROM tab_attributes;
DELETE FROM tab_categories;

-- Carritos, direcciones, métodos de pago
DELETE FROM tab_carritos;
DELETE FROM tab_direcciones_usuario;
DELETE FROM tab_metodos_pago_usuario;

-- Marcas y proveedores
DELETE FROM tab_proveedores;
DELETE FROM tab_marcas;

-- Otros
DELETE FROM tab_cms_content;
DELETE FROM tab_config_puntos_empresa;
DELETE FROM tab_reg_del;

-- Opcionales (solo si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_alertas_kpi') THEN DELETE FROM tab_alertas_kpi; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_compartir_dashboards') THEN DELETE FROM tab_compartir_dashboards; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_widgets_dashboard') THEN DELETE FROM tab_widgets_dashboard; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_dashboards_usuarios') THEN DELETE FROM tab_dashboards_usuarios; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_valores_kpi_cache') THEN DELETE FROM tab_valores_kpi_cache; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tab_kpis_maestros') THEN DELETE FROM tab_kpis_maestros; END IF;
END $$;

SELECT 'Delete listo. Solo quedan tab_roles y tab_usuarios.' AS mensaje;
SELECT (SELECT COUNT(*) FROM tab_roles) AS roles, (SELECT COUNT(*) FROM tab_usuarios) AS usuarios;
