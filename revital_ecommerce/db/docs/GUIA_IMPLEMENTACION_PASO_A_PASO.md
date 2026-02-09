# 📋 GUÍA PASO A PASO - IMPLEMENTACIÓN SISTEMA DB_REVITAL

## 🎯 OBJETIVO

Esta guía te permitirá implementar el sistema DB_Revital en el orden correcto, respetando las dependencias entre tablas y funciones, con datos de ejemplo coherentes y realistas.

## 📅 PRERREQUISITOS

- PostgreSQL instalado y configurado
- Base de datos creada
- Archivo `db_revital.sql` ejecutado exitosamente
- Todas las funciones SQL disponibles en la carpeta `Functions/`

---

## 📊 FASE 1: CONFIGURACIÓN BÁSICA DEL SISTEMA

### 1.1 Crear Roles del Sistema

**Orden:** PRIMERO (No tiene dependencias)

```sql
-- Ejecutar función para crear roles (solo admin y cliente)
SELECT fun_insert_roles('admin', 'Administrador del sistema con acceso completo', 1000000000);
SELECT fun_insert_roles('cliente', 'Cliente del sistema de e-commerce', 1000000000);
```

### 1.2 Crear Usuarios del Sistema

**Orden:** SEGUNDO (Depende de roles)

```sql
-- Usuario administrador principal (rol admin = 1)
SELECT fun_insert_usuarios(
    1000000000,                    -- ID usuario (cédula)
    'Carlos',                      -- Nombre
    'Rodríguez',                   -- Apellido
    'admin@dbrevital.com',          -- Email
    'admin123',                    -- Password
    TRUE,                          -- Género (TRUE=masculino, FALSE=femenino)
    '3001234567',                  -- Celular
    '1985-05-15',                  -- Fecha nacimiento
    1000000000                     -- Usuario que inserta
);

-- Usuario cliente ejemplo (rol cliente = 2)
SELECT fun_insert_usuarios(
    1098765432,                    -- ID usuario
    'María',                       -- Nombre
    'González',                    -- Apellido
    'maria.gonzalez@email.com',    -- Email
    'cliente123',                  -- Password
    FALSE,                         -- Género
    '3109876543',                  -- Celular
    '1990-08-20',                  -- Fecha nacimiento
    1000000000                     -- Usuario que inserta
);

-- Usuario cliente adicional (rol cliente = 2)
SELECT fun_insert_usuarios(
    1234567890,                    -- ID usuario
    'Pedro',                       -- Nombre
    'Martínez',                    -- Apellido
    'pedro.martinez@email.com',    -- Email
    'cliente456',                  -- Password
    TRUE,                          -- Género
    '3207654321',                  -- Celular
    '1992-03-10',                  -- Fecha nacimiento
    1000000000                     -- Usuario que inserta
);
```

### 1.3 Configurar Sistema de Puntos

**Orden:** TERCERO (Depende de usuarios)

```sql
-- Crear configuración inicial de puntos (1 punto por cada 1000 pesos)
SELECT fun_crear_config_puntos_empresa(1000.00, NULL, 1000000000);

-- Verificar configuración creada (ahora retorna JSON con toda la información)
SELECT fun_obtener_config_puntos_activa();

-- Extraer solo el valor de pesos por punto si es necesario
SELECT (fun_obtener_config_puntos_activa()::json->>'pesos_por_punto')::DECIMAL as pesos_por_punto;

-- Actualizar configuración usando el ID obtenido automáticamente
SELECT fun_actualizar_config_puntos_empresa(
    (fun_obtener_config_puntos_activa()::json->>'id_config_puntos')::INTEGER,
    500.00,
    'Configuración actualizada',
    1000000000
);
```

---

## 🏪 FASE 2: ESTRUCTURA DE PRODUCTOS

### 2.1 Crear Categorías

**Orden:** CUARTO (Base de la clasificación)

```sql
-- Categorías principales
SELECT fun_insert_categoria('Electrónicos', 1000000000);
SELECT fun_insert_categoria('Ropa y Moda', 1000000000);
SELECT fun_insert_categoria('Hogar y Jardín', 1000000000);
SELECT fun_insert_categoria('Deportes y Outdoor', 1000000000);
SELECT fun_insert_categoria('Libros y Medios', 1000000000);
SELECT fun_insert_categoria('Salud y Belleza', 1000000000);
SELECT fun_insert_categoria('Automotriz', 1000000000);
SELECT fun_insert_categoria('Juguetes y Juegos', 1000000000);
```

