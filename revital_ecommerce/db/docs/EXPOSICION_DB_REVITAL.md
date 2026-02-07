# 🗄️ DOCUMENTACIÓN COMPLETA - SISTEMA DB_REVITAL

**Exposición Técnica - 15 Minutos**  
**Sistema de E-Commerce con Gestión de Puntos y Descuentos**

---

## 🎯 RESUMEN EJECUTIVO

### ¿Qué es DB_Revital?

Sistema de base de datos PostgreSQL para **e-commerce completo** con:

- **26 tablas principales** interconectadas
- **Sistema de puntos por fidelización**
- **Sistema de descuentos automáticos y canjeables**
- **Gestión completa de inventario**
- **Carrito de compras inteligente**

### Números Clave:

- **🔧 85+ Funciones** almacenadas organizadas por entidad
- **⚡ 2 Triggers** automáticos para puntos
- **👁️ 2 Views** optimizadas para consultas frecuentes
- **📊 15+ Índices** para máxima performance
- **🛡️ Auditoría completa** en todas las tablas

---

## 🏗️ ARQUITECTURA GENERAL

### Diseño en Capas:

```
┌─────────────────────────────────────┐
│         LÓGICA DE NEGOCIO           │
│    (Funciones PL/pgSQL + JSON)     │
├─────────────────────────────────────┤
│         AUTOMATIZACIÓN              │
│      (Triggers + Views)             │
├─────────────────────────────────────┤
│       MODELO DE DATOS               │
│   (26 Tablas + Relaciones)         │
├─────────────────────────────────────┤
│       OPTIMIZACIÓN                  │
│    (Índices + Constrains)          │
└─────────────────────────────────────┘
```

### Principios de Diseño:

- ✅ **Integridad Referencial**: FK's en cascada
- ✅ **Consistencia Transaccional**: ACID completo
- ✅ **Escalabilidad**: Índices estratégicos
- ✅ **Auditoría**: Timestamps en todas las operaciones
- ✅ **Flexibilidad**: Campos JSON para datos dinámicos

---

## 📊 ESTRUCTURA DE TABLAS

### 🛍️ Core E-Commerce (8 tablas)

```sql
tab_productos        → Catálogo principal (FK compuesta)
tab_categorias       → Organización jerárquica
tab_lineas          → Clasificación por línea
tab_sublineas       → Sub-clasificación
tab_marcas          → Brands/fabricantes
tab_proveedores     → Suppliers/vendors
tab_inventario      → Stock y movimientos
tab_ordenes         → Órdenes de compra
```

### 🛒 Sistema de Carrito (3 tablas)

```sql
tab_carritos           → Carrito principal por usuario
tab_carrito_productos  → Productos específicos en carrito
tab_orden_productos    → Productos en órdenes finalizadas
```

### 🎁 Sistema de Puntos (4 tablas)

```sql
tab_puntos_usuario           → Saldo actual por usuario
tab_movimientos_puntos       → Historial de transacciones
tab_config_puntos_empresa    → Configuración de conversión
tab_canjes_puntos_descuentos → Canjes realizados
```

### 💰 Sistema de Descuentos (2 tablas)

```sql
tab_descuentos         → Definición de descuentos
tab_descuentos_usuarios → Uso por usuario específico
```

---

## ⚙️ SISTEMA DE FUNCIONES

### Organización por Entidades (26 carpetas):

#### 🎯 Funciones Clave de Negocio:

**1. Proceso de Compra Completo**

```sql
sp_crear_orden_desde_carrito(
  p_id_usuario,
  p_metodo_pago,
  p_id_canje_aplicar,
  p_observaciones
) → JSON completo
```

**Proceso interno:**

1. ✅ Validar carrito y stock
2. 🧮 Calcular descuentos automáticos
3. 💳 Crear orden principal
4. 📦 Transferir productos carrito→orden
5. 📉 Actualizar inventarios
6. 🎁 Aplicar canjes de puntos
7. 🗃️ Registrar movimientos
8. 🧹 Limpiar carrito

**2. Cálculo Inteligente de Carrito**

```sql
fn_calcular_total_carrito(
  p_id_usuario,
  p_id_canje_aplicar
) → JSON detallado
```

**Incluye:**

- 💰 Subtotales por producto
- 🎯 Descuentos automáticos aplicables
- 🎁 Descuentos por canje de puntos
- 📊 Totales finales con breakdown

**3. Sistema de Puntos Automático**

