/*
 * DATOS INICIALES: KPIs Predefinidos para Dashboard
 * 
 * DESCRIPCIÓN: Conjunto de KPIs predefinidos que el administrador puede
 *              activar/configurar para que los usuarios elijan en sus dashboards.
 *              Basado en las estadísticas existentes del sistema.
 * 
 * CATEGORÍAS DE KPIs:
 *   - Ventas y Facturación
 *   - Productos y Inventario  
 *   - Usuarios y Clientes
 *   - Rendimiento Operacional
 *   - Análisis Financiero
 * 
 * AUTOR: Sistema DB_Revital
 * FECHA: 2025
 */

-- =====================================================
-- INSERTAR: Tipos de KPI (Categorías)
-- =====================================================

INSERT INTO tab_tipos_kpi (nom_tipo_kpi, descripcion, color_categoria, icono, orden_visualizacion) VALUES 
('Ventas y Facturación', 'Métricas relacionadas con ventas, ingresos y facturación', '#E74C3C', 'fas fa-chart-line', 1),
('Productos e Inventario', 'Métricas de productos, stock y rotación de inventario', '#3498DB', 'fas fa-boxes', 2),
('Usuarios y Clientes', 'Métricas de usuarios registrados, activos y comportamiento', '#9B59B6', 'fas fa-users', 3),
('Rendimiento Operacional', 'Métricas de órdenes, procesos y eficiencia operativa', '#F39C12', 'fas fa-cogs', 4),
('Análisis Financiero', 'Métricas financieras, márgenes y rentabilidad', '#27AE60', 'fas fa-dollar-sign', 5),
('Puntos y Descuentos', 'Métricas del sistema de fidelización y descuentos', '#E67E22', 'fas fa-gift', 6);

-- =====================================================
-- INSERTAR: KPIs de Ventas y Facturación
-- =====================================================

INSERT INTO tab_kpis_maestros (
    id_tipo_kpi, nom_kpi, descripcion_kpi, formula_sql, unidad_medida, formato_numero,
    rango_esperado_min, rango_esperado_max, frecuencia_actualizacion, duracion_cache_minutos,
    tipo_grafico_sugerido, color_primario, mostrar_tendencia, mostrar_comparacion,
    solo_administradores, requiere_parametros, parametros_permitidos
) VALUES 

-- KPI 1: Ventas Totales del Mes
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Ventas y Facturación'),
'Ventas Totales del Mes',
'Total de ingresos generados en el mes actual por órdenes completadas',
'SELECT COALESCE(SUM(val_total_pedido), 0) FROM tab_ordenes WHERE ind_estado = 3 AND TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ACTUAL}',
'€', 'CURRENCY', 0, 50000, 'TIEMPO_REAL', 30, 'NUMERO', '#E74C3C', TRUE, TRUE, FALSE, FALSE, NULL),

-- KPI 2: Órdenes Completadas del Mes
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Ventas y Facturación'),
'Órdenes Completadas del Mes',
'Número total de órdenes completadas en el mes actual',
'SELECT COUNT(1) FROM tab_ordenes WHERE ind_estado = 3 AND TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ACTUAL}',
'órdenes', 'INTEGER', 0, 1000, 'TIEMPO_REAL', 15, 'NUMERO', '#E74C3C', TRUE, TRUE, FALSE, FALSE, NULL),

-- KPI 3: Ticket Promedio
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Ventas y Facturación'),
'Ticket Promedio',
'Valor promedio por orden completada en el período actual',
'SELECT ROUND(AVG(val_total_pedido), 2) FROM tab_ordenes WHERE ind_estado = 3 AND TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ACTUAL}',
'€', 'DECIMAL', 0, 500, 'TIEMPO_REAL', 30, 'GAUGE', '#E74C3C', TRUE, TRUE, FALSE, FALSE, NULL),