### 2.2 Crear Líneas

**Orden:** QUINTO (Depende de categorías)

```sql
-- Líneas para Electrónicos (id_categoria = 1)
SELECT fun_insert_linea(1, 'Computadoras', 1000000000);
SELECT fun_insert_linea(1, 'Smartphones', 1000000000);
SELECT fun_insert_linea(1, 'Audio y Video', 1000000000);
SELECT fun_insert_linea(1, 'Accesorios', 1000000000);

-- Líneas para Ropa y Moda (id_categoria = 2)
SELECT fun_insert_linea(2, 'Ropa Masculina', 1000000000);
SELECT fun_insert_linea(2, 'Ropa Femenina', 1000000000);
SELECT fun_insert_linea(2, 'Calzado', 1000000000);
SELECT fun_insert_linea(2, 'Accesorios Moda', 1000000000);

-- Líneas para Hogar y Jardín (id_categoria = 3)
SELECT fun_insert_linea(3, 'Muebles', 1000000000);
SELECT fun_insert_linea(3, 'Decoración', 1000000000);
SELECT fun_insert_linea(3, 'Electrodomésticos', 1000000000);
SELECT fun_insert_linea(3, 'Jardín y Exterior', 1000000000);
```

### 2.3 Crear Sublíneas

**Orden:** SEXTO (Depende de líneas)

```sql
-- Sublíneas para Computadoras (categoria=1, linea=1)
SELECT fun_insert_sublinea(1, 1, 'Laptops', 1000000000);
SELECT fun_insert_sublinea(1, 1, 'Desktops', 1000000000);
SELECT fun_insert_sublinea(1, 1, 'Tablets', 1000000000);
SELECT fun_insert_sublinea(1, 1, 'Componentes PC', 1000000000);

-- Sublíneas para Smartphones (categoria=1, linea=2)
SELECT fun_insert_sublinea(1, 2, 'Android', 1000000000);
SELECT fun_insert_sublinea(1, 2, 'iPhone', 1000000000);
SELECT fun_insert_sublinea(1, 2, 'Accesorios Móviles', 1000000000);

-- Sublíneas para Ropa Masculina (categoria=2, linea=1)
SELECT fun_insert_sublinea(2, 1, 'Camisas', 1000000000);
SELECT fun_insert_sublinea(2, 1, 'Pantalones', 1000000000);
SELECT fun_insert_sublinea(2, 1, 'Chaquetas', 1000000000);
SELECT fun_insert_sublinea(2, 1, 'Ropa Interior', 1000000000);

-- Sublíneas para Ropa Femenina (categoria=2, linea=2)
SELECT fun_insert_sublinea(2, 2, 'Blusas', 1000000000);
SELECT fun_insert_sublinea(2, 2, 'Vestidos', 1000000000);
SELECT fun_insert_sublinea(2, 2, 'Pantalones', 1000000000);
SELECT fun_insert_sublinea(2, 2, 'Ropa Interior', 1000000000);
```

### 2.4 Crear Marcas

**Orden:** SÉPTIMO (Independiente, requerido para productos)

```sql
-- Marcas tecnológicas
SELECT fun_insert_marca('Apple', 1000000000);
SELECT fun_insert_marca('Samsung', 1000000000);
SELECT fun_insert_marca('Sony', 1000000000);
SELECT fun_insert_marca('HP', 1000000000);
SELECT fun_insert_marca('Dell', 1000000000);
SELECT fun_insert_marca('Lenovo', 1000000000);

-- Marcas de ropa
SELECT fun_insert_marca('Nike', 1000000000);
SELECT fun_insert_marca('Adidas', 1000000000);
SELECT fun_insert_marca('Zara', 1000000000);
SELECT fun_insert_marca('H&M', 1000000000);
SELECT fun_insert_marca('Levi\'s', 1000000000);

-- Marcas de hogar
SELECT fun_insert_marca('IKEA', 1000000000);
SELECT fun_insert_marca('Whirlpool', 1000000000);
SELECT fun_insert_marca('LG', 1000000000);
SELECT fun_insert_marca('Philips', 1000000000);
```

### 2.5 Crear Proveedores

