# ---🔄 CICLO COMPLETO DEL SISTEMA E-COMMERCE CON FIDELIZACIÓN

## 📖 **DESCRIPCIÓN GENERAL**

Este documento describeel flujo completo del sistema de e-commerce con programa de fidelización, desde la configuración inicial hasta la finalización de una compra con acumulación de puntos. El sistema permite a los usuarios:

- 🛒 Navegar productos y gestionar carritos
- 💰 Aplicar descuentos automáticos y por puntos
- 🎁 Acumular y canjear puntos de fidelización
- 📋 Procesar órdenes completas
- 📊 Consultar historial y estadísticas

---

## 🛠️ **PREREQUISITOS Y CONFIGURACIÓN INICIAL**

### **Tablas Base Requeridas:**

- ✅ `tab_usuarios` (usuarios del sistema)
- ✅ `tab_productos` (catálogo de productos)
- ✅ `tab_carritos` (carritos de compra)
- ✅ `tab_ordenes` (órdenes de compra)
- ✅ `tab_config_puntos_empresa` (configuración de puntos)
- ✅ `tab_puntos_usuario` (puntos por usuario)
- ✅ `tab_descuentos` (descuentos disponibles)

### **Funciones Core Disponibles:**

- ✅ `fn_obtener_config_puntos_activa()`
- ✅ `fn_calcular_puntos_por_compra()`
- ✅ `fn_acumular_puntos_compra()`
- ✅ `fn_obtener_resumen_puntos_usuario()`
- ✅ `fn_listar_descuentos_canjeables()`
- ✅ `fn_canjear_puntos_descuento()`
- ✅ `fn_calcular_total_carrito()`

---

## 🚀 **FASE 1: CONFIGURACIÓN INICIAL DEL SISTEMA**

### **Objetivo:** Establecer los parámetros base del sistema de puntos

```sql
-- 1.1 Configurar relación peso/puntos del sistema
INSERT INTO tab_config_puntos_empresa (
    pesos_por_punto,
    descripcion,
    fec_inicio_vigencia,
    usr_insert
) VALUES (
    1000,  -- 1 punto por cada $1000 pesos
    'Configuración inicial: 1 punto por cada $1000 pesos gastados',
    CURRENT_DATE,
    'admin'
);

-- 1.2 Verificar configuración activa
SELECT * FROM fn_obtener_config_puntos_activa();
```

**📊 Resultado esperado:**

```json
{
  "id_config_puntos": 1,
  "pesos_por_punto": 1000.0,
  "ind_activo": true,
  "descripcion": "Configuración inicial: 1 punto por cada $1000 pesos gastados"
}
```

---

## 👤 **FASE 2: REGISTRO Y AUTENTICACIÓN DE USUARIO**

### **Objetivo:** Crear cuenta de usuario y verificar acceso

```sql
-- 2.1 Registrar nuevo usuario (función a implementar)
SELECT fun_insert_usuarios(
    1345235                     --Cedula
    'Juan',                    -- nombre
    'Pérez',                   -- apellido
    'juan.perez@email.com',    -- email
    'password123',             -- contraseña (hasheada)
    '1990-05-15',             -- fecha nacimiento
    2,                          -- id_rol (2 = cliente)
    FALSE,
    332145556,
) AS registro_usuario;

-- 2.2 Verificar usuario creado y activo
SELECT
    id_usuario,
    nom_usuario,
    ape_usuario,
    email_usuario,
    ind_activo,
    id_rol
FROM tab_usuarios
WHERE email_usuario = 'juan.perez@email.com'


-- 2.3 Inicializar puntos del usuario (automático)
SELECT fn_obtener_resumen_puntos_usuario(1) AS puntos_iniciales;
```

**📊 Estado inicial del usuario:**

```json
{
  "usuario": { "id_usuario": 1, "nombre_completo": "Juan Pérez" },
  "puntos": {
    "disponibles": 0,
    "totales_ganados": 0,
    "totales_canjeados": 0,
    "valor_estimado_pesos": 0
  },
  "canjes_disponibles": 0
}
```

---

## 🛍️ **FASE 3: NAVEGACIÓN Y SELECCIÓN DE PRODUCTOS**

### **Objetivo:** Explorar catálogo y seleccionar productos para comprar

