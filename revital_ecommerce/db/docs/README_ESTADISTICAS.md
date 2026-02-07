# Sistema de Estadísticas de Ventas - DB_Revital

## 📊 Resumen General

El **Sistema de Estadísticas de Ventas** proporciona análisis en tiempo real de productos y categorías mediante tablas desnormalizadas optimizadas para consultas rápidas de reportes y dashboards. Se actualiza automáticamente al completar órdenes.

## 🏗️ Arquitectura del Sistema

### **Componentes Principales**

1. **📂 Esquemas de Datos** (`schema_estadisticas_ventas.sql`)

   - `tab_estadisticas_productos`: Métricas por producto
   - `tab_estadisticas_categorias`: Métricas agregadas por categoría
   - Vistas optimizadas para consultas

2. **⚙️ Funciones de Procesamiento**

   - `fun_actualizar_resumen_ventas`: Estadísticas por producto
   - `fun_actualizar_resumen_categoria`: Estadísticas por categoría
   - `fun_sincronizar_estadisticas_completas`: Sincronización completa

3. **🔔 Triggers Automáticos** (`trg_actualizar_estadisticas_ventas.sql`)
   - Actualizaciones en tiempo real al completar órdenes
   - Manejo de modificaciones posteriores

## 🎯 Funcionalidades Clave

### **📈 fun_actualizar_resumen_ventas**

**Propósito**: Actualiza estadísticas detalladas por producto

**Métricas Calculadas**:

- ✅ **Totales Históricos**: Órdenes, unidades vendidas, ingresos
- ✅ **Estadísticas Mensuales**: Actual vs anterior
- ✅ **Análisis de Tendencias**: Promedios, mejor mes
- ✅ **Rotación de Inventario**: Alta/Media/Baja/Sin ventas
- ✅ **Fechas Importantes**: Primera y última venta

**Parámetros**:

```sql
fun_actualizar_resumen_ventas(
    p_id_categoria DECIMAL(10) DEFAULT NULL,
    p_id_linea DECIMAL(10) DEFAULT NULL,
    p_id_sublinea DECIMAL(10) DEFAULT NULL,
    p_id_producto DECIMAL(10) DEFAULT NULL,
    p_recalcular_todo BOOLEAN DEFAULT FALSE
)
```

**Casos de Uso**:

- 🔄 Trigger automático al completar órdenes
- 🔧 Actualización específica de productos
- 🔄 Recálculo completo para mantenimiento

### **📊 fun_actualizar_resumen_categoria**

**Propósito**: Agrega estadísticas por categoría consolidando productos

**Métricas Calculadas**:

- ✅ **Agregación de Productos**: Total, activos, con ventas
- ✅ **Suma de Ventas**: Órdenes, unidades, ingresos
- ✅ **Participación**: % en ventas totales del sistema
- ✅ **Productos Top**: Más vendido, mayor ingreso
- ✅ **Análisis de Crecimiento**: % mensual

**Parámetros**:

```sql
fun_actualizar_resumen_categoria(
    p_id_categoria DECIMAL(10) DEFAULT NULL,
    p_recalcular_todo BOOLEAN DEFAULT FALSE
)
```

**Dependencias**:

- ⚠️ Ejecutar después de `fun_actualizar_resumen_ventas`
- 📊 Lee datos de `tab_estadisticas_productos`

### **🔄 fun_sincronizar_estadisticas_completas**

**Propósito**: Función auxiliar que ejecuta ambas actualizaciones en secuencia

**Ventajas**:

- ✅ Garantiza orden correcto de ejecución
- ✅ Manejo consolidado de errores
- ✅ Respuesta unificada con métricas de ambos procesos

## 🔔 Sistema de Triggers

### **Eventos Monitoreados**

1. **🛒 Orden Completada**

   ```sql
   trg_actualizar_estadisticas_orden_completada
   ```

   - **Evento**: `UPDATE OF ind_estado ON tab_ordenes`
   - **Condición**: `NEW.ind_estado = 3`
   - **Acción**: Actualiza estadísticas de todas las categorías afectadas

