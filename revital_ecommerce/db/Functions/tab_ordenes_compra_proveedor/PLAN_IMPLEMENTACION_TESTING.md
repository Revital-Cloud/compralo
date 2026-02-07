# PLAN DE IMPLEMENTACIÓN Y TESTING - SISTEMA COMPRAS A PROVEEDORES

## 📋 ORDEN DE IMPLEMENTACIÓN PASO A PASO

### FASE 1: PREPARACIÓN DE LA BASE DE DATOS
#### Paso 1.1: Implementar la tabla unificada
```sql
-- Archivo: db_revital.sql (ya implementado)
-- ✅ Tabla tab_orden_compra_proveedor ya está en db_revital.sql
-- ✅ Índices optimizados ya están implementados
```

**Testing Paso 1.1:**
```sql
-- Verificar que la tabla existe
\d tab_orden_compra_proveedor;

-- Verificar índices
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename = 'tab_orden_compra_proveedor';
```

---

### FASE 2: DATOS MAESTROS Y DEPENDENCIAS
#### Paso 2.1: Crear datos de prueba básicos
```sql
-- Insertar rol de prueba
INSERT INTO tab_roles (id_rol, nom_rol, des_rol, usr_insert, fec_insert) 
VALUES (1, 'ADMIN', 'Administrador del sistema', 1, NOW()) 
ON CONFLICT (id_rol) DO NOTHING;

-- Insertar usuario de prueba
INSERT INTO tab_usuarios (id_usuario, nom_usuario, ape_usuario, email_usuario, password_usuario, id_rol, ind_genero, cel_usuario, ind_activo, usr_insert, fec_insert) 
VALUES (1, 'Admin', 'Test', 'admin@test.com', 'hash123', 1, true, '3001234567', true, 1, NOW()) 
ON CONFLICT (id_usuario) DO NOTHING;

-- Insertar categoría de prueba
INSERT INTO tab_categorias (id_categoria, nom_categoria, usr_insert, fec_insert) 
VALUES (1, 'CATEGORIA_TEST', 1, NOW()) 
ON CONFLICT (id_categoria) DO NOTHING;

-- Insertar línea de prueba
INSERT INTO tab_lineas (id_categoria, id_linea, nom_linea, usr_insert, fec_insert) 
VALUES (1, 1, 'LINEA_TEST', 1, NOW()) 
ON CONFLICT (id_categoria, id_linea) DO NOTHING;

-- Insertar sublínea de prueba
INSERT INTO tab_sublineas (id_categoria, id_linea, id_sublinea, nom_sublinea, usr_insert, fec_insert) 
VALUES (1, 1, 1, 'SUBLINEA_TEST', 1, NOW()) 
ON CONFLICT (id_categoria, id_linea, id_sublinea) DO NOTHING;

-- Insertar marca de prueba
INSERT INTO tab_marcas (id_marca, nom_marca, usr_insert, fec_insert) 
VALUES (1, 'MARCA_TEST', 1, NOW()) 
ON CONFLICT (id_marca) DO NOTHING;

-- Insertar proveedor de prueba
INSERT INTO tab_proveedores (id_proveedor, nom_proveedor, email_proveedor, cel_proveedor, ind_activo, usr_insert, fec_insert) 
VALUES (1, 'PROVEEDOR_TEST', 'proveedor@test.com', '3009876543', true, 1, NOW()) 
ON CONFLICT (id_proveedor) DO NOTHING;

-- Insertar producto de prueba
INSERT INTO tab_productos (id_categoria, id_linea, id_sublinea, id_producto, nom_producto, des_producto, num_stock, num_precio, id_proveedor, id_marca, ind_activo, usr_insert, fec_insert) 
VALUES (1, 1, 1, 1, 'PRODUCTO_TEST', 'Producto de prueba', 10, 1000.00, 1, 1, true, 1, NOW()) 
ON CONFLICT (id_categoria, id_linea, id_sublinea, id_producto) DO NOTHING;
```

**Testing Paso 2.1:**
```sql
-- Verificar datos maestros creados
SELECT 'Roles' as tabla, count(*) as registros FROM tab_roles
UNION ALL SELECT 'Usuarios', count(*) FROM tab_usuarios
UNION ALL SELECT 'Categorías', count(*) FROM tab_categorias
UNION ALL SELECT 'Líneas', count(*) FROM tab_lineas
UNION ALL SELECT 'Sublíneas', count(*) FROM tab_sublineas
UNION ALL SELECT 'Marcas', count(*) FROM tab_marcas
UNION ALL SELECT 'Proveedores', count(*) FROM tab_proveedores
UNION ALL SELECT 'Productos', count(*) FROM tab_productos;
```