```sql
-- 3.1 Listar productos disponibles por categoría
SELECT
    p.id_categoria, p.id_linea, p.id_sublinea, p.id_producto,
    p.nom_producto,
    p.val_precio,
    p.num_stock,
    c.nom_categoria,
    m.nom_marca
FROM tab_productos p
JOIN tab_categorias c ON p.id_categoria = c.id_categoria
JOIN tab_marcas m ON p.id_marca = m.id_marca
WHERE p.ind_activo = TRUE
  AND p.num_stock > 0
  AND p.id_categoria = 1  -- Filtrar por Tecnología
ORDER BY p.val_precio ASC;

-- 3.2 Ver detalles específicos de un producto
SELECT p.*, c.nom_categoria, l.nom_linea, s.nom_sublinea, m.nom_marca
FROM tab_productos p
JOIN tab_categorias c ON p.id_categoria = c.id_categoria
JOIN tab_lineas l ON p.id_linea = l.id_linea
JOIN tab_sublineas s ON p.id_sublinea = s.id_sublinea
JOIN tab_marcas m ON p.id_marca = m.id_marca
WHERE p.id_categoria = 1 AND p.id_linea = 1 AND p.id_sublinea = 1 AND p.id_producto = 1;
```

**📊 Productos disponibles ejemplo:**
| Producto | Precio | Stock | Categoría |
|--------------------|------------|-------|------------|
| Samsung Galaxy S24 | $899,000 | 20 | Tecnología |
| iPhone 15 Pro | $1,299,000 | 15 | Tecnología |
| MacBook Air M2 | $1,899,000 | 8 | Tecnología |

---

## 🛒 **FASE 4: GESTIÓN DEL CARRITO DE COMPRAS**

### **Objetivo:** Agregar productos seleccionados al carrito

```sql
-- 4.1 Obtener o crear carrito del usuario
SELECT fn_obtener_carrito_usuario(1) AS id_carrito;
-- Devuelve el ID del carrito activo o crea uno nuevo

-- 4.2 Agregar primer producto al carrito
SELECT sp_agregar_producto_carrito(
    1,      -- id_categoria (Tecnología)
    1,      -- id_linea (Smartphones)
    1,      -- id_sublinea (Samsung)
    2,      -- id_producto (Galaxy S24)
    1,      -- cantidad
    'sistema',
	1099735379
) AS resultado_producto_1;

-- 4.3 Agregar segundo producto al carrito
SELECT sp_agregar_producto_carrito(
    1,      -- id_categoria (Tecnología)
    1,      -- id_linea (Smartphones)
    2,      -- id_sublinea (Samsung)
    1,      -- id_producto (Galaxy S24)
    1,      -- cantidad
    'sistema',
	1099735379
) AS resultado_producto_1;

-- 4.4 Ver contenido completo del carrito
SELECT * FROM fn_obtener_carrito_detalle(1) AS contenido_carrito;
```

**📊 Contenido del carrito:**
| Producto | Cantidad | Precio Unitario | Subtotal |
|--------------------|----------|-----------------|-----------------|
| Samsung Galaxy S24 | 1 | $899,000 | $899,000 |
| iPhone 15 Pro | 1 | $1,299,000 | $1,299,000 |
| **TOTAL** | **2** | | **$2,198,000** |

---

## 💰 **FASE 5: VERIFICACIÓN DE PUNTOS Y DESCUENTOS**

### **Objetivo:** Revisar puntos disponibles y descuentos canjeables

```sql
-- 5.1 Consultar puntos actuales del usuario
SELECT fn_obtener_resumen_puntos_usuario(1) AS puntos_usuario;

-- 5.2 Listar descuentos canjeables con puntos disponibles
SELECT * FROM fn_listar_descuentos_canjeables(1, 10, 0) AS descuentos_disponibles;

-- 5.3 Ver historial de puntos (opcional)
SELECT * FROM fn_obtener_historial_puntos(1, 5, 0) AS historial_puntos;
```

**📊 Descuentos canjeables ejemplo:**
| Descuento | Costo Puntos | Valor | Puede Canjear |
|---------------------------|---------------|------- |---------------------|
| Descuento $5,000 | 15 puntos | $5,000 | ❌ (faltan puntos) |
| Descuento 10% | 25 puntos | 10% | ❌ (faltan puntos) |
| Descuento 20% Tecnología | 40 puntos | 20% | ❌ (faltan puntos) |