-- KPI 4: Crecimiento de Ventas Mensual
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Ventas y Facturación'),
'Crecimiento de Ventas Mensual',
'Porcentaje de crecimiento de ventas vs mes anterior',
'SELECT ROUND(
    CASE 
        WHEN SUM(CASE WHEN TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ANTERIOR} THEN val_total_pedido ELSE 0 END) > 0
        THEN ((SUM(CASE WHEN TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ACTUAL} THEN val_total_pedido ELSE 0 END) - 
               SUM(CASE WHEN TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ANTERIOR} THEN val_total_pedido ELSE 0 END)) /
               SUM(CASE WHEN TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ANTERIOR} THEN val_total_pedido ELSE 0 END)) * 100
        ELSE 0
    END, 2
) FROM tab_ordenes WHERE ind_estado = 3',
'%', 'PERCENTAGE', -50, 100, 'DIARIA', 60, 'GAUGE', '#E74C3C', TRUE, FALSE, FALSE, FALSE, NULL),

-- KPI 5: Ventas por Categoría Top
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Ventas y Facturación'),
'Ventas Top por Categoría',
'Ingresos de la categoría más vendida del mes',
'SELECT COALESCE(MAX(total_ingresos), 0) FROM tab_estadisticas_categorias WHERE ingresos_mes_actual > 0',
'€', 'CURRENCY', 0, 20000, 'TIEMPO_REAL', 45, 'BARRA', '#E74C3C', TRUE, TRUE, FALSE, FALSE, NULL);

-- =====================================================
-- INSERTAR: KPIs de Productos e Inventario
-- =====================================================

INSERT INTO tab_kpis_maestros (
    id_tipo_kpi, nom_kpi, descripcion_kpi, formula_sql, unidad_medida, formato_numero,
    rango_esperado_min, rango_esperado_max, frecuencia_actualizacion, duracion_cache_minutos,
    tipo_grafico_sugerido, color_primario, mostrar_tendencia, mostrar_comparacion,
    solo_administradores, requiere_parametros, parametros_permitidos
) VALUES 

-- KPI 6: Productos Activos
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Productos e Inventario'),
'Productos Activos en Catálogo',
'Número total de productos activos disponibles para venta',
'SELECT COUNT(1) FROM tab_productos WHERE ind_activo = TRUE',
'productos', 'INTEGER', 10, 10000, 'DIARIA', 120, 'NUMERO', '#3498DB', FALSE, FALSE, FALSE, FALSE, NULL),

-- KPI 7: Productos con Stock Bajo
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Productos e Inventario'),
'Productos con Stock Bajo',
'Número de productos con stock menor a 10 unidades',
'SELECT COUNT(1) FROM tab_productos WHERE ind_activo = TRUE AND num_stock < 10',
'productos', 'INTEGER', 0, 50, 'TIEMPO_REAL', 15, 'NUMERO', '#E67E22', TRUE, FALSE, TRUE, FALSE, NULL),

-- KPI 8: Productos Más Vendidos del Mes
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Productos e Inventario'),
'Productos Más Vendidos',
'Cantidad de productos únicos vendidos en el mes actual',
'SELECT COUNT(DISTINCT id_producto) FROM tab_orden_productos op 
 JOIN tab_ordenes o ON op.id_orden = o.id_orden 
 WHERE o.ind_estado = 3 AND TO_CHAR(o.fec_pedido, ''YYYY-MM'') = ${MES_ACTUAL}',
'productos', 'INTEGER', 0, 500, 'TIEMPO_REAL', 30, 'NUMERO', '#3498DB', TRUE, TRUE, FALSE, FALSE, NULL),

-- KPI 9: Rotación de Inventario Promedio
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Productos e Inventario'),
'Rotación de Inventario',
'Promedio de rotación de inventario de productos activos',
'SELECT ROUND(AVG(rotacion_inventario), 2) FROM tab_estadisticas_productos WHERE producto_activo = TRUE AND total_unidades_vendidas > 0',
'veces/año', 'DECIMAL', 1, 12, 'DIARIA', 60, 'GAUGE', '#3498DB', TRUE, TRUE, TRUE, FALSE, NULL),

-- KPI 10: Productos Sin Ventas
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Productos e Inventario'),
'Productos Sin Ventas',
'Productos activos que no han registrado ventas',
'SELECT COUNT(1) FROM tab_productos p 
 LEFT JOIN tab_estadisticas_productos ep ON (p.id_categoria = ep.id_categoria AND p.id_linea = ep.id_linea AND p.id_sublinea = ep.id_sublinea AND p.id_producto = ep.id_producto)
 WHERE p.ind_activo = TRUE AND (ep.total_unidades_vendidas IS NULL OR ep.total_unidades_vendidas = 0)',
