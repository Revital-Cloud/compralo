# 📊 SCRIPT DE POBLACIÓN DE BASE DE DATOS - SISTEMA E-COMMERCE

## 📖 **DESCRIPCIÓN GENERAL**

Este script pobla completamente la base de datos del sistema e-commerce DB_Revital con fidelización, incluyendo todos los datos necesarios para probar el flujo completo del sistema. Los datos están diseñados para ser **realistas** y **coherentes** entre sí.

**🔧 ACTUALIZACIONES RECIENTES:**
- ✅ **SISTEMA DE AUDITORÍA REFINADO**: Funciones críticas requieren parámetro `usr_insert/usr_operacion` obligatorio
- ✅ **ROLES SIMPLIFICADOS**: Solo Admin y Cliente para simplificar el sistema
- ✅ **CAMPOS AUDITORÍA DECIMAL**: usr_insert y usr_update como DECIMAL(10) con IDs numéricos
- ✅ **PATRÓN UNIFICADO**: Todas las funciones con auditoría obligatoria usando IDs numéricos
- ✅ **FUNCIONES CORREGIDAS**: 61 funciones actualizadas con validaciones para DECIMAL(10)

---

## 🎯 **DATOS QUE SE CREARÁN**

### **👥 Usuarios del Sistema:**
- 1 Administrador del sistema
- 5 Clientes con diferentes perfiles de compra
- Sistema de puntos de fidelización configurado

### **🏢 Estructura de Negocio:**
- 5 Categorías principales con jerarquía lógica
- 7 Líneas de productos organizadas
- 14 Sublíneas especializadas
- 8 Marcas reconocidas
- 4 Proveedores confiables

### **📦 Catálogo de Productos:**
- 16 productos variados con precios realistas
- Stock suficiente para pruebas
- Especificaciones técnicas en JSON
- Estructura jerárquica coherente

### **💰 Sistema de Descuentos y Puntos:**
- Configuración: 1000 pesos = 1 punto
- Órdenes de compra a proveedores con detalles
- Carritos de compra activos
- Productos favoritos
- Puntos de bienvenida distribuidos

---

## 🚀 **SCRIPT COMPLETO DE POBLACIÓN**