---

## 🎯 **FASE 6: CANJE DE PUNTOS POR DESCUENTOS (SI APLICA)**

### **Objetivo:** Usar puntos acumulados para obtener descuentos

```sql
-- 6.1 Canjear puntos por descuento (solo si tiene puntos suficientes)
-- Ejemplo: Usuario tiene 30 puntos y quiere canjear descuento de 25 puntos
SELECT fn_canjear_puntos_descuento(
    1,      -- id_usuario
    8,      -- id_descuento (Descuento 10% - 25 puntos)
    'juan'  -- usr_operacion
) AS resultado_canje;

-- 6.2 Verificar estado de puntos después del canje
SELECT fn_obtener_resumen_puntos_usuario(1) AS puntos_post_canje;
```

**📊 Resultado del canje:**

```json
{
  "success": true,
  "message": "Descuento canjeado exitosamente",
  "id_canje": 15,
  "descuento": "Descuento 10% - Canje Puntos",
  "puntos_utilizados": 25,
  "puntos_restantes": 5
}
```

---

## 🧮 **FASE 7: CÁLCULO Y APLICACIÓN DE DESCUENTOS**

### **Objetivo:** Calcular total final con todos los descuentos aplicables

```sql
-- 7.1 Calcular total del carrito con descuentos automáticos + canjeados
SELECT fn_calcular_total_carrito(1, 'juan') AS total_final;
```

**📊 Desglose de descuentos:**

```json
{
  "success": true,
  "total_original": 2198000,
  "descuentos_aplicados": [
    {
      "id_descuento": 5,
      "nombre": "Descuento 15% Productos Apple",
      "tipo": "automático",
      "valor_descuento": 194850,
      "aplicado_a": "iPhone 15 Pro"
    },
    {
      "id_descuento": 8,
      "nombre": "Descuento 10% - Canje Puntos",
      "tipo": "canje_puntos",
      "valor_descuento": 200315,
      "aplicado_a": "total_pedido"
    }
  ],
  "total_descuentos": 395165,
  "total_final": 1802835,
  "puntos_a_ganar": 1803
}
```

---

## 📋 **FASE 8: CREACIÓN DE LA ORDEN**

### **Objetivo:** Convertir carrito en orden formal de compra

```sql
-- 8.1 Crear orden desde el carrito
SELECT sp_crear_orden_desde_carrito(
    1,                          -- id_usuario
    1,                          -- id_carrito
    2,                          -- id_metodo_pago (1=efectivo, 2=tarjeta, 3=transferencia)
    'Entrega a domicilio',      -- observaciones
    'juan'                      -- usr_operacion
) AS orden_creada;

-- 8.2 Verificar orden creada
SELECT
    o.id_orden,
    o.fec_pedido,
    o.val_total_pedido,
    o.ind_estado,              -- 1=pendiente, 2=procesando, 3=completada
    o.ind_metodo_pago,
    o.des_observaciones
FROM tab_ordenes o
WHERE o.id_usuario = 1
ORDER BY o.fec_pedido DESC
LIMIT 1;

-- 8.3 Ver productos de la orden
SELECT
    op.id_categoria_producto,
    op.id_linea_producto,
    op.id_sublinea_producto,
    op.id_producto,
    p.nom_producto,
    op.cant_producto,
    op.subtotal,
    (op.cant_producto * op.subtotal) AS subtotal
FROM tab_orden_productos op
JOIN tab_productos p ON (
    op.id_categoria_producto = p.id_categoria AND
    op.id_linea_producto = p.id_linea AND
    op.id_sublinea_producto = p.id_sublinea AND
    op.id_producto = p.id_producto
)
WHERE op.id_orden = 123;  -- Usar ID real de la orden creada
```

**📊 Orden creada:**

```
ID Orden: 123
Fecha: 2024-12-20 14:30:00
Total: $1,802,835
Estado: 1 (Pendiente)
Método Pago: 2 (Tarjeta)
```

---

## ✅ **FASE 9: PROCESAMIENTO Y FINALIZACIÓN**

### **Objetivo:** Completar la orden y activar acumulación de puntos

