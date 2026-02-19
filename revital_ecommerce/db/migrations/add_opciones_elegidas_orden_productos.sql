/*
 * Migración: opciones_elegidas en carrito y orden (esquema con variant_id)
 *
 * 1. tab_carrito_productos: guarda las opciones al agregar al carrito (color, talla, etc.).
 * 2. tab_orden_productos: guarda las opciones al crear la orden (copiadas desde el carrito).
 *
 * Así en el detalle de la orden en admin se muestran las opciones elegidas por ítem.
 *
 * Ejecutar:
 *   psql -U usuario -d nombre_bd -f add_opciones_elegidas_orden_productos.sql
 *
 * Después aplicar las funciones (en este orden):
 *   psql -U usuario -d nombre_bd -f Functions/tab_carrito_productos/fun_agregar_producto_carrito.sql
 *   psql -U usuario -d nombre_bd -f Functions/tab_ordenes/fun_crear_orden_desde_carrito.sql
 * Reiniciar el backend para que guarde y copie opciones_elegidas al carrito y a la orden.
 */

-- 1. tab_carrito_productos: columna opciones_elegidas (para que el frontend la guarde al agregar al carrito)
ALTER TABLE tab_carrito_productos
  ADD COLUMN IF NOT EXISTS opciones_elegidas JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN tab_carrito_productos.opciones_elegidas IS
  'Opciones elegidas (ej. color, talla) en formato JSON. Se copia a tab_orden_productos al crear la orden.';

-- 2. tab_orden_productos: columna opciones_elegidas para historial de la orden
ALTER TABLE tab_orden_productos
  ADD COLUMN IF NOT EXISTS opciones_elegidas JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN tab_orden_productos.opciones_elegidas IS
  'Opciones elegidas por el cliente (ej. color, talla) en formato JSON. Ej: {"color": "Negro", "talla": "M"}';