**Orden:** OCTAVO (Independiente, requerido para productos)

```sql
-- Proveedores tecnológicos
SELECT fun_insert_proveedores(1, 'TechDistribuidor SAS', 'tech@distribuidor.com', 6013456789, 1000000000);
SELECT fun_insert_proveedores(2, 'Electrónicos del Sur', 'ventas@electronicossur.com', 6047891234, 1000000000);
SELECT fun_insert_proveedores(3, 'Importaciones Digitales', 'info@importacionesdigitales.com', 6015678901, 1000000000);

-- Proveedores de ropa
SELECT fun_insert_proveedores(4, 'Confecciones Modernas', 'pedidos@confeccionesmodernas.com', 6012345678, 1000000000);
SELECT fun_insert_proveedores(5, 'Textiles Bogotá', 'comercial@textilesbogota.com', 6019876543, 1000000000);

-- Proveedores de hogar
SELECT fun_insert_proveedores(6, 'Hogar y Diseño', 'ventas@hogarydiseno.com', 6014567890, 1000000000);
SELECT fun_insert_proveedores(7, 'Muebles Cali', 'info@mueblescali.com', 6026789012, 1000000000);
```

---

## 🛒 FASE 3: PRODUCTOS Y INVENTARIO

### 3.1 Crear Productos

**Orden:** NOVENO (Depende de categorías, líneas, sublíneas, marcas, proveedores)

```sql
-- Productos Electrónicos - Laptops
SELECT fun_insert_producto(
    1, 1, 1, 1,                    -- categoria, linea, sublinea, producto
    'MacBook Air M2 13"',          -- nombre
    '{"procesador": "Apple M2", "ram": "8GB", "almacenamiento": "256GB SSD", "pantalla": "13.6 pulgadas", "sistema": "macOS", "peso": "1.24 kg"}',  -- especificaciones
    'https://images.apple.com/macbook-air-m2.jpg',  -- imagen
    5200000,                       -- precio
    1,                             -- proveedor
    1,                             -- marca Apple
    25,                            -- stock
    1000000000                     -- usuario
);

SELECT fun_insert_producto(
    1, 1, 1, 2,                    -- categoria, linea, sublinea, producto
    'Dell Inspiron 15 3000',       -- nombre
    '{"procesador": "Intel i5", "ram": "8GB", "almacenamiento": "512GB SSD", "pantalla": "15.6 pulgadas", "sistema": "Windows 11", "peso": "1.85 kg"}',
    'https://images.dell.com/inspiron-15-3000.jpg',
    2800000,                       -- precio
    2,                             -- proveedor
    5,                             -- marca Dell
    40,                            -- stock
    1000000000
);

-- Productos Electrónicos - Smartphones
SELECT fun_insert_producto(
    1, 2, 1, 1,                    -- categoria, linea, sublinea, producto
    'Samsung Galaxy S23',          -- nombre
    '{"pantalla": "6.1 pulgadas", "procesador": "Snapdragon 8 Gen 2", "ram": "8GB", "almacenamiento": "128GB", "camara": "50MP", "bateria": "3900mAh"}',
    'https://images.samsung.com/galaxy-s23.jpg',
    3500000,                       -- precio
    1,                             -- proveedor
    2,                             -- marca Samsung
    60,                            -- stock
    1000000000
);

SELECT fun_insert_producto(
    1, 2, 2, 1,                    -- categoria, linea, sublinea, producto
    'iPhone 14 Pro',               -- nombre
    '{"pantalla": "6.1 pulgadas", "procesador": "A16 Bionic", "ram": "6GB", "almacenamiento": "128GB", "camara": "48MP", "bateria": "3200mAh"}',
    'https://images.apple.com/iphone-14-pro.jpg',
    4800000,                       -- precio
    1,                             -- proveedor
    1,                             -- marca Apple
    35,                            -- stock
    1000000000
);

-- Productos de Ropa - Camisas Masculinas
SELECT fun_insert_producto(
    2, 1, 1, 1,                    -- categoria, linea, sublinea, producto
    'Camisa Formal Azul',          -- nombre
    '{"material": "100% Algodón", "tallas": "S, M, L, XL", "color": "Azul marino", "tipo": "Formal", "cuello": "Clásico"}',
    'https://images.zara.com/camisa-formal-azul.jpg',
    120000,                        -- precio
    4,                             -- proveedor
    9,                             -- marca Zara
    100,                           -- stock
    1000000000
);

SELECT fun_insert_producto(
    2, 1, 2, 1,                    -- categoria, linea, sublinea, producto
    'Jeans Levi\'s 501',           -- nombre
    '{"material": "100% Denim", "tallas": "28, 30, 32, 34, 36", "color": "Azul clásico", "tipo": "Straight", "lavado": "Stone wash"}',
    'https://images.levis.com/jeans-501.jpg',
    280000,                        -- precio
    5,                             -- proveedor
    11,                            -- marca Levi's
    80,                            -- stock
    1000000000
);

-- Productos de Ropa Femenina
SELECT fun_insert_producto(
    2, 2, 1, 1,                    -- categoria, linea, sublinea, producto
    'Blusa Elegante Blanca',       -- nombre
    '{"material": "Poliéster y Spandex", "tallas": "XS, S, M, L, XL", "color": "Blanco", "tipo": "Elegante", "manga": "Larga"}',
    'https://images.hm.com/blusa-elegante-blanca.jpg',
    95000,                         -- precio
    4,                             -- proveedor
    10,                            -- marca H&M
    75,                            -- stock
    1000000000
);

SELECT fun_insert_producto(
    2, 2, 2, 1,                    -- categoria, linea, sublinea, producto
    'Vestido Casual Negro',        -- nombre
    '{"material": "Algodón y Elastano", "tallas": "XS, S, M, L, XL", "color": "Negro", "tipo": "Casual", "largo": "Midi"}',
    'https://images.zara.com/vestido-casual-negro.jpg',
    150000,                        -- precio
    4,                             -- proveedor
    9,                             -- marca Zara
    50,                            -- stock
    1000000000
);
```