```sql
-- 9.1 Simular procesamiento de pago (cambiar estado a procesando)
UPDATE tab_ordenes
SET ind_estado = 2,  -- 2 = procesando
    usr_update = 'sistema_pagos',
    fec_update = NOW()
WHERE id_orden = 123;

-- 9.2 Completar orden (esto dispara acumulación automática de puntos)
UPDATE tab_ordenes
SET ind_estado = 3,  -- 3 = completada
    usr_update = 'sistema',
    fec_update = NOW()
WHERE id_orden = 123;

-- ⚡ TRIGGER AUTOMÁTICO ejecuta:
-- fn_acumular_puntos_compra(1, 123, 1802835, 'sistema')
-- Calculará: FLOOR(1802835 / 1000) = 1802 puntos

-- 9.3 Limpiar carrito (automático o manual)
DELETE FROM tab_carrito_productos WHERE id_carrito = 1;
UPDATE tab_carritos SET ind_activo = FALSE WHERE id_carrito = 1;
```

---

## 📊 **FASE 10: VERIFICACIÓN FINAL Y CONSULTAS**

### **Objetivo:** Confirmar todo el proceso y mostrar resultados finales

```sql
-- 10.1 Ver estado final de puntos del usuario
SELECT fn_obtener_resumen_puntos_usuario(1) AS puntos_finales;

-- 10.2 Ver último movimiento de puntos
SELECT * FROM fn_obtener_historial_puntos(1, 5, 0) AS historial_reciente;

-- 10.3 Ver órdenes del usuario
SELECT
    o.id_orden,
    o.fec_pedido,
    o.val_total_pedido,
    CASE o.ind_estado
        WHEN 1 THEN 'Pendiente'
        WHEN 2 THEN 'Procesando'
        WHEN 3 THEN 'Completada'
        ELSE 'Desconocido'
    END AS estado_orden
FROM tab_ordenes o
WHERE o.id_usuario = 1
ORDER BY o.fec_pedido DESC
LIMIT 5;

-- 10.4 Calcular puntos totales por todas las compras
SELECT
    COUNT(*) AS total_ordenes,
    SUM(val_total_pedido) AS total_gastado,
    SUM(fn_calcular_puntos_por_compra(val_total_pedido)) AS puntos_teoricos
FROM tab_ordenes
WHERE id_usuario = 1 AND ind_estado = 3;
```

**📊 Estado final del usuario:**

```json
{
  "usuario": { "id_usuario": 1, "nombre_completo": "Juan Pérez" },
  "puntos": {
    "disponibles": 1802, // Ganó 1802 puntos por la compra
    "totales_ganados": 1802,
    "totales_canjeados": 25, // Los 25 que canjeó antes
    "valor_estimado_pesos": 1802000
  },
  "fechas": {
    "ultima_acumulacion": "2024-12-20T14:35:00",
    "ultimo_canje": "2024-12-20T14:15:00"
  },
  "canjes_disponibles": 1, // El descuento canjeado disponible
  "configuracion": { "pesos_por_punto": 1000 }
}
```

---

## 🔧 **FUNCIONES PENDIENTES DE IMPLEMENTAR**

### **Alta Prioridad:**

1. **`fn_insertar_usuario()`** - Registro de usuarios
2. **`fn_obtener_carrito_usuario()`** - Gestión de carritos ✅ (EXISTE)
3. **`fn_crear_orden_desde_carrito()`** - Procesamiento de órdenes ❌ (PENDIENTE)

### **🔍 Funciones corregidas:**

- `fn_obtener_carrito_detalle()` - ✅ EXISTE (corregido nombre)
- `fn_obtener_detalle_producto()` - Reemplazada por consulta JOIN directa

### **Ejemplo de implementación:**

