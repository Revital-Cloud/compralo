/*
 * EJEMPLOS DE USO: Sistema de Compras a Proveedores
 * 
 * DESCRIPCIÓN: Ejemplos prácticos de cómo usar el sistema completo de
 *              órdenes de compra a proveedores con actualización automática de stock.
 * 
 * COMPONENTES DEL SISTEMA:
 *   1. tab_orden_compra_proveedor (tabla unificada)
 *   2. fun_insert_orden_compra_proveedor() (inserción)
 *   3. fun_update_orden_compra_proveedor() (actualización)
 *   4. Triggers automáticos (validación + actualización stock)
 * 
 * FLUJO COMPLETO:
 *   Admin crea orden → Trigger valida producto → Se recibe mercancía → 
 *   Admin marca como recibido → Trigger actualiza stock automáticamente
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- =====================================================
-- ESCENARIO 1: PRODUCTO EXISTE - FLUJO NORMAL
-- =====================================================

-- PASO 1: Crear orden de compra para producto existente
-- Si no especificamos id_orden_compra, se genera automáticamente
SELECT fun_insert_orden_compra_proveedor(

    1,                       -- id_proveedor
    '2025-02-15',           -- fec_esperada_entrega
    'Orden mensual febrero', -- observaciones_orden
    1,                       -- id_categoria
    1,                       -- id_linea  
    1,                       -- id_sublinea
    1,                       -- id_producto
    50,                      -- cantidad_solicitada
    25.50,                   -- costo_unitario
    'Producto urgente',      -- observaciones_producto
    1                        -- usr_operacion (admin)
);

-- RESULTADO ESPERADO:
-- {
--   "success": true,
--   "message": "Orden de compra a proveedor creada exitosamente",
--   "id_orden_compra": 1,
--   "id_orden_compra_generado": true,
--   "producto_existe": true,
--   "producto_info": {...}
-- }

-- PASO 2: Consultar la orden creada
SELECT 
    id_orden_compra,
    id_proveedor,
    fec_esperada_entrega,
    id_categoria, id_linea, id_sublinea, id_producto,
    cantidad_solicitada,
    cantidad_recibida,
    costo_unitario,
    subtotal_producto,
    ind_estado_producto,
    observaciones_orden
FROM tab_orden_compra_proveedor 
WHERE id_orden_compra = 1;  -- Usar el ID generado automáticamente

-- PASO 3: Simular recepción de mercancía (marcar como recibido)
-- Esto activará el trigger que actualiza el stock automáticamente
SELECT fun_update_orden_compra_proveedor(
    1,           -- id_orden_compra
    NULL,        -- fec_esperada_entrega (sin cambio)
    NULL,        -- observaciones_orden (sin cambio)
    NULL,        -- cantidad_solicitada (sin cambio)
    50,          -- cantidad_recibida (toda la cantidad)
    NULL,        -- costo_unitario (sin cambio)
    3,           -- ind_estado_producto = 3 (Recibido) → ¡ACTUALIZA STOCK!
    'Mercancía recibida completa', -- observaciones_producto
    1            -- usr_operacion
);

-- RESULTADO ESPERADO:
-- {
--   "success": true,
--   "message": "Orden de compra a proveedor actualizada exitosamente",
--   "estado_anterior": 1,
--   "estado_nuevo": 3,
--   "stock_sera_actualizado": true,
--   "nota_trigger": "El trigger actualizará automáticamente el stock del producto"
-- }

-- PASO 4: Verificar que el stock se actualizó
SELECT 
    id_categoria, id_linea, id_sublinea, id_producto,
    nom_producto,
    num_stock,  -- ← Este valor debe haber aumentado en +50
    usr_update,
    fec_update
FROM tab_productos 
WHERE id_categoria = 1 AND id_linea = 1 AND id_sublinea = 1 AND id_producto = 1;

-- PASO 5: Verificar movimiento registrado automáticamente
SELECT 
    id_movimiento,
    tipo_movimiento,
    cantidad,
    costo_unitario_movimiento,
    saldo_cantidad_anterior_mov,
    saldo_cantidad_actual_mov,
    descripcion,
    fec_insert
FROM tab_movimientos_inventario 
WHERE id_categoria_producto = 1 
  AND id_linea_producto = 1 
  AND id_sublinea_producto = 1 
  AND id_producto = 1
  AND tipo_movimiento = 'entrada_compra'
ORDER BY fec_insert DESC 
LIMIT 1;

-- =====================================================
-- ESCENARIO 2: PRODUCTO NO EXISTE - ERROR CON INSTRUCCIONES
-- =====================================================

-- PASO 1: Intentar crear orden para producto inexistente
SELECT fun_insert_orden_compra_proveedor(
    NULL,                    -- id_orden_compra (autogenerado)
    1,                       -- id_proveedor
    '2025-02-20',           -- fec_esperada_entrega
    'Orden producto nuevo',  -- observaciones_orden
    1,                       -- id_categoria
    1,                       -- id_linea
    1,                       -- id_sublinea
    999,                     -- id_producto (NO EXISTE)
    25,                      -- cantidad_solicitada
    15.75,                   -- costo_unitario
    NULL,                    -- observaciones_producto
    1                        -- usr_operacion
);

-- RESULTADO ESPERADO:
-- {
--   "success": false,
--   "message": "El producto especificado no existe. Debe crearlo primero usando fun_insert_producto",
--   "producto_existe": false,
--   "accion_requerida": "CREAR_PRODUCTO_PRIMERO",
--   "instrucciones": "Ejecute fun_insert_producto() para crear el producto antes de generar la orden de compra"
-- }

-- PASO 2: Crear el producto primero (según las instrucciones)
SELECT fun_insert_producto(
    1, 1, 1, 999,                           -- categoría, línea, sublínea, producto
    'Producto Nuevo de Prueba',             -- nombre
    '{"color": "azul", "material": "metal"}', -- especificaciones JSON
    NULL,                                   -- imagen (opcional)
    45.99,                                  -- precio
    1,                                      -- id_proveedor
    1,                                      -- id_marca
    0,                                      -- stock inicial
    1                                       -- usr_operacion
);

-- PASO 3: Ahora sí crear la orden de compra
SELECT fun_insert_orden_compra_proveedor(
    NULL,                    -- id_orden_compra (autogenerado)
    1,                       -- id_proveedor
    '2025-02-20',           -- fec_esperada_entrega
    'Orden producto nuevo',  -- observaciones_orden
    1,                       -- id_categoria
    1,                       -- id_linea
    1,                       -- id_sublinea
    999,                     -- id_producto (AHORA SÍ EXISTE)
    25,                      -- cantidad_solicitada
    15.75,                   -- costo_unitario
    NULL,                    -- observaciones_producto
    1                        -- usr_operacion
);

-- AHORA DEBERÍA FUNCIONAR CORRECTAMENTE

-- =====================================================
-- ESCENARIO 3: MÚLTIPLES ÓRDENES INDIVIDUALES
-- =====================================================

-- IMPORTANTE: Con la nueva estructura, cada orden es para UN SOLO PRODUCTO
-- Para múltiples productos, creamos múltiples órdenes individuales

-- Crear órdenes separadas para diferentes productos
SELECT fun_insert_orden_compra_proveedor(NULL, 1, '2025-02-25', 'Orden producto A', 1, 1, 1, 1, 30, 20.00, 'Producto A urgente', 1);
SELECT fun_insert_orden_compra_proveedor(NULL, 1, '2025-02-25', 'Orden producto B', 1, 1, 1, 2, 20, 35.50, 'Producto B normal', 1);
SELECT fun_insert_orden_compra_proveedor(NULL, 1, '2025-02-25', 'Orden producto C', 1, 1, 1, 3, 15, 12.25, 'Producto C económico', 1);

-- Consultar todas las órdenes del día
SELECT 
    id_orden_compra,
    id_categoria, id_linea, id_sublinea, id_producto,
    cantidad_solicitada,
    costo_unitario,
    subtotal_producto,
    ind_estado_producto,
    observaciones_orden
FROM tab_orden_compra_proveedor 
WHERE fec_orden_compra = '2025-02-25'
ORDER BY id_orden_compra;

-- Marcar órdenes como recibidas/actualizadas una por una
-- (Asumir que las órdenes generadas automáticamente son 3, 4, 5)

-- Orden del Producto A - Recepción completa
SELECT fun_update_orden_compra_proveedor(
    3,           -- id_orden_compra (primera orden del día)
    NULL, NULL, NULL, 30, NULL, 3, 'Recibido completo', 1
);

-- Orden del Producto B - Recepción parcial  
SELECT fun_update_orden_compra_proveedor(
    4,           -- id_orden_compra (segunda orden del día)
    NULL, NULL, NULL, 15, NULL, 2, 'Recepción parcial', 1
);

-- Orden del Producto C - Cancelado
SELECT fun_update_orden_compra_proveedor(
    5,           -- id_orden_compra (tercera orden del día)
    NULL, NULL, NULL, NULL, NULL, 4, 'Producto cancelado por proveedor', 1
);

-- =====================================================
-- CONSULTAS ÚTILES PARA ADMINISTRACIÓN
-- =====================================================

-- 1. Ver resumen de órdenes por estado
SELECT 
    ind_estado_producto,
    CASE ind_estado_producto
        WHEN 1 THEN 'Solicitado'
        WHEN 2 THEN 'Parcial'
        WHEN 3 THEN 'Recibido'
        WHEN 4 THEN 'Cancelado'
    END as estado_descripcion,
    COUNT(1) as cantidad_productos,
    SUM(cantidad_solicitada) as total_solicitado,
    SUM(cantidad_recibida) as total_recibido,
    SUM(subtotal_producto) as valor_total
FROM tab_orden_compra_proveedor
GROUP BY ind_estado_producto
ORDER BY ind_estado_producto;

-- 2. Órdenes pendientes por proveedor
SELECT 
    p.nom_proveedor,
    COUNT(1) as ordenes_pendientes,
    SUM(ocp.subtotal_producto) as valor_pendiente,
    STRING_AGG(ocp.id_orden_compra::text, ', ') as ids_ordenes
FROM tab_orden_compra_proveedor ocp
JOIN tab_proveedores p ON ocp.id_proveedor = p.id_proveedor
WHERE ocp.ind_estado_producto IN (1, 2) -- Solicitado o Parcial
GROUP BY p.nom_proveedor
ORDER BY valor_pendiente DESC;

-- 3. Productos con mayor movimiento de compras
SELECT 
    ocp.id_categoria, ocp.id_linea, ocp.id_sublinea, ocp.id_producto,
    pr.nom_producto,
    COUNT(1) as ordenes_compra,
    SUM(ocp.cantidad_solicitada) as total_solicitado,
    SUM(ocp.cantidad_recibida) as total_recibido,
    SUM(ocp.subtotal_producto) as inversion_total
FROM tab_orden_compra_proveedor ocp
JOIN tab_productos pr ON (ocp.id_categoria = pr.id_categoria AND 
                          ocp.id_linea = pr.id_linea AND 
                          ocp.id_sublinea = pr.id_sublinea AND 
                          ocp.id_producto = pr.id_producto)
GROUP BY ocp.id_categoria, ocp.id_linea, ocp.id_sublinea, ocp.id_producto, pr.nom_producto
ORDER BY inversion_total DESC
LIMIT 10;

-- =====================================================
-- MENSAJES INFORMATIVOS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SISTEMA DE COMPRAS A PROVEEDORES - EJEMPLOS COMPLETADOS';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Funciones disponibles:';
    RAISE NOTICE '   • fun_insert_orden_compra_proveedor() - Crear órdenes';
    RAISE NOTICE '   • fun_update_orden_compra_proveedor() - Actualizar órdenes';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Triggers automáticos activos:';
    RAISE NOTICE '   • Validación: Producto debe existir antes de crear orden';
    RAISE NOTICE '   • Stock: Se actualiza automáticamente al marcar como recibido';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Estados del producto:';
    RAISE NOTICE '   1 = Solicitado → Sin efecto en stock';
    RAISE NOTICE '   2 = Parcial    → Sin efecto en stock';
    RAISE NOTICE '   3 = Recibido   → ✅ ACTUALIZA STOCK (+cantidad_recibida)';
    RAISE NOTICE '   4 = Cancelado  → Sin efecto en stock';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Para productos nuevos: Ejecutar fun_insert_producto() primero';
END $$; 