---

### FASE 3: IMPLEMENTACIÓN DE FUNCIONES
#### Paso 3.1: Función de Inserción
**Archivo:** `fun_insert_orden_compra_proveedor.sql`

**Correcciones necesarias según cambios del usuario:**
```sql
-- El usuario cambió el orden de parámetros, necesitamos ajustar:
-- 1. p_id_orden_compra ahora es el PRIMER parámetro (no opcional)
-- 2. Se agregó p_cantidad_recibida
-- 3. Se agregó p_ind_estado_producto
-- 4. Se cambió el orden de p_observaciones_orden y p_observaciones_producto
```

**Testing Paso 3.1:**
```sql
-- Test 1: Inserción exitosa con producto existente
SELECT fun_insert_orden_compra_proveedor(
    p_id_orden_compra => 1,
    p_id_proveedor => 1,
    p_fec_esperada_entrega => CURRENT_DATE + INTERVAL '7 days',
    p_observaciones_orden => 'Orden de prueba',
    p_id_categoria => 1,
    p_id_linea => 1,
    p_id_sublinea => 1,
    p_id_producto => 1,
    p_cantidad_solicitada => 50,
    p_cantidad_recibida => 0,
    p_costo_unitario => 800.00,
    p_ind_estado_producto => 1,
    p_observaciones_producto => 'Producto de prueba',
    p_usr_operacion => 1
);

-- Test 2: Error con producto inexistente
SELECT fun_insert_orden_compra_proveedor(
    p_id_orden_compra => 2,
    p_id_proveedor => 1,
    p_fec_esperada_entrega => CURRENT_DATE + INTERVAL '7 days',
    p_observaciones_orden => 'Orden con producto inexistente',
    p_id_categoria => 1,
    p_id_linea => 1,
    p_id_sublinea => 1,
    p_id_producto => 999, -- Producto que no existe
    p_cantidad_solicitada => 50,
    p_cantidad_recibida => 0,
    p_costo_unitario => 800.00,
    p_ind_estado_producto => 1,
    p_observaciones_producto => 'Producto inexistente',
    p_usr_operacion => 1
);

-- Test 3: Validación de duplicados
SELECT fun_insert_orden_compra_proveedor(
    p_id_orden_compra => 1, -- Mismo ID que test 1
    p_id_proveedor => 1,
    p_fec_esperada_entrega => CURRENT_DATE + INTERVAL '7 days',
    p_observaciones_orden => 'Orden duplicada',
    p_id_categoria => 1,
    p_id_linea => 1,
    p_id_sublinea => 1,
    p_id_producto => 1,
    p_cantidad_solicitada => 50,
    p_cantidad_recibida => 0,
    p_costo_unitario => 800.00,
    p_ind_estado_producto => 1,
    p_observaciones_producto => 'Producto duplicado',
    p_usr_operacion => 1
);

-- Verificar datos insertados
SELECT * FROM tab_orden_compra_proveedor WHERE id_orden_compra = 1;
```

---

#### Paso 3.2: Función de Actualización
**Archivo:** `fun_update_orden_compra_proveedor.sql`

**Testing Paso 3.2:**
```sql
-- Test 1: Actualizar estado a "Recibido" (debería disparar trigger de stock)
SELECT fun_update_orden_compra_proveedor(
    p_id_orden_compra => 1,
    p_ind_estado_producto => 3, -- Estado "Recibido"
    p_cantidad_recibida => 45,  -- Menor a la solicitada
    p_observaciones_producto => 'Producto recibido parcialmente',
    p_usr_operacion => 1
);

-- Test 2: Actualizar fecha de entrega
SELECT fun_update_orden_compra_proveedor(
    p_id_orden_compra => 1,
    p_fec_esperada_entrega => CURRENT_DATE + INTERVAL '10 days',
    p_observaciones_orden => 'Cambio de fecha de entrega',
    p_usr_operacion => 1
);

-- Test 3: Actualizar con ID inexistente
SELECT fun_update_orden_compra_proveedor(
    p_id_orden_compra => 999,
    p_observaciones_orden => 'Orden inexistente',
    p_usr_operacion => 1
);

-- Verificar cambios
SELECT * FROM tab_orden_compra_proveedor WHERE id_orden_compra = 1;
SELECT * FROM tab_productos WHERE id_categoria = 1 AND id_linea = 1 AND id_sublinea = 1 AND id_producto = 1;
```

---

#### Paso 3.3: Triggers Automáticos
**Archivo:** `triggers/trg_actualizar_stock_compra_proveedor.sql`