---

## 💳 FASE 4: SISTEMA DE DESCUENTOS

### 4.1 Crear Descuentos Básicos

**Orden:** DÉCIMO (Depende de productos y categorías)

```sql
-- Descuento por primera compra
SELECT fun_insert_descuento(
    1,                             -- id_descuento
    'Bienvenida 10%',              -- nombre
    'Descuento del 10% para nuevos clientes en su primera compra',  -- descripción
    TRUE,                          -- tipo_calculo (TRUE=porcentaje)
    10.00,                         -- valor porcentaje
    0,                             -- valor monto
    'total_pedido',                -- aplica_a
    NULL, NULL, NULL, NULL,        -- ids específicos (no aplica)
    NULL, NULL, NULL, NULL, NULL,  -- ids aplicación específica
    50000.00,                      -- monto mínimo pedido
    FALSE,                         -- es para cumpleaños
    CURRENT_DATE,                  -- fecha inicio
    CURRENT_DATE + INTERVAL '30 days',  -- fecha fin
    TRUE,                          -- activo
    NULL,                          -- max usos total
    0,                             -- usos actuales
    NULL,                          -- costo puntos
    FALSE,                         -- canjeable por puntos
    'BIENVENIDA10',                -- código
    1,                             -- max usos por usuario
    NULL,                          -- días semana
    NULL, NULL,                    -- horas inicio/fin
    TRUE,                          -- solo primera compra
    0,                             -- monto mínimo producto
    1,                             -- cantidad mínima
    TRUE,                          -- requiere código
    1000000000                     -- usuario
);

-- Descuento en electrónicos
SELECT fun_insert_descuento(
    2,                             -- id_descuento
    'Descuento Electrónicos 15%',  -- nombre
    'Descuento del 15% en toda la categoría de electrónicos',  -- descripción
    TRUE,                          -- tipo_calculo
    15.00,                         -- valor porcentaje
    0,                             -- valor monto
    'categoria_especifica',        -- aplica_a
    NULL, NULL, NULL, NULL,        -- ids específicos
    1, NULL, NULL, NULL, NULL,     -- categoria_aplica = 1 (Electrónicos)
    100000.00,                     -- monto mínimo pedido
    FALSE,                         -- es para cumpleaños
    CURRENT_DATE,                  -- fecha inicio
    CURRENT_DATE + INTERVAL '15 days',  -- fecha fin
    TRUE,                          -- activo
    100,                           -- max usos total
    0,                             -- usos actuales
    NULL,                          -- costo puntos
    FALSE,                         -- canjeable por puntos
    'ELECTRONICO15',               -- código
    2,                             -- max usos por usuario
    NULL,                          -- días semana
    NULL, NULL,                    -- horas inicio/fin
    FALSE,                         -- solo primera compra
    0,                             -- monto mínimo producto
    1,                             -- cantidad mínima
    TRUE,                          -- requiere código
    1000000000                     -- usuario
);

-- Descuento canjeable por puntos
SELECT fun_insert_descuento(
    3,                             -- id_descuento
    'Descuento 20% - Puntos',      -- nombre
    'Descuento del 20% canjeable por 500 puntos',  -- descripción
    TRUE,                          -- tipo_calculo
    20.00,                         -- valor porcentaje
    0,                             -- valor monto
    'total_pedido',                -- aplica_a
    NULL, NULL, NULL, NULL,        -- ids específicos
    NULL, NULL, NULL, NULL, NULL,  -- ids aplicación específica
    0,                             -- monto mínimo pedido
    FALSE,                         -- es para cumpleaños
    CURRENT_DATE,                  -- fecha inicio
    CURRENT_DATE + INTERVAL '60 days',  -- fecha fin
    TRUE,                          -- activo
    NULL,                          -- max usos total
    0,                             -- usos actuales
    500,                           -- costo puntos
    TRUE,                          -- canjeable por puntos
    NULL,                          -- código (no necesario)
    NULL,                          -- max usos por usuario
    NULL,                          -- días semana
    NULL, NULL,                    -- horas inicio/fin
    FALSE,                         -- solo primera compra
    0,                             -- monto mínimo producto
    1,                             -- cantidad mínima
    FALSE,                         -- requiere código
    1000000000                     -- usuario
);
```