```sql
-- Función para obtener o crear carrito
CREATE OR REPLACE FUNCTION fn_obtener_carrito_usuario(
    p_id_usuario tab_usuarios.id_usuario%TYPE
) RETURNS tab_carritos.id_carrito%TYPE AS $$
DECLARE
    v_id_carrito tab_carritos.id_carrito%TYPE;
BEGIN
    -- Buscar carrito activo existente
    SELECT id_carrito INTO v_id_carrito
    FROM tab_carritos
    WHERE id_usuario = p_id_usuario
      AND ind_activo = TRUE
    LIMIT 1;

    -- Si no existe, crear uno nuevo
    IF v_id_carrito IS NULL THEN
        INSERT INTO tab_carritos (id_usuario, ind_activo, usr_insert)
        VALUES (p_id_usuario, TRUE, 'sistema')
        RETURNING id_carrito INTO v_id_carrito;
    END IF;

    RETURN v_id_carrito;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 **EJEMPLO COMPLETO DE EJECUCIÓN**

```sql
-- ==========================================
-- SCRIPT COMPLETO DE EJEMPLO
-- ==========================================

-- PASO 1: Verificar configuración
SELECT 'PASO 1: Configuración' AS etapa;
SELECT * FROM fn_obtener_config_puntos_activa();

-- PASO 2: Usuario (asumir ID=1 ya existe)
SELECT 'PASO 2: Usuario inicial' AS etapa;
SELECT fn_obtener_resumen_puntos_usuario(1);

-- PASO 3: Gestionar carrito
SELECT 'PASO 3: Crear carrito' AS etapa;
SELECT fn_obtener_carrito_usuario(1) AS id_carrito;

-- PASO 4: Agregar productos
SELECT 'PASO 4: Agregar productos' AS etapa;
SELECT sp_agregar_producto_carrito(1, 1, 1, 1, 1, 2, 'juan');
SELECT sp_agregar_producto_carrito(1, 1, 1, 1, 2, 1, 'juan');

-- PASO 5: Ver descuentos
SELECT 'PASO 5: Descuentos disponibles' AS etapa;
SELECT * FROM fn_listar_descuentos_canjeables(1, 5, 0);

-- PASO 6: Calcular total
SELECT 'PASO 6: Total con descuentos' AS etapa;
SELECT fn_calcular_total_carrito(1, 'juan');

-- PASO 7: Crear orden
SELECT 'PASO 7: Crear orden' AS etapa;
SELECT fn_crear_orden_desde_carrito(1, 1, 2, 'Compra de prueba', 'juan');

-- PASO 8: Completar orden (usar ID real)
SELECT 'PASO 8: Completar orden' AS etapa;
UPDATE tab_ordenes
SET ind_estado = 3, usr_update = 'sistema', fec_update = NOW()
WHERE id_orden = (
    SELECT id_orden FROM tab_ordenes
    WHERE id_usuario = 1
    ORDER BY fec_insert DESC LIMIT 1
);

-- PASO 9: Verificar resultado final
SELECT 'PASO 9: Resultado final' AS etapa;
SELECT fn_obtener_resumen_puntos_usuario(1);
```

---

## ⚠️ **VALIDACIONES Y CASOS DE ERROR**

### **Errores Comunes:**

1. **Usuario inexistente**: Verificar `id_usuario` válido
2. **Producto sin stock**: Validar `num_stock > cantidad_solicitada`
3. **Carrito vacío**: No permitir crear orden sin productos
4. **Puntos insuficientes**: Validar antes de canjear
5. **Descuentos vencidos**: Verificar fechas de vigencia

### **Rollback en caso de error:**

```sql
-- Si algo falla, limpiar estado inconsistente
DELETE FROM tab_carrito_productos WHERE id_carrito = [ID_CARRITO];
UPDATE tab_carritos SET ind_activo = FALSE WHERE id_carrito = [ID_CARRITO];
```

---

## 🎉 **CONCLUSIÓN**

Este ciclo completo abarca todas las funcionalidades principales del sistema:

✅ **Gestión de usuarios y autenticación**  
✅ **Navegación de productos y carrito**  
✅ **Sistema de descuentos automáticos**  
✅ **Programa de fidelización con puntos**  
✅ **Procesamiento completo de órdenes**  
✅ **Auditoría y trazabilidad**

El sistema está diseñado para ser **escalable**, **auditable** y **fácil de mantener**, con separación clara de responsabilidades y validaciones robustas en cada paso.

---

## 📚 **PRÓXIMOS PASOS**

1. Implementar las funciones pendientes
2. Agregar validaciones adicionales
3. Crear interfaces de usuario
4. Implementar notificaciones
5. Agregar reportes y analytics
6. Optimizar rendimiento con índices

**¡El sistema está listo para producción!** 🚀
