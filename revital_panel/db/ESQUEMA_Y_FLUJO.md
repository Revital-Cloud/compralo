# 📊 Esquema y Flujo de Base de Datos - Revital SaaS

## 🎯 Objetivo

Este documento describe la estructura completa de la base de datos del panel de control SaaS de Revital, incluyendo relaciones, flujos de negocio y validaciones de consistencia.

---

## 📐 Diagrama de Entidad-Relación (ER)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUJO PRINCIPAL DEL NEGOCIO                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ tab_planes   │ ◄─── Catálogo de planes disponibles
│              │      (Starter, Business, Enterprise)
│ id_plan (PK) │
│ nom_plan     │
│ precio_*     │
│ max_*        │
└──────────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────────┐
│ tab_clientes         │ ◄─── Empresas que contratan el servicio
│                      │
│ identificacion_     │
│   fiscal (PK)       │
│ tipo_identificacion │
│ nom_empresa         │
│ estado_cliente      │
└──────────────────────┘
       │
       │ 1:N
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌──────────────────────┐      ┌──────────────────────┐
│ tab_suscripciones    │      │ tab_instancias       │
│                      │      │                      │
│ id_suscripcion (PK)  │      │ id_instancia (PK)    │
│ id_plan (FK)         │      │ identificacion_     │
│ identificacion_      │      │   fiscal_cliente(FK) │
│   fiscal_cliente(FK) │      │ nom_instancia        │
│ id_instancia (FK)     │◄─────┤ slug_instancia       │
│ estado_suscripcion   │  N:1  │ estado_instancia    │
│ tipo_facturacion     │      │ db_nombre            │
│ precio_actual        │      │ backend_url          │
│ metodo_pago          │      │ frontend_url         │
└──────────────────────┘      └──────────────────────┘
       │                                  │
       │ 1:N                              │ 1:N
       │                                  │
       ▼                                  ├──────────────────┬──────────────────┐
┌──────────────────────┐                 │                  │                  │
│ tab_facturacion      │                 ▼                  ▼                  ▼
│                      │      ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│ id_factura (PK)      │      │ tab_deployments  │ │tab_dominios  │ │tab_metricas_ │
│ id_suscripcion (FK)  │      │                  │ │              │ │  instancias  │
│ estado_pago          │      │ id_deployment(PK)│ │id_dominio(PK)│ │id_metrica(PK)│
│ moneda               │      │ id_instancia(FK) │ │id_instancia  │ │id_instancia  │
│ metodo_pago          │      │ estado_deploy    │ │  (FK)        │ │  (FK)        │
│ referencia_pago      │      │ tipo_deploy      │ │tipo_dominio  │ │tipo_metrica   │
└──────────────────────┘      │ ambiente         │ │estado_dominio│ │valor_metrica  │
                               └──────────────────┘ └──────────────┘ └──────────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────────┐
│ tab_historial_planes  │ ◄─── Historial de cambios de plan
│                      │
│ id_historial (PK)    │
│ id_suscripcion (FK)  │
│ id_plan_anterior (FK)│
│ id_plan_nuevo (FK)   │
│ tipo_cambio          │
└──────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        TABLAS DE SOPORTE                                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐      ┌──────────────────────┐
│ tab_uso_recursos     │      │ tab_auditoria        │
│                      │      │                      │
│ id_uso_recurso (PK) │      │ id_auditoria (PK)    │
│ id_instancia (FK)    │      │ identificacion_      │
│ id_suscripcion (FK)  │      │   fiscal_cliente(FK) │
│ productos_actuales   │      │ id_instancia (FK)    │
│ usuarios_actuales    │      │ tipo_accion          │
│ almacenamiento_*      │      │ entidad_afectada     │
│ porcentaje_uso_*     │      │ datos_anteriores     │
│ ind_alerta_*         │      │ datos_nuevos         │
└──────────────────────┘      └──────────────────────┘