'productos', 'INTEGER', 0, 100, 'DIARIA', 60, 'NUMERO', '#E67E22', TRUE, FALSE, TRUE, FALSE, NULL);

-- =====================================================
-- INSERTAR: KPIs de Usuarios y Clientes
-- =====================================================

INSERT INTO tab_kpis_maestros (
    id_tipo_kpi, nom_kpi, descripcion_kpi, formula_sql, unidad_medida, formato_numero,
    rango_esperado_min, rango_esperado_max, frecuencia_actualizacion, duracion_cache_minutos,
    tipo_grafico_sugerido, color_primario, mostrar_tendencia, mostrar_comparacion,
    solo_administradores, requiere_parametros, parametros_permitidos
) VALUES 

-- KPI 11: Usuarios Registrados
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Usuarios y Clientes'),
'Usuarios Registrados',
'Total de usuarios registrados en el sistema',
'SELECT COUNT(1) FROM tab_usuarios WHERE ind_activo = TRUE',
'usuarios', 'INTEGER', 0, 100000, 'TIEMPO_REAL', 60, 'NUMERO', '#9B59B6', TRUE, TRUE, FALSE, FALSE, NULL),

-- KPI 12: Nuevos Usuarios del Mes
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Usuarios y Clientes'),
'Nuevos Usuarios del Mes',
'Usuarios registrados en el mes actual',
'SELECT COUNT(1) FROM tab_usuarios WHERE ind_activo = TRUE AND TO_CHAR(fec_creacion, ''YYYY-MM'') = ${MES_ACTUAL}',
'usuarios', 'INTEGER', 0, 1000, 'TIEMPO_REAL', 30, 'NUMERO', '#9B59B6', TRUE, TRUE, FALSE, FALSE, NULL),

-- KPI 13: Usuarios con Compras
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Usuarios y Clientes'),
'Usuarios con Compras',
'Usuarios que han realizado al menos una compra',
'SELECT COUNT(DISTINCT id_usuario) FROM tab_ordenes WHERE ind_estado = 3',
'usuarios', 'INTEGER', 0, 10000, 'TIEMPO_REAL', 45, 'NUMERO', '#9B59B6', TRUE, TRUE, FALSE, FALSE, NULL),

-- KPI 14: Tasa de Conversión
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Usuarios y Clientes'),
'Tasa de Conversión',
'Porcentaje de usuarios registrados que han comprado',
'SELECT ROUND(
    (COUNT(DISTINCT o.id_usuario)::DECIMAL / COUNT(DISTINCT u.id_usuario)) * 100, 2
) FROM tab_usuarios u 
LEFT JOIN tab_ordenes o ON u.id_usuario = o.id_usuario AND o.ind_estado = 3
WHERE u.ind_activo = TRUE',
'%', 'PERCENTAGE', 0, 100, 'DIARIA', 60, 'GAUGE', '#9B59B6', TRUE, TRUE, FALSE, FALSE, NULL);

-- =====================================================
-- INSERTAR: KPIs de Rendimiento Operacional
-- =====================================================

INSERT INTO tab_kpis_maestros (
    id_tipo_kpi, nom_kpi, descripcion_kpi, formula_sql, unidad_medida, formato_numero,
    rango_esperado_min, rango_esperado_max, frecuencia_actualizacion, duracion_cache_minutos,
    tipo_grafico_sugerido, color_primario, mostrar_tendencia, mostrar_comparacion,
    solo_administradores, requiere_parametros, parametros_permitidos
) VALUES 

-- KPI 15: Órdenes Pendientes
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Rendimiento Operacional'),
'Órdenes Pendientes',
'Número de órdenes en estado pendiente de pago',
'SELECT COUNT(1) FROM tab_ordenes WHERE ind_estado = 1',
'órdenes', 'INTEGER', 0, 100, 'TIEMPO_REAL', 5, 'NUMERO', '#F39C12', TRUE, FALSE, FALSE, FALSE, NULL),

