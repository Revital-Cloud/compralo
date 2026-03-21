/*
 * Migración: ampliar precio_unitario_carrito en el carrito
 *
 * Motivo: DECIMAL(7,0) solo admite valores < 10^7. Precios en COP (p. ej. 18_000_000)
 * provocaban numeric field overflow al insertar desde fun_agregar_producto_carrito.
 *
 * Alinea el tipo con tab_product_variant_combinations.price (DECIMAL(12,2)).
 *
 * Ejecutar:
 *   psql -U usuario -d nombre_bd -f db/migrations/widen_precio_unitario_carrito.sql
 */

ALTER TABLE tab_carrito_productos
  ALTER COLUMN precio_unitario_carrito TYPE DECIMAL(12, 2)
  USING precio_unitario_carrito::numeric;

COMMENT ON COLUMN tab_carrito_productos.precio_unitario_carrito IS
  'Precio unitario snapshot al agregar (misma escala que variant combinations.price; DECIMAL 12,2).';