---

## 🛍️ FASE 5: GESTIÓN DE COMPRAS

### 5.1 Crear Direcciones de Usuario

**Orden:** UNDÉCIMO (Depende de usuarios)

```sql
-- Dirección para María González
SELECT fun_insert_direcciones(
    1,                             -- id_direccion
    1098765432,                    -- id_usuario (María)
    'Casa Principal',              -- nombre
    'Calle 123 #45-67',           -- calle
    'Bogotá',                      -- ciudad
    'Cundinamarca',                -- departamento
    '110111',                      -- código postal
    'Chapinero',                   -- barrio
    'Edificio azul, portón negro', -- referencias
    'Apartamento 502',             -- complemento
    TRUE,                          -- principal
    1000000000                     -- usuario
);

-- Dirección para Pedro Martínez
SELECT fun_insert_direcciones(
    2,                             -- id_direccion
    1234567890,                    -- id_usuario (Pedro)
    'Casa',                        -- nombre
    'Carrera 50 #30-20',          -- calle
    'Medellín',                    -- ciudad
    'Antioquia',                   -- departamento
    '050001',                      -- código postal
    'El Poblado',                  -- barrio
    'Casa blanca con jardín',      -- referencias
    'Casa 1',                      -- complemento
    TRUE,                          -- principal
    1000000000                     -- usuario
);
```

### 5.2 Crear Carritos y Agregar Productos

**Orden:** DUODÉCIMO (Depende de usuarios y productos)

```sql
-- Crear carrito para María
SELECT fun_obtener_carrito_usuario(1098765432);

-- Agregar productos al carrito (asumiendo que el carrito tiene ID 1)
SELECT fun_agregar_producto_carrito(
    1,                             -- id_carrito
    1, 2, 1, 1,                    -- categoria, linea, sublinea, producto (Samsung Galaxy S23)
    2,                             -- cantidad
    3500000,                       -- precio
    1000000000                     -- usuario
);

SELECT fun_agregar_producto_carrito(
    1,                             -- id_carrito
    2, 1, 1, 1,                    -- categoria, linea, sublinea, producto (Camisa Formal Azul)
    3,                             -- cantidad
    120000,                        -- precio
    1000000000                     -- usuario
);

-- Verificar detalle del carrito
SELECT fun_obtener_carrito_detalle(1);

-- Calcular total del carrito
SELECT fun_calcular_total_carrito(1);
```

### 5.3 Crear Órdenes desde Carrito

**Orden:** DECIMOTERCERO (Depende de carritos)