```sql
fn_acumular_puntos_compra(
  p_id_usuario,
  p_id_orden,
  p_valor_compra,
  p_usuario_sistema
) → cantidad_puntos_ganados
```

---

## ⚡ TRIGGERS AUTOMÁTICOS

### 🎁 Acumulación Automática de Puntos

**Trigger Function:**

```sql
trg_acumular_puntos_orden() → TRIGGER
```

**Trigger Definition:**

```sql
CREATE TRIGGER trg_orden_acumular_puntos
    AFTER UPDATE ON tab_ordenes
    FOR EACH ROW
    EXECUTE FUNCTION trg_acumular_puntos_orden();
```

**Lógica:**

1. 🔍 **Detecta**: Orden cambia a estado completado (ind_estado = 3)
2. ✅ **Valida**: Estado anterior no era completado
3. 🎁 **Ejecuta**: `fn_acumular_puntos_compra()` automáticamente
4. 📝 **Registra**: Movimiento en historial de puntos

**Beneficios:**

- ⚡ **Automático**: Sin intervención manual
- 🛡️ **Seguro**: Solo acumula una vez por orden
- 📊 **Trazable**: Historial completo de movimientos

---

## 👁️ VIEWS OPTIMIZADAS

### 1. Vista de Descuentos Canjeables

```sql
CREATE VIEW vw_descuentos_canjeables AS
SELECT
    id_descuento,
    nom_descuento,
    des_descuento,
    costo_puntos_canje,
    -- Valor formateado (% o $)
    CASE
        WHEN tipo_calculo THEN CONCAT(val_porce_descuento, '%')
        ELSE CONCAT('$', val_monto_descuento)
    END AS valor_descuento,
    -- Estado calculado en tiempo real
    CASE
        WHEN CURRENT_DATE BETWEEN fec_inicio AND fec_fin THEN 'Vigente'
        WHEN CURRENT_DATE < fec_inicio THEN 'Programado'
        ELSE 'Vencido'
    END AS estado_vigencia
FROM tab_descuentos
WHERE ind_canjeable_puntos = TRUE;
```

### 2. Vista de Resumen de Puntos por Usuario

```sql
CREATE VIEW vw_resumen_puntos_usuario AS
SELECT
    u.id_usuario,
    u.nom_usuario,
    u.ape_usuario,
    u.email_usuario,
    COALESCE(pu.puntos_disponibles, 0) as puntos_disponibles,
    COALESCE(pu.puntos_totales_ganados, 0) as puntos_totales_ganados,
    COALESCE(pu.puntos_totales_canjeados, 0) as puntos_totales_canjeados,
    pu.fec_ultima_acumulacion,
    pu.fec_ultimo_canje,
    -- Canjes disponibles no vencidos
    COUNT(cpd.id_canje) as canjes_disponibles
FROM tab_usuarios u
LEFT JOIN tab_puntos_usuario pu ON u.id_usuario = pu.id_usuario
LEFT JOIN tab_canjes_puntos_descuentos cpd ON (
    u.id_usuario = cpd.id_usuario
    AND cpd.ind_utilizado = FALSE
    AND (cpd.fec_expiracion_canje IS NULL OR cpd.fec_expiracion_canje >= CURRENT_DATE)
)
WHERE u.id_rol = 2  -- Solo clientes
GROUP BY [campos_usuario];
```

---

## 📊 ÍNDICES DE PERFORMANCE

### 🎯 Índices Estratégicos:

**Sistema de Descuentos:**

```sql
-- Consultas por fechas y estado
idx_descuentos_fechas_activo ON (fec_inicio, fec_fin, ind_activo)

-- Búsquedas por código
idx_descuentos_codigo ON (codigo_descuento)

-- Filtros por aplicación
idx_descuentos_aplica_a ON (aplica_a)

-- Descuentos especiales
idx_descuentos_cumpleanos ON (ind_es_para_cumpleanos)
idx_descuentos_primera_compra ON (solo_primera_compra)
```

**Sistema de Puntos:**

```sql
-- Consultas de usuario
idx_puntos_usuario_lookup ON (id_usuario)

-- Historial ordenado
idx_movimientos_puntos_usuario_fecha ON (id_usuario, fec_movimiento DESC)

-- Filtros por tipo
idx_movimientos_puntos_tipo ON (tipo_movimiento)
```

**Canjes y Configuración:**

