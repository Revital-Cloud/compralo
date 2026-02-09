/*
 * ÍNDICES PARA OPTIMIZAR fun_filter_products
 * 
 * DESCRIPCIÓN: Conjunto de índices diseñados específicamente para mejorar el rendimiento
 *              de la función fun_filter_products en todas las operaciones de filtrado.
 * 
 * ESTRATEGIA:
 *   - Índices compuestos para filtros múltiples
 *   - Índices para búsquedas de texto
 *   - Índices para rangos de precio y stock
 *   - Índices para ordenamiento
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- ==============================================
-- ÍNDICES PRINCIPALES PARA FILTROS
-- ==============================================

-- 1. ÍNDICE COMPUESTO PRINCIPAL: Categoría + Línea + Sublínea + Producto
-- Optimiza filtros por jerarquía completa
CREATE INDEX IF NOT EXISTS idx_productos_hierarchy 
ON tab_productos (id_categoria, id_linea, id_sublinea, id_producto) 
WHERE ind_activo = true;

-- 2. ÍNDICE PARA FILTROS POR MARCA
-- Optimiza filtros por marca
CREATE INDEX IF NOT EXISTS idx_productos_marca 
ON tab_productos (id_marca, ind_activo) 
WHERE ind_activo = true;

-- 3. ÍNDICE PARA FILTROS POR PROVEEDOR
-- Optimiza filtros por proveedor
CREATE INDEX IF NOT EXISTS idx_productos_proveedor 
ON tab_productos (id_proveedor, ind_activo) 
WHERE ind_activo = true;

-- ==============================================
-- ÍNDICES PARA BÚSQUEDAS DE TEXTO
-- ==============================================

-- 4. ÍNDICE PARA BÚSQUEDA POR NOMBRE DE PRODUCTO
-- Optimiza búsquedas LIKE en nom_producto
CREATE INDEX IF NOT EXISTS idx_productos_nombre_texto 
ON tab_productos USING gin (to_tsvector('spanish', nom_producto)) 
WHERE ind_activo = true;

-- 5. ÍNDICE SIMPLE PARA NOMBRE (búsquedas exactas y LIKE)
-- Complementa el índice GIN para búsquedas más simples
CREATE INDEX IF NOT EXISTS idx_productos_nombre_simple 
ON tab_productos (nom_producto) 
WHERE ind_activo = true;

-- ==============================================
-- ÍNDICES PARA RANGOS NUMÉRICOS
-- ==============================================

-- 6. ÍNDICE PARA FILTROS DE PRECIO
-- Optimiza filtros por rango de precio
CREATE INDEX IF NOT EXISTS idx_productos_precio 
ON tab_productos (val_precio, ind_activo) 
WHERE ind_activo = true;

-- 7. ÍNDICE PARA FILTROS DE STOCK
-- Optimiza filtros por stock
CREATE INDEX IF NOT EXISTS idx_productos_stock 
ON tab_productos (num_stock, ind_activo) 
WHERE ind_activo = true;

-- 8. ÍNDICE COMPUESTO: PRECIO + STOCK + ACTIVO
-- Optimiza filtros combinados de precio y stock
CREATE INDEX IF NOT EXISTS idx_productos_precio_stock 
ON tab_productos (val_precio, num_stock, ind_activo) 
WHERE ind_activo = true;

-- ==============================================
-- ÍNDICES PARA ORDENAMIENTO
-- ==============================================

-- 9. ÍNDICE PARA ORDENAMIENTO POR PRECIO
-- Optimiza ORDER BY val_precio
CREATE INDEX IF NOT EXISTS idx_productos_orden_precio 
ON tab_productos (val_precio ASC, id_categoria, id_linea, id_sublinea, id_producto) 
WHERE ind_activo = true;

-- 10. ÍNDICE PARA ORDENAMIENTO POR NOMBRE
-- Optimiza ORDER BY nom_producto
CREATE INDEX IF NOT EXISTS idx_productos_orden_nombre 
ON tab_productos (nom_producto ASC, id_categoria, id_linea, id_sublinea, id_producto) 
WHERE ind_activo = true;

-- 11. ÍNDICE PARA ORDENAMIENTO POR STOCK
-- Optimiza ORDER BY num_stock
CREATE INDEX IF NOT EXISTS idx_productos_orden_stock 
ON tab_productos (num_stock ASC, id_categoria, id_linea, id_sublinea, id_producto) 
WHERE ind_activo = true;

-- 12. ÍNDICE PARA ORDENAMIENTO POR FECHA
-- Optimiza ORDER BY fec_insert
CREATE INDEX IF NOT EXISTS idx_productos_orden_fecha 
ON tab_productos (fec_insert ASC, id_categoria, id_linea, id_sublinea, id_producto) 
WHERE ind_activo = true;

-- ==============================================
-- ÍNDICES PARA TABLAS RELACIONADAS
-- ==============================================

-- 13. ÍNDICE PARA CATEGORÍAS ACTIVAS
-- Optimiza JOIN con tab_categorias
CREATE INDEX IF NOT EXISTS idx_categorias_activas 
ON tab_categorias (id_categoria) 
WHERE ind_activo = true;

-- 14. ÍNDICE PARA LÍNEAS ACTIVAS
-- Optimiza JOIN con tab_lineas
CREATE INDEX IF NOT EXISTS idx_lineas_activas 
ON tab_lineas (id_linea, id_categoria) 
WHERE ind_activo = true;

-- 15. ÍNDICE PARA SUBLÍNEAS ACTIVAS
-- Optimiza JOIN con tab_sublineas
CREATE INDEX IF NOT EXISTS idx_sublineas_activas 
ON tab_sublineas (id_sublinea, id_linea) 
WHERE ind_activo = true;

-- 16. ÍNDICE PARA MARCAS ACTIVAS
-- Optimiza JOIN con tab_marcas
CREATE INDEX IF NOT EXISTS idx_marcas_activas 
ON tab_marcas (id_marca) 
WHERE ind_activo = true;

-- 17. ÍNDICE PARA PROVEEDORES ACTIVOS
-- Optimiza JOIN con tab_proveedores
CREATE INDEX IF NOT EXISTS idx_proveedores_activos 
ON tab_proveedores (id_proveedor) 
WHERE ind_activo = true;

-- ==============================================
-- ÍNDICES COMPUESTOS AVANZADOS
-- ==============================================

-- 18. ÍNDICE COMPUESTO: CATEGORÍA + MARCA + ACTIVO
-- Optimiza filtros por categoría y marca
CREATE INDEX IF NOT EXISTS idx_productos_categoria_marca 
ON tab_productos (id_categoria, id_marca, ind_activo) 
WHERE ind_activo = true;

-- 19. ÍNDICE COMPUESTO: PROVEEDOR + MARCA + ACTIVO
-- Optimiza filtros por proveedor y marca
CREATE INDEX IF NOT EXISTS idx_productos_proveedor_marca 
ON tab_productos (id_proveedor, id_marca, ind_activo) 
WHERE ind_activo = true;

-- 20. ÍNDICE COMPUESTO: PRECIO + MARCA + ACTIVO
-- Optimiza filtros por precio y marca
CREATE INDEX IF NOT EXISTS idx_productos_precio_marca 
ON tab_productos (val_precio, id_marca, ind_activo) 
WHERE ind_activo = true;

-- ==============================================
-- ESTADÍSTICAS Y ANÁLISIS
-- ==============================================

-- Actualizar estadísticas después de crear los índices
ANALYZE tab_productos;
ANALYZE tab_categorias;
ANALYZE tab_lineas;
ANALYZE tab_sublineas;
ANALYZE tab_marcas;
ANALYZE tab_proveedores;

-- ==============================================
-- COMENTARIOS DE USO
-- ==============================================

/*
 * NOTAS DE RENDIMIENTO:
 * 
 * 1. Los índices con WHERE ind_activo = true son más eficientes
 *    porque solo indexan registros activos.
 * 
 * 2. Los índices compuestos están ordenados por selectividad:
 *    - Campos más selectivos primero
 *    - Campos de ordenamiento al final
 * 
 * 3. El índice GIN para texto permite búsquedas full-text avanzadas
 *    usando to_tsvector('spanish', nom_producto).
 * 
 * 4. Los índices de ordenamiento incluyen campos de identificación
 *    para evitar operaciones de sorting adicionales.
 * 
 * 5. Los índices en tablas relacionadas optimizan los JOINs.
 * 
 * MONITOREO:
 * - Usar EXPLAIN ANALYZE para verificar el uso de índices
 * - Monitorear el tamaño de los índices
 * - Considerar VACUUM y REINDEX periódicamente
 */
