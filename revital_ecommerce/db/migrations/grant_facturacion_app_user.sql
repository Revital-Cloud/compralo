-- Migración: permisos del usuario de la app sobre las tablas de IVA/facturación
-- Fecha: 2026-06-19
-- Descripción: Las tablas de add_iva_facturacion.sql y add_facturacion_electronica.sql
--              las crea el owner (synkro_admin); el rol de la app necesita DML.
--              Ejecutar como synkro_admin DESPUÉS de las dos migraciones anteriores.

GRANT SELECT, INSERT, UPDATE, DELETE ON
    tab_uvt,
    tab_tarifas_iva,
    tab_resoluciones_dian,
    tab_facturas,
    tab_factura_lineas,
    tab_notas_credito
TO revital_ecommerce_user;