**Testing Paso 3.3:**
```sql
-- Test 1: Verificar trigger BEFORE INSERT (validación producto)
INSERT INTO tab_orden_compra_proveedor (
    id_orden_compra, id_proveedor, fec_esperada_entrega,
    id_categoria, id_linea, id_sublinea, id_producto,
    cantidad_solicitada, cantidad_recibida, costo_unitario,
    ind_estado_producto, usr_insert
) VALUES (
    999, 1, CURRENT_DATE + INTERVAL '7 days',
    1, 1, 1, 888, -- Producto inexistente
    10, 0, 100.00, 1, 1
);
-- Debería fallar con mensaje de error detallado

-- Test 2: Stock antes de actualización
SELECT nom_producto, num_stock 
FROM tab_productos 
WHERE id_categoria = 1 AND id_linea = 1 AND id_sublinea = 1 AND id_producto = 1;

-- Test 3: Actualizar a estado "Recibido" (debería actualizar stock)
UPDATE tab_orden_compra_proveedor 
SET ind_estado_producto = 3, cantidad_recibida = 30
WHERE id_orden_compra = 1;

-- Test 4: Verificar stock después de actualización
SELECT nom_producto, num_stock 
FROM tab_productos 
WHERE id_categoria = 1 AND id_linea = 1 AND id_sublinea = 1 AND id_producto = 1;

-- Test 5: Verificar movimiento de inventario registrado
SELECT * FROM tab_movimientos_inventario 
WHERE id_orden_compra = 1 
ORDER BY fec_movimiento DESC LIMIT 1;
```

---

### FASE 4: TESTING INTEGRAL
#### Paso 4.1: Flujo Completo End-to-End
```sql
-- Scenario 1: Flujo completo exitoso
DO $$
DECLARE
    v_resultado JSON;
    v_stock_inicial DECIMAL;
    v_stock_final DECIMAL;
BEGIN
    -- 1. Obtener stock inicial
    SELECT num_stock INTO v_stock_inicial 
    FROM tab_productos 
    WHERE id_categoria = 1 AND id_linea = 1 AND id_sublinea = 1 AND id_producto = 1;
    
    RAISE NOTICE 'Stock inicial: %', v_stock_inicial;
    
    -- 2. Crear orden de compra
    SELECT fun_insert_orden_compra_proveedor(
        p_id_orden_compra => 100,
        p_id_proveedor => 1,
        p_fec_esperada_entrega => CURRENT_DATE + INTERVAL '5 days',
        p_observaciones_orden => 'Orden para testing integral',
        p_id_categoria => 1,
        p_id_linea => 1,
        p_id_sublinea => 1,
        p_id_producto => 1,
        p_cantidad_solicitada => 100,
        p_cantidad_recibida => 0,
        p_costo_unitario => 750.00,
        p_ind_estado_producto => 1,
        p_observaciones_producto => 'Producto para testing',
        p_usr_operacion => 1
    ) INTO v_resultado;
    
    RAISE NOTICE 'Resultado inserción: %', v_resultado;
    
    -- 3. Actualizar a estado "Recibido"
    SELECT fun_update_orden_compra_proveedor(
        p_id_orden_compra => 100,
        p_ind_estado_producto => 3,
        p_cantidad_recibida => 100,
        p_usr_operacion => 1
    ) INTO v_resultado;
    
    RAISE NOTICE 'Resultado actualización: %', v_resultado;
    
    -- 4. Verificar stock final
    SELECT num_stock INTO v_stock_final 
    FROM tab_productos 
    WHERE id_categoria = 1 AND id_linea = 1 AND id_sublinea = 1 AND id_producto = 1;
    
    RAISE NOTICE 'Stock final: %', v_stock_final;
    RAISE NOTICE 'Diferencia de stock: %', (v_stock_final - v_stock_inicial);
    
    -- 5. Verificaciones
    IF (v_stock_final - v_stock_inicial) = 100 THEN
        RAISE NOTICE '✅ ÉXITO: Stock actualizado correctamente';
    ELSE
        RAISE NOTICE '❌ ERROR: Stock no se actualizó correctamente';
    END IF;
END $$;
```

