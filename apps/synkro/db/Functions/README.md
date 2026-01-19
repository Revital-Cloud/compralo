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
✅ **tab_facturacion_cabecera** - Cabecera de facturas
✅ **tab_facturacion_detalle** - Detalle de líneas de factura
✅ **tab_deployments** - Historial de deployments
✅ **tab_dominios** - Dominios asociados
✅ **tab_uso_recursos** - Tracking de uso de recursos
✅ **tab_historial_planes** - Historial de cambios de plan
✅ **tab_usuarios_synkro** - Usuarios administradores de Synkro

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

-- Ejemplo: Crear factura (cabecera + detalle)
-- 1. Crear cabecera
SELECT fun_insert_factura_cabecera(
    1,                            -- id_suscripcion
    '900123456-7',                -- identificacion_fiscal_cliente
    NULL,                         -- num_factura (se genera automáticamente)
    'USD',                        -- moneda
    'pendiente',                  -- estado_pago
    NULL,                         -- metodo_pago
    CURRENT_TIMESTAMP,            -- fecha_emision
    CURRENT_TIMESTAMP + INTERVAL '30 days', -- fecha_vencimiento
    DATE_TRUNC('month', CURRENT_DATE), -- periodo_facturado_desde
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day', -- periodo_facturado_hasta
    NULL,                         -- referencia_pago
    NULL,                         -- notas
    'admin@synkro.com'           -- usr_insert
);
-- Retorna: {"success": true, "id_factura": 1, "num_factura": "FAC-2025-12-00001"}

-- 2. Agregar línea de detalle
SELECT fun_insert_factura_detalle(
    1,                            -- id_factura (del resultado anterior)
    NULL,                         -- num_linea (se genera automáticamente)
    'Suscripción Plan Business - Diciembre 2025', -- concepto
    1,                            -- cantidad
    79.99,                        -- precio_unitario
    0,                            -- descuento_linea
    0,                            -- impuesto_linea
    2,                            -- id_plan
    1,                            -- id_instancia
    NULL,                         -- metadata_json
    'admin@synkro.com'           -- usr_insert
);
-- Los totales de la cabecera se actualizan automáticamente

-- Ejemplo: Actualizar estado de pago de factura
SELECT fun_update_factura_cabecera(
    1,                            -- id_factura
    'pagado',                     -- estado_pago
    'tarjeta',                    -- metodo_pago
    NULL,                         -- fecha_vencimiento (no cambiar)
    CURRENT_TIMESTAMP,            -- fecha_pago
    'WMPI-TXN-12345',            -- referencia_pago
    NULL,                         -- notas
    'admin@synkro.com'           -- usr_update
);

-- Ejemplo: Crear usuario administrador de Synkro
SELECT fun_insert_usuario_synkro(
    'Juan',                       -- nom_usuario
    'Pérez',                      -- ape_usuario
    'juan.perez@synkro.com',     -- email_usuario
    '$argon2id$v=19$m=65536,t=3,p=4$...', -- password_usuario (hash Argon2)
    'admin_synkro',              -- rol_synkro (admin_synkro, soporte, ventas)
    true,                         -- ind_activo
    'admin@synkro.com'           -- usr_insert
);

-- Ejemplo: Actualizar usuario (cambiar contraseña)
SELECT fun_update_usuario_synkro(
    1,                            -- id_usuario
    NULL,                         -- nom_usuario (no cambiar)
    NULL,                         -- ape_usuario (no cambiar)
    NULL,                         -- email_usuario (no cambiar)
    '$argon2id$v=19$m=65536,t=3,p=4$...', -- password_usuario (nuevo hash)
    NULL,                         -- rol_synkro (no cambiar)
    NULL,                         -- ind_activo (no cambiar)
    'admin@synkro.com'           -- usr_update
);

-- Ejemplo: Desactivar usuario (en lugar de eliminar)
SELECT fun_update_usuario_synkro(
    1,                            -- id_usuario
    NULL,                         -- nom_usuario (no cambiar)
    NULL,                         -- ape_usuario (no cambiar)
    NULL,                         -- email_usuario (no cambiar)
    NULL,                         -- password_usuario (no cambiar)
    NULL,                         -- rol_synkro (no cambiar)
    false,                        -- ind_activo (desactivar)
    'admin@synkro.com'           -- usr_update
);
```

## Triggers de Auditoría

Los triggers de auditoría están en `../triggers/audit.sql` y se ejecutan automáticamente para:
- Establecer `fec_insert` en INSERT
- Establecer `fec_update` en UPDATE
- Guardar registro en `tab_reg_del` en DELETE (soft delete)
