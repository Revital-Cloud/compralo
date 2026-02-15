-- =========================================
-- SEED DATA - Revital E-commerce
-- =========================================
-- Ejecutar después de aplicar el esquema (db_revital.sql), funciones y triggers.
-- Las tablas usan prefijo tab_ y auditoría (usr_insert; fec_insert lo rellena el trigger).
-- Usuario de auditoría: 1 (sistema).
-- =========================================

-- =========================================
-- ROLES (tab_roles: id_rol, nom_rol, des_rol, usr_insert, fec_insert sin DEFAULT)
-- =========================================
INSERT INTO tab_roles (id_rol, nom_rol, des_rol, usr_insert, fec_insert) VALUES
(1, 'admin', 'Administrador del sistema', 1, NOW()),
(2, 'usuario', 'Usuario cliente', 1, NOW())
ON CONFLICT (id_rol) DO NOTHING;

-- =========================================
-- USUARIOS (tab_usuarios: fec_insert sin DEFAULT; ind_genero, cel_usuario obligatorios)
-- =========================================
INSERT INTO tab_usuarios (id_usuario, nom_usuario, ape_usuario, email_usuario, password_usuario, id_rol, ind_genero, cel_usuario, ind_activo, usr_insert, fec_insert) VALUES
(1, 'Admin Principal', 'Sistema', 'admin@tienda.com', 'hash_admin', 1, true, '3000000001', true, 1, NOW()),
(2, 'Juan', 'Perez', 'juan@correo.com', 'hash1', 2, true, '3000000002', true, 1, NOW()),
(3, 'Maria', 'Gomez', 'maria@correo.com', 'hash2', 2, false, '3000000003', true, 1, NOW()),
(4, 'Carlos', 'Ruiz', 'carlos@correo.com', 'hash3', 2, true, '3000000004', true, 1, NOW()),
(5, 'Ana', 'Torres', 'ana@correo.com', 'hash4', 2, false, '3000000005', true, 1, NOW())
ON CONFLICT (id_usuario) DO NOTHING;

-- =========================================
-- CATEGORÍAS (tab_categories: id, name, slug, parent_id, is_active, usr_insert)
-- =========================================
INSERT INTO tab_categories (id, name, slug, parent_id, is_active, usr_insert) VALUES
(1, 'Tecnologia', 'tecnologia', NULL, true, 1),
(2, 'Celulares', 'celulares', 1, true, 1),
(3, 'Laptops', 'laptops', 1, true, 1),
(4, 'Ropa', 'ropa', NULL, true, 1),
(5, 'Camisetas', 'camisetas', 4, true, 1)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- PRODUCTOS (tab_products: id, category_id, name, slug, description, id_marca, is_active, usr_insert)
-- =========================================
INSERT INTO tab_products (id, category_id, name, slug, description, id_marca, is_active, usr_insert) VALUES
(1, 2, 'iPhone 15', 'iphone-15', 'Smartphone Apple', NULL, true, 1),
(2, 2, 'Samsung Galaxy S24', 'samsung-galaxy-s24', 'Smartphone Samsung', NULL, true, 1),
(3, 3, 'MacBook Air M3', 'macbook-air-m3', 'Laptop Apple', NULL, true, 1),
(4, 5, 'Camiseta Negra', 'camiseta-negra', 'Camiseta algodón', NULL, true, 1),
(5, 5, 'Camiseta Blanca', 'camiseta-blanca', 'Camiseta básica', NULL, true, 1)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- VARIANTES DE PRODUCTO (tab_product_variants)
-- =========================================
INSERT INTO tab_product_variants (id, product_id, sku, price, stock, is_active, color, size, usr_insert) VALUES
(1, 1, 'IP15-128-BLK', 4500000, 10, true, NULL, NULL, 1),
(2, 2, 'SGS24-256-GRY', 4200000, 8, true, NULL, NULL, 1),
(3, 3, 'MBA-M3-512', 6500000, 5, true, NULL, NULL, 1),
(4, 4, 'CAM-NEG-M', 50000, 20, true, 'Negro', 'M', 1),
(5, 5, 'CAM-BLA-L', 52000, 18, true, 'Blanco', 'L', 1)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- IMÁGENES DE PRODUCTO (tab_product_images: image_url, is_main, sort_order)
-- =========================================
INSERT INTO tab_product_images (id, product_id, image_url, is_main, sort_order, usr_insert) VALUES
(1, 1, '/img/products/iphone15.jpg', true, 1, 1),
(2, 2, '/img/products/galaxy-s24.jpg', true, 1, 1),
(3, 3, '/img/products/macbook-m3.jpg', true, 1, 1),
(4, 4, '/img/products/camiseta-negra.jpg', true, 1, 1),
(5, 5, '/img/products/camiseta-blanca.jpg', true, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- ATRIBUTOS (tab_attributes: name, data_type = text|number|boolean; sin slug)
-- =========================================
INSERT INTO tab_attributes (id, name, data_type, usr_insert) VALUES
(1, 'Color', 'text', 1),
(2, 'Tamaño', 'text', 1),
(3, 'Almacenamiento', 'text', 1),
(4, 'RAM', 'text', 1),
(5, 'Procesador', 'text', 1)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- ATRIBUTOS POR VARIANTE (tab_product_variant_attributes: value_text / value_number / value_boolean)
-- No existe tab_attribute_values; el valor va en value_text.
-- =========================================
INSERT INTO tab_product_variant_attributes (id, variant_id, attribute_id, value_text, usr_insert) VALUES
(1, 1, 3, '128GB', 1),   -- iPhone almacenamiento
(2, 4, 1, 'Negro', 1),   -- camiseta negra color
(3, 4, 2, 'M', 1),       -- camiseta negra talla
(4, 5, 1, 'Blanco', 1),  -- camiseta blanca color
(5, 5, 2, 'L', 1)        -- camiseta blanca talla
ON CONFLICT (id) DO NOTHING;