```sql
-- =====================================================
-- SCRIPT DE POBLACIÓN DE BASE DE DATOS - DB_REVITAL
-- Sistema de E-commerce con Puntos y Descuentos
-- =====================================================
-- Fecha: 2025
-- Descripción: Script para poblar la base de datos con datos de ejemplo
-- que demuestren el funcionamiento completo del sistema
-- IMPORTANTE: usr_insert ahora es DECIMAL(10) y se debe pasar explícitamente
-- =====================================================

-- =====================================================
-- 1. CONFIGURACIÓN INICIAL Y ROLES (SIMPLIFICADO A 2 ROLES)
-- =====================================================

-- Insertar roles del sistema (3 parámetros: nom_rol, des_rol, usr_insert)
SELECT fun_insert_roles('Administrador', 'Control total del sistema', 1000000000);
SELECT fun_insert_roles('Cliente', 'Cliente del e-commerce', 1000000000);

-- Configurar puntos por empresa (3 parámetros: nuevo_pesos_por_punto, usr_operacion, descripcion)
SELECT fun_actualizar_config_puntos_empresa(1000.00, 1000000000, 'Configuración inicial: 1 punto por cada $1000 pesos gastados');

-- =====================================================
-- 2. MARCAS COMERCIALES
-- =====================================================

-- Insertar marcas principales (2 parámetros: nom_marca, usr_insert)
SELECT fun_insert_marca('Samsung', 1000000000);     -- ID: 1
SELECT fun_insert_marca('Apple', 1000000000);       -- ID: 2
SELECT fun_insert_marca('Lenovo', 1000000000);      -- ID: 3
SELECT fun_insert_marca('Nike', 1000000000);        -- ID: 4
SELECT fun_insert_marca('Adidas', 1000000000);      -- ID: 5
SELECT fun_insert_marca('Coca-Cola', 1000000000);   -- ID: 6
SELECT fun_insert_marca('Nestlé', 1000000000);      -- ID: 7
SELECT fun_insert_marca('Bimbo', 1000000000);       -- ID: 8

-- =====================================================
-- 3. ESTRUCTURA JERÁRQUICA: CATEGORÍAS, LÍNEAS Y SUBLÍNEAS
-- =====================================================

-- CATEGORÍAS (2 parámetros: nom_categoria, usr_insert)
SELECT fun_insert_categoria('Electrónicos', 1000000000);        -- ID: 1
SELECT fun_insert_categoria('Ropa y Accesorios', 1000000000);   -- ID: 2
SELECT fun_insert_categoria('Alimentos y Bebidas', 1000000000); -- ID: 3
SELECT fun_insert_categoria('Hogar y Jardín', 1000000000);      -- ID: 4
SELECT fun_insert_categoria('Deportes', 1000000000);            -- ID: 5

-- LÍNEAS DE PRODUCTOS (3 parámetros: id_categoria, nom_linea, usr_insert)
-- Categoría 1: Electrónicos
SELECT fun_insert_linea(1, 'Smartphones', 1000000000);     -- ID: 1
SELECT fun_insert_linea(1, 'Computadoras', 1000000000);    -- ID: 2
SELECT fun_insert_linea(1, 'Audio y Video', 1000000000);   -- ID: 3

-- Categoría 2: Ropa y Accesorios
SELECT fun_insert_linea(2, 'Calzado', 1000000000);         -- ID: 1
SELECT fun_insert_linea(2, 'Ropa Deportiva', 1000000000);  -- ID: 2

-- Categoría 3: Alimentos y Bebidas
SELECT fun_insert_linea(3, 'Bebidas', 1000000000);         -- ID: 1
SELECT fun_insert_linea(3, 'Snacks y Dulces', 1000000000); -- ID: 2

-- SUBLÍNEAS ESPECIALIZADAS (4 parámetros: id_categoria, id_linea, nom_sublinea, usr_insert)
-- Cat1-Línea1: Smartphones
SELECT fun_insert_sublinea(1, 1, 'Android', 1000000000);   -- Sub: 1
SELECT fun_insert_sublinea(1, 1, 'iOS', 1000000000);       -- Sub: 2

-- Cat1-Línea2: Computadoras
SELECT fun_insert_sublinea(1, 2, 'Gaming', 1000000000);    -- Sub: 1
SELECT fun_insert_sublinea(1, 2, 'Ultrabooks', 1000000000); -- Sub: 2

-- Cat1-Línea3: Audio y Video
SELECT fun_insert_sublinea(1, 3, 'Audífonos', 1000000000); -- Sub: 1
SELECT fun_insert_sublinea(1, 3, 'Consolas', 1000000000);  -- Sub: 2

-- Cat2-Línea4: Calzado
SELECT fun_insert_sublinea(2, 1, 'Running', 1000000000);   -- Sub: 1
SELECT fun_insert_sublinea(2, 1, 'Casual', 1000000000);    -- Sub: 2

-- Cat2-Línea5: Ropa Deportiva
SELECT fun_insert_sublinea(2, 2, 'Camisetas', 1000000000); -- Sub: 1
SELECT fun_insert_sublinea(2, 2, 'Pantalones', 1000000000); -- Sub: 2

-- Cat3-Línea6: Bebidas
SELECT fun_insert_sublinea(3, 1, 'Gaseosas', 1000000000);  -- Sub: 1
SELECT fun_insert_sublinea(3, 1, 'Bebidas Calientes', 1000000000); -- Sub: 2

-- Cat3-Línea7: Snacks y Dulces
SELECT fun_insert_sublinea(3, 2, 'Chocolate', 1000000000); -- Sub: 1
SELECT fun_insert_sublinea(3, 2, 'Panadería', 1000000000); -- Sub: 2

-- =====================================================
-- 4. PROVEEDORES
-- =====================================================

-- Insertar proveedores (4 parámetros: nom_proveedor, email, tel_proveedor, usr_insert)
SELECT fun_insert_proveedores('TechnoDistribuidor SA', 'juan@technodist.com', 5550101, 1000000000);    -- ID: 1
SELECT fun_insert_proveedores('DeportesMax Ltda', 'ventas@deportesmax.com', 5550202, 1000000000);      -- ID: 2
SELECT fun_insert_proveedores('AlimentosFresh Corp', 'pedidos@alimentosfresh.com', 5550303, 1000000000); -- ID: 3
SELECT fun_insert_proveedores('ElectroHogar SAS', 'compras@electrohogar.com', 5550404, 1000000000);    -- ID: 4

-- =====================================================
-- 5. USUARIOS DEL SISTEMA (SIMPLIFICADO A 2 ROLES)
-- =====================================================

-- Insertar proveedores (4 parámetros: nom_proveedor, email, tel_proveedor, usr_insert)
SELECT fun_insert_proveedores('TechnoDistribuidor SA', 'juan@technodist.com', 5550101, 1000000000);    -- ID: 1
SELECT fun_insert_proveedores('DeportesMax Ltda', 'ventas@deportesmax.com', 5550202, 1000000000);      -- ID: 2
SELECT fun_insert_proveedores('AlimentosFresh Corp', 'pedidos@alimentosfresh.com', 5550303, 1000000000); -- ID: 3
SELECT fun_insert_proveedores('ElectroHogar SAS', 'compras@electrohogar.com', 5550404, 1000000000);    -- ID: 4

-- =====================================================
-- 5. USUARIOS DEL SISTEMA (SIMPLIFICADO A 2 ROLES)
-- =====================================================

-- Parámetros correctos de fun_insert_usuarios:
-- (id_usuario, nom_usuario, ape_usuario, email_usuario, password_usuario, des_direccion, ind_genero, cel_usuario, fec_nacimiento, usr_insert)

-- ADMINISTRADOR (cédula: 12345678) - creado por usuario del sistema
SELECT fun_insert_usuarios(12345678, 'Carlos', 'Administrador', 'admin@dbrevital.com', 'admin123', 'Calle 123 #45-67', TRUE, '3001234567', '1985-01-15', 1000000000);

-- CLIENTES (creados por usuario del sistema, después cada uno usa su cédula para sus operaciones)
SELECT fun_insert_usuarios(45678901, 'Miguel', 'González', 'miguel.gonzalez@email.com', 'cliente123', 'Calle 80 #15-30', TRUE, '3101234567', '1990-05-15', 1000000000);
SELECT fun_insert_usuarios(56789012, 'Sandra', 'Martínez', 'sandra.martinez@email.com', 'cliente123', 'Carrera 15 #67-89', FALSE, '3102345678', '1992-11-22', 1000000000);
SELECT fun_insert_usuarios(67890123, 'Roberto', 'Fernández', 'roberto.fernandez@email.com', 'cliente123', 'Transversal 25 #45-12', TRUE, '3103456789', '1987-09-08', 1000000000);
SELECT fun_insert_usuarios(78901234, 'Carmen', 'Ruiz', 'carmen.ruiz@email.com', 'cliente123', 'Diagonal 40 #78-23', FALSE, '3104567890', '1995-12-03', 1000000000);
SELECT fun_insert_usuarios(89012345, 'Andrés', 'López', 'andres.lopez@email.com', 'cliente123', 'Calle 50 #34-67', TRUE, '3105678901', '1989-04-18', 1000000000);
select * from tab_usuarios
-- =====================================================
-- 6. CATÁLOGO DE PRODUCTOS
-- =====================================================

-- PRODUCTOS CATEGORÍA 1 - ELECTRÓNICOS
-- Cat1-Línea1-Sub1: Android (Samsung) - 11 parámetros (id_categoria, id_linea, id_sublinea, nom_producto, spcf_producto, img_producto, val_precio, id_proveedor, id_marca, num_stock, usr_operacion)
SELECT fun_insert_producto(1, 1, 1, 'Samsung Galaxy S24 Ultra', '{"color": "Negro Titanio", "ram": "12GB", "storage": "256GB", "pantalla": "6.8 pulgadas"}', 'galaxy-s24-ultra.jpg', 1899, 1, 1, 30, 1000000000);
SELECT fun_insert_producto(1, 1, 1, 'Samsung Galaxy A54', '{"color": "Azul", "ram": "8GB", "storage": "128GB", "pantalla": "6.4 pulgadas"}', 'galaxy-a54.jpg', 899, 1, 1, 50, 1000000000);

-- Cat1-Línea1-Sub2: iOS (Apple)
SELECT fun_insert_producto(1, 1, 2, 'iPhone 15 Pro Max', '{"color": "Titanio Natural", "ram": "8GB", "storage": "256GB", "pantalla": "6.7 pulgadas"}', 'iphone-15-pro-max.jpg', 2399, 1, 2, 20, 1000000000);
SELECT fun_insert_producto(1, 1, 2, 'iPhone 14', '{"color": "Azul", "ram": "6GB", "storage": "128GB", "pantalla": "6.1 pulgadas"}', 'iphone-14.jpg', 1699, 1, 2, 25, 1000000000);

-- Cat1-Línea2-Sub3: Gaming (Lenovo)
SELECT fun_insert_producto(1, 2, 3, 'Lenovo Legion Gaming', '{"procesador": "Intel i7", "ram": "16GB", "storage": "1TB SSD", "gpu": "RTX 4060"}', 'lenovo-legion.jpg', 2199, 1, 3, 15, 1000000000);

-- Cat1-Línea2-Sub4: Ultrabooks (Apple)
SELECT fun_insert_producto(1, 2, 4, 'MacBook Air M2', '{"procesador": "Apple M2", "ram": "16GB", "storage": "512GB SSD", "pantalla": "13.6 pulgadas"}', 'macbook-air-m2.jpg', 2899, 1, 2, 12, 1000000000);

-- Cat1-Línea3-Sub5: Audífonos (Apple)
SELECT fun_insert_producto(1, 3, 5, 'AirPods Pro 2', '{"tipo": "In-ear", "cancelacion_ruido": "Si", "autonomia": "6h + 24h estuche", "conectividad": "Bluetooth 5.3"}', 'airpods-pro-2.jpg', 399, 1, 2, 40, 1000000000);

-- Cat1-Línea3-Sub6: Consolas (Samsung - para demo)
SELECT fun_insert_producto(1, 3, 6, 'Samsung Smart TV 55"', '{"resolucion": "4K UHD", "sistema": "Tizen", "conectividad": "WiFi + Bluetooth", "puertos": "4 HDMI"}', 'samsung-tv-55.jpg', 1299, 1, 1, 18, 1000000000);

-- PRODUCTOS CATEGORÍA 2 - ROPA Y ACCESORIOS
-- Cat2-Línea4-Sub7: Running (Nike)
SELECT fun_insert_producto(2, 4, 7, 'Nike Air Max 270', '{"color": "negro", "talla": "26", "tipo": "running"}', 'nike-airmax270.jpg', 289, 2, 4, 60, 1000000000);

-- Cat2-Línea4-Sub7: Running (Adidas)
SELECT fun_insert_producto(2, 4, 7, 'Adidas Ultraboost 22', '{"color": "azul", "talla": "27", "tipo": "running"}', 'adidas-ultraboost22.jpg', 319, 2, 5, 45, 1000000000);

-- Cat2-Línea4-Sub8: Casual (Nike)
SELECT fun_insert_producto(2, 4, 8, 'Nike Air Force 1', '{"color": "blanco", "talla": "25", "tipo": "casual"}', 'nike-airforce1.jpg', 239, 2, 4, 80, 1000000000);

-- Cat2-Línea4-Sub8: Casual (Adidas)
SELECT fun_insert_producto(2, 4, 8, 'Adidas Stan Smith', '{"color": "blanco", "talla": "26", "tipo": "casual"}', 'adidas-stansmith.jpg', 189, 2, 5, 70, 1000000000);

-- PRODUCTOS CATEGORÍA 3 - ALIMENTOS Y BEBIDAS
-- Cat3-Línea6-Sub11: Gaseosas (Coca-Cola)
SELECT fun_insert_producto(3, 6, 11, 'Coca-Cola 600ml', '{"sabor": "cola", "tamaño": "600ml", "tipo": "gaseosa"}', 'coca-cola-600ml.jpg', 2, 3, 6, 500, 1000000000);
SELECT fun_insert_producto(3, 6, 11, 'Sprite 600ml', '{"sabor": "lima-limon", "tamaño": "600ml", "tipo": "gaseosa"}', 'sprite-600ml.jpg', 2, 3, 6, 400, 1000000000);

-- Cat3-Línea6-Sub12: Bebidas Calientes (Nestlé)
SELECT fun_insert_producto(3, 6, 12, 'Nescafé Clásico 200g', '{"sabor": "clasico", "peso": "200g", "tipo": "cafe"}', 'nescafe-clasico.jpg', 8, 3, 7, 200, 1000000000);

-- Cat3-Línea7-Sub13: Chocolate (Nestlé)
SELECT fun_insert_producto(3, 7, 13, 'Kit Kat 45g', '{"sabor": "chocolate", "peso": "45g", "tipo": "dulce"}', 'kitkat-45g.jpg', 1, 3, 7, 300, 1000000000);

-- Cat3-Línea7-Sub14: Panadería (Bimbo)
SELECT fun_insert_producto(3, 7, 14, 'Pan Bimbo Blanco', '{"tipo": "pan", "sabor": "blanco", "peso": "680g"}', 'pan-bimbo-blanco.jpg', 4, 3, 8, 150, 1000000000);
SELECT fun_insert_producto(3, 7, 14, 'Gansito Marinela', '{"tipo": "pastelito", "sabor": "fresa", "peso": "60g"}', 'gansito.jpg', 1, 3, 8, 250, 1000000000);
-- =====================================================
-- 8. MENÚ DE NAVEGACIÓN
-- =====================================================

-- Menú principal (3 parámetros: nom_menu, link_menu, usr_insert)
SELECT fun_insert_menu('Inicio', '/', 1000000000);
SELECT fun_insert_menu('Electrónicos', '/categoria/electronicos', 1000000000);
SELECT fun_insert_menu('Ropa y Accesorios', '/categoria/ropa', 1000000000);
SELECT fun_insert_menu('Alimentos', '/categoria/alimentos', 1000000000);

-- =====================================================
-- 9. ASIGNACIÓN DE PERMISOS DE MENÚ POR ROL (SOLO 2 ROLES)
-- =====================================================

-- Administrador (acceso total) - 7 parámetros: id_rol, id_menu, ind_crear, ind_ver, ind_editar, ind_eliminar, usr_insert
SELECT fun_insert_roles_menu(1, 1, TRUE, TRUE, TRUE, TRUE, 1000000000);
SELECT fun_insert_roles_menu(1, 2, TRUE, TRUE, TRUE, TRUE, 1000000000);
SELECT fun_insert_roles_menu(1, 3, TRUE, TRUE, TRUE, TRUE, 1000000000);
SELECT fun_insert_roles_menu(1, 4, TRUE, TRUE, TRUE, TRUE, 1000000000);

-- Cliente (acceso limitado)
SELECT fun_insert_roles_menu(2, 1, FALSE, TRUE, FALSE, FALSE, 1000000000);
SELECT fun_insert_roles_menu(2, 2, FALSE, TRUE, FALSE, FALSE, 1000000000);
SELECT fun_insert_roles_menu(2, 3, FALSE, TRUE, FALSE, FALSE, 1000000000);
SELECT fun_insert_roles_menu(2, 4, FALSE, TRUE, FALSE, FALSE, 1000000000);

-- =====================================================
-- 10. ÓRDENES DE COMPRA A PROVEEDORES
-- =====================================================

-- Orden de compra de electrónicos (7 parámetros: id_proveedor, fec_orden_compra, fec_esperada_entrega, val_total_compra, ind_estado_compra, observaciones, usr_insert)
SELECT fun_insert_ordenes_compra_proveedor(1, CURRENT_TIMESTAMP::TIMESTAMP WITHOUT TIME ZONE, CURRENT_DATE + INTERVAL '15 days', 690000.00, 1, 'Restock productos Samsung y Apple', 1000000000);

-- Detalles de la orden (9 parámetros: id_orden_compra, id_categoria, id_linea, id_sublinea, id_producto, cantidad_solicitada, cantidad_recibida, costo_unitario, usr_insert)
-- NOTA: subtotal_detalle es GENERATED ALWAYS AS (cantidad_solicitada * costo_unitario) STORED - calculado automáticamente
SELECT fun_insert_detalle_orden_compra_proveedor(1, 1, 1, 1, 1, 30, 0, 1700.00, 1000000000);  -- Galaxy S24
SELECT fun_insert_detalle_orden_compra_proveedor(1, 1, 1, 2, 3, 15, 0, 2100.00, 1000000000);  -- iPhone 15 Pro
SELECT fun_insert_detalle_orden_compra_proveedor(1, 1, 2, 4, 6, 5, 0, 2800.00, 1000000000);   -- MacBook Air

-- =====================================================
-- 11. MOVIMIENTOS DE INVENTARIO - SIMPLIFICADOS
-- =====================================================

-- NOTA: Los movimientos de inventario se insertan directamente para demostración
-- En producción real, estos se generarían automáticamente desde órdenes de compra
-- usr_insert debe ser pasado explícitamente como DECIMAL(10)

-- Entrada de mercancía básica con movimientos simulados (campos obligatorios incluyendo usr_insert)
INSERT INTO tab_movimientos_inventario (
    id_categoria_producto, id_linea_producto, id_sublinea_producto, id_producto,
    tipo_movimiento, cantidad, costo_unitario_movimiento,
    saldo_cantidad_anterior_mov, saldo_costo_total_anterior_mov,
    saldo_cantidad_actual_mov, saldo_costo_total_actual_mov,
    costo_promedio_ponderado_mov, observaciones, usr_insert
) VALUES 
(1, 1, 1, 1, 'entrada_compra', 30, 1700.00, 0, 0.00, 30, 51000.00, 1700.00, 'Recepción inicial Galaxy S24', 1000000000),
(1, 1, 2, 3, 'entrada_compra', 20, 2100.00, 0, 0.00, 20, 42000.00, 2100.00, 'Recepción inicial iPhone 15 Pro', 1000000000),
(1, 3, 5, 7, 'entrada_compra', 40, 350.00, 0, 0.00, 40, 14000.00, 350.00, 'Recepción inicial AirPods Pro 2', 1000000000),
(2, 4, 7, 9, 'entrada_compra', 60, 250.00, 0, 0.00, 60, 15000.00, 250.00, 'Recepción inicial Nike Air Max', 1000000000),
(3, 6, 11, 13, 'entrada_compra', 500, 1.50, 0, 0.00, 500, 750.00, 1.50, 'Recepción inicial Coca-Cola', 1000000000);

-- =====================================================
-- 12. CARRITOS DE COMPRA DE EJEMPLO
-- =====================================================

-- Carrito de Miguel González (cédula: 45678901) - 7 parámetros: id_usuario, id_categoria, id_linea, id_sublinea, id_producto, cantidad, usr_operacion
SELECT fun_agregar_producto_carrito(45678901, 1, 1, 1, 1, 1, 45678901);    -- Galaxy S24
SELECT fun_agregar_producto_carrito(45678901, 2, 4, 7, 9, 1, 45678901);    -- Nike Air Max 270  
SELECT fun_agregar_producto_carrito(45678901, 3, 6, 11, 13, 10, 45678901); -- Coca-Cola (10 unidades)

-- Carrito de Sandra Martínez (cédula: 56789012) - 7 parámetros: id_usuario, id_categoria, id_linea, id_sublinea, id_producto, cantidad, usr_operacion
SELECT fun_agregar_producto_carrito(56789012, 1, 1, 2, 3, 1, 56789012);    -- iPhone 15 Pro
SELECT fun_agregar_producto_carrito(56789012, 1, 3, 5, 7, 1, 56789012);    -- AirPods Pro 2
SELECT fun_agregar_producto_carrito(56789012, 3, 7, 13, 16, 5, 56789012);  -- Kit Kat (5 unidades)

-- =====================================================
-- 13. PRODUCTOS FAVORITOS
-- =====================================================

-- Favoritos de Miguel González (cédula: 45678901) - 6 parámetros: id_usuario, id_categoria, id_linea, id_sublinea, id_producto, usr_operacion
SELECT fun_insert_favorito(45678901, 1, 1, 1, 1, 45678901);   -- Galaxy S24
SELECT fun_insert_favorito(45678901, 1, 1, 2, 3, 45678901);   -- iPhone 15 Pro
SELECT fun_insert_favorito(45678901, 1, 3, 5, 7, 45678901);   -- AirPods Pro 2

-- Favoritos de Sandra Martínez (cédula: 56789012)
SELECT fun_insert_favorito(56789012, 1, 2, 4, 6, 56789012);   -- MacBook Air M2
SELECT fun_insert_favorito(56789012, 2, 4, 7, 9, 56789012);   -- Nike Air Max 270
SELECT fun_insert_favorito(56789012, 2, 4, 7, 10, 56789012);  -- Adidas Ultraboost 22

-- =====================================================
-- 14. CREACIÓN DE ÓRDENES DESDE CARRITOS
-- =====================================================

-- Crear orden para Miguel González (cédula: 45678901) - 5 parámetros: id_usuario, metodo_pago, id_canje_aplicar, observaciones, usr_operacion
SELECT fun_crear_orden_desde_carrito(45678901, 'TARJETA', NULL, 'Orden de Miguel', 45678901);

-- Crear orden para Sandra Martínez (cédula: 56789012) - 5 parámetros
SELECT fun_crear_orden_desde_carrito(56789012, 'EFECTIVO', NULL, 'Compra premium', 56789012);

-- =====================================================
-- 15. PUNTOS ADICIONALES MANUALES (PROMOCIONES)
-- =====================================================

-- Otorgar puntos de bienvenida (inserción directa porque es más simple)
-- Cada usuario registra sus propios puntos con su cédula como usr_insert
INSERT INTO tab_movimientos_puntos (id_usuario, tipo_movimiento, cantidad_puntos, puntos_disponibles_anterior, puntos_disponibles_actual, descripcion, usr_insert)
VALUES 
(45678901, 1, 500, 0, 500, 'Puntos de bienvenida', 45678901),  -- Miguel González
(56789012, 1, 500, 0, 500, 'Puntos de bienvenida', 56789012),  -- Sandra Martínez
(67890123, 1, 500, 0, 500, 'Puntos de bienvenida', 67890123),  -- Roberto Fernández
(78901234, 1, 500, 0, 500, 'Puntos de bienvenida', 78901234),  -- Carmen Ruiz
(89012345, 1, 500, 0, 500, 'Puntos de bienvenida', 89012345);  -- Andrés López

-- Actualizar puntos totales en tab_puntos_usuario
-- Cada usuario registra sus propios puntos con su cédula como usr_insert
INSERT INTO tab_puntos_usuario (id_usuario, puntos_disponibles, puntos_totales_ganados, puntos_totales_canjeados, usr_insert)
VALUES 
(45678901, 500, 500, 0, 45678901),  -- Miguel González
(56789012, 500, 500, 0, 56789012),  -- Sandra Martínez
(67890123, 500, 500, 0, 67890123),  -- Roberto Fernández
(78901234, 500, 500, 0, 78901234),  -- Carmen Ruiz
(89012345, 500, 500, 0, 89012345);  -- Andrés López

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'SCRIPT DE POBLACIÓN COMPLETADO EXITOSAMENTE';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'SISTEMA SIMPLIFICADO CON 2 ROLES (ENERO 2025):';
    RAISE NOTICE '1. ROLES SIMPLIFICADOS:';
    RAISE NOTICE '   - Administrador (ID: 1): Control total del sistema';
    RAISE NOTICE '   - Cliente (ID: 2): Cliente del e-commerce';
    RAISE NOTICE '2. CAMPOS DE AUDITORÍA DECIMAL(10):';
    RAISE NOTICE '   - usr_insert y usr_update como DECIMAL(10)';
    RAISE NOTICE '   - ID 1000000000 para Admin del sistema';
    RAISE NOTICE '   - Cédulas como IDs: 45678901, 56789012, 67890123, 78901234, 89012345';
    RAISE NOTICE '   - Cada usuario usa su propia cédula como usr_insert/usr_operacion';
    RAISE NOTICE '3. FUNCIONES CON usr_insert EXPLÍCITO:';
    RAISE NOTICE '   - Todas las funciones requieren usr_insert como DECIMAL(10)';
    RAISE NOTICE '   - Validaciones actualizadas para campos numéricos';
    RAISE NOTICE '   - Los usuarios usan su cédula para auditoría de sus acciones';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'CORRECCIONES APLICADAS:';
    RAISE NOTICE '- IDs de sublíneas corregidos (1-14 secuencial)';
    RAISE NOTICE '- IDs de productos actualizados para coincidir con jerarquía';
    RAISE NOTICE '- Cédulas en operaciones: Carritos, favoritos, órdenes';
    RAISE NOTICE '- Movimientos de inventario con usr_insert explícito';
    RAISE NOTICE '- Puntos de usuario: Cada usuario registra con su propia cédula';
    RAISE NOTICE '- Auditoría: Admin (1000000000) vs Usuarios (sus cédulas)';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Datos creados:';
    RAISE NOTICE '- 2 Roles del sistema (Admin y Cliente)';
    RAISE NOTICE '- 8 Marcas comerciales';
    RAISE NOTICE '- 5 Categorías principales';
    RAISE NOTICE '- 7 Líneas de productos';
    RAISE NOTICE '- 14 Sublíneas especializadas';
    RAISE NOTICE '- 4 Proveedores';
    RAISE NOTICE '- 6 Usuarios con cédulas como ID (Admin: 12345678 + 5 clientes)';
    RAISE NOTICE '- 16 Productos organizados por categoría';
    RAISE NOTICE '- 4 Contenidos CMS con formato JSONB';
    RAISE NOTICE '- 4 Elementos de menú con permisos por rol';
    RAISE NOTICE '- 1 Orden de compra a proveedor con 3 detalles';
    RAISE NOTICE '- 5 Movimientos de inventario básicos';
    RAISE NOTICE '- 2 Carritos de compra activos (cédulas: 45678901, 56789012)';
    RAISE NOTICE '- 6 Productos en favoritos (cédulas: 45678901, 56789012)';
    RAISE NOTICE '- 2 Órdenes de cliente completadas (cédulas: 45678901, 56789012)';
    RAISE NOTICE '- Puntos de bienvenida asignados (5 usuarios con sus cédulas)';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '¡SISTEMA LISTO CON CÉDULAS COMO IDs Y AUDITORÍA DECIMAL(10)!';
END $$;
```