#### Paso 4.2: Testing de Performance
```sql
-- Test de múltiples inserciones
DO $$
DECLARE
    i INTEGER;
    v_tiempo_inicio TIMESTAMP;
    v_tiempo_fin TIMESTAMP;
BEGIN
    v_tiempo_inicio := clock_timestamp();
    
    FOR i IN 1..50 LOOP
        PERFORM fun_insert_orden_compra_proveedor(
            p_id_orden_compra => 200 + i,
            p_id_proveedor => 1,
            p_fec_esperada_entrega => CURRENT_DATE + INTERVAL '7 days',
            p_observaciones_orden => 'Orden batch ' || i,
            p_id_categoria => 1,
            p_id_linea => 1,
            p_id_sublinea => 1,
            p_id_producto => 1,
            p_cantidad_solicitada => 10,
            p_cantidad_recibida => 0,
            p_costo_unitario => 500.00,
            p_ind_estado_producto => 1,
            p_observaciones_producto => 'Producto batch ' || i,
            p_usr_operacion => 1
        );
    END LOOP;
    
    v_tiempo_fin := clock_timestamp();
    
    RAISE NOTICE 'Tiempo para 50 inserciones: %', (v_tiempo_fin - v_tiempo_inicio);
END $$;

-- Verificar performance de consultas
EXPLAIN ANALYZE 
SELECT * FROM tab_orden_compra_proveedor 
WHERE id_proveedor = 1 AND ind_estado_producto = 1;
```

---

### FASE 5: LIMPIEZA Y DOCUMENTACIÓN
#### Paso 5.1: Scripts de Limpieza para Testing
```sql
-- Limpiar datos de prueba
DELETE FROM tab_orden_compra_proveedor WHERE id_orden_compra >= 100;
DELETE FROM tab_movimientos_inventario WHERE id_orden_compra >= 100;

-- Restaurar stock inicial del producto de prueba
UPDATE tab_productos 
SET num_stock = 10 
WHERE id_categoria = 1 AND id_linea = 1 AND id_sublinea = 1 AND id_producto = 1;
```

#### Paso 5.2: Reportes de Verificación
```sql
-- Reporte de funciones implementadas
SELECT 
    routine_name as "Función",
    routine_type as "Tipo",
    created as "Fecha Creación"
FROM information_schema.routines 
WHERE routine_name LIKE '%orden_compra_proveedor%' 
   OR routine_name LIKE '%trigger_validar_producto%'
   OR routine_name LIKE '%trigger_actualizar_stock%'
ORDER BY routine_name;

-- Reporte de triggers
SELECT 
    trigger_name as "Trigger",
    event_manipulation as "Evento",
    action_timing as "Momento"
FROM information_schema.triggers 
WHERE trigger_name LIKE '%compra_proveedor%'
ORDER BY trigger_name;
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

### ✅ Funcionalidades Básicas
- [ ] Tabla `tab_orden_compra_proveedor` creada correctamente
- [ ] Función `fun_insert_orden_compra_proveedor` funciona
- [ ] Función `fun_update_orden_compra_proveedor` funciona
- [ ] Triggers de validación y actualización funcionan

### ✅ Validaciones de Negocio
- [ ] Validación de productos existentes
- [ ] Prevención de duplicados
- [ ] Validación de proveedores activos
- [ ] Validación de fechas futuras

### ✅ Automatizaciones
- [ ] Stock se actualiza automáticamente al recibir productos
- [ ] Movimientos de inventario se registran automáticamente
- [ ] Estados se controlan correctamente

### ✅ Performance y Seguridad
- [ ] Índices funcionan correctamente
- [ ] Transacciones se manejan apropiadamente
- [ ] Mensajes de error son informativos
- [ ] Auditoría está completa

---

## 🚀 COMANDOS DE EJECUCIÓN RÁPIDA

### Ejecutar todo el setup inicial:
```bash
# 1. Aplicar esquema de base de datos
psql -d db_revital -f db_revital.sql

# 2. Crear datos maestros de prueba
psql -d db_revital -f setup_datos_prueba.sql

# 3. Implementar funciones
psql -d db_revital -f Functions/tab_ordenes_compra_proveedor/fun_insert_orden_compra_proveedor.sql
psql -d db_revital -f Functions/tab_ordenes_compra_proveedor/fun_update_orden_compra_proveedor.sql

# 4. Implementar triggers
psql -d db_revital -f triggers/trg_actualizar_stock_compra_proveedor.sql

# 5. Ejecutar tests
psql -d db_revital -f Functions/tab_ordenes_compra_proveedor/EJEMPLOS_USO_SISTEMA_COMPRAS.sql
```

### Testing rápido:
```bash
# Ejecutar test integral
psql -d db_revital -c "SELECT fun_insert_orden_compra_proveedor(999, 1, CURRENT_DATE + INTERVAL '7 days', 'Test', 1, 1, 1, 1, 10, 0, 100.00, 1, 'Test', 1);"
```

---

**NOTA IMPORTANTE:** Debido a los cambios que hizo el usuario en los parámetros de la función, necesitamos actualizar `fun_insert_orden_compra_proveedor.sql` antes de proceder con el testing. 