```sql
-- Crear orden desde carrito
SELECT fun_crear_orden_desde_carrito(
    1,                             -- id_carrito
    1,                             -- id_direccion
    'tarjeta',                     -- método de pago
    'BIENVENIDA10',                -- código descuento
    'Orden de prueba del sistema', -- observaciones
    1000000000                     -- usuario
);

-- Verificar órdenes del usuario
SELECT fun_obtener_ordenes_usuario(1098765432);
```

---

## 🏆 FASE 6: SISTEMA DE FIDELIZACIÓN

### 6.1 Configurar Puntos Iniciales

**Orden:** DECIMOCUARTO (Depende de órdenes)

```sql
-- Los puntos se acumulan automáticamente con triggers cuando se completa una orden
-- Pero podemos verificar el estado actual

-- Obtener resumen de puntos de usuario
SELECT fun_obtener_resumen_puntos_usuario(1098765432);

-- Obtener historial de puntos
SELECT fun_obtener_historial_puntos(1098765432);
```

### 6.2 Realizar Canjes de Puntos

**Orden:** DECIMOQUINTO (Depende de puntos acumulados)

```sql
-- Primero verificar descuentos canjeables
SELECT fun_listar_descuentos_canjeables(1098765432);

-- Canjear puntos por descuento (si el usuario tiene suficientes puntos)
SELECT fun_canjear_puntos_descuento(
    1098765432,                    -- id_usuario
    3,                             -- id_descuento (Descuento 20% - Puntos)
    500,                           -- puntos_utilizar
    1000000000                     -- usuario_operacion
);
```

---

## 📊 FASE 7: FUNCIONES AVANZADAS

### 7.1 Gestión de Favoritos

**Orden:** DECIMOSEXTO (Depende de usuarios y productos)

```sql
-- Agregar productos a favoritos
SELECT fun_insert_favorito(
    1098765432,                    -- id_usuario
    1, 2, 2, 1,                    -- categoria, linea, sublinea, producto (iPhone 14 Pro)
    1000000000                     -- usuario
);

SELECT fun_insert_favorito(
    1098765432,                    -- id_usuario
    2, 2, 1, 1,                    -- categoria, linea, sublinea, producto (Blusa Elegante)
    1000000000                     -- usuario
);

-- Consultar favoritos del usuario
SELECT fun_select_favoritos_usuario(1098765432);
```

### 7.2 Gestión de Comentarios

**Orden:** DECIMOSÉPTIMO (Depende de usuarios y productos)

```sql
-- Agregar comentarios a productos
SELECT fun_insert_comentarios(
    1, 2, 1, 1,                    -- categoria, linea, sublinea, producto (Samsung Galaxy S23)
    1098765432,                    -- id_usuario
    1,                             -- id_comentario
    'Excelente teléfono, muy buena cámara y batería duradera. Lo recomiendo.',
    1000000000                     -- usuario
);

SELECT fun_insert_comentarios(
    1, 2, 2, 1,                    -- categoria, linea, sublinea, producto (iPhone 14 Pro)
    1234567890,                    -- id_usuario
    1,                             -- id_comentario
    'Producto de alta calidad, interfaz muy intuitiva. Precio justificado.',
    1000000000                     -- usuario
);
```

### 7.3 Gestión de Contenido CMS

**Orden:** DECIMOCTAVO (Independiente)

```sql
-- Crear contenido para la página principal
SELECT fun_insert_content(
    'Banner Principal',
    '{"titulo": "Bienvenido a DB_Revital", "subtitulo": "Tu tienda de confianza", "imagen": "banner-principal.jpg", "enlace": "/productos"}',
    1,                             -- versión
    true,                          -- publicado
    1000000000                     -- usuario
);

-- Crear contenido para sección de ofertas
SELECT fun_insert_content(
    'Ofertas Especiales',
    '{"titulo": "Ofertas de la Semana", "productos": ["1,2,1,1", "1,2,2,1"], "descuento": "Hasta 20% de descuento", "validez": "Válido hasta fin de mes"}',
    1,                             -- versión
    true,                          -- publicado
    1000000000                     -- usuario
);
```

---

## 🔄 FASE 8: VERIFICACIÓN Y PRUEBAS

### 8.1 Verificar Integridad de Datos