-- KPI 16: Órdenes en Proceso
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Rendimiento Operacional'),
'Órdenes en Proceso',
'Número de órdenes pagadas en preparación',
'SELECT COUNT(1) FROM tab_ordenes WHERE ind_estado = 2',
'órdenes', 'INTEGER', 0, 200, 'TIEMPO_REAL', 5, 'NUMERO', '#F39C12', TRUE, FALSE, FALSE, FALSE, NULL),

-- KPI 17: Tiempo Promedio de Procesamiento
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Rendimiento Operacional'),
'Tiempo Promedio de Procesamiento',
'Días promedio entre creación y completado de órdenes',
'SELECT ROUND(AVG(EXTRACT(EPOCH FROM (fec_update - fec_pedido))/86400), 1) 
 FROM tab_ordenes WHERE ind_estado = 3 AND fec_update IS NOT NULL 
 AND TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ACTUAL}',
'días', 'DECIMAL', 0, 10, 'DIARIA', 60, 'GAUGE', '#F39C12', TRUE, TRUE, TRUE, FALSE, NULL),

-- KPI 18: Órdenes por Día (Promedio)
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Rendimiento Operacional'),
'Órdenes Diarias Promedio',
'Promedio de órdenes procesadas por día en el mes',
'SELECT ROUND(COUNT(1)::DECIMAL / EXTRACT(DAY FROM NOW()), 1) 
 FROM tab_ordenes WHERE ind_estado = 3 
 AND TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ACTUAL}',
'órdenes/día', 'DECIMAL', 0, 100, 'DIARIA', 30, 'LINEA', '#F39C12', TRUE, TRUE, FALSE, FALSE, NULL);

-- =====================================================
-- INSERTAR: KPIs de Puntos y Descuentos
-- =====================================================

INSERT INTO tab_kpis_maestros (
    id_tipo_kpi, nom_kpi, descripcion_kpi, formula_sql, unidad_medida, formato_numero,
    rango_esperado_min, rango_esperado_max, frecuencia_actualizacion, duracion_cache_minutos,
    tipo_grafico_sugerido, color_primario, mostrar_tendencia, mostrar_comparacion,
    solo_administradores, requiere_parametros, parametros_permitidos
) VALUES 

-- KPI 19: Puntos Totales en Circulación
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Puntos y Descuentos'),
'Puntos en Circulación',
'Total de puntos acumulados por todos los usuarios',
'SELECT COALESCE(SUM(puntos_disponibles), 0) FROM tab_puntos_usuario WHERE puntos_disponibles > 0',
'puntos', 'INTEGER', 0, 1000000, 'TIEMPO_REAL', 30, 'NUMERO', '#E67E22', TRUE, TRUE, FALSE, FALSE, NULL),

-- KPI 20: Canjes del Mes
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Puntos y Descuentos'),
'Canjes Realizados del Mes',
'Número de canjes de puntos realizados en el mes actual',
'SELECT COUNT(1) FROM tab_canjes_puntos_descuentos WHERE TO_CHAR(fec_canje, ''YYYY-MM'') = ${MES_ACTUAL}',
'canjes', 'INTEGER', 0, 500, 'TIEMPO_REAL', 15, 'NUMERO', '#E67E22', TRUE, TRUE, FALSE, FALSE, NULL),

-- KPI 21: Descuentos Activos
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Puntos y Descuentos'),
'Descuentos Activos',
'Número de descuentos disponibles para canje',
'SELECT COUNT(1) FROM tab_descuentos WHERE ind_activo = TRUE AND fecha_fin >= CURRENT_DATE',
'descuentos', 'INTEGER', 0, 50, 'DIARIA', 60, 'NUMERO', '#E67E22', FALSE, FALSE, FALSE, FALSE, NULL),

-- KPI 22: Usuarios con Puntos
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Puntos y Descuentos'),
'Usuarios con Puntos',
'Usuarios que tienen puntos disponibles para canjear',
'SELECT COUNT(1) FROM tab_puntos_usuario WHERE puntos_disponibles > 0',
'usuarios', 'INTEGER', 0, 10000, 'TIEMPO_REAL', 30, 'NUMERO', '#E67E22', TRUE, TRUE, FALSE, FALSE, NULL);