```sql
-- Descuentos canjeables
idx_descuentos_canjeables ON (ind_canjeable_puntos, ind_activo)

-- Canjes disponibles por usuario
idx_canjes_usuario_disponibles ON (id_usuario, ind_utilizado, fec_expiracion_canje)

-- Configuración activa
idx_config_puntos_activa ON (ind_activo)
```

---

## 🧠 LÓGICA DE NEGOCIO

### 🎯 Principios Fundamentales:

**1. Sistema de Puntos Inteligente**

```
Compra ($100) → Configuración (10 puntos/$) → 1000 puntos ganados
├── Acumulación automática via trigger
├── Registro en historial de movimientos
├── Actualización de saldo disponible
└── Opción de canje inmediato
```

**2. Descuentos Multicapa**

```
Orden Final = Productos Base - Descuentos Automáticos - Descuentos Canjeados
├── Automáticos: Por categoría, primera compra, cumpleaños
├── Canjeados: Por puntos acumulados
├── Validaciones: Fechas, límites, restricciones
└── Acumulativos: Se suman todos los aplicables
```

**3. Carrito Inteligente**

```
Carrito → Validaciones → Cálculos → Orden → Inventario → Puntos
├── Verificación de stock en tiempo real
├── Precios actualizados automáticamente
├── Descuentos calculados dinámicamente
├── Migración carritos anónimos→usuarios
└── Limpieza automática post-compra
```

---

## 🚀 FLUJOS PRINCIPALES

### 🛒 Flujo de E-Commerce:

1. **Catálogo** → Productos organizados por categorías/líneas/sublíneas
2. **Carrito** → Agregado inteligente con validaciones
3. **Checkout** → Proceso completo con descuentos
4. **Orden** → Creación con inventario y puntos
5. **Fulfillment** → Actualización de estados

### 🎁 Flujo de Puntos:

1. **Compra** → Trigger automático de acumulación
2. **Acumulación** → Cálculo según configuración empresa
3. **Disponibilidad** → Saldo actualizado en tiempo real
4. **Canje** → Intercambio por descuentos
5. **Aplicación** → Uso en nuevas compras

### 💰 Flujo de Descuentos:

1. **Creación** → Configuración administrativa
2. **Activación** → Control de vigencia
3. **Aplicación** → Automática según reglas
4. **Validación** → Restricciones y límites
5. **Tracking** → Uso por usuario

---

## 📈 CONCLUSIONES TÉCNICAS

### ✅ Fortalezas del Sistema:

- **🏗️ Arquitectura robusta**: Diseño escalable y mantenible
- **⚡ Performance optimizada**: Índices estratégicos
- **🛡️ Integridad garantizada**: Constraints y validaciones
- **🤖 Automatización inteligente**: Triggers y funciones
- **📊 Flexibilidad**: JSON para datos dinámicos
- **🔍 Trazabilidad completa**: Auditoría en todas las operaciones

### 🎯 Casos de Uso Principales:

- **E-commerce B2C** con gestión completa de productos
- **Sistema de fidelización** con puntos y descuentos
- **Gestión de inventario** con trazabilidad
- **Panel administrativo** con reportes y analytics
- **Multi-usuario** con roles y permisos

### 📊 Métricas de Rendimiento:

- **26 entidades** completamente modeladas
- **85+ funciones** de lógica de negocio
- **15+ índices** para optimización
- **100% auditoría** en operaciones críticas
- **Soporte JSON** para extensibilidad futura

---

## 📞 PUNTOS CLAVE PARA LA EXPOSICIÓN

### 💡 Highlights Técnicos (5 min):

1. **Arquitectura multicapa** con separación clara de responsabilidades
2. **Automatización inteligente** via triggers para puntos
3. **Cálculos complejos** de descuentos en tiempo real
4. **Performance optimizada** con índices estratégicos

### 🛍️ Funcionalidad de Negocio (5 min):

1. **E-commerce completo** desde carrito hasta entrega
2. **Sistema de puntos** automático por fidelización
3. **Descuentos multicapa** automáticos y canjeables
4. **Gestión de inventario** con trazabilidad completa

### 🚀 Valor Diferencial (5 min):

1. **Todo integrado** en una sola base de datos
2. **Lógica de negocio** en el nivel de datos
3. **Escalabilidad** sin modificar estructura
4. **Mantenibilidad** con organización clara

---

**🎯 MENSAJE FINAL**: DB_Revital es un sistema de base de datos **empresarial**, **escalable** y **completo** que maneja toda la lógica de un e-commerce moderno con sistemas de puntos y descuentos, optimizado para **performance** y **mantenibilidad**.