```sql
-- Verificar todas las tablas principales
SELECT 'Roles' as tabla, COUNT(*) as registros FROM tab_roles
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM tab_usuarios
UNION ALL
SELECT 'Categorías', COUNT(*) FROM tab_categorias
UNION ALL
SELECT 'Líneas', COUNT(*) FROM tab_lineas
UNION ALL
SELECT 'Sublíneas', COUNT(*) FROM tab_sublineas
UNION ALL
SELECT 'Marcas', COUNT(*) FROM tab_marcas
UNION ALL
SELECT 'Proveedores', COUNT(*) FROM tab_proveedores
UNION ALL
SELECT 'Productos', COUNT(*) FROM tab_productos
UNION ALL
SELECT 'Descuentos', COUNT(*) FROM tab_descuentos
UNION ALL
SELECT 'Carritos', COUNT(*) FROM tab_carritos
UNION ALL
SELECT 'Órdenes', COUNT(*) FROM tab_ordenes
UNION ALL
SELECT 'Favoritos', COUNT(*) FROM tab_favoritos
UNION ALL
SELECT 'Comentarios', COUNT(*) FROM tab_comentarios
UNION ALL
SELECT 'CMS Content', COUNT(*) FROM tab_cms_content;
```

### 8.2 Pruebas de Funcionalidad

```sql
-- Probar búsqueda de productos
SELECT * FROM tab_productos WHERE nom_producto ILIKE '%samsung%';

-- Probar descuentos activos
SELECT * FROM tab_descuentos WHERE ind_activo = TRUE AND fec_fin >= CURRENT_DATE;

-- Probar configuración de puntos
SELECT fun_obtener_config_puntos_activa();

-- Probar puntos de usuario
SELECT fun_obtener_resumen_puntos_usuario(1098765432);
```

---

## 📝 NOTAS IMPORTANTES

### 🎯 Orden de Dependencias

1. **Roles** (admin, cliente) → **Usuarios** → **Configuración**
2. **Categorías** → **Líneas** → **Sublíneas**
3. **Marcas** + **Proveedores** → **Productos**
4. **Descuentos** (depende de productos/categorías)
5. **Carritos** → **Órdenes** → **Puntos**
6. **Funciones avanzadas** (favoritos, comentarios, CMS)

### 🔧 Parámetros Importantes

- **usr_insert**: Siempre debe ser un ID de usuario válido (DECIMAL)
- **fec_insert/fec_update**: Se manejan automáticamente
- **IDs**: Usar valores secuenciales para evitar conflictos
- **Precios**: En pesos colombianos (sin decimales para productos)
- **Fechas**: Formato 'YYYY-MM-DD'
- **Booleanos**: TRUE/FALSE explícitos

### 📊 Datos de Ejemplo

- **Usuarios**: Datos realistas con cédulas colombianas
- **Productos**: Precios en rango real del mercado
- **Descuentos**: Configurados para pruebas realistas
- **Direcciones**: Formato colombiano estándar

### 🔧 Funciones de Configuración de Puntos

- **`fun_crear_config_puntos_empresa()`**: Crea configuración inicial (solo una vez)
- **`fun_obtener_config_puntos_activa()`**: Obtiene configuración actual en formato JSON con ID ⭐ **PRINCIPAL**
- **`fun_actualizar_config_puntos_empresa()`**: Actualiza configuración existente (requiere ID)
- **`fun_obtener_id_config_activa()`**: Función auxiliar para obtener solo el ID
- **`fun_obtener_pesos_por_punto_activo()`**: Función auxiliar para obtener solo el valor DECIMAL (compatibilidad)

### 🚀 Próximos Pasos

1. Implementar sistema de KPIs (si está disponible)
2. Configurar jobs automáticos de limpieza
3. Implementar notificaciones
4. Configurar backup automático
5. Optimizar consultas con índices adicionales

---

## 🛡️ TROUBLESHOOTING

### Errores Comunes

1. **Error FK**: Verificar que las tablas padre existan
2. **Error de tipos**: Revisar tipos de datos en parámetros
3. **Error de longitud**: Verificar longitud mínima de campos
4. **Error de fechas**: Usar formato correcto YYYY-MM-DD

### Comandos Útiles

```sql
-- Verificar estructura de tabla
\d tab_usuarios;

-- Ver funciones disponibles
\df fun_*;

-- Verificar constraints
SELECT * FROM information_schema.table_constraints WHERE table_name = 'tab_productos';
```

---

_Esta guía te permite implementar el sistema DB_Revital de manera ordenada y sistemática, garantizando la integridad y coherencia de los datos._
