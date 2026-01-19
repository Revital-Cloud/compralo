# 📁 Estructura de Funciones CRUD - Synkro SaaS

## ✅ Resumen

Se ha creado la estructura completa de funciones CRUD para todas las tablas principales del sistema SaaS, siguiendo el mismo patrón que `code/apps/ecommerce/db`.

## 📂 Estructura de Carpetas

```
db/
├── Functions/
│   ├── tab_planes/
│   │   ├── fun_insert_plan.sql
│   │   ├── fun_update_plan.sql
│   │   └── fun_delete_plan.sql
│   ├── tab_clientes/
│   │   ├── fun_insert_cliente.sql
│   │   ├── fun_update_cliente.sql
│   │   └── fun_delete_cliente.sql
│   ├── tab_instancias/
│   │   ├── fun_insert_instancia.sql
│   │   ├── fun_update_instancia.sql
│   │   └── fun_delete_instancia.sql
│   ├── tab_suscripciones/
│   │   ├── fun_insert_suscripcion.sql
│   │   ├── fun_update_suscripcion.sql
│   │   └── fun_delete_suscripcion.sql
│   ├── tab_facturacion/
│   │   ├── fun_insert_factura.sql
│   │   ├── fun_update_factura.sql
│   │   └── fun_delete_factura.sql
│   ├── tab_deployments/
│   │   ├── fun_insert_deployment.sql
│   │   ├── fun_update_deployment.sql
│   │   └── fun_delete_deployment.sql
│   ├── tab_dominios/
│   │   ├── fun_insert_dominio.sql
│   │   ├── fun_update_dominio.sql
│   │   └── fun_delete_dominio.sql
│   ├── tab_uso_recursos/
│   │   ├── fun_insert_uso_recurso.sql
│   │   └── fun_delete_uso_recurso.sql
│   ├── tab_historial_planes/
│   │   ├── fun_insert_historial_plan.sql
│   │   └── fun_delete_historial_plan.sql
│   └── README.md
├── triggers/
│   └── audit.sql
└── db_synkrosaas.sql
```

## 📊 Estadísticas

- **Total de tablas con funciones:** 9
- **Total de funciones creadas:** 25
- **Triggers de auditoría:** 10 (una por tabla principal)

## 🔧 Características Implementadas

### Funciones CRUD

1. **Insert** - Todas las funciones de inserción incluyen:
   - ✅ Validación de campos obligatorios
   - ✅ Validación de integridad referencial (FKs)
   - ✅ Validación de unicidad donde aplica
   - ✅ Retorno de JSON con `success` y `message`
   - ✅ Manejo de excepciones

2. **Update** - Todas las funciones de actualización incluyen:
   - ✅ Validación de existencia del registro
   - ✅ Actualización solo de campos proporcionados (COALESCE)
   - ✅ Validación de datos actualizados
   - ✅ Retorno de JSON con resultado

3. **Delete** - Todas las funciones de eliminación incluyen:
   - ✅ Validación de existencia del registro
   - ✅ Validación de dependencias (no eliminar si hay registros relacionados activos)
   - ✅ Soft delete automático (trigger guarda en `tab_reg_del`)
   - ✅ Retorno de JSON con resultado

### Triggers de Auditoría

- ✅ Función genérica `fun_audit_tablas()` que:
  - Establece `fec_insert` en INSERT
  - Establece `fec_update` en UPDATE
  - Guarda registro en `tab_reg_del` en DELETE (soft delete)

- ✅ Triggers creados para todas las tablas principales:
  - `tab_planes`
  - `tab_clientes`
  - `tab_instancias`
  - `tab_suscripciones`
  - `tab_facturacion`
  - `tab_deployments`
  - `tab_dominios`
  - `tab_metricas_instancias`
  - `tab_uso_recursos`
  - `tab_historial_planes`

## 📝 Notas Importantes

### Tablas sin funciones CRUD

- **tab_metricas_instancias**: Se inserta automáticamente por el sistema de monitoreo
- **tab_auditoria**: Solo lectura, se llena automáticamente por triggers
- **tab_reg_del**: Solo escritura por triggers de auditoría

### Validaciones Especiales

- **tab_planes**: No se puede eliminar si tiene suscripciones activas
- **tab_clientes**: No se puede eliminar si tiene instancias o suscripciones activas
- **tab_instancias**: No se puede eliminar si tiene suscripciones activas
- **tab_suscripciones**: No se puede eliminar si tiene facturas pendientes
- **tab_facturacion**: Validación de totales positivos y fechas lógicas

## 🚀 Uso

### Ejecutar todas las funciones

```bash
# Desde la carpeta db/
psql -U usuario -d synkro_saas -f triggers/audit.sql

# Luego ejecutar cada función individualmente o crear un script maestro
for dir in Functions/*/; do
    for file in "$dir"*.sql; do
        psql -U usuario -d synkro_saas -f "$file"
    done
done
```

### Ejemplo de uso desde aplicación

```sql
-- Insertar un plan
SELECT fun_insert_plan(
    'Starter',
    'Plan básico para pequeñas empresas',
    29.99,
    299.90,
    'USD',
    100,
    3,
    10,
    '{"analytics": false}'::jsonb,
    'activo',
    'admin@synkro.com'
);

-- Actualizar un cliente
SELECT fun_update_cliente(
    '900123456-7',
    NULL, -- tipo_identificacion (no cambiar)
    'Nueva Empresa S.A.',
    NULL, -- email_contacto (no cambiar)
    NULL, -- otros campos...
    'activo',
    NULL,
    NULL,
    'admin@synkro.com'
);

-- Eliminar (soft delete)
SELECT fun_delete_plan(1);
```

## ✅ Estado

**Todas las funciones CRUD y triggers de auditoría están implementados y listos para usar.**

---

**Última actualización:** Enero 2026