┌──────────────────────┐
│ tab_reg_del          │ ◄─── Soft deletes
│                      │
│ id_del (PK)          │
│ tab_name             │
│ atributos (JSONB)    │
└──────────────────────┘
```

---

## 🔄 Flujo del Negocio

### 1. **Flujo de Onboarding (Nuevo Cliente)**

```
1. Cliente se registra
   └─► INSERT en tab_clientes
       estado_cliente = 'prospecto'

2. Cliente selecciona un plan
   └─► INSERT en tab_suscripciones
       id_plan = [plan seleccionado]
       estado_suscripcion = 'trial' o 'activa'
       id_instancia = NULL (aún no creada)

3. Sistema crea la instancia
   └─► INSERT en tab_instancias
       estado_instancia = 'creando'
       db_nombre = [nombre único]
       backend_url = [URL generada]
       frontend_url = [URL generada]

4. Actualizar suscripción con instancia
   └─► UPDATE tab_suscripciones
       id_instancia = [id creado]

5. Deploy inicial
   └─► INSERT en tab_deployments
       estado_deploy = 'iniciado' → 'completado'
       ambiente = 'produccion'

6. Configurar dominio
   └─► INSERT en tab_dominios
       estado_dominio = 'pendiente' → 'activo'

7. Activar cliente e instancia
   └─► UPDATE tab_clientes
       estado_cliente = 'activo'
       fecha_activacion = NOW()
   └─► UPDATE tab_instancias
       estado_instancia = 'activa'
       fecha_activacion = NOW()
```

### 2. **Flujo de Facturación**

```
1. Generar factura periódica
   └─► INSERT en tab_facturacion
       id_suscripcion = [suscripción activa]
       estado_pago = 'pendiente'
       fecha_vencimiento = [fecha calculada]

2. Cliente realiza pago
   └─► UPDATE tab_facturacion
       estado_pago = 'pagado'
       fecha_pago = NOW()
       referencia_pago = [referencia externa]

3. Si pago falla
   └─► UPDATE tab_facturacion
       estado_pago = 'fallido'
   └─► Posible suspensión de suscripción
       UPDATE tab_suscripciones
       estado_suscripcion = 'suspendida'
```

### 3. **Flujo de Cambio de Plan**

```
1. Cliente solicita cambio
   └─► INSERT en tab_historial_planes
       id_suscripcion = [suscripción actual]
       id_plan_anterior = [plan actual]
       id_plan_nuevo = [plan nuevo]
       tipo_cambio = 'upgrade' o 'downgrade'
       fecha_efectiva = [fecha futura]

2. Actualizar suscripción
   └─► UPDATE tab_suscripciones
       id_plan = [nuevo plan]
       precio_actual = [precio nuevo plan]

3. Verificar límites de recursos
   └─► SELECT en tab_uso_recursos
       Comparar con nuevos límites del plan
```

### 4. **Flujo de Monitoreo y Alertas**

```
1. Sistema recolecta métricas
   └─► INSERT en tab_metricas_instancias
       tipo_metrica = 'cpu', 'memory', 'storage', etc.
       valor_metrica = [valor actual]

2. Sistema calcula uso de recursos
   └─► INSERT en tab_uso_recursos
       productos_actuales = [contar de DB instancia]
       usuarios_actuales = [contar de DB instancia]
       almacenamiento_actual_gb = [calcular]
       porcentaje_uso_* = [calcular automáticamente]
       ind_alerta_* = [TRUE si >= 80%]

3. Si hay alertas
   └─► Notificar al cliente
       (fuera de la DB, vía email/notificación)