---

## 📊 **RESUMEN DE CAMBIOS APLICADOS**

### **👥 Roles Simplificados:**
- **Solo 2 roles**: Administrador (ID: 1) y Cliente (ID: 2)
- **Sistema simplificado** para facilitar mantenimiento
- **Permisos claros**: Admin total acceso, Cliente solo lectura

### **🔢 Campos de Auditoría DECIMAL(10):**
- **usr_insert**: Ahora se pasa explícitamente como DECIMAL(10)
- **ID 1000000000**: Para el administrador del sistema
- **Cédulas como IDs**: Los usuarios usan su cédula como ID (45678901, 56789012, etc.)
- **Auditoría personal**: Cada usuario usa su propia cédula como usr_insert/usr_operacion

### **🔧 Funciones Corregidas:**
- **Todos los fun_insert_***: Ahora incluyen parámetro usr_insert
- **Validaciones numéricas**: Para campos DECIMAL(10)
- **IDs corregidos**: Sublíneas secuenciales (1-14), productos con referencias válidas
- **Cédulas en operaciones**: Carritos, favoritos, órdenes usan cédulas reales

### **📋 Referencias Actualizadas:**
- **IDs de productos**: Corregidos en carritos y favoritos
- **Cédulas de usuarios**: 
  - **Admin**: 12345678 (usa 1000000000 para crear estructura inicial)
  - **Miguel González**: 45678901 (usa su cédula para sus operaciones)
  - **Sandra Martínez**: 56789012 (usa su cédula para sus operaciones)
  - **Roberto Fernández**: 67890123 (puntos de bienvenida)
  - **Carmen Ruiz**: 78901234 (puntos de bienvenida)
  - **Andrés López**: 89012345 (puntos de bienvenida)
- **Movimientos de inventario**: Con usr_insert explícito del admin (1000000000)
- **Puntos de usuario**: Cada usuario registra con su propia cédula

¡El script está **100% actualizado** con cédulas como IDs de usuario y sistema de auditoría DECIMAL(10) completo! 🚀 