2. **📝 Modificación de Productos**
   ```sql
   trg_actualizar_estadisticas_cambio_producto_orden
   ```
   - **Evento**: `INSERT/UPDATE/DELETE ON tab_orden_productos`
   - **Condición**: Orden ya completada
   - **Acción**: Recalcula estadísticas afectadas

### **Características de los Triggers**

- ✅ **No Bloquean**: Errores no afectan transacción principal
- ✅ **Eficientes**: Solo procesan categorías afectadas
- ✅ **Logs Detallados**: Registro completo de ejecuciones
- ✅ **Manejo de Errores**: Warnings en lugar de fallas

## 📋 Tablas de Estadísticas

### **tab_estadisticas_productos**

**Estructura Principal**:

```sql
-- Identificación del producto (FK compuesta)
id_categoria, id_linea, id_sublinea, id_producto

-- Información desnormalizada
nom_producto, precio_actual, stock_actual, producto_activo

-- Estadísticas de ventas
total_ordenes, total_unidades_vendidas, total_ingresos

-- Análisis temporal
ventas_mes_actual, ingresos_mes_actual
ventas_mes_anterior, ingresos_mes_anterior

-- Tendencias y rotación
promedio_venta_mensual, rotacion_inventario, nivel_rotacion
fecha_primera_venta, fecha_ultima_venta, mes_mejor_venta
```

**Índices Optimizados**:

- 📈 Por ventas totales (DESC)
- 💰 Por ingresos totales (DESC)
- 🔄 Por nivel de rotación
- 📅 Por fecha de última venta

### **tab_estadisticas_categorias**

**Estructura Principal**:

```sql
-- Identificación
id_categoria, nom_categoria, categoria_activa

-- Agregación de productos
total_productos, productos_activos, productos_con_ventas

-- Estadísticas consolidadas
total_ordenes, total_unidades_vendidas, total_ingresos
participacion_ventas, crecimiento_mensual

-- Productos destacados
producto_mas_vendido, producto_mayor_ingreso
```

## 👁️ Vistas Optimizadas

### **vw_top_productos_vendidos**

- Rankings por unidades e ingresos
- Solo productos activos con ventas
- Información combinada producto + categoría

### **vw_resumen_ventas_categoria**

- Rankings de categorías
- Análisis de tendencias automático
- Clasificación de crecimiento

## 🔧 Mantenimiento y Operaciones

### **Recálculo Batch Completo**

```sql
-- Recalcular todas las estadísticas
SELECT fun_recalcular_estadisticas_batch();

-- Solo categorías activas
SELECT fun_recalcular_estadisticas_batch(true, false);
```

### **Actualización Específica**

```sql
-- Producto específico
SELECT fun_actualizar_resumen_ventas(1, 1, 1, 5);

-- Categoría específica
SELECT fun_actualizar_resumen_categoria(1);

-- Sincronización completa de una categoría
SELECT fun_sincronizar_estadisticas_completas(1);
```

### **Consultas de Monitoreo**

```sql
-- Top 10 productos más vendidos
SELECT * FROM vw_top_productos_vendidos LIMIT 10;

-- Resumen de todas las categorías
SELECT * FROM vw_resumen_ventas_categoria
ORDER BY ranking_ingresos;

-- Productos con rotación baja
SELECT nom_producto, nivel_rotacion, dias_desde_ultima_venta
FROM tab_estadisticas_productos
WHERE nivel_rotacion = 'BAJA';
```

## 🔄 Flujo de Integración

### **Secuencia Típica**

1. **🛒 Usuario completa compra**

   ```
   UPDATE tab_ordenes SET ind_estado = 3 WHERE id_orden = X;
   ```

2. **🔔 Trigger se ejecuta automáticamente**

   ```
   trg_actualizar_estadisticas_orden_completada
   ```