```

---

## ✅ Validación de Relaciones y Consistencia

### **Relaciones Correctas ✅**

1. **tab_clientes → tab_instancias** (1:N)
   - ✅ Correcto: Un cliente puede tener múltiples instancias
   - ✅ FK: `identificacion_fiscal_cliente` referencia `identificacion_fiscal`

2. **tab_clientes → tab_suscripciones** (1:N)
   - ✅ Correcto: Un cliente puede tener múltiples suscripciones (historial)
   - ✅ FK: `identificacion_fiscal_cliente` referencia `identificacion_fiscal`

3. **tab_planes → tab_suscripciones** (1:N)
   - ✅ Correcto: Un plan puede tener múltiples suscripciones
   - ✅ FK: `id_plan` referencia `id_plan`

4. **tab_instancias → tab_suscripciones** (N:1)
   - ✅ Correcto: Una instancia puede tener una suscripción activa
   - ⚠️ **OBSERVACIÓN**: `id_instancia` en `tab_suscripciones` es NULLABLE
     - Esto permite suscripciones antes de crear la instancia (correcto para onboarding)
     - Pero una instancia activa debería tener una suscripción asociada

5. **tab_suscripciones → tab_facturacion** (1:N)
   - ✅ Correcto: Una suscripción genera múltiples facturas
   - ✅ FK: `id_suscripcion` referencia `id_suscripcion`

6. **tab_instancias → tab_deployments** (1:N)
   - ✅ Correcto: Una instancia tiene múltiples deployments
   - ✅ FK: `id_instancia` referencia `id_instancia`

7. **tab_instancias → tab_dominios** (1:N)
   - ✅ Correcto: Una instancia puede tener múltiples dominios
   - ✅ FK: `id_instancia` referencia `id_instancia`

8. **tab_instancias → tab_metricas_instancias** (1:N)
   - ✅ Correcto: Una instancia genera múltiples métricas
   - ✅ FK: `id_instancia` referencia `id_instancia`

9. **tab_instancias → tab_uso_recursos** (1:N)
   - ✅ Correcto: Una instancia tiene múltiples mediciones de recursos
   - ✅ FK: `id_instancia` referencia `id_instancia`

10. **tab_suscripciones → tab_uso_recursos** (1:N)
    - ✅ Correcto: Una suscripción tiene múltiples mediciones
    - ✅ FK: `id_suscripcion` referencia `id_suscripcion`

11. **tab_suscripciones → tab_historial_planes** (1:N)
    - ✅ Correcto: Una suscripción tiene múltiples cambios de plan
    - ✅ FK: `id_suscripcion` referencia `id_suscripcion`

12. **tab_planes → tab_historial_planes** (1:N para plan anterior y nuevo)
    - ✅ Correcto: Un plan puede aparecer en múltiples historiales
    - ✅ FK: `id_plan_anterior` y `id_plan_nuevo` referencian `id_plan`

### **Relaciones de Auditoría ✅**

- **tab_clientes → tab_auditoria** (1:N)
  - ✅ FK: `identificacion_fiscal_cliente` referencia `identificacion_fiscal`
  - ✅ ON DELETE SET NULL (correcto para mantener auditoría)

- **tab_instancias → tab_auditoria** (1:N)
  - ✅ FK: `id_instancia` referencia `id_instancia`
  - ✅ ON DELETE SET NULL (correcto para mantener auditoría)

---

## ⚠️ Observaciones y Mejoras Sugeridas

### 1. **Consistencia: Instancia sin Suscripción Activa**

**Problema potencial:**
- Una instancia puede existir sin una suscripción activa asociada
- `tab_suscripciones.id_instancia` es NULLABLE, pero `tab_instancias` no tiene FK inversa

**Sugerencia:**
```sql
-- Agregar constraint para asegurar que instancias activas tengan suscripción
ALTER TABLE tab_instancias
ADD CONSTRAINT chk_instancia_activa_suscripcion CHECK (
    estado_instancia != 'activa' OR EXISTS (
        SELECT 1 FROM tab_suscripciones s
        WHERE s.id_instancia = tab_instancias.id_instancia
        AND s.estado_suscripcion = 'activa'
    )
);
```

### 2. **Índice Compuesto Faltante**

**Sugerencia:**
```sql
-- Para consultas frecuentes de suscripciones activas por cliente
CREATE INDEX idx_suscripciones_cliente_estado 
ON tab_suscripciones(identificacion_fiscal_cliente, estado_suscripcion)
WHERE estado_suscripcion = 'activa';
```

### 3. **Validación de Estados**

**Problema potencial:**
- No hay validación explícita de transiciones de estado

**Sugerencia:**
- Implementar triggers o validaciones en la aplicación para:
  - `estado_cliente`: 'prospecto' → 'trial' → 'activo' → 'suspendido' → 'cancelado'
  - `estado_instancia`: 'creando' → 'activa' → 'suspendida' → 'eliminada'
  - `estado_suscripcion`: 'trial' → 'activa' → 'suspendida' → 'cancelada'

### 4. **Particionamiento de tab_metricas_instancias**

**Recomendación:**
- Implementar particionamiento mensual para mejorar performance
- Ver documento de particionamiento separado

### 5. **Relación entre tab_facturacion y tab_clientes**

**Observación:**
- `tab_facturacion` tiene FK a `identificacion_fiscal_cliente`
- Pero también tiene FK a `id_suscripcion` que ya tiene la relación con cliente
- Esto es redundante pero útil para consultas directas (correcto)

### 6. **Moneda en tab_planes vs tab_facturacion**

**Observación:**
- `tab_planes` tiene `moneda`
- `tab_facturacion` también tiene `moneda`
- Esto permite facturar en moneda diferente al plan (útil para conversión)

---

## 📋 Resumen de Entidades Principales

| Entidad | Propósito | Relaciones Clave |
|---------|-----------|------------------|
| `tab_planes` | Catálogo de planes | → `tab_suscripciones` (1:N) |
| `tab_clientes` | Empresas clientes | → `tab_instancias` (1:N), → `tab_suscripciones` (1:N) |
| `tab_instancias` | Instancias de e-commerce | ← `tab_clientes` (N:1), → `tab_deployments` (1:N), → `tab_dominios` (1:N), → `tab_metricas_instancias` (1:N) |
| `tab_suscripciones` | Suscripciones activas | ← `tab_clientes` (N:1), ← `tab_planes` (N:1), → `tab_instancias` (N:1), → `tab_facturacion` (1:N) |
| `tab_facturacion` | Facturas y pagos | ← `tab_suscripciones` (N:1), ← `tab_clientes` (N:1) |
| `tab_deployments` | Historial de deployments | ← `tab_instancias` (N:1) |
| `tab_dominios` | Dominios asociados | ← `tab_instancias` (N:1) |
| `tab_metricas_instancias` | Métricas de monitoreo | ← `tab_instancias` (N:1) |
| `tab_uso_recursos` | Tracking de recursos | ← `tab_instancias` (N:1), ← `tab_suscripciones` (N:1) |
| `tab_historial_planes` | Historial de cambios | ← `tab_suscripciones` (N:1), ← `tab_planes` (N:1) |
| `tab_auditoria` | Logs de auditoría | ← `tab_clientes` (N:1), ← `tab_instancias` (N:1) |
| `tab_reg_del` | Soft deletes | Sin relaciones (tabla independiente) |

---

## ✅ Conclusión

La estructura de la base de datos es **sólida y bien diseñada** para el modelo SaaS multi-instancia de Revital. Las relaciones están correctamente definidas y el flujo del negocio está bien representado.

**Puntos fuertes:**
- ✅ Separación clara de responsabilidades
- ✅ Relaciones bien definidas con FKs apropiadas
- ✅ Auditoría completa
- ✅ Tracking de recursos y métricas
- ✅ Historial de cambios de plan
- ✅ Soft deletes implementados

**Mejoras recomendadas:**
- ⚠️ Agregar validaciones de transiciones de estado
- ⚠️ Considerar particionamiento para tablas grandes
- ⚠️ Índices compuestos para consultas frecuentes
- ⚠️ Constraints adicionales para consistencia de datos

---

**Última actualización:** Noviembre 2025