-- =====================================================
-- INSERTAR: KPIs Financieros (Solo Administradores)
-- =====================================================

INSERT INTO tab_kpis_maestros (
    id_tipo_kpi, nom_kpi, descripcion_kpi, formula_sql, unidad_medida, formato_numero,
    rango_esperado_min, rango_esperado_max, frecuencia_actualizacion, duracion_cache_minutos,
    tipo_grafico_sugerido, color_primario, mostrar_tendencia, mostrar_comparacion,
    solo_administradores, requiere_parametros, parametros_permitidos
) VALUES 

-- KPI 23: Ingresos Acumulados del Año
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Análisis Financiero'),
'Ingresos Anuales Acumulados',
'Total de ingresos del año actual',
'SELECT COALESCE(SUM(val_total_pedido), 0) FROM tab_ordenes WHERE ind_estado = 3 AND EXTRACT(YEAR FROM fec_pedido) = ${AÑO_ACTUAL}',
'€', 'CURRENCY', 0, 500000, 'DIARIA', 60, 'LINEA', '#27AE60', TRUE, TRUE, TRUE, FALSE, NULL),

-- KPI 24: Margen Promedio por Orden
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Análisis Financiero'),
'Margen Promedio por Orden',
'Margen de beneficio promedio por orden (estimado)',
'SELECT ROUND(AVG(val_total_pedido) * 0.3, 2) FROM tab_ordenes WHERE ind_estado = 3 AND TO_CHAR(fec_pedido, ''YYYY-MM'') = ${MES_ACTUAL}',
'€', 'CURRENCY', 0, 200, 'DIARIA', 60, 'GAUGE', '#27AE60', TRUE, TRUE, TRUE, FALSE, NULL),

-- KPI 25: Valor de Inventario
((SELECT id_tipo_kpi FROM tab_tipos_kpi WHERE nom_tipo_kpi = 'Análisis Financiero'),
'Valor Total del Inventario',
'Valor monetario total del inventario actual',
'SELECT ROUND(SUM(val_precio * num_stock), 2) FROM tab_productos WHERE ind_activo = TRUE AND num_stock > 0',
'€', 'CURRENCY', 0, 1000000, 'DIARIA', 120, 'NUMERO', '#27AE60', TRUE, TRUE, TRUE, FALSE, NULL);

-- =====================================================
-- COMENTARIOS Y NOTAS
-- =====================================================

/*
 * NOTAS DE IMPLEMENTACIÓN:
 * 
 * 1. Variables disponibles en fórmulas SQL:
 *    - ${MES_ACTUAL}: Mes actual en formato YYYY-MM
 *    - ${MES_ANTERIOR}: Mes anterior en formato YYYY-MM  
 *    - ${TRIMESTRE_ACTUAL}: Trimestre actual en formato YYYY-Q
 *    - ${AÑO_ACTUAL}: Año actual como número
 *    - ${FECHA_ACTUAL}: Fecha y hora actual
 * 
 * 2. Tipos de gráficos soportados:
 *    - NUMERO: Solo muestra el valor numérico
 *    - GAUGE: Medidor/velocímetro circular
 *    - LINEA: Gráfico de línea histórica
 *    - BARRA: Gráfico de barras
 *    - DONUT: Gráfico circular (para porcentajes)
 * 
 * 3. Formatos de número:
 *    - INTEGER: Números enteros
 *    - DECIMAL: Números decimales
 *    - CURRENCY: Formato monetario
 *    - PERCENTAGE: Formato porcentual
 * 
 * 4. Frecuencias de actualización:
 *    - TIEMPO_REAL: Se actualiza en cada consulta
 *    - HORARIA: Cache de 1 hora
 *    - DIARIA: Cache de 24 horas
 *    - SEMANAL: Cache de 7 días
 * 
 * 5. Permisos:
 *    - solo_administradores = TRUE: Solo usuarios admin pueden ver
 *    - solo_administradores = FALSE: Todos los usuarios pueden ver
 * 
 * 6. Parámetros dinámicos:
 *    - requiere_parametros = TRUE: El KPI acepta parámetros específicos
 *    - parametros_permitidos: JSON con lista de parámetros válidos
 */ 