3. **📊 Procesamiento por categoría**

   ```
   fun_actualizar_resumen_ventas(categoria_afectada)
   fun_actualizar_resumen_categoria(categoria_afectada)
   ```

4. **✅ Estadísticas actualizadas**

   ```
   tab_estadisticas_productos ← Métricas por producto
   tab_estadisticas_categorias ← Métricas por categoría
   ```

5. **📱 Consulta en dashboards**
   ```
   SELECT * FROM vw_top_productos_vendidos;
   ```

## ⚡ Consideraciones de Rendimiento

### **Optimizaciones Implementadas**

- ✅ **Tablas Desnormalizadas**: Consultas rápidas sin JOINs complejos
- ✅ **Índices Estratégicos**: Ordenamiento por métricas clave
- ✅ **Procesamiento Incremental**: Solo categorías afectadas
- ✅ **Cálculos Precalculados**: Promedios, porcentajes, rankings

### **Mejores Prácticas**

- 🔄 **Recálculo Batch**: Ejecutar en horarios de bajo tráfico
- 📊 **Monitoreo**: Verificar logs de triggers regularmente
- 🔧 **Mantenimiento**: Ejecutar recálculo completo mensualmente
- 📈 **Análisis**: Usar vistas para reportes frecuentes

## 🎯 Casos de Uso del Backend

### **Dashboard de Gerencia**

```javascript
// Top productos
const topProductos = await db.query(`
    SELECT * FROM vw_top_productos_vendidos 
    WHERE ranking_unidades <= 10
`);

// Resumen de categorías
const resumenCategorias = await db.query(`
    SELECT * FROM vw_resumen_ventas_categoria 
    ORDER BY participacion_ventas DESC
`);
```

### **Reportes de Ventas**

```javascript
// Productos con problemas de rotación
const productosLentaRotacion = await db.query(`
    SELECT nom_producto, nivel_rotacion, 
           dias_desde_ultima_venta, stock_actual
    FROM tab_estadisticas_productos 
    WHERE nivel_rotacion IN ('BAJA', 'SIN_VENTAS')
    ORDER BY dias_desde_ultima_venta DESC
`);
```

### **Analytics en Tiempo Real**

```javascript
// Crecimiento mensual por categoría
const crecimientoCategorias = await db.query(`
    SELECT nom_categoria, crecimiento_mensual, tendencia_categoria
    FROM vw_resumen_ventas_categoria 
    WHERE crecimiento_mensual IS NOT NULL
    ORDER BY crecimiento_mensual DESC
`);
```

## 🚀 Beneficios del Sistema

### **Para el Negocio**

- 📊 **Visibilidad en Tiempo Real** de ventas y tendencias
- 🎯 **Identificación Rápida** de productos top y problemáticos
- 📈 **Análisis de Crecimiento** mensual automático
- 🔄 **Optimización de Inventario** basada en rotación

### **Para el Desarrollo**

- ⚡ **Consultas Optimizadas** sin cálculos complejos en tiempo real
- 🔧 **Mantenimiento Automático** de estadísticas
- 📝 **Logs Detallados** para debugging
- 🔄 **Escalabilidad** para grandes volúmenes de datos

### **Para Usuarios Finales**

- 📱 **Dashboards Rápidos** con métricas actualizadas
- 📊 **Reportes Instantáneos** sin esperas
- 🎯 **Información Precisa** y confiable
- 📈 **Análisis Avanzados** accesibles

---

**🔗 Archivos Relacionados:**

- `schema_estadisticas_ventas.sql` - Esquemas de tablas
- `fun_actualizar_resumen_ventas.sql` - Función de productos
- `fun_actualizar_resumen_categoria.sql` - Función de categorías
- `trg_actualizar_estadisticas_ventas.sql` - Triggers automáticos

**📝 Nota**: Este sistema funciona de manera completamente automática. Solo requiere configuración inicial y mantenimiento periódico opcional.
