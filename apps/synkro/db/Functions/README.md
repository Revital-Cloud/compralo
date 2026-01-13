# Funciones CRUD - Synkro SaaS Database

## Estructura

Cada tabla tiene su propia carpeta con funciones de:
- `fun_insert_[tabla].sql` - Insertar registros
- `fun_update_[tabla].sql` - Actualizar registros
- `fun_delete_[tabla].sql` - Eliminar registros (soft delete)

## Tablas con funciones implementadas

✅ **tab_planes** - Planes de suscripción
✅ **tab_clientes** - Clientes/empresas
✅ **tab_instancias** - Instancias de e-commerce
✅ **tab_suscripciones** - Suscripciones activas
✅ **tab_facturacion** - Facturas y pagos
✅ **tab_deployments** - Historial de deployments
✅ **tab_dominios** - Dominios asociados
✅ **tab_uso_recursos** - Tracking de uso de recursos
✅ **tab_historial_planes** - Historial de cambios de plan

## Tablas sin funciones CRUD

- **tab_metricas_instancias** - Se inserta automáticamente por el sistema de monitoreo
- **tab_auditoria** - Solo lectura, se llena automáticamente por triggers
- **tab_reg_del** - Solo escritura por triggers de auditoría

## Características

- ✅ Todas las funciones retornan JSON con `success` y `message`
- ✅ Los DELETE son soft deletes (el trigger guarda en `tab_reg_del`)
- ✅ Todas las funciones validan datos antes de operar
- ✅ Los triggers de auditoría se ejecutan automáticamente
- ✅ Validación de integridad referencial (FKs)
- ✅ Validación de unicidad donde aplica
- ✅ Manejo de excepciones con mensajes claros

## Uso

```sql
-- Ejemplo: Insertar un plan
SELECT fun_insert_plan(
    'Starter',                    -- nom_plan
    'Plan básico',                -- desc_plan
    29.99,                        -- precio_mensual
    299.90,                       -- precio_anual
    'USD',                        -- moneda
    100,                          -- max_productos
    3,                            -- max_usuarios
    10,                           -- max_almacenamiento_gb
    '{"analytics": false}'::jsonb, -- features_json
    'activo',                     -- estado_plan
    'admin@synkro.com'            -- usr_insert
);

-- Ejemplo: Actualizar un cliente
SELECT fun_update_cliente(
    '900123456-7',                -- identificacion_fiscal
    NULL,                         -- tipo_identificacion (no cambiar)
    'Nueva Empresa S.A.',         -- nom_empresa
    NULL,                         -- email_contacto (no cambiar)
    NULL,                         -- otros campos...
    'activo',                     -- estado_cliente
    NULL,                         -- fecha_ultimo_acceso
    NULL,                         -- notas_internas
    'admin@synkro.com'            -- usr_update
);

-- Ejemplo: Eliminar (soft delete)
SELECT fun_delete_plan(1);
```

## Triggers de Auditoría

Los triggers de auditoría están en `../triggers/audit.sql` y se ejecutan automáticamente para:
- Establecer `fec_insert` en INSERT
- Establecer `fec_update` en UPDATE
- Guardar registro en `tab_reg_del` en DELETE (soft